import { createClient } from "@supabase/supabase-js"
import { calculateStandings } from "./standings-calculator"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

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
    // Calculate standings to get accurate stats
    const standings = await calculateStandings(seasonId)

    // Get shots data for teams - only from ea_team_stats and player stats
    const { data: eaTeamStats, error: eaTeamStatsError } = await supabase
      .from("ea_team_stats")
      .select("match_id, team_id, shots")
      .eq("season_id", seasonId) // if season_id exists in ea_team_stats
      .or("status.eq.completed,status.eq.Completed")

    const shotsByTeam: Record<string, number> = {}

    if (!eaTeamStatsError && eaTeamStats) {
      // Calculate total shots by team from ea_team_stats
      eaTeamStats.forEach((stat) => {
        shotsByTeam[stat.team_id] = (shotsByTeam[stat.team_id] || 0) + (stat.shots || 0)
      })
    } else {
      // Fallback: try to get from ea_player_stats
      const { data: playerStats, error: playerStatsError } = await supabase
        .from("ea_player_stats")
        .select("team_id, shots")
        .not("team_id", "is", null)

      if (!playerStatsError && playerStats) {
        playerStats.forEach((stat) => {
          if (stat.team_id) {
            shotsByTeam[stat.team_id] = (shotsByTeam[stat.team_id] || 0) + (stat.shots || 0)
          }
        })
      }
    }

    // Get player counts and salaries
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("team_id, salary")
      .not("team_id", "is", null)

    if (playerError) {
      console.error("Error fetching player data:", playerError)
    }

    // Calculate player counts and salaries by team
    const playerCountByTeam: Record<string, number> = {}
    const totalSalaryByTeam: Record<string, number> = {}

    playerData?.forEach((player) => {
      if (player.team_id) {
        // Increment player count
        playerCountByTeam[player.team_id] = (playerCountByTeam[player.team_id] || 0) + 1

        // Add salary
        totalSalaryByTeam[player.team_id] = (totalSalaryByTeam[player.team_id] || 0) + (player.salary || 0)
      }
    })

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
        cap_space: 30000000 - (totalSalaryByTeam[team.id] || 0),
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
    const totalSalary = playerData?.reduce((sum, player) => sum + (player.salary || 0), 0) || 0

    return {
      ...team,
      player_count: playerData?.length || 0,
      total_salary: totalSalary,
      cap_space: 30000000 - totalSalary,
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
    const { data, error } = await supabase.from("system_settings").select("value").eq("key", "current_season").single()

    if (error) {
      console.error("Error fetching current season:", error)
      return 1 // Default to season 1 if not found
    }

    return data?.value || 1
  } catch (error) {
    console.error("Error getting current season:", error)
    return 1 // Default to season 1 if error
  }
}

// Helper function to calculate team stats including tie handling
async function calculateTeamStats(teamId: string, seasonId: number): Promise<TeamStats | null> {
  try {
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

    matches?.forEach((match) => {
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
      cap_space: 30000000, // Placeholder for cap space
    }
  } catch (error) {
    console.error("Error calculating team stats:", error)
    return null
  }
}
