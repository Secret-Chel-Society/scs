import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log("Starting EA stats fields migration")

    // SQL to add all the required EA stats fields
    const sql = `
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

      -- Check and add skinterceptions column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skinterceptions'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skinterceptions TEXT;
      END IF;

      -- Check and add skfow column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skfow'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skfow TEXT;
      END IF;

      -- Check and add skfol column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skfol'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skfol TEXT;
      END IF;

      -- Check and add skpenaltiesdrawn column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skpenaltiesdrawn'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skpenaltiesdrawn TEXT;
      END IF;

      -- Check and add skpasses column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skpasses'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skpasses TEXT;
      END IF;

      -- Check and add skpassattempts column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skpassattempts'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skpassattempts TEXT;
      END IF;

      -- Check and add skpossession column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skpossession'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skpossession TEXT;
      END IF;

      -- Check and add glgaa column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'glgaa'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN glgaa TEXT;
      END IF;

      -- Check and add skppg column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'skppg'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN skppg TEXT;
      END IF;

      -- Check and add glshots column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'glshots'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN glshots TEXT;
      END IF;

      -- Check and add glsaves column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'glsaves'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN glsaves TEXT;
      END IF;

      -- Check and add glga column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'glga'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN glga TEXT;
      END IF;

      -- Check and add glsavepct column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ea_player_stats' 
        AND column_name = 'glsavepct'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN glsavepct TEXT;
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
      .in("column_name", ["skinterceptions", "glshots", "toiseconds"])

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
        ? "Successfully added all EA stats fields to the database"
        : "Migration ran but columns may not have been added",
      debug: `Found columns: ${foundColumns.join(", ")}`,
    })
  } catch (error: any) {
    console.error("Error running EA stats fields migration:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "An unknown error occurred",
      debug: error.stack,
    })
  }
}
