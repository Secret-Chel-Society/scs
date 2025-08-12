import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is authenticated and is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: player } = await supabase.from("players").select("role").eq("user_id", session.user.id).single()

    if (!player || !["Owner", "Admin"].includes(player.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Create waiver_priority table if it doesn't exist
    const { error: priorityTableError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Create waiver_priority table if it doesn't exist
        CREATE TABLE IF NOT EXISTS waiver_priority (
          id SERIAL PRIMARY KEY,
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          priority INTEGER NOT NULL,
          original_priority INTEGER NOT NULL,
          last_claim_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(team_id)
        );

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_waiver_priority_team_id ON waiver_priority(team_id);
        CREATE INDEX IF NOT EXISTS idx_waiver_priority_priority ON waiver_priority(priority);
      `,
    })

    if (priorityTableError) {
      console.error("Error creating waiver_priority table:", priorityTableError)
      throw priorityTableError
    }

    // Create waiver_claims table if it doesn't exist
    const { error: claimsTableError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Create waiver_claims table if it doesn't exist
        CREATE TABLE IF NOT EXISTS waiver_claims (
          id SERIAL PRIMARY KEY,
          waiver_id UUID NOT NULL REFERENCES waivers(id) ON DELETE CASCADE,
          claiming_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          priority_at_claim INTEGER NOT NULL,
          claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(waiver_id, claiming_team_id)
        );

        -- Create indexes for waiver_claims
        CREATE INDEX IF NOT EXISTS idx_waiver_claims_waiver_id ON waiver_claims(waiver_id);
        CREATE INDEX IF NOT EXISTS idx_waiver_claims_team_id ON waiver_claims(claiming_team_id);
        CREATE INDEX IF NOT EXISTS idx_waiver_claims_status ON waiver_claims(status);
      `,
    })

    if (claimsTableError) {
      console.error("Error creating waiver_claims table:", claimsTableError)
      throw claimsTableError
    }

    // Initialize waiver priority for existing teams based on current standings
    const { error: initPriorityError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Initialize waiver priority for existing teams based on current standings
        INSERT INTO waiver_priority (team_id, priority, original_priority)
        SELECT 
          t.id,
          ROW_NUMBER() OVER (ORDER BY t.points ASC, t.wins ASC, (t.goals_for - t.goals_against) ASC) as priority,
          ROW_NUMBER() OVER (ORDER BY t.points ASC, t.wins ASC, (t.goals_for - t.goals_against) ASC) as original_priority
        FROM teams t
        WHERE t.is_active = true
        ON CONFLICT (team_id) DO NOTHING;
      `,
    })

    if (initPriorityError) {
      console.error("Error initializing waiver priority:", initPriorityError)
      throw initPriorityError
    }

    return NextResponse.json({
      success: true,
      message: "Waiver priority and claims tables created successfully",
    })
  } catch (error: any) {
    console.error("Error running waiver priority migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
