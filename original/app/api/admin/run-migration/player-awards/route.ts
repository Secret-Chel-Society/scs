import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single()

    if (userRolesError || !userRoles) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Read the migration SQL file
    const sqlFilePath = path.join(process.cwd(), "migrations", "create_player_awards_table.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the migration
    const { error } = await supabase.rpc("run_sql", { query: sqlQuery })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: "Player awards table migration completed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: `Failed to run migration: ${error.message}` }, { status: 500 })
  }
}
