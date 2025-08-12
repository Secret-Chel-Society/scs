import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userRoleError || userRoleData?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration SQL
    const { error: migrationError } = await supabase.rpc("run_sql", {
      sql_query: `
        -- Add powerplay and penalty kill statistics columns to teams table if they don't exist
        DO $$
        BEGIN
            -- Check if powerplay_goals column exists
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'teams' AND column_name = 'powerplay_goals'
            ) THEN
                ALTER TABLE teams ADD COLUMN powerplay_goals INTEGER DEFAULT 0;
            END IF;

            -- Check if powerplay_opportunities column exists
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'teams' AND column_name = 'powerplay_opportunities'
            ) THEN
                ALTER TABLE teams ADD COLUMN powerplay_opportunities INTEGER DEFAULT 0;
            END IF;

            -- Check if penalty_kill_goals_against column exists
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'teams' AND column_name = 'penalty_kill_goals_against'
            ) THEN
                ALTER TABLE teams ADD COLUMN penalty_kill_goals_against INTEGER DEFAULT 0;
            END IF;

            -- Check if penalty_kill_opportunities column exists
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'teams' AND column_name = 'penalty_kill_opportunities'
            ) THEN
                ALTER TABLE teams ADD COLUMN penalty_kill_opportunities INTEGER DEFAULT 0;
            END IF;
        END $$;
      `,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: migrationError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Special teams stats columns added to teams table" })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
