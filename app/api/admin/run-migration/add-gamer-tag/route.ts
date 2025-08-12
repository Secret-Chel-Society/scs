import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check if the user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration
    const { data, error } = await supabase.rpc("run_sql", {
      sql_query: `
        -- Check if gamer_tag column exists in users table
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'gamer_tag'
          ) THEN
            -- Add gamer_tag column to users table
            ALTER TABLE users ADD COLUMN gamer_tag TEXT;
          END IF;
        END $$;
      `,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
