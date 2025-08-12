import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "create_season_stats_tables.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Season statistics tables created successfully",
    })
  } catch (error: any) {
    console.error("Error in season stats tables migration:", error)
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 })
  }
}
