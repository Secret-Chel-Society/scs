import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
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

    // Read the migration SQL file
    const sqlFilePath = path.join(process.cwd(), "migrations", "add_is_active_to_teams.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the migration
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: sqlQuery,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while running the migration" },
      { status: 500 },
    )
  }
}
