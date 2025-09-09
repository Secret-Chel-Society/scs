import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateAdvancedPlayerSummary } from "@/lib/player-analysis-engine"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface PlayerStats {
  player_name: string
  position: string
  team_id: string
  goals: number
  assists: number
  shots: number
  hits: number
  pim: number
  plus_minus: number
  blocks: number
  giveaways: number
  takeaways: number
  saves?: number
  goals_against?: number
  glshots?: number
  games_played: number
  game_stats?: GameStats[]
}

interface GameStats {
  match_id: string
  opponent: string
  goals: number
  assists: number
  plus_minus: number
  saves?: number
  goals_against?: number
  result: "W" | "L" | "OTL"
  team_score?: number
  opponent_score?: number
}

interface TeamMatch {
  match_id: string
  opponent: string
  score: string
  result: "W" | "L" | "OTL"
  goal_differential: number
  overtime: boolean
}

interface TeamRecap {
  team_name: string
  team_id: string
  record: { wins: number; losses: number; otl: number }
  matches: TeamMatch[]
  total_goal_differential: number
  top_players: {
    forward?: PlayerStats
    defense?: PlayerStats
    goalie?: PlayerStats
  }
  worst_players: {
    forward?: PlayerStats
    defense?: PlayerStats
    goalie?: PlayerStats
  }
  callouts: {
    high_turnovers: PlayerStats[]
    strong_defense: PlayerStats[]
    underwhelming: PlayerStats[]
    great_offense: PlayerStats[]
    fourth_forward: PlayerStats[]
  }
  all_players: PlayerStats[]
  summary?: string
  player_summaries?: { [playerName: string]: string }
}

interface RecapData {
  date: string
  team_recaps: TeamRecap[]
  best_team: TeamRecap | null
  worst_team: TeamRecap | null
  total_matches: number
}

function calculateSavePercentage(saves: number, goals_against: number): number {
  const totalShots = saves + goals_against
  if (totalShots === 0) return 0
  return saves / totalShots
}

function evaluateSkaterPerformance(player: PlayerStats): "great" | "good" | "decent" | "slow" | "bad" {
  const ppg = (player.goals + player.assists) / player.games_played
  const isForward = ["C", "LW", "RW"].includes(player.position)
  const isDefense = ["LD", "RD"].includes(player.position)

  if (isForward) {
    if (ppg > 4.0) return "great"
    if (ppg >= 3.5 && ppg <= 4.0) return "good"
    if (ppg >= 2.0 && ppg < 3.5) return "decent"
    if (ppg >= 1.0 && ppg < 2.0) return "slow"
    if (ppg < 1.0) return "bad"
    return "decent"
  } else if (isDefense) {
    if (ppg >= 1.5) return "great"
    if (ppg >= 0.8) return "good"
    if (ppg >= 0.5) return "decent"
    return "bad"
  }

  return "decent"
}

function evaluateGoaliePerformance(player: PlayerStats): "great" | "solid" | "bad" {
  if (!player.saves || !player.goals_against) return "bad"
  const savePct = calculateSavePercentage(player.saves, player.goals_against)

  if (savePct >= 0.84) return "great"
  if (savePct >= 0.8) return "solid"
  return "bad"
}

