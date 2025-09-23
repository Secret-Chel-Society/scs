import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId, forceSync = false } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Starting role sync fix for user: ${userId}`)

    // Get user's current roles from user_roles table
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Failed to fetch user roles" }, { status: 500 })
    }

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "No roles found for user" }, { status: 404 })
    }

    const roleNames = userRoles.map(r => r.role)
    console.log(`User roles: ${roleNames.join(", ")}`)

    // Determine the appropriate player role
    const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner"]
    let playerRole = "Player" // Default

    // Priority order: Owner > GM > AGM > Player
    if (roleNames.includes("Owner")) {
      playerRole = "Owner"
    } else if (roleNames.includes("GM")) {
      playerRole = "GM"
    } else if (roleNames.includes("AGM")) {
      playerRole = "AGM"
    } else if (roleNames.includes("Player")) {
      playerRole = "Player"
    }

    console.log(`Selected player role: ${playerRole}`)

    // Check if player record exists
    const { data: existingPlayer, error: playerError } = await supabaseAdmin
      .from("players")
      .select("id, role, team_id")
      .eq("user_id", userId)
      .single()

    if (playerError && playerError.code !== "PGRST116") {
      console.error("Error checking player record:", playerError)
      return NextResponse.json({ error: "Failed to check player record" }, { status: 500 })
    }

    let playerUpdateResult = null

    if (existingPlayer) {
      // Update existing player record
      const { data: updatedPlayer, error: updateError } = await supabaseAdmin
        .from("players")
        .update({ 
          role: playerRole,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating player role:", updateError)
        return NextResponse.json({ error: "Failed to update player role" }, { status: 500 })
      }

      playerUpdateResult = updatedPlayer
      console.log(`Updated player role from ${existingPlayer.role} to ${playerRole}`)
    } else {
      // Create new player record if it doesn't exist
      const { data: newPlayer, error: createError } = await supabaseAdmin
        .from("players")
        .insert({
          user_id: userId,
          role: playerRole,
          salary: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating player record:", createError)
        return NextResponse.json({ error: "Failed to create player record" }, { status: 500 })
      }

      playerUpdateResult = newPlayer
      console.log(`Created new player record with role: ${playerRole}`)
    }

    // Verify the sync
    const { data: verifyPlayer, error: verifyError } = await supabaseAdmin
      .from("players")
      .select("id, role, team_id")
      .eq("user_id", userId)
      .single()

    if (verifyError) {
      console.error("Error verifying player record:", verifyError)
      return NextResponse.json({ error: "Failed to verify player record" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Role synchronization completed successfully",
      data: {
        userId,
        userRoles: roleNames,
        playerRole: verifyPlayer.role,
        playerId: verifyPlayer.id,
        teamId: verifyPlayer.team_id,
        syncTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Error in role sync fix:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to check role sync status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)

    if (rolesError) {
      return NextResponse.json({ error: "Failed to fetch user roles" }, { status: 500 })
    }

    // Get player record
    const { data: player, error: playerError } = await supabaseAdmin
      .from("players")
      .select("id, role, team_id")
      .eq("user_id", userId)
      .single()

    const roleNames = userRoles?.map(r => r.role) || []
    const playerRole = player?.role || null

    // Check if sync is needed
    const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner"]
    let expectedPlayerRole = "Player"

    if (roleNames.includes("Owner")) {
      expectedPlayerRole = "Owner"
    } else if (roleNames.includes("GM")) {
      expectedPlayerRole = "GM"
    } else if (roleNames.includes("AGM")) {
      expectedPlayerRole = "AGM"
    } else if (roleNames.includes("Player")) {
      expectedPlayerRole = "Player"
    }

    const isInSync = playerRole === expectedPlayerRole
    const needsPlayerRecord = !player && roleNames.some(role => VALID_PLAYER_ROLES.includes(role))

    return NextResponse.json({
      userId,
      userRoles: roleNames,
      playerRole,
      expectedPlayerRole,
      isInSync,
      needsPlayerRecord,
      playerId: player?.id || null,
      teamId: player?.team_id || null
    })

  } catch (error) {
    console.error("Error checking role sync status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
