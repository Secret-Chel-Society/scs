import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    console.log(`=== Debug Discord Role Assignment for User: ${userId} ===`)

    // Get user info with Discord connection and team info
    const { data: userInfo, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        discord_id,
        gamer_tag_id,
        email,
        players!inner(
          id,
          team_id,
          status,
          role,
          teams(
            id,
            name,
            discord_role_id
          )
        )
      `)
      .eq("id", userId)
      .single()

    if (userError || !userInfo) {
      return NextResponse.json({ error: "User not found", details: userError }, { status: 404 })
    }

    const debugInfo = {
      user: {
        id: userInfo.id,
        gamerTag: userInfo.gamer_tag_id,
        email: userInfo.email,
        discordId: userInfo.discord_id,
        hasDiscordConnection: !!userInfo.discord_id,
      },
      player: userInfo.players[0]
        ? {
            id: userInfo.players[0].id,
            teamId: userInfo.players[0].team_id,
            status: userInfo.players[0].status,
            role: userInfo.players[0].role,
            hasTeam: !!userInfo.players[0].team_id,
          }
        : null,
      team: userInfo.players[0]?.teams
        ? {
            id: userInfo.players[0].teams.id,
            name: userInfo.players[0].teams.name,
            discordRoleId: userInfo.players[0].teams.discord_role_id,
            hasDiscordRole: !!userInfo.players[0].teams.discord_role_id,
          }
        : null,
    }

    console.log("Debug info:", debugInfo)

    // If user has Discord connection, check their current Discord roles
    let discordInfo = null
    if (userInfo.discord_id) {
      try {
        const GUILD_ID = process.env.DISCORD_GUILD_ID || "1345946042281234442"
        const BOT_TOKEN =
          process.env.DISCORD_BOT_TOKEN || "MTM2NTg4ODY2MDE3MTY1MzE1MA.G9DxJ3.QzAkopXtoHjPTjMo7gf1-MYaOmmVbk5K2Ca3Wc"

        const memberResponse = await fetch(
          `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userInfo.discord_id}`,
          {
            headers: {
              Authorization: `Bot ${BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (memberResponse.ok) {
          const memberData = await memberResponse.json()
          discordInfo = {
            inGuild: true,
            currentRoles: memberData.roles,
            nickname: memberData.nick,
            joinedAt: memberData.joined_at,
          }
        } else {
          discordInfo = {
            inGuild: false,
            error: `${memberResponse.status}: ${await memberResponse.text()}`,
          }
        }
      } catch (error) {
        discordInfo = {
          inGuild: false,
          error: error.message,
        }
      }
    }

    // Test the role assignment
    let roleAssignmentTest = null
    if (userInfo.discord_id) {
      try {
        console.log("Testing role assignment...")

        const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })

        const roleData = await roleResponse.json()
        roleAssignmentTest = {
          success: roleResponse.ok,
          status: roleResponse.status,
          response: roleData,
        }
      } catch (error) {
        roleAssignmentTest = {
          success: false,
          error: error.message,
        }
      }
    }

    return NextResponse.json({
      debugInfo,
      discordInfo,
      roleAssignmentTest,
      recommendations: generateRecommendations(debugInfo, discordInfo, roleAssignmentTest),
    })
  } catch (error: any) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateRecommendations(debugInfo: any, discordInfo: any, roleTest: any) {
  const recommendations = []

  if (!debugInfo.user.hasDiscordConnection) {
    recommendations.push("User has no Discord connection - they need to connect their Discord account")
  }

  if (!debugInfo.player) {
    recommendations.push("User has no player record - this is unusual and should be investigated")
  }

  if (debugInfo.player && !debugInfo.player.hasTeam) {
    recommendations.push("Player is not on a team - they will only get the 'Registered' role")
  }

  if (debugInfo.team && !debugInfo.team.hasDiscordRole) {
    recommendations.push(`Team '${debugInfo.team.name}' has no Discord role configured`)
  }

  if (discordInfo && !discordInfo.inGuild) {
    recommendations.push("User is not in the Discord guild - they need to join the server first")
  }

  if (roleTest && !roleTest.success) {
    recommendations.push(`Role assignment failed: ${roleTest.response?.error || "Unknown error"}`)
  }

  if (recommendations.length === 0) {
    recommendations.push("Everything looks good - Discord roles should be working properly")
  }

  return recommendations
}
