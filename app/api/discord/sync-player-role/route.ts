import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { userId, oldTeamId, newTeamId, action } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get player's Discord information
    const { data: discordUser, error: discordError } = await supabase
      .from("discord_users")
      .select("discord_id, discord_username")
      .eq("user_id", userId)
      .single()

    if (discordError || !discordUser) {
      console.log(`No Discord connection found for user ${userId}`)
      return NextResponse.json({ success: true, message: "No Discord connection found" })
    }

    // Get player name
    const { data: player, error: playerError } = await supabase
      .from("users")
      .select("gamer_tag_id")
      .eq("id", userId)
      .single()

    if (playerError || !player) {
      console.error("Error fetching player:", playerError)
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    let oldRoleId = null
    let newRoleId = null

    // Get old team role ID if provided
    if (oldTeamId) {
      const { data: oldTeam } = await supabase.from("teams").select("discord_role_id").eq("id", oldTeamId).single()

      oldRoleId = oldTeam?.discord_role_id
    }

    // Get new team role ID if provided
    if (newTeamId) {
      const { data: newTeam } = await supabase.from("teams").select("discord_role_id").eq("id", newTeamId).single()

      newRoleId = newTeam?.discord_role_id
    }

    // Prepare webhook payload for Discord bot
    const webhookPayload = {
      discord_id: discordUser.discord_id,
      player_name: player.gamer_tag_id,
      old_role_id: oldRoleId,
      new_role_id: newRoleId,
      action: action || "update_team_role",
    }

    // Send to Discord bot webhook
    const botWebhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL
    if (botWebhookUrl) {
      try {
        const webhookResponse = await fetch(botWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}`,
          },
          body: JSON.stringify(webhookPayload),
        })

        if (!webhookResponse.ok) {
          throw new Error(`Webhook failed: ${webhookResponse.status}`)
        }

        console.log(`Successfully synced Discord roles for ${player.gamer_tag_id}`)
        return NextResponse.json({ success: true, message: "Discord roles synced successfully" })
      } catch (webhookError) {
        console.error("Discord webhook error:", webhookError)

        // Log failed sync attempt
        await supabase.from("discord_sync_failures").insert({
          user_id: userId,
          discord_id: discordUser.discord_id,
          payload: webhookPayload,
          error_message: webhookError.message,
          retry_count: 0,
          created_at: new Date().toISOString(),
        })

        return NextResponse.json(
          {
            error: "Failed to sync Discord roles",
            details: webhookError.message,
          },
          { status: 500 },
        )
      }
    } else {
      console.log("No Discord bot webhook URL configured")
      return NextResponse.json({ success: true, message: "No Discord bot webhook configured" })
    }
  } catch (error: any) {
    console.error("Discord sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
