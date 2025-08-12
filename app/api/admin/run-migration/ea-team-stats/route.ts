import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verify admin status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Error verifying admin status" }, { status: 500 })
    }

    const isAdmin = userRoles.some((r) => r.role === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 })
    }

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "create_ea_team_stats_table.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
    }

    // Check if the table was created successfully
    const { data: tableExists, error: checkError } = await supabase.rpc("table_exists", {
      table_name: "ea_team_stats",
    })

    if (checkError) {
      console.error("Error checking if table exists:", checkError)
      return NextResponse.json({ error: `Error verifying migration: ${checkError.message}` }, { status: 500 })
    }

    if (!tableExists) {
      return NextResponse.json({ error: "Migration did not create the table" }, { status: 500 })
    }

    return NextResponse.json({
      message: "EA Team Stats table created successfully",
      success: true,
    })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: `Failed to run migration: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
