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
      console.log(`Making Discord API request (attempt ${attempt}/${maxRetries}): ${url}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log(`Discord API response: ${response.status} ${response.statusText}`)

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
    console.log("=== Starting Discord role sync for all users ===")

    // Get bot configuration (handle multiple configs)
    const { data: botConfigs, error: configError } = await supabaseAdmin
      .from("discord_bot_config")
      .select("*")
      .order("created_at", { ascending: false })

    if (configError) {
      console.error("Error fetching bot config:", configError)
      return NextResponse.json({ error: "Bot configuration not found" }, { status: 500 })
    }

    if (!botConfigs || botConfigs.length === 0) {
      console.error("No bot configuration found")
      return NextResponse.json({ error: "Bot configuration not found" }, { status: 500 })
    }

    // Use the most recent config
    const botConfig = botConfigs[0]
    const guildId = botConfig.guild_id
    const botToken = botConfig.bot_token
    const registeredRoleId = botConfig.registered_role_id

    if (!guildId || !botToken) {
      console.error("Missing required bot configuration")
      return NextResponse.json({ error: "Bot configuration incomplete" }, { status: 500 })
    }

    console.log("Using Discord configuration:", {
      guildId,
      hasToken: !!botToken,
      tokenLength: botToken?.length,
      registeredRoleId,
    })

    // First, test the bot connection
    console.log("Testing Discord bot connection...")
    try {
      const testResponse = await makeDiscordRequest(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error("Bot connection test failed:", testResponse.status, errorText)
        return NextResponse.json(
          {
            error: `Bot connection test failed: ${testResponse.status} - ${errorText}`,
            step: "connection_test",
          },
          { status: 400 },
        )
      }

      const guildData = await testResponse.json()
      console.log("✓ Bot connection test passed:", guildData.name)
    } catch (error: any) {
      console.error("Bot connection test error:", error)
      return NextResponse.json(
        {
          error: `Bot connection test failed: ${error.message}`,
          step: "connection_test",
        },
        { status: 400 },
      )
    }

    // Fetch all active users with Discord connections and their current team assignments
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        gamer_tag_id,
        email,
        is_active,
        discord_id
      `)
      .eq("is_active", true)
      .not("discord_id", "is", null)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Also get users from discord_users table
    const { data: discordUsers, error: discordUsersError } = await supabaseAdmin
      .from("discord_users")
      .select(`
        discord_id,
        discord_username,
        user_id,
        users!inner(
          id,
          gamer_tag_id,
          is_active
        )
      `)
      .eq("users.is_active", true)

    if (discordUsersError) {
      console.warn("Could not load discord_users table:", discordUsersError)
    }

    // Combine all users with Discord connections
    const allDiscordUsers = new Map()

    // Add users with direct discord_id
    if (users) {
      for (const user of users) {
        allDiscordUsers.set(user.id, {
          userId: user.id,
          discordId: user.discord_id,
          gamerTag: user.gamer_tag_id,
          email: user.email,
        })
      }
    }

    // Add/update with discord_users data
    if (discordUsers) {
      for (const discordUser of discordUsers) {
        if (discordUser.users) {
          allDiscordUsers.set(discordUser.users.id, {
            userId: discordUser.users.id,
            discordId: discordUser.discord_id,
            gamerTag: discordUser.users.gamer_tag_id,
            email: discordUser.users.email || "",
          })
        }
      }
    }

    const usersToSync = Array.from(allDiscordUsers.values())
    console.log(`Found ${usersToSync.length} users with Discord connections`)

    if (usersToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with Discord connections found to sync",
        results: {
          processed: 0,
          successful: 0,
          failed: 0,
          errors: [],
        },
      })
    }

    // Get all team roles for reference
    const { data: allTeamRoles } = await supabaseAdmin
      .from("teams")
      .select("id, name, discord_role_id")
      .not("discord_role_id", "is", null)

    console.log(`Found ${allTeamRoles?.length || 0} teams with Discord roles configured`)

    const processed = usersToSync.length
    let successful = 0
    let failed = 0
    const errors: any[] = []
    const successfulUsers: string[] = []

    console.log(`Starting role sync for ${processed} users with 15-second delays...`)

    // Process users one by one with 15-second delays
    for (let i = 0; i < usersToSync.length; i++) {
      const user = usersToSync[i]
      const userIndex = i + 1

      try {
        console.log(`[${userIndex}/${processed}] Processing user: ${user.gamerTag}`)
        console.log(`  - Discord ID: ${user.discordId}`)

        // Get user's current team assignment
        const { data: playerData } = await supabaseAdmin
          .from("players")
          .select(`
            team_id,
            status,
            teams(
              id,
              name,
              discord_role_id
            )
          `)
          .eq("user_id", user.userId)
          .eq("status", "active")
          .single()

        const currentTeam = playerData?.teams
        console.log(`  - Current team: ${currentTeam?.name || "Free Agent"}`)
        console.log(`  - Team Discord role: ${currentTeam?.discord_role_id || "None"}`)

        // Add 15-second delay between users (except for the first one)
        if (userIndex > 1) {
          console.log(`  - Waiting 15 seconds before processing next user...`)
          await delay(15000) // 15 second delay between users
        }

        // Get user's current Discord roles
        let currentRoles = []
        let memberExists = true

        try {
          console.log(`  - Fetching current Discord roles for ${user.discordId}...`)
          const memberResponse = await makeDiscordRequest(
            `https://discord.com/api/v10/guilds/${guildId}/members/${user.discordId}`,
            {
              headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
              },
            },
          )

          if (memberResponse.ok) {
            const memberData = await memberResponse.json()
            currentRoles = memberData.roles || []
            console.log(`  - Current Discord roles: ${currentRoles.length} roles [${currentRoles.join(", ")}]`)
          } else if (memberResponse.status === 404) {
            console.log(`  - User not found in Discord server, skipping...`)
            memberExists = false
          } else {
            const errorText = await memberResponse.text()
            console.log(`  - Could not fetch current roles: ${memberResponse.status} - ${errorText}`)
            throw new Error(`Failed to fetch member roles: ${memberResponse.status} - ${errorText}`)
          }
        } catch (error: any) {
          console.log(`  - Error fetching current roles:`, error.message)
          throw error
        }

        if (!memberExists) {
          console.log(`  - Skipping user not in Discord server`)
          continue
        }

        // Calculate roles to add and remove
        const rolesToAdd = []
        const rolesToRemove = []

        // Always ensure registered role is present
        if (registeredRoleId && !currentRoles.includes(registeredRoleId)) {
          rolesToAdd.push({ id: registeredRoleId, name: "Registered" })
          console.log(`  - Adding registered role: ${registeredRoleId}`)
        } else if (registeredRoleId && currentRoles.includes(registeredRoleId)) {
          console.log(`  - User already has registered role: ${registeredRoleId}`)
        }

        // Add current team role if user has a team
        if (currentTeam?.discord_role_id && !currentRoles.includes(currentTeam.discord_role_id)) {
          rolesToAdd.push({ id: currentTeam.discord_role_id, name: currentTeam.name })
          console.log(`  - Adding team role: ${currentTeam.discord_role_id} (${currentTeam.name})`)
        } else if (currentTeam?.discord_role_id && currentRoles.includes(currentTeam.discord_role_id)) {
          console.log(`  - User already has team role: ${currentTeam.discord_role_id} (${currentTeam.name})`)
        }

        // Remove other team roles that user shouldn't have
        if (allTeamRoles) {
          for (const teamRole of allTeamRoles) {
            if (!teamRole.discord_role_id) continue

            const isCurrentTeam = currentTeam && teamRole.id === currentTeam.id

            if (!isCurrentTeam && currentRoles.includes(teamRole.discord_role_id)) {
              rolesToRemove.push({ id: teamRole.discord_role_id, name: teamRole.name })
              console.log(`  - Removing old team role: ${teamRole.discord_role_id} (${teamRole.name})`)
            }
          }
        }

        console.log(`  - Roles to add: ${rolesToAdd.length}`)
        console.log(`  - Roles to remove: ${rolesToRemove.length}`)

        let roleChanges = 0
        let hasErrors = false

        // Add roles with delays
        for (const role of rolesToAdd) {
          try {
            console.log(`    - Adding role ${role.id} (${role.name})...`)
            const addResponse = await makeDiscordRequest(
              `https://discord.com/api/v10/guilds/${guildId}/members/${user.discordId}/roles/${role.id}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bot ${botToken}`,
                  "Content-Type": "application/json",
                },
              },
            )

            if (addResponse.ok || addResponse.status === 204) {
              console.log(`    ✓ Successfully added role ${role.id} (${role.name})`)
              roleChanges++
            } else {
              const errorText = await addResponse.text()
              console.error(`    ✗ Failed to add role ${role.id} (${role.name}): ${addResponse.status} - ${errorText}`)
              hasErrors = true
            }

            // Small delay between role operations
            await delay(2000)
          } catch (error: any) {
            console.error(`    ✗ Error adding role ${role.id} (${role.name}):`, error.message)
            hasErrors = true
          }
        }

        // Remove roles with delays
        for (const role of rolesToRemove) {
          try {
            console.log(`    - Removing role ${role.id} (${role.name})...`)
            const removeResponse = await makeDiscordRequest(
              `https://discord.com/api/v10/guilds/${guildId}/members/${user.discordId}/roles/${role.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bot ${botToken}`,
                  "Content-Type": "application/json",
                },
              },
            )

            if (removeResponse.ok || removeResponse.status === 204 || removeResponse.status === 404) {
              console.log(`    ✓ Successfully removed role ${role.id} (${role.name})`)
              roleChanges++
            } else {
              const errorText = await removeResponse.text()
              console.error(
                `    ✗ Failed to remove role ${role.id} (${role.name}): ${removeResponse.status} - ${errorText}`,
              )
              hasErrors = true
            }

            // Small delay between role operations
            await delay(2000)
          } catch (error: any) {
            console.error(`    ✗ Error removing role ${role.id} (${role.name}):`, error.message)
            hasErrors = true
          }
        }

        if (!hasErrors) {
          successful++
          successfulUsers.push(user.gamerTag)
          if (roleChanges > 0) {
            console.log(
              `✓ [${userIndex}/${processed}] Successfully synced ${roleChanges} role changes for ${user.gamerTag}`,
            )
          } else {
            console.log(`- [${userIndex}/${processed}] No role changes needed for ${user.gamerTag}`)
          }
        } else {
          failed++
          errors.push({
            user: user.gamerTag,
            userId: user.userId,
            error: "One or more role operations failed",
          })
          console.log(`✗ [${userIndex}/${processed}] Role sync had errors for ${user.gamerTag}`)
        }
      } catch (error: any) {
        failed++
        const errorMessage = error.message || "Unknown error"
        errors.push({
          user: user.gamerTag,
          userId: user.userId,
          error: `Exception during sync: ${errorMessage}`,
        })
        console.error(`✗ [${userIndex}/${processed}] Error processing user ${user.gamerTag}:`, errorMessage)

        // Add a longer delay after errors to let things settle
        console.log(`  - Error occurred, waiting 20 seconds before continuing...`)
        await delay(20000)
      }
    }

    console.log(`=== Discord role sync completed ===`)
    console.log(`Total processed: ${processed}`)
    console.log(`Successful: ${successful}`)
    console.log(`Failed: ${failed}`)
    console.log(`Successful users: ${successfulUsers.join(", ")}`)

    if (errors.length > 0) {
      console.log(`Errors encountered:`)
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.user}: ${error.error}`)
      })
    }

    return NextResponse.json({
      success: true,
      message: `Role sync completed: ${successful} successful, ${failed} failed`,
      results: {
        processed,
        successful,
        failed,
        errors: errors.length > 0 ? errors : undefined,
        successfulUsers,
      },
      updated: successful, // For compatibility with the frontend
    })
  } catch (error: any) {
    console.error("Error in Discord sync:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: error.stack || "No stack trace available",
      },
      { status: 500 },
    )
  }
}
