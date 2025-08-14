import { createClient } from "@supabase/supabase-js"
import { mapEaPositionToStandard, getPositionCategory } from "./ea-position-mapper"

// Create a Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Syncs player statistics from EA match data to the player_statistics table
 * @param matchId The MGHL match ID
 * @param eaMatchId The EA match ID
 * @param eaMatchData The EA match data
 */
export async function syncPlayerStatisticsFromMatch(
  matchId: string,
  eaMatchId: string,
  eaMatchData: any,
): Promise<{ success: boolean; message: string; syncedPlayers: number }> {
  try {
    console.log(`Starting player statistics sync for match ${matchId}`)

    if (!eaMatchData || !eaMatchData.clubs) {
      return { success: false, message: "Invalid EA match data", syncedPlayers: 0 }
    }

    // Get the match details to check team IDs
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id, season_id, season_name")
      .eq("id", matchId)
      .single()

    if (matchError) {
      console.error("Error fetching match:", matchError)
      return { success: false, message: `Match not found: ${matchError.message}`, syncedPlayers: 0 }
    }

    // Get the current season
    let seasonNumber = 1 // Default to season 1

    // If season_id is a UUID, we need to get the season number
    if (typeof match.season_id === "string" && match.season_id.includes("-")) {
      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("number")
        .eq("id", match.season_id)
        .single()

      if (!seasonError && seasonData) {
        seasonNumber = seasonData.number
      }
    } else if (typeof match.season_id === "number") {
      seasonNumber = match.season_id
    } else if (match.season_name) {
      // Try to extract season number from name (e.g., "Season 1" -> 1)
      const seasonNameMatch = /Season\s+(\d+)/i.exec(match.season_name)
      if (seasonNameMatch && seasonNameMatch[1]) {
        seasonNumber = Number.parseInt(seasonNameMatch[1], 10)
      }
    }

    console.log(`Using season number ${seasonNumber} for match ${matchId}`)

    // Get team EA club IDs
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, ea_club_id")
      .in("id", [match.home_team_id, match.away_team_id])

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return { success: false, message: `Failed to get team EA club IDs: ${teamsError.message}`, syncedPlayers: 0 }
    }

    // Map team IDs to EA club IDs
    const teamEaClubIds: Record<string, string> = {}
    teams.forEach((team) => {
      if (team.ea_club_id) {
        teamEaClubIds[team.id] = team.ea_club_id
      }
    })

    // Get all season registrations for the current season
    const { data: seasonRegistrations, error: registrationsError } = await supabase
      .from("season_registrations")
      .select(`
        id,
        user_id,
        gamer_tag,
        primary_position,
        secondary_position,
        status
      `)
      .eq("season_id", seasonNumber)
      .eq("status", "approved")

    if (registrationsError) {
      console.error("Error fetching season registrations:", registrationsError)
      return {
        success: false,
        message: `Failed to get season registrations: ${registrationsError.message}`,
        syncedPlayers: 0,
      }
    }

    // Create a map of gamer tags to user IDs for quick lookup
    const gamerTagToUserId: Record<string, string> = {}
    seasonRegistrations.forEach((reg) => {
      if (reg.gamer_tag) {
        gamerTagToUserId[reg.gamer_tag.toLowerCase()] = reg.user_id
      }
    })

    // Get all players for the current season
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select(`
        id,
        user_id,
        team_id,
        ea_id
      `)
      .in("team_id", [match.home_team_id, match.away_team_id])

    if (playersError) {
      console.error("Error fetching players:", playersError)
      return { success: false, message: `Failed to get players: ${playersError.message}`, syncedPlayers: 0 }
    }

    // Create maps for quick lookups
    const userIdToPlayerId: Record<string, string> = {}
    const eaIdToPlayerId: Record<string, string> = {}
    const playerIdToTeamId: Record<string, string> = {}

    players.forEach((player) => {
      if (player.user_id) {
        userIdToPlayerId[player.user_id] = player.id
      }
      if (player.ea_id) {
        eaIdToPlayerId[player.ea_id.toLowerCase()] = player.id
      }
      if (player.team_id) {
        playerIdToTeamId[player.id] = player.team_id
      }
    })

    // Process each club's data
    let syncedPlayers = 0
    const statsToUpsert: any[] = []

    for (const clubId of Object.keys(eaMatchData.clubs)) {
      const club = eaMatchData.clubs[clubId]

      // Find which team this club belongs to
      const teamId = Object.keys(teamEaClubIds).find((id) => teamEaClubIds[id] === clubId)

      if (!teamId) {
        console.log(`Club ${clubId} does not match any team in the match`)
        continue
      }

      // Process player stats
      if (club.players) {
        for (const playerId of Object.keys(club.players)) {
          const player = club.players[playerId]
          const playerName = player.persona || "Unknown Player"

          // Try to match player to a registered user
          let matchedPlayerId: string | null = null

          // First try to match by EA ID if available
          if (player.playerId) {
            const eaId = player.playerId.toString().toLowerCase()
            if (eaIdToPlayerId[eaId]) {
              matchedPlayerId = eaIdToPlayerId[eaId]
            }
          }

          // If no match by EA ID, try to match by gamer tag
          if (!matchedPlayerId && playerName) {
            const gamerTag = playerName.toLowerCase()
            const userId = gamerTagToUserId[gamerTag]
            if (userId && userIdToPlayerId[userId]) {
              matchedPlayerId = userIdToPlayerId[userId]
            }
          }

          // Skip if we couldn't match the player
          if (!matchedPlayerId) {
            console.log(`Could not match player ${playerName} to a registered user`)
            continue
          }

          // Verify the player belongs to one of the teams in the match
          const playerTeamId = playerIdToTeamId[matchedPlayerId]
          if (playerTeamId !== match.home_team_id && playerTeamId !== match.away_team_id) {
            console.log(`Player ${playerName} is not on either team in the match`)
            continue
          }

          // Get position and category
          const position = mapEaPositionToStandard(player.position || "")
          const category = getPositionCategory(position)

          // Extract stats based on position category
          if (category === "goalie") {
            // Goalie stats
            const goalieStats = {
              player_id: matchedPlayerId,
              season_id: seasonNumber,
              team_id: teamId,
              position: position,
              games_played: 1,
              wins: player.outcome === "win" ? 1 : 0,
              losses: player.outcome === "loss" ? 1 : 0,
              overtime_losses: player.outcome === "otl" ? 1 : 0,
              save_percentage: player.savePct || 0,
              goals_against_avg: player.goalsAgainstAvg || 0,
              shutouts: player.goalsAgainst === 0 ? 1 : 0,
              saves: player.saves || 0,
              shots_against: player.shotsAgainst || 0,
              goals_against: player.goalsAgainst || 0,
              time_on_ice: player.timeOnIce || 0,
            }

            statsToUpsert.push(goalieStats)
          } else {
            // Skater stats
            const skaterStats = {
              player_id: matchedPlayerId,
              season_id: seasonNumber,
              team_id: teamId,
              position: position,
              games_played: 1,
              goals: player.goals || 0,
              assists: player.assists || 0,
              points: (player.goals || 0) + (player.assists || 0),
              plus_minus: player.plusMinus || 0,
              pim: player.pim || 0,
              shots: player.shots || 0,
              hits: player.hits || 0,
              blocks: player.blocks || 0,
              takeaways: player.takeaways || 0,
              giveaways: player.giveaways || 0,
              faceoff_wins: player.faceoffWins || 0,
              faceoff_losses: player.faceoffLosses || 0,
              time_on_ice: player.timeOnIce || 0,
              ppg: player.ppGoals || 0,
              ppa: player.ppAssists || 0,
              shg: player.shGoals || 0,
              sha: player.shAssists || 0,
              gwg: player.gwGoals || 0,
            }

            statsToUpsert.push(skaterStats)
          }

          syncedPlayers++
        }
      }
    }

    // Upsert player statistics
    if (statsToUpsert.length > 0) {
      // For each player, check if they already have stats for this season
      for (const stats of statsToUpsert) {
        const { data: existingStats, error: statsError } = await supabase
          .from("player_statistics")
          .select("*")
          .eq("player_id", stats.player_id)
          .eq("season_id", stats.season_id)
          .maybeSingle()

        if (statsError && statsError.code !== "PGRST116") {
          console.error("Error checking existing stats:", statsError)
          continue
        }

        if (existingStats) {
          // Update existing stats
          const updatedStats = {
            ...existingStats,
            games_played: (existingStats.games_played || 0) + 1,
            goals: (existingStats.goals || 0) + (stats.goals || 0),
            assists: (existingStats.assists || 0) + (stats.assists || 0),
            points: (existingStats.points || 0) + (stats.points || 0),
            plus_minus: (existingStats.plus_minus || 0) + (stats.plus_minus || 0),
            pim: (existingStats.pim || 0) + (stats.pim || 0),
            shots: (existingStats.shots || 0) + (stats.shots || 0),
            hits: (existingStats.hits || 0) + (stats.hits || 0),
            blocks: (existingStats.blocks || 0) + (stats.blocks || 0),
            takeaways: (existingStats.takeaways || 0) + (stats.takeaways || 0),
            giveaways: (existingStats.giveaways || 0) + (stats.giveaways || 0),
            faceoff_wins: (existingStats.faceoff_wins || 0) + (stats.faceoff_wins || 0),
            faceoff_losses: (existingStats.faceoff_losses || 0) + (stats.faceoff_losses || 0),
            time_on_ice: (existingStats.time_on_ice || 0) + (stats.time_on_ice || 0),
            ppg: (existingStats.ppg || 0) + (stats.ppg || 0),
            ppa: (existingStats.ppa || 0) + (stats.ppa || 0),
            shg: (existingStats.shg || 0) + (stats.shg || 0),
            sha: (existingStats.sha || 0) + (stats.sha || 0),
            gwg: (existingStats.gwg || 0) + (stats.gwg || 0),
            wins: (existingStats.wins || 0) + (stats.wins || 0),
            losses: (existingStats.losses || 0) + (stats.losses || 0),
            overtime_losses: (existingStats.overtime_losses || 0) + (stats.overtime_losses || 0),
            saves: (existingStats.saves || 0) + (stats.saves || 0),
            shots_against: (existingStats.shots_against || 0) + (stats.shots_against || 0),
            goals_against: (existingStats.goals_against || 0) + (stats.goals_against || 0),
            updated_at: new Date().toISOString(),
          }

          // Recalculate save percentage and GAA for goalies
          if (getPositionCategory(stats.position) === "goalie") {
            if (updatedStats.shots_against > 0) {
              updatedStats.save_percentage = updatedStats.saves / updatedStats.shots_against
            }
            if (updatedStats.games_played > 0) {
              updatedStats.goals_against_avg = updatedStats.goals_against / updatedStats.games_played
            }
          }

          const { error: updateError } = await supabase
            .from("player_statistics")
            .update(updatedStats)
            .eq("id", existingStats.id)

          if (updateError) {
            console.error("Error updating player statistics:", updateError)
          }
        } else {
          // Insert new stats
          const { error: insertError } = await supabase.from("player_statistics").insert({
            ...stats,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error("Error inserting player statistics:", insertError)
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully synced statistics for ${syncedPlayers} players`,
      syncedPlayers,
    }
  } catch (error: any) {
    console.error("Error syncing player statistics:", error)
    return {
      success: false,
      message: `Error syncing player statistics: ${error.message}`,
      syncedPlayers: 0,
    }
  }
}
