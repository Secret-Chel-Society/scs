import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateAdvancedPlayerSummary, getPerformanceLevel, analyzeGameTrends } from "@/lib/player-analysis-engine"

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
  time_window_hours: number
  generation_timestamp: number
}

function calculateSavePercentage(saves: number, goals_against: number): number {
  const totalShots = saves + goals_against
  if (totalShots === 0) return 0
  return saves / totalShots
}

function generateIntelligentTeamSummary(team: TeamRecap): string {
  try {
    console.log(`🧠 Generating intelligent team summary for ${team.team_name}...`)

    // Analyze team performance context
    const totalGames = team.record.wins + team.record.losses + team.record.otl
    const pointsPercentage = (team.record.wins * 2 + team.record.otl) / (totalGames * 2)
    const avgGoalDiff = team.total_goal_differential / totalGames

    // Categorize team performance
    let teamPerformanceLevel: "dominant" | "strong" | "competitive" | "struggling" | "poor"
    let performanceContext: string

    if (pointsPercentage >= 0.75 && avgGoalDiff > 1.5) {
      teamPerformanceLevel = "dominant"
      performanceContext = "absolutely dominated their competition"
    } else if (pointsPercentage >= 0.65 && avgGoalDiff > 0.5) {
      teamPerformanceLevel = "strong"
      performanceContext = "performed at a high level"
    } else if (pointsPercentage >= 0.45 && avgGoalDiff >= -0.5) {
      teamPerformanceLevel = "competitive"
      performanceContext = "remained competitive in tight contests"
    } else if (pointsPercentage >= 0.25) {
      teamPerformanceLevel = "struggling"
      performanceContext = "faced significant challenges"
    } else {
      teamPerformanceLevel = "poor"
      performanceContext = "struggled mightily across all areas"
    }

    // Start with performance assessment
    let summary = `The ${team.team_name} ${performanceContext} during this period, posting a ${team.record.wins}-${team.record.losses}-${team.record.otl} record with a ${team.total_goal_differential >= 0 ? "+" : ""}${team.total_goal_differential} goal differential. `

    // Add match context with storytelling
    const matchNarratives = team.matches.map((match) => {
      const margin = Math.abs(match.goal_differential)
      let narrative = ""

      if (match.result === "W") {
        if (margin >= 3) {
          narrative = `dominated ${match.opponent} ${match.score}`
        } else if (margin === 2) {
          narrative = `controlled the game against ${match.opponent} ${match.score}`
        } else {
          narrative = `edged out ${match.opponent} ${match.score}${match.overtime ? " in overtime" : ""}`
        }
      } else if (match.result === "OTL") {
        narrative = `fell just short against ${match.opponent} ${match.score} in overtime`
      } else {
        if (margin >= 3) {
          narrative = `were overwhelmed by ${match.opponent} ${match.score}`
        } else if (margin === 2) {
          narrative = `couldn't keep pace with ${match.opponent} ${match.score}`
        } else {
          narrative = `lost a tight battle to ${match.opponent} ${match.score}`
        }
      }
      return narrative
    })

    if (matchNarratives.length > 0) {
      summary += `In their recent action, they ${matchNarratives.join(", then ")}. `
    }

    // Analyze roster performance with AI-like insights
    const forwards = team.all_players.filter((p) => ["C", "LW", "RW"].includes(p.position))
    const defense = team.all_players.filter((p) => ["LD", "RD"].includes(p.position))
    const goalies = team.all_players.filter((p) => p.position === "G")

    // Forward analysis with performance context
    if (forwards.length > 0) {
      const forwardAnalysis = forwards
        .map((player) => {
          const performance = getPerformanceLevel(player)
          const ppg = ((player.goals + player.assists) / player.games_played).toFixed(1)
          return { player, performance, ppg: Number.parseFloat(ppg) }
        })
        .sort((a, b) => b.ppg - a.ppg)

      summary += `\n\nOffensive Production: `

      const topForward = forwardAnalysis[0]
      if (topForward.performance.level === "elite" || topForward.performance.level === "excellent") {
        summary += `${topForward.player.player_name} spearheaded the attack with ${topForward.performance.description}, recording ${topForward.ppg} PPG. `
      } else {
        summary += `${topForward.player.player_name} led the forwards with ${topForward.ppg} PPG, though the team needed more offensive firepower. `
      }

      // Analyze supporting cast
      const supportingForwards = forwardAnalysis.slice(1, 3)
      if (supportingForwards.length > 0) {
        const supportingNarrative = supportingForwards
          .map((f) => {
            if (f.performance.level === "excellent" || f.performance.level === "good") {
              return `${f.player.player_name} provided excellent support (${f.ppg} PPG)`
            } else if (f.performance.level === "average") {
              return `${f.player.player_name} contributed adequately (${f.ppg} PPG)`
            } else {
              return `${f.player.player_name} struggled to contribute (${f.ppg} PPG)`
            }
          })
          .join(", while ")

        summary += `${supportingNarrative}. `
      }
    }

    // Defense analysis with two-way focus
    if (defense.length > 0) {
      const defenseAnalysis = defense
        .map((player) => {
          const performance = getPerformanceLevel(player)
          const ppg = ((player.goals + player.assists) / player.games_played).toFixed(1)
          const blocksPerGame = (player.blocks / player.games_played).toFixed(1)
          return { player, performance, ppg: Number.parseFloat(ppg), blocksPerGame: Number.parseFloat(blocksPerGame) }
        })
        .sort((a, b) => b.ppg - a.ppg)

      summary += `\n\nDefensive Corps: `

      const topDefenseman = defenseAnalysis[0]
      if (topDefenseman.performance.level === "elite" || topDefenseman.performance.level === "excellent") {
        summary += `${topDefenseman.player.player_name} anchored the blue line with ${topDefenseman.performance.description}, contributing ${topDefenseman.ppg} PPG while averaging ${topDefenseman.blocksPerGame} blocks per game. `
      } else {
        summary += `${topDefenseman.player.player_name} led the defense with ${topDefenseman.ppg} PPG and ${topDefenseman.blocksPerGame} blocks per game, though the unit needed more consistency. `
      }

      // Analyze defensive depth
      const defensiveDepth = defenseAnalysis.slice(1)
      if (defensiveDepth.length > 0) {
        const avgDefensePPG = defensiveDepth.reduce((sum, d) => sum + d.ppg, 0) / defensiveDepth.length
        if (avgDefensePPG > 1.0) {
          summary += `The supporting defensemen provided strong two-way play, averaging ${avgDefensePPG.toFixed(1)} PPG as a group. `
        } else if (avgDefensePPG > 0.5) {
          summary += `The defensive depth contributed solid support with ${avgDefensePPG.toFixed(1)} PPG from the supporting cast. `
        } else {
          summary += `The defensive depth struggled to contribute offensively, managing only ${avgDefensePPG.toFixed(1)} PPG from the supporting players. `
        }
      }
    }

    // Goaltending analysis with game impact
    if (goalies.length > 0) {
      const goalieAnalysis = goalies
        .map((player) => {
          const performance = getPerformanceLevel(player)
          const savePct =
            player.saves && player.goals_against !== undefined
              ? calculateSavePercentage(player.saves, player.goals_against)
              : 0
          const winsInGames = player.game_stats?.filter((g) => g.result === "W").length || 0
          const winRate = winsInGames / player.games_played
          return { player, performance, savePct, winRate, winsInGames }
        })
        .sort((a, b) => b.savePct - a.savePct)

      summary += `\n\nGoaltending: `

      const primaryGoalie = goalieAnalysis[0]
      if (primaryGoalie.performance.level === "elite" || primaryGoalie.performance.level === "excellent") {
        summary += `${primaryGoalie.player.player_name} was ${primaryGoalie.performance.description}, posting a ${(primaryGoalie.savePct * 100).toFixed(1)}% save percentage while earning ${primaryGoalie.winsInGames} wins in ${primaryGoalie.player.games_played} starts. Their stellar play was a cornerstone of the team's success. `
      } else if (primaryGoalie.performance.level === "good") {
        summary += `${primaryGoalie.player.player_name} provided solid goaltending with a ${(primaryGoalie.savePct * 100).toFixed(1)}% save percentage, going ${primaryGoalie.winsInGames}-${primaryGoalie.player.games_played - primaryGoalie.winsInGames} in their starts. `
      } else {
        summary += `${primaryGoalie.player.player_name} struggled between the pipes with a ${(primaryGoalie.savePct * 100).toFixed(1)}% save percentage, managing only ${primaryGoalie.winsInGames} wins in ${primaryGoalie.player.games_played} starts. The team needed better goaltending to compete. `
      }
    }

    // Team chemistry and special situations analysis
    summary += `\n\nTeam Dynamics: `

    const highTurnoverPlayers = team.callouts.high_turnovers.length
    const strongDefensePlayers = team.callouts.strong_defense.length
    const greatOffensePlayers = team.callouts.great_offense.length
    const fourthForwardDefense = team.callouts.fourth_forward.length

    if (greatOffensePlayers > 0 && strongDefensePlayers > 0) {
      summary += `The team showed excellent balance with ${greatOffensePlayers} players providing elite offensive production and ${strongDefensePlayers} players excelling defensively. `
    } else if (greatOffensePlayers > 0) {
      summary += `The offense carried the team with ${greatOffensePlayers} players providing exceptional scoring, though defensive support was inconsistent. `
    } else if (strongDefensePlayers > 0) {
      summary += `Strong defensive play from ${strongDefensePlayers} players kept games competitive, but the team struggled to generate consistent offense. `
    } else {
      summary += `The team lacked standout performers in key areas, resulting in inconsistent play across all situations. `
    }

    if (fourthForwardDefense > 0) {
      summary += `Notably, ${fourthForwardDefense} defensemen contributed like forwards, providing crucial offensive depth from the blue line. `
    }

    if (highTurnoverPlayers > 0) {
      summary += `However, ${highTurnoverPlayers} players struggled with puck management, leading to unnecessary scoring chances against. `
    }

    // Future outlook with specific recommendations
    summary += `\n\nLooking Ahead: `

    if (teamPerformanceLevel === "dominant" || teamPerformanceLevel === "strong") {
      summary += `The ${team.team_name} are well-positioned for continued success. Key factors for maintaining their level include keeping their top performers healthy and engaged, while continuing to develop their supporting cast. `

      if (team.callouts.underwhelming.length > 0) {
        summary += `If they can get improved contributions from their depth players, they could become even more formidable. `
      }
    } else if (teamPerformanceLevel === "competitive") {
      summary += `The ${team.team_name} have shown they can compete but need more consistency. `

      if (team.top_players.forward && team.top_players.defense) {
        summary += `With ${team.top_players.forward.player_name} and ${team.top_players.defense.player_name} leading the way, they have the foundation for improvement. `
      }

      summary += `Focus areas should include ${team.total_goal_differential < 0 ? "defensive structure and goaltending" : "offensive depth and special teams"}. `
    } else {
      summary += `The ${team.team_name} face significant challenges and need systematic improvements. `

      if (team.callouts.underwhelming.length > 2) {
        summary += `With multiple players underperforming, they need to address both individual skill development and team systems. `
      }

      summary += `Priority areas include ${team.total_goal_differential < -3 ? "defensive fundamentals and goaltending consistency" : "offensive creativity and puck possession"}. `
    }

    console.log(`✅ Generated intelligent team summary for ${team.team_name} (${summary.length} characters)`)
    return summary
  } catch (error) {
    console.error(`❌ Error generating intelligent summary for ${team.team_name}:`, error)
    return `The ${team.team_name} posted a ${team.record.wins}-${team.record.losses}-${team.record.otl} record with a ${team.total_goal_differential >= 0 ? "+" : ""}${team.total_goal_differential} goal differential in recent action. Analysis of individual performances and team dynamics is available in the detailed player breakdowns below.`
  }
}

