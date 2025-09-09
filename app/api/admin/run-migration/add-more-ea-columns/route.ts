import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
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
      .eq("role", "admin")

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Read the migration SQL file
    const migrationSql = `
    -- Add additional missing columns to ea_player_stats table
    DO $$
    BEGIN
      -- Check and add toiseconds column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'toiseconds'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN toiseconds TEXT;
      END IF;

      -- Check and add defensive_zone_time column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'defensive_zone_time'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN defensive_zone_time INTEGER;
      END IF;

      -- Check and add offensive_zone_time column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'offensive_zone_time'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN offensive_zone_time INTEGER;
      END IF;

      -- Check and add neutral_zone_time column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'neutral_zone_time'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN neutral_zone_time INTEGER;
      END IF;

      -- Check and add shot_attempts column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'shot_attempts'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN shot_attempts INTEGER;
      END IF;

      -- Check and add shot_pct column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'shot_pct'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN shot_pct NUMERIC;
      END IF;

      -- Check and add faceoffs_won column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'faceoffs_won'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN faceoffs_won INTEGER;
      END IF;

      -- Check and add faceoffs_taken column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'faceoffs_taken'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN faceoffs_taken INTEGER;
      END IF;

      -- Check and add faceoff_pct column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'faceoff_pct'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN faceoff_pct NUMERIC;
      END IF;
    END $$;
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql: migrationSql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Additional EA player stats columns added successfully" })
  } catch (error: any) {
    console.error("Error in add-more-ea-columns migration:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
