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

interface TeamRecap {
  team_name: string
  team_id: string
  record: { wins: number; losses: number; otl: number }
  matches: any[]
  total_goal_differential: number
  top_players: any
  worst_players: any
  callouts: any
  all_players: PlayerStats[]
  summary?: string
  player_summaries?: { [playerName: string]: string }
}

function calculateSavePercentage(saves: number, goals_against: number): number {
  const totalShots = saves + goals_against
  if (totalShots === 0) return 0
  return saves / totalShots
}

function getPerformanceLevel(player: PlayerStats): {
  level: "elite" | "excellent" | "good" | "average" | "poor" | "terrible"
  description: string
  context: string
} {
  const ppg = (player.goals + player.assists) / player.games_played
  const isForward = ["C", "LW", "RW"].includes(player.position)
  const isDefense = ["LD", "RD"].includes(player.position)
  const isGoalie = player.position === "G"

  if (isGoalie) {
    if (!player.saves || !player.goals_against) {
      return {
        level: "terrible",
        description: "no meaningful stats recorded",
        context: "Unable to evaluate goaltending performance due to lack of data",
      }
    }

    const savePct = calculateSavePercentage(player.saves, player.goals_against)
    const winsInGames = player.game_stats?.filter((g) => g.result === "W").length || 0
    const winRate = winsInGames / player.games_played

    if (savePct >= 0.9) {
      return {
        level: "elite",
        description: "dominant goaltending with exceptional save percentage",
        context: `Posting a stellar ${(savePct * 100).toFixed(1)}% save percentage${winRate > 0.7 ? " while leading the team to victory in most games" : ""}`,
      }
    } else if (savePct >= 0.85) {
      return {
        level: "excellent",
        description: "outstanding goaltending performance",
        context: `Strong ${(savePct * 100).toFixed(1)}% save percentage${winRate > 0.6 ? " with solid team results" : " despite some tough losses"}`,
      }
    } else if (savePct >= 0.8) {
      return {
        level: "good",
        description: "solid goaltending with room for improvement",
        context: `Respectable ${(savePct * 100).toFixed(1)}% save percentage${winRate < 0.4 ? " but struggled to get wins for the team" : ""}`,
      }
    } else if (savePct >= 0.75) {
      return {
        level: "average",
        description: "inconsistent goaltending",
        context: `Below-average ${(savePct * 100).toFixed(1)}% save percentage${winRate < 0.3 ? " contributing to team struggles" : ""}`,
      }
    } else if (savePct >= 0.7) {
      return {
        level: "poor",
        description: "struggled significantly in net",
        context: `Poor ${(savePct * 100).toFixed(1)}% save percentage, letting in too many soft goals`,
      }
    } else {
      return {
        level: "terrible",
        description: "disastrous goaltending performance",
        context: `Terrible ${(savePct * 100).toFixed(1)}% save percentage, major liability for the team`,
      }
    }
  }

  if (isForward) {
    if (ppg >= 5.0) {
      return {
        level: "elite",
        description: "absolutely dominant offensive force",
        context: `Incredible ${ppg.toFixed(1)} PPG production, carrying the team offensively`,
      }
    } else if (ppg >= 4.0) {
      return {
        level: "excellent",
        description: "exceptional offensive production",
        context: `Outstanding ${ppg.toFixed(1)} PPG, one of the team's key offensive weapons`,
      }
    } else if (ppg >= 3.0) {
      return {
        level: "good",
        description: "solid offensive contributor",
        context: `Good ${ppg.toFixed(1)} PPG production, reliable offensive presence`,
      }
    } else if (ppg >= 2.0) {
      return {
        level: "average",
        description: "decent offensive output",
        context: `Average ${ppg.toFixed(1)} PPG, contributing but not spectacular`,
      }
    } else if (ppg >= 1.0) {
      return {
        level: "poor",
        description: "struggling offensively",
        context: `Low ${ppg.toFixed(1)} PPG, needs to step up production significantly`,
      }
    } else {
      return {
        level: "terrible",
        description: "offensive liability",
        context: `Terrible ${ppg.toFixed(1)} PPG, failing to contribute meaningfully`,
      }
    }
  }

  if (isDefense) {
    if (ppg >= 2.5) {
      return {
        level: "elite",
        description: "playing like a superstar forward from the blue line",
        context: `Incredible ${ppg.toFixed(1)} PPG from defense, absolutely dominating both ends`,
      }
    } else if (ppg >= 2.0) {
      return {
        level: "excellent",
        description: "exceptional two-way defenseman",
        context: `Outstanding ${ppg.toFixed(1)} PPG, playing like a 4th forward while maintaining defensive duties`,
      }
    } else if (ppg >= 1.5) {
      return {
        level: "good",
        description: "strong offensive defenseman",
        context: `Solid ${ppg.toFixed(1)} PPG from the blue line, excellent two-way play`,
      }
    } else if (ppg >= 1.0) {
      return {
        level: "average",
        description: "decent two-way play",
        context: `Respectable ${ppg.toFixed(1)} PPG, doing their job adequately`,
      }
    } else if (ppg >= 0.5) {
      return {
        level: "poor",
        description: "struggling to contribute offensively",
        context: `Low ${ppg.toFixed(1)} PPG, needs to be more involved in the offense`,
      }
    } else {
      return {
        level: "terrible",
        description: "defensive liability",
        context: `Terrible ${ppg.toFixed(1)} PPG, struggling in their own end and providing no offense`,
      }
    }
  }

  return {
    level: "average",
    description: "standard performance",
    context: "Performing at expected levels",
  }
}

