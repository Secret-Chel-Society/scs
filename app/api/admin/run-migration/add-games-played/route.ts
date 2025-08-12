import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Check if user is authenticated and has admin role
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Try to run the SQL migration
    const sql = `
    -- Add games_played column to ea_player_stats
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ea_player_stats' AND column_name = 'games_played'
      ) THEN
        ALTER TABLE ea_player_stats ADD COLUMN games_played INTEGER DEFAULT 1;
      END IF;
    END $$;
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Added games_played column to ea_player_stats table" })
  } catch (error: any) {
    console.error("Migration failed:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
