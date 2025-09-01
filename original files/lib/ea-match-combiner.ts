import { mapEaPositionToStandard, getPositionCategory } from "./ea-position-mapper"

export interface EAPlayer {
  playerId: string
  persona?: string
  playername?: string
  goals?: number
  assists?: number
  skgoals?: number
  skassists?: number
  position?: string
  skposition?: string
  [key: string]: any
}

export interface CombinedMatchData {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  period: number
  homeGoalies: EAPlayer[]
  awayGoalies: EAPlayer[]
  homeSkaters: EAPlayer[]
  awaySkaters: EAPlayer[]
  allPlayers: EAPlayer[]
}

export interface EaMatch {
  matchId: string
  timestamp: number
  clubs: {
    [key: string]: EaClub
  }
  players?: {
    [clubId: string]: {
      [playerId: string]: EAPlayer
    }
  }
  [key: string]: any
}

export interface EaClub {
  clubId: string
  name: string
  goals: number
  details: {
    winnerByDnf: boolean
    goals: number
    goalsAgainst: number
    [key: string]: any
  }
  players?: {
    [key: string]: EAPlayer
  }
  ppg?: number
  ppo?: number
  [key: string]: any
}

// EA Position Code to Position Name Mapping
const eaPositionMap = {
  "0": "G",
  "1": "RD",
  "2": "LD",
  "3": "RW",
  "4": "LW",
  "5": "C",
}

// Position to Category Mapping
const positionCategoryMap = {
  RW: "offense",
  LW: "offense",
  C: "offense",
  RD: "defense",
  LD: "defense",
  G: "goalie",
}

/**
 * Enhanced position determination that uses multiple data sources
 */
function determinePlayerPosition(player: any): string {
  // Priority 1: Use posSorted field if available (most accurate)
  if (player.posSorted) {
    if (player.posSorted === "leftDefense") return "LD"
    if (player.posSorted === "rightDefense") return "RD"
    if (player.posSorted === "leftWing") return "LW"
    if (player.posSorted === "rightWing") return "RW"
    if (player.posSorted === "center") return "C"
    if (player.posSorted === "goalie") return "G"
  }

  // Priority 2: Use numeric position codes (most reliable)
  if (player.position !== undefined && player.position !== null) {
    const pos = String(player.position)
    if (pos === "0") return "G"
    if (pos === "1") return "RD"
    if (pos === "2") return "LD"
    if (pos === "3") return "RW"
    if (pos === "4") return "LW"
    if (pos === "5") return "C"
  }

  // Priority 3: Use skposition if available
  if (player.skposition) {
    const mappedSkPosition = mapEaPositionToStandard(player.skposition)
    if (mappedSkPosition && mappedSkPosition !== player.skposition) {
      return mappedSkPosition
    }
  }

  // Priority 4: Try to map the position field as text
  if (player.position && typeof player.position === "string") {
    const mappedPosition = mapEaPositionToStandard(player.position)
    if (mappedPosition && mappedPosition !== player.position) {
      return mappedPosition
    }
  }

  // Priority 5: Check for goalie-specific stats to identify goalies
  if (player.glsaves !== undefined || player.saves !== undefined || player.goalsAgainst !== undefined) {
    return "G"
  }

  // Priority 6: Use category if available
  if (player.category) {
    if (player.category === "goalie") return "G"
    if (player.category === "defense") return "D" // Generic defense as fallback
    if (player.category === "offense") return "C" // Generic center as fallback for offense
  }

  // Priority 7: Look for position-specific stats to infer position
  if (player.skfow !== undefined || player.skfol !== undefined) {
    // Player has faceoff stats, likely a center
    return "C"
  }

  // Last resort: return a generic position based on available stats
  if (player.skgoals !== undefined || player.skassists !== undefined || player.skshots !== undefined) {
    return "F" // Forward if we have offensive stats
  }

  // Absolute last resort
  return "Skater"
}

