import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id)

    if (!userRoles?.some((role) => role.role === "admin")) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "create_ea_match_data_table.sql")
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
      message: "EA match data table created successfully",
    })
  } catch (error: any) {
    console.error("Error creating EA match data table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
