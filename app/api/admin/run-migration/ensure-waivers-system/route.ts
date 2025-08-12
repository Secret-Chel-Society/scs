import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id)

    const isAdmin = userRoles?.some((role) => role.role === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Read and execute the migration
    const migrationSQL = `
-- Ensure waivers table exists with correct structure
CREATE TABLE IF NOT EXISTS waivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    waiving_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    waived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'cancelled')),
    winning_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure waiver_claims table exists
CREATE TABLE IF NOT EXISTS waiver_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    waiver_id UUID NOT NULL REFERENCES waivers(id) ON DELETE CASCADE,
    claiming_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    priority_at_claim INTEGER NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure waiver_priority table exists
CREATE TABLE IF NOT EXISTS waiver_priority (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
    priority_order INTEGER NOT NULL,
    last_claim_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waivers_status ON waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON waivers(claim_deadline);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_waiver_id ON waiver_claims(waiver_id);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_team_id ON waiver_priority(team_id);

-- Enable RLS
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_priority ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for waivers
DROP POLICY IF EXISTS "Users can view all active waivers" ON waivers;
CREATE POLICY "Users can view all active waivers" ON waivers
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Team managers can create waivers for their players" ON waivers;
CREATE POLICY "Team managers can create waivers for their players" ON waivers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM players p1, players p2
            WHERE p1.user_id = auth.uid()
            AND p1.role IN ('Owner', 'GM', 'AGM')
            AND p2.id = player_id
            AND p1.team_id = p2.team_id
        )
    );

-- Create RLS policies for waiver_claims
DROP POLICY IF EXISTS "Users can view waiver claims" ON waiver_claims;
CREATE POLICY "Users can view waiver claims" ON waiver_claims
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Team managers can create waiver claims" ON waiver_claims;
CREATE POLICY "Team managers can create waiver claims" ON waiver_claims
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM players
            WHERE user_id = auth.uid()
            AND role IN ('Owner', 'GM', 'AGM')
            AND team_id = claiming_team_id
        )
    );

-- Create RLS policies for waiver_priority
DROP POLICY IF EXISTS "Users can view waiver priority" ON waiver_priority;
CREATE POLICY "Users can view waiver priority" ON waiver_priority
    FOR SELECT USING (auth.role() = 'authenticated');
    `

    const { error } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Waivers system migration completed successfully",
    })
  } catch (error: any) {
    console.error("Error running waivers system migration:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to run migration",
        details: error,
      },
      { status: 500 },
    )
  }
}
