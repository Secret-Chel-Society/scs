import { createAdminClient } from "./supabase/server"

export interface EnhancedMatchData {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  status: string
  match_date: string
  overtime: boolean
  period_scores?: any
  home_team: {
    id: string
    name: string
    logo_url?: string
    record: string
    playoff_record?: string
  }
  away_team: {
    id: string
    name: string
    logo_url?: string
    record: string
    playoff_record?: string
  }
  team_stats: {
    home: TeamStats
    away: TeamStats
  }
  three_stars: PlayerStar[]
  player_lineups: {
    home: PlayerLineup[]
    away: PlayerLineup[]
  }
}

export interface TeamStats {
  goals: number
  shots: number
  hits: number
  faceoff_percentage: number
  passing_percentage: number
  penalty_minutes: number
  powerplay_goals: number
  powerplay_opportunities: number
  penalty_kill_goals_against: number
  penalty_kill_opportunities: number
}

export interface PlayerStar {
  id: string
  name: string
  team_id: string
  team_name: string
  position: string
  goals: number
  assists: number
  points: number
  star_number: number
  avatar_url?: string
}

export interface PlayerLineup {
  id: string
  name: string
  position: string
  goals: number
  assists: number
  points: number
  plus_minus: number
  shots: number
  hits: number
  penalty_minutes: number
  time_on_ice?: string
  avatar_url?: string
}

/**
 * Gets enhanced match data with all professional presentation features
 * @param matchId - The ID of the match
 * @returns Promise with enhanced match data
 */
