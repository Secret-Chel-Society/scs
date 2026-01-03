import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // FIX: getUser() is more reliable than getSession() in route handlers
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user is a team manager (GM, AGM, Owner)
    // FIX: use user.id and keep it flexible for NHL/AHL
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("role, team_id, team_id_ahl")
      .eq("user_id", user.id)

    if (playerError) {
      return NextResponse.json({ error: "Failed to verify player status" }, { status: 500 })
    }

    const isManager = (playerData ?? []).some((player) => ["GM", "AGM", "Owner"].includes(player.role))

    if (!isManager) {
      return NextResponse.json({ error: "Only team managers can run this migration" }, { status: 403 })
    }

    // Create the lineups table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS lineups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        position VARCHAR(10) NOT NULL,
        line_number INT NOT NULL DEFAULT 1,
        is_starter BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(match_id, team_id, player_id)
      );
    `

    // Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_lineups_match_id ON lineups(match_id);
      CREATE INDEX IF NOT EXISTS idx_lineups_team_id ON lineups(team_id);
      CREATE INDEX IF NOT EXISTS idx_lineups_player_id ON lineups(player_id);
    `

    // Create trigger function
    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_lineups_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Create trigger
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS update_lineups_modtime ON lineups;
      CREATE TRIGGER update_lineups_modtime
      BEFORE UPDATE ON lineups
      FOR EACH ROW
      EXECUTE FUNCTION update_lineups_modified_column();
    `

    // Execute SQL statements (FIX: capture rpc errors)
    const r1 = await supabase.rpc("exec_sql", { sql: createTableSQL })
    if (r1.error) return NextResponse.json({ error: r1.error.message }, { status: 500 })

    const r2 = await supabase.rpc("exec_sql", { sql: createIndexesSQL })
    if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 })

    const r3 = await supabase.rpc("exec_sql", { sql: createTriggerFunctionSQL })
    if (r3.error) return NextResponse.json({ error: r3.error.message }, { status: 500 })

    const r4 = await supabase.rpc("exec_sql", { sql: createTriggerSQL })
    if (r4.error) return NextResponse.json({ error: r4.error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: "Lineups table created successfully" })
  } catch (error: any) {
    console.error("Error creating lineups table:", error)
    return NextResponse.json(
      { error: "Failed to create lineups table", details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
