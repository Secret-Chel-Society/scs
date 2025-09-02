import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is authenticated and is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    const isAdmin = userRoles?.some(
      (r) =>
        r.role &&
        (r.role.toLowerCase().includes("admin") ||
          r.role.toLowerCase().includes("owner") ||
          r.role.toLowerCase().includes("league manager")),
    )

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized - Admin privileges required" }, { status: 403 })
    }

    // Read the SQL file content
    const sqlContent = `
-- Create waivers table
CREATE TABLE IF NOT EXISTS waivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    waiving_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    waived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'cleared')),
    winning_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waiver claims table
CREATE TABLE IF NOT EXISTS waiver_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    waiver_id UUID NOT NULL REFERENCES waivers(id) ON DELETE CASCADE,
    claiming_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    priority_order INTEGER NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(waiver_id, claiming_team_id)
);

-- Create waiver priority table
CREATE TABLE IF NOT EXISTS waiver_priority (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    priority_order INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    last_claim_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, week_number, season_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waivers_status ON waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON waivers(claim_deadline);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_waiver_id ON waiver_claims(waiver_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_priority ON waiver_claims(priority_order);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_week_season ON waiver_priority(week_number, season_id);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_order ON waiver_priority(priority_order);
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { query: sqlContent })

    if (error) {
      console.error("Error creating waivers system:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Waivers system tables created successfully",
    })
  } catch (error: any) {
    console.error("Error in waivers system migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
