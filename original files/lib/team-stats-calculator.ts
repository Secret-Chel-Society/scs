import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Syncs team statistics for a specific team and season
 * @param teamId The team ID to sync statistics for
 * @param seasonId The season ID to sync statistics for
 * @returns A boolean indicating success or failure
 */
export async function syncTeamStats(teamId: string | number, seasonId: number): Promise<boolean> {
  try {
    console.log(`Syncing stats for team ${teamId} in season ${seasonId}`)

    // Get all completed matches for this team in the specified season
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("season_id", seasonId)
      .eq("status", "Completed")
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      return false
    }

    if (!matches || matches.length === 0) {
      console.log(`No completed matches found for team ${teamId} in season ${seasonId}`)

      // Reset team stats to zero since there are no completed matches
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          wins: 0,
          losses: 0,
          otl: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0,
          games_played: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teamId)

      if (updateError) {
        console.error("Error resetting team stats:", updateError)
        return false
      }

      return true
    }

    // Calculate team statistics
    let wins = 0
    let losses = 0
    let otl = 0 // overtime losses
    let goalsFor = 0
    let goalsAgainst = 0
    const gamesPlayed = matches.length

    for (const match of matches) {
      const isHomeTeam = match.home_team_id === teamId
      const homeScore = match.home_score || 0
      const awayScore = match.away_score || 0
      const isOvertime = match.has_overtime || false

      if (isHomeTeam) {
        // Team is home team
        goalsFor += homeScore
        goalsAgainst += awayScore

        if (homeScore > awayScore) {
          wins++
        } else if (homeScore < awayScore) {
          if (isOvertime) {
            otl++
          } else {
            losses++
          }
        }
      } else {
        // Team is away team
        goalsFor += awayScore
        goalsAgainst += homeScore

        if (awayScore > homeScore) {
          wins++
        } else if (awayScore < homeScore) {
          if (isOvertime) {
            otl++
          } else {
            losses++
          }
        }
      }
    }

    // Calculate points (2 for win, 1 for OTL, 0 for loss)
    const points = wins * 2 + otl

    // Update team statistics in the database
    const { error: updateError } = await supabase
      .from("teams")
      .update({
        wins,
        losses,
        otl,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        points,
        games_played: gamesPlayed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)

    if (updateError) {
      console.error("Error updating team stats:", updateError)
      return false
    }

    console.log(`Successfully synced stats for team ${teamId}`)
    return true
  } catch (error) {
    console.error("Error syncing team stats:", error)
    return false
  }
}

/**
 * Syncs statistics for all teams in a season
 * @param seasonId The season ID to sync statistics for
 * @returns A boolean indicating success or failure
 */
export async function syncAllTeamStats(seasonId: number): Promise<boolean> {
  try {
    console.log(`Syncing all team stats for season ${seasonId}`)

    // Get all teams
    const { data: teams, error: teamsError } = await supabase.from("teams").select("id")

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return false
    }

    if (!teams || teams.length === 0) {
      console.log("No teams found")
      return false
    }

    // Sync stats for each team
    for (const team of teams) {
      await syncTeamStats(team.id, seasonId)
    }

    return true
  } catch (error) {
    console.error("Error syncing all team stats:", error)
    return false
  }
}

/**
 * Syncs statistics for teams involved in a specific match
 * @param matchId The match ID to sync statistics for
 * @returns A boolean indicating success or failure
 */
export async function syncTeamsFromMatch(matchId: string): Promise<boolean> {
  try {
    console.log(`Syncing team stats for match ${matchId}`)

    // Get the match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id, season_id")
      .eq("id", matchId)
      .single()

    if (matchError) {
      console.error("Error fetching match:", matchError)
      return false
    }

    if (!match) {
      console.log(`Match ${matchId} not found`)
      return false
    }

    // Sync stats for both teams
    const homeSuccess = await syncTeamStats(match.home_team_id, match.season_id)
    const awaySuccess = await syncTeamStats(match.away_team_id, match.season_id)

    return homeSuccess && awaySuccess
  } catch (error) {
    console.error("Error syncing teams from match:", error)
    return false
  }
}
