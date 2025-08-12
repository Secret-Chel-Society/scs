/**
 * Utility function to debug EA match combination process
 */

export function debugEaMatchCombination(originalMatches: any[], combinedMatch: any) {
  console.log("=== EA MATCH COMBINATION DEBUG ===")

  // Log the number of original matches
  console.log(`Original matches: ${originalMatches.length}`)

  // Log basic info about each original match
  originalMatches.forEach((match, index) => {
    console.log(`\nOriginal Match #${index + 1} (ID: ${match.matchId}):`)

    // Log club information
    if (match.clubs) {
      console.log(`  Clubs: ${Object.keys(match.clubs).length}`)

      Object.entries(match.clubs).forEach(([clubId, club]: [string, any]) => {
        console.log(`  Club ${clubId}: ${club.name || "Unknown"}`)
        console.log(`    Goals: ${club.goals || club.details?.goals || 0}`)

        // Count players in this club
        const playerCount = club.players ? Object.keys(club.players).length : 0
        console.log(`    Players: ${playerCount}`)

        // Log a few player stats if available
        if (club.players) {
          Object.entries(club.players)
            .slice(0, 3)
            .forEach(([playerId, player]: [string, any]) => {
              console.log(
                `    Player ${player.persona || player.playername || playerId}: ${player.skgoals || player.goals || 0} goals, ${player.skassists || player.assists || 0} assists`,
              )
            })

          if (Object.keys(club.players).length > 3) {
            console.log(`    ... and ${Object.keys(club.players).length - 3} more players`)
          }
        }
      })
    }

    // Log player information from top-level players object if it exists
    if (match.players) {
      let totalPlayers = 0
      Object.values(match.players).forEach((clubPlayers: any) => {
        totalPlayers += Object.keys(clubPlayers || {}).length
      })

      console.log(`  Total players in top-level structure: ${totalPlayers}`)
    }
  })

  // Log information about the combined match
  console.log("\n=== COMBINED MATCH ===")
  if (combinedMatch) {
    console.log(`Combined Match ID: ${combinedMatch.matchId}`)

    // Log club information
    if (combinedMatch.clubs) {
      console.log(`Clubs: ${Object.keys(combinedMatch.clubs).length}`)

      Object.entries(combinedMatch.clubs).forEach(([clubId, club]: [string, any]) => {
        console.log(`Club ${clubId}: ${club.name || "Unknown"}`)
        console.log(`  Goals: ${club.goals || club.details?.goals || 0}`)
      })
    }

    // Log player information
    if (combinedMatch.players) {
      let totalPlayers = 0
      Object.values(combinedMatch.players).forEach((clubPlayers: any) => {
        totalPlayers += Object.keys(clubPlayers || {}).length
      })

      console.log(`Total players: ${totalPlayers}`)

      // Log a few sample players with their combined stats
      let sampleCount = 0
      Object.entries(combinedMatch.players).forEach(([clubId, clubPlayers]: [string, any]) => {
        if (sampleCount < 5) {
          Object.entries(clubPlayers)
            .slice(0, 2)
            .forEach(([playerId, player]: [string, any]) => {
              console.log(
                `Player ${player.persona || player.playername || playerId} (Club ${clubId}): ${player.skgoals || 0} goals, ${player.skassists || 0} assists, ${player.skshots || 0} shots`,
              )
              sampleCount++
            })
        }
      })
    }

    // Log metadata about the combination
    if (combinedMatch.isCombined) {
      console.log(`Combined from: ${combinedMatch.combinedFrom?.join(", ")}`)
      console.log(`Combined count: ${combinedMatch.combinedCount}`)
    }
  } else {
    console.log("Combined match is null or undefined!")
  }

  console.log("=== END DEBUG ===")
}
