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

    // Check if the user is an admin
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (userRolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Read the SQL file content
    const sql = `
    -- This migration populates the team_managers table based on existing player roles
    -- It will add entries for players with GM, AGM, or Owner roles

    -- First, ensure the team_managers table exists
    CREATE TABLE IF NOT EXISTS team_managers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'Manager',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, team_id)
    );

    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_team_managers_user_id ON team_managers(user_id);
    CREATE INDEX IF NOT EXISTS idx_team_managers_team_id ON team_managers(team_id);

    -- Add trigger for updated_at if it doesn't exist
    DO $$
    DECLARE
      trigger_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_managers_modtime'
      ) INTO trigger_exists;
      
      IF NOT trigger_exists THEN
        EXECUTE '
          CREATE OR REPLACE FUNCTION update_modified_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE ''plpgsql'';

          CREATE TRIGGER update_team_managers_modtime
          BEFORE UPDATE ON team_managers
          FOR EACH ROW
          EXECUTE PROCEDURE update_modified_column();
        ';
      END IF;
    END
    $$;

    -- Insert team managers from players table if they don't exist
    INSERT INTO team_managers (user_id, team_id, role)
    SELECT p.user_id, p.team_id, p.role
    FROM players p
    WHERE p.role IN ('GM', 'AGM', 'Owner', 'gm', 'agm', 'owner')
    AND p.team_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM team_managers tm 
      WHERE tm.user_id = p.user_id AND tm.team_id = p.team_id
    );
    `

    // Run the SQL query
    const { error: sqlError } = await supabase.rpc("run_sql", { query: sql })

    if (sqlError) {
      console.error("SQL Error:", sqlError)
      return NextResponse.json({ error: "Failed to run migration: " + sqlError.message }, { status: 500 })
    }

    // Now, let's also add a specific entry for the LOHBoston Bruins owner if needed
    // First, get the LOHBoston Bruins team ID
    const { data: bostonTeam, error: bostonTeamError } = await supabase
      .from("teams")
      .select("id")
      .ilike("name", "%boston%bruins%")
      .single()

    if (!bostonTeamError && bostonTeam) {
      // Find users with Owner role
      const { data: owners, error: ownersError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "Owner")

      if (!ownersError && owners && owners.length > 0) {
        // For each owner, check if they need to be added to the team_managers table
        for (const owner of owners) {
          const { error: insertError } = await supabase.from("team_managers").upsert({
            user_id: owner.user_id,
            team_id: bostonTeam.id,
            role: "Owner",
          })

          if (insertError) {
            console.error("Error adding Boston Bruins owner:", insertError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Team managers table has been populated successfully",
    })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
