/**
 * EA Match Template and Validation Functions
 * Provides templates and utilities for working with EA Sports NHL match data
 */

export interface EAMatchTemplate {
  matchId: string
  timestamp: number
  clubs: {
    [clubId: string]: EAClubTemplate
  }
  players: {
    [clubId: string]: {
      [playerId: string]: EAPlayerTemplate
    }
  }
}

export interface EAClubTemplate {
  clubId: string
  name: string
  goals: number
  shots: number
  ppg: number
  ppo: number
  passa: number
  passc: number
  toa: number
  details: {
    winnerByDnf: boolean
    goals: number
    goalsAgainst: number
  }
}

export interface EAPlayerTemplate {
  playerId: string
  persona: string
  playername: string
  position: string
  skposition?: string
  posSorted?: string
  category: string
  // Skater stats
  skgoals: number
  skassists: number
  skshots: number
  skhits: number
  skpim: number
  skplusmin: number
  skbs: number
  sktakeaways: number
  skgiveaways: number
  skpasspct: number
  skshotattempts: number
  skshotpct: number
  skpassattempts: number
  skpasses: number
  skfow: number
  skfol: number
  skfopct: number
  skinterceptions: number
  skpossession: number
  skpenaltiesdrawn: number
  skppg: number
  skshg: number
  skgwg: number
  pkclearzone: number
  toiseconds: number
  games_played: number
  // Goalie stats (only for goalies)
  glsavepct?: number
  glsaves?: number
  glga?: number
  glshots?: number
  glbrksaves?: number
  glbrkshots?: number
  glpensaves?: number
  glpenshots?: number
  glso?: number
}

/**
 * Create a template for an EA skater with default values
 */
export function createSkaterTemplate(playerId: string, playerName: string, position = "C"): EAPlayerTemplate {
  return {
    playerId,
    persona: playerName,
    playername: playerName,
    position,
    category: getPositionCategory(position),
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
    skfopct: 0,
    skinterceptions: 0,
    skpossession: 0,
    skpenaltiesdrawn: 0,
    skppg: 0,
    skshg: 0,
    skgwg: 0,
    pkclearzone: 0,
    toiseconds: 0,
    games_played: 1,
  }
}

/**
 * Create a template for an EA goalie with default values
 */
export function createGoalieTemplate(playerId: string, playerName: string): EAPlayerTemplate {
  return {
    playerId,
    persona: playerName,
    playername: playerName,
    position: "G",
    category: "goalie",
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
    skfopct: 0,
    skinterceptions: 0,
    skpossession: 0,
    skpenaltiesdrawn: 0,
    skppg: 0,
    skshg: 0,
    skgwg: 0,
    pkclearzone: 0,
    toiseconds: 0,
    games_played: 1,
    // Goalie-specific stats
    glsavepct: 0,
    glsaves: 0,
    glga: 0,
    glshots: 0,
    glbrksaves: 0,
    glbrkshots: 0,
    glpensaves: 0,
    glpenshots: 0,
    glso: 0,
  }
}

/**
 * Create a template for an EA club with default values
 */
export function createClubTemplate(clubId: string, clubName: string): EAClubTemplate {
  return {
    clubId,
    name: clubName,
    goals: 0,
    shots: 0,
    ppg: 0,
    ppo: 0,
    passa: 0,
    passc: 0,
    toa: 0,
    details: {
      winnerByDnf: false,
      goals: 0,
      goalsAgainst: 0,
    },
  }
}

/**
 * Create a complete EA match template
 */
export function createMatchTemplate(
  matchId: string,
  homeClub: EAClubTemplate,
  awayClub: EAClubTemplate,
): EAMatchTemplate {
  return {
    matchId,
    timestamp: Date.now(),
    clubs: {
      [homeClub.clubId]: homeClub,
      [awayClub.clubId]: awayClub,
    },
    players: {
      [homeClub.clubId]: {},
      [awayClub.clubId]: {},
    },
  }
}

/**
 * Get position category based on position string
 */
function getPositionCategory(position: string): string {
  const positionUpper = position.toUpperCase()
  if (positionUpper === "G" || positionUpper === "GOALIE") {
    return "goalie"
  }
  if (positionUpper === "RD" || positionUpper === "LD" || positionUpper === "D") {
    return "defense"
  }
  return "offense"
}

/**
 * Validate if an object matches the EA player template structure
 */
export function validateEAPlayer(player: any): boolean {
  if (!player || typeof player !== "object") return false

  // Required fields
  const requiredFields = ["playerId", "persona", "position"]
  for (const field of requiredFields) {
    if (!(field in player)) return false
  }

  // Check if numeric stats are numbers
  const numericFields = [
    "skgoals",
    "skassists",
    "skshots",
    "skhits",
    "skpim",
    "skplusmin",
    "skbs",
    "sktakeaways",
    "skgiveaways",
    "toiseconds",
  ]

  for (const field of numericFields) {
    if (field in player && typeof player[field] !== "number") {
      return false
    }
  }

  return true
}

