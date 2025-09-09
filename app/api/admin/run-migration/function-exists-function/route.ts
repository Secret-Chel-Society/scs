import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: Request) {
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }


  try {
    // Read the migration SQL file
    const migrationSql = `
    -- Function to check if another function exists
    CREATE OR REPLACE FUNCTION function_exists(function_name text)
    RETURNS boolean AS $$
    DECLARE
      exists boolean;
    BEGIN
      SELECT COUNT(*) > 0 INTO exists
      FROM pg_proc
      WHERE proname = $1;
      
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

    return NextResponse.json({ success: true, message: "Function exists function created successfully" })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
