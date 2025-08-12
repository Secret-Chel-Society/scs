import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read and execute the SQL migration
    const migrationSQL = `
      -- Add discord_role_id column to teams table if it doesn't exist
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'teams' AND column_name = 'discord_role_id'
          ) THEN
              ALTER TABLE teams ADD COLUMN discord_role_id TEXT;
              
              COMMENT ON COLUMN teams.discord_role_id IS 'Discord role ID for this team';
          END IF;
      END $$;
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Teams Discord roles column migration completed successfully",
    })
  } catch (error: any) {
    console.error("Error running teams Discord roles migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
