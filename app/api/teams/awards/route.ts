import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured')
}

// Create a Supabase client
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        {
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }

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
