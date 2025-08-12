import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    console.log("Starting Discord tables migration...")

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "migrations", "ensure_discord_tables_exist.sql")
    const sqlContent = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: sqlContent,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Discord tables migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "Discord tables created and configured successfully",
    })
  } catch (error: any) {
    console.error("Migration execution error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
