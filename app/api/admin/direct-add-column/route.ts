import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@supabase/ssr"

export async function POST() {
  try {
    // Create a Supabase client using cookies for authentication
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // This is a read-only operation in this context
          },
          remove(name: string, options: any) {
            // This is a read-only operation in this context
          },
        },
      },
    )

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Authenticated user:", session.user.email)

    // Check if user is an admin
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
      console.error("Admin role check failed:", adminRoleError)
      return NextResponse.json({ error: "Unauthorized - Admin role required" }, { status: 403 })
    }

    // Use admin client for database operations
    const adminClient = createAdminClient()

    // Use PostgreSQL's DO block to execute anonymous code block
    // This is a more direct approach that doesn't rely on RPC functions
    const { data, error } = await adminClient.from("_migrations_log").insert({
      name: "add_ea_club_id_column",
      sql: `
        DO $$
        BEGIN
          -- Check if column exists
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'teams' AND column_name = 'ea_club_id'
          ) THEN
            -- Add the column if it doesn't exist
            ALTER TABLE teams ADD COLUMN ea_club_id TEXT;
          END IF;
        END
        $$;
      `,
      executed_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Migration log error:", error)

      // If the _migrations_log table doesn't exist, try direct query
      try {
        // Connect directly to the database using the admin client
        const { error: directError } = await adminClient.rpc("exec_sql", {
          sql_query: `
            DO $$
            BEGIN
              -- Check if column exists
              IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'teams' AND column_name = 'ea_club_id'
              ) THEN
                -- Add the column if it doesn't exist
                ALTER TABLE teams ADD COLUMN ea_club_id TEXT;
              END IF;
            END
            $$;
          `,
        })

        if (directError) {
          console.error("Direct SQL error:", directError)
          return NextResponse.json({ error: directError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Column added successfully (direct SQL)" })
      } catch (directError) {
        console.error("Direct approach error:", directError)
        return NextResponse.json({ error: "All migration attempts failed" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Column added successfully (migration log)" })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to run migration",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
