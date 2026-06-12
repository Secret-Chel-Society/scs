import { createAdminClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/types/database"
import { saveSalaryHistory } from "@/lib/salary-history"
import { logActivity } from "@/lib/activity-log"

export const dynamic = "force-dynamic"

// Role salary mappings
const ROLE_SALARIES: Record<string, number> = {
  "Owner": 0,
  "GM": 0,
  "AGM": 2500000,
}

// GET - Search users for role assignment
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    // Get authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    )
    const adminClient = createAdminClient()

    // Check admin permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["Admin", "Site Owner"])

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Search users first
    let userQuery = adminClient
      .from("users")
      .select(`id, gamer_tag_id, email, avatar_url, console`, { count: "exact" })

    // Apply search filter
    if (search.trim()) {
      userQuery = userQuery.or(`gamer_tag_id.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Order and paginate
    const { data: users, error: usersError, count } = await userQuery
      .order("gamer_tag_id", { ascending: true })
      .range(offset, offset + limit - 1)

    if (usersError) {
      console.error("Error searching users:", usersError)
      return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        users: [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      })
    }

    // Get player data for these users
    const userIds = users.map(u => u.id)
    const { data: players } = await adminClient
      .from("players")
      .select(`
        id,
        user_id,
        role,
        salary,
        team_id,
        team_id_ahl,
        teams:team_id (id, name, logo_url),
        teams_ahl:team_id_ahl (id, name, logo_url)
      `)
      .in("user_id", userIds)

    // Map players to users
    const usersWithPlayers = users.map(user => {
      const userPlayers = players?.filter(p => p.user_id === user.id) || []
      return {
        ...user,
        players: userPlayers,
      }
    })

    return NextResponse.json({
      users: usersWithPlayers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error in role offers GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Assign role to a player
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, player_id, role, team_id, team_id_ahl, league, custom_salary } = body

    if (!user_id || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["Owner", "GM", "AGM"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be Owner, GM, or AGM" }, { status: 400 })
    }

    // Get authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    )
    const adminClient = createAdminClient()

    // Check admin permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["Admin", "Site Owner"])

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use custom salary if provided, otherwise use default role salary
    const salary = custom_salary !== null && custom_salary !== undefined 
      ? custom_salary 
      : ROLE_SALARIES[role]



    // Check if player exists, create if not
    let playerId = player_id
    if (!playerId) {
      // Check if player already exists for this user
      const { data: existingPlayer } = await adminClient
        .from("players")
        .select("id")
        .eq("user_id", user_id)
        .single()

      if (existingPlayer) {
        playerId = existingPlayer.id

      } else {
        // Create a player record for this user
        const { data: newPlayer, error: createError } = await adminClient
          .from("players")
          .insert({
            user_id,
            role,
            salary,
            team_id: league === "NHL" ? team_id : null,
            team_id_ahl: league === "AHL" ? team_id_ahl : null,
            status: "active",
          })
          .select("id")
          .single()

        if (createError) {
          console.error("Error creating player:", createError)
          return NextResponse.json({ error: "Failed to create player record: " + createError.message }, { status: 500 })
        }

        playerId = newPlayer.id

      }
    }
    
    if (playerId) {
      // Update existing player record
      const updateData: any = {
        role,
        salary,
      }

      // Assign to team if provided
      if (team_id && league === "NHL") {
        updateData.team_id = team_id
      }
      if (team_id_ahl && league === "AHL") {
        updateData.team_id_ahl = team_id_ahl
      }

      const { error: updateError } = await adminClient
        .from("players")
        .update(updateData)
        .eq("id", playerId)

      if (updateError) {
        console.error("Error updating player:", updateError)
        return NextResponse.json({ error: "Failed to update player role" }, { status: 500 })
      }

      // Get team name for salary history
      let teamName = null
      if (team_id && league === "NHL") {
        const { data: team } = await adminClient
          .from("teams")
          .select("name")
          .eq("id", team_id)
          .single()
        teamName = team?.name
      } else if (team_id_ahl && league === "AHL") {
        const { data: team } = await adminClient
          .from("teams_ahl")
          .select("name")
          .eq("id", team_id_ahl)
          .single()
        teamName = team?.name
      }

      // Save salary history for the current season (seasons uses is_active, not is_current)
      const seasonTable = league === "AHL" ? "seasons_ahl" : "seasons"
      const { data: currentSeason, error: seasonError } = await adminClient
        .from(seasonTable)
        .select("id, season_number")
        .eq("is_active", true)
        .single()



      if (currentSeason && playerId) {
        const historyResult = await saveSalaryHistory(adminClient, {
          player_id: playerId,
          user_id,
          season_number: currentSeason.season_number,
          season_id: league === "NHL" ? currentSeason.id : null,
          season_id_ahl: league === "AHL" ? currentSeason.id : null,
          team_id: league === "NHL" ? team_id : null,
          team_id_ahl: league === "AHL" ? team_id_ahl : null,
          team_name: teamName,
          salary,
          acquired_via: "signed",
          league: league as "NHL" | "AHL",
          role,
        })
        
        if (!historyResult.success) {
          console.error("Failed to save salary history:", historyResult.error)
        }
      }
    }

    if (!playerId) {
      return NextResponse.json({ error: "Failed to find or create player" }, { status: 500 })
    }

    // Get the updated player data
    const { data: updatedPlayer } = await adminClient
      .from("players")
      .select(`
        id,
        role,
        salary,
        team_id,
        team_id_ahl,
        teams:team_id (id, name, logo_url),
        teams_ahl:team_id_ahl (id, name, logo_url)
      `)
      .eq("id", playerId)
      .single()

    // Log activity
    try {
      const { data: adminUser } = await adminClient
        .from("users")
        .select("gamer_tag_id")
        .eq("id", user.id)
        .single()
      
      const { data: targetUser } = await adminClient
        .from("users")
        .select("gamer_tag_id")
        .eq("id", user_id)
        .single()
      
      // Get team name
      let teamName = "No Team"
      if (team_id && league === "NHL") {
        const { data: team } = await adminClient.from("teams").select("name").eq("id", team_id).single()
        teamName = team?.name || "Unknown Team"
      } else if (team_id_ahl && league === "AHL") {
        const { data: team } = await adminClient.from("teams_ahl").select("name").eq("id", team_id_ahl).single()
        teamName = team?.name || "Unknown Team"
      }
      
      await logActivity(adminClient, {
        actorId: user.id,
        actorName: adminUser?.gamer_tag_id || "Admin",
        actorType: "Admin",
        actionType: "role_assigned",
        actionDescription: `Assigned ${role} role to ${targetUser?.gamer_tag_id || "Unknown"} for ${teamName}`,
        targetId: user_id,
        targetName: targetUser?.gamer_tag_id || "Unknown Player",
        category: "Role",
        league: league || "NHL",
      })
    } catch (logError) {
      console.error("Error logging activity:", logError)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${role} role with $${salary.toLocaleString()} salary`,
      player: updatedPlayer,
    })
  } catch (error) {
    console.error("Error in role offers POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
