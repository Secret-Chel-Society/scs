import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log("Starting ban columns migration...")

    // Read the migration SQL file content
    const migrationSQL = `
      -- Add ban-related columns to the users table
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL,
      ADD COLUMN IF NOT EXISTS ban_expiration TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

      -- Create an index on is_banned for better query performance
      CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);

      -- Create an index on ban_expiration for the cron job
      CREATE INDEX IF NOT EXISTS idx_users_ban_expiration ON users(ban_expiration) WHERE ban_expiration IS NOT NULL;
    `

    // Execute the migration
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Ban columns migration completed successfully")

    return NextResponse.json({
      message: "Ban columns migration completed successfully",
      data,
    })
  } catch (error: any) {
    console.error("Unexpected error during migration:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
