import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Get team awards
    const { data: awards, error: awardsError } = await supabase
      .from("team_awards")
      .select("id, team_id, award_type, season_number, year")
      .order("year", { ascending: false })

    if (awardsError) {
      throw new Error(`Error fetching team awards: ${awardsError.message}`)
    }

    return NextResponse.json({ awards })
  } catch (error: any) {
    console.error("Error fetching team awards:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
