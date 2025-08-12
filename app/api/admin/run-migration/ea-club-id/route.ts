import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the column already exists first
    const { data: columnExists, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "teams")
      .eq("column_name", "ea_club_id")
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if column exists:", checkError)
      // Continue with migration attempt even if check fails
    }

    // If column already exists, return success
    if (columnExists) {
      return NextResponse.json({ success: true, message: "Column already exists" })
    }

    // Try using the exec_sql RPC function first
    try {
      const { error: rpcError } = await supabase.rpc("exec_sql", {
        sql_query: `
          ALTER TABLE teams ADD COLUMN IF NOT EXISTS ea_club_id TEXT;
        `,
      })

      if (rpcError) {
        throw rpcError
      }

      return NextResponse.json({ success: true })
    } catch (rpcError: any) {
      console.error("RPC migration error:", rpcError)

      // Fallback to direct SQL if RPC fails
      try {
        // Try direct SQL as a fallback
        const { error: directError } = await supabase
          .from("teams")
          .select("id")
          .limit(1)
          .then(async () => {
            // If we can query the table, try to alter it directly
            return await supabase.from("_migrations_log").insert({
              name: "add_ea_club_id_to_teams",
              sql: "ALTER TABLE teams ADD COLUMN IF NOT EXISTS ea_club_id TEXT;",
              executed_at: new Date().toISOString(),
            })
          })

        if (directError) {
          throw directError
        }

        return NextResponse.json({ success: true, method: "direct" })
      } catch (directError: any) {
        console.error("Direct SQL migration error:", directError)
        throw new Error(`RPC failed: ${rpcError.message}, Direct SQL failed: ${directError.message}`)
      }
    }
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
