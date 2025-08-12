import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 })
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Execute the SQL directly using PostgreSQL's execute command
    const { data, error } = await supabaseAdmin.from("_exec_sql").insert({ sql }).select()

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ error: `Failed to execute SQL: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "SQL executed successfully",
      data,
    })
  } catch (error) {
    console.error("Error in direct SQL execution:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
