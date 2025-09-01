import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to perform this action" },
        { status: 401 },
      )
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "You must be an admin to perform this action" },
        { status: 403 },
      )
    }

    // Run the migration SQL
    const { data, error } = await supabase.rpc("run_sql", {
      sql_query: `
        -- Create player_statistics table if it doesn't exist
        CREATE TABLE IF NOT EXISTS player_statistics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
          games_played INTEGER DEFAULT 0,
          goals INTEGER DEFAULT 0,
          assists INTEGER DEFAULT 0,
          points INTEGER DEFAULT 0,
          plus_minus INTEGER DEFAULT 0,
          pim INTEGER DEFAULT 0, -- Penalty minutes
          shots INTEGER DEFAULT 0,
          hits INTEGER DEFAULT 0,
          blocks INTEGER DEFAULT 0,
          save_pct DECIMAL(5,3) DEFAULT 0,
          goals_against_avg DECIMAL(5,2) DEFAULT 0,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          shutouts INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(player_id, season_id)
        );
        
        -- Create index on player_id for faster lookup
        CREATE INDEX IF NOT EXISTS idx_player_statistics_player_id ON player_statistics(player_id);
        
        -- Create index on season_id for faster lookup
        CREATE INDEX IF NOT EXISTS idx_player_statistics_season_id ON player_statistics(season_id);
        
        -- Create trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_player_statistics_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_update_player_statistics_updated_at ON player_statistics;
        CREATE TRIGGER trigger_update_player_statistics_updated_at
        BEFORE UPDATE ON player_statistics
        FOR EACH ROW
        EXECUTE FUNCTION update_player_statistics_updated_at();
      `,
    })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: "Migration failed", message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Player statistics table created successfully",
    })
  } catch (error: any) {
    console.error("Error in player statistics migration:", error)
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 })
  }
}
