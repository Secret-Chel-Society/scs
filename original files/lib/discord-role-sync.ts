export async function syncPlayerDiscordRole(
  userId: string,
  oldTeamId?: string | null,
  newTeamId?: string | null,
  action = "update_team_role",
) {
  try {
    console.log(`Syncing Discord role for user ${userId}: ${oldTeamId} -> ${newTeamId}`)

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        oldTeamId,
        newTeamId,
        action,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Discord role sync failed:", result.error)
      return { success: false, error: result.error }
    }

    console.log("Discord role sync completed:", result.message)
    return { success: true, message: result.message, details: result }
  } catch (error: any) {
    console.error("Discord role sync error:", error)
    return { success: false, error: error.message }
  }
}

export async function syncTradeDiscordRoles(tradeData: any) {
  try {
    console.log("Starting Discord role sync for trade...")

    // Sync roles for all players involved in the trade
    const syncPromises = []

    // Handle team A players (going to team B)
    if (tradeData.team_a_players && tradeData.team_a_players.length > 0) {
      for (const player of tradeData.team_a_players) {
        if (player.user_id) {
          console.log(`Syncing player ${player.name} from team A to team B`)
          syncPromises.push(syncPlayerDiscordRole(player.user_id, tradeData.team_a_id, tradeData.team_b_id, "trade"))
        }
      }
    }

    // Handle team B players (going to team A)
    if (tradeData.team_b_players && tradeData.team_b_players.length > 0) {
      for (const player of tradeData.team_b_players) {
        if (player.user_id) {
          console.log(`Syncing player ${player.name} from team B to team A`)
          syncPromises.push(syncPlayerDiscordRole(player.user_id, tradeData.team_b_id, tradeData.team_a_id, "trade"))
        }
      }
    }

    const results = await Promise.allSettled(syncPromises)

    const failures = results.filter(
      (result) => result.status === "rejected" || (result.status === "fulfilled" && !result.value.success),
    )

    if (failures.length > 0) {
      console.warn(`${failures.length} Discord role syncs failed for trade`)
      failures.forEach((failure, index) => {
        console.error(`Failure ${index + 1}:`, failure)
      })
    } else {
      console.log("All Discord role syncs completed successfully for trade")
    }

    return {
      success: failures.length === 0,
      totalSyncs: syncPromises.length,
      failures: failures.length,
      results: results.map((r) => (r.status === "fulfilled" ? r.value : { success: false, error: r.reason })),
    }
  } catch (error: any) {
    console.error("Trade Discord role sync error:", error)
    return { success: false, error: error.message }
  }
}

export async function removePlayerFromTeamRole(userId: string, teamId: string) {
  return syncPlayerDiscordRole(userId, teamId, null, "remove_team_role")
}

export async function addPlayerToTeamRole(userId: string, teamId: string) {
  return syncPlayerDiscordRole(userId, null, teamId, "add_team_role")
}
