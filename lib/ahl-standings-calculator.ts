import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export interface AHLTeamStanding {
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
  playoff_status?: "clinched" | "eliminated" | "active"
}

const MAX_GAMES_PER_SEASON = 54
const PLAYOFF_SPOTS = 16

function calculatePlayoffStatus(standings: AHLTeamStanding[]): AHLTeamStanding[] {
  const sortedStandings = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
    return b.goals_for - a.goals_for
  })

  return sortedStandings.map((team, index) => {
    const gamesRemaining = MAX_GAMES_PER_SEASON - team.games_played
    const maxPossiblePoints = team.points + gamesRemaining * 2

    let hasClinched = false
    if (index < PLAYOFF_SPOTS) {
      const ninthPlaceTeam = sortedStandings[PLAYOFF_SPOTS]
      if (ninthPlaceTeam) {
        const ninthPlaceGamesRemaining = MAX_GAMES_PER_SEASON - ninthPlaceTeam.games_played
        const ninthPlaceMaxPoints = ninthPlaceTeam.points + ninthPlaceGamesRemaining * 2
        const teamMinPoints = team.points
        hasClinched = teamMinPoints > ninthPlaceMaxPoints
      } else {
        hasClinched = true
      }
    }

    let isEliminated = false
    if (index >= PLAYOFF_SPOTS) {
      const eighthPlaceTeam = sortedStandings[PLAYOFF_SPOTS - 1]
      if (eighthPlaceTeam) {
        const eighthPlaceMinPoints = eighthPlaceTeam.points
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

async function calculateLast10Record(teamId: string, seasonName: string): Promise<string> {
  try {
    const { data: matches, error } = await supabase
      .from("matches_ahl")
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
      console.error("[AHL] Error fetching matches for L10:", error)
      return "0-0-0"
    }

    if (!matches || matches.length === 0) {
      return "0-0-0"
    }

    let wins = 0
    let losses = 0
    let otl = 0

    matches.forEach((match) => {
      const isHomeTeam = match.home_team_id === teamId
      const homeScore = Number.parseInt(match.home_score) || 0
      const awayScore = Number.parseInt(match.away_score) || 0
      const isOvertime =
        match.overtime === true || match.has_overtime === true || match.overtime === 1 || match.has_overtime === 1

      if (isHomeTeam) {
        if (homeScore > awayScore) {
          wins++
        } else if (homeScore < awayScore) {
          if (isOvertime) {
            otl++
          } else {
            losses++
          }
        } else {
          losses++
        }
      } else {
        if (awayScore > homeScore) {
          wins++
        } else if (awayScore < homeScore) {
          if (isOvertime) {
            otl++
          } else {
            losses++
          }
        } else {
          losses++
        }
      }
    })

    return `${wins}-${losses}-${otl}`
  } catch (error) {
    console.error("[AHL] Error calculating last 10 record:", error)
    return "0-0-0"
  }
}

async function calculateCurrentStreak(teamId: string, seasonName: string): Promise<string> {
  try {
    const { data: matches, error } = await supabase
      .from("matches_ahl")
      .select("id, match_date, home_team_id, away_team_id, home_score, away_score, status, overtime, has_overtime")
      .eq("season_name", seasonName)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .not("home_score", "is", null)
      .not("away_score", "is", null)
      .order("match_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[AHL] Error fetching matches for streak:", error)
      return "-"
    }

    if (!matches || matches.length === 0) {
      return "-"
    }

    let streakCount = 0
    let streakType = ""

    for (const match of matches) {
      const isHomeTeam = match.home_team_id === teamId
      const homeScore = Number.parseInt(match.home_score) || 0
      const awayScore = Number.parseInt(match.away_score) || 0
      const isOvertime =
        match.overtime === true || match.has_overtime === true || match.overtime === 1 || match.has_overtime === 1

      let currentGameResult = ""

      if (isHomeTeam) {
        if (homeScore > awayScore) {
          currentGameResult = "W"
        } else if (homeScore < awayScore) {
          if (isOvertime) {
            currentGameResult = "OTL"
          } else {
            currentGameResult = "L"
          }
        } else {
          currentGameResult = "L"
        }
      } else {
        if (awayScore > homeScore) {
          currentGameResult = "W"
        } else if (awayScore < homeScore) {
          if (isOvertime) {
            currentGameResult = "OTL"
          } else {
            currentGameResult = "L"
          }
        } else {
          currentGameResult = "L"
        }
      }

      if (streakCount === 0) {
        streakType = currentGameResult
        streakCount = 1
      } else if (currentGameResult === streakType) {
        streakCount++
      } else {
        break
      }
    }

    if (streakCount === 0) {
      return "-"
    }

    return `${streakType}${streakCount}`
  } catch (error) {
    console.error("[AHL] Error calculating current streak:", error)
    return "-"
  }
}

export async function calculateAHLStandings(seasonId: string): Promise<AHLTeamStanding[]> {
  try {
    console.log(`[AHL] Calculating standings for season ${seasonId}`)

    // Get AHL season (UUID id + season_number + name)
    const { data: seasonData, error: seasonError } = await supabase
      .from("seasons_ahl")
      .select("id, season_number, name")
      .eq("id", seasonId)
      .single()

    if (seasonError || !seasonData) {
      console.error("[AHL] Error fetching season data:", seasonError)
      throw new Error(`Error fetching season: ${seasonError?.message}`)
    }

    const seasonName = seasonData.name
    const seasonNumber = seasonData.season_number
    console.log(
      `[AHL] Using season name: "${seasonName}" (number: ${seasonNumber}) for standings + matches_ahl queries`,
    )

    // 🔹 KEY CHANGE: use team_seasons_ahl like NHL uses team_seasons
    const { data: teamSeasons, error: teamSeasonsError } = await supabase
      .from("team_seasons_ahl")
      .select(
        `
        team_id,
        is_active,
        teams_ahl!inner (
          id,
          name,
          logo_url,
          Division,
          Conference
        )
      `,
      )
      .eq("season_id", seasonId)
      .eq("is_active", true)

    if (teamSeasonsError) {
      console.error("[AHL] Error fetching teams from team_seasons_ahl:", teamSeasonsError)
      throw new Error(`Error fetching teams: ${teamSeasonsError.message}`)
    }

    if (!teamSeasons || teamSeasons.length === 0) {
      console.log(`[AHL] No active teams found for season ${seasonId} in team_seasons_ahl`)
      return []
    }

    const teams = teamSeasons.map((ts: any) => ({
      id: ts.teams_ahl.id,
      name: ts.teams_ahl.name,
      logo_url: ts.teams_ahl.logo_url,
      division: ts.teams_ahl.Division,
      conference: ts.teams_ahl.Conference,
    }))

    console.log(`[AHL] Found ${teams.length} active teams for season ${seasonId}`)

    // Get completed AHL matches for that season (by season_name, like NHL)
    const { data: matches, error: matchesError } = await supabase
      .from("matches_ahl")
      .select("id, match_date, home_team_id, away_team_id, home_score, away_score, overtime, has_overtime, status")
      .eq("season_name", seasonName)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .not("home_score", "is", null)
      .not("away_score", "is", null)

    if (matchesError) {
      console.error("[AHL] Error fetching matches:", matchesError)
      throw new Error(`Error fetching matches: ${matchesError.message}`)
    }

    console.log(`[AHL] Found ${matches?.length || 0} completed matches for season "${seasonName}"`)

    if (!matches || matches.length === 0) {
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
        division: team.division,
        conference: team.conference,
        last_10: "0-0-0",
        current_streak: "-",
        playoff_status: "active" as const,
      }))

      return calculatePlayoffStatus(zeroStatsTeams)
    }

    const matchIds = matches.map((match) => match.id)
    let shotsMap = new Map<string, number>()

    // Try EA team stats first
    try {
      const { data: eaTeamStats, error: eaError } = await supabase
        .from("ea_team_stats_ahl")
        .select("match_id, team_id, shots")
        .in("match_id", matchIds)

      if (!eaError && eaTeamStats) {
        console.log(`[AHL] Found ${eaTeamStats.length} EA team stats records`)
        eaTeamStats.forEach((stat: any) => {
          const key = `${stat.match_id}-${stat.team_id}`
          shotsMap.set(key, stat.shots || 0)
        })
      }
    } catch (eaStatsError) {
      console.log("[AHL] ea_team_stats_ahl table not available, trying player stats")
    }

    // Fallback: aggregate from player stats
    if (shotsMap.size === 0) {
      try {
        const { data: playerStats, error: playerError } = await supabase
          .from("ea_player_stats_ahl")
          .select("match_id, team_id, shots")
          .in("match_id", matchIds)

        if (!playerError && playerStats) {
          console.log(`[AHL] Found ${playerStats.length} player stats records`)
          const teamShotsMap = new Map<string, number>()

          playerStats.forEach((stat: any) => {
            const key = `${stat.match_id}-${stat.team_id}`
            const currentShots = teamShotsMap.get(key) || 0
            teamShotsMap.set(key, currentShots + (stat.shots || 0))
          })

          shotsMap = teamShotsMap
          console.log(`[AHL] Aggregated shots for ${shotsMap.size} team-match combinations`)
        }
      } catch (playerStatsError) {
        console.log("[AHL] Could not aggregate from player stats:", playerStatsError)
      }
    }

    const standings: AHLTeamStanding[] = await Promise.all(
      teams.map(async (team) => {
        const teamMatches = matches.filter(
          (match) => match.home_team_id === team.id || match.away_team_id === team.id,
        )

        const last10Record = await calculateLast10Record(team.id, seasonName)
        const currentStreak = await calculateCurrentStreak(team.id, seasonName)

        let wins = 0
        let losses = 0
        let otl = 0
        let goalsFor = 0
        let goalsAgainst = 0
        let totalShots = 0

        teamMatches.forEach((match) => {
          const isHomeTeam = match.home_team_id === team.id
          const homeScore = match.home_score || 0
          const awayScore = match.away_score || 0

          const shotsKey = `${match.id}-${team.id}`
          const teamShots = shotsMap.get(shotsKey) || 0
          totalShots += teamShots

          if (isHomeTeam) {
            goalsFor += homeScore
            goalsAgainst += awayScore

            if (homeScore > awayScore) {
              wins++
            } else if (homeScore < awayScore) {
              if (match.overtime === true || match.has_overtime === true) {
                otl++
              } else {
                losses++
              }
            } else {
              losses++
            }
          } else {
            goalsFor += awayScore
            goalsAgainst += homeScore

            if (awayScore > homeScore) {
              wins++
            } else if (awayScore < homeScore) {
              if (match.overtime === true || match.has_overtime === true) {
                otl++
              } else {
                losses++
              }
            } else {
              losses++
            }
          }
        })

        const points = wins * 2 + otl
        const gamesPlayed = wins + losses + otl
        const goalDifferential = goalsFor - goalsAgainst
        const shotsPerGame = gamesPlayed > 0 ? totalShots / gamesPlayed : 0

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
          powerplay_goals: 0,
          powerplay_opportunities: 0,
          powerplay_percentage: 0,
          penalty_kill_goals_against: 0,
          penalty_kill_opportunities: 0,
          penalty_kill_percentage: 0,
          division: team.division,
          conference: team.conference,
          last_10: last10Record,
          current_streak: currentStreak,
          playoff_status: "active" as const,
        }
      }),
    )

    const sortedStandings = standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
      return b.goals_for - a.goals_for
    })

    return calculatePlayoffStatus(sortedStandings)
  } catch (error: any) {
    console.error("[AHL] Error calculating standings:", error)
    throw error
  }
}

export async function getAHLSeasons(): Promise<{ id: string; name: string; is_active: boolean }[]> {
  try {
    const { data: seasonsData, error: seasonsError } = await supabase
      .from("seasons_ahl")
      .select("id, name, is_active")
      .order("id", { ascending: true })

    if (seasonsError) {
      console.error("[AHL] Error fetching seasons:", seasonsError)
      return []
    }

    if (!seasonsData || seasonsData.length === 0) {
      return []
    }

    const { data: currentSeasonData } = await supabase
      .from("system_settings_ahl")
      .select("value")
      .eq("key", "current_season")
      .single()

    let currentSeasonId: string | null = null
    if (currentSeasonData) {
      currentSeasonId = currentSeasonData.value
    }

    const seasonsWithActiveStatus = seasonsData.map((season) => ({
      id: season.id,
      name: season.name,
      is_active: currentSeasonId ? season.id === currentSeasonId : season.is_active,
    }))

    return seasonsWithActiveStatus
  } catch (error) {
    console.error("[AHL] Error getting seasons:", error)
    return []
  }
}
