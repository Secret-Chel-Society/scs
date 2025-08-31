import { createAdminClient } from "./supabase/server"

export interface PlayoffBracket {
  id: string
  season_id: string
  season_name: string
  round: number
  series: PlayoffSeries[]
  created_at: string
  updated_at: string
}

export interface PlayoffSeries {
  id: string
  bracket_id: string
  round: number
  series_number: number
  home_team_id: string
  away_team_id: string
  home_team: {
    id: string
    name: string
    logo_url?: string
    seed: number
  }
  away_team: {
    id: string
    name: string
    logo_url?: string
    seed: number
  }
  home_wins: number
  away_wins: number
  status: "pending" | "active" | "completed"
  winner_team_id?: string
  games: PlayoffGame[]
}

export interface PlayoffGame {
  id: string
  series_id: string
  game_number: number
  home_score?: number
  away_score?: number
  winner_team_id?: string
  status: "scheduled" | "in_progress" | "completed"
  match_date?: string
  match_id?: string
}

/**
 * Generates a playoff bracket for a season based on team standings
 * @param seasonId - The season ID
 * @returns Promise with bracket generation result
 */
export async function generatePlayoffBracket(seasonId: string): Promise<{ success: boolean; bracket?: PlayoffBracket; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get season information
    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("id, name")
      .eq("id", seasonId)
      .single()

    if (seasonError || !season) {
      console.error("Error fetching season:", seasonError)
      return { success: false, error: "Season not found" }
    }

    // Get team standings for the season
    const { data: standings, error: standingsError } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        logo_url,
        points,
        wins,
        losses,
        goals_for,
        goals_against
      `)
      .eq("is_active", true)
      .order("points", { ascending: false })
      .order("wins", { ascending: false })
      .order("goals_for", { ascending: false })

    if (standingsError) {
      console.error("Error fetching standings:", standingsError)
      return { success: false, error: "Failed to fetch team standings" }
    }

    if (!standings || standings.length < 8) {
      return { success: false, error: "Need at least 8 teams for playoffs" }
    }

    // Take top 8 teams for playoffs
    const playoffTeams = standings.slice(0, 8).map((team, index) => ({
      ...team,
      seed: index + 1
    }))

    // Create playoff bracket
    const { data: bracket, error: bracketError } = await supabase
      .from("playoff_brackets")
      .insert({
        season_id: seasonId,
        season_name: season.name,
        round: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (bracketError) {
      console.error("Error creating playoff bracket:", bracketError)
      return { success: false, error: "Failed to create playoff bracket" }
    }

    // Create first round series (8 teams = 4 series)
    const series = []
    for (let i = 0; i < 4; i++) {
      const homeTeam = playoffTeams[i]
      const awayTeam = playoffTeams[7 - i] // 1v8, 2v7, 3v6, 4v5

      const { data: seriesData, error: seriesError } = await supabase
        .from("playoff_series")
        .insert({
          bracket_id: bracket.id,
          round: 1,
          series_number: i + 1,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          home_wins: 0,
          away_wins: 0,
          status: "pending"
        })
        .select()
        .single()

      if (seriesError) {
        console.error("Error creating series:", seriesError)
        continue
      }

      series.push({
        ...seriesData,
        home_team: {
          id: homeTeam.id,
          name: homeTeam.name,
          logo_url: homeTeam.logo_url,
          seed: homeTeam.seed
        },
        away_team: {
          id: awayTeam.id,
          name: awayTeam.name,
          logo_url: awayTeam.logo_url,
          seed: awayTeam.seed
        },
        games: []
      })
    }

    const playoffBracket: PlayoffBracket = {
      ...bracket,
      series
    }

    return { success: true, bracket: playoffBracket }
  } catch (error: any) {
    console.error("Error generating playoff bracket:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets playoff bracket for a season
 * @param seasonId - The season ID
 * @returns Promise with playoff bracket
 */
export async function getPlayoffBracket(seasonId: string): Promise<{ success: boolean; bracket?: PlayoffBracket; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: bracket, error: bracketError } = await supabase
      .from("playoff_brackets")
      .select(`
        *,
        series:playoff_series (
          *,
          home_team:home_team_id (
            id,
            name,
            logo_url
          ),
          away_team:away_team_id (
            id,
            name,
            logo_url
          ),
          games:playoff_games (
            *
          )
        )
      `)
      .eq("season_id", seasonId)
      .single()

    if (bracketError) {
      console.error("Error fetching playoff bracket:", bracketError)
      return { success: false, error: "Playoff bracket not found" }
    }

    // Add seed information to teams
    const seriesWithSeeds = bracket.series?.map(series => {
      const homeSeed = getTeamSeed(series.home_team_id, bracket.series || [])
      const awaySeed = getTeamSeed(series.away_team_id, bracket.series || [])

      return {
        ...series,
        home_team: {
          ...series.home_team,
          seed: homeSeed
        },
        away_team: {
          ...series.away_team,
          seed: awaySeed
        }
      }
    }) || []

    const playoffBracket: PlayoffBracket = {
      ...bracket,
      series: seriesWithSeeds
    }

    return { success: true, bracket: playoffBracket }
  } catch (error: any) {
    console.error("Error getting playoff bracket:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Updates playoff series with game results
 * @param seriesId - The series ID
 * @param gameNumber - The game number
 * @param homeScore - Home team score
 * @param awayScore - Away team score
 * @returns Promise with update result
 */
export async function updatePlayoffGame(seriesId: string, gameNumber: number, homeScore: number, awayScore: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get series information
    const { data: series, error: seriesError } = await supabase
      .from("playoff_series")
      .select("*")
      .eq("id", seriesId)
      .single()

    if (seriesError || !series) {
      console.error("Error fetching series:", seriesError)
      return { success: false, error: "Series not found" }
    }

    // Update or create game
    const { data: game, error: gameError } = await supabase
      .from("playoff_games")
      .upsert({
        series_id: seriesId,
        game_number: gameNumber,
        home_score: homeScore,
        away_score: awayScore,
        winner_team_id: homeScore > awayScore ? series.home_team_id : series.away_team_id,
        status: "completed"
      }, { onConflict: "series_id,game_number" })
      .select()
      .single()

    if (gameError) {
      console.error("Error updating game:", gameError)
      return { success: false, error: "Failed to update game" }
    }

    // Update series wins
    const homeWins = homeScore > awayScore ? series.home_wins + 1 : series.home_wins
    const awayWins = awayScore > homeScore ? series.away_wins + 1 : series.away_wins

    const { error: updateError } = await supabase
      .from("playoff_series")
      .update({
        home_wins: homeWins,
        away_wins: awayWins,
        status: homeWins >= 4 || awayWins >= 4 ? "completed" : "active",
        winner_team_id: homeWins >= 4 ? series.home_team_id : awayWins >= 4 ? series.away_team_id : null
      })
      .eq("id", seriesId)

    if (updateError) {
      console.error("Error updating series:", updateError)
      return { success: false, error: "Failed to update series" }
    }

    // Check if we need to advance to next round
    await checkAndAdvanceRound(series.bracket_id)

    return { success: true }
  } catch (error: any) {
    console.error("Error updating playoff game:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Checks if all series in a round are complete and advances to next round
 * @param bracketId - The bracket ID
 * @returns Promise with advancement result
 */
async function checkAndAdvanceRound(bracketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get current round series
    const { data: currentRound, error: roundError } = await supabase
      .from("playoff_series")
      .select("*")
      .eq("bracket_id", bracketId)
      .eq("status", "completed")

    if (roundError) {
      console.error("Error fetching current round:", roundError)
      return { success: false, error: "Failed to fetch current round" }
    }

    // Get all series for current round
    const { data: allSeries, error: allSeriesError } = await supabase
      .from("playoff_series")
      .select("*")
      .eq("bracket_id", bracketId)
      .eq("round", currentRound?.[0]?.round || 1)

    if (allSeriesError) {
      console.error("Error fetching all series:", allSeriesError)
      return { success: false, error: "Failed to fetch all series" }
    }

    // Check if all series in current round are complete
    const allComplete = allSeries?.every(series => series.status === "completed")

    if (allComplete && allSeries && allSeries.length > 1) {
      // Advance to next round
      const nextRound = (allSeries[0].round || 1) + 1
      const winners = allSeries?.map(series => series.winner_team_id).filter(Boolean) || []

      // Create next round series
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          await supabase
            .from("playoff_series")
            .insert({
              bracket_id: bracketId,
              round: nextRound,
              series_number: Math.floor(i / 2) + 1,
              home_team_id: winners[i],
              away_team_id: winners[i + 1],
              home_wins: 0,
              away_wins: 0,
              status: "pending"
            })
        }
      }

      // Update bracket round
      await supabase
        .from("playoff_brackets")
        .update({ round: nextRound })
        .eq("id", bracketId)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error advancing round:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets team seed based on series position
 * @param teamId - The team ID
 * @param series - Array of series
 * @returns Team seed number
 */
function getTeamSeed(teamId: string, series: any[]): number {
  // This is a simplified seed calculation
  // In a real implementation, you'd want to store seeds in the database
  for (let i = 0; i < series.length; i++) {
    if (series[i].home_team_id === teamId) {
      return i + 1
    }
    if (series[i].away_team_id === teamId) {
      return 8 - i
    }
  }
  return 0
}

/**
 * Gets playoff bracket visualization data
 * @param seasonId - The season ID
 * @returns Promise with bracket visualization data
 */
export async function getPlayoffBracketVisualization(seasonId: string): Promise<{ success: boolean; visualization?: any; error?: string }> {
  try {
    const { success, bracket, error } = await getPlayoffBracket(seasonId)

    if (!success || !bracket) {
      return { success: false, error }
    }

    // Create visualization structure
    const visualization = {
      rounds: [
        {
          name: "First Round",
          series: bracket.series?.filter(s => s.round === 1) || []
        },
        {
          name: "Second Round",
          series: bracket.series?.filter(s => s.round === 2) || []
        },
        {
          name: "Conference Finals",
          series: bracket.series?.filter(s => s.round === 3) || []
        },
        {
          name: "Finals",
          series: bracket.series?.filter(s => s.round === 4) || []
        }
      ]
    }

    return { success: true, visualization }
  } catch (error: any) {
    console.error("Error getting playoff bracket visualization:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Resets playoff bracket for a season
 * @param seasonId - The season ID
 * @returns Promise with reset result
 */
export async function resetPlayoffBracket(seasonId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Delete existing bracket and all related data
    const { error: deleteError } = await supabase
      .from("playoff_brackets")
      .delete()
      .eq("season_id", seasonId)

    if (deleteError) {
      console.error("Error deleting playoff bracket:", deleteError)
      return { success: false, error: "Failed to reset playoff bracket" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error resetting playoff bracket:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}
