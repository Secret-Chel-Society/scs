import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if the user has admin rights
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Run the migration
    const { error: migrationError } = await supabase.rpc("run_sql", { query: sql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        {
          error: "Failed to create team_managers table",
          details: migrationError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Team managers table created successfully",
    })
  } catch (error: any) {
    console.error("Error creating team_managers table:", error)
    return NextResponse.json({ error: "Error creating team_managers table", details: error.message }, { status: 500 })
  }
}
