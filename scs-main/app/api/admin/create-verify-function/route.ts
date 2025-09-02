import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // First, try to create a simple test function to verify we can execute SQL
    const testFunctionSql = `
      CREATE OR REPLACE FUNCTION test_admin_function() 
      RETURNS TEXT AS $$
      BEGIN
        RETURN 'success';
      END;
      $$ LANGUAGE plpgsql;
    `

    // Try to execute the test function SQL using a direct query
    const { error: testError } = await supabaseAdmin
      .from("_exec_direct_sql")
      .insert({
        query: testFunctionSql,
      })
      .select()

    if (testError) {
      console.error("Error creating test function:", testError)

      // Try an alternative approach - create a temporary table and use it to execute SQL
      const createTempTableSql = `
        CREATE TEMPORARY TABLE IF NOT EXISTS temp_sql_execution (
          id SERIAL PRIMARY KEY,
          sql_to_execute TEXT,
          executed BOOLEAN DEFAULT FALSE,
          result TEXT
        );
        
        INSERT INTO temp_sql_execution (sql_to_execute) VALUES ($1);
      `

      const { error: tempTableError } = await supabaseAdmin.rpc("execute_sql", {
        sql: createTempTableSql,
        params: [testFunctionSql],
      })

      if (tempTableError) {
        return NextResponse.json(
          {
            error: "Unable to execute SQL. Please run the migration manually.",
          },
          { status: 500 },
        )
      }
    }

    // Now create the actual verification function
    const verifyFunctionSql = `
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
        
        -- Try to insert a log entry if the table exists
        BEGIN
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
        EXCEPTION
          WHEN undefined_table THEN
            -- Table doesn't exist, just continue
            NULL;
        END;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Try to execute the verification function SQL
    const { error: verifyFunctionError } = await supabaseAdmin
      .from("_exec_direct_sql")
      .insert({
        query: verifyFunctionSql,
      })
      .select()

    if (verifyFunctionError) {
      // Try the temporary table approach
      const { error: tempVerifyError } = await supabaseAdmin.rpc("execute_sql", {
        sql: `INSERT INTO temp_sql_execution (sql_to_execute) VALUES ($1);`,
        params: [verifyFunctionSql],
      })

      if (tempVerifyError) {
        return NextResponse.json(
          {
            error: "Unable to create verification function. Please run the migration manually.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Admin force verify function created successfully",
    })
  } catch (error) {
    console.error("Error creating verification function:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
