import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if the user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a team manager (GM, AGM, Owner) or admin
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("role, team_id")
      .eq("user_id", session.user.id)

    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    const isAdmin = userRoles && userRoles.length > 0
    const isTeamManager = playerData && playerData.some((p) => ["GM", "AGM", "Owner"].includes(p.role))

    if (!isAdmin && !isTeamManager) {
      return NextResponse.json(
        {
          error: "Unauthorized. You must be a team manager or admin to run this migration.",
        },
        { status: 401 },
      )
    }

    // SQL to create lineups table
    const sql = `
    -- Create lineups table if it doesn't exist
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

    -- Create index on match_id for faster lookup
    CREATE INDEX IF NOT EXISTS idx_lineups_match_id ON lineups(match_id);

    -- Create index on team_id for faster lookup
    CREATE INDEX IF NOT EXISTS idx_lineups_team_id ON lineups(team_id);

    -- Create index on player_id for faster lookup
    CREATE INDEX IF NOT EXISTS idx_lineups_player_id ON lineups(player_id);

    -- Add a trigger to update the updated_at timestamp if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lineups_modtime') THEN
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE 'plpgsql';

        CREATE TRIGGER update_lineups_modtime
        BEFORE UPDATE ON lineups
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
      END IF;
    END
    $$;
    `

    // Run the migration
    const { error: migrationError } = await supabase.rpc("run_sql", { query: sql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        {
          error: "Failed to create lineups table",
          details: migrationError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Lineups table created successfully",
    })
  } catch (error: any) {
    console.error("Error creating lineups table:", error)
    return NextResponse.json({ error: "Error creating lineups table", details: error.message }, { status: 500 })
  }
}
