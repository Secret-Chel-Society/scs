import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const seasonId = url.searchParams.get("seasonId")

    let query = supabase.from("matches").select("*").or("status.eq.completed,status.eq.Completed")

    if (seasonId) {
      query = query.eq("season_id", seasonId)
    }

    const { data: matches, error: matchesError } = await query

    if (matchesError) {
      return NextResponse.json({ error: `Error fetching matches: ${matchesError.message}` }, { status: 500 })
    }

    // Get team names for each match
    const teamIds = new Set<string>()
    matches?.forEach((match) => {
      if (match.home_team_id) teamIds.add(match.home_team_id)
      if (match.away_team_id) teamIds.add(match.away_team_id)
    })

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", Array.from(teamIds))

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
    }

    // Create a map of team IDs to team names
    const teamMap = new Map<string, string>()
    teams?.forEach((team) => {
      teamMap.set(team.id, team.name)
    })

    // Add team names to matches
    const matchesWithTeams = matches?.map((match) => ({
      ...match,
      home_team_name: teamMap.get(match.home_team_id) || "Unknown",
      away_team_name: teamMap.get(match.away_team_id) || "Unknown",
    }))

    return NextResponse.json({ matches: matchesWithTeams })
  } catch (error: any) {
    console.error("Error in debug completed matches API:", error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
