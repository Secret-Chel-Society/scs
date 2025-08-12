import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

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

    if (rolesError) {
      console.error("Role verification error:", rolesError)
      return NextResponse.json({ error: "Failed to verify user role: " + rolesError.message }, { status: 500 })
    }

    const isAdmin = userRoles?.some((role) => role.role === "admin") || false

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Define the migration SQL directly in the API route
    const migrationSQL = `
    -- Create match_highlights table
    CREATE TABLE IF NOT EXISTS public.match_highlights (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
    );

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_match_highlights_match_id ON public.match_highlights(match_id);

    -- Grant permissions
    ALTER TABLE public.match_highlights ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DO $$
    BEGIN
      -- Check if the policy already exists
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_highlights' AND policyname = 'match_highlights_select_policy'
      ) THEN
        CREATE POLICY match_highlights_select_policy ON public.match_highlights
          FOR SELECT USING (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_highlights' AND policyname = 'match_highlights_insert_policy'
      ) THEN
        CREATE POLICY match_highlights_insert_policy ON public.match_highlights
          FOR INSERT WITH CHECK (
            auth.uid() IN (
              SELECT user_id FROM user_roles WHERE role = 'admin'
              UNION
              SELECT user_id FROM team_managers tm
              JOIN matches m ON m.home_team_id = tm.team_id OR m.away_team_id = tm.team_id
              WHERE m.id = match_id
            )
          );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_highlights' AND policyname = 'match_highlights_update_policy'
      ) THEN
        CREATE POLICY match_highlights_update_policy ON public.match_highlights
          FOR UPDATE USING (
            auth.uid() IN (
              SELECT user_id FROM user_roles WHERE role = 'admin'
              UNION
              SELECT user_id FROM team_managers tm
              JOIN matches m ON m.home_team_id = tm.team_id OR m.away_team_id = tm.team_id
              WHERE m.id = match_id
            )
          );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_highlights' AND policyname = 'match_highlights_delete_policy'
      ) THEN
        CREATE POLICY match_highlights_delete_policy ON public.match_highlights
          FOR DELETE USING (
            auth.uid() IN (
              SELECT user_id FROM user_roles WHERE role = 'admin'
              UNION
              SELECT user_id FROM team_managers tm
              JOIN matches m ON m.home_team_id = tm.team_id OR m.away_team_id = tm.team_id
              WHERE m.id = match_id
            )
          );
      END IF;
    END
    $$;

    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_match_highlights_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS update_match_highlights_updated_at_trigger ON public.match_highlights;

    -- Create the trigger
    CREATE TRIGGER update_match_highlights_updated_at_trigger
    BEFORE UPDATE ON public.match_highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_match_highlights_updated_at();
    `

    // First, check if the exec_sql function exists
    const { data: functionExists, error: functionCheckError } = await supabase
      .rpc("exec_sql", {
        sql_query: "SELECT 1 FROM pg_proc WHERE proname = 'exec_sql'",
      })
      .single()

    if (functionCheckError) {
      console.error("Function check error:", functionCheckError)

      // Try using run_sql instead if exec_sql doesn't exist
      const { error: runSqlError } = await supabase.rpc("run_sql", {
        query: migrationSQL,
      })

      if (runSqlError) {
        console.error("run_sql error:", runSqlError)
        return NextResponse.json(
          {
            error: "Migration failed. Could not execute SQL: " + runSqlError.message,
          },
          { status: 500 },
        )
      }
    } else {
      // Use exec_sql if it exists
      const { error: migrationError } = await supabase.rpc("exec_sql", {
        sql_query: migrationSQL,
      })

      if (migrationError) {
        console.error("Migration error with exec_sql:", migrationError)
        return NextResponse.json(
          {
            error: "Failed to run migration: " + migrationError.message,
          },
          { status: 500 },
        )
      }
    }

    // Verify the table was created
    const { error: verificationError } = await supabase.from("match_highlights").select("id").limit(1)

    if (verificationError) {
      console.error("Table verification error:", verificationError)
      return NextResponse.json(
        {
          error: "Migration may have failed. Could not verify table exists: " + verificationError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Unexpected error running migration:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while running the migration" },
      { status: 500 },
    )
  }
}
