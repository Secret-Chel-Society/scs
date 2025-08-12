import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function POST() {
  try {
    console.log("Running Discord bot config table migration...")

    // Read the migration file
    const migrationPath = path.join(process.cwd(), "migrations", "create_discord_bot_config_table.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Discord bot config table migration completed successfully")

    // Verify the table was created and has the right structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin.from("discord_bot_config").select("*").limit(1)

    if (tableError) {
      console.error("Error verifying table:", tableError)
      return NextResponse.json({ error: tableError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Discord bot config table migration completed successfully",
      tableExists: true,
      hasDefaultConfig: tableInfo && tableInfo.length > 0,
    })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
