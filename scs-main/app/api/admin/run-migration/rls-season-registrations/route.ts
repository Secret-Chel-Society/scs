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
    console.log("Starting RLS season registrations migration...")

    // Read the migration SQL file content
    const migrationSQL = `
      -- Enable RLS on the season_registrations table if not already enabled
      ALTER TABLE season_registrations ENABLE ROW LEVEL SECURITY;

      -- Drop existing policy if it exists
      DROP POLICY IF EXISTS can_insert_season_registrations ON public.season_registrations;

      -- Create a policy to allow only non-banned users to insert new records
      CREATE POLICY can_insert_season_registrations ON public.season_registrations
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.users
          WHERE users.id = season_registrations.user_id
          AND (users.is_banned = FALSE OR users.is_banned IS NULL)
        )
      );

      -- Allow users to read their own registrations
      CREATE POLICY IF NOT EXISTS can_read_own_registrations ON public.season_registrations
      FOR SELECT
      USING (auth.uid() = user_id);

      -- Allow admins to read all registrations
      CREATE POLICY IF NOT EXISTS admin_can_read_all_registrations ON public.season_registrations
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'Admin'
        )
      );

      -- Allow admins to update registrations
      CREATE POLICY IF NOT EXISTS admin_can_update_registrations ON public.season_registrations
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'Admin'
        )
      );
    `

    // Execute the migration
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("RLS season registrations migration completed successfully")

    return NextResponse.json({
      message: "RLS season registrations migration completed successfully",
      data,
    })
  } catch (error: any) {
    console.error("Unexpected error during migration:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
