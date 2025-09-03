import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export interface TeamStanding {
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
  last_10?: string // Format: "W-L-OTL"
  current_streak?: string // Format: "W5", "L3", "OTL2"
  playoff_status?: "clinched" | "eliminated" | "active" // New field for playoff status
}

// Division assignment logic - used if division column doesn't exist
const nhlDivisionTeams = [
  "Winnipeg Jets",
  "Pittsburgh Penguins",
  "Philadelphia Flyers",
  "Toronto Maple Leafs",
  "Washington Capitals",
  "Ottawa Senators",
]

const customDivisionTeams = [
  "Skullmafia",
  "SkullMafia",
  "Big O Hooligans",
  "Bulldogs",
  "OuterBank Admirals",
  "Outer Banks Admirals",
  "Baltimore Bandits",
  "Quebec Nordiques",
  "Crossbar Cowboys",
]

const MAX_GAMES_PER_SEASON = 60
const PLAYOFF_SPOTS = 8

/**
 * Determines playoff status for teams based on their current standings
 * @param standings Array of team standings sorted by points
 * @returns Updated standings with playoff status
 */
function calculatePlayoffStatus(standings: TeamStanding[]): TeamStanding[] {
  const sortedStandings = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
    return b.goals_for - a.goals_for
  })

  return sortedStandings.map((team, index) => {
    const gamesRemaining = MAX_GAMES_PER_SEASON - team.games_played
    const maxPossiblePoints = team.points + gamesRemaining * 2 // Assuming all wins

    // Check if team has clinched playoff spot
    let hasClinched = false
    if (index < PLAYOFF_SPOTS) {
      // Team is currently in playoff position
      // They clinch if the 9th place team (or first team outside playoffs) can't catch them
      const ninthPlaceTeam = sortedStandings[PLAYOFF_SPOTS]
      if (ninthPlaceTeam) {
        const ninthPlaceGamesRemaining = MAX_GAMES_PER_SEASON - ninthPlaceTeam.games_played
        const ninthPlaceMaxPoints = ninthPlaceTeam.points + ninthPlaceGamesRemaining * 2

        // Team clinches if even if 9th place wins all remaining games, they can't catch this team
        // assuming this team loses all remaining games
        const teamMinPoints = team.points // Current points (assuming all losses)
        hasClinched = teamMinPoints > ninthPlaceMaxPoints
      } else {
        // If there's no 9th place team, top 8 teams have clinched
        hasClinched = true
      }
    }

    // Check if team is eliminated
    let isEliminated = false
    if (index >= PLAYOFF_SPOTS) {
      // Team is currently outside playoff position
      const eighthPlaceTeam = sortedStandings[PLAYOFF_SPOTS - 1]
      if (eighthPlaceTeam) {
        const eighthPlaceGamesRemaining = MAX_GAMES_PER_SEASON - eighthPlaceTeam.games_played
        const eighthPlaceMinPoints = eighthPlaceTeam.points // Assuming 8th place loses all remaining games

        // Team is eliminated if even winning all remaining games won't get them to 8th place
        isEliminated = maxPossiblePoints < eighthPlaceMinPoints
      }
    }

    let playoff_status: "clinched" | "eliminated" | "active" = "active"
    if (hasClinched) {
      playoff_status = "clinched"
    } else if (isEliminated) {
      playoff_status = "eliminated"
    }

    return {
      ...team,
      playoff_status,
    }
  })
}

/**
 * Gets the season name for a given season ID
 * @param seasonId The season ID to look up
 * @returns The season name or a default value
 */
async function getSeasonName(seasonId: number): Promise<string> {
  try {
    // First try to get the season from the seasons table
    const { data: seasonData, error: seasonError } = await supabase
      .from("seasons")
      .select("name")
      .eq("id", seasonId)
      .maybeSingle()

    if (!seasonError && seasonData) {
      return seasonData.name
    }

    // If that fails, try with system_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "seasons")
      .single()

    if (!settingsError && settingsData) {
      const seasons = settingsData.value || []
      const season = seasons.find((s: any) => s.id === seasonId)
      if (season) {
        return season.name
      }
    }

    // If all else fails, return a default name
    return `Season ${seasonId}`
  } catch (error) {
    console.error("Error getting season name:", error)
    return `Season ${seasonId}`
  }
}

