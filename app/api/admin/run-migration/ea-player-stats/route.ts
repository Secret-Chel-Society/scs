import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Check if user is authenticated and is an admin
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "create_ea_player_stats_table.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        {
          success: false,
          error: migrationError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "EA player stats table migration completed successfully",
    })
  } catch (error: any) {
    console.error("Error running EA player stats migration:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