// Extract players from various EA data structures
export function extractPlayersFromEAData(eaData: any): EAPlayer[] {
  const players: EAPlayer[] = []

  // Handle different possible data structures
  if (eaData.playerStats) {
    // Structure 1: playerStats array
    if (Array.isArray(eaData.playerStats)) {
      players.push(...eaData.playerStats.map(normalizeEAPlayer))
    }
  }

  if (eaData.players) {
    // Structure 2: players object or array
    if (Array.isArray(eaData.players)) {
      players.push(...eaData.players.map(normalizeEAPlayer))
    } else if (typeof eaData.players === "object") {
      // Handle nested player objects
      Object.values(eaData.players).forEach((playerGroup: any) => {
        if (Array.isArray(playerGroup)) {
          players.push(...playerGroup.map(normalizeEAPlayer))
        }
      })
    }
  }

  // Structure 3: Direct array
  if (Array.isArray(eaData)) {
    players.push(...eaData.map(normalizeEAPlayer))
  }

  // Structure 4: Check for home/away team structures
  if (eaData.homeTeam?.players) {
    players.push(...extractPlayersFromTeam(eaData.homeTeam, "home"))
  }
  if (eaData.awayTeam?.players) {
    players.push(...extractPlayersFromTeam(eaData.awayTeam, "away"))
  }

  return players
}

// Extract players from team data
function extractPlayersFromTeam(teamData: any, teamSide: "home" | "away"): EAPlayer[] {
  const players: EAPlayer[] = []

  if (teamData.players) {
    if (Array.isArray(teamData.players)) {
      players.push(
        ...teamData.players.map((player) => ({
          ...normalizeEAPlayer(player),
          teamSide,
        })),
      )
    } else if (typeof teamData.players === "object") {
      Object.values(teamData.players).forEach((playerGroup: any) => {
        if (Array.isArray(playerGroup)) {
          players.push(
            ...playerGroup.map((player) => ({
              ...normalizeEAPlayer(player),
              teamSide,
            })),
          )
        }
      })
    }
  }

  return players
}

// Normalize EA player data to consistent format
function normalizeEAPlayer(player: any): EAPlayer {
  // Determine position using multiple sources
  let position = "C" // default

  // Check PosSorted first (most accurate)
  if (player.posSorted) {
    position = mapEaPositionToStandard(player.posSorted)
  } else if (player.position) {
    position = mapEaPositionToStandard(player.position)
  } else if (player.skposition) {
    position = mapEaPositionToStandard(player.skposition)
  }

  // Determine category
  let category = getPositionCategory(position)

  // Override category if explicitly provided
  if (player.category) {
    category = player.category.toLowerCase()
  }

  return {
    playerId: player.playerId || player.id || "Unknown Player",
    persona: player.persona || player.name || "Unknown Player",
    playername: player.playername || player.name || "Unknown Player",
    goals: player.goals || 0,
    assists: player.assists || 0,
    skgoals: player.skgoals || player.goals || 0,
    skassists: player.skassists || player.assists || 0,
    skpoints: player.skpoints || player.points || (player.skgoals || 0) + (player.skassists || 0),
    skshots: player.skshots || player.shots || 0,
    skhits: player.skhits || player.hits || 0,
    skpim: player.skpim || player.pim || player.penalties || 0,
    skplusmin: player.skplusmin || player.plusminus || 0,
    skfow: player.skfow || player.faceoffwins || 0,
    skfol: player.skfol || player.faceofflosses || 0,
    skfaceoffpct: player.skfaceoffpct || player.faceoffpct || 0,
    sktoi: player.sktoi || player.toi || "0:00",
    // Goalie stats
    glsaves: player.glsaves || player.saves || 0,
    glshots: player.glshots || player.shotsagainst || 0,
    glga: player.glga || player.goalsagainst || 0,
    glsavepct: player.glsavepct || player.savepct || 0,
    glso: player.glso || player.shutouts || 0,
    gltoi: player.gltoi || player.toi || "0:00",
    position,
    category,
  }
}

