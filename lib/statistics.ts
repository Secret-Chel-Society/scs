export interface PlayerStats {
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

export interface GameStats {
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

export interface TeamRecap {
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

// Re-export functions from player-analysis-engine for convenience
export { generateAdvancedPlayerSummary, getPerformanceLevel, analyzeGameTrends } from "./player-analysis-engine"
