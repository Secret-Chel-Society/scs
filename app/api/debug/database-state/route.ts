import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Check teams
    const { data: allTeams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, is_active, conference")

    // Check active teams
    const { data: activeTeams, error: activeTeamsError } = await supabase
      .from("teams")
      .select("id, name, is_active, conference")
      .eq("is_active", true)

    // Check matches
    const { data: allMatches, error: matchesError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, status, season_name")

    // Check completed matches
    const { data: completedMatches, error: completedMatchesError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, status, season_name")
      .in("status", ["completed", "Completed", "COMPLETED"])

    // Check system settings
    const { data: currentSeason, error: seasonError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "current_season")
      .single()

    return NextResponse.json({
      teams: {
        total: allTeams?.length || 0,
        active: activeTeams?.length || 0,
        data: allTeams || [],
        error: teamsError?.message
      },
      activeTeams: {
        count: activeTeams?.length || 0,
        data: activeTeams || [],
        error: activeTeamsError?.message
      },
      matches: {
        total: allMatches?.length || 0,
        completed: completedMatches?.length || 0,
        data: allMatches || [],
        error: matchesError?.message
      },
      completedMatches: {
        count: completedMatches?.length || 0,
        data: completedMatches || [],
        error: completedMatchesError?.message
      },
      systemSettings: {
        currentSeason: currentSeason?.value || "Not found",
        error: seasonError?.message
      }
    })
  } catch (error: any) {
    console.error("Error in database state debug:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