function getPlayerCallouts(players: PlayerStats[]): {
  high_turnovers: PlayerStats[]
  strong_defense: PlayerStats[]
  underwhelming: PlayerStats[]
  great_offense: PlayerStats[]
  fourth_forward: PlayerStats[]
} {
  const callouts = {
    high_turnovers: [] as PlayerStats[],
    strong_defense: [] as PlayerStats[],
    underwhelming: [] as PlayerStats[],
    great_offense: [] as PlayerStats[],
    fourth_forward: [] as PlayerStats[],
  }

  console.log(`Analyzing ${players.length} players for callouts...`)

  players.forEach((player) => {
    const turnoversPerGame = player.giveaways / player.games_played
    const takeawaysPerGame = player.takeaways / player.games_played
    const ppg = (player.goals + player.assists) / player.games_played

    console.log(`${player.player_name} (${player.position}): ${ppg.toFixed(2)} PPG`)

    // High turnovers
    if (turnoversPerGame > 12) {
      callouts.high_turnovers.push(player)
      console.log(`  -> High turnovers: ${turnoversPerGame.toFixed(1)} per game`)
    }

    // Strong defense
    if (takeawaysPerGame > 5) {
      callouts.strong_defense.push(player)
      console.log(`  -> Strong defense: ${takeawaysPerGame.toFixed(1)} takeaways per game`)
    }

    // Great offense for forwards - lowered from 3.8 to 3.5
    if (["C", "LW", "RW"].includes(player.position) && ppg > 3.5) {
      callouts.great_offense.push(player)
      console.log(`  -> Great offense: ${ppg.toFixed(2)} PPG`)
    }

    // 4th Forward for defense - lowered from 1.8 to 1.5
    if (["LD", "RD"].includes(player.position) && ppg > 1.5) {
      callouts.fourth_forward.push(player)
      console.log(`  -> 4th Forward: ${ppg.toFixed(2)} PPG`)
    }

    // Underwhelming performance
    const performance = player.position === "G" ? evaluateGoaliePerformance(player) : evaluateSkaterPerformance(player)

    if (performance === "bad") {
      callouts.underwhelming.push(player)
      console.log(`  -> Underwhelming: ${performance} performance`)
    }
  })

  console.log(`Callouts summary:`)
  console.log(`  Great offense: ${callouts.great_offense.length}`)
  console.log(`  4th Forward: ${callouts.fourth_forward.length}`)
  console.log(`  High turnovers: ${callouts.high_turnovers.length}`)
  console.log(`  Strong defense: ${callouts.strong_defense.length}`)
  console.log(`  Underwhelming: ${callouts.underwhelming.length}`)

  return callouts
}

function generatePlayerSummaries(team: TeamRecap): { [playerName: string]: string } {
  const summaries: { [playerName: string]: string } = {}

  try {
    console.log(`🤖 Generating AI-powered summaries for ${team.all_players.length} players on ${team.team_name}...`)

    for (const player of team.all_players) {
      // Use the advanced AI-like analysis engine
      summaries[player.player_name] = generateAdvancedPlayerSummary(player, team.team_name)
      console.log(`✅ Generated advanced summary for ${player.player_name}`)
    }
  } catch (error) {
    console.error(`Error generating AI summaries for ${team.team_name}:`, error)
  }

  return summaries
}

