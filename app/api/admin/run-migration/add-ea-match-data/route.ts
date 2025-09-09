import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // SQL to add the ea_match_data column if it doesn't exist
    const sql = `
      -- Add ea_match_data column to matches table if it doesn't exist
      DO $$
      BEGIN
          -- Check if the column already exists
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'matches' 
              AND column_name = 'ea_match_data'
          ) THEN
              -- Add the column if it doesn't exist
              ALTER TABLE matches ADD COLUMN ea_match_data JSONB;
              
              -- Add a comment to the column
              COMMENT ON COLUMN matches.ea_match_data IS 'Raw data from EA Sports NHL API for this match';
          END IF;
      END $$;
    `

    // Execute the SQL
    const { error } = await supabaseAdmin.rpc("exec_sql", { query: sql })

    if (error) {
      console.error("Error executing SQL:", error)

      // Try an alternative approach
      try {
        const { error: directError } = await supabaseAdmin.from("matches").alter("ea_match_data", { type: "jsonb" })

        if (directError) {
          return NextResponse.json({ error: directError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Migration completed successfully using direct alter",
        })
      } catch (e) {
        console.error("Alternative approach failed:", e)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Verify the column was added
    const { data: columnExists, error: verifyError } = await supabaseAdmin.rpc("exec_sql", {
      query: `
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'matches' 
          AND column_name = 'ea_match_data'
        );
      `,
    })

    if (verifyError) {
      console.error("Error verifying column:", verifyError)
      return NextResponse.json({
        success: true,
        message: "Migration executed, but verification failed",
        verifyError: verifyError.message,
      })
    }

    const exists = columnExists && columnExists[0] && columnExists[0].exists === true

    return NextResponse.json({
      success: true,
      message: exists
        ? "Migration completed successfully, column exists"
        : "Migration executed, but column does not exist",
      columnExists: exists,
    })
  } catch (error: any) {
    console.error("Error in migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
