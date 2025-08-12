import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "ensure_email_verification_tokens.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql: migrationSQL })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
    })
  } catch (error) {
    console.error("Error in migration route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
