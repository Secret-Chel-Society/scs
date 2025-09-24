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
    -- Add season_name column to matches table if it doesn't exist
    ALTER TABLE matches 
    ADD COLUMN IF NOT EXISTS season_name TEXT;

    -- Copy data from seasons table if possible
    UPDATE matches m
    SET season_name = s.name
    FROM seasons s
    WHERE m.season_id = s.id
    AND m.season_name IS NULL;
    `

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (sqlError) {
      console.error("Error executing SQL:", sqlError)
      return NextResponse.json({ error: `Failed to add season_name column: ${sqlError.message}` }, { status: 500 })
    }

    // Force refresh the schema cache by making a direct query to the matches table
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
    console.error("Error in add-season-name API:", error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
