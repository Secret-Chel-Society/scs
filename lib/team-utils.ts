import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { calculateStandings } from "./standings-calculator"

// Define types for our data structures
interface SystemSettings {
  key: string;
  value: any;
  updated_at?: string;
}

interface TeamStats {
  id: string;
  name: string;
  logo_url: string | null;
  wins: number;
  losses: number;
  otl: number;
  games_played: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_differential: number;
  shots_per_game?: number;
  total_shots?: number;
  powerplay_goals?: number;
  powerplay_opportunities?: number;
  powerplay_percentage?: number;
  penalty_kill_goals_against?: number;
  penalty_kill_opportunities?: number;
  penalty_kill_percentage?: number;
  division?: string;
  conference?: string;
  player_count?: number;
  total_salary?: number;
  cap_space?: number;
}

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Cache for salary cap to reduce database calls
let salaryCapCache: number | null = null

export interface TeamStats {
  id: string
  name: string
  logo_url: string | null
  wins: number
  losses: number
  otl: number
  games_played: number
  points: number
  goals_for: number
  goals_against: number
  goal_differential: number
  shots_per_game?: number
  total_shots?: number
  powerplay_goals?: number
  powerplay_opportunities?: number
  powerplay_percentage?: number
  penalty_kill_goals_against?: number
  penalty_kill_opportunities?: number
  penalty_kill_percentage?: number
  division?: string
  conference?: string
  player_count?: number
  total_salary?: number
  cap_space?: number
}

/**
 * Gets statistics for all teams
 * @param seasonId The season ID to get statistics for
 * @returns An array of team statistics
 */
