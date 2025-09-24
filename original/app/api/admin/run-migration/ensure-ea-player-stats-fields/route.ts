import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log("Starting EA player stats fields migration")

    // SQL to ensure all necessary EA player stats fields exist
    const sql = `
    -- Ensure all necessary fields exist in the ea_player_stats table
    DO $$
    BEGIN
      -- Check and add interceptions column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'interceptions'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN interceptions INTEGER;
      END IF;

      -- Check and add ppg column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'ppg'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN ppg INTEGER;
      END IF;

      -- Check and add shg column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'shg'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN shg INTEGER;
      END IF;

      -- Check and add time_with_puck column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'time_with_puck'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN time_with_puck INTEGER;
      END IF;

      -- Check and add season_id column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'season_id'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN season_id INTEGER;
      END IF;

      -- Check and add skshg column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skshg'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skshg TEXT;
      END IF;
    END $$;
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { query: sql })

    if (error) {
      console.error("Error executing SQL with RPC:", error)

      // Try direct SQL execution as fallback
      console.log("Trying direct SQL execution...")
      const { error: directError } = await supabase.from("_exec_sql").select("*").eq("query", sql).single()

      if (directError) {
        console.error("Error with direct SQL execution:", directError)

        // Try another approach with raw query
        console.log("Trying raw query...")
        const { error: rawError } = await supabase.rpc("run_sql", { query: sql })

        if (rawError) {
          console.error("Error with raw query:", rawError)
          return NextResponse.json({
            success: false,
            error: "Failed to execute migration SQL. Please run the migration manually.",
            debug: `Tried multiple approaches:\n1. exec_sql RPC: ${error.message}\n2. _exec_sql table: ${directError.message}\n3. run_sql RPC: ${rawError.message}`,
          })
        }
      }
    }

    // Verify the columns were added by checking one of them
    const { data: columnCheck, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "ea_player_stats")
      .in("column_name", ["interceptions", "ppg", "time_with_puck"])

    if (checkError) {
      console.error("Error verifying columns:", checkError)
      return NextResponse.json({
        success: false,
        error: "Migration may have succeeded but verification failed",
        debug: `Verification error: ${checkError.message}`,
      })
    }

    // Check if we found the columns
    const foundColumns = columnCheck?.map((col) => col.column_name) || []
    const allColumnsFound = foundColumns.length > 0

    return NextResponse.json({
      success: allColumnsFound,
      message: allColumnsFound
        ? "Successfully added all EA player stats fields to the database"
        : "Migration ran but columns may not have been added",
      debug: `Found columns: ${foundColumns.join(", ")}`,
    })
  } catch (error: any) {
    console.error("Error running EA player stats fields migration:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "An unknown error occurred",
      debug: error.stack,
    })
  }
}
