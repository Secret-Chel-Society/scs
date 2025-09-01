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

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "Admin")

    if (userError || !userData || userData.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration to fix the relationship between matches and seasons
    const migrationSQL = `
      -- First, check if the seasons table exists
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.tables
              WHERE table_name = 'seasons'
          ) THEN
              -- Create the seasons table if it doesn't exist
              CREATE TABLE seasons (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  name TEXT NOT NULL,
                  start_date TIMESTAMP WITH TIME ZONE,
                  end_date TIMESTAMP WITH TIME ZONE,
                  is_active BOOLEAN DEFAULT false,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
              );
          END IF;
          
          -- Check if season_id column exists in matches table
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'matches'
              AND column_name = 'season_id'
          ) THEN
              -- Add season_id column to matches table
              ALTER TABLE matches ADD COLUMN season_id UUID REFERENCES seasons(id);
          END IF;
      END $$;
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("run_sql", {
      query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: migrationError.message }, { status: 500 })
    }

    // Refresh the schema cache to ensure the relationship is recognized
    const refreshCacheSQL = `
      SELECT pg_catalog.pg_refresh_view(c.oid)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'matches' AND n.nspname = 'public';
    `

    await supabase.rpc("run_sql", {
      query: refreshCacheSQL,
    })

    return NextResponse.json({ success: true, message: "Matches-seasons relationship fixed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
