import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to perform this action" },
        { status: 401 },
      )
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase.from("user_roles").select("role").eq("user_id", user.id)

    if (userError || !userData || !userData.some((role) => role.role === "admin")) {
      return NextResponse.json(
        { error: "Forbidden", message: "You must be an admin to perform this action" },
        { status: 403 },
      )
    }

    // SQL for the column_exists function
    const sql = `
      -- Function to check if a column exists in a table
      CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
      RETURNS boolean AS $$
      DECLARE
        exists_bool boolean;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        ) INTO exists_bool;
        
        RETURN exists_bool;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Try to run the migration using run_sql function
    try {
      const { data, error } = await supabase.rpc("run_sql", {
        sql_query: sql,
      })

      if (error) {
        console.error("Error running migration with run_sql:", error)
        throw error
      }

      // Verify the function was created
      const { data: verifyData, error: verifyError } = await supabase.rpc("function_exists", {
        function_name: "column_exists",
      })

      if (verifyError || !verifyData) {
        return NextResponse.json(
          { error: "Verification failed", message: "Failed to verify function creation" },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Column exists function has been created",
      })
    } catch (runSqlError) {
      console.error("run_sql failed, trying exec_sql:", runSqlError)

      // Fallback to exec_sql if run_sql fails
      try {
        const { data: execData, error: execError } = await supabase.rpc("exec_sql", {
          sql_query: sql,
        })

        if (execError) {
          console.error("Error running migration with exec_sql:", execError)
          throw execError
        }

        return NextResponse.json({
          success: true,
          message: "Column exists function has been created",
        })
      } catch (execSqlError) {
        console.error("Both run_sql and exec_sql failed:", execSqlError)
        throw new Error("Failed to run migration with both run_sql and exec_sql")
      }
    }
  } catch (error: any) {
    console.error("Error in column exists migration:", error)
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 })
  }
}
