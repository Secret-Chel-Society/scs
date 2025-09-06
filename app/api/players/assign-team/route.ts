import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { playerId, teamId, retainedSalary = 0, adminOverride = false } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: "Missing required fields: playerId" }, { status: 400 })
    }

    // Only check auth if not admin override and not assigning to Free Agent
    if (!adminOverride && teamId !== null) {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check if user has permission to assign players to this team
      const { data: userPlayer, error: userError } = await supabase
        .from("players")
        .select("team_id, role")
        .eq("user_id", session.user.id)
        .single()

      if (userError || !userPlayer) {
        return NextResponse.json({ error: "User not found on any team" }, { status: 403 })
      }

      // Verify user is a manager of the target team or an admin
      const isManager = ["GM", "AGM", "Owner"].includes(userPlayer.role) && userPlayer.team_id === teamId

      // Check if user is admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "Admin")
        .single()

      const isAdmin = !!adminRole

      if (!isManager && !isAdmin) {
        return NextResponse.json({ error: "Only team managers or admins can assign players" }, { status: 403 })
      }
    }

    // Get the player's current data
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("salary, team_id, user_id")
      .eq("id", playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Calculate the new salary after retained amount
    const newSalary = teamId ? Math.max(player.salary - retainedSalary, 750000) : player.salary

    // Determine player status
    let playerStatus = "active"
    if (teamId === null) {
      playerStatus = "free_agent"
    }

    // Update player's team assignment, salary, and status
    const { error: updateError } = await supabase
      .from("players")
      .update({
        team_id: teamId,
        salary: newSalary,
        status: playerStatus,
        manually_removed: false, // Reset manual removal flag when assigning to team
        manually_removed_at: null, // Clear manual removal timestamp
        manually_removed_by: null, // Clear manual removal user
      })
      .eq("id", playerId)

    if (updateError) {
      console.error("Error updating player:", updateError)
      return NextResponse.json({ error: "Failed to assign player to team" }, { status: 500 })
    }

    // Sync Discord roles for the player
    if (player.user_id) {
      try {
        console.log("Syncing Discord roles for assigned player...")

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
        // Don't fail the assignment for Discord sync issues
      }
    }

    // Finalize all bids for this player to prevent reprocessing
    const { error: finalizeBidsError } = await supabase
      .from("player_bidding")
      .update({
        finalized: true,
        processed: true,
        processed_at: new Date().toISOString(),
        status: teamId === null ? "cancelled_manual_removal" : "completed",
      })
      .eq("player_id", playerId)
      .eq("finalized", false)

    if (finalizeBidsError) {
      console.error("Error finalizing bids:", finalizeBidsError)
      // Don't fail the whole operation for this
    }

    // Cancel any active waivers for this player
    const { error: cancelWaiversError } = await supabase
      .from("waivers")
      .update({
        status: teamId === null ? "cancelled_manual_removal" : "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("player_id", playerId)
      .eq("status", "active")

    if (cancelWaiversError) {
      console.error("Error cancelling waivers:", cancelWaiversError)
      // Don't fail the whole operation for this
    }

    // If there's retained salary, update the original team's retained salary total
    if (retainedSalary > 0 && player.team_id && teamId !== null) {
      const { data: originalTeam, error: teamError } = await supabase
        .from("teams")
        .select("total_retained_salary")
        .eq("id", player.team_id)
        .single()

      if (!teamError && originalTeam) {
        const newRetainedTotal = (originalTeam.total_retained_salary || 0) + retainedSalary

        const { error: retainedUpdateError } = await supabase
          .from("teams")
          .update({ total_retained_salary: newRetainedTotal })
          .eq("id", player.team_id)

        if (retainedUpdateError) {
          console.error("Error updating retained salary:", retainedUpdateError)
          // Don't fail the whole operation for this
        }
      }
    }

    const message = teamId === null ? "Player set as free agent successfully" : "Player assigned to team successfully"

    return NextResponse.json({
      success: true,
      message,
      newSalary,
      retainedSalary,
      playerStatus,
    })
  } catch (error: any) {
    console.error("Error assigning player to team:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
