import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { dryRun = false, limit = 100 } = await request.json()

    console.log(`Starting bulk role sync fix (dryRun: ${dryRun}, limit: ${limit})`)

    // Get all users with their roles
    const { data: usersWithRoles, error: usersError } = await supabaseAdmin
      .from("user_roles")
      .select(`
        user_id,
        role,
        users!inner (
          id,
          gamer_tag_id,
          email
        )
      `)
      .limit(limit)

    if (usersError) {
      console.error("Error fetching users with roles:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    if (!usersWithRoles || usersWithRoles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No users found",
        results: { processed: 0, fixed: 0, errors: 0 }
      })
    }

    // Group users by user_id
    const userRoleMap = new Map()
    usersWithRoles.forEach(item => {
      if (!userRoleMap.has(item.user_id)) {
        userRoleMap.set(item.user_id, {
          user: item.users,
          roles: []
        })
      }
      userRoleMap.get(item.user_id).roles.push(item.role)
    })

    const results = {
      processed: 0,
      fixed: 0,
      errors: 0,
      details: [] as any[]
    }

    const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner"]

    for (const [userId, userData] of userRoleMap) {
      try {
        results.processed++
        const { user, roles } = userData

        // Determine expected player role
        let expectedPlayerRole = "Player"
        if (roles.includes("Owner")) {
          expectedPlayerRole = "Owner"
        } else if (roles.includes("GM")) {
          expectedPlayerRole = "GM"
        } else if (roles.includes("AGM")) {
          expectedPlayerRole = "AGM"
        } else if (roles.includes("Player")) {
          expectedPlayerRole = "Player"
        }

        // Check if user needs a player record
        const needsPlayerRecord = roles.some(role => VALID_PLAYER_ROLES.includes(role))

        if (!needsPlayerRecord) {
          // User only has Admin role, no player record needed
          results.details.push({
            userId,
            gamerTag: user.gamer_tag_id,
            email: user.email,
            userRoles: roles,
            action: "skipped",
            reason: "Admin only - no player record needed"
          })
          continue
        }

        // Get current player record
        const { data: existingPlayer, error: playerError } = await supabaseAdmin
          .from("players")
          .select("id, role, team_id")
          .eq("user_id", userId)
          .single()

        if (playerError && playerError.code !== "PGRST116") {
          throw new Error(`Failed to check player record: ${playerError.message}`)
        }

        const currentPlayerRole = existingPlayer?.role
        const needsUpdate = !existingPlayer || currentPlayerRole !== expectedPlayerRole

        if (!needsUpdate) {
          results.details.push({
            userId,
            gamerTag: user.gamer_tag_id,
            email: user.email,
            userRoles: roles,
            playerRole: currentPlayerRole,
            action: "skipped",
            reason: "Already in sync"
          })
          continue
        }

        if (dryRun) {
          results.details.push({
            userId,
            gamerTag: user.gamer_tag_id,
            email: user.email,
            userRoles: roles,
            currentPlayerRole,
            expectedPlayerRole,
            action: "would_fix",
            reason: existingPlayer ? "Update player role" : "Create player record"
          })
          continue
        }

        // Perform the actual fix
        if (existingPlayer) {
          // Update existing player record
          const { error: updateError } = await supabaseAdmin
            .from("players")
            .update({ 
              role: expectedPlayerRole,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId)

          if (updateError) {
            throw new Error(`Failed to update player role: ${updateError.message}`)
          }

          results.fixed++
          results.details.push({
            userId,
            gamerTag: user.gamer_tag_id,
            email: user.email,
            userRoles: roles,
            oldPlayerRole: currentPlayerRole,
            newPlayerRole: expectedPlayerRole,
            action: "updated"
          })
        } else {
          // Create new player record
          const { error: createError } = await supabaseAdmin
            .from("players")
            .insert({
              user_id: userId,
              role: expectedPlayerRole,
              salary: 0,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (createError) {
            throw new Error(`Failed to create player record: ${createError.message}`)
          }

          results.fixed++
          results.details.push({
            userId,
            gamerTag: user.gamer_tag_id,
            email: user.email,
            userRoles: roles,
            newPlayerRole: expectedPlayerRole,
            action: "created"
          })
        }

      } catch (error) {
        results.errors++
        results.details.push({
          userId,
          gamerTag: userData.user.gamer_tag_id,
          email: userData.user.email,
          userRoles: userData.roles,
          action: "error",
          error: error instanceof Error ? error.message : "Unknown error"
        })
        console.error(`Error processing user ${userId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? "Dry run completed" : "Bulk role sync completed",
      results
    })

  } catch (error) {
    console.error("Error in bulk role sync fix:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
