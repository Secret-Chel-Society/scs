import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const waiverId = params.id

    // Get user's team and verify they're a manager
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("team_id, role")
      .eq("user_id", session.user.id)
      .single()

    if (playerError || !player?.team_id) {
      return NextResponse.json({ error: "You must be on a team to cancel waivers" }, { status: 403 })
    }

    if (!["Owner", "GM", "AGM"].includes(player.role)) {
      return NextResponse.json({ error: "You must be a team manager to cancel waivers" }, { status: 403 })
    }

    // Get the waiver details
    const { data: waiver, error: waiverError } = await supabase
      .from("waivers")
      .select(`
        id,
        player_id,
        waiving_team_id,
        waived_at,
        claim_deadline,
        status,
        players:player_id (
          id,
          users:user_id (
            id,
            gamer_tag_id
          )
        )
      `)
      .eq("id", waiverId)
      .single()

    if (waiverError || !waiver) {
      return NextResponse.json({ error: "Waiver not found" }, { status: 404 })
    }

    // Verify this team waived the player
    if (waiver.waiving_team_id !== player.team_id) {
      return NextResponse.json({ error: "You can only cancel waivers for players your team waived" }, { status: 403 })
    }

    // Check if waiver is still active
    if (waiver.status !== "active") {
      return NextResponse.json({ error: "This waiver is no longer active" }, { status: 400 })
    }

    // Check if it's within 30 minutes of waiving
    const waiveTime = new Date(waiver.waived_at).getTime()
    const now = Date.now()
    const thirtyMinutesInMs = 30 * 60 * 1000

    if (now - waiveTime > thirtyMinutesInMs) {
      return NextResponse.json({ error: "Waivers can only be canceled within 30 minutes of waiving" }, { status: 400 })
    }

    // Check if waiver has expired
    if (new Date(waiver.claim_deadline) <= new Date()) {
      return NextResponse.json({ error: "This waiver has already expired" }, { status: 400 })
    }

    // Cancel the waiver
    const { error: updateWaiverError } = await supabase
      .from("waivers")
      .update({ status: "canceled" })
      .eq("id", waiverId)

    if (updateWaiverError) throw updateWaiverError

    // Return player to team
    const { error: updatePlayerError } = await supabase
      .from("players")
      .update({ team_id: player.team_id })
      .eq("id", waiver.player_id)

    if (updatePlayerError) throw updatePlayerError

    // Delete any existing claims on this waiver
    const { error: deleteClaimsError } = await supabase.from("waiver_claims").delete().eq("waiver_id", waiverId)

    if (deleteClaimsError) {
      console.error("Error deleting waiver claims:", deleteClaimsError)
    }

    // Notify the player that their waiver was canceled
    await supabase.from("notifications").insert({
      user_id: waiver.players.users.id,
      title: "Waiver Canceled",
      message: `Your waiver has been canceled and you have been returned to your team's roster.`,
      link: "/management",
    })

    // Notify teams that had claims that the waiver was canceled
    const { data: claims } = await supabase
      .from("waiver_claims")
      .select(`
        claiming_team_id,
        teams:claiming_team_id (
          id,
          name
        )
      `)
      .eq("waiver_id", waiverId)

    if (claims && claims.length > 0) {
      // Get managers of claiming teams
      const teamIds = claims.map((claim) => claim.claiming_team_id)
      const { data: managers } = await supabase
        .from("players")
        .select("user_id, team_id")
        .in("team_id", teamIds)
        .in("role", ["GM", "AGM", "Owner"])

      if (managers && managers.length > 0) {
        const notifications = managers.map((manager) => ({
          user_id: manager.user_id,
          title: "Waiver Canceled",
          message: `The waiver for ${waiver.players.users.gamer_tag_id} has been canceled by the waiving team.`,
          link: "/management?tab=waivers",
        }))

        await supabase.from("notifications").insert(notifications)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error canceling waiver:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
