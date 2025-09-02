import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { playerId, reason, adminOverride = true } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: "Missing required fields: playerId" }, { status: 400 })
    }

    // For admin override, skip auth checks
    if (!adminOverride) {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Verify user is an admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "Admin")
        .single()

      const isAdmin = !!adminRole

      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized: Only admins can remove players" }, { status: 403 })
      }
    }

    // Get the player's current team and user_id
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("team_id, user_id")
      .eq("id", playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Cancel and finalize all active bids for the player
    const { error: bidError } = await supabase
      .from("player_bidding")
      .update({
        status: "cancelled_manual_removal",
        processed: true,
        finalized: true,
        processed_at: new Date().toISOString(),
      })
      .eq("player_id", playerId)
      .eq("finalized", false)

    if (bidError) {
      console.error("Error cancelling bids:", bidError)
      // Don't throw an error, just log it
    }

    // Cancel any active waiver claims
    const { error: waiverClaimError } = await supabase
      .from("waivers")
      .update({
        status: "cancelled_manual_removal",
        processed_at: new Date().toISOString(),
      })
      .eq("player_id", playerId)
      .eq("status", "active")

    if (waiverClaimError) {
      console.error("Error cancelling waiver claims:", waiverClaimError)
      // Don't throw an error, just log it
    }

    // Update player's team assignment and manual removal status
    const { error: updateError } = await supabase
      .from("players")
      .update({
        team_id: null,
        status: "free_agent",
        manually_removed: true,
        manually_removed_at: new Date().toISOString(),
      })
      .eq("id", playerId)

    if (updateError) {
      console.error("Error updating player:", updateError)
      return NextResponse.json({ error: "Failed to set player as free agent" }, { status: 500 })
    }

    // Sync Discord roles for the removed player
    if (player.user_id) {
      try {
        console.log("Syncing Discord roles for removed player...")

        const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: player.user_id }),
        })

        if (roleResponse.ok) {
          const roleData = await roleResponse.json()
          console.log("Discord role sync completed:", roleData)
        } else {
          const errorText = await roleResponse.text()
          console.error("Failed to sync Discord roles:", errorText)
        }
      } catch (discordError) {
        console.error("Error syncing Discord roles:", discordError)
        // Don't fail the removal for Discord sync issues
      }
    }

    return NextResponse.json(
      { success: true, message: "Player has been set as a free agent and all bids/waivers finalized" },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error removing player from team:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
