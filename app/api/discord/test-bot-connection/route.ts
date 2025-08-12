import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function POST(request: Request) {
  try {
    console.log("Testing Discord bot connection...")

    // Get bot configuration (handle multiple configs)
    const { data: botConfigs, error: configError } = await supabaseAdmin
      .from("discord_bot_config")
      .select("*")
      .order("created_at", { ascending: false })

    if (configError) {
      console.error("Config error:", configError)
      return NextResponse.json(
        {
          error: "Bot configuration not found",
          step: "config_fetch",
          details: configError.message,
        },
        { status: 500 },
      )
    }

    if (!botConfigs || botConfigs.length === 0) {
      console.error("No bot configuration found")
      return NextResponse.json(
        {
          error: "Bot configuration not found",
          step: "config_missing",
          details: "No configuration records exist",
        },
        { status: 500 },
      )
    }

    // Use the most recent config
    const botConfig = botConfigs[0]
    const guildId = botConfig.guild_id
    const botToken = botConfig.bot_token

    if (!guildId || !botToken) {
      console.error("Missing required bot configuration")
      return NextResponse.json(
        {
          error: "Bot configuration incomplete",
          step: "config_validation",
          details: "Missing guild_id or bot_token",
        },
        { status: 500 },
      )
    }

    console.log("Testing connection with guild:", guildId)

    // Test Discord API connection
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Discord API error:", response.status, errorText)
      return NextResponse.json(
        {
          error: `Discord API error: ${response.status}`,
          step: "discord_api",
          details: errorText,
        },
        { status: response.status },
      )
    }

    const guildData = await response.json()
    console.log("Successfully connected to guild:", guildData.name)

    // Test getting bot user info
    const botResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    })

    let botUser = null
    if (botResponse.ok) {
      botUser = await botResponse.json()
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Discord server: ${guildData.name}`,
      results: {
        guild: {
          id: guildData.id,
          name: guildData.name,
          memberCount: guildData.approximate_member_count || "Unknown",
        },
        bot: botUser
          ? {
              id: botUser.id,
              username: botUser.username,
              discriminator: botUser.discriminator,
            }
          : null,
        connected: true,
        config: {
          guildId,
          hasToken: !!botToken,
          tokenLength: botToken?.length,
          configCount: botConfigs.length,
        },
      },
    })
  } catch (error: any) {
    console.error("Error testing bot connection:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        step: "exception",
        details: error.stack || "No stack trace available",
      },
      { status: 500 },
    )
  }
}
