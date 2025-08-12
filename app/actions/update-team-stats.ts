"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

interface TeamStatsUpdate {
  wins: number
  losses: number
  otl: number
  goals_for: number
  goals_against: number
  powerplay_goals: number
  powerplay_opportunities: number
  penalty_kill_goals_against: number
  penalty_kill_opportunities: number
  manual_override: boolean
}

export async function updateTeamStats(teamId: string, stats: TeamStatsUpdate) {
  try {
    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error("No session found in server action")
      return { error: "Unauthorized - No session", success: false }
    }

    // Log the user ID for debugging
    console.log("User ID in server action:", session.user.id)

    // Check for Admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError) {
      console.error("Error checking admin role:", adminRoleError)
      return { error: "Error checking admin role", success: false }
    }

    if (!adminRoleData || adminRoleData.length === 0) {
      console.error("User is not an admin")
      return { error: "Admin access required", success: false }
    }

    // Calculate points based on wins and OTL
    const points = stats.wins * 2 + stats.otl

    // Calculate games played
    const games_played = stats.wins + stats.losses + stats.otl

    // Build the update object with basic stats that should always exist
    const updateData: any = {
      wins: stats.wins,
      losses: stats.losses,
      otl: stats.otl,
      goals_for: stats.goals_for,
      goals_against: stats.goals_against,
      powerplay_goals: stats.powerplay_goals,
      powerplay_opportunities: stats.powerplay_opportunities,
      penalty_kill_goals_against: stats.penalty_kill_goals_against,
      penalty_kill_opportunities: stats.penalty_kill_opportunities,
      manual_override: true,
    }

    // Try to check if columns exist using a simpler approach
    try {
      // First, try to get a team with all columns to see what exists
      const { data: sampleTeam, error: sampleError } = await supabase.from("teams").select("*").limit(1).single()

      if (!sampleError && sampleTeam) {
        // If games_played exists in the sample, add it to the update
        if ("games_played" in sampleTeam) {
          updateData.games_played = games_played
        }

        // If points exists in the sample, add it to the update
        if ("points" in sampleTeam) {
          updateData.points = points
        }
      }
    } catch (checkError) {
      console.error("Error checking columns:", checkError)
      // Continue with the update even if column check fails
    }

    // Log the update data
    console.log("Updating team stats for team ID:", teamId, "with data:", updateData)

    // Update the team statistics
    const { error: updateError } = await supabase.from("teams").update(updateData).eq("id", teamId)

    if (updateError) {
      console.error("Error updating team statistics:", updateError)

      // If the error is about missing columns, try a more basic update
      if (
        updateError.message.includes("column") &&
        (updateError.message.includes("games_played") || updateError.message.includes("points"))
      ) {
        // Remove potentially problematic fields
        delete updateData.games_played
        delete updateData.points

        // Try again with just the basic fields
        const { error: retryError } = await supabase.from("teams").update(updateData).eq("id", teamId)

        if (retryError) {
          return { error: retryError.message, success: false }
        }
      } else {
        return { error: updateError.message, success: false }
      }
    }

    console.log("Team stats updated successfully")

    // Revalidate the teams page to show updated data
    revalidatePath("/admin/teams")
    revalidatePath("/standings")
    revalidatePath("/teams")

    return {
      success: true,
      message: "Team statistics updated successfully",
    }
  } catch (error: any) {
    console.error("Error in updateTeamStats server action:", error)
    return {
      error: error.message || "An error occurred while updating team statistics",
      success: false,
    }
  }
}
