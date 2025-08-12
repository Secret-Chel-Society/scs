import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id)

    const isAdmin = userRoles?.some((role) => role.role === "admin" || role.role === "Admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get column type information
    let columnInfo = "Unknown"
    try {
      const { data: columnData } = await supabase.rpc("get_column_type", {
        table_name: "matches",
        column_name: "season_id",
      })
      columnInfo = columnData || "Unknown"
    } catch (e) {
      console.error("Error getting column type:", e)
    }

    // Get all matches with team information
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
      .order("created_at", { ascending: false })
      .limit(100)

    if (matchesError) {
      return NextResponse.json({ error: matchesError.message }, { status: 500 })
    }

    return NextResponse.json({ matches, columnInfo })
  } catch (error: any) {
    console.error("Error fetching matches:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
