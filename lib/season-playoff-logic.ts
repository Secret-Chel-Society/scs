import { createAdminClient } from "./supabase/server"

export interface Season {
  id: string
  name: string
  season_number: number
  parent_season_id?: string
  is_playoff: boolean
  is_active: boolean
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface SeasonRegistration {
  id: string
  user_id: string
  season_id: string
  parent_season_id?: string
  season_number: number
  primary_position: string
  secondary_position?: string
  gamer_tag: string
  console: string
  status: string
  team_id?: string
  created_at: string
  updated_at: string
}

/**
 * Creates a playoff season linked to a regular season
 * @param parentSeasonId - The ID of the parent regular season
 * @param playoffName - The name for the playoff season
 * @returns Promise with playoff season creation result
 */
export async function createPlayoffSeason(
  parentSeasonId: string, 
  playoffName: string
): Promise<{ success: boolean; season?: Season; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get parent season information
    const { data: parentSeason, error: parentError } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", parentSeasonId)
      .single()

    if (parentError || !parentSeason) {
      console.error("Error fetching parent season:", parentError)
      return { success: false, error: "Parent season not found" }
    }

    // Create playoff season
    const { data: playoffSeason, error: seasonError } = await supabase
      .from("seasons")
      .insert({
        name: playoffName,
        season_number: parentSeason.season_number,
        parent_season_id: parentSeasonId,
        is_playoff: true,
        is_active: false, // Start as inactive
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (seasonError) {
      console.error("Error creating playoff season:", seasonError)
      return { success: false, error: "Failed to create playoff season" }
    }

    return { success: true, season: playoffSeason }
  } catch (error: any) {
    console.error("Error creating playoff season:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Links existing registrations from regular season to playoff season
 * @param playoffSeasonId - The playoff season ID
 * @returns Promise with linking result
 */
export async function linkRegularSeasonRegistrations(playoffSeasonId: string): Promise<{ success: boolean; linkedCount: number; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get playoff season information
    const { data: playoffSeason, error: playoffError } = await supabase
      .from("seasons")
      .select("parent_season_id, season_number")
      .eq("id", playoffSeasonId)
      .single()

    if (playoffError || !playoffSeason) {
      console.error("Error fetching playoff season:", playoffError)
      return { success: false, linkedCount: 0, error: "Playoff season not found" }
    }

    // Get registrations from parent season
    const { data: parentRegistrations, error: regError } = await supabase
      .from("season_registrations")
      .select("*")
      .eq("season_id", playoffSeason.parent_season_id)
      .eq("status", "Approved")

    if (regError) {
      console.error("Error fetching parent registrations:", regError)
      return { success: false, linkedCount: 0, error: "Failed to fetch parent registrations" }
    }

    let linkedCount = 0

    // Create playoff registrations for each parent registration
    for (const parentReg of parentRegistrations || []) {
      const { error: insertError } = await supabase
        .from("season_registrations")
        .insert({
          user_id: parentReg.user_id,
          season_id: playoffSeasonId,
          parent_season_id: playoffSeason.parent_season_id,
          season_number: playoffSeason.season_number,
          primary_position: parentReg.primary_position,
          secondary_position: parentReg.secondary_position,
          gamer_tag: parentReg.gamer_tag,
          console: parentReg.console,
          status: "Approved", // Automatically approve playoff registrations
          team_id: parentReg.team_id, // Keep same team assignment
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (!insertError) {
        linkedCount++
      } else {
        console.error("Error creating playoff registration:", insertError)
      }
    }

    return { success: true, linkedCount }
  } catch (error: any) {
    console.error("Error linking registrations:", error)
    return { success: false, linkedCount: 0, error: error.message || "An error occurred" }
  }
}

/**
 * Gets season hierarchy (regular season and its playoffs)
 * @param seasonId - The season ID (can be regular or playoff)
 * @returns Promise with season hierarchy
 */
export async function getSeasonHierarchy(seasonId: string): Promise<{ success: boolean; hierarchy?: any; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get the season
    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", seasonId)
      .single()

    if (seasonError || !season) {
      console.error("Error fetching season:", seasonError)
      return { success: false, error: "Season not found" }
    }

    let regularSeason: Season
    let playoffSeasons: Season[] = []

    if (season.is_playoff) {
      // This is a playoff season, get the parent
      const { data: parent, error: parentError } = await supabase
        .from("seasons")
        .select("*")
        .eq("id", season.parent_season_id!)
        .single()

      if (parentError || !parent) {
        console.error("Error fetching parent season:", parentError)
        return { success: false, error: "Parent season not found" }
      }

      regularSeason = parent

      // Get all playoff seasons for this parent
      const { data: playoffs, error: playoffsError } = await supabase
        .from("seasons")
        .select("*")
        .eq("parent_season_id", parent.id)
        .eq("is_playoff", true)
        .order("created_at", { ascending: true })

      if (!playoffsError) {
        playoffSeasons = playoffs || []
      }
    } else {
      // This is a regular season
      regularSeason = season

      // Get all playoff seasons for this regular season
      const { data: playoffs, error: playoffsError } = await supabase
        .from("seasons")
        .select("*")
        .eq("parent_season_id", season.id)
        .eq("is_playoff", true)
        .order("created_at", { ascending: true })

      if (!playoffsError) {
        playoffSeasons = playoffs || []
      }
    }

    const hierarchy = {
      regular: regularSeason,
      playoffs: playoffSeasons,
      current: season
    }

    return { success: true, hierarchy }
  } catch (error: any) {
    console.error("Error getting season hierarchy:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets combined stats for a season (regular + playoffs)
 * @param seasonId - The season ID (can be regular or playoff)
 * @returns Promise with combined stats
 */
export async function getCombinedSeasonStats(seasonId: string): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get season hierarchy
    const { success, hierarchy, error } = await getSeasonHierarchy(seasonId)

    if (!success || !hierarchy) {
      return { success: false, error }
    }

    const seasonIds = [hierarchy.regular.id, ...hierarchy.playoffs.map(p => p.id)]

    // Get player stats for all seasons in hierarchy
    const { data: playerStats, error: statsError } = await supabase
      .from("ea_player_stats")
      .select("*")
      .in("season_id", seasonIds)

    if (statsError) {
      console.error("Error fetching player stats:", statsError)
      return { success: false, error: "Failed to fetch player stats" }
    }

    // Aggregate stats by player
    const aggregatedStats = new Map()

    playerStats?.forEach(stat => {
      const playerId = stat.player_id
      
      if (!aggregatedStats.has(playerId)) {
        aggregatedStats.set(playerId, {
          player_id: playerId,
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          penalty_minutes: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          pass_attempted: 0,
          pass_completed: 0,
          saves: 0,
          goals_against: 0,
          wins: 0,
          losses: 0
        })
      }

      const playerStats = aggregatedStats.get(playerId)
      
      // Aggregate all numeric stats
      Object.keys(playerStats).forEach(key => {
        if (key !== 'player_id' && typeof stat[key] === 'number') {
          playerStats[key] += stat[key] || 0
        }
      })
    })

    // Convert to array and calculate percentages
    const combinedStats = Array.from(aggregatedStats.values()).map(stats => ({
      ...stats,
      faceoff_percentage: stats.faceoffs_taken > 0 ? (stats.faceoffs_won / stats.faceoffs_taken * 100).toFixed(1) : 0,
      pass_percentage: stats.pass_attempted > 0 ? (stats.pass_completed / stats.pass_attempted * 100).toFixed(1) : 0,
      save_percentage: (stats.shots + stats.goals_against) > 0 ? (stats.saves / (stats.shots + stats.goals_against) * 100).toFixed(1) : 0
    }))

    return { success: true, stats: combinedStats }
  } catch (error: any) {
    console.error("Error getting combined season stats:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Activates a playoff season
 * @param playoffSeasonId - The playoff season ID
 * @returns Promise with activation result
 */
export async function activatePlayoffSeason(playoffSeasonId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Verify it's a playoff season
    const { data: playoffSeason, error: playoffError } = await supabase
      .from("seasons")
      .select("is_playoff, parent_season_id")
      .eq("id", playoffSeasonId)
      .single()

    if (playoffError || !playoffSeason) {
      console.error("Error fetching playoff season:", playoffError)
      return { success: false, error: "Playoff season not found" }
    }

    if (!playoffSeason.is_playoff) {
      return { success: false, error: "Season is not a playoff season" }
    }

    // Deactivate parent season
    const { error: parentDeactivateError } = await supabase
      .from("seasons")
      .update({ is_active: false })
      .eq("id", playoffSeason.parent_season_id)

    if (parentDeactivateError) {
      console.error("Error deactivating parent season:", parentDeactivateError)
    }

    // Activate playoff season
    const { error: activateError } = await supabase
      .from("seasons")
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", playoffSeasonId)

    if (activateError) {
      console.error("Error activating playoff season:", activateError)
      return { success: false, error: "Failed to activate playoff season" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error activating playoff season:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets registration status for a user across season hierarchy
 * @param userId - The user ID
 * @param seasonId - The season ID (can be regular or playoff)
 * @returns Promise with registration status
 */
export async function getUserSeasonRegistrationStatus(
  userId: string, 
  seasonId: string
): Promise<{ success: boolean; registration?: SeasonRegistration; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get season hierarchy
    const { success, hierarchy, error } = await getSeasonHierarchy(seasonId)

    if (!success || !hierarchy) {
      return { success: false, error }
    }

    const seasonIds = [hierarchy.regular.id, ...hierarchy.playoffs.map(p => p.id)]

    // Get user's registration for any season in the hierarchy
    const { data: registration, error: regError } = await supabase
      .from("season_registrations")
      .select("*")
      .eq("user_id", userId)
      .in("season_id", seasonIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (regError && regError.code !== "PGRST116") {
      console.error("Error fetching registration:", regError)
      return { success: false, error: "Failed to fetch registration" }
    }

    return { success: true, registration: registration || undefined }
  } catch (error: any) {
    console.error("Error getting registration status:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Updates season number field across all related tables
 * @param seasonId - The season ID
 * @param newSeasonNumber - The new season number
 * @returns Promise with update result
 */
export async function updateSeasonNumber(
  seasonId: string, 
  newSeasonNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Update the season itself
    const { error: seasonError } = await supabase
      .from("seasons")
      .update({ 
        season_number: newSeasonNumber,
        updated_at: new Date().toISOString()
      })
      .eq("id", seasonId)

    if (seasonError) {
      console.error("Error updating season:", seasonError)
      return { success: false, error: "Failed to update season" }
    }

    // Update season_registrations
    const { error: regError } = await supabase
      .from("season_registrations")
      .update({ season_number: newSeasonNumber })
      .eq("season_id", seasonId)

    if (regError) {
      console.error("Error updating registrations:", regError)
    }

    // Update player_statistics
    const { error: statsError } = await supabase
      .from("player_statistics")
      .update({ season_number: newSeasonNumber })
      .eq("season_id", seasonId)

    if (statsError) {
      console.error("Error updating player statistics:", statsError)
    }

    // Update ea_player_stats
    const { error: eaStatsError } = await supabase
      .from("ea_player_stats")
      .update({ season_number: newSeasonNumber })
      .eq("season_id", seasonId)

    if (eaStatsError) {
      console.error("Error updating EA player stats:", eaStatsError)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error updating season number:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets all seasons with their hierarchy information
 * @returns Promise with seasons and hierarchy
 */
export async function getAllSeasonsWithHierarchy(): Promise<{ success: boolean; seasons?: any[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get all seasons
    const { data: seasons, error: seasonsError } = await supabase
      .from("seasons")
      .select("*")
      .order("season_number", { ascending: true })
      .order("created_at", { ascending: true })

    if (seasonsError) {
      console.error("Error fetching seasons:", seasonsError)
      return { success: false, error: "Failed to fetch seasons" }
    }

    // Group seasons by hierarchy
    const seasonGroups = new Map()

    seasons?.forEach(season => {
      if (season.is_playoff) {
        // This is a playoff season
        const parentId = season.parent_season_id
        if (!seasonGroups.has(parentId)) {
          seasonGroups.set(parentId, { regular: null, playoffs: [] })
        }
        seasonGroups.get(parentId).playoffs.push(season)
      } else {
        // This is a regular season
        if (!seasonGroups.has(season.id)) {
          seasonGroups.set(season.id, { regular: season, playoffs: [] })
        } else {
          seasonGroups.get(season.id).regular = season
        }
      }
    })

    // Convert to array format
    const seasonsWithHierarchy = Array.from(seasonGroups.values())
      .filter(group => group.regular) // Only include groups with regular seasons
      .map(group => ({
        regular: group.regular,
        playoffs: group.playoffs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }))

    return { success: true, seasons: seasonsWithHierarchy }
  } catch (error: any) {
    console.error("Error getting seasons with hierarchy:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}