async function calculateLast10Record(teamId: string, seasonName: string): Promise<string> {
  try {
    // Get the last 10 completed matches for this team, ordered by match_date (most recent first)
    const { data: matches, error } = await supabase
      .from("matches")
      .select("id, match_date, home_team_id, away_team_id, home_score, away_score, status, overtime, has_overtime")
      .eq("season_name", seasonName)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .not("home_score", "is", null)
      .not("away_score", "is", null)
      .order("match_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching matches for L10:", error)
      return "0-0-0"
    }

    if (!matches || matches.length === 0) {
      console.log(`No completed matches found for team ${teamId} in season ${seasonName}`)
      return "0-0-0"
    }

    console.log(`Found ${matches.length} matches for team ${teamId} L10 calculation`)

    let wins = 0
    let losses = 0
    let otl = 0

    matches.forEach((match, index) => {
      const isHomeTeam = match.home_team_id === teamId
      const homeScore = Number.parseInt(match.home_score) || 0
      const awayScore = Number.parseInt(match.away_score) || 0

      // Check for overtime in multiple possible fields
      const isOvertime =
        match.overtime === true || match.has_overtime === true || match.overtime === 1 || match.has_overtime === 1

      console.log(
        `Match ${index + 1}: ${isHomeTeam ? "Home" : "Away"} - Score: ${homeScore}-${awayScore}, OT: ${isOvertime}`,
      )

      if (isHomeTeam) {
        // Team is home team
        if (homeScore > awayScore) {
          wins++
        } else if (homeScore < awayScore) {
          if (isOvertime) {
            otl++
          } else {
            losses++
          }
        } else if (homeScore === awayScore) {
          // Tie game - count as loss
          losses++
        }
      } else {
        // Team is away team
        if (awayScore > homeScore) {
          wins++
        } else if (awayScore < homeScore) {
          if (isOvertime) {
            otl++
          } else {
            losses++
          }
        } else if (awayScore === homeScore) {
          // Tie game - count as loss
          losses++
        }
      }
    })

    const result = `${wins}-${losses}-${otl}`
    console.log(`L10 result for team ${teamId}: ${result}`)
    return result
  } catch (error) {
    console.error("Error calculating last 10 record:", error)
    return "0-0-0"
  }
}

async function calculateCurrentStreak(teamId: string, seasonName: string): Promise<string> {
  try {
    // Get all completed matches for this team, ordered by match_date (most recent first)
    const { data: matches, error } = await supabase
      .from("matches")
      .select("id, match_date, home_team_id, away_team_id, home_score, away_score, status, overtime, has_overtime")
      .eq("season_name", seasonName)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .not("home_score", "is", null)
      .not("away_score", "is", null)
      .order("match_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching matches for streak:", error)
      return "-"
    }

    if (!matches || matches.length === 0) {
      return "-"
    }

    let streakCount = 0
    let streakType = ""

    // Look at matches starting from most recent
    for (const match of matches) {
      const isHomeTeam = match.home_team_id === teamId
      const homeScore = Number.parseInt(match.home_score) || 0
      const awayScore = Number.parseInt(match.away_score) || 0
      const isOvertime =
        match.overtime === true || match.has_overtime === true || match.overtime === 1 || match.has_overtime === 1

      let currentGameResult = ""

      if (isHomeTeam) {
        // Team is home team
        if (homeScore > awayScore) {
          currentGameResult = "W"
        } else if (homeScore < awayScore) {
          if (isOvertime) {
            currentGameResult = "OTL"
          } else {
            currentGameResult = "L"
          }
        } else if (homeScore === awayScore) {
          // Tie game - count as loss
          currentGameResult = "L"
        }
      } else {
        // Team is away team
        if (awayScore > homeScore) {
          currentGameResult = "W"
        } else if (awayScore < homeScore) {
          if (isOvertime) {
            currentGameResult = "OTL"
          } else {
            currentGameResult = "L"
          }
        } else if (awayScore === homeScore) {
          // Tie game - count as loss
          currentGameResult = "L"
        }
      }

      // If this is the first game, set the streak type
      if (streakCount === 0) {
        streakType = currentGameResult
        streakCount = 1
      } else if (currentGameResult === streakType) {
        // Continue the streak
        streakCount++
      } else {
        // Streak is broken
        break
      }
    }

    if (streakCount === 0) {
      return "-"
    }

    return `${streakType}${streakCount}`
  } catch (error) {
    console.error("Error calculating current streak:", error)
    return "-"
  }
}

