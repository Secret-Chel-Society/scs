import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }


  try {
    // Create a Supabase admin client
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    // Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "create_verification_logs_table.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabaseAdmin.rpc("run_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Error running verification logs migration:", error)
      return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Verification logs table created successfully" })
  } catch (error) {
    console.error("Unexpected error in verification logs migration:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