export async function getAllTeamStats(seasonId: number): Promise<TeamStats[]> {
  try {
    // Get salary cap from system settings
    const salaryCap = await getSalaryCap()
    
    // Get the season UUID from the season number
    const { data: seasonData, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("season_number", seasonId)
      .single()
    
    if (seasonError || !seasonData) {
      console.error("Error getting season UUID:", seasonError)
      return []
    }
    
    const seasonUuid = seasonData.id
    console.log(`Using season UUID ${seasonUuid} for season number ${seasonId}`)
    
    // Calculate standings to get accurate stats
    const standings = await calculateStandings(seasonId)

    // Get shots data for teams - only from ea_team_stats and player stats
    const { data: eaTeamStats, error: eaTeamStatsError } = await supabase
      .from("ea_team_stats")
      .select("match_id, team_id, shots")
      .eq("season_id", seasonUuid) // Use the season UUID

    if (eaTeamStatsError) {
      console.log("EA team stats query failed:", eaTeamStatsError.message)
    }

    const shotsByTeam: Record<string, number> = {}

    if (!eaTeamStatsError && eaTeamStats) {
      // Calculate total shots by team from ea_team_stats
      eaTeamStats.forEach((stat: { team_id: string; shots?: number }) => {
        shotsByTeam[stat.team_id] = (shotsByTeam[stat.team_id] || 0) + (stat.shots || 0)
      })
    } else {
      // Fallback: try to get from ea_player_stats - filter by teams that belong to the current season
      const { data: playerStats, error: playerStatsError } = await supabase
        .from("ea_player_stats")
        .select("team_id, shots")
        .not("team_id", "is", null)
        .in("team_id", standings.map(team => team.id))

      if (!playerStatsError && playerStats) {
        playerStats.forEach((stat: { team_id?: string; shots?: number }) => {
          if (stat.team_id) {
            shotsByTeam[stat.team_id] = (shotsByTeam[stat.team_id] || 0) + (stat.shots || 0)
          }
        })
      }
    }

    // Get player counts and salaries - filter by teams that belong to the current season
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("team_id, salary")
      .not("team_id", "is", null)
      .in("team_id", standings.map(team => team.id))

    if (playerError) {
      console.error("Error fetching player data:", playerError)
    }

    // Calculate player counts and salaries by team
    const playerCountByTeam: Record<string, number> = {}
    const totalSalaryByTeam: Record<string, number> = {}
    
    interface PlayerData {
      team_id: string;
      salary: number;
    }

    if (playerData) {
      playerData.forEach((player: PlayerData) => {
        if (player.team_id) {
          // Increment player count
          playerCountByTeam[player.team_id] = (playerCountByTeam[player.team_id] || 0) + 1

          // Add salary
          totalSalaryByTeam[player.team_id] = (totalSalaryByTeam[player.team_id] || 0) + (player.salary || 0)
        }
      })
    }

    // Combine standings with shots data
    return standings.map((team) => {
      const totalShots = shotsByTeam[team.id] || 0
      const shotsPerGame = team.games_played > 0 ? totalShots / team.games_played : 0

      return {
        ...team,
        total_shots: totalShots,
        shots_per_game: Number(shotsPerGame.toFixed(1)),
        player_count: playerCountByTeam[team.id] || 0,
        total_salary: totalSalaryByTeam[team.id] || 0,
        cap_space: salaryCap - (totalSalaryByTeam[team.id] || 0),
      }
    })
  } catch (error) {
    console.error("Error getting all team stats:", error)
    return []
  }
}

/**
 * Gets statistics for a specific team
 * @param teamId The team ID to get statistics for
 * @param seasonId The season ID to get statistics for
 * @returns The team statistics or null if not found
 */
export async function getTeamStats(teamId: string, seasonId: number): Promise<TeamStats | null> {
  try {
    // Get salary cap from system settings
    const salaryCap = await getSalaryCap()
    
    // Calculate standings to get accurate stats
    const standings = await calculateStandings(seasonId)

    // Find the team in the standings
    const team = standings.find((t) => t.id === teamId)

    if (!team) {
      return null
    }

    // Get player count and salary
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, salary")
      .eq("team_id", teamId)

    if (playerError) {
      console.error("Error fetching player data:", playerError)
    }

    // Calculate total salary
    const totalSalary = playerData?.reduce((sum: number, player: { salary?: number }) => sum + (player.salary || 0), 0) || 0

    return {
      ...team,
      player_count: playerData?.length || 0,
      total_salary: totalSalary,
      cap_space: salaryCap - totalSalary,
    }
  } catch (error) {
    console.error("Error getting team stats:", error)
    return null
  }
}

/**
 * Gets the current season ID
 * @returns The current season ID
 */
export async function getCurrentSeasonId(): Promise<number> {
  try {
    // First try to get from system_settings
    const { data, error } = await supabase.from("system_settings").select("value").eq("key", "current_season").single()

    if (error) {
      console.log("System settings approach failed, trying seasons table:", error.message)
      
      // Fallback: Get active season from seasons table
      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("id, name, season_number")
        .eq("is_active", true)
        .single()

      if (seasonError) {
        console.log("Active season not found, trying first season:", seasonError.message)
        
        // Final fallback: Get first season
        const { data: firstSeason, error: firstSeasonError } = await supabase
          .from("seasons")
          .select("id, name, season_number")
          .order("id")
          .limit(1)
          .single()

        if (firstSeasonError) {
          console.error("No seasons found, defaulting to 1:", firstSeasonError.message)
          return 1
        }

        console.log("Using first season:", firstSeason)
        return firstSeason.id
      }

      console.log("Using active season:", seasonData)
      return seasonData.id
    }

    const value = data?.value
    console.log("Current season value from database:", value, "type:", typeof value)
    
    // Handle different value types from system_settings
    if (typeof value === 'string') {
      // Check if it's a UUID (contains hyphens)
      if (value.includes('-')) {
        console.log("Found UUID season ID, looking up season number:", value)
        // It's a UUID, we need to find the corresponding season_number
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("season_number")
          .eq("id", value)
          .single()
        
        if (!seasonError && seasonData && seasonData.season_number) {
          console.log("Found season number for UUID:", seasonData.season_number)
          return seasonData.season_number
        }
      } else {
        // It's a numeric string
        const seasonNumber = parseInt(value, 10)
        if (!isNaN(seasonNumber) && seasonNumber > 0) {
          console.log("Using season from system_settings:", seasonNumber)
          return seasonNumber
        }
      }
    } else if (typeof value === 'number') {
      console.log("Using season from system_settings:", value)
      return value
    } else if (value && typeof value === 'object') {
      // Handle JSONB object - try to extract the value
      const seasonNumber = parseInt(String(value), 10)
      if (!isNaN(seasonNumber) && seasonNumber > 0) {
        console.log("Using season from system_settings:", seasonNumber)
        return seasonNumber
      }
    }
    
    console.log("Invalid current_season value, defaulting to 1")
    return 1
  } catch (error) {
    console.error("Error getting current season:", error)
    return 1 // Default to season 1 if error
  }
}

/**
 * Gets the salary cap from system settings
 * @param useCache Whether to use the cached value if available (default: true)
 * @returns The salary cap amount
 */
/**
 * Gets the salary cap from system settings
 * @param useCache Whether to use the cached value if available (default: true)
 * @returns The salary cap amount
 */
export async function getSalaryCap(useCache: boolean = true): Promise<number> {
  // Return cached value if available and cache is enabled
  if (useCache && salaryCapCache !== null) {
    return salaryCapCache;
  }
  
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "salary_cap")
      .single();

    if (error) {
      console.error("Error fetching salary cap:", error);
      return 65000000; // Default to $65M if error
    }

    if (!data) {
      console.log("No salary cap setting found, creating default");
      await updateSalaryCap(65000000);
      return 65000000;
    }

    // The value is stored as JSONB, so we need to handle it properly
    let capValue = data.value;
    let cap = 65000000; // Default to $65M if invalid

    // Handle different possible value formats
    if (typeof capValue === 'number') {
      cap = capValue;
    } else if (typeof capValue === 'string') {
      // Try to parse string to number
      const parsed = parseInt(capValue, 10);
      if (!isNaN(parsed)) {
        cap = parsed;
      }
    } else if (capValue && typeof capValue === 'object') {
      // Handle case where value is stored as { "value": number }
      const nestedValue = (capValue as any).value;
      if (typeof nestedValue === 'number') {
        cap = nestedValue;
      } else if (typeof nestedValue === 'string') {
        const parsed = parseInt(nestedValue, 10);
        if (!isNaN(parsed)) {
          cap = parsed;
        }
      }
    }
    
    console.log(`Retrieved salary cap: $${(cap / 100).toFixed(2)}`);
    
    // Update cache
    salaryCapCache = cap;
    return cap;
  } catch (error) {
    console.error("Error getting salary cap:", error);
    return 65000000; // Default to $65M if error
  }
}

