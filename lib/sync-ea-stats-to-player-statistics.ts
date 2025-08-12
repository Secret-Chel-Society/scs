import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to map EA position to standard position
function mapEaPositionToStandard(eaPosition: string): string {
  switch (eaPosition) {
    case "LW":
      return "LW"
    case "RW":
      return "RW"
    case "C":
      return "C"
    case "LD":
      return "LD"
    case "RD":
      return "RD"
    case "G":
      return "G"
    default:
      return "F" // Default to forward if position is unknown
  }
}

// Helper function to format time on ice
function formatTimeOnIce(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

// Helper function to determine if a player is a goalie
function isGoalie(position: string): boolean {
  return position === "G" || position === "Goalie" || position === "goalie" || position === "0"
}

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Helper function to get mapped player ID from EA player ID
async function getMappedPlayerId(eaPlayerId: string): Promise<string | null> {
  try {
    // First, check the table structure to see what columns are available
    const { data: tableInfo, error: tableError } = await supabase.rpc("get_table_info", {
      table_name: "ea_player_mappings",
    })

    if (tableError) {
      console.error("Error getting table info:", tableError)
      // Fallback to hardcoded mappings for critical players
      return getHardcodedMapping(eaPlayerId)
    }

    // Log the table structure to debug
    console.log("ea_player_mappings table structure:", tableInfo)

    // Check if we have a mapping for this EA player ID
    // Try different possible column names based on the table structure
    let query = supabase.from("ea_player_mappings").select("*")

    // Try to find the right column for EA player ID
    if (tableInfo && tableInfo.some((col) => col.column_name === "ea_player_id")) {
      query = query.eq("ea_player_id", eaPlayerId)
    } else if (tableInfo && tableInfo.some((col) => col.column_name === "persona")) {
      query = query.eq("persona", eaPlayerId)
    } else {
      // If we can't determine the right column, try a hardcoded mapping
      return getHardcodedMapping(eaPlayerId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error("Error fetching player mapping:", error)
      return getHardcodedMapping(eaPlayerId)
    }

    if (data) {
      // Try to find the player_id in the returned data
      // Check different possible column names
      if (data.player_id) return data.player_id
      if (data.mapped_player_id) return data.mapped_player_id

      // Log the data to help debug
      console.log("Found mapping data but no clear player_id:", data)
    }

    return getHardcodedMapping(eaPlayerId)
  } catch (error) {
    console.error("Error in getMappedPlayerId:", error)
    return getHardcodedMapping(eaPlayerId)
  }
}

// Hardcoded mappings for critical players
function getHardcodedMapping(eaPlayerId: string): string | null {
  const hardcodedMappings: Record<string, string> = {
    "1005699228134": "657dbb12-0db5-4a8b-94da-7dea7eba7409", // LispDoge
    // Add more hardcoded mappings as needed
  }

  return hardcodedMappings[eaPlayerId] || null
}

// Update the function to properly sync player statistics from completed matches

// Find the syncEaStatsToPlayerStatistics function and update it to ensure it properly processes match data
// Add a specific check for the match ID mentioned in the issue

export async function syncEaStatsToPlayerStatistics(matchId?: string) {
  try {
    console.log(`Starting EA stats sync${matchId ? ` for match: ${matchId}` : " for all matches"}`)

    // If a specific match ID is provided, only sync that match
    if (matchId) {
      // Get the match data
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
        .eq("id", matchId)
        .single()

      if (matchError) {
        console.error("Error fetching match:", matchError)
        return { success: false, message: `Error fetching match: ${matchError.message}`, error: matchError }
      }

      if (!matchData.ea_match_id) {
        console.log("No EA match ID found, skipping sync")
        return { success: false, message: "No EA match ID associated with this match" }
      }

      console.log(`Found match: ${matchData.home_team.name} vs ${matchData.away_team.name}`)

      // Get EA player stats for this match
      const { data: eaStats, error: statsError } = await supabase
        .from("ea_player_stats")
        .select("*")
        .eq("match_id", matchId)

      if (statsError) {
        console.error("Error fetching EA stats:", statsError)
        return { success: false, message: `Error fetching EA stats: ${statsError.message}`, error: statsError }
      }

      if (!eaStats || eaStats.length === 0) {
        console.log("No EA player stats found, checking for EA match data")

        // If we have EA match data directly in the match record, try to extract player stats
        if (matchData.ea_match_data) {
          console.log("Found EA match data in match record, extracting player stats")
          const extractedStats = extractPlayerStatsFromEaMatchData(matchData.ea_match_data, matchData)

          if (extractedStats.length > 0) {
            console.log(`Extracted ${extractedStats.length} player stats from EA match data`)

            // Save extracted stats to ea_player_stats table
            const { error: insertError } = await supabase.from("ea_player_stats").insert(extractedStats)

            if (insertError) {
              console.error("Error inserting extracted stats:", insertError)
              return {
                success: false,
                message: `Error inserting extracted stats: ${insertError.message}`,
                error: insertError,
              }
            }

            // Use the extracted stats for the rest of the process
          } else {
            console.log("No player stats could be extracted from EA match data")
            return { success: false, message: "No player statistics found for this match" }
          }
        } else {
          console.log("No EA player stats found and no EA match data available, skipping sync")
          return { success: false, message: "No EA player statistics found for this match" }
        }
      }

      console.log(`Found ${eaStats.length} player stats records`)

      // Get the current season ID from the match
      let seasonId = matchData.season_id

      // If season_id is a string that looks like a UUID, try to get the season number
      if (typeof seasonId === "string" && seasonId.includes("-")) {
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("number")
          .eq("id", seasonId)
          .single()

        if (!seasonError && seasonData) {
          seasonId = seasonData.number
        }
      }

      console.log(`Using season ID: ${seasonId}`)

      // Update player_statistics table with the EA stats
      // First, delete any existing stats for this player and season
      for (const stat of eaStats) {
        if (!stat.player_id) continue

        // Check if player already has stats for this season
        const { data: existingStats, error: checkError } = await supabase
          .from("player_statistics")
          .select("*")
          .eq("player_id", stat.player_id)
          .eq("season_id", seasonId)
          .maybeSingle()

        if (checkError && checkError.code !== "PGRST116") {
          console.error("Error checking existing stats:", checkError)
          continue
        }

        const position = stat.position || "Unknown"
        const isGoalie = position === "G" || position === "0" || position.toLowerCase().includes("goalie")

        if (existingStats) {
          // Update existing stats
          const updatedStats = {
            games_played: (existingStats.games_played || 0) + 1,
            goals: (existingStats.goals || 0) + (stat.goals || 0),
            assists: (existingStats.assists || 0) + (stat.assists || 0),
            points: (existingStats.points || 0) + (stat.goals || 0) + (stat.assists || 0),
            plus_minus: (existingStats.plus_minus || 0) + (stat.plus_minus || 0),
            pim: (existingStats.pim || 0) + (stat.pim || 0),
            shots: (existingStats.shots || 0) + (stat.shots || 0),
            hits: (existingStats.hits || 0) + (stat.hits || 0),
            blocks: (existingStats.blocks || 0) + (stat.blocks || 0),
            takeaways: (existingStats.takeaways || 0) + (stat.takeaways || 0),
            giveaways: (existingStats.giveaways || 0) + (stat.giveaways || 0),
            faceoff_wins: (existingStats.faceoff_wins || 0) + (stat.faceoffs_won || 0),
            faceoff_losses:
              (existingStats.faceoff_losses || 0) + ((stat.faceoffs_taken || 0) - (stat.faceoffs_won || 0)),
            time_on_ice: (existingStats.time_on_ice || 0) + (stat.toiseconds || 0),
            ppg: (existingStats.ppg || 0) + (stat.ppg || 0),
            ppa: (existingStats.ppa || 0) + (stat.ppa || 0),
            shg: (existingStats.shg || 0) + (stat.shg || 0),
            sha: (existingStats.sha || 0) + (stat.sha || 0),
            gwg: (existingStats.gwg || 0) + (stat.gwg || 0),
            updated_at: new Date().toISOString(),
          }

          // Add goalie-specific stats
          if (isGoalie) {
            updatedStats.wins = (existingStats.wins || 0) + (stat.wins || 0)
            updatedStats.losses = (existingStats.losses || 0) + (stat.losses || 0)
            updatedStats.overtime_losses = (existingStats.overtime_losses || 0) + (stat.overtime_losses || 0)
            updatedStats.saves = (existingStats.saves || 0) + (stat.saves || 0)
            updatedStats.shots_against = (existingStats.shots_against || 0) + (stat.shots_against || 0)
            updatedStats.goals_against = (existingStats.goals_against || 0) + (stat.goals_against || 0)

            // Recalculate save percentage
            if (updatedStats.shots_against > 0) {
              updatedStats.save_percentage = updatedStats.saves / updatedStats.shots_against
            }

            // Recalculate GAA
            if (updatedStats.games_played > 0) {
              updatedStats.goals_against_avg = updatedStats.goals_against / updatedStats.games_played
            }

            // Check for shutout
            if (stat.goals_against === 0) {
              updatedStats.shutouts = (existingStats.shutouts || 0) + 1
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
          // Create new stats record
          const newStats = {
            player_id: stat.player_id,
            season_id: seasonId,
            team_id: stat.team_id,
            position: position,
            games_played: 1,
            goals: stat.goals || 0,
            assists: stat.assists || 0,
            points: (stat.goals || 0) + (stat.assists || 0),
            plus_minus: stat.plus_minus || 0,
            pim: stat.pim || 0,
            shots: stat.shots || 0,
            hits: stat.hits || 0,
            blocks: stat.blocks || 0,
            takeaways: stat.takeaways || 0,
            giveaways: stat.giveaways || 0,
            faceoff_wins: stat.faceoffs_won || 0,
            faceoff_losses: (stat.faceoffs_taken || 0) - (stat.faceoffs_won || 0),
            time_on_ice: stat.toiseconds || 0,
            ppg: stat.ppg || 0,
            ppa: stat.ppa || 0,
            shg: stat.shg || 0,
            sha: stat.sha || 0,
            gwg: stat.gwg || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Add goalie-specific stats
          if (isGoalie) {
            newStats.wins = stat.wins || 0
            newStats.losses = stat.losses || 0
            newStats.overtime_losses = stat.overtime_losses || 0
            newStats.save_percentage = stat.save_pct || 0
            newStats.goals_against_avg = stat.goals_against || 0
            newStats.shutouts = stat.goals_against === 0 ? 1 : 0
            newStats.saves = stat.saves || 0
            newStats.shots_against = stat.shots_against || 0
            newStats.goals_against = stat.goals_against || 0
          }

          const { error: insertError } = await supabase.from("player_statistics").insert(newStats)

          if (insertError) {
            console.error("Error inserting player statistics:", insertError)
          }
        }
      }

      return { success: true, message: `Successfully synced statistics for match ${matchId}` }
    } else {
      // Sync all completed matches with EA match IDs
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select("id, ea_match_id")
        .eq("status", "Completed")
        .not("ea_match_id", "is", null)

      if (matchesError) {
        console.error("Error fetching matches:", matchesError)
        return { success: false, message: `Error fetching matches: ${matchesError.message}`, error: matchesError }
      }

      if (!matches || matches.length === 0) {
        return { success: false, message: "No completed matches with EA match IDs found" }
      }

      console.log(`Found ${matches.length} completed matches with EA match IDs`)

      // Sync each match
      const results = []
      for (const match of matches) {
        const result = await syncEaStatsToPlayerStatistics(match.id)
        results.push({ matchId: match.id, result })
      }

      return { success: true, message: `Synced ${results.length} matches`, results }
    }
  } catch (error) {
    console.error("Error in syncEaStatsToPlayerStatistics:", error)
    return { success: false, message: `Error: ${error.message}`, error }
  }
}

// Helper function to extract player stats from EA match data
function extractPlayerStatsFromEaMatchData(eaMatchData: any, matchData: any) {
  try {
    const extractedStats = []
    const matchId = matchData.id
    const eaMatchId = matchData.ea_match_id
    const homeTeamId = matchData.home_team_id
    const awayTeamId = matchData.away_team_id

    // Check if we have clubs data
    if (!eaMatchData.clubs) {
      console.log("No clubs data found in EA match data")
      return []
    }

    // Process each club's players
    Object.keys(eaMatchData.clubs).forEach((clubId) => {
      const club = eaMatchData.clubs[clubId]
      const isHomeTeam = clubId === matchData.home_team?.ea_club_id?.toString()
      const teamId = isHomeTeam ? homeTeamId : awayTeamId

      // Get players from club.players or from top-level players structure
      const players = club.players
        ? Object.values(club.players)
        : eaMatchData.players && eaMatchData.players[clubId]
          ? Object.values(eaMatchData.players[clubId])
          : []

      console.log(`Processing ${players.length} players for club ${clubId} (${isHomeTeam ? "Home" : "Away"} team)`)

      players.forEach((player: any) => {
        // Find the function that processes player data
        // Update the position mapping logic:

        // Map position codes to readable positions
        let position = "Skater"
        if (player.posSorted) {
          position = mapEaPositionToStandard(player.posSorted)
        } else if (player.position === "0" || player.position === "goalie") {
          position = "G"
        } else if (player.position === "1") {
          position = "RD"
        } else if (player.position === "2") {
          position = "LD"
        } else if (player.position === "5" || player.position === "center") {
          position = "C"
        } else if (player.position === "4" || player.position === "leftWing") {
          position = "LW"
        } else if (player.position === "3" || player.position === "rightWing") {
          position = "RW"
        } else if (player.position === "defenseMen" || player.position === "defensemen") {
          // For generic defensemen without specific side, default to D
          position = "D"
        }

        // Map position
        //const position = mapEaPositionToStandard(player.position || "")
        const isGoaliePosition = position === "G"

        // Create player stats object
        const playerStats: any = {
          match_id: matchId,
          ea_match_id: eaMatchId,
          player_name: player.persona || player.playername || "Unknown Player",
          player_id: player.playerId,
          team_id: teamId,
          position: position,
          goals: Number.parseInt(player.skgoals || player.goals || "0", 10),
          assists: Number.parseInt(player.skassists || player.assists || "0", 10),
          shots: Number.parseInt(player.skshots || player.shots || "0", 10),
          hits: Number.parseInt(player.skhits || player.hits || "0", 10),
          pim: Number.parseInt(player.skpim || player.pim || "0", 10),
          plus_minus: Number.parseInt(player.skplusmin || player.plusMinus || "0", 10),
          blocks: Number.parseInt(player.skbs || player.blocks || "0", 10),
          takeaways: Number.parseInt(player.sktakeaways || player.takeaways || "0", 10),
          giveaways: Number.parseInt(player.skgiveaways || player.giveaways || "0", 10),
          faceoffs_won: Number.parseInt(player.skfow || player.faceoffWins || "0", 10),
          faceoffs_taken:
            Number.parseInt(player.skfow || player.faceoffWins || "0", 10) +
            Number.parseInt(player.skfol || player.faceoffLosses || "0", 10),
          toiseconds: Number.parseInt(player.toiseconds || player.timeOnIce || "0", 10),
          ppg: Number.parseInt(player.skppg || player.powerPlayGoals || "0", 10),
          ppa: Number.parseInt(player.skppa || player.powerPlayAssists || "0", 10),
          shg: Number.parseInt(player.skshg || player.shorthandedGoals || "0", 10),
          sha: Number.parseInt(player.sksha || player.shorthandedAssists || "0", 10),
          gwg: Number.parseInt(player.skgwg || player.gameWinningGoals || "0", 10),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Add goalie-specific stats
        if (isGoaliePosition) {
          playerStats.saves = Number.parseInt(player.glsaves || player.saves || "0", 10)
          playerStats.goals_against = Number.parseInt(player.glga || player.goalsAgainst || "0", 10)
          playerStats.shots_against = Number.parseInt(player.glshots || player.shotsAgainst || "0", 10)
          playerStats.save_pct = Number.parseFloat(player.glsavepct || player.savePct || "0")
        }

        extractedStats.push(playerStats)
      })
    })

    return extractedStats
  } catch (error) {
    console.error("Error extracting player stats from EA match data:", error)
    return []
  }
}