/**
 * Validate if an object matches the EA club template structure
 */
export function validateEAClub(club: any): boolean {
  if (!club || typeof club !== "object") return false

  // Required fields
  const requiredFields = ["clubId", "name", "goals"]
  for (const field of requiredFields) {
    if (!(field in club)) return false
  }

  // Check details object
  if (!club.details || typeof club.details !== "object") return false
  if (!("goals" in club.details) || !("goalsAgainst" in club.details)) return false

  return true
}

/**
 * Validate if an object matches the EA match template structure
 */
export function validateEAMatch(match: any): boolean {
  if (!match || typeof match !== "object") return false

  // Required fields
  if (!match.matchId || !match.clubs || !match.players) return false

  // Validate clubs
  for (const clubId in match.clubs) {
    if (!validateEAClub(match.clubs[clubId])) return false
  }

  // Validate players structure
  for (const clubId in match.players) {
    if (typeof match.players[clubId] !== "object") return false
    for (const playerId in match.players[clubId]) {
      if (!validateEAPlayer(match.players[clubId][playerId])) return false
    }
  }

  return true
}

/**
 * Convert EA field names to standard field names
 */
export function normalizeEAFieldNames(data: any): any {
  if (!data || typeof data !== "object") return data

  const fieldMapping = {
    goals: "skgoals",
    assists: "skassists",
    shots: "skshots",
    hits: "skhits",
    blocks: "skbs",
    takeaways: "sktakeaways",
    giveaways: "skgiveaways",
    plusMinus: "skplusmin",
    pim: "skpim",
    timeOnIce: "toiseconds",
    saves: "glsaves",
    goalsAgainst: "glga",
    shotsAgainst: "glshots",
    breakawaySaves: "glbrksaves",
    breakawayShots: "glbrkshots",
    penaltySaves: "glpensaves",
    penaltyShots: "glpenshots",
    shutouts: "glso",
  }

  const normalized = { ...data }

  for (const [oldField, newField] of Object.entries(fieldMapping)) {
    if (oldField in normalized) {
      normalized[newField] = normalized[oldField]
      delete normalized[oldField]
    }
  }

  return normalized
}

/**
 * Check if a player is a goalie based on their stats and position
 */
export function isGoalie(player: any): boolean {
  if (!player) return false

  // Check position field first (most reliable)
  if (player.position === "G" || player.position === "0" || player.position === "Goalie") {
    return true
  }

  // Check posSorted field
  if (player.posSorted === "goalie") {
    return true
  }

  // Check category field
  if (player.category === "goalie") {
    return true
  }

  // Check for goalie-specific stats
  if (player.glsaves !== undefined || player.saves !== undefined) {
    return true
  }

  if (player.glga !== undefined || player.goalsAgainst !== undefined) {
    return true
  }

  if (player.glshots !== undefined || player.shotsAgainst !== undefined) {
    return true
  }

  return false
}

/**
 * Check if a player is a defenseman based on their position
 */
export function isDefenseman(player: any): boolean {
  if (!player) return false

  const position = player.position || player.skposition
  if (!position) return false

  const positionStr = String(position).toUpperCase()

  // Check numeric codes
  if (positionStr === "1" || positionStr === "2") return true

  // Check position names
  if (positionStr === "RD" || positionStr === "LD" || positionStr === "D") return true

  // Check posSorted field
  if (player.posSorted === "leftDefense" || player.posSorted === "rightDefense") return true

  // Check category
  if (player.category === "defense") return true

  return false
}

/**
 * Check if a player is a forward based on their position
 */
export function isForward(player: any): boolean {
  if (!player) return false

  const position = player.position || player.skposition
  if (!position) return false

  const positionStr = String(position).toUpperCase()

  // Check numeric codes
  if (positionStr === "3" || positionStr === "4" || positionStr === "5") return true

  // Check position names
  if (positionStr === "RW" || positionStr === "LW" || positionStr === "C" || positionStr === "F") return true

  // Check posSorted field
  if (player.posSorted === "leftWing" || player.posSorted === "rightWing" || player.posSorted === "center") return true

  // Check category
  if (player.category === "offense") return true

  return false
}

/**
 * Get all goalies from an EA match
 */
export function getGoaliesFromMatch(match: EAMatchTemplate): EAPlayerTemplate[] {
  const goalies: EAPlayerTemplate[] = []

  for (const clubId in match.players) {
    for (const playerId in match.players[clubId]) {
      const player = match.players[clubId][playerId]
      if (isGoalie(player)) {
        goalies.push(player)
      }
    }
  }

  return goalies
}

/**
 * Get all skaters from an EA match
 */