/**
 * Updates the salary cap in system settings and notifies all clients
 * @param newSalaryCap The new salary cap amount
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function updateSalaryCap(newSalaryCap: number): Promise<boolean> {
  try {
    // Ensure the value is a number
    const capValue = typeof newSalaryCap === 'number' ? newSalaryCap : 
                    (typeof newSalaryCap === 'string' ? parseInt(newSalaryCap, 10) : 65000000);
    
    if (isNaN(capValue)) {
      console.error("Invalid salary cap value:", newSalaryCap);
      return false;
    }

    console.log(`Updating salary cap to: $${(capValue / 100).toFixed(2)}`);
    
    const { error } = await supabase
      .from("system_settings")
      .upsert({
        key: "salary_cap",
        value: capValue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error("Error updating salary cap:", error);
      return false;
    }

    // Update cache
    salaryCapCache = capValue;
    
    // Send a notification to all clients
    const { error: channelError } = await supabase
      .channel('salary_cap_updates')
      .send({
        type: 'broadcast',
        event: 'SALARY_CAP_UPDATED',
        payload: { newSalaryCap: capValue }
      });

    if (channelError) {
      console.error("Error sending salary cap update notification:", channelError);
    }

    console.log(`Salary cap updated and notifications sent: $${(capValue / 100).toFixed(2)}`);
    return true;
  } catch (error) {
    console.error("Error updating salary cap:", error);
    return false;
  }
}

/**
 * Subscribes to salary cap updates
 * @param callback Function to call when salary cap is updated
 * @returns Unsubscribe function
 */
export function subscribeToSalaryCap(callback: (newCap: number) => void) {
  const channel = supabase.channel('salary_cap_updates')
  
  channel
    .on('broadcast', { event: 'SALARY_CAP_UPDATED' }, (payload: { payload: { newSalaryCap: number } }) => {
      callback(payload.payload.newSalaryCap)
    })
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

// Helper function to calculate team stats including tie handling
async function calculateTeamStats(teamId: string, seasonId: number): Promise<TeamStats | null> {
  try {
    // Get salary cap from system settings
    const salaryCap = await getSalaryCap()
    
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id, home_score, away_score, overtime, has_overtime")
      .eq("season_id", seasonId)

    if (matchesError) {
      console.error("Error fetching matches data:", matchesError)
      return null
    }

    let wins = 0
    let losses = 0
    let otl = 0
    let goalsFor = 0
    let goalsAgainst = 0

    const teamMatches = matches.filter((match: { home_team_id: string; away_team_id: string }) => 
      match.home_team_id === teamId || match.away_team_id === teamId
    )

    teamMatches.forEach((match) => {
      const homeTeamId = match.home_team_id
      const awayTeamId = match.away_team_id
      const homeScore = match.home_score
      const awayScore = match.away_score

      if (teamId === homeTeamId) {
        goalsFor += homeScore
        goalsAgainst += awayScore

        // Determine win/loss/otl - handle ties as losses
        if (homeScore > awayScore) {
          wins++
        } else if (homeScore < awayScore) {
          if (match.overtime === true || match.has_overtime === true) {
            otl++
          } else {
            losses++
          }
        } else if (homeScore === awayScore) {
          // Tie game - count as loss for both teams
          losses++
        }
      } else if (teamId === awayTeamId) {
        goalsFor += awayScore
        goalsAgainst += homeScore

        // Determine win/loss/otl - handle ties as losses
        if (awayScore > homeScore) {
          wins++
        } else if (awayScore < homeScore) {
          if (match.overtime === true || match.has_overtime === true) {
            otl++
          } else {
            losses++
          }
        } else if (awayScore === homeScore) {
          // Tie game - count as loss for both teams
          losses++
        }
      }
    })

    const gamesPlayed = matches?.length || 0
    const points = wins * 2 + otl

    return {
      id: teamId,
      name: "", // Placeholder for team name
      logo_url: null,
      wins: wins,
      losses: losses,
      otl: otl,
      games_played: gamesPlayed,
      points: points,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      goal_differential: goalsFor - goalsAgainst,
      player_count: 0, // Placeholder for player count
      total_salary: 0, // Placeholder for total salary
      cap_space: salaryCap, // Placeholder for cap space
    }
  } catch (error) {
    console.error("Error calculating team stats:", error)
    return null
  }
}
