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
    -- Check if the season_id column exists in the matches table
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'matches'
            AND column_name = 'season_id'
        ) THEN
            -- Check the data type of the season_id column
            IF (
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = 'matches'
                AND column_name = 'season_id'
            ) = 'integer' THEN
                -- If it's an integer, alter it to UUID
                ALTER TABLE matches ALTER COLUMN season_id TYPE UUID USING NULL;
                
                -- Add a comment to indicate the change
                COMMENT ON COLUMN matches.season_id IS 'Changed from integer to UUID to support UUID-based seasons';
            END IF;
        END IF;
    END $$;
    `

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (sqlError) {
      console.error("Error executing SQL:", sqlError)
      return NextResponse.json({ error: `Failed to fix season_id column: ${sqlError.message}` }, { status: 500 })
    }

    // Refresh the schema cache
    await supabase.rpc("run_sql", { query: "SELECT 1" })

    return NextResponse.json({
      success: true,
      message: "Season ID column type fixed successfully",
    })
  } catch (error: any) {
    console.error("Error in fix-season-id-type API:", error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