function generateTeamSummary(team: TeamRecap): string {
  try {
    const formatPlayerStats = (player: PlayerStats): string => {
      const ppg = ((player.goals + player.assists) / player.games_played).toFixed(1)
      const plusMinus = player.plus_minus >= 0 ? `+${player.plus_minus}` : `${player.plus_minus}`

      if (player.position === "G") {
        const savePct =
          player.saves && player.goals_against !== undefined
            ? calculateSavePercentage(player.saves, player.goals_against).toFixed(3)
            : "0.000"
        return `${player.player_name} (G): ${player.saves || 0} saves, ${savePct} SV%, ${player.goals_against || 0} GA in ${player.games_played} games`
      }

      return `${player.player_name} (${player.position}): ${player.goals}G ${player.assists}A (${ppg} PPG), ${plusMinus}, ${player.shots} shots, ${player.hits} hits, ${player.blocks} blocks, ${player.giveaways} giveaways, ${player.takeaways} takeaways in ${player.games_played} games`
    }

    const matchResults = team.matches
      .map((match) => `vs ${match.opponent}: ${match.score} (${match.result}${match.overtime ? " OT" : ""})`)
      .join(", ")

    // Group players by position for better organization
    const forwards = team.all_players.filter((p) => ["C", "LW", "RW"].includes(p.position))
    const defense = team.all_players.filter((p) => ["LD", "RD"].includes(p.position))
    const goalies = team.all_players.filter((p) => p.position === "G")

    // Sort players by performance within each position
    const sortedForwards = forwards.sort((a, b) => {
      const aPoints = (a.goals + a.assists) / a.games_played
      const bPoints = (b.goals + b.assists) / b.games_played
      return bPoints - aPoints
    })

    const sortedDefense = defense.sort((a, b) => {
      const aPoints = (a.goals + a.assists) / a.games_played
      const bPoints = (b.goals + b.assists) / b.games_played
      return bPoints - aPoints
    })

    const sortedGoalies = goalies.sort((a, b) => {
      const aSavePct = a.saves && a.goals_against !== undefined ? calculateSavePercentage(a.saves, a.goals_against) : 0
      const bSavePct = b.saves && b.goals_against !== undefined ? calculateSavePercentage(b.saves, b.goals_against) : 0
      return bSavePct - aSavePct
    })

    // Generate comprehensive summary
    let summary = `The ${team.team_name} posted a ${team.record.wins}-${team.record.losses}-${team.record.otl} record in recent action with a goal differential of ${team.total_goal_differential >= 0 ? "+" : ""}${team.total_goal_differential}. Their recent matches included ${matchResults}.\n\n`

    // Forward analysis with updated criteria
    if (sortedForwards.length > 0) {
      summary += `Forward Corps Analysis: `
      sortedForwards.forEach((player, index) => {
        const ppg = ((player.goals + player.assists) / player.games_played).toFixed(1)
        const ppgValue = (player.goals + player.assists) / player.games_played
        let performanceNote = ""

        if (ppgValue > 4.4) performanceNote = " - exceptional production"
        else if (ppgValue >= 3.6 && ppgValue <= 4.4) performanceNote = " - good production"
        else if (ppgValue >= 2.0 && ppgValue < 3.6) performanceNote = " - decent offense"
        else if (ppgValue >= 1.0 && ppgValue < 2.0) performanceNote = " - slow night"
        else performanceNote = " - needs improvement"

        summary += `${player.player_name} led with ${ppg} PPG (${player.goals}G, ${player.assists}A)${performanceNote}`
        if (index < sortedForwards.length - 1) summary += "; "
      })
      summary += ".\n\n"
    }

    // Defense analysis
    if (sortedDefense.length > 0) {
      summary += `Defensive Unit: `
      sortedDefense.forEach((player, index) => {
        const ppg = ((player.goals + player.assists) / player.games_played).toFixed(1)
        const ppgValue = (player.goals + player.assists) / player.games_played
        let performanceNote = ""

        if (ppgValue > 1.8) performanceNote = " - playing like a 4th forward"
        else if (ppgValue >= 1.7) performanceNote = " - excellent two-way play"
        else if (ppgValue >= 0.8) performanceNote = " - good defensive play"
        else if (ppgValue >= 0.5) performanceNote = " - decent performance"
        else performanceNote = " - struggled defensively"

        summary += `${player.player_name} contributed ${ppg} PPG with ${player.blocks} blocks and ${player.takeaways} takeaways${performanceNote}`
        if (index < sortedDefense.length - 1) summary += "; "
      })
      summary += ".\n\n"
    }

    // Goalie analysis
    if (sortedGoalies.length > 0) {
      summary += `Goaltending: `
      sortedGoalies.forEach((player, index) => {
        const savePct =
          player.saves && player.goals_against !== undefined
            ? calculateSavePercentage(player.saves, player.goals_against).toFixed(3)
            : "0.000"
        const performance = evaluateGoaliePerformance(player)
        summary += `${player.player_name} posted a ${savePct} save percentage with ${player.goals_against || 0} goals against`
        if (performance === "great") summary += " - stellar performance"
        else if (performance === "bad") summary += " - needs better positioning"
        if (index < sortedGoalies.length - 1) summary += "; "
      })
      summary += ".\n\n"
    }

    // Team outlook
    const recordPercentage =
      (team.record.wins + team.record.otl * 0.5) / (team.record.wins + team.record.losses + team.record.otl)
    if (recordPercentage > 0.6) {
      summary += `Looking ahead, the ${team.team_name} are in strong position with their positive goal differential and solid record. Key contributors like ${team.top_players.forward?.player_name || "their top forward"} and ${team.top_players.defense?.player_name || "their top defenseman"} will need to maintain their production levels.`
    } else {
      summary += `The ${team.team_name} face challenges ahead and will need improved performances from their core players. Areas for improvement include ${team.callouts.underwhelming.length > 0 ? "offensive production" : "team chemistry"} and ${team.total_goal_differential < 0 ? "defensive structure" : "consistency"}.`
    }

    return summary
  } catch (error) {
    console.error(`Error generating summary for ${team.team_name}:`, error)
    return `The ${team.team_name} posted a ${team.record.wins}-${team.record.losses}-${team.record.otl} record in recent action with a goal differential of ${team.total_goal_differential >= 0 ? "+" : ""}${team.total_goal_differential}. Their recent matches included ${team.matches.map((m) => `${m.result} vs ${m.opponent}`).join(", ")}.\n\nKey contributors included ${team.top_players.forward?.player_name || "N/A"} leading the forwards and ${team.top_players.defense?.player_name || "N/A"} anchoring the defense. The team will look to build on their strengths while addressing areas for improvement in upcoming games.`
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get matches from the last 48 hours - using updated_at instead of created_at
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    console.log("Looking for matches updated since:", fortyEightHoursAgo)
    console.log("Current time:", new Date().toISOString())

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(`
        id,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status,
        overtime,
        has_overtime,
        created_at,
        updated_at,
        home_team:home_team_id(name),
        away_team:away_team_id(name)
      `)
      .eq("status", "Completed")
      .gte("updated_at", fortyEightHoursAgo)
      .order("updated_at", { ascending: false })

    console.log("Found matches:", matches?.length || 0)
    if (matches && matches.length > 0) {
      console.log("Sample match:", matches[0])
      console.log(
        "All match IDs:",
        matches.map((m) => m.id),
      )
    }

    if (matchesError) {
      throw new Error(`Error fetching matches: ${matchesError.message}`)
    }

    if (!matches || matches.length === 0) {
      const emptyRecapData = {
        date: new Date().toISOString().split("T")[0],
        team_recaps: [],
        best_team: null,
        worst_team: null,
        total_matches: 0,
      }

      return NextResponse.json({
        success: true,
        data: emptyRecapData,
      })
    }

    // Get all teams - we'll map by internal team ID since that's what ea_player_stats uses
    const { data: teams, error: teamsError } = await supabase.from("teams").select("id, name, ea_club_id")

    if (teamsError) {
      throw new Error(`Error fetching teams: ${teamsError.message}`)
    }

    console.log("Teams found:", teams?.length || 0)

    // Create team mapping using internal team ID (since that's what ea_player_stats.team_id uses internal IDs)
    const teamIdToTeam = new Map<string, { id: string; name: string }>()

    teams?.forEach((team) => {
      teamIdToTeam.set(team.id, {
        id: team.id,
        name: team.name,
      })
    })

    console.log("Team ID mappings created:", teamIdToTeam.size)
    console.log("Sample team mappings:", Array.from(teamIdToTeam.entries()).slice(0, 3))

    // Get player stats directly using match IDs
    const matchIds = matches.map((m) => m.id)
    console.log("Looking for player stats with match_ids:", matchIds)

    const { data: playerStats, error: statsError } = await supabase
      .from("ea_player_stats")
      .select(`
        player_name,
        position,
        team_id,
        goals,
        assists,
        shots,
        hits,
        pim,
        plus_minus,
        blocks,
        giveaways,
        takeaways,
        saves,
        goals_against,
        glshots,
        ea_match_id,
        match_id
      `)
      .in("match_id", matchIds)

    console.log("Player stats found:", playerStats?.length || 0)
    if (playerStats && playerStats.length > 0) {
      console.log("Sample player stat:", playerStats[0])
      console.log("Unique team IDs in player stats:", [...new Set(playerStats.map((p) => p.team_id))])
    }

    if (statsError) {
      throw new Error(`Error fetching player stats: ${statsError.message}`)
    }

    if (!playerStats || playerStats.length === 0) {
      console.log("No player stats found for the completed matches")
      const emptyRecapData = {
        date: new Date().toISOString().split("T")[0],
        team_recaps: [],
        best_team: null,
        worst_team: null,
        total_matches: matches.length,
      }

      return NextResponse.json({
        success: true,
        data: emptyRecapData,
      })
    }

    // Aggregate player stats by team using internal team ID mapping
    const teamPlayerStats = new Map<string, PlayerStats[]>()

    playerStats?.forEach((stat, index) => {
      // Only log first few for debugging
      if (index < 3) {
        console.log(`Player stat ${index}: player=${stat.player_name}, team_id=${stat.team_id}`)
      }

      // stat.team_id is the internal team ID, map it directly
      const teamInfo = teamIdToTeam.get(stat.team_id)

      if (!teamInfo) {
        console.log(`❌ No team found for team ID: ${stat.team_id}`)
        return
      }

      if (index < 3) {
        console.log(`✅ Found team for ID ${stat.team_id}: ${teamInfo.name}`)
      }

      const teamName = teamInfo.name
      if (!teamPlayerStats.has(teamName)) {
        teamPlayerStats.set(teamName, [])
      }

      const existingPlayer = teamPlayerStats.get(teamName)?.find((p) => p.player_name === stat.player_name)
      if (existingPlayer) {
        // Aggregate stats
        existingPlayer.goals += stat.goals || 0
        existingPlayer.assists += stat.assists || 0
        existingPlayer.shots += stat.shots || 0
        existingPlayer.hits += stat.hits || 0
        existingPlayer.pim += stat.pim || 0
        existingPlayer.plus_minus += stat.plus_minus || 0
        existingPlayer.blocks += stat.blocks || 0
        existingPlayer.giveaways += stat.giveaways || 0
        existingPlayer.takeaways += stat.takeaways || 0
        existingPlayer.saves = (existingPlayer.saves || 0) + (stat.saves || 0)
        existingPlayer.goals_against = (existingPlayer.goals_against || 0) + (stat.goals_against || 0)
        existingPlayer.glshots = (existingPlayer.glshots || 0) + (stat.glshots || 0)
        existingPlayer.games_played += 1

        // Add game stats for individual game analysis
        if (!existingPlayer.game_stats) existingPlayer.game_stats = []

        // Find the match to get opponent and result
        const match = matches.find((m) => m.id === stat.match_id)
        let opponent = "Unknown"
        let result: "W" | "L" | "OTL" = "L"
        let teamScore: number | undefined
        let opponentScore: number | undefined

        if (match) {
          const isHome = match.home_team_id === stat.team_id
          opponent = isHome
            ? teamIdToTeam.get(match.away_team_id)?.name || "Unknown"
            : teamIdToTeam.get(match.home_team_id)?.name || "Unknown"

          teamScore = isHome ? match.home_score : match.away_score
          opponentScore = isHome ? match.away_score : match.home_score
          const goalDiff = teamScore - opponentScore
          const overtime = match.overtime || match.has_overtime

          if (goalDiff > 0) {
            result = "W"
          } else if (goalDiff < 0) {
            result = overtime ? "OTL" : "L"
          }
        }

        existingPlayer.game_stats.push({
          match_id: stat.match_id,
          opponent,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          plus_minus: stat.plus_minus || 0,
          saves: stat.saves,
          goals_against: stat.goals_against,
          result,
          team_score: teamScore,
          opponent_score: opponentScore,
        })
      } else {
        // Find the match to get opponent and result
        const match = matches.find((m) => m.id === stat.match_id)
        let opponent = "Unknown"
        let result: "W" | "L" | "OTL" = "L"
        let teamScore: number | undefined
        let opponentScore: number | undefined

        if (match) {
          const isHome = match.home_team_id === stat.team_id
          opponent = isHome
            ? teamIdToTeam.get(match.away_team_id)?.name || "Unknown"
            : teamIdToTeam.get(match.home_team_id)?.name || "Unknown"

          teamScore = isHome ? match.home_score : match.away_score
          opponentScore = isHome ? match.away_score : match.home_score
          const goalDiff = teamScore - opponentScore
          const overtime = match.overtime || match.has_overtime

          if (goalDiff > 0) {
            result = "W"
          } else if (goalDiff < 0) {
            result = overtime ? "OTL" : "L"
          }
        }

        teamPlayerStats.get(teamName)?.push({
          player_name: stat.player_name,
          position: stat.position,
          team_id: teamInfo.id, // Use internal team ID
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          shots: stat.shots || 0,
          hits: stat.hits || 0,
          pim: stat.pim || 0,
          plus_minus: stat.plus_minus || 0,
          blocks: stat.blocks || 0,
          giveaways: stat.giveaways || 0,
          takeaways: stat.takeaways || 0,
          saves: stat.saves || 0,
          goals_against: stat.goals_against || 0,
          glshots: stat.glshots || 0,
          games_played: 1,
          game_stats: [
            {
              match_id: stat.match_id,
              opponent,
              goals: stat.goals || 0,
              assists: stat.assists || 0,
              plus_minus: stat.plus_minus || 0,
              saves: stat.saves,
              goals_against: stat.goals_against,
              result,
              team_score: teamScore,
              opponent_score: opponentScore,
            },
          ],
        })
      }
    })

    console.log("Teams with player stats:", Array.from(teamPlayerStats.keys()))

    // Build team recaps
    const teamRecaps: TeamRecap[] = []

    for (const [teamName, players] of teamPlayerStats.entries()) {
      const teamMatches: TeamMatch[] = []
      let wins = 0,
        losses = 0,
        otl = 0,
        totalGoalDiff = 0

      // Find matches for this team using internal team ID
      const teamId = players[0]?.team_id
      if (!teamId) continue

      matches.forEach((match) => {
        if (match.home_team_id === teamId || match.away_team_id === teamId) {
          const isHome = match.home_team_id === teamId
          const opponent = isHome
            ? teamIdToTeam.get(match.away_team_id)?.name
            : teamIdToTeam.get(match.home_team_id)?.name
          const teamScore = isHome ? match.home_score : match.away_score
          const oppScore = isHome ? match.away_score : match.home_score
          const goalDiff = teamScore - oppScore
          const overtime = match.overtime || match.has_overtime

          let result: "W" | "L" | "OTL"
          if (goalDiff > 0) {
            result = "W"
            wins++
          } else if (goalDiff < 0) {
            if (overtime) {
              result = "OTL"
              otl++
            } else {
              result = "L"
              losses++
            }
          } else {
            result = "L" // Shouldn't happen in hockey
          }

          teamMatches.push({
            match_id: match.id,
            opponent: opponent || "Unknown",
            score: `${teamScore}-${oppScore}`,
            result,
            goal_differential: goalDiff,
            overtime,
          })

          totalGoalDiff += goalDiff
        }
      })

      // Find top and worst players by position
      const forwards = players.filter((p) => ["C", "LW", "RW"].includes(p.position))
      const defense = players.filter((p) => ["LD", "RD"].includes(p.position))
      const goalies = players.filter((p) => p.position === "G")

      const topForward = forwards.sort((a, b) => {
        const aPoints = (a.goals + a.assists) / a.games_played
        const bPoints = (b.goals + b.assists) / b.games_played
        return bPoints - aPoints
      })[0]

      const topDefense = defense.sort((a, b) => {
        const aPoints = (a.goals + a.assists) / a.games_played
        const bPoints = (b.goals + b.assists) / b.games_played
        return bPoints - aPoints
      })[0]

      const topGoalie = goalies.sort((a, b) => {
        const aSavePct =
          a.saves && a.goals_against !== undefined ? calculateSavePercentage(a.saves, a.goals_against) : 0
        const bSavePct =
          b.saves && b.goals_against !== undefined ? calculateSavePercentage(b.saves, b.goals_against) : 0
        return bSavePct - aSavePct
      })[0]

      const worstForward = forwards.sort((a, b) => {
        const aPoints = (a.goals + a.assists) / a.games_played
        const bPoints = (b.goals + b.assists) / b.games_played
        return aPoints - bPoints
      })[0]

      const worstDefense = defense.sort((a, b) => {
        const aPoints = (a.goals + a.assists) / a.games_played
        const bPoints = (b.goals + b.assists) / b.games_played
        return aPoints - bPoints
      })[0]

      const worstGoalie = goalies.sort((a, b) => {
        const aSavePct =
          a.saves && a.goals_against !== undefined ? calculateSavePercentage(a.saves, a.goals_against) : 1
        const bSavePct =
          b.saves && b.goals_against !== undefined ? calculateSavePercentage(b.saves, b.goals_against) : 1
        return aSavePct - bSavePct
      })[0]

      const teamRecap: TeamRecap = {
        team_name: teamName,
        team_id: teamId,
        record: { wins, losses, otl },
        matches: teamMatches,
        total_goal_differential: totalGoalDiff,
        top_players: {
          forward: topForward,
          defense: topDefense,
          goalie: topGoalie,
        },
        worst_players: {
          forward: worstForward,
          defense: worstDefense,
          goalie: worstGoalie,
        },
        callouts: getPlayerCallouts(players),
        all_players: players, // Include all players for comprehensive analysis
      }

      teamRecaps.push(teamRecap)
    }

    // Generate summaries for each team using AI-powered analysis
    console.log("🤖 Generating AI-powered summaries for", teamRecaps.length, "teams...")
    for (const team of teamRecaps) {
      try {
        // Generate team summary
        team.summary = generateTeamSummary(team)
        console.log(`✅ Generated summary for ${team.team_name}`)

        // Generate individual player summaries using AI-like analysis
        team.player_summaries = generatePlayerSummaries(team)
        console.log(
          `✅ Generated AI player summaries for ${team.team_name} (${Object.keys(team.player_summaries).length} players)`,
        )

        // Ensure all_players array is properly included
        console.log(`✅ Team ${team.team_name} has ${team.all_players.length} players in roster`)
      } catch (error) {
        console.error(`❌ Failed to generate AI summary for ${team.team_name}:`, error)
        // Ensure we still have the basic data even if summary generation fails
        team.player_summaries = {}
      }
    }

    // Find best and worst team performances
    const bestTeam =
      teamRecaps.sort((a, b) => {
        // First by record (wins - losses - otl), then by goal differential
        const aRecord = a.record.wins - a.record.losses - a.record.otl
        const bRecord = b.record.wins - b.record.losses - b.record.otl
        if (aRecord !== bRecord) return bRecord - aRecord
        return b.total_goal_differential - a.total_goal_differential
      })[0] || null

    const worstTeam =
      teamRecaps.sort((a, b) => {
        // Reverse of best team logic
        const aRecord = a.record.wins - a.record.losses - a.record.otl
        const bRecord = b.record.wins - b.record.losses - b.record.otl
        if (aRecord !== bRecord) return aRecord - bRecord
        return a.total_goal_differential - b.total_goal_differential
      })[0] || null

    const recapData: RecapData = {
      date: new Date().toISOString().split("T")[0],
      team_recaps: teamRecaps,
      best_team: bestTeam,
      worst_team: worstTeam,
      total_matches: matches.length,
    }

    return NextResponse.json({
      success: true,
      data: recapData,
    })
  } catch (error: any) {
    console.error("Error generating daily recap:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
