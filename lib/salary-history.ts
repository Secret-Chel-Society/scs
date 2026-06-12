import { SupabaseClient } from "@supabase/supabase-js"

export type AcquiredVia = 
  | "draft" 
  | "free_agency" 
  | "bid" 
  | "trade" 
  | "waiver_claim" 
  | "signed" 
  | "ahl_call_up" 
  | "nhl_assignment" 
  | "other"

export interface SaveSalaryHistoryParams {
  player_id: string
  user_id: string
  season_number: number
  season_id?: string | null
  season_id_ahl?: string | null
  team_id?: string | null
  team_id_ahl?: string | null
  team_name?: string | null
  salary: number
  contract_type?: string | null
  is_franchise_player?: boolean
  contract_seasons_remaining?: number | null
  retained_salary?: number
  acquired_via: AcquiredVia
  acquired_from_team_id?: string | null
  acquired_from_team_name?: string | null
  league: "NHL" | "AHL"
  role?: string | null
}

/**
 * Saves or updates a player's salary history for a specific season.
 * Uses upsert to handle both new records and updates to existing records.
 */
export async function saveSalaryHistory(
  supabase: SupabaseClient,
  params: SaveSalaryHistoryParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("player_salary_history")
      .upsert(
        {
          player_id: params.player_id,
          user_id: params.user_id,
          season_number: params.season_number,
          season_id: params.season_id || null,
          season_id_ahl: params.season_id_ahl || null,
          team_id: params.team_id || null,
          team_id_ahl: params.team_id_ahl || null,
          team_name: params.team_name || null,
          salary: params.salary,
          contract_type: params.contract_type || null,
          is_franchise_player: params.is_franchise_player || false,
          contract_seasons_remaining: params.contract_seasons_remaining || null,
          retained_salary: params.retained_salary || 0,
          acquired_via: params.acquired_via,
          acquired_from_team_id: params.acquired_from_team_id || null,
          acquired_from_team_name: params.acquired_from_team_name || null,
          league: params.league,
          role: params.role || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "player_id,season_number,league",
        }
      )

    if (error) {
      console.error("Error saving salary history:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Error in saveSalaryHistory:", err)
    return { success: false, error: err.message || "Unknown error" }
  }
}

/**
 * Get a player's salary history across all seasons
 */
export async function getPlayerSalaryHistory(
  supabase: SupabaseClient,
  playerId: string,
  league?: "NHL" | "AHL"
): Promise<{ data: any[] | null; error?: string }> {
  try {
    let query = supabase
      .from("player_salary_history")
      .select(`
        *,
        teams (id, name, logo_url),
        teams_ahl (id, name, logo_url)
      `)
      .eq("player_id", playerId)
      .order("season_number", { ascending: false })

    if (league) {
      query = query.eq("league", league)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching salary history:", error)
      return { data: null, error: error.message }
    }

    return { data }
  } catch (err: any) {
    console.error("Error in getPlayerSalaryHistory:", err)
    return { data: null, error: err.message || "Unknown error" }
  }
}

/**
 * Get salary history for a specific user across all their player records
 */
export async function getUserSalaryHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: any[] | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("player_salary_history")
      .select(`
        *,
        teams (id, name, logo_url),
        teams_ahl (id, name, logo_url)
      `)
      .eq("user_id", userId)
      .order("season_number", { ascending: false })

    if (error) {
      console.error("Error fetching user salary history:", error)
      return { data: null, error: error.message }
    }

    return { data }
  } catch (err: any) {
    console.error("Error in getUserSalaryHistory:", err)
    return { data: null, error: err.message || "Unknown error" }
  }
}
