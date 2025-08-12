import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized - Admin role required" }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { team, isNew } = body

    // Validate required fields
    if (!team.name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Use raw SQL to avoid schema cache issues
    let query
    let params

    if (isNew) {
      // Insert new team
      query = `
        INSERT INTO teams (
          name, logo_url, wins, losses, otl, goals_for, goals_against, season_id, ea_club_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *
      `
      params = [
        team.name,
        team.logo_url || null,
        team.wins || 0,
        team.losses || 0,
        team.otl || 0,
        team.goals_for || 0,
        team.goals_against || 0,
        team.season_id,
        team.ea_club_id || null,
      ]
    } else {
      // Update existing team
      query = `
        UPDATE teams
        SET name = $1, logo_url = $2, season_id = $3, ea_club_id = $4
        WHERE id = $5
        RETURNING *
      `
      params = [team.name, team.logo_url || null, team.season_id, team.ea_club_id || null, team.id]
    }

    // Execute the query using direct SQL to avoid any triggers
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: query,
      params: params,
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: error.message },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      success: true,
      team: data?.[0] || team,
    })
  } catch (error: any) {
    console.error("Error saving team:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