// Combine EA match data into structured format
export function combineEAMatchData(eaData: any, matchInfo: any): CombinedMatchData {
  const allPlayers = extractPlayersFromEAData(eaData)

  // Separate players by position category
  const goalies = allPlayers.filter((p) => p.category === "goalie")
  const skaters = allPlayers.filter((p) => p.category !== "goalie")

  // If we have team information, separate by team
  let homeGoalies: EAPlayer[] = []
  let awayGoalies: EAPlayer[] = []
  let homeSkaters: EAPlayer[] = []
  let awaySkaters: EAPlayer[] = []

  if (matchInfo?.homeTeam && matchInfo?.awayTeam) {
    // Logic to separate by team would go here
    // For now, we'll split evenly or use team indicators if available
    const midpoint = Math.ceil(goalies.length / 2)
    homeGoalies = goalies.slice(0, midpoint)
    awayGoalies = goalies.slice(midpoint)

    const skaterMidpoint = Math.ceil(skaters.length / 2)
    homeSkaters = skaters.slice(0, skaterMidpoint)
    awaySkaters = skaters.slice(skaterMidpoint)
  } else {
    homeGoalies = goalies
    homeSkaters = skaters
  }

  return {
    matchId: matchInfo?.matchId || "unknown",
    homeTeam: matchInfo?.homeTeam || "Home",
    awayTeam: matchInfo?.awayTeam || "Away",
    homeScore: matchInfo?.homeScore || 0,
    awayScore: matchInfo?.awayScore || 0,
    period: matchInfo?.period || 3,
    homeGoalies,
    awayGoalies,
    homeSkaters,
    awaySkaters,
    allPlayers,
  }
}

// Filter players by position category
export function filterByPositionCategory(players: EAPlayer[], category: "offense" | "defense" | "goalie"): EAPlayer[] {
  return players.filter((player) => {
    const playerCategory = getPositionCategory(player.position)
    return playerCategory === category
  })
}

// Get player statistics summary
export function getPlayerStatsSummary(players: EAPlayer[]) {
  const goalies = players.filter((p) => p.category === "goalie")
  const skaters = players.filter((p) => p.category !== "goalie")

  return {
    totalPlayers: players.length,
    goalies: goalies.length,
    skaters: skaters.length,
    totalGoals: skaters.reduce((sum, p) => sum + (p.skgoals || 0), 0),
    totalAssists: skaters.reduce((sum, p) => sum + (p.skassists || 0), 0),
    totalSaves: goalies.reduce((sum, p) => sum + (p.glsaves || 0), 0),
  }
}

/**
 * Combines multiple EA matches into a single match
 * Uses the most recent match ID and combines all stats
 */
