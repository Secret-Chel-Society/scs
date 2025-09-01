import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if the user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user is a team manager (GM, AGM, Owner) in the players table
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("role, team_id")
      .eq("user_id", session.user.id)

    if (playerError) {
      return NextResponse.json({ error: "Failed to verify team manager status" }, { status: 500 })
    }

    // Check if any of the player roles are management roles
    const isManager = playerData ? playerData.some((player) => ["GM", "AGM", "Owner"].includes(player.role)) : false

    if (!isManager) {
      return NextResponse.json({ error: "Only team managers can perform this action" }, { status: 403 })
    }

    // SQL to create team_managers table
    const sql = `
    -- Create team_managers table if it doesn't exist
    CREATE TABLE IF NOT EXISTS team_managers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'Manager',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, team_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_team_managers_user_id ON team_managers(user_id);
    CREATE INDEX IF NOT EXISTS idx_team_managers_team_id ON team_managers(team_id);

    -- Add trigger for updated_at
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_managers_modtime') THEN
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE 'plpgsql';

        CREATE TRIGGER update_team_managers_modtime
        BEFORE UPDATE ON team_managers
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
      END IF;
    END
    $$;

    -- Insert team managers from players table if they don't exist
    INSERT INTO team_managers (user_id, team_id, role)
    SELECT p.user_id, p.team_id, p.role
    FROM players p
    WHERE p.role IN ('GM', 'AGM', 'Owner')
    AND NOT EXISTS (
      SELECT 1 FROM team_managers tm 
      WHERE tm.user_id = p.user_id AND tm.team_id = p.team_id
    );
    `

    // Run the SQL query
    const { error: sqlError } = await supabase.rpc("run_sql", { query: sql })

    if (sqlError) {
      console.error("SQL Error:", sqlError)
      return NextResponse.json({ error: "Failed to create team managers table" }, { status: 500 })
    }

    // Now also run the lineups table migration
    const lineupsSql = `
    -- Create lineups table if it doesn't exist
    CREATE TABLE IF NOT EXISTS lineups (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      position VARCHAR(10) NOT NULL,
      line_number INT NOT NULL DEFAULT 1,
      is_starter BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(match_id, team_id, player_id),
      UNIQUE(match_id, team_id, position, line_number)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_lineups_match_id ON lineups(match_id);
    CREATE INDEX IF NOT EXISTS idx_lineups_team_id ON lineups(team_id);
    CREATE INDEX IF NOT EXISTS idx_lineups_player_id ON lineups(player_id);

    -- Add trigger for updated_at
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lineups_modtime') THEN
        CREATE TRIGGER update_lineups_modtime
        BEFORE UPDATE ON lineups
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
      END IF;
    END
    $$;
    `

    // Run the lineups SQL query
    const { error: lineupsSqlError } = await supabase.rpc("run_sql", { query: lineupsSql })

    if (lineupsSqlError) {
      console.error("Lineups SQL Error:", lineupsSqlError)
      // Don't fail the request if only the lineups table creation fails
      return NextResponse.json({
        success: true,
        warning: "Team managers table created, but lineups table creation failed",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Team managers and lineups tables created successfully",
    })
  } catch (error: any) {
    console.error("Error setting up team managers:", error)
    return NextResponse.json({ error: "Error setting up team managers", details: error.message }, { status: 500 })
  }
}
