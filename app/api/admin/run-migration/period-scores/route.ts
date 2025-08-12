import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (userError) {
      return NextResponse.json({ error: "Failed to verify user role" }, { status: 500 })
    }

    const isAdmin = userData?.some((role) => role.role === "admin") || false

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can run migrations" }, { status: 403 })
    }

    // SQL to add the period_scores column
    const sql = `
      ALTER TABLE matches 
      ADD COLUMN IF NOT EXISTS period_scores JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS has_overtime BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS has_shootout BOOLEAN DEFAULT FALSE;
    `

    // Try multiple approaches to run the SQL
    let method = ""

    // Approach 1: Use direct SQL execution via PostgreSQL's DO block
    try {
      const doBlockSql = `
        DO $$
        BEGIN
          ALTER TABLE matches 
          ADD COLUMN IF NOT EXISTS period_scores JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS has_overtime BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS has_shootout BOOLEAN DEFAULT FALSE;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error adding columns: %', SQLERRM;
        END $$;
      `

      const { error: doError } = await supabase.rpc("run_sql", { query: doBlockSql })

      if (!doError) {
        method = "do_block"

        // Verify the column was added
        const { data, error } = await supabase.rpc("run_sql", {
          query: `
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'matches' 
              AND column_name = 'period_scores'
            );
          `,
        })

        if (!error && data && data[0] && data[0].exists) {
          return NextResponse.json({ success: true, method })
        }
      }
    } catch (e) {
      console.log("DO block execution failed, trying next approach")
    }

    // Approach 2: Try using a temporary function
    try {
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION temp_add_period_scores()
        RETURNS void AS $$
        BEGIN
          ALTER TABLE matches 
          ADD COLUMN IF NOT EXISTS period_scores JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS has_overtime BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS has_shootout BOOLEAN DEFAULT FALSE;
        END;
        $$ LANGUAGE plpgsql;
        
        SELECT temp_add_period_scores();
        
        DROP FUNCTION IF EXISTS temp_add_period_scores();
      `

      const { error: functionError } = await supabase.rpc("run_sql", { query: createFunctionSql })

      if (!functionError) {
        method = "temp_function"
        return NextResponse.json({ success: true, method })
      }
    } catch (e) {
      console.log("Temporary function approach failed, trying next approach")
    }

    // Approach 3: Try direct SQL execution
    try {
      const { error: directError } = await supabase.rpc("run_sql", { query: sql })

      if (!directError) {
        method = "direct_sql"
        return NextResponse.json({ success: true, method })
      }
    } catch (e) {
      console.log("Direct SQL execution failed, trying next approach")
    }

    // Approach 4: Try using the service role client for more permissions
    try {
      // This requires the SUPABASE_SERVICE_ROLE_KEY environment variable
      const { createClient } = await import("@supabase/supabase-js")

      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        const { error: adminError } = await adminClient.rpc("run_sql", { query: sql })

        if (!adminError) {
          method = "service_role"
          return NextResponse.json({ success: true, method })
        }
      }
    } catch (e) {
      console.log("Service role approach failed")
    }

    // If all approaches failed, return an error
    return NextResponse.json({ error: "All migration approaches failed" }, { status: 500 })
  } catch (error: any) {
    console.error("Error running period scores migration:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
