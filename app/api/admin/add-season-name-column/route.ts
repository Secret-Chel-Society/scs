import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST() {
  try {
    // Try to directly execute the ALTER TABLE statement
    const { error: alterError } = await supabase.rpc("exec_sql", {
      query: "ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_name TEXT;",
    })

    if (alterError) {
      console.error("Error using exec_sql:", alterError)

      // Try a different approach - use raw SQL query
      try {
        // This is a workaround to execute raw SQL
        // We'll create a temporary function and execute it
        const { error: createFunctionError } = await supabase.rpc("exec_sql", {
          query: `
          CREATE OR REPLACE FUNCTION temp_add_season_name()
          RETURNS void AS $$
          BEGIN
            ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_name TEXT;
          END;
          $$ LANGUAGE plpgsql;
          `,
        })

        if (createFunctionError) {
          console.error("Error creating temp function:", createFunctionError)

          // Last resort - try direct query
          const { error: directError } = await supabase
            .from("_exec_sql")
            .insert({ sql: "ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_name TEXT;" })

          if (directError) {
            throw new Error(`All SQL execution methods failed: ${directError.message}`)
          }
        } else {
          // Execute the function
          const { error: execError } = await supabase.rpc("temp_add_season_name")
          if (execError) {
            throw new Error(`Failed to execute temp function: ${execError.message}`)
          }
        }
      } catch (fallbackError: any) {
        console.error("Fallback error:", fallbackError)
        throw new Error(`Fallback methods failed: ${fallbackError.message}`)
      }
    }

    // Force refresh the schema cache
    try {
      await supabase.from("matches").select("id").limit(1)
    } catch (refreshError) {
      console.log("Schema refresh attempt completed")
    }

    return NextResponse.json({
      success: true,
      message: "Season name column added successfully",
    })
  } catch (error: any) {
    console.error("Error in add-season-name-column API:", error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