function generateIntelligentPlayerSummaries(team: TeamRecap): { [playerName: string]: string } {
  const summaries: { [playerName: string]: string } = {}

  try {
    console.log(
      `🧠 Generating intelligent player summaries for ${team.all_players.length} players on ${team.team_name}...`,
    )

    for (const player of team.all_players) {
      // Use the advanced analysis engine but with unique contextual additions
      const baseSummary = generateAdvancedPlayerSummary(player, team.team_name)

      // Add team-specific context and unique insights
      const performance = getPerformanceLevel(player)
      const trends = analyzeGameTrends(player)

      // Add contextual team impact analysis
      let teamImpactAnalysis = ""

      // Analyze how player's performance correlates with team success
      if (player.game_stats && player.game_stats.length > 0) {
        const winsWhenPlayerPerformed = player.game_stats.filter((game) => {
          const points = (game.goals || 0) + (game.assists || 0)
          const performedWell =
            player.position === "G"
              ? game.saves && game.goals_against !== undefined
                ? calculateSavePercentage(game.saves, game.goals_against) > 0.8
                : false
              : points >= (["C", "LW", "RW"].includes(player.position) ? 2 : 1)
          return performedWell && game.result === "W"
        }).length

        const totalGoodPerformances = player.game_stats.filter((game) => {
          const points = (game.goals || 0) + (game.assists || 0)
          return player.position === "G"
            ? game.saves && game.goals_against !== undefined
              ? calculateSavePercentage(game.saves, game.goals_against) > 0.8
              : false
            : points >= (["C", "LW", "RW"].includes(player.position) ? 2 : 1)
        }).length

        if (totalGoodPerformances > 0) {
          const winRateWhenGood = winsWhenPlayerPerformed / totalGoodPerformances
          if (winRateWhenGood > 0.7) {
            teamImpactAnalysis = ` When ${player.player_name} performs well, the ${team.team_name} typically win (${winsWhenPlayerPerformed}/${totalGoodPerformances} games), highlighting their importance to team success.`
          } else if (winRateWhenGood < 0.3) {
            teamImpactAnalysis = ` Despite individual good performances, the team struggled to convert ${player.player_name}'s contributions into wins (${winsWhenPlayerPerformed}/${totalGoodPerformances}), suggesting broader team issues.`
          }
        }
      }

      // Add unique situational analysis
      let situationalAnalysis = ""

      if (player.position !== "G") {
        const giveawaysPerGame = player.giveaways / player.games_played
        const takeawaysPerGame = player.takeaways / player.games_played
        const hitsPerGame = player.hits / player.games_played

        if (giveawaysPerGame > 8 && takeawaysPerGame > 4) {
          situationalAnalysis = ` They play a high-risk, high-reward style with ${giveawaysPerGame.toFixed(1)} giveaways but ${takeawaysPerGame.toFixed(1)} takeaways per game, creating both opportunities and dangers.`
        } else if (hitsPerGame > 15) {
          situationalAnalysis = ` Their physical presence was felt with ${hitsPerGame.toFixed(1)} hits per game, providing intimidation factor and energy for teammates.`
        } else if (player.blocks > 10) {
          situationalAnalysis = ` They sacrificed their body for the team with ${player.blocks} blocked shots, showing commitment to defensive responsibilities.`
        }
      }

      // Add roster role context
      let roleContext = ""
      const teamPosition = team.all_players.filter((p) => p.position === player.position)
      const positionRank =
        teamPosition
          .sort((a, b) => {
            if (player.position === "G") {
              const aSavePct =
                a.saves && a.goals_against !== undefined ? calculateSavePercentage(a.saves, a.goals_against) : 0
              const bSavePct =
                b.saves && b.goals_against !== undefined ? calculateSavePercentage(b.saves, b.goals_against) : 0
              return bSavePct - aSavePct
            } else {
              const aPPG = (a.goals + a.assists) / a.games_played
              const bPPG = (b.goals + b.assists) / a.games_played
              return bPPG - aPPG
            }
          })
          .findIndex((p) => p.player_name === player.player_name) + 1

      if (teamPosition.length > 1) {
        if (positionRank === 1) {
          roleContext = ` As the team's top ${player.position === "G" ? "goaltender" : player.position}, they carry significant responsibility for the team's success.`
        } else if (positionRank === teamPosition.length) {
          roleContext = ` While serving in a depth role among the team's ${player.position}s, their contributions remain valuable to overall team chemistry.`
        }
      }

      // Combine all analyses into a comprehensive, unique summary
      const enhancedSummary = baseSummary + teamImpactAnalysis + situationalAnalysis + roleContext

      summaries[player.player_name] = enhancedSummary
      console.log(`✅ Generated intelligent summary for ${player.player_name} (${enhancedSummary.length} characters)`)
    }
  } catch (error) {
    console.error(`❌ Error generating intelligent player summaries for ${team.team_name}:`, error)
  }

  return summaries
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

  console.log(`🔍 Analyzing ${players.length} players for callouts...`)

  players.forEach((player) => {
    const turnoversPerGame = player.giveaways / player.games_played
    const takeawaysPerGame = player.takeaways / player.games_played
    const ppg = (player.goals + player.assists) / player.games_played

    // High turnovers
    if (turnoversPerGame > 12) {
      callouts.high_turnovers.push(player)
    }

    // Strong defense
    if (takeawaysPerGame > 5) {
      callouts.strong_defense.push(player)
    }

    // Great offense for forwards
    if (["C", "LW", "RW"].includes(player.position) && ppg > 3.5) {
      callouts.great_offense.push(player)
    }

    // 4th Forward for defense
    if (["LD", "RD"].includes(player.position) && ppg > 1.5) {
      callouts.fourth_forward.push(player)
    }

    // Underwhelming performance
    const performance = player.position === "G" ? evaluateGoaliePerformance(player) : evaluateSkaterPerformance(player)

    if (performance === "bad") {
      callouts.underwhelming.push(player)
    }
  })

  console.log(
    `📊 Callouts summary: Great offense: ${callouts.great_offense.length}, 4th Forward: ${callouts.fourth_forward.length}, High turnovers: ${callouts.high_turnovers.length}, Strong defense: ${callouts.strong_defense.length}, Underwhelming: ${callouts.underwhelming.length}`,
  )

  return callouts
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hoursBack = Number.parseInt(searchParams.get("hours") || "24")
    const generationTimestamp = Date.now()

    console.log(`🚀 Starting intelligent daily recap generation for last ${hoursBack} hours...`)

    // Get matches from the specified time window
    const timeWindowAgo = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
    console.log("Looking for matches updated since:", timeWindowAgo)
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
      .gte("updated_at", timeWindowAgo)
      .order("updated_at", { ascending: false })

    console.log("Found matches:", matches?.length || 0)

    if (matchesError) {
      throw new Error(`Error fetching matches: ${matchesError.message}`)
    }

    if (!matches || matches.length === 0) {
      const emptyRecapData: RecapData = {
        date: new Date().toISOString().split("T")[0],
        team_recaps: [],
        best_team: null,
        worst_team: null,
        total_matches: 0,
        time_window_hours: hoursBack,
        generation_timestamp: generationTimestamp,
      }

      return NextResponse.json({
        success: true,
        data: emptyRecapData,
      })
    }

    // Get all teams
    const { data: teams, error: teamsError } = await supabase.from("teams").select("id, name, ea_club_id")

    if (teamsError) {
      throw new Error(`Error fetching teams: ${teamsError.message}`)
    }

    // Create team mapping
    const teamIdToTeam = new Map<string, { id: string; name: string }>()
    teams?.forEach((team) => {
      teamIdToTeam.set(team.id, {
        id: team.id,
        name: team.name,
      })
    })

    // Get player stats
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

    if (statsError) {
      throw new Error(`Error fetching player stats: ${statsError.message}`)
    }

    if (!playerStats || playerStats.length === 0) {
      console.log("No player stats found for the completed matches")
      const emptyRecapData: RecapData = {
        date: new Date().toISOString().split("T")[0],
        team_recaps: [],
        best_team: null,
        worst_team: null,
        total_matches: matches.length,
        time_window_hours: hoursBack,
        generation_timestamp: generationTimestamp,
      }

      return NextResponse.json({
        success: true,
        data: emptyRecapData,
      })
    }

    // Aggregate player stats by team
    const teamPlayerStats = new Map<string, PlayerStats[]>()

    playerStats?.forEach((stat) => {
      const teamInfo = teamIdToTeam.get(stat.team_id)
      if (!teamInfo) return

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

        // Add game stats
        if (!existingPlayer.game_stats) existingPlayer.game_stats = []

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
        // Create new player entry
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
          team_id: teamInfo.id,
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
            result = "L"
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
        all_players: players,
      }

      teamRecaps.push(teamRecap)
    }

    // Generate intelligent summaries for each team
    console.log("🧠 Generating intelligent summaries for", teamRecaps.length, "teams...")
    for (const team of teamRecaps) {
      try {
        // Generate intelligent team summary
        team.summary = generateIntelligentTeamSummary(team)
        console.log(`✅ Generated intelligent summary for ${team.team_name}`)

        // Generate intelligent player summaries
        team.player_summaries = generateIntelligentPlayerSummaries(team)
        console.log(
          `✅ Generated intelligent player summaries for ${team.team_name} (${Object.keys(team.player_summaries).length} players)`,
        )

        console.log(`✅ Team ${team.team_name} has ${team.all_players.length} players in roster`)
      } catch (error) {
        console.error(`❌ Failed to generate intelligent summary for ${team.team_name}:`, error)
        team.player_summaries = {}
      }
    }

    // Find best and worst team performances
    const bestTeam =
      teamRecaps.sort((a, b) => {
        const aRecord = a.record.wins - a.record.losses - a.record.otl
        const bRecord = b.record.wins - b.record.losses - b.record.otl
        if (aRecord !== bRecord) return bRecord - aRecord
        return b.total_goal_differential - a.total_goal_differential
      })[0] || null

    const worstTeam =
      teamRecaps.sort((a, b) => {
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
      time_window_hours: hoursBack,
      generation_timestamp: generationTimestamp,
    }

    console.log(
      `🎉 Successfully generated intelligent daily recap with ${teamRecaps.length} teams and ${matches.length} matches`,
    )

    return NextResponse.json({
      success: true,
      data: recapData,
    })
  } catch (error: any) {
    console.error("❌ Error generating intelligent daily recap:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
