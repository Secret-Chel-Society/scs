import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin status
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userData || !["Admin", "SuperAdmin"].includes(userData.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { adminKey } = await request.json()

    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 403 })
    }

    // Read the migration file
    const fs = require("fs")
    const path = require("path")
    const migrationPath = path.join(process.cwd(), "migrations", "create_forum_tables_fixed.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", { sql_query: statement })
      if (error) {
        console.error("Migration error:", error)
        return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "Forum tables migration completed successfully" })
  } catch (error) {
    console.error("Error running forum tables migration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
