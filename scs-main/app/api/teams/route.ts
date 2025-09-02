import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
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
