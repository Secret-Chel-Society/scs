import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Read the migration SQL file
    const migrationSql = `
    -- Function to check if a column exists in a table
    CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
    RETURNS boolean AS $$
    DECLARE
      exists boolean;
    BEGIN
      SELECT COUNT(*) > 0 INTO exists
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name = $2;
      
      RETURN exists;
    END;
    $$ LANGUAGE plpgsql;
    `

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSql })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Column exists function created successfully" })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
