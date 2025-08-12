import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Read the migration SQL file content
    const migrationSQL = `
      -- Add columns to track manual player removals and prevent re-assignment
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS manually_removed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS manually_removed_at TIMESTAMP WITH TIME ZONE;

      -- Add columns to player_bidding table for better tracking
      ALTER TABLE player_bidding 
      ADD COLUMN IF NOT EXISTS won_bid BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

      -- Create index for performance
      CREATE INDEX IF NOT EXISTS idx_players_manually_removed ON players(manually_removed) WHERE manually_removed = TRUE;
      CREATE INDEX IF NOT EXISTS idx_player_bidding_processed ON player_bidding(processed, status);
      CREATE INDEX IF NOT EXISTS idx_player_bidding_player_id_status ON player_bidding(player_id, status);

      -- Update existing data to mark processed bids
      UPDATE player_bidding 
      SET processed = TRUE, 
          status = 'completed',
          processed_at = NOW()
      WHERE player_id IN (
          SELECT DISTINCT p.id 
          FROM players p 
          WHERE p.team_id IS NOT NULL
      ) AND processed = FALSE;
    `

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json(
        {
          error: "Migration failed",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Manual removal tracking migration completed successfully",
    })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
