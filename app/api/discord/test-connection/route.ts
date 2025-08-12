import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Get bot configuration
    const { data: botConfig, error: botError } = await supabase.from("discord_bot_config").select("*").single()

    if (botError || !botConfig) {
      return NextResponse.json({ error: "Bot not configured" }, { status: 500 })
    }

    // Test Discord API connection
    const response = await fetch(`https://discord.com/api/guilds/${botConfig.guild_id}`, {
      headers: {
        Authorization: `Bot ${botConfig.bot_token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to connect to Discord API",
          status: response.status,
          statusText: response.statusText,
        },
        { status: 500 },
      )
    }

    const guildData = await response.json()

    return NextResponse.json({
      success: true,
      guild: {
        id: guildData.id,
        name: guildData.name,
        member_count: guildData.approximate_member_count,
      },
      bot_configured: true,
    })
  } catch (error: any) {
    console.error("Error testing Discord connection:", error)
    return NextResponse.json(
      {
        error: error.message,
        bot_configured: false,
      },
      { status: 500 },
    )
  }
}
