import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "Admin")

    if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check the season_registrations table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from("season_registrations")
      .select("*")
      .limit(5)

    if (tableError) {
      return NextResponse.json({ 
        error: "Table error", 
        details: tableError.message,
        tableExists: false
      })
    }

    // Get all registrations
    const { data: allRegistrations, error: regError } = await supabase
      .from("season_registrations")
      .select(`
        *,
        user:user_id (
          email,
          gamer_tag_id
        )
      `)
      .order("created_at", { ascending: false })

    if (regError) {
      return NextResponse.json({ 
        error: "Fetch error", 
        details: regError.message,
        tableExists: true
      })
    }

    // Check users table for position data
    const { data: usersWithPositions, error: usersError } = await supabase
      .from("users")
      .select("id, email, primary_position, secondary_position")
      .limit(10)

    return NextResponse.json({
      success: true,
      tableExists: true,
      registrationsCount: allRegistrations?.length || 0,
      sampleRegistrations: allRegistrations?.slice(0, 3) || [],
      usersWithPositions: usersWithPositions || [],
      tableStructure: tableInfo?.slice(0, 2) || []
    })

  } catch (error: any) {
    console.error("Error in check-registrations API:", error)
    return NextResponse.json({ 
      error: `Error checking registrations: ${error.message}` 
    }, { status: 500 })
  }
}
