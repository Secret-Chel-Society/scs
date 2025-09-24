import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (userRolesError) {
      return NextResponse.json({ error: "Failed to verify admin status" }, { status: 500 })
    }

    const isAdmin = userRoles.some((role) => role.role === "admin" || role.role === "superadmin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Read the migration SQL
    const migrationSQL = `
    -- Check if the table exists first
    DO $$
    BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ea_player_stats') THEN
            -- Check if the category column exists
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'category') THEN
                ALTER TABLE ea_player_stats ADD COLUMN category TEXT;
            END IF;
        END IF;
    END $$;
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        {
          success: false,
          error: `Migration failed: ${migrationError.message}`,
        },
        { status: 500 },
      )
    }

    // Verify the column was added
    const { data: columnInfo, error: columnCheckError } = await supabase.rpc("column_exists", {
      p_table: "ea_player_stats",
      p_column: "category",
    })

    if (columnCheckError) {
      console.error("Column check error:", columnCheckError)
      return NextResponse.json(
        {
          success: true,
          message: "Migration executed, but could not verify column creation.",
          warning: columnCheckError.message,
        },
        { status: 200 },
      )
    }

    const columnExists = columnInfo === true

    return NextResponse.json({
      success: true,
      message: columnExists
        ? "Category column added successfully to ea_player_stats table."
        : "Migration executed, but column may not have been created.",
      columnExists,
    })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      {
        success: false,
        error: `An error occurred: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
