import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Read and execute the migration SQL
    const migrationPath = join(process.cwd(), "migrations", "create_team_chat_system.sql")
    const migrationSQL = readFileSync(migrationPath, "utf8")

    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        {
          error: "Migration failed",
          details: migrationError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Team chat system migration completed successfully!",
    })
  } catch (error) {
    console.error("Error running team chat migration:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
