import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key provided" }, { status: 401 })
    }

    // Create a Supabase admin client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    console.log("Starting team managers RLS policy fix...")

    // Read the migration SQL file content
    const migrationSQL = `
-- Fix RLS policies for team_managers table to allow admin operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "team_managers_select_policy" ON team_managers;
DROP POLICY IF EXISTS "team_managers_insert_policy" ON team_managers;
DROP POLICY IF EXISTS "team_managers_update_policy" ON team_managers;
DROP POLICY IF EXISTS "team_managers_delete_policy" ON team_managers;

-- Enable RLS on team_managers table
ALTER TABLE team_managers ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is team manager for a specific team
CREATE OR REPLACE FUNCTION is_team_manager_for_team(user_id UUID, team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_managers 
    WHERE team_managers.user_id = $1 
    AND team_managers.team_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow SELECT for:
-- 1. Admins (can see all)
-- 2. Users can see their own team manager records
-- 3. Team managers can see records for their teams
CREATE POLICY "team_managers_select_policy" ON team_managers
  FOR SELECT
  USING (
    is_admin(auth.uid()) OR
    user_id = auth.uid() OR
    is_team_manager_for_team(auth.uid(), team_id)
  );

-- Allow INSERT for:
-- 1. Admins (can create any team manager record)
-- 2. Existing team managers can add other managers to their teams
CREATE POLICY "team_managers_insert_policy" ON team_managers
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid()) OR
    is_team_manager_for_team(auth.uid(), team_id)
  );

-- Allow UPDATE for:
-- 1. Admins (can update any record)
-- 2. Team managers can update records for their teams
CREATE POLICY "team_managers_update_policy" ON team_managers
  FOR UPDATE
  USING (
    is_admin(auth.uid()) OR
    is_team_manager_for_team(auth.uid(), team_id)
  );

-- Allow DELETE for:
-- 1. Admins (can delete any record)
-- 2. Team managers can remove managers from their teams
CREATE POLICY "team_managers_delete_policy" ON team_managers
  FOR DELETE
  USING (
    is_admin(auth.uid()) OR
    is_team_manager_for_team(auth.uid(), team_id)
  );

-- Create or replace function to automatically manage team_managers when player roles change
CREATE OR REPLACE FUNCTION sync_team_managers_from_players()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If the new role is a management role, add to team_managers
    IF NEW.role IN ('GM', 'AGM', 'Owner') AND NEW.team_id IS NOT NULL THEN
      INSERT INTO team_managers (user_id, team_id, role)
      VALUES (NEW.user_id, NEW.team_id, NEW.role)
      ON CONFLICT (user_id, team_id) 
      DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
    END IF;
    
    -- If role changed from management to non-management, remove from team_managers
    IF TG_OP = 'UPDATE' AND OLD.role IN ('GM', 'AGM', 'Owner') AND NEW.role NOT IN ('GM', 'AGM', 'Owner') THEN
      DELETE FROM team_managers 
      WHERE user_id = NEW.user_id AND team_id = COALESCE(NEW.team_id, OLD.team_id);
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Remove from team_managers when player is deleted
    DELETE FROM team_managers 
    WHERE user_id = OLD.user_id AND team_id = OLD.team_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_team_managers_trigger ON players;

-- Create trigger to automatically sync team_managers
CREATE TRIGGER sync_team_managers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON players
  FOR EACH ROW
  EXECUTE FUNCTION sync_team_managers_from_players();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_manager_for_team(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_team_managers_from_players() TO authenticated;

-- Ensure service_role can bypass RLS for admin operations
GRANT ALL ON team_managers TO service_role;
`

    // Execute the migration
    const { error: migrationError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        {
          error: "Failed to run migration",
          details: migrationError,
        },
        { status: 500 },
      )
    }

    console.log("Team managers RLS policy fix completed successfully")

    return NextResponse.json({
      success: true,
      message: "Team managers RLS policies fixed successfully",
      details: {
        policiesCreated: [
          "team_managers_select_policy",
          "team_managers_insert_policy",
          "team_managers_update_policy",
          "team_managers_delete_policy",
        ],
        functionsCreated: ["is_admin", "is_team_manager_for_team", "sync_team_managers_from_players"],
        triggersCreated: ["sync_team_managers_trigger"],
      },
    })
  } catch (error: any) {
    console.error("Error running team managers RLS fix:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: error,
      },
      { status: 500 },
    )
  }
}
