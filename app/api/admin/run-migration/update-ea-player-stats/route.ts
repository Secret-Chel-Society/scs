import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id)

    if (!userRoles?.some((role) => role.role === "admin" || role.role === "Admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Read the migration SQL file
    const sqlFilePath = path.join(process.cwd(), "migrations", "update_ea_player_stats_table.sql")
    let sql

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      console.error("Error reading SQL file:", error)
      return NextResponse.json(
        { error: "Failed to read migration file. Please check if the file exists." },
        { status: 500 },
      )
    }

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error executing migration:", error)
      return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: "EA player stats table updated successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 })
  }
}