export async function getEnhancedMatchData(matchId: string): Promise<{ success: boolean; match?: EnhancedMatchData; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get basic match data
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
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
        )
      `)
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.error("Error fetching match:", matchError)
      return { success: false, error: "Match not found" }
    }

    // Get team records
    const homeRecord = await getTeamRecord(match.home_team_id, match.season_name)
    const awayRecord = await getTeamRecord(match.away_team_id, match.season_name)

    // Get team stats
    const teamStats = await getTeamStats(matchId)

    // Get three stars
    const threeStars = await getThreeStars(matchId)

    // Get player lineups
    const playerLineups = await getPlayerLineups(matchId)

    const enhancedMatch: EnhancedMatchData = {
      id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      home_score: match.home_score || 0,
      away_score: match.away_score || 0,
      status: match.status,
      match_date: match.match_date,
      overtime: match.overtime || false,
      period_scores: match.period_scores,
      home_team: {
        ...match.home_team,
        record: homeRecord.regular,
        playoff_record: homeRecord.playoff
      },
      away_team: {
        ...match.away_team,
        record: awayRecord.regular,
        playoff_record: awayRecord.playoff
      },
      team_stats: teamStats,
      three_stars: threeStars,
      player_lineups: playerLineups
    }

    return { success: true, match: enhancedMatch }
  } catch (error: any) {
    console.error("Error getting enhanced match data:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets team record for regular season and playoffs
 * @param teamId - The team ID
 * @param seasonName - The season name
 * @returns Promise with team records
 */
async function getTeamRecord(teamId: string, seasonName: string): Promise<{ regular: string; playoff: string }> {
  try {
    const supabase = createAdminClient()

    // Get regular season record
    const { data: regularMatches, error: regularError } = await supabase
      .from("matches")
      .select("home_score, away_score, home_team_id, away_team_id")
      .eq("season_name", seasonName)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .not("season_name", "ilike", "%playoff%")

    // Get playoff record
    const { data: playoffMatches, error: playoffError } = await supabase
      .from("matches")
      .select("home_score, away_score, home_team_id, away_team_id")
      .eq("season_name", seasonName)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .ilike("season_name", "%playoff%")

    const regularRecord = calculateRecord(regularMatches || [], teamId)
    const playoffRecord = calculateRecord(playoffMatches || [], teamId)

    return {
      regular: `${regularRecord.wins}-${regularRecord.losses}-${regularRecord.otl}`,
      playoff: playoffMatches && playoffMatches.length > 0 ? `${playoffRecord.wins}-${playoffRecord.losses}` : "N/A"
    }
  } catch (error) {
    console.error("Error getting team record:", error)
    return { regular: "0-0-0", playoff: "N/A" }
  }
}

/**
 * Calculates wins, losses, and OTL from match data
 * @param matches - Array of matches
 * @param teamId - The team ID
 * @returns Record calculation
 */
function calculateRecord(matches: any[], teamId: string): { wins: number; losses: number; otl: number } {
  let wins = 0
  let losses = 0
  let otl = 0

  matches.forEach(match => {
    const isHome = match.home_team_id === teamId
    const teamScore = isHome ? match.home_score : match.away_score
    const opponentScore = isHome ? match.away_score : match.home_score

    if (teamScore > opponentScore) {
      wins++
    } else if (teamScore < opponentScore) {
      losses++
    } else {
      otl++
    }
  })

  return { wins, losses, otl }
}

/**
 * Gets comprehensive team statistics for a match
 * @param matchId - The match ID
 * @returns Promise with team stats
 */
async function getTeamStats(matchId: string): Promise<{ home: TeamStats; away: TeamStats }> {
  try {
    const supabase = createAdminClient()

    // Get EA match stats if available
    const { data: eaStats, error: eaError } = await supabase
      .from("ea_match_stats")
      .select("*")
      .eq("match_id", matchId)
      .maybeSingle()

    if (!eaError && eaStats) {
      return {
        home: {
          goals: eaStats.home_goals || 0,
          shots: eaStats.home_shots || 0,
          hits: eaStats.home_hits || 0,
          faceoff_percentage: eaStats.home_faceoff_percentage || 0,
          passing_percentage: eaStats.home_passing_percentage || 0,
          penalty_minutes: eaStats.home_penalty_minutes || 0,
          powerplay_goals: eaStats.home_powerplay_goals || 0,
          powerplay_opportunities: eaStats.home_powerplay_opportunities || 0,
          penalty_kill_goals_against: eaStats.home_penalty_kill_goals_against || 0,
          penalty_kill_opportunities: eaStats.home_penalty_kill_opportunities || 0
        },
        away: {
          goals: eaStats.away_goals || 0,
          shots: eaStats.away_shots || 0,
          hits: eaStats.away_hits || 0,
          faceoff_percentage: eaStats.away_faceoff_percentage || 0,
          passing_percentage: eaStats.away_passing_percentage || 0,
          penalty_minutes: eaStats.away_penalty_minutes || 0,
          powerplay_goals: eaStats.away_powerplay_goals || 0,
          powerplay_opportunities: eaStats.away_powerplay_opportunities || 0,
          penalty_kill_goals_against: eaStats.away_penalty_kill_goals_against || 0,
          penalty_kill_opportunities: eaStats.away_penalty_kill_opportunities || 0
        }
      }
    }

    // Fallback to basic stats
    return {
      home: {
        goals: 0,
        shots: 0,
        hits: 0,
        faceoff_percentage: 0,
        passing_percentage: 0,
        penalty_minutes: 0,
        powerplay_goals: 0,
        powerplay_opportunities: 0,
        penalty_kill_goals_against: 0,
        penalty_kill_opportunities: 0
      },
      away: {
        goals: 0,
        shots: 0,
        hits: 0,
        faceoff_percentage: 0,
        passing_percentage: 0,
        penalty_minutes: 0,
        powerplay_goals: 0,
        powerplay_opportunities: 0,
        penalty_kill_goals_against: 0,
        penalty_kill_opportunities: 0
      }
    }
  } catch (error) {
    console.error("Error getting team stats:", error)
    return {
      home: {
        goals: 0,
        shots: 0,
        hits: 0,
        faceoff_percentage: 0,
        passing_percentage: 0,
        penalty_minutes: 0,
        powerplay_goals: 0,
        powerplay_opportunities: 0,
        penalty_kill_goals_against: 0,
        penalty_kill_opportunities: 0
      },
      away: {
        goals: 0,
        shots: 0,
        hits: 0,
        faceoff_percentage: 0,
        passing_percentage: 0,
        penalty_minutes: 0,
        powerplay_goals: 0,
        powerplay_opportunities: 0,
        penalty_kill_goals_against: 0,
        penalty_kill_opportunities: 0
      }
    }
  }
}

/**
 * Gets the three stars of the match
 * @param matchId - The match ID
 * @returns Promise with three stars
 */
async function getThreeStars(matchId: string): Promise<PlayerStar[]> {
  try {
    const supabase = createAdminClient()

    // Get player stats for the match
    const { data: playerStats, error: statsError } = await supabase
      .from("ea_player_stats")
      .select(`
        *,
        players (
          id,
          users (
            id,
            gamer_tag_id,
            primary_position,
            avatar_url
          )
        ),
        teams (
          id,
          name
        )
      `)
      .eq("match_id", matchId)

    if (statsError || !playerStats) {
      console.error("Error fetching player stats:", statsError)
      return []
    }

    // Sort players by points (goals + assists)
    const sortedPlayers = playerStats
      .filter(stat => stat.players && stat.teams)
      .map(stat => ({
        id: stat.player_id,
        name: stat.players.users.gamer_tag_id,
        team_id: stat.team_id,
        team_name: stat.teams.name,
        position: stat.players.users.primary_position,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        points: (stat.goals || 0) + (stat.assists || 0),
        avatar_url: stat.players.users.avatar_url
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)

    // Add star numbers
    return sortedPlayers.map((player, index) => ({
      ...player,
      star_number: index + 1
    }))
  } catch (error) {
    console.error("Error getting three stars:", error)
    return []
  }
}

/**
 * Gets player lineups for both teams
 * @param matchId - The match ID
 * @returns Promise with player lineups
 */
async function getPlayerLineups(matchId: string): Promise<{ home: PlayerLineup[]; away: PlayerLineup[] }> {
  try {
    const supabase = createAdminClient()

    // Get match details to determine home and away teams
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.error("Error fetching match details:", matchError)
      return { home: [], away: [] }
    }

    // Get player stats for the match
    const { data: playerStats, error: statsError } = await supabase
      .from("ea_player_stats")
      .select(`
        *,
        players (
          id,
          users (
            id,
            gamer_tag_id,
            primary_position,
            avatar_url
          )
        )
      `)
      .eq("match_id", matchId)

    if (statsError || !playerStats) {
      console.error("Error fetching player stats:", statsError)
      return { home: [], away: [] }
    }

    // Separate players by team
    const homePlayers = playerStats
      .filter(stat => stat.team_id === match.home_team_id && stat.players)
      .map(stat => ({
        id: stat.player_id,
        name: stat.players.users.gamer_tag_id,
        position: stat.players.users.primary_position,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        points: (stat.goals || 0) + (stat.assists || 0),
        plus_minus: stat.plus_minus || 0,
        shots: stat.shots || 0,
        hits: stat.hits || 0,
        penalty_minutes: stat.penalty_minutes || 0,
        time_on_ice: stat.time_on_ice,
        avatar_url: stat.players.users.avatar_url
      }))
      .sort((a, b) => b.points - a.points)

    const awayPlayers = playerStats
      .filter(stat => stat.team_id === match.away_team_id && stat.players)
      .map(stat => ({
        id: stat.player_id,
        name: stat.players.users.gamer_tag_id,
        position: stat.players.users.primary_position,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        points: (stat.goals || 0) + (stat.assists || 0),
        plus_minus: stat.plus_minus || 0,
        shots: stat.shots || 0,
        hits: stat.hits || 0,
        penalty_minutes: stat.penalty_minutes || 0,
        time_on_ice: stat.time_on_ice,
        avatar_url: stat.players.users.avatar_url
      }))
      .sort((a, b) => b.points - a.points)

    return {
      home: homePlayers,
      away: awayPlayers
    }
  } catch (error) {
    console.error("Error getting player lineups:", error)
    return { home: [], away: [] }
  }
}

/**
 * Gets period-by-period scoring breakdown
 * @param matchId - The match ID
 * @returns Promise with period scores
 */
export async function getPeriodScores(matchId: string): Promise<{ success: boolean; periodScores?: any; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("period_scores, home_score, away_score")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.error("Error fetching match:", matchError)
      return { success: false, error: "Match not found" }
    }

    // If period_scores is already stored, use it
    if (match.period_scores) {
      return { success: true, periodScores: match.period_scores }
    }

    // Otherwise, try to calculate from EA data
    const { data: eaStats, error: eaError } = await supabase
      .from("ea_match_stats")
      .select("period_scores")
      .eq("match_id", matchId)
      .maybeSingle()

    if (!eaError && eaStats?.period_scores) {
      return { success: true, periodScores: eaStats.period_scores }
    }

    // Fallback: create basic period structure
    const basicPeriodScores = {
      "1": { home: 0, away: 0 },
      "2": { home: 0, away: 0 },
      "3": { home: 0, away: 0 }
    }

    return { success: true, periodScores: basicPeriodScores }
  } catch (error: any) {
    console.error("Error getting period scores:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Updates match with enhanced data
 * @param matchId - The match ID
 * @param enhancedData - The enhanced data to update
 * @returns Promise with update result
 */
export async function updateMatchWithEnhancedData(matchId: string, enhancedData: Partial<EnhancedMatchData>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("matches")
      .update({
        period_scores: enhancedData.period_scores,
        updated_at: new Date().toISOString()
      })
      .eq("id", matchId)

    if (error) {
      console.error("Error updating match:", error)
      return { success: false, error: "Failed to update match" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error updating match with enhanced data:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}
