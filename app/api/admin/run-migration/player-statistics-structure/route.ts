import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "update_player_statistics_structure.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Error running player statistics structure migration:", error)
      return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: "Player statistics structure migration completed successfully" })
  } catch (error: any) {
    console.error("Error in player statistics structure migration API:", error)
    return NextResponse.json({ error: `Error running migration: ${error.message}` }, { status: 500 })
  }
}
