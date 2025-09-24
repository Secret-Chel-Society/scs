import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read and execute the migration
    const migrationSQL = `
      -- Add finalized column to player_bidding table
      ALTER TABLE player_bidding 
      ADD COLUMN IF NOT EXISTS finalized BOOLEAN DEFAULT FALSE;

      -- Add status column to players table if it doesn't exist
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
      CHECK (status IN ('active', 'free_agent', 'waived', 'retired'));

      -- Update existing records
      UPDATE player_bidding 
      SET finalized = TRUE 
      WHERE processed = TRUE AND status IN ('completed', 'expired', 'cancelled');

      -- Update player status for free agents
      UPDATE players 
      SET status = 'free_agent' 
      WHERE team_id IS NULL AND status = 'active';
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added finalized column and status tracking",
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
