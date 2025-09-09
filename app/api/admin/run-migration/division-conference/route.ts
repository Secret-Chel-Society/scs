import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured')
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }

    // Read the migration SQL file
    const migrationSql = `
    -- Add division and conference columns to teams table if they don't exist
    DO $$
    BEGIN
      -- Add division column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'teams'
        AND column_name = 'division'
      ) THEN
        ALTER TABLE teams ADD COLUMN division text;
      END IF;

      -- Add conference column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'teams'
        AND column_name = 'conference'
      ) THEN
        ALTER TABLE teams ADD COLUMN conference text;
      END IF;
    END $$;

    -- Update teams with default division and conference values
    UPDATE teams
    SET 
      division = CASE 
        WHEN name IN ('Nova Scotia Freeze', 'Toronto Blades', 'Philadelphia Outlaws', 'New York Knights', 'Winnipeg Royals', 'Quebec Northstars') THEN 'East'
        WHEN name IN ('Vancouver Spartans', 'Calgary Kings', 'St. Louis Skyhawks', 'Las Vegas Kingsmen', 'Thunder Bay Thrashers', 'Syracuse Selects') THEN 'West'
        ELSE NULL
      END,
      conference = CASE 
        WHEN name IN ('Nova Scotia Freeze', 'Toronto Blades', 'Philadelphia Outlaws', 'New York Knights', 'Winnipeg Royals', 'Quebec Northstars') THEN 'Eastern'
        WHEN name IN ('Vancouver Spartans', 'Calgary Kings', 'St. Louis Skyhawks', 'Las Vegas Kingsmen', 'Thunder Bay Thrashers', 'Syracuse Selects') THEN 'Western'
        ELSE NULL
      END
    WHERE division IS NULL OR conference IS NULL;
    `

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSql })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Division and conference columns added successfully" })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
