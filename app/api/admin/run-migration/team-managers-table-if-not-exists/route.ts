import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Run the migration
    const migrationSql = `
    -- Check if team_managers table exists
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'team_managers'
        ) THEN
            CREATE TABLE public.team_managers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, team_id)
            );

            -- Add RLS policies
            ALTER TABLE public.team_managers ENABLE ROW LEVEL SECURITY;

            -- Policy for all authenticated users to view
            CREATE POLICY view_team_managers_policy ON public.team_managers
                FOR SELECT
                TO authenticated
                USING (true);
                
            -- Policy for users to view their own team manager entries
            CREATE POLICY manage_own_team_managers_policy ON public.team_managers
                USING (
                    user_id = auth.uid()
                );
        END IF;
    END
    $$;
    `

    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_query: migrationSql,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: migrationError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Team managers table created if it didn't exist" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
