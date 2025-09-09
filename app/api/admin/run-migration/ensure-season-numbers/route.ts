import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Get the SQL query from the migrations file
    const sql = `
    -- This migration ensures that all season numbers match their names
    -- For example, "Season 1" should have number=1

    -- First, check if the number column exists
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'seasons' AND column_name = 'number'
      ) THEN
        -- Add the number column if it doesn't exist
        ALTER TABLE seasons ADD COLUMN number INTEGER;
      END IF;
    END $$;

    -- Update the number column based on the season name
    UPDATE seasons
    SET number = (
      CASE 
        WHEN name ~ 'Season\\s+(\\d+)' THEN 
          (regexp_matches(name, 'Season\\s+(\\d+)', 'i'))[1]::INTEGER
        ELSE NULL
      END
    )
    WHERE 
      -- Only update if the number is different or null
      number IS NULL OR 
      number != (
        CASE 
          WHEN name ~ 'Season\\s+(\\d+)' THEN 
            (regexp_matches(name, 'Season\\s+(\\d+)', 'i'))[1]::INTEGER
          ELSE NULL
        END
      );

    -- Log the results
    SELECT id, name, number FROM seasons ORDER BY number;
    `

    // Run the SQL query
    const { data, error } = await supabase.rpc("run_sql", { query: sql })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in ensure-season-numbers migration:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
