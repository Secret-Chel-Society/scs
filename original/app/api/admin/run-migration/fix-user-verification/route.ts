import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    // Create Supabase admin client
    const supabase = createAdminClient()

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "fix_user_verification_status.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    console.log("Running fix user verification status migration...")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Fix user verification status migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "User verification status fixed successfully",
    })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
