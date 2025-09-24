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

    // Check if the column already exists
    try {
      const { data, error } = await adminClient.from("teams").select("ea_club_id").limit(1)

      if (!error) {
        // Column already exists
        return NextResponse.json({ success: true, message: "Column already exists" })
      }
    } catch (error) {
      // Continue with migration attempt
      console.log("Column check error (expected):", error)
    }

    // Use direct SQL to add the column
    const { error } = await adminClient.rpc("exec_sql", {
      sql_query: "ALTER TABLE teams ADD COLUMN IF NOT EXISTS ea_club_id TEXT;",
    })

    if (error) {
      console.error("SQL execution error:", error)

      // Try a simpler approach
      try {
        const { error: alterError } = await adminClient.rpc("exec_sql", {
          sql_query: "ALTER TABLE teams ADD COLUMN ea_club_id TEXT;",
        })

        if (alterError) {
          console.error("Alter table error:", alterError)
          return NextResponse.json({ error: alterError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Column added successfully (fallback method)" })
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
        return NextResponse.json({ error: "All migration attempts failed" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Column added successfully" })
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
