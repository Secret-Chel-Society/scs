import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get all teams directly without requiring seasons
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, logo_url, points, wins, goal_differential, goals_for")
      .eq("is_active", true)
      .order("name")

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    if (!teams || teams.length === 0) {
      console.log("No teams found")
      return NextResponse.json({ standings: [] })
    }

    // Create basic standings from team data
    const standings = teams.map((team, index) => ({
      id: team.id,
      name: team.name,
      logo_url: team.logo_url,
      wins: team.wins || 0,
      losses: 0,
      otl: 0,
      goals_for: team.goals_for || 0,
      goals_against: 0,
      games_played: 0,
      points: team.points || 0,
      goal_differential: team.goal_differential || 0,
      shots_per_game: 0,
      total_shots: 0,
      powerplay_goals: 0,
      powerplay_opportunities: 0,
      powerplay_percentage: 0,
      penalty_kill_goals_against: 0,
      penalty_kill_opportunities: 0,
      penalty_kill_percentage: 0,
      division: index < Math.ceil(teams.length / 2) ? "Eastern Elites" : "Western Warriors",
      conference: index < Math.ceil(teams.length / 2) ? "Eastern Elites" : "Western Warriors",
      last_10: "0-0-0",
      current_streak: "-",
      playoff_status: "active" as const,
    }))

    console.log(`Returning ${standings.length} team standings`)

    return NextResponse.json({ standings })
  } catch (error: any) {
    console.error("Error in standings API:", error)
    return NextResponse.json({ error: `Error fetching standings: ${error.message}` }, { status: 500 })
  }
}
