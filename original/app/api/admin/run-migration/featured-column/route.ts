import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Run the migration
    const { error } = await supabase.rpc("run_sql", {
      sql: "ALTER TABLE matches ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;",
    })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Featured column added to matches table" })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
