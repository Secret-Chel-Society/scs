import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId") || "1"

    const seasonNumber = Number(seasonId)
    if (isNaN(seasonNumber)) {
      return NextResponse.json({ error: "Invalid seasonId parameter" }, { status: 400 })
    }

    const cookieStore = request.headers.get("cookie") as string
    const supabase = createClient(cookieStore)

    // Get current season info
    let actualSeasonId = seasonId
    const { data: seasonRecord, error: seasonError } = await supabase
      .from("seasons")
      .select("id, number, name")
      .eq("number", seasonNumber)
      .single()

    if (!seasonError && seasonRecord) {
      actualSeasonId = seasonRecord.id
    }

    // Fetch completed matches for the season
    let matchQuery = supabase
      .from("matches")
      .select(
        "id, home_team_id, away_team_id, home_score, away_score, status, season_id, season_name, overtime, has_overtime, match_date",
      )
      .or("status.ilike.%completed%,status.ilike.%Completed%")

    if (actualSeasonId && actualSeasonId !== seasonNumber.toString()) {
      matchQuery = matchQuery.eq("season_id", actualSeasonId)
    } else {
      matchQuery = matchQuery.eq("season_name", `Season ${seasonNumber}`)
    }

    const { data: completedMatches, error: matchesError } = await matchQuery

    if (matchesError) {
      console.error("Error fetching completed matches:", matchesError)
      return NextResponse.json({ error: "Error fetching matches" }, { status: 500 })
    }

    if (!completedMatches || completedMatches.length === 0) {
      return NextResponse.json({
        offense: [],
        defense: [],
        goalies: [],
      })
    }

    // Build match results map
    const matchResultsMap = new Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>()

    completedMatches.forEach((match) => {
      if (match.home_score !== null && match.away_score !== null) {
        const isOvertime =
          match.overtime === true ||
          match.has_overtime === true ||
          (match.status && match.status.toLowerCase().includes("overtime")) ||
          (match.status && match.status.includes("(OT)"))

        let homeResult: "W" | "L" | "OTL"
        let awayResult: "W" | "L" | "OTL"

        if (match.home_score > match.away_score) {
          homeResult = "W"
          awayResult = isOvertime ? "OTL" : "L"
        } else if (match.away_score > match.home_score) {
          awayResult = "W"
          homeResult = isOvertime ? "OTL" : "L"
        } else {
          homeResult = "OTL"
          awayResult = "OTL"
        }

        matchResultsMap.set(match.id, { home_result: homeResult, away_result: awayResult })
      }
    })

    // Fetch player stats for these matches
    const matchIds = completedMatches.map((m) => m.id)
    const { data: playerStatsData, error: playerStatsError } = await supabase
      .from("ea_player_stats")
      .select("*")
      .in("match_id", matchIds)

    if (playerStatsError) {
      console.error("Error fetching player stats:", playerStatsError)
      return NextResponse.json({ error: "Error fetching player stats" }, { status: 500 })
    }

    if (!playerStatsData || playerStatsData.length === 0) {
      return NextResponse.json({
        offense: [],
        defense: [],
        goalies: [],
      })
    }

    // Fetch player name to team mappings
    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("id, user_id, team_id, teams(id, name), users(id, gamer_tag_id)")

    const playerNameToTeamMap: Record<string, any> = {}
    if (!playersError && playersData) {
      playersData.forEach((player) => {
        if (player.users?.gamer_tag_id) {
          playerNameToTeamMap[player.users.gamer_tag_id.toLowerCase()] = {
            player_id: player.id,
            team_id: player.team_id,
            team_name: player.teams?.name || "Free Agent",
          }
        }
      })
    }

    // Create match data map
    const matchDataMap = new Map()
    completedMatches.forEach((match) => {
      matchDataMap.set(match.id, match)
    })

    // Process player stats - aggregate by player name and position category
    const playerStatsMap = new Map<string, any>()

    playerStatsData.forEach((stat) => {
      const playerName = stat.player_name?.toLowerCase() || "unknown"

      // Map EA positions to standard positions
      let position = stat.position
      if (stat.position === "0") position = "G"
      else if (stat.position === "1") position = "RD"
      else if (stat.position === "2") position = "LD"
      else if (stat.position === "3") position = "RW"
      else if (stat.position === "4") position = "LW"
      else if (stat.position === "5") position = "C"

      // Determine position category
      let positionCategory = ""
      if (["C", "LW", "RW"].includes(position)) {
        positionCategory = "offense"
      } else if (["LD", "RD"].includes(position)) {
        positionCategory = "defense"
      } else if (position === "G") {
        positionCategory = "goalie"
      } else {
        return // Skip unknown positions
      }

      const playerKey = `${playerName}_${positionCategory}`

      if (!playerStatsMap.has(playerKey)) {
        playerStatsMap.set(playerKey, {
          player_name: stat.player_name,
          position: position,
          season_id: stat.season_id,
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          team_name: "Free Agent",
          team_id: null,
        })
      }

      const aggregated = playerStatsMap.get(playerKey)!

      // Aggregate stats
      aggregated.games_played += 1
      aggregated.goals += stat.goals || 0
      aggregated.assists += stat.assists || 0
      aggregated.plus_minus += stat.plus_minus || 0
      aggregated.pim += stat.pim || 0
      aggregated.shots += stat.shots || 0
      aggregated.hits += stat.hits || 0
      aggregated.blocks += stat.blocks || 0
      aggregated.takeaways += stat.takeaways || 0
      aggregated.giveaways += stat.giveaways || 0
      aggregated.faceoffs_won += stat.faceoffs_won || 0
      aggregated.faceoffs_taken += stat.faceoffs_taken || 0

      // Goalie stats
      if (position === "G") {
        aggregated.saves += stat.saves || 0
        aggregated.goals_against += stat.goals_against || 0
        aggregated.glshots += stat.glshots || 0
        aggregated.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
      }

      // Calculate W/L/OTL based on match results
      const matchResult = matchResultsMap.get(stat.match_id)
      const matchData = matchDataMap.get(stat.match_id)

      if (matchResult && matchData && stat.team_id) {
        let playerResult: "W" | "L" | "OTL" | null = null

        if (stat.team_id === matchData.home_team_id) {
          playerResult = matchResult.home_result
        } else if (stat.team_id === matchData.away_team_id) {
          playerResult = matchResult.away_result
        } else {
          // Try to match by player name
          const playerTeamInfo = playerNameToTeamMap[stat.player_name?.toLowerCase()]
          if (playerTeamInfo && playerTeamInfo.team_id) {
            if (playerTeamInfo.team_id === matchData.home_team_id) {
              playerResult = matchResult.home_result
            } else if (playerTeamInfo.team_id === matchData.away_team_id) {
              playerResult = matchResult.away_result
            }
          }
        }

        if (playerResult === "W") {
          aggregated.wins += 1
        } else if (playerResult === "OTL") {
          aggregated.otl += 1
        } else if (playerResult === "L") {
          aggregated.losses += 1
        }
      }

      // Set team info
      const playerTeamInfo = playerNameToTeamMap[stat.player_name?.toLowerCase()]
      if (playerTeamInfo) {
        aggregated.team_name = playerTeamInfo.team_name
        aggregated.team_id = playerTeamInfo.team_id
      }
    })

    // Calculate final stats and categorize players
    const aggregatedStats = Array.from(playerStatsMap.values())

    aggregatedStats.forEach((player) => {
      player.points = player.goals + player.assists
      if (player.position === "G" && player.total_shots_faced > 0) {
        player.save_pct = player.saves / player.total_shots_faced
      }
    })

    // Categorize and get top 5 in each category
    const offensePlayers = aggregatedStats
      .filter((player) => ["C", "LW", "RW"].includes(player.position))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)

    const defensePlayers = aggregatedStats
      .filter((player) => ["LD", "RD"].includes(player.position))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)

    const goaliePlayers = aggregatedStats
      .filter((player) => player.position === "G")
      .sort((a, b) => (b.wins || 0) - (a.wins || 0))
      .slice(0, 5)

    return NextResponse.json({
      offense: offensePlayers,
      defense: defensePlayers,
      goalies: goaliePlayers,
    })
  } catch (error: any) {
    console.error("Error in /api/statistics/top-players:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
