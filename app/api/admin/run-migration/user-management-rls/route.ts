import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log("Starting user management RLS migration...")

    const migrationSQL = `
      -- Ensure is_admin function exists
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

      -- Enable RLS on users table if not already enabled
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on players table if not already enabled  
      ALTER TABLE players ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on user_roles table if not already enabled
      ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "users_admin_select_policy" ON users;
      DROP POLICY IF EXISTS "users_admin_update_policy" ON users;
      DROP POLICY IF EXISTS "users_select_policy" ON users;
      DROP POLICY IF EXISTS "players_admin_all_policy" ON players;
      DROP POLICY IF EXISTS "players_select_policy" ON players;
      DROP POLICY IF EXISTS "players_update_policy" ON players;
      DROP POLICY IF EXISTS "user_roles_admin_all_policy" ON user_roles;
      DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;

      -- Users table policies
      -- Allow admins to see and update all users
      CREATE POLICY "users_admin_select_policy" ON users
        FOR SELECT
        USING (is_admin(auth.uid()));

      CREATE POLICY "users_admin_update_policy" ON users
        FOR UPDATE
        USING (is_admin(auth.uid()));

      -- Allow users to see their own data
      CREATE POLICY "users_select_policy" ON users
        FOR SELECT
        USING (auth.uid() = id);

      -- Players table policies
      -- Allow admins to do everything with players
      CREATE POLICY "players_admin_all_policy" ON players
        FOR ALL
        USING (is_admin(auth.uid()))
        WITH CHECK (is_admin(auth.uid()));

      -- Allow users to see their own player data
      CREATE POLICY "players_select_policy" ON players
        FOR SELECT
        USING (auth.uid() = user_id);

      -- Allow team managers to update players on their teams
      CREATE POLICY "players_update_policy" ON players
        FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM team_managers
            WHERE team_managers.user_id = auth.uid()
            AND team_managers.team_id = players.team_id
          )
        );

      -- User_roles table policies
      -- Allow admins to do everything with user roles
      CREATE POLICY "user_roles_admin_all_policy" ON user_roles
        FOR ALL
        USING (is_admin(auth.uid()))
        WITH CHECK (is_admin(auth.uid()));

      -- Allow users to see their own roles
      CREATE POLICY "user_roles_select_policy" ON user_roles
        FOR SELECT
        USING (auth.uid() = user_id);

      -- Grant necessary permissions
      GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

      -- Ensure service_role can bypass RLS for all operations
      GRANT ALL ON users TO service_role;
      GRANT ALL ON players TO service_role;
      GRANT ALL ON user_roles TO service_role;
    `

    // Execute the migration
    const { error: migrationError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration SQL error:", migrationError)
      throw new Error(`Migration failed: ${migrationError.message}`)
    }

    console.log("✅ User management RLS migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "User management RLS policies created successfully",
    })
  } catch (error: any) {
    console.error("❌ Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