/**
 * Gets team shots from EA team stats for a specific match
 * @param matchId The match ID to get team stats for
 * @returns Object with home and away team shots
 */
async function getTeamShotsFromEAStats(matchId: string): Promise<{ homeShots: number; awayShots: number }> {
  try {
    // Check if ea_team_stats table exists
    const { data: tableCheck } = await supabase.from("ea_team_stats").select("*").limit(1)

    if (!tableCheck) {
      return { homeShots: 0, awayShots: 0 }
    }

    // Get team stats for this match
    const { data: teamStats, error } = await supabase
      .from("ea_team_stats")
      .select("team_id, shots")
      .eq("match_id", matchId)

    if (error || !teamStats || teamStats.length === 0) {
      return { homeShots: 0, awayShots: 0 }
    }

    // Get the match to determine home/away teams
    const { data: match } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id")
      .eq("id", matchId)
      .single()

    if (!match) {
      return { homeShots: 0, awayShots: 0 }
    }

    let homeShots = 0
    let awayShots = 0

    teamStats.forEach((stat) => {
      if (stat.team_id === match.home_team_id) {
        homeShots = stat.shots || 0
      } else if (stat.team_id === match.away_team_id) {
        awayShots = stat.shots || 0
      }
    })

    return { homeShots, awayShots }
  } catch (error) {
    console.error("Error getting team shots from EA stats:", error)
    return { homeShots: 0, awayShots: 0 }
  }
}

/**
 * Calculates team standings for a specific season based on completed matches
 * @param seasonId The season ID to calculate standings for
 * @returns An array of team standings
 */
