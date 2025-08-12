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
      return NextResponse.json({ error: "Failed to verify user role" }, { status: 500 })
    }

    const isAdmin = userRoles?.some(
      (role) => role.role?.toLowerCase() === "admin" || role.role?.toLowerCase() === "superadmin",
    )

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Read the migration SQL file
    const migrationSql = `
    -- Check if the glga column exists, and add it if it doesn't
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'ea_player_stats'
            AND column_name = 'glga'
        ) THEN
            ALTER TABLE ea_player_stats ADD COLUMN glga TEXT;
        END IF;
    END
    $$;

    -- Check if the games_played column exists, and add it if it doesn't
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'ea_player_stats'
            AND column_name = 'games_played'
        ) THEN
            ALTER TABLE ea_player_stats ADD COLUMN games_played INTEGER DEFAULT 1;
        END IF;
    END
    $$;

    -- Add any other missing columns that might be needed
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'ea_player_stats'
            AND column_name = 'category'
        ) THEN
            ALTER TABLE ea_player_stats ADD COLUMN category TEXT;
        END IF;
    END
    $$;
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql: migrationSql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
