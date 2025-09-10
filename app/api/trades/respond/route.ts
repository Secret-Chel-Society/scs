import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { notificationId, accept, userId } = await request.json()

    if (!notificationId || accept === undefined || !userId) {
      return NextResponse.json({ error: "Notification ID, accept status, and user ID are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // First, get the notification details and trade data from the notification
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single()

    if (notificationError || !notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Extract trade data from the notification message
    let tradeData = null
    try {
      const tradeDataMatch = notification.message.match(/TRADE_DATA:(.+)$/)
      if (tradeDataMatch) {
        tradeData = JSON.parse(tradeDataMatch[1])
      }
    } catch (e) {
      console.error("Failed to parse trade data:", e)
      return NextResponse.json({ error: "Failed to parse trade data from notification" }, { status: 500 })
    }

    if (!tradeData) {
      return NextResponse.json({ error: "Trade data not found in notification" }, { status: 400 })
    }

    // Validate that the user responding is a manager of a team
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("team_id, role")
      .eq("user_id", userId)
      .in("role", ["GM", "AGM", "Owner"])
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "User is not authorized to respond to this trade" }, { status: 403 })
    }

    // Determine the team responding to the trade
    const respondingTeamId = player.team_id

    // Determine the team proposing the trade
    let proposingTeamName = ""
    try {
      proposingTeamName = notification.title.match(/Trade Proposal from (.*)$/)[1]
    } catch (e) {
      console.error("Failed to parse proposing team name from notification title:", e)
      return NextResponse.json({ error: "Failed to parse proposing team name from notification" }, { status: 500 })
    }

    // Find the proposing team ID
    const { data: proposingTeam, error: proposingTeamError } = await supabase
      .from("teams")
      .select("id")
      .eq("name", proposingTeamName)
      .single()

    if (proposingTeamError || !proposingTeam) {
      return NextResponse.json({ error: "Proposing team not found" }, { status: 404 })
    }

    // Create a new trade record
    const { data: newTrade, error: newTradeError } = await supabase
      .from("trades")
      .insert([
        {
          team1_id: proposingTeam.id,
          team2_id: respondingTeamId,
          team1_players: JSON.stringify(tradeData.fromPlayers),
          team2_players: JSON.stringify(tradeData.toPlayers),
          status: accept ? "accepted" : "rejected", // Set status based on accept
        },
      ])
      .select("*")
      .single()

    if (newTradeError || !newTrade) {
      console.error("Error creating trade:", newTradeError)
      return NextResponse.json({ error: "Failed to create trade" }, { status: 500 })
    }

    // Update the notification status
    const newStatus = accept ? "accepted" : "rejected"

    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        message: notification.message + `\n\nSTATUS: ${newStatus.toUpperCase()}`,
      })
      .eq("id", notificationId)

    if (updateError) {
      console.error("Error updating notification:", updateError)
      return NextResponse.json({ error: "Failed to update notification status" }, { status: 500 })
    }

    // If trade is accepted, update player assignments
    if (accept) {
      try {
        // Parse player data from tradeData
        const team1Players = tradeData.fromPlayers || []
        const team2Players = tradeData.toPlayers || []

        console.log("Processing trade with players:", { team1Players, team2Players })

        // Update player team assignments
        const playerUpdates = []

        // Move team1 players (from proposing team) to team2 (responding team)
        for (const player of team1Players) {
          const playerId = player.id
          if (playerId) {
            console.log(`Moving player ${playerId} from team ${proposingTeam.id} to team ${respondingTeamId}`)
            playerUpdates.push(
              supabase
                .from("players")
                .update({ 
                  team_id: respondingTeamId,
                  updated_at: new Date().toISOString()
                })
                .eq("id", playerId),
            )
          }
        }

        // Move team2 players (from responding team) to team1 (proposing team)
        for (const player of team2Players) {
          const playerId = player.id
          if (playerId) {
            console.log(`Moving player ${playerId} from team ${respondingTeamId} to team ${proposingTeam.id}`)
            playerUpdates.push(
              supabase
                .from("players")
                .update({ 
                  team_id: proposingTeam.id,
                  updated_at: new Date().toISOString()
                })
                .eq("id", playerId),
            )
          }
        }

        // Execute all player updates
        if (playerUpdates.length > 0) {
          const updateResults = await Promise.all(playerUpdates)
          console.log("Player update results:", updateResults)
        }

        // Update trade status to completed
        const { error: updateTradeError } = await supabase
          .from("trades")
          .update({ 
            status: "completed",
            updated_at: new Date().toISOString()
          })
          .eq("id", newTrade.id)

        if (updateTradeError) {
          console.error("Error updating trade status to completed:", updateTradeError)
        }
      } catch (playerError) {
        console.error("Error updating player assignments:", playerError)
        return NextResponse.json({ error: "Failed to update player assignments" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Trade ${accept ? "accepted" : "rejected"} successfully`,
      trade: {
        id: newTrade.id,
        status: newStatus,
      },
    })
  } catch (error) {
    console.error("Error processing trade response:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
