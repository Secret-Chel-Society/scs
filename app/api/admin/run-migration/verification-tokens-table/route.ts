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
    const migrationPath = path.join(process.cwd(), "migrations", "ensure_verification_tokens_table.sql")
    const migrationSql = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSql })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration executed successfully" })
  } catch (error) {
    console.error("Error in migration route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
