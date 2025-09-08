export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          gamer_tag_id: string
          discord_name: string | null
          primary_position: string
          secondary_position: string | null
          console: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          gamer_tag_id: string
          discord_name?: string | null
          primary_position: string
          secondary_position?: string | null
          console: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          gamer_tag_id?: string
          discord_name?: string | null
          primary_position?: string | null
          secondary_position?: string | null
          console?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          wins: number
          losses: number
          otl: number
          goals_for: number
          goals_against: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          wins?: number
          losses?: number
          otl?: number
          goals_for?: number
          goals_against?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          wins?: number
          losses?: number
          otl?: number
          goals_for?: number
          goals_against?: number
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          user_id: string
          team_id: string | null
          salary: number
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id?: string | null
          salary?: number
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string | null
          salary?: number
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          home_team_id: string
          away_team_id: string
          home_score: number
          away_score: number
          match_date: string
          status: string
          ea_match_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_team_id: string
          away_team_id: string
          home_score?: number
          away_score?: number
          match_date: string
          status?: string
          ea_match_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_team_id?: string
          away_team_id?: string
          home_score?: number
          away_score?: number
          match_date?: string
          status?: string
          ea_match_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          id: string
          player_id: string
          match_id: string
          position: string
          goals: number
          assists: number
          shots: number
          hits: number
          pim: number
          giveaways: number
          takeaways: number
          interceptions: number
          pass_attempted: number
          pass_completed: number
          ppg: number
          shg: number
          gwg: number
          plus_minus: number
          pk_clearzone: number
          pk_drawn: number
          faceoff_wins: number
          faceoff_losses: number
          time_with_puck: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          match_id: string
          position: string
          goals?: number
          assists?: number
          shots?: number
          hits?: number
          pim?: number
          giveaways?: number
          takeaways?: number
          interceptions?: number
          pass_attempted?: number
          pass_completed?: number
          ppg?: number
          shg?: number
          gwg?: number
          plus_minus?: number
          pk_clearzone?: number
          pk_drawn?: number
          faceoff_wins?: number
          faceoff_losses?: number
          time_with_puck?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          match_id?: string
          position?: string
          goals?: number
          assists?: number
          shots?: number
          hits?: number
          pim?: number
          giveaways?: number
          takeaways?: number
          interceptions?: number
          pass_attempted?: number
          pass_completed?: number
          ppg?: number
          shg?: number
          gwg?: number
          plus_minus?: number
          pk_clearzone?: number
          pk_drawn?: number
          faceoff_wins?: number
          faceoff_losses?: number
          time_with_puck?: number
          created_at?: string
          updated_at?: string
        }
      }
      goalie_stats: {
        Row: {
          id: string
          player_id: string
          match_id: string
          shots_against: number
          saves: number
          goals_against: number
          shutout: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          match_id: string
          shots_against?: number
          saves?: number
          goals_against?: number
          shutout?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          match_id?: string
          shots_against?: number
          saves?: number
          goals_against?: number
          shutout?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      season_registrations: {
        Row: {
          id: string
          user_id: string
          season_number: number
          primary_position: string
          secondary_position: string | null
          gamer_tag: string
          console: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          season_number: number
          primary_position: string
          secondary_position?: string | null
          gamer_tag: string
          console: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          season_number?: number
          primary_position?: string
          secondary_position?: string | null
          gamer_tag?: string
          console?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string | null
          published: boolean
          featured: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id?: string | null
          published?: boolean
          featured?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string | null
          published?: boolean
          featured?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          read: boolean
          link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          read?: boolean
          link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          read?: boolean
          link?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
    }
  }
}
