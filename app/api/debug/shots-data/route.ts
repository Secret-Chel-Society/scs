import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId") || "1"

    console.log(`Debugging shots data for season ${seasonId}`)

    // Get season name
    const { data: seasonData } = await supabase.from("system_settings").select("value").eq("key", "seasons").single()

    const seasons = seasonData?.value || []
    const season = seasons.find((s: any) => s.id === Number(seasonId))
    const seasonName = season?.name || `Season ${seasonId}`

    // Get completed matches for this season
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, season_name, status")
      .eq("season_name", seasonName)
      .or("status.eq.completed,status.eq.Completed")

    if (matchesError) {
      throw new Error(`Error fetching matches: ${matchesError.message}`)
    }

    const matchIds = matches?.map((m) => m.id) || []

    // Check ea_team_stats table
    let eaTeamStatsData = []
    let eaTeamStatsError = null
    try {
      const { data, error } = await supabase
        .from("ea_team_stats")
        .select("match_id, team_id, shots, goals")
        .in("match_id", matchIds)

      eaTeamStatsData = data || []
      eaTeamStatsError = error
    } catch (err) {
      eaTeamStatsError = err
    }

    // Check ea_player_stats table
    let eaPlayerStatsData = []
    let eaPlayerStatsError = null
    try {
      const { data, error } = await supabase
        .from("ea_player_stats")
        .select("match_id, team_id, shots, goals, player_name")
        .in("match_id", matchIds)

      eaPlayerStatsData = data || []
      eaPlayerStatsError = error
    } catch (err) {
      eaPlayerStatsError = err
    }

    // Aggregate player shots by team and match
    const aggregatedPlayerShots = new Map<string, number>()
    eaPlayerStatsData.forEach((stat) => {
      const key = `${stat.match_id}-${stat.team_id}`
      const currentShots = aggregatedPlayerShots.get(key) || 0
      aggregatedPlayerShots.set(key, currentShots + (stat.shots || 0))
    })

    // Get teams for reference
    const { data: teams } = await supabase.from("teams").select("id, name").eq("is_active", true)

    const teamsMap = new Map(teams?.map((t) => [t.id, t.name]) || [])

    return NextResponse.json({
      season: {
        id: seasonId,
        name: seasonName,
      },
      matches: {
        total: matches?.length || 0,
        completed: matches?.filter((m) => m.status.toLowerCase() === "completed").length || 0,
      },
      eaTeamStats: {
        available: !eaTeamStatsError,
        error: eaTeamStatsError?.message,
        records: eaTeamStatsData.length,
        sample: eaTeamStatsData.slice(0, 5).map((stat) => ({
          ...stat,
          team_name: teamsMap.get(stat.team_id),
        })),
      },
      eaPlayerStats: {
        available: !eaPlayerStatsError,
        error: eaPlayerStatsError?.message,
        records: eaPlayerStatsData.length,
        uniqueMatches: new Set(eaPlayerStatsData.map((s) => s.match_id)).size,
        aggregatedShots: Array.from(aggregatedPlayerShots.entries())
          .slice(0, 10)
          .map(([key, shots]) => {
            const [matchId, teamId] = key.split("-")
            return {
              matchId,
              teamId,
              teamName: teamsMap.get(teamId),
              totalShots: shots,
            }
          }),
      },
      recommendations: [
        eaTeamStatsData.length > 0 ? "✅ Use ea_team_stats for shots data" : "❌ ea_team_stats not available",
        eaPlayerStatsData.length > 0 ? "✅ Can aggregate from ea_player_stats" : "❌ ea_player_stats not available",
        aggregatedPlayerShots.size > 0
          ? `✅ Found shots for ${aggregatedPlayerShots.size} team-match combinations`
          : "❌ No shots data found",
      ],
    })
  } catch (error: any) {
    console.error("Error debugging shots data:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to debug shots data",
      },
      { status: 500 },
    )
  }
}
