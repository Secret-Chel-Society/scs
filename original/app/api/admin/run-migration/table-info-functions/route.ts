import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRole } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userRole || userRole.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration SQL
    const { error } = await supabase.rpc("run_sql", {
      query: `
        -- Function to get all tables in the database
        CREATE OR REPLACE FUNCTION get_table_info()
        RETURNS TABLE (
          table_name text
        ) 
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT tables.table_name::text
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        END;
        $$;

        -- Function to get column information for a specific table
        CREATE OR REPLACE FUNCTION get_column_info(table_name text)
        RETURNS TABLE (
          column_name text,
          data_type text,
          is_nullable text
        ) 
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            columns.column_name::text,
            columns.data_type::text,
            columns.is_nullable::text
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND columns.table_name = get_column_info.table_name
          ORDER BY ordinal_position;
        END;
        $$;
      `,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
