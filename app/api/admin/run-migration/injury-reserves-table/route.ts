import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the migration SQL file content
    const migrationSQL = `
-- Create injury_reserves table if it doesn't exist
CREATE TABLE IF NOT EXISTS injury_reserves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_id TEXT NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    week_number INTEGER NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_injury_reserves_user_id ON injury_reserves(user_id);
CREATE INDEX IF NOT EXISTS idx_injury_reserves_team_id ON injury_reserves(team_id);
CREATE INDEX IF NOT EXISTS idx_injury_reserves_season_id ON injury_reserves(season_id);
CREATE INDEX IF NOT EXISTS idx_injury_reserves_status ON injury_reserves(status);
CREATE INDEX IF NOT EXISTS idx_injury_reserves_week_dates ON injury_reserves(week_start_date, week_end_date);

-- Enable RLS
ALTER TABLE injury_reserves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own injury reserves" ON injury_reserves;
DROP POLICY IF EXISTS "Users can insert their own injury reserves" ON injury_reserves;
DROP POLICY IF EXISTS "Users can update their own injury reserves" ON injury_reserves;
DROP POLICY IF EXISTS "Users can delete their own injury reserves" ON injury_reserves;
DROP POLICY IF EXISTS "Admins can manage all injury reserves" ON injury_reserves;
DROP POLICY IF EXISTS "Team managers can view team injury reserves" ON injury_reserves;

-- Create RLS policies
CREATE POLICY "Users can view their own injury reserves" ON injury_reserves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own injury reserves" ON injury_reserves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own injury reserves" ON injury_reserves
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own injury reserves" ON injury_reserves
    FOR DELETE USING (auth.uid() = user_id);

-- Admin policy
CREATE POLICY "Admins can manage all injury reserves" ON injury_reserves
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Team managers can view their team's injury reserves
CREATE POLICY "Team managers can view team injury reserves" ON injury_reserves
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_managers tm
            JOIN users u ON u.id = tm.user_id
            WHERE u.id = auth.uid()
            AND tm.team_id = injury_reserves.team_id
        )
    );
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Injury reserves table migration completed successfully",
    })
  } catch (error: any) {
    console.error("Error running injury reserves migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
