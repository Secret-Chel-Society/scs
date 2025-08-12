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

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to make Discord API requests with robust retry logic
async function makeDiscordRequest(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // If rate limited, wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after")
        const suggestedWait = retryAfter ? Number.parseInt(retryAfter) * 1000 : 10000
        const waitTime = Math.min(suggestedWait, 30000) // Cap at 30 seconds
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`)
        await delay(waitTime)
        continue
      }

      // If server error (5xx), retry with backoff
      if (response.status >= 500) {
        const waitTime = Math.min(5000 * attempt, 20000) // 5s, 10s, 15s, 20s max
        console.log(`Server error ${response.status}, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`)
        await delay(waitTime)
        continue
      }

      return response
    } catch (error: any) {
      console.error(`Discord API request attempt ${attempt}/${maxRetries} failed:`, error.message)

      if (attempt === maxRetries) {
        throw new Error(`Max retries exceeded. Last error: ${error.message}`)
      }

      // Progressive backoff: 5s, 10s, 15s
      const waitTime = 5000 * attempt
      console.log(`Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
      await delay(waitTime)
    }
  }

  throw new Error("Max retries exceeded")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, oldTeamId, newTeamId, action = "update_team_role", forceSync = false } = body

    console.log(`Discord role assignment request:`, {
      userId,
      oldTeamId,
      newTeamId,
      action,
      forceSync,
    })

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check for required environment variables
    if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
      console.error("Missing Discord configuration")
      return NextResponse.json({ error: "Discord bot not configured" }, { status: 500 })
    }

    // Get user's Discord information and current team assignment
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        gamer_tag_id,
        discord_id,
        is_active,
        discord_users(discord_id, discord_username),
        players(
          id,
          team_id,
          status,
          teams(
            id,
            name,
            discord_role_id
          )
        )
      `)
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get Discord ID from either direct column or discord_users table
    let discordId = user.discord_id
    if (!discordId && user.discord_users && user.discord_users.length > 0) {
      discordId = user.discord_users[0].discord_id
    }

    if (!discordId) {
      console.log(`User ${user.gamer_tag_id} has no Discord connection`)
      return NextResponse.json(
        {
          success: false,
          error: "User has no Discord connection",
        },
        { status: 400 },
      )
    }

    console.log(`Processing Discord role sync for ${user.gamer_tag_id} (Discord ID: ${discordId})`)

    // Determine current team assignment
    let currentTeamId = newTeamId
    let currentTeam = null

    // If no explicit newTeamId provided, get from current player assignment
    if (!currentTeamId && user.players && user.players.length > 0) {
      const activePlayer = user.players.find((p) => p.status === "active")
      if (activePlayer) {
        currentTeamId = activePlayer.team_id
        currentTeam = activePlayer.teams
      }
    }

    // If we have a newTeamId but no team object, fetch it
    if (currentTeamId && !currentTeam) {
      const { data: teamData } = await supabaseAdmin
        .from("teams")
        .select("id, name, discord_role_id")
        .eq("id", currentTeamId)
        .single()

      if (teamData) {
        currentTeam = teamData
      }
    }

    console.log(`Current team assignment:`, {
      teamId: currentTeamId,
      teamName: currentTeam?.name,
      discordRoleId: currentTeam?.discord_role_id,
    })

    // Get all team roles to manage
    const { data: allTeamRoles } = await supabaseAdmin
      .from("teams")
      .select("id, name, discord_role_id")
      .not("discord_role_id", "is", null)

    if (!allTeamRoles || allTeamRoles.length === 0) {
      console.log("No team Discord roles configured")
      return NextResponse.json(
        {
          success: false,
          error: "No team Discord roles configured",
        },
        { status: 400 },
      )
    }

    console.log(`Found ${allTeamRoles.length} team roles configured`)

    // Get bot configuration for registered role
    const { data: botConfig } = await supabaseAdmin.from("discord_bot_config").select("*").single()

    const registeredRoleId = botConfig?.registered_role_id

    const results = {
      rolesAdded: [] as string[],
      rolesRemoved: [] as string[],
      errors: [] as string[],
      skipped: [] as string[],
    }

    // First, ensure user has the registered role
    if (registeredRoleId) {
      try {
        console.log(`Ensuring user has registered role: ${registeredRoleId}`)
        const addRegisteredResponse = await makeDiscordRequest(
          `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}/roles/${registeredRoleId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (addRegisteredResponse.ok || addRegisteredResponse.status === 204) {
          results.rolesAdded.push(`Registered (${registeredRoleId})`)
          console.log(`✓ Added registered role`)
        } else {
          const errorText = await addRegisteredResponse.text()
          console.error(`Failed to add registered role: ${errorText}`)
          results.errors.push(`Failed to add registered role: ${errorText}`)
        }

        // Small delay after registered role
        await delay(1000)
      } catch (error: any) {
        console.error(`Error adding registered role:`, error)
        results.errors.push(`Error adding registered role: ${error.message}`)
      }
    }

    // Get current team's Discord role
    let currentTeamRole = null
    if (currentTeamId) {
      const currentTeam = allTeamRoles?.find((team) => team.id === currentTeamId)
      currentTeamRole = currentTeam?.discord_role_id
      console.log(`Current Team: ${currentTeam?.name}`)
      console.log(`Current Team Role ID: ${currentTeamRole || "Not set"}`)
    }

    // Get user's current roles from Discord
    const discordApiUrl = `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`

    let currentRoles = []
    try {
      const memberResponse = await fetch(discordApiUrl, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      })

      if (memberResponse.ok) {
        const memberData = await memberResponse.json()
        currentRoles = memberData.roles || []
        console.log(`Current Discord roles: ${currentRoles.join(", ")}`)
      } else {
        console.log(`Could not fetch current roles: ${memberResponse.status}`)
      }
    } catch (error) {
      console.log("Error fetching current roles:", error)
    }

    // Calculate roles to add and remove
    const rolesToAdd = []
    const rolesToRemove = []

    // Always ensure registered role is present
    if (registeredRoleId && !currentRoles.includes(registeredRoleId)) {
      rolesToAdd.push(registeredRoleId)
      console.log(`Adding registered role: ${registeredRoleId}`)
    }

    // Add current team role if user has a team
    if (currentTeamRole && !currentRoles.includes(currentTeamRole)) {
      rolesToAdd.push(currentTeamRole)
      console.log(`Adding team role: ${currentTeamRole}`)
    }

    // Remove other team roles that user shouldn't have
    for (const teamRole of allTeamRoles) {
      if (!teamRole.discord_role_id) continue

      const isCurrentTeam = currentTeamId && teamRole.id === currentTeamId

      if (!isCurrentTeam && currentRoles.includes(teamRole.discord_role_id)) {
        rolesToRemove.push(teamRole.discord_role_id)
        console.log(`Removing old team role: ${teamRole.discord_role_id}`)
      }
    }

    console.log(`Roles to add: ${rolesToAdd.join(", ") || "None"}`)
    console.log(`Roles to remove: ${rolesToRemove.join(", ") || "None"}`)

    // Apply role changes
    // Add roles
    for (const roleId of rolesToAdd) {
      try {
        console.log(`Adding role ${roleId}...`)
        const addResponse = await makeDiscordRequest(
          `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}/roles/${roleId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (addResponse.ok) {
          results.rolesAdded.push(roleId)
          console.log(`✓ Successfully added role ${roleId}`)
        } else {
          const errorText = await addResponse.text()
          console.error(`✗ Failed to add role ${roleId}: ${addResponse.status} - ${errorText}`)
          results.errors.push(`Failed to add role ${roleId}: ${errorText}`)
        }

        // Rate limit protection
        await delay(1000)
      } catch (error: any) {
        console.error(`Error adding role ${roleId}:`, error)
        results.errors.push(`Error adding role ${roleId}: ${error.message}`)
      }
    }

    // Remove roles
    for (const roleId of rolesToRemove) {
      try {
        console.log(`Removing role ${roleId}...`)
        const removeResponse = await makeDiscordRequest(
          `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}/roles/${roleId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (removeResponse.ok || removeResponse.status === 204 || removeResponse.status === 404) {
          results.rolesRemoved.push(roleId)
          console.log(`✓ Successfully removed role ${roleId}`)
        } else {
          const errorText = await removeResponse.text()
          console.error(`✗ Failed to remove role ${roleId}: ${removeResponse.status} - ${errorText}`)
          results.errors.push(`Failed to remove role ${roleId}: ${errorText}`)
        }

        // Rate limit protection
        await delay(1000)
      } catch (error: any) {
        console.error(`Error removing role ${roleId}:`, error)
        results.errors.push(`Error removing role ${roleId}: ${error.message}`)
      }
    }

    // Log sync failure if there were errors
    if (results.errors.length > 0) {
      try {
        await supabaseAdmin.from("discord_sync_failures").insert({
          user_id: userId,
          discord_id: discordId,
          error_message: results.errors.join("; "),
          attempted_at: new Date().toISOString(),
          sync_type: action || "role_assignment",
        })
      } catch (logError) {
        console.error("Failed to log sync failure:", logError)
      }
    }

    console.log(`=== Role assignment completed for ${user.gamer_tag_id} ===`)
    console.log(`Added: ${results.rolesAdded.length} roles`)
    console.log(`Removed: ${results.rolesRemoved.length} roles`)
    console.log(`Errors: ${results.errors.length}`)

    return NextResponse.json({
      success: results.errors.length === 0,
      message:
        results.errors.length === 0 ? "Roles updated successfully" : `Completed with ${results.errors.length} errors`,
      details: results,
      user: user.gamer_tag_id,
      discordId,
      currentTeam: currentTeamId,
      error: results.errors.length > 0 ? results.errors.join("; ") : undefined,
    })
  } catch (error: any) {
    console.error("Error in Discord role assignment:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
