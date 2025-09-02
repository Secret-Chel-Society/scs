import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Read the migration file
    const migrationPath = path.join(process.cwd(), "migrations", "create_verification_logs_table.sql")
    const migrationSql = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabase.rpc("run_sql", { sql_query: migrationSql })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: "Failed to run migration" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error: any) {
    console.error("Unexpected error running migration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
