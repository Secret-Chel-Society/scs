import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Create a Supabase client with admin privileges
    const supabase = createAdminClient()

    // Read the migration SQL
    const migrationSql = `
    -- Function to check if a table exists
    CREATE OR REPLACE FUNCTION table_exists(table_name text)
    RETURNS boolean AS $$
    DECLARE
      exists boolean;
    BEGIN
      SELECT COUNT(*) > 0 INTO exists
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1;
      
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

    return NextResponse.json({ success: true, message: "Table exists function created successfully" })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
