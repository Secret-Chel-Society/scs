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

export async function GET() {
  try {
    // Get bot configuration (handle multiple configs)
    const { data: botConfigs, error: configError } = await supabaseAdmin
      .from("discord_bot_config")
      .select("*")
      .order("created_at", { ascending: false })

    if (configError || !botConfigs || botConfigs.length === 0) {
      return NextResponse.json({
        connected: false,
        error: "Bot configuration not found",
      })
    }

    // Use the most recent config
    const botConfig = botConfigs[0]
    const guildId = botConfig.guild_id
    const botToken = botConfig.bot_token

    if (!guildId || !botToken) {
      return NextResponse.json({
        connected: false,
        error: "Bot configuration incomplete",
      })
    }

    // Test Discord API connection
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        error: `Discord API error: ${response.status}`,
      })
    }

    const guildData = await response.json()

    return NextResponse.json({
      connected: true,
      guild: {
        id: guildData.id,
        name: guildData.name,
        memberCount: guildData.approximate_member_count || "Unknown",
      },
      config: {
        guildId,
        hasToken: !!botToken,
        configCount: botConfigs.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error.message || "Internal server error",
    })
  }
}
