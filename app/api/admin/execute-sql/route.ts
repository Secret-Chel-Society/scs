import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check for Admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get SQL from request body
    const body = await request.json()
    const { sql } = body

    if (!sql) {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 })
    }

    // Try different methods to execute SQL
    try {
      // First try exec_sql
      const { error: execError } = await supabase.rpc("exec_sql", { sql })

      if (execError) {
        // If that fails, try run_sql
        const { error: runError } = await supabase.rpc("run_sql", { query: sql })

        if (runError) {
          throw runError
        }
      }

      return NextResponse.json({ success: true, message: "SQL executed successfully" })
    } catch (error: any) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in execute-sql route:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