function analyzeGameTrends(player: PlayerStats): string {
  if (!player.game_stats || player.game_stats.length === 0) {
    return "No game-by-game data available for trend analysis."
  }

  const games = player.game_stats
  const isGoalie = player.position === "G"

  if (isGoalie) {
    const savePcts = games.map((g) => {
      if (g.saves && g.goals_against !== undefined) {
        return calculateSavePercentage(g.saves, g.goals_against)
      }
      return 0
    })

    const avgSavePct = savePcts.reduce((a, b) => a + b, 0) / savePcts.length
    const wins = games.filter((g) => g.result === "W").length
    const winRate = wins / games.length

    let trend = ""
    if (savePcts.length > 1) {
      const firstHalf = savePcts.slice(0, Math.ceil(savePcts.length / 2))
      const secondHalf = savePcts.slice(Math.ceil(savePcts.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      if (secondAvg > firstAvg + 0.05) {
        trend = "Trending upward with improving save percentage as games progressed. "
      } else if (firstAvg > secondAvg + 0.05) {
        trend = "Concerning downward trend in save percentage over recent games. "
      } else {
        trend = "Maintained consistent performance throughout the period. "
      }
    }

    return `${trend}Posted ${(avgSavePct * 100).toFixed(1)}% save percentage with ${wins}/${games.length} wins. ${winRate > 0.6 ? "Strong team results when in net." : "Team struggled to get wins despite goaltending efforts."}`
  } else {
    const pointsPerGame = games.map((g) => (g.goals || 0) + (g.assists || 0))
    const avgPoints = pointsPerGame.reduce((a, b) => a + b, 0) / pointsPerGame.length
    const wins = games.filter((g) => g.result === "W").length
    const winRate = wins / games.length

    let trend = ""
    if (pointsPerGame.length > 1) {
      const firstHalf = pointsPerGame.slice(0, Math.ceil(pointsPerGame.length / 2))
      const secondHalf = pointsPerGame.slice(Math.ceil(pointsPerGame.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      if (secondAvg > firstAvg + 0.5) {
        trend = "Heating up with improved production in recent games. "
      } else if (firstAvg > secondAvg + 0.5) {
        trend = "Cooling off after a strong start to the period. "
      } else {
        trend = "Maintained steady production throughout. "
      }
    }

    const bestGame = games.reduce((best, current) => {
      const bestPts = (best.goals || 0) + (best.assists || 0)
      const currentPts = (current.goals || 0) + (current.assists || 0)
      return currentPts > bestPts ? current : best
    })

    const worstGame = games.reduce((worst, current) => {
      const worstPts = (worst.goals || 0) + (worst.assists || 0)
      const currentPts = (current.goals || 0) + (current.assists || 0)
      return currentPts < worstPts ? current : worst
    })

    return `${trend}Averaged ${avgPoints.toFixed(1)} points per game with team going ${wins}-${games.length - wins} when they played. Best game: ${bestGame.goals || 0}G ${bestGame.assists || 0}A vs ${bestGame.opponent} (${bestGame.result}). ${games.length > 1 ? `Worst game: ${worstGame.goals || 0}G ${worstGame.assists || 0}A vs ${worstGame.opponent} (${worstGame.result}).` : ""}`
  }
}

function generateAdvancedPlayerSummary(player: PlayerStats, teamName: string): string {
  const performance = getPerformanceLevel(player)
  const trends = analyzeGameTrends(player)
  const ppg = ((player.goals + player.assists) / player.games_played).toFixed(1)
  const plusMinus = player.plus_minus >= 0 ? `+${player.plus_minus}` : `${player.plus_minus}`

  // Start with performance assessment
  let summary = `${player.player_name} (${player.position}) had a ${performance.level} performance for the ${teamName} over ${player.games_played} game${player.games_played > 1 ? "s" : ""}. `

  // Add context based on position and performance
  if (player.position === "G") {
    const savePct =
      player.saves && player.goals_against !== undefined
        ? calculateSavePercentage(player.saves, player.goals_against)
        : 0

    summary += `${performance.context}. Between the pipes, they ${performance.level === "elite" || performance.level === "excellent" ? "stood tall" : performance.level === "good" ? "held their own" : "struggled"} with ${player.saves || 0} saves and ${player.goals_against || 0} goals against. `

    if (performance.level === "elite" || performance.level === "excellent") {
      summary +=
        "Their goaltending was a major factor in keeping games competitive and giving the team a chance to win. "
    } else if (performance.level === "poor" || performance.level === "terrible") {
      summary += "The team needed better goaltending to be competitive in these matchups. "
    }
  } else {
    summary += `${performance.context}. `

    // Add offensive analysis
    if (["C", "LW", "RW"].includes(player.position)) {
      summary += `As a forward, they recorded ${player.goals} goals and ${player.assists} assists (${ppg} PPG) with a ${plusMinus} plus/minus rating. `

      if (performance.level === "elite" || performance.level === "excellent") {
        summary +=
          "Their offensive production was crucial to the team's success and they consistently created scoring opportunities. "
      } else if (performance.level === "poor" || performance.level === "terrible") {
        summary += "The team needed more offensive contribution from this position to be competitive. "
      }
    } else if (["LD", "RD"].includes(player.position)) {
      summary += `From the blue line, they contributed ${player.goals} goals and ${player.assists} assists (${ppg} PPG) while recording ${player.blocks} blocks and ${player.takeaways} takeaways. `

      if (performance.level === "elite" || performance.level === "excellent") {
        summary += "Their two-way play was exceptional, contributing significantly on both offense and defense. "
      } else if (performance.level === "poor" || performance.level === "terrible") {
        summary += "They struggled to make an impact on either end of the ice. "
      }
    }

    // Add discipline and physical play context
    if (player.pim > 10) {
      summary += `However, they spent considerable time in the penalty box with ${player.pim} penalty minutes, which hurt the team's momentum. `
    } else if (player.hits > 20) {
      summary += `They played a physical game with ${player.hits} hits, bringing energy and intimidation factor. `
    }

    // Add turnover analysis
    const giveawaysPerGame = player.giveaways / player.games_played
    const takeawaysPerGame = player.takeaways / player.games_played

    if (giveawaysPerGame > 8) {
      summary += `A concerning aspect was their ${player.giveaways} giveaways (${giveawaysPerGame.toFixed(1)} per game), which led to scoring chances for opponents. `
    } else if (takeawaysPerGame > 4) {
      summary += `They were excellent defensively with ${player.takeaways} takeaways (${takeawaysPerGame.toFixed(1)} per game), disrupting opponent attacks. `
    }
  }

  // Add game-by-game trends
  summary += trends + " "

  // Add outlook based on performance
  if (performance.level === "elite" || performance.level === "excellent") {
    summary += "If they can maintain this level of play, they'll be a key factor in the team's continued success."
  } else if (performance.level === "good") {
    summary += "Solid contributor who the team can rely on for consistent performance."
  } else if (performance.level === "average") {
    summary += "Has the potential to be more impactful with some adjustments to their game."
  } else {
    summary += "Needs significant improvement to help the team compete at a higher level."
  }

  return summary
}

export { generateAdvancedPlayerSummary, getPerformanceLevel, analyzeGameTrends }