export async function calculateStandings(seasonId: number): Promise<TeamStanding[]> {
  try {
    console.log(`Calculating standings for season ${seasonId}`)

    // Get the season name first - this is more reliable than using the ID directly
    const seasonName = await getSeasonName(seasonId)
    console.log(`Using season name: "${seasonName}" for calculations`)

    // Check if division column exists by trying to query it
    let hasDivisionColumn = false
    try {
      const { data, error } = await supabase.from("teams").select("division").limit(1)
      hasDivisionColumn = !error
    } catch (e) {
      hasDivisionColumn = false
    }

    // Get all teams for the season
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, logo_url" + (hasDivisionColumn ? ", division, conference" : ""))
      .eq("is_active", true)

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      throw new Error(`Error fetching teams: ${teamsError.message}`)
    }

    if (!teams || teams.length === 0) {
      console.log(`No teams found for season ${seasonId}`)
      return []
    }

    console.log(`Found ${teams.length} teams for season ${seasonId}`)

    // Get all completed matches for the season using the season_name field
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
        id,
        match_date,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        overtime,
        has_overtime,
        status
      `,
      )
      .eq("season_name", seasonName)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .not("home_score", "is", null)
      .not("away_score", "is", null)

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      throw new Error(`Error fetching matches: ${matchesError.message}`)
    }

    console.log(`Found ${matches?.length || 0} completed matches for season ${seasonName}`)

    if (!matches || matches.length === 0) {
      console.log(`No completed matches found for season ${seasonName}`)
      // Return teams with zero stats
      const zeroStatsTeams = teams.map((team) => ({
        id: team.id,
        name: team.name,
        logo_url: team.logo_url,
        wins: 0,
        losses: 0,
        otl: 0,
        goals_for: 0,
        goals_against: 0,
        games_played: 0,
        points: 0,
        goal_differential: 0,
        shots_per_game: 0,
        total_shots: 0,
        powerplay_goals: 0,
        powerplay_opportunities: 0,
        powerplay_percentage: 0,
        penalty_kill_goals_against: 0,
        penalty_kill_opportunities: 0,
        penalty_kill_percentage: 0,
        division: hasDivisionColumn ? team.division : nhlDivisionTeams.includes(team.name) ? "NHL" : "Custom",
        conference: hasDivisionColumn ? team.conference : nhlDivisionTeams.includes(team.name) ? "NHL" : "Custom",
        last_10: "0-0-0",
        current_streak: "-",
        playoff_status: "active" as const,
      }))

      return calculatePlayoffStatus(zeroStatsTeams)
    }

    // Get all EA team stats for the matches to calculate shots
    const matchIds = matches.map((match) => match.id)

    // Try to get shots from multiple sources
    let shotsMap = new Map<string, number>()

    // First try ea_team_stats table
    try {
      const { data: eaTeamStats, error: eaError } = await supabase
        .from("ea_team_stats")
        .select("match_id, team_id, shots")
        .in("match_id", matchIds)

      if (!eaError && eaTeamStats) {
        console.log(`Found ${eaTeamStats.length} EA team stats records`)
        eaTeamStats.forEach((stat) => {
          const key = `${stat.match_id}-${stat.team_id}`
          shotsMap.set(key, stat.shots || 0)
        })
      }
    } catch (eaStatsError) {
      console.log("ea_team_stats table not available, trying alternative sources")
    }

    // If no shots from ea_team_stats, try to aggregate from ea_player_stats
    if (shotsMap.size === 0) {
      console.log("No EA team stats found, trying to aggregate from player stats")
      try {
        const { data: playerStats, error: playerError } = await supabase
          .from("ea_player_stats")
          .select("match_id, team_id, shots")
          .in("match_id", matchIds)

        if (!playerError && playerStats) {
          console.log(`Found ${playerStats.length} player stats records`)
          const teamShotsMap = new Map<string, number>()

          playerStats.forEach((stat) => {
            const key = `${stat.match_id}-${stat.team_id}`
            const currentShots = teamShotsMap.get(key) || 0
            teamShotsMap.set(key, currentShots + (stat.shots || 0))
          })

          shotsMap = teamShotsMap
          console.log(`Aggregated shots for ${shotsMap.size} team-match combinations`)
        }
      } catch (playerStatsError) {
        console.log("Could not aggregate from player stats:", playerStatsError)
      }
    }

    console.log(`Final shots map size: ${shotsMap.size}`)

    // Calculate standings for each team
    const standings: TeamStanding[] = await Promise.all(
      teams.map(async (team) => {
        // Get all matches for this team
        const teamMatches = matches.filter((match) => match.home_team_id === team.id || match.away_team_id === team.id)

        console.log(`Team ${team.name} has ${teamMatches.length} matches`)

        // Calculate last 10 games record and current streak
        const last10Record = await calculateLast10Record(team.id, seasonName)
        const currentStreak = await calculateCurrentStreak(team.id, seasonName)
        console.log(`Team ${team.name} L10: ${last10Record}, Streak: ${currentStreak}`)

        // Calculate wins, losses, otl, goals for, goals against, shots
        let wins = 0
        let losses = 0
        let otl = 0
        let goalsFor = 0
        let goalsAgainst = 0
        let totalShots = 0
        const powerplayGoals = 0
        const powerplayOpportunities = 0
        const penaltyKillGoalsAgainst = 0
        const penaltyKillOpportunities = 0

        teamMatches.forEach((match) => {
          const isHomeTeam = match.home_team_id === team.id
          const homeScore = match.home_score || 0
          const awayScore = match.away_score || 0
          const isOvertime = match.has_overtime || false

          // Get shots for this team in this match
          const shotsKey = `${match.id}-${team.id}`
          const teamShots = shotsMap.get(shotsKey) || 0

          totalShots += teamShots

          // Log for debugging
          console.log(
            `Team ${team.name} vs ${isHomeTeam ? match.away_team_id : match.home_team_id}: ${teamShots} shots`,
          )

          if (isHomeTeam) {
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
          } else {
            // Away team
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

        // Calculate points and other stats
        const points = wins * 2 + otl
        const gamesPlayed = wins + losses + otl
        const goalDifferential = goalsFor - goalsAgainst

        // Calculate shots per game with better logging
        const shotsPerGame = gamesPlayed > 0 ? totalShots / gamesPlayed : 0
        console.log(
          `Team ${team.name}: ${totalShots} total shots in ${gamesPlayed} games = ${shotsPerGame.toFixed(1)} SPG`,
        )

        // Calculate powerplay and penalty kill percentages
        let powerplayPercentage = 0
        if (powerplayOpportunities > 0) {
          powerplayPercentage = (powerplayGoals / powerplayOpportunities) * 100
        }

        let penaltyKillPercentage = 0
        if (penaltyKillOpportunities > 0) {
          penaltyKillPercentage =
            ((penaltyKillOpportunities - penaltyKillGoalsAgainst) / penaltyKillOpportunities) * 100
        }

        // Assign division if it doesn't exist in the database
        let division = team.division
        let conference = team.conference

        if (!hasDivisionColumn) {
          if (nhlDivisionTeams.includes(team.name)) {
            division = "NHL"
            conference = "NHL"
          } else if (customDivisionTeams.includes(team.name)) {
            division = "Custom"
            conference = "Custom"
          }
        }

        return {
          id: team.id,
          name: team.name,
          logo_url: team.logo_url,
          wins,
          losses,
          otl,
          games_played: gamesPlayed,
          points,
          goals_for: goalsFor,
          goals_against: goalsAgainst,
          goal_differential: goalDifferential,
          total_shots: totalShots,
          shots_per_game: Number(shotsPerGame.toFixed(1)),
          powerplay_goals: powerplayGoals,
          powerplay_opportunities: powerplayOpportunities,
          powerplay_percentage: powerplayPercentage,
          penalty_kill_goals_against: penaltyKillGoalsAgainst,
          penalty_kill_opportunities: penaltyKillOpportunities,
          penalty_kill_percentage: penaltyKillPercentage,
          division,
          conference,
          last_10: last10Record,
          current_streak: currentStreak,
          playoff_status: "active" as const, // Will be calculated below
        }
      }),
    )

    // Sort standings by points, wins, goal differential, goals for
    const sortedStandings = standings.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points
      }
      if (a.wins !== b.wins) {
        return b.wins - a.wins
      }
      if (a.goal_differential !== b.goal_differential) {
        return b.goal_differential - a.goal_differential
      }
      return b.goals_for - a.goals_for
    })

    // Calculate playoff status for all teams
    return calculatePlayoffStatus(sortedStandings)
  } catch (error: any) {
    console.error("Error calculating standings:", error)
    throw error
  }
}

export async function updateTeamStats(teamId: string, stats: Partial<TeamStanding>): Promise<void> {
  try {
    const { error } = await supabase
      .from("teams")
      .update({
        wins: stats.wins,
        losses: stats.losses,
        otl: stats.otl,
        goals_for: stats.goals_for,
        goals_against: stats.goals_against,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)

    if (error) {
      throw new Error(`Error updating team stats: ${error.message}`)
    }
  } catch (error: any) {
    console.error("Error updating team stats:", error)
    throw error
  }
}

export async function recalculateAndUpdateTeamStats(seasonId: number): Promise<void> {
  try {
    const standings = await calculateStandings(seasonId)

    // Update each team's stats in the database
    for (const team of standings) {
      await updateTeamStats(team.id, team)
    }
  } catch (error: any) {
    console.error("Error recalculating team stats:", error)
    throw error
  }
}

/**
 * Updates the stored team statistics based on calculated standings
 * @param seasonId The season ID to update statistics for
 * @returns A boolean indicating success or failure
 */
export async function updateTeamStatistics(seasonId: number): Promise<boolean> {
  try {
    console.log(`Updating team statistics for season ${seasonId}`)

    // Calculate standings
    const standings = await calculateStandings(seasonId)

    if (standings.length === 0) {
      console.log(`No standings to update for season ${seasonId}`)
      return false
    }

    // Update each team's statistics
    for (const team of standings) {
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          wins: team.wins,
          losses: team.losses,
          otl: team.otl,
          goals_for: team.goals_for,
          goals_against: team.goals_against,
          points: team.points,
          games_played: team.games_played,
          powerplay_goals: team.powerplay_goals,
          powerplay_opportunities: team.powerplay_opportunities,
          penalty_kill_goals_against: team.penalty_kill_goals_against,
          penalty_kill_opportunities: team.penalty_kill_opportunities,
          updated_at: new Date().toISOString(),
        })
        .eq("id", team.id)

      if (updateError) {
        console.error(`Error updating team ${team.id}:`, updateError)
        return false
      }
    }

    console.log(`Successfully updated team statistics for season ${seasonId}`)
    return true
  } catch (error) {
    console.error("Error updating team statistics:", error)
    return false
  }
}

/**
 * Gets the current season ID from system settings
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

/**
 * Gets all seasons from system settings
 * @returns An array of seasons
 */
export async function getSeasons(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("system_settings").select("value").eq("key", "seasons").single()

    if (error) {
      console.error("Error fetching seasons:", error)
      return []
    }

    return data?.value || []
  } catch (error) {
    console.error("Error getting seasons:", error)
    return []
  }
}
