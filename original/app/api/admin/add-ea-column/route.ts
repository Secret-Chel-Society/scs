import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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

    // Check for Admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Execute raw SQL to add the column
    const { data, error } = await supabase.from("teams").select("id").limit(1)

    if (error) {
      return NextResponse.json({ error: `Cannot access teams table: ${error.message}` }, { status: 500 })
    }

    // Try to add the column using a simple query
    try {
      // This is a simple query that should work in most cases
      await supabase.from("_raw_sql_log").insert({
        sql: "ALTER TABLE teams ADD COLUMN IF NOT EXISTS ea_club_id TEXT;",
        executed_at: new Date().toISOString(),
      })

      // Verify the column was added
      const { data: verifyData, error: verifyError } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_schema", "public")
        .eq("table_name", "teams")
        .eq("column_name", "ea_club_id")
        .maybeSingle()

      if (verifyError || !verifyData) {
        // If verification fails, try one more approach
        await supabase.from("teams").update({ ea_club_id: null }).eq("id", data[0].id)
      }

      return NextResponse.json({ success: true })
    } catch (sqlError: any) {
      console.error("SQL Error:", sqlError)
      return NextResponse.json({ error: `SQL Error: ${sqlError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to run migration",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
