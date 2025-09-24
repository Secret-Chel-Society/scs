import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST() {
  try {
    // SQL to fix season numbers
    const sql = `
      -- First, check if the number column exists in the seasons table
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
      SET number = CASE 
        WHEN name LIKE 'Season 1%' THEN 1
        WHEN name LIKE 'Season 2%' THEN 2
        WHEN name LIKE 'Season 3%' THEN 3
        WHEN name LIKE 'Season 4%' THEN 4
        WHEN name LIKE 'Season 5%' THEN 5
        ELSE NULL
      END
      WHERE number IS NULL OR number <> CASE 
        WHEN name LIKE 'Season 1%' THEN 1
        WHEN name LIKE 'Season 2%' THEN 2
        WHEN name LIKE 'Season 3%' THEN 3
        WHEN name LIKE 'Season 4%' THEN 4
        WHEN name LIKE 'Season 5%' THEN 5
        ELSE NULL
      END;

      -- Return the updated seasons
      SELECT id, name, number, created_at FROM seasons ORDER BY number;
    `

    // Run the SQL
    const { data, error } = await supabase.rpc("run_sql", { query: sql })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in fix-season-numbers migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
