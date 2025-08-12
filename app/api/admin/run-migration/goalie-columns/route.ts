import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // Check if user is authenticated and is an admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      return NextResponse.json({ error: "Failed to verify user role" }, { status: 500 })
    }

    const isAdmin = userRoles?.some((role) => role.role.toLowerCase() === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Run the migration SQL
    const migrationSql = `
    -- Check if the table exists first
    DO $$
    BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ea_player_stats') THEN
            -- Check if the glga column exists
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glga') THEN
                ALTER TABLE ea_player_stats ADD COLUMN glga TEXT;
            END IF;
            
            -- Check if the glsaves column exists
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glsaves') THEN
                ALTER TABLE ea_player_stats ADD COLUMN glsaves TEXT;
            END IF;
            
            -- Check if the glsavepct column exists
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glsavepct') THEN
                ALTER TABLE ea_player_stats ADD COLUMN glsavepct TEXT;
            END IF;
            
            -- Check if the glshots column exists
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glshots') THEN
                ALTER TABLE ea_player_stats ADD COLUMN glshots TEXT;
            END IF;
            
            -- Check if the glgaa column exists
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glgaa') THEN
                ALTER TABLE ea_player_stats ADD COLUMN glgaa TEXT;
            END IF;
        END IF;
    END $$;
    `

    const { error: migrationError } = await supabase.rpc("exec_sql", { sql_query: migrationSql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: "Migration completed successfully" })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}
