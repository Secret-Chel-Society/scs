import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const league = searchParams.get("league") || "nhl"

    console.log("Team availability API called with:", { teamId, startDate, endDate, league })

    if (!teamId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // League-specific table/column selection
    const availabilityTable =
      league === "ahl" ? "game_availability_ahl" : league === "ecl" ? "game_availability_ecl" : "game_availability"
    const matchesTable = league === "ahl" ? "matches_ahl" : league === "ecl" ? "matches_ecl" : "matches"
    const teamsTable = league === "ahl" ? "teams_ahl" : league === "ecl" ? "teams_ecl" : "teams"
    const playerTeamCol = league === "ahl" ? "team_id_ahl" : league === "ecl" ? "team_id_ecl" : "team_id"

    const supabase = createAdminClient()

    // Check if availability table exists
    const { data: tableCheck, error: tableError } = await supabase.from(availabilityTable).select("id").limit(1)

    if (tableError) {
      console.error("Table check error:", tableError)
      if (tableError.code === "42P01") {
        return NextResponse.json({
          teamPlayers: [],
          weeks: [],
          error: "Game availability system not set up. Please run the migration first.",
        })
      }
    }

    // Get team players
    const { data: teamPlayers, error: playersError } = await supabase
      .from("players")
      .select(`
        id,
        user_id,
        ${playerTeamCol},
        users!inner(
          id,
          gamer_tag_id
        )
      `)
      .eq(playerTeamCol, teamId)

    if (playersError) {
      console.error("Players error:", playersError)
      return NextResponse.json({ error: "Failed to fetch team players" }, { status: 500 })
    }

    console.log(`Found ${teamPlayers?.length || 0} players for team ${teamId}`)

    // Get matches for the team in the date range
    const { data: matches, error: matchesError } = await supabase
      .from(matchesTable)
      .select(`
        id,
        match_date,
        home_team_id,
        away_team_id,
        status
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .gte("match_date", startDate)
      .lte("match_date", endDate)
      .order("match_date", { ascending: true })

    if (matchesError) {
      console.error("Matches error:", matchesError)
      return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
    }

    console.log(`Found ${matches?.length || 0} matches for team ${teamId}`)

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        teamPlayers: teamPlayers || [],
        weeks: [],
      })
    }

    // Get team names for display
    const teamIds = new Set<string>()
    matches.forEach((match) => {
      teamIds.add(match.home_team_id.toString())
      teamIds.add(match.away_team_id.toString())
    })

    const { data: teams, error: teamsError } = await supabase
      .from(teamsTable)
      .select("id, name")
      .in("id", Array.from(teamIds))

    if (teamsError) {
      console.error("Teams error:", teamsError)
    }

    const teamsMap = new Map()
    teams?.forEach((team) => {
      teamsMap.set(team.id.toString(), team)
    })

    // Get availability data
    const matchIds = matches.map((match) => match.id)
    const { data: availability, error: availabilityError } = await supabase
      .from(availabilityTable)
      .select(`
        id,
        match_id,
        player_id,
        user_id,
        team_id,
        status,
        created_at
      `)
      .in("match_id", matchIds)
      .eq("team_id", teamId)

    if (availabilityError) {
      console.error("Availability error:", availabilityError)
      // Continue with empty availability rather than failing
    }

    console.log(`Found ${availability?.length || 0} availability records`)

    // Process matches and group by weeks
    const matchesByWeek = new Map()

    matches.forEach((match) => {
      const matchDate = new Date(match.match_date)
      const weekStart = new Date(matchDate)
      weekStart.setDate(matchDate.getDate() - matchDate.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split("T")[0]

      if (!matchesByWeek.has(weekKey)) {
        matchesByWeek.set(weekKey, {
          weekStart: weekKey,
          matches: [],
        })
      }

      // Get availability for this match
      const matchAvailability = availability?.filter((a) => a.match_id === match.id) || []

      // Add team info and availability to match
      const enrichedMatch = {
        ...match,
        home_team: teamsMap.get(match.home_team_id.toString()),
        away_team: teamsMap.get(match.away_team_id.toString()),
        availability: matchAvailability,
      }

      matchesByWeek.get(weekKey).matches.push(enrichedMatch)
    })

    // Convert to sorted array
    const sortedWeeks = Array.from(matchesByWeek.values()).sort(
      (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
    )

    return NextResponse.json({
      teamPlayers: teamPlayers || [],
      weeks: sortedWeeks,
    })
  } catch (error: any) {
    console.error("Team availability API error:", error)
    return NextResponse.json(
      {
        error: `Internal server error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
