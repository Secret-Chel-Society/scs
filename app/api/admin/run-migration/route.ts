import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { name, sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Migration name is required" }, { status: 400 })
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Try different methods to execute the SQL

    // Method 1: Try direct query execution
    try {
      const { error: directError } = await supabaseAdmin.rpc("exec_sql", { query: sql })

      if (!directError) {
        return NextResponse.json({
          success: true,
          message: `Migration ${name} executed successfully using exec_sql`,
        })
      }
    } catch (e) {
      console.log("exec_sql method failed:", e)
    }

    // Method 2: Try run_sql function
    try {
      const { error: runSqlError } = await supabaseAdmin.rpc("run_sql", { sql_query: sql })

      if (!runSqlError) {
        return NextResponse.json({
          success: true,
          message: `Migration ${name} executed successfully using run_sql`,
        })
      }
    } catch (e) {
      console.log("run_sql method failed:", e)
    }

    // Method 3: Try direct SQL execution
    try {
      // Execute the SQL directly
      const { data, error: queryError } = await supabaseAdmin.from("_exec_sql").insert({ sql }).select()

      if (!queryError) {
        return NextResponse.json({
          success: true,
          message: `Migration ${name} executed successfully using direct SQL`,
          data,
        })
      }
    } catch (e) {
      console.log("Direct SQL execution failed:", e)
    }

    // If all methods failed, return an error
    return NextResponse.json(
      {
        error: "Failed to execute migration. All SQL execution methods failed.",
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error in migration execution:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
