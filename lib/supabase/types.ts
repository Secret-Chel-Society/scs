// Types for Supabase responses

export interface TeamAwardResponse {
  id: string
  team_id: string
  teams: {
    name: string
    logo_url: string | null
  } | null
  award_type: string
  season_number: number
  year: number
  description: string | null
}

export interface PlayerAwardResponse {
  id: string
  player_id: string
  players: {
    gamer_tag_id: string
    avatar_url: string | null
  } | null
  team_id: string | null
  teams: {
    name: string
    logo_url: string | null
  } | null
  award_type: string
  season_number: number
  year: number
  description: string | null
}

export interface SeasonResponse {
  id: string | number
  name: string
  number: number | null
}

// Client-side types
export interface TeamAward {
  id: string
  team_id: string
  team_name: string
  team_logo: string | null
  award_type: string
  season_number: number
  year: number
  description: string | null
}

export interface PlayerAward {
  id: string
  player_id: string
  gamer_tag_id: string
  team_id: string | null
  team_name: string | null
  team_logo: string | null
  award_type: string
  season_number: number
  year: number
  description: string | null
  player_avatar?: string | null
}

export interface Season {
  id: string | number
  name: string
  number?: number
}
