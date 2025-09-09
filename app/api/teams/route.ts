import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function GET(request: NextRequest) {
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }


  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("id")

    let query = supabase.from("teams").select("*")

    if (teamId) {
      query = query.eq("id", teamId)
    }

    const { data: teams, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(teams || [])
  } catch (error: any) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
