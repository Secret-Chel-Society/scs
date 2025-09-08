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
          registration_ip: string | null
          last_login_ip: string | null
          last_login_at: string | null
          username: string | null
          gamer_tag_id: string | null
          twitch_username: string | null
          twitch_user_id: string | null
          twitch_access_token: string | null
          twitch_refresh_token: string | null
          twitch_connected_at: string | null
          is_streaming: boolean
          stream_title: string | null
          stream_game_name: string | null
          stream_viewer_count: number
          stream_started_at: string | null
          twitch_id: string | null
          twitch_login: string | null
          twitch_display_name: string | null
          twitch_profile_image_url: string | null
          twitch_connected: boolean
          avatar_url: string | null
          email_notifications: boolean
          game_notifications: boolean
          news_notifications: boolean
          ban_reason: string | null
          ban_expiration: string | null
          is_banned: boolean
          discord_id: string | null
          ban_expires_at: string | null
        }
        Insert: {
          id?: string
          email: string
          gamer_tag_id: string
          discord_name?: string | null
          primary_position: string
          secondary_position?: string | null
          console: string
          created_on?: string
          updated_at?: string
          is_active?: boolean
          registration_ip?: string | null
          last_login_ip?: string | null
          last_login_at?: string | null
          username?: string | null
          gamer_tag?: string | null
          twitch_username?: string | null
          twitch_user_id?: string | null
          twitch_access_token?: string | null
          twitch_refresh_token?: string | null
          twitch_connected_at?: string | null
          is_streaming?: boolean
          stream_title?: string | null
          stream_game_name?: string | null
          stream_viewer_count?: number
          stream_started_at?: string | null
          twitch_id?: string | null
          twitch_login?: string | null
          twitch_display_name?: string | null
          twitch_profile_image_url?: string | null
          twitch_connected?: boolean
          avatar_url?: string | null
          email_notifications?: boolean
          game_notifications?: boolean
          news_notifications?: boolean
          ban_reason?: string | null
          ban_expiration?: string | null
          is_banned?: boolean
          discord_id?: string | null
          ban_expires_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          gamer_tag_name?: string
          discord_name?: string | null
          primary_position?: string | null
          secondary_position?: string | null
          console?: string
          created_on?: string
          updated_at?: string
          is_active?: boolean
          registration_ip?: string | null
          last_login_ip?: string | null
          last_login_at?: string | null
          username?: string | null
          gamer_tag?: string | null
          twitch_username?: string | null
          twitch_user_id?: string | null
          twitch_access_token?: string | null
          twitch_refresh_token?: string | null
          twitch_connected_at?: string | null
          is_streaming?: boolean
          stream_title?: string | null
          stream_game_name?: string | null
          stream_viewer_count?: number
          stream_started_at?: string | null
          twitch_id?: string | null
          twitch_login?: string | null
          twitch_display_name?: string | null
          twitch_profile_image_url?: string | null
          twitch_connected?: boolean
          avatar_url?: string | null
          email_notifications?: boolean
          game_notifications?: boolean
          news_notifications?: boolean
          ban_reason?: string | null
          ban_expiration?: string | null
          is_banned?: boolean
          discord_id?: string | null
          ban_expires_at?: string | null
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
          conference_id: string | null
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
          conference_id?: string | null
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
          conference_id?: string | null
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
          retained_salary: number
          manually_removed: boolean
          manually_removed_at: string | null
          manually_removed_by: string | null
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id?: string | null
          salary?: number
          role?: string
          created_at?: string
          updated_at?: string
          retained_salary?: number
          manually_removed?: boolean
          manually_removed_at?: string | null
          manually_removed_by?: string | null
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string | null
          salary?: number
          role?: string
          created_at?: string
          updated_at?: string
          retained_salary?: number
          manually_removed?: boolean
          manually_removed_at?: string | null
          manually_removed_by?: string | null
          status?: string
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
          gamer_tag_id: string
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
          gamer_tag_id: string
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