export function getSkatersFromMatch(match: EAMatchTemplate): EAPlayerTemplate[] {
  const skaters: EAPlayerTemplate[] = []

  for (const clubId in match.players) {
    for (const playerId in match.players[clubId]) {
      const player = match.players[clubId][playerId]
      if (!isGoalie(player)) {
        skaters.push(player)
      }
    }
  }

  return skaters
}

/**
 * Get all defensemen from an EA match
 */
export function getDefensemenFromMatch(match: EAMatchTemplate): EAPlayerTemplate[] {
  const defensemen: EAPlayerTemplate[] = []

  for (const clubId in match.players) {
    for (const playerId in match.players[clubId]) {
      const player = match.players[clubId][playerId]
      if (isDefenseman(player)) {
        defensemen.push(player)
      }
    }
  }

  return defensemen
}

/**
 * Get all forwards from an EA match
 */
export function getForwardsFromMatch(match: EAMatchTemplate): EAPlayerTemplate[] {
  const forwards: EAPlayerTemplate[] = []

  for (const clubId in match.players) {
    for (const playerId in match.players[clubId]) {
      const player = match.players[clubId][playerId]
      if (isForward(player)) {
        forwards.push(player)
      }
    }
  }

  return forwards
}

/**
 * Get players by club from an EA match
 */
export function getPlayersByClub(match: EAMatchTemplate, clubId: string): EAPlayerTemplate[] {
  if (!match.players[clubId]) return []

  return Object.values(match.players[clubId])
}

/**
 * Calculate team totals from player stats
 */
export function calculateTeamTotals(players: EAPlayerTemplate[]): {
  goals: number
  assists: number
  shots: number
  hits: number
  blocks: number
  pim: number
  saves: number
  goalsAgainst: number
} {
  return players.reduce(
    (totals, player) => ({
      goals: totals.goals + (player.skgoals || 0),
      assists: totals.assists + (player.skassists || 0),
      shots: totals.shots + (player.skshots || 0),
      hits: totals.hits + (player.skhits || 0),
      blocks: totals.blocks + (player.skbs || 0),
      pim: totals.pim + (player.skpim || 0),
      saves: totals.saves + (player.glsaves || 0),
      goalsAgainst: totals.goalsAgainst + (player.glga || 0),
    }),
    {
      goals: 0,
      assists: 0,
      shots: 0,
      hits: 0,
      blocks: 0,
      pim: 0,
      saves: 0,
      goalsAgainst: 0,
    },
  )
}

/**
 * Sanitize player name for consistent matching
 */
export function sanitizePlayerName(name: string): string {
  if (!name) return ""

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize whitespace
}

/**
 * Create a unique player key for matching across matches
 */
export function createPlayerKey(player: EAPlayerTemplate, clubId: string): string {
  const name = sanitizePlayerName(player.persona || player.playername || "")
  return `${clubId}:${name}`
}

/**
 * Deep clone an EA match template
 */
export function cloneEAMatch(match: EAMatchTemplate): EAMatchTemplate {
  return JSON.parse(JSON.stringify(match))
}

/**
 * Merge two EA player stat objects
 */
export function mergePlayerStats(player1: EAPlayerTemplate, player2: EAPlayerTemplate): EAPlayerTemplate {
  const merged = cloneEAMatch({
    matchId: "",
    timestamp: 0,
    clubs: {},
    players: { "": { "": player1 } },
  }).players[""][""]

  // Add numeric stats from player2
  const numericFields = [
    "skgoals",
    "skassists",
    "skshots",
    "skhits",
    "skpim",
    "skplusmin",
    "skbs",
    "sktakeaways",
    "skgiveaways",
    "skpassattempts",
    "skpasses",
    "skfow",
    "skfol",
    "skinterceptions",
    "skpossession",
    "skpenaltiesdrawn",
    "skppg",
    "skshg",
    "skgwg",
    "pkclearzone",
    "toiseconds",
    "glsaves",
    "glga",
    "glshots",
    "glbrksaves",
    "glbrkshots",
    "glpensaves",
    "glpenshots",
    "glso",
  ]

  numericFields.forEach((field) => {
    if (field in player2) {
      merged[field] = (merged[field] || 0) + (player2[field] || 0)
    }
  })

  // Recalculate percentages
  if (merged.skshots > 0) {
    merged.skshotpct = Number(((merged.skgoals / merged.skshots) * 100).toFixed(2))
  }

  if (merged.skpassattempts > 0) {
    merged.skpasspct = Number(((merged.skpasses / merged.skpassattempts) * 100).toFixed(2))
  }

  if (merged.skfow + merged.skfol > 0) {
    merged.skfopct = Number(((merged.skfow / (merged.skfow + merged.skfol)) * 100).toFixed(2))
  }

  if (merged.glsaves + merged.glga > 0) {
    merged.glsavepct = Number(((merged.glsaves / (merged.glsaves + merged.glga)) * 100).toFixed(2))
  }

  return merged
}
