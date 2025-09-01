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
    const guildResponse = await fetch(`https://discord.com/api/guilds/${botConfig.guild_id}`, {
      headers: {
        Authorization: `Bot ${botConfig.bot_token}`,
      },
    })

    if (!guildResponse.ok) {
      const errorText = await guildResponse.text()
      return NextResponse.json({
        error: "Failed to connect to Discord",
        status: guildResponse.status,
        details: errorText,
      })
    }

    const guildData = await guildResponse.json()

    // Get bot member info
    const botResponse = await fetch(`https://discord.com/api/users/@me`, {
      headers: {
        Authorization: `Bot ${botConfig.bot_token}`,
      },
    })

    const botData = await botResponse.json()

    // Get bot member in guild
    const botMemberResponse = await fetch(
      `https://discord.com/api/guilds/${botConfig.guild_id}/members/${botData.id}`,
      {
        headers: {
          Authorization: `Bot ${botConfig.bot_token}`,
        },
      },
    )

    const botMemberData = await botMemberResponse.json()

    // Get all roles in the guild
    const rolesResponse = await fetch(`https://discord.com/api/guilds/${botConfig.guild_id}/roles`, {
      headers: {
        Authorization: `Bot ${botConfig.bot_token}`,
      },
    })

    const rolesData = await rolesResponse.json()

    // Check if registered role exists
    const registeredRole = rolesData.find((role: any) => role.id === botConfig.registered_role_id)

    // Get database info
    const { data: discordUsers } = await supabase.from("discord_users").select("count")
    const { data: teamRoles } = await supabase.from("discord_team_roles").select("*")
    const { data: managementRoles } = await supabase.from("discord_management_roles").select("*")

    return NextResponse.json({
      success: true,
      guild: {
        name: guildData.name,
        id: guildData.id,
        member_count: guildData.member_count,
      },
      bot: {
        username: botData.username,
        id: botData.id,
        roles: botMemberData.roles || [],
      },
      config: {
        registered_role_id: botConfig.registered_role_id,
        registered_role_exists: !!registeredRole,
        registered_role_name: registeredRole?.name || "Not Found",
      },
      roles: {
        total: rolesData.length,
        all_roles: rolesData.map((role: any) => ({
          id: role.id,
          name: role.name,
          position: role.position,
          permissions: role.permissions,
        })),
      },
      database: {
        discord_users_count: discordUsers?.length || 0,
        team_roles_count: teamRoles?.length || 0,
        management_roles_count: managementRoles?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("Discord debug error:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Failed to debug Discord bot",
      },
      { status: 500 },
    )
  }
}