export function combineEaMatches(matches: EaMatch[]): EaMatch | null {
  if (!matches || matches.length === 0) {
    console.warn("No matches provided to combineEaMatches")
    return null
  }

  if (matches.length === 1) {
    console.log("Only one match provided, returning it directly")
    return matches[0]
  }

  console.log(`COMBINING ${matches.length} MATCHES`)

  // Sort matches by timestamp (newest first)
  const sortedMatches = [...matches].sort((a, b) => b.timestamp - a.timestamp)

  // Use the most recent match as the base template
  const mostRecentMatch = sortedMatches[0]
  console.log(`Using most recent match ID: ${mostRecentMatch.matchId}`)

  // Create a deep copy of the most recent match as our base
  const combinedMatch: EaMatch = JSON.parse(JSON.stringify(mostRecentMatch))

  // Add metadata to indicate it's a combined match
  combinedMatch.isCombined = true
  combinedMatch.combinedFrom = matches.map((m) => m.matchId)
  combinedMatch.combinedCount = matches.length
  combinedMatch.originalTimestamp = combinedMatch.timestamp

  // Create a new matchId that indicates it's a combined match
  combinedMatch.matchId = `combined-${matches.map((m) => m.matchId).join("-")}`

  // Initialize a structure to track all clubs across all matches
  const allClubs = new Set<string>()

  // First, identify all unique club IDs across all matches
  matches.forEach((match) => {
    if (match.clubs) {
      Object.keys(match.clubs).forEach((clubId) => {
        allClubs.add(clubId)
      })
    }
  })

  console.log(`Found ${allClubs.size} unique clubs across all matches`)

  // Initialize the clubs structure in the combined match
  if (!combinedMatch.clubs) {
    combinedMatch.clubs = {}
  }

  // Initialize the players structure in the combined match
  if (!combinedMatch.players) {
    combinedMatch.players = {}
  }

  // IMPORTANT: Reset all club stats to zero before combining
  allClubs.forEach((clubId) => {
    if (combinedMatch.clubs[clubId]) {
      // Reset numeric values that will be accumulated
      combinedMatch.clubs[clubId].goals = 0
      combinedMatch.clubs[clubId].ppg = 0
      combinedMatch.clubs[clubId].ppo = 0
      combinedMatch.clubs[clubId].shots = 0
      combinedMatch.clubs[clubId].passa = 0
      combinedMatch.clubs[clubId].passc = 0
      combinedMatch.clubs[clubId].toa = 0
      if (combinedMatch.clubs[clubId].details) {
        combinedMatch.clubs[clubId].details.goals = 0
        combinedMatch.clubs[clubId].details.goalsAgainst = 0
      }
    } else {
      // If this club doesn't exist in the most recent match, find it in another match
      for (const match of matches) {
        if (match.clubs && match.clubs[clubId]) {
          combinedMatch.clubs[clubId] = JSON.parse(JSON.stringify(match.clubs[clubId]))
          // Reset numeric values that will be accumulated
          combinedMatch.clubs[clubId].goals = 0
          combinedMatch.clubs[clubId].ppg = 0
          combinedMatch.clubs[clubId].ppo = 0
          combinedMatch.clubs[clubId].shots = 0
          combinedMatch.clubs[clubId].passa = 0
          combinedMatch.clubs[clubId].passc = 0
          combinedMatch.clubs[clubId].toa = 0
          if (combinedMatch.clubs[clubId].details) {
            combinedMatch.clubs[clubId].details.goals = 0
            combinedMatch.clubs[clubId].details.goalsAgainst = 0
          }
          break
        }
      }
    }

    // Initialize the players structure for this club
    if (!combinedMatch.players[clubId]) {
      combinedMatch.players[clubId] = {}
    }
  })

  // For each club, combine stats across all matches
  allClubs.forEach((clubId) => {
    // Skip if we couldn't initialize this club
    if (!combinedMatch.clubs[clubId]) {
      console.warn(`Could not initialize club ${clubId} in combined match`)
      return
    }

    const combinedClub = combinedMatch.clubs[clubId]
    let totalClubGoals = 0
    let totalClubGoalsAgainst = 0
    let totalPpg = 0
    let totalPpo = 0
    let totalShots = 0
    let totalPassa = 0
    let totalPassc = 0
    let totalToa = 0

    // Combine club stats from all matches
    matches.forEach((match) => {
      if (!match.clubs || !match.clubs[clubId]) return

      const currentClub = match.clubs[clubId]

      // Combine club-level stats - ensure we're working with numbers
      const clubGoals = Number(currentClub.goals || currentClub.details?.goals || 0)
      const clubGoalsAgainst = Number(currentClub.details?.goalsAgainst || 0)
      const clubPpg = Number(currentClub.ppg || 0)
      const clubPpo = Number(currentClub.ppo || 0)
      const clubShots = Number(currentClub.shots || 0)
      const clubPassa = Number(currentClub.passa || 0)
      const clubPassc = Number(currentClub.passc || 0)
      const clubToa = Number(currentClub.toa || 0)

      totalClubGoals += clubGoals
      totalClubGoalsAgainst += clubGoalsAgainst
      totalPpg += clubPpg
      totalPpo += clubPpo
      totalShots += clubShots
      totalPassa += clubPassa
      totalPassc += clubPassc
      totalToa += clubToa

      console.log(`Adding stats for club ${clubId} from match ${match.matchId}:`, {
        goals: clubGoals,
        ppg: clubPpg,
        ppo: clubPpo,
        shots: clubShots,
      })
    })

    // Update the club with the combined totals
    combinedClub.goals = totalClubGoals
    combinedClub.ppg = totalPpg
    combinedClub.ppo = totalPpo
    combinedClub.shots = totalShots
    combinedClub.passa = totalPassa
    combinedClub.passc = totalPassc
    combinedClub.toa = totalToa

    if (combinedClub.details) {
      combinedClub.details.goals = totalClubGoals
      combinedClub.details.goalsAgainst = totalClubGoalsAgainst
    }

    console.log(`Club ${clubId} combined totals:`, {
      goals: totalClubGoals,
      goalsAgainst: totalClubGoalsAgainst,
      ppg: totalPpg,
      ppo: totalPpo,
      shots: totalShots,
    })
  })

  // Use a map to track players by persona/name across all matches
  const playerStatsByKey = new Map<string, any>()

  // Process all matches to combine player stats
  matches.forEach((match, matchIndex) => {
    console.log(`Processing match ${matchIndex + 1}/${matches.length}: ${match.matchId}`)

    // Process players from the top-level players structure
    if (match.players) {
      Object.keys(match.players).forEach((clubId) => {
        const clubPlayers = match.players?.[clubId]
        if (!clubPlayers) return

        // Process each player in this club
        Object.entries(clubPlayers).forEach(([playerId, player]) => {
          if (!player) return

          // Create a unique key for this player - use persona/playername and clubId to identify players across matches
          const playerName = player.persona || player.playername || `Player ${playerId}`
          const playerKey = `${clubId}:${playerName.toLowerCase()}`

          // Get or create player stats
          let playerStats = playerStatsByKey.get(playerKey)
          if (!playerStats) {
            // Initialize a new player record - PRESERVE ORIGINAL POSITION DATA
            playerStats = {
              playerId: playerId,
              persona: playerName,
              playername: playerName,
              // CRITICAL: Preserve the original position data from the first match
              position: player.position,
              skposition: player.skposition,
              posSorted: player.posSorted,
              category: player.category,
              // Initialize all stats to 0
              skgoals: 0,
              skassists: 0,
              skshots: 0,
              skhits: 0,
              skpim: 0,
              skplusmin: 0,
              skbs: 0,
              sktakeaways: 0,
              skgiveaways: 0,
              skpasspct: 0,
              skshotattempts: 0,
              skshotpct: 0,
              skpassattempts: 0,
              skpasses: 0,
              skfow: 0,
              skfol: 0,
              skinterceptions: 0,
              skpossession: 0,
              skpenaltiesdrawn: 0,
              skppg: 0,
              skshg: 0,
              skgwg: 0,
              pkclearzone: 0,
              // Goalie stats
              glsavepct: 0,
              glsaves: 0,
              glga: 0,
              glbrksaves: 0,
              glbrkshots: 0,
              glpensaves: 0,
              glpenshots: 0,
              toiseconds: 0,
              // Set games_played to 1 since we're treating combined matches as a single game
              games_played: 1,
            }
            playerStatsByKey.set(playerKey, playerStats)
            console.log(
              `Initialized player ${playerName} with position: ${player.position}, skposition: ${player.skposition}, posSorted: ${player.posSorted}`,
            )
          } else {
            // If we don't have position data yet, try to get it from this match
            if (!playerStats.position && player.position) {
              playerStats.position = player.position
              console.log(`Updated player ${playerName} position to: ${player.position}`)
            }
            if (!playerStats.skposition && player.skposition) {
              playerStats.skposition = player.skposition
            }
            if (!playerStats.posSorted && player.posSorted) {
              playerStats.posSorted = player.posSorted
            }
            if (!playerStats.category && player.category) {
              playerStats.category = player.category
            }
          }

          // Add all numeric stats with 'sk' or 'gl' prefix
          Object.keys(player).forEach((statKey) => {
            if (
              statKey.startsWith("sk") ||
              statKey.startsWith("gl") ||
              statKey === "pkclearzone" ||
              statKey === "toiseconds"
            ) {
              const statValue = Number(player[statKey] || 0)
              playerStats[statKey] = (playerStats[statKey] || 0) + statValue

              // Log significant stats for debugging
              if (
                statKey === "skgoals" ||
                statKey === "skassists" ||
                statKey === "skshots" ||
                statKey === "glsaves" ||
                statKey === "glga" ||
                statKey === "glshots"
              ) {
                console.log(`  Adding ${statValue} ${statKey} for player ${playerName} from match ${match.matchId}`)
              }
            }
          })

          // Add specifically named stats that might not have 'sk' prefix
          if (player.goals !== undefined) {
            const goals = Number(player.goals || 0)
            playerStats.skgoals = (playerStats.skgoals || 0) + goals
            console.log(`  Adding ${goals} goals for player ${playerName} from match ${match.matchId}`)
          }
          if (player.assists !== undefined) {
            const assists = Number(player.assists || 0)
            playerStats.skassists = (playerStats.skassists || 0) + assists
            console.log(`  Adding ${assists} assists for player ${playerName} from match ${match.matchId}`)
          }
          if (player.shots !== undefined) {
            playerStats.skshots = (playerStats.skshots || 0) + Number(player.shots || 0)
          }
          if (player.hits !== undefined) {
            playerStats.skhits = (playerStats.skhits || 0) + Number(player.hits || 0)
          }
          if (player.blocks !== undefined) {
            playerStats.skbs = (playerStats.skbs || 0) + Number(player.blocks || 0)
          }
          if (player.takeaways !== undefined) {
            playerStats.sktakeaways = (playerStats.sktakeaways || 0) + Number(player.takeaways || 0)
          }
          if (player.giveaways !== undefined) {
            playerStats.skgiveaways = (playerStats.skgiveaways || 0) + Number(player.giveaways || 0)
          }
          if (player.plusMinus !== undefined) {
            playerStats.skplusmin = (playerStats.skplusmin || 0) + Number(player.plusMinus || 0)
          }
          if (player.pim !== undefined) {
            playerStats.skpim = (playerStats.skpim || 0) + Number(player.pim || 0)
          }
          if (player.timeOnIce !== undefined) {
            playerStats.toiseconds = (playerStats.toiseconds || 0) + Number(player.timeOnIce || 0)
          }

          // Add goalie-specific stats if they exist
          if (
            player.position === "G" ||
            player.position === "Goalie" ||
            player.position === "goalie" ||
            player.position === "0"
          ) {
            if (player.saves !== undefined) {
              const saves = Number(player.saves || 0)
              playerStats.glsaves = (playerStats.glsaves || 0) + saves
              console.log(`  Adding ${saves} saves for goalie ${playerName} from match ${match.matchId}`)
            }
            if (player.goalsAgainst !== undefined) {
              const goalsAgainst = Number(player.goalsAgainst || 0)
              playerStats.glga = (playerStats.glga || 0) + goalsAgainst
              console.log(`  Adding ${goalsAgainst} goals against for goalie ${playerName} from match ${match.matchId}`)
            }
            if (player.shotsAgainst !== undefined) {
              playerStats.glshots = (playerStats.glshots || 0) + Number(player.shotsAgainst || 0)
            }
            if (player.breakawaySaves !== undefined) {
              playerStats.glbrksaves = (playerStats.glbrksaves || 0) + Number(player.breakawaySaves || 0)
            }
            if (player.breakawayShots !== undefined) {
              playerStats.glbrkshots = (playerStats.glbrkshots || 0) + Number(player.breakawayShots || 0)
            }
            if (player.penaltySaves !== undefined) {
              playerStats.glpensaves = (playerStats.glpensaves || 0) + Number(player.penaltySaves || 0)
            }
            if (player.penaltyShots !== undefined) {
              playerStats.glpenshots = (playerStats.glpenshots || 0) + Number(player.penaltyShots || 0)
            }
          }
        })
      })
    }

    // Also process players in club structure
    if (match.clubs) {
      Object.keys(match.clubs).forEach((clubId) => {
        const club = match.clubs[clubId]
        if (!club.players) return

        // Process each player in this club
        Object.entries(club.players).forEach(([playerId, player]) => {
          if (!player) return

          // Create a unique key for this player
          const playerName = player.persona || player.playername || `Player ${playerId}`
          const playerKey = `${clubId}:${playerName.toLowerCase()}`

          // Get or create player stats
          let playerStats = playerStatsByKey.get(playerKey)
          if (!playerStats) {
            // Initialize a new player record - PRESERVE ORIGINAL POSITION DATA
            playerStats = {
              playerId: playerId,
              persona: playerName,
              playername: playerName,
              // CRITICAL: Preserve the original position data from the first match
              position: player.position,
              skposition: player.skposition,
              posSorted: player.posSorted,
              category: player.category,
              // Initialize all stats to 0
              skgoals: 0,
              skassists: 0,
              skshots: 0,
              skhits: 0,
              skpim: 0,
              skplusmin: 0,
              skbs: 0,
              sktakeaways: 0,
              skgiveaways: 0,
              skpasspct: 0,
              skshotattempts: 0,
              skshotpct: 0,
              skpassattempts: 0,
              skpasses: 0,
              skfow: 0,
              skfol: 0,
              skinterceptions: 0,
              skpossession: 0,
              skpenaltiesdrawn: 0,
              skppg: 0,
              skshg: 0,
              skgwg: 0,
              pkclearzone: 0,
              // Goalie stats
              glsavepct: 0,
              glsaves: 0,
              glga: 0,
              glbrksaves: 0,
              glbrkshots: 0,
              glpensaves: 0,
              glpenshots: 0,
              toiseconds: 0,
              // Set games_played to 1 since we're treating combined matches as a single game
              games_played: 1,
            }
            playerStatsByKey.set(playerKey, playerStats)
            console.log(
              `Initialized player ${playerName} from club with position: ${player.position}, skposition: ${player.skposition}, posSorted: ${player.posSorted}`,
            )
          } else {
            // If we don't have position data yet, try to get it from this match
            if (!playerStats.position && player.position) {
              playerStats.position = player.position
              console.log(`Updated player ${playerName} position to: ${player.position}`)
            }
            if (!playerStats.skposition && player.skposition) {
              playerStats.skposition = player.skposition
            }
            if (!playerStats.posSorted && player.posSorted) {
              playerStats.posSorted = player.posSorted
            }
            if (!playerStats.category && player.category) {
              playerStats.category = player.category
            }
          }

          // Add all numeric stats with 'sk' or 'gl' prefix
          Object.keys(player).forEach((statKey) => {
            if (
              statKey.startsWith("sk") ||
              statKey.startsWith("gl") ||
              statKey === "pkclearzone" ||
              statKey === "toiseconds"
            ) {
              const statValue = Number(player[statKey] || 0)
              playerStats[statKey] = (playerStats[statKey] || 0) + statValue

              // Log significant stats for debugging
              if (
                statKey === "skgoals" ||
                statKey === "skassists" ||
                statKey === "skshots" ||
                statKey === "glsaves" ||
                statKey === "glga" ||
                statKey === "glshots"
              ) {
                console.log(`  Adding ${statValue} ${statKey} for player ${playerName} from match ${match.matchId}`)
              }
            }
          })

          // Add specifically named stats that might not have 'sk' prefix
          if (player.goals !== undefined) {
            const goals = Number(player.goals || 0)
            playerStats.skgoals = (playerStats.skgoals || 0) + goals
            console.log(`  Adding ${goals} goals for player ${playerName} from match ${match.matchId}`)
          }
          if (player.assists !== undefined) {
            const assists = Number(player.assists || 0)
            playerStats.skassists = (playerStats.skassists || 0) + assists
            console.log(`  Adding ${assists} assists for player ${playerName} from match ${match.matchId}`)
          }
          if (player.shots !== undefined) {
            playerStats.skshots = (playerStats.skshots || 0) + Number(player.shots || 0)
          }
          if (player.hits !== undefined) {
            playerStats.skhits = (playerStats.skhits || 0) + Number(player.hits || 0)
          }
          if (player.blocks !== undefined) {
            playerStats.skbs = (playerStats.skbs || 0) + Number(player.blocks || 0)
          }
          if (player.takeaways !== undefined) {
            playerStats.sktakeaways = (playerStats.sktakeaways || 0) + Number(player.takeaways || 0)
          }
          if (player.giveaways !== undefined) {
            playerStats.skgiveaways = (playerStats.skgiveaways || 0) + Number(player.giveaways || 0)
          }
          if (player.plusMinus !== undefined) {
            playerStats.skplusmin = (playerStats.skplusmin || 0) + Number(player.plusMinus || 0)
          }
          if (player.pim !== undefined) {
            playerStats.skpim = (playerStats.skpim || 0) + Number(player.pim || 0)
          }
          if (player.timeOnIce !== undefined) {
            playerStats.toiseconds = (playerStats.toiseconds || 0) + Number(player.timeOnIce || 0)
          }

          // Add goalie-specific stats
          if (
            player.position === "G" ||
            player.position === "Goalie" ||
            player.position === "goalie" ||
            player.position === "0"
          ) {
            // Accumulate goalie stats
            if (player.saves !== undefined) {
              playerStats.glsaves = (playerStats.glsaves || 0) + Number(player.saves || 0)
            }
            if (player.goalsAgainst !== undefined) {
              playerStats.glga = (playerStats.glga || 0) + Number(player.goalsAgainst || 0)
            }
            if (player.shotsAgainst !== undefined) {
              playerStats.glshots = (playerStats.glshots || 0) + Number(player.shotsAgainst || 0)
            }
          }

          // Update the player in the map
          playerStatsByKey.set(playerKey, playerStats)
        })
      })
    }
  })

  console.log(`Combined ${playerStatsByKey.size} unique players across all matches`)

  // Now that we have combined all player stats, recalculate percentages and add players to combined match
  playerStatsByKey.forEach((player, key) => {
    const [clubId, playerNameLower] = key.split(":")

    // Recalculate shot percentage
    if (player.skshots > 0 && player.skgoals >= 0) {
      player.skshotpct = ((player.skgoals / player.skshots) * 100).toFixed(2)
    }

    // Recalculate passing percentage
    if (player.skpassattempts > 0 && player.skpasses >= 0) {
      player.skpasspct = ((player.skpasses / player.skpassattempts) * 100).toFixed(2)
    }

    // Recalculate faceoff percentage
    if (player.skfow + player.skfol > 0) {
      player.skfopct = ((player.skfow / (player.skfow + player.skfol)) * 100).toFixed(2)
    }

    // Recalculate goalie save percentage
    if (player.position === "G" && player.glsaves > 0 && player.glsaves + player.glga > 0) {
      player.glsavepct = ((player.glsaves / (player.glsaves + player.glga)) * 100).toFixed(2)
    }

    // ONLY determine position if we don't already have one from the original data
    if (!player.position || player.position === "Skater") {
      player.position = determinePlayerPosition(player)
      console.log(`Determined position for ${player.persona}: ${player.position}`)
    }

    // Add position category based on EA position code or name
    if (player.position) {
      if (
        player.position === "G" ||
        player.position === "Goalie" ||
        player.position === "goalie" ||
        player.position === "0"
      ) {
        player.category = "goalie"
      } else if (
        player.position === "RD" ||
        player.position === "LD" ||
        player.position === "defenseMen" ||
        player.position === "defensemen" ||
        player.position === "1" ||
        player.position === "2"
      ) {
        player.category = "defense"
      } else {
        player.category = "offense"
      }
    }

    // Ensure the club object exists in the combined match
    if (!combinedMatch.players[clubId]) {
      combinedMatch.players[clubId] = {}
    }

    // Generate a unique ID for this player in the combined match
    const combinedPlayerId = player.playerId || `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Add the player to the combined match
    combinedMatch.players[clubId][combinedPlayerId] = player

    // Log the player stats for verification
    console.log(
      `Final: Player ${player.persona} in club ${clubId}: ${player.skgoals || 0} goals, ${
        player.skassists || 0
      } assists, ${player.skshots || 0} shots, Position: ${player.position}`,
    )
  })

  return combinedMatch
}
