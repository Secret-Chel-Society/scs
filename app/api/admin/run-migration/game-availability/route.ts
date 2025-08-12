import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the migration SQL
    const migrationSQL = `
-- Create game_availability table
CREATE TABLE IF NOT EXISTS game_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'injury_reserve')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_availability_match_id ON game_availability(match_id);
CREATE INDEX IF NOT EXISTS idx_game_availability_player_id ON game_availability(player_id);
CREATE INDEX IF NOT EXISTS idx_game_availability_user_id ON game_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_game_availability_team_id ON game_availability(team_id);

-- Enable RLS
ALTER TABLE game_availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own availability" ON game_availability;
DROP POLICY IF EXISTS "Users can manage their own availability" ON game_availability;
DROP POLICY IF EXISTS "Team managers can view team availability" ON game_availability;

-- Create RLS policies
CREATE POLICY "Users can view their own availability" ON game_availability
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own availability" ON game_availability
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Team managers can view team availability" ON game_availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players p 
            WHERE p.user_id = auth.uid() 
            AND p.team_id = game_availability.team_id 
            AND p.role IN ('Owner', 'GM', 'AGM')
        )
    );

-- Grant permissions
GRANT ALL ON game_availability TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
    `

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
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

    return NextResponse.json({
      success: true,
      message: "Game availability table created successfully",
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
