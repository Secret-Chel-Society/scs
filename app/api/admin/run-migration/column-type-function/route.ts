import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Check if the user is an admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user has admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("role", "Admin")

    if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
      return NextResponse.json({ error: "Unauthorized - Admin role required" }, { status: 403 })
    }

    // Read the SQL file
    const sql = `
    -- Function to get column type
    CREATE OR REPLACE FUNCTION get_column_type(table_name text, column_name text)
    RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE
        column_type text;
    BEGIN
        SELECT data_type INTO column_type
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_name = $2;
        
        RETURN column_type;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
    $$;
    `

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (sqlError) {
      console.error("Error executing SQL:", sqlError)
      return NextResponse.json({ error: `Failed to create function: ${sqlError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Column type function created successfully",
    })
  } catch (error: any) {
    console.error("Error in column-type-function API:", error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
