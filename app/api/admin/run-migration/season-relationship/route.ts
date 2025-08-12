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
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration to add season_id to matches table
    const migrationSQL = `
      -- Check if season_id column exists in matches table
      DO $$
      BEGIN
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

    return NextResponse.json({ success: true, message: "Season relationship migration completed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
