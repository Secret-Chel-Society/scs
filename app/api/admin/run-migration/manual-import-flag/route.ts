import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Authentication error:", userError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if the user is an admin
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin")

    if (rolesError) {
      console.error("Error checking admin status:", rolesError)
      return NextResponse.json({ error: "Failed to verify admin status" }, { status: 500 })
    }

    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Run the migration SQL
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_string: `
        -- Add is_manual_import column to matches table if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'matches' 
            AND column_name = 'is_manual_import'
          ) THEN
            ALTER TABLE matches ADD COLUMN is_manual_import BOOLEAN DEFAULT FALSE;
          END IF;
        END $$;
      `,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: "Migration completed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
