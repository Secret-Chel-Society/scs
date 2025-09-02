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
    console.log("Starting system_settings RLS migration...")

    // Read the migration SQL file content
    const migrationSQL = `
      -- Enable RLS on the system_settings table if not already enabled
      ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "system_settings_select_policy" ON system_settings;
      DROP POLICY IF EXISTS "system_settings_insert_policy" ON system_settings;
      DROP POLICY IF EXISTS "system_settings_update_policy" ON system_settings;
      DROP POLICY IF EXISTS "system_settings_delete_policy" ON system_settings;

      -- Create a function to check if user is admin (reuse existing if available)
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

      -- Allow SELECT for:
      -- 1. All authenticated users (can read system settings)
      -- 2. Anonymous users for public settings (if needed)
      CREATE POLICY "system_settings_select_policy" ON system_settings
        FOR SELECT
        USING (true); -- Allow all users to read system settings

      -- Allow INSERT for:
      -- 1. Admins only (can create new system settings)
      CREATE POLICY "system_settings_insert_policy" ON system_settings
        FOR INSERT
        WITH CHECK (
          is_admin(auth.uid())
        );

      -- Allow UPDATE for:
      -- 1. Admins only (can update system settings)
      CREATE POLICY "system_settings_update_policy" ON system_settings
        FOR UPDATE
        USING (
          is_admin(auth.uid())
        );

      -- Allow DELETE for:
      -- 1. Admins only (can delete system settings)
      CREATE POLICY "system_settings_delete_policy" ON system_settings
        FOR DELETE
        USING (
          is_admin(auth.uid())
        );

      -- Grant necessary permissions
      GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

      -- Ensure service_role can bypass RLS for system operations
      GRANT ALL ON system_settings TO service_role;
    `

    // Execute the migration
    const { error: migrationError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration SQL error:", migrationError)
      throw new Error(`Migration failed: ${migrationError.message}`)
    }

    console.log("✅ system_settings RLS migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "System settings RLS policies created successfully",
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
