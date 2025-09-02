import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (userRolesError || !userRoles || userRoles.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Read the SQL migration file
    const sql = `
    -- Create a function to check if a column exists in a table
    CREATE OR REPLACE FUNCTION public.column_exists(table_name text, column_name text)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $$
    DECLARE
      column_exists boolean;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      ) INTO column_exists;
      
      RETURN column_exists;
    END;
    $$;
    `

    // Execute the SQL migration
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        { success: false, error: migrationError.message, details: "Failed to run migration" },
        { status: 500 },
      )
    }

    // Test the function
    const { data: testResult, error: testError } = await supabase.rpc("column_exists", {
      table_name: "seasons",
      column_name: "name",
    })

    if (testError) {
      console.error("Test error:", testError)
      return NextResponse.json(
        { success: false, error: testError.message, details: "Function created but test failed" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Function created successfully",
      testResult,
    })
  } catch (error) {
    console.error("Error in migration route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
