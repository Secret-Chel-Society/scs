import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // First, check if exec_sql function exists and create it if needed
    const execSqlFunction = `
      -- Check if the function exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_proc 
          JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
          WHERE proname = 'exec_sql' AND nspname = 'public'
        ) THEN
          -- Create the exec_sql function if it doesn't exist
          CREATE OR REPLACE FUNCTION exec_sql(query text) 
          RETURNS void AS $$
          BEGIN
            EXECUTE query;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;

          -- Grant execute permission to authenticated users
          GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
        END IF;
      END
      $$;
    `

    // Execute the SQL to ensure exec_sql function exists
    const { error: execSqlError } = await supabaseAdmin.rpc("run_sql", {
      sql_query: execSqlFunction,
    })

    if (execSqlError) {
      // If run_sql doesn't exist, try direct SQL execution
      const { error: directExecError } = await supabaseAdmin.from("_exec_sql").select("*").limit(1)

      if (directExecError) {
        console.error("Error creating exec_sql function:", execSqlError)
        return NextResponse.json(
          {
            error: `Failed to create exec_sql function: ${execSqlError.message}. 
                 Please run the exec_sql migration first.`,
          },
          { status: 500 },
        )
      }
    }

    // Read the SQL file for the admin force verify function
    const sqlFilePath = path.join(process.cwd(), "migrations", "create_admin_force_verify_function.sql")
    let sql

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (readError) {
      console.error("Error reading SQL file:", readError)

      // If file can't be read, use inline SQL as fallback
      sql = `
        -- Create a function to force verify a user
        CREATE OR REPLACE FUNCTION admin_force_verify_user(user_id_param UUID, email_param TEXT)
        RETURNS VOID AS $$
        BEGIN
          -- Update the auth.users table directly to set email_confirmed_at
          UPDATE auth.users
          SET 
            email_confirmed_at = NOW(),
            updated_at = NOW(),
            raw_app_meta_data = 
              CASE 
                WHEN raw_app_meta_data IS NULL THEN 
                  jsonb_build_object('email_verified', true)
                ELSE 
                  raw_app_meta_data || jsonb_build_object('email_verified', true)
              END,
            raw_user_meta_data = 
              CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                  jsonb_build_object('email_verified', true)
                ELSE 
                  raw_user_meta_data || jsonb_build_object('email_verified', true)
              END
          WHERE id = user_id_param;
          
          -- Insert a log entry
          INSERT INTO verification_logs (
            user_id, 
            email, 
            action, 
            success, 
            details, 
            created_at
          )
          VALUES (
            user_id_param,
            email_param,
            'admin_force_verify_sql',
            TRUE,
            'Admin forced verification via SQL function',
            NOW()
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }

    // Try different methods to execute the SQL
    // Method 1: Use exec_sql RPC
    const { error: rpcError } = await supabaseAdmin.rpc("exec_sql", { query: sql })

    if (!rpcError) {
      return NextResponse.json({
        success: true,
        message: "Admin force verify function created successfully using exec_sql",
      })
    }

    console.log("RPC exec_sql failed, trying alternative methods:", rpcError)

    // Method 2: Try run_sql function if it exists
    const { error: runSqlError } = await supabaseAdmin.rpc("run_sql", { sql_query: sql })

    if (!runSqlError) {
      return NextResponse.json({
        success: true,
        message: "Admin force verify function created successfully using run_sql",
      })
    }

    console.log("RPC run_sql failed, trying direct SQL execution:", runSqlError)

    // Method 3: Try direct SQL execution via the special _exec_sql table
    const { error: directError } = await supabaseAdmin.from("_exec_sql").insert({ sql })

    if (!directError) {
      return NextResponse.json({
        success: true,
        message: "Admin force verify function created successfully using direct SQL",
      })
    }

    // If all methods failed, return an error
    console.error("All SQL execution methods failed:", { rpcError, runSqlError, directError })
    return NextResponse.json(
      {
        error: "Failed to create function. Please ensure SQL execution functions are available.",
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error in verification-function migration:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
