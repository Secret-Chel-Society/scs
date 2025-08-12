import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// This endpoint returns raw EA match data for debugging purposes
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get("id")

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // First, try to get the EA match ID from the match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, ea_match_id")
      .eq("id", matchId)
      .single()

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 404 })
    }

    if (!match.ea_match_id) {
      return NextResponse.json({ error: "No EA match ID found for this match" }, { status: 404 })
    }

    // Now get the raw EA match data
    const { data, error } = await supabase.from("ea_match_data").select("*").eq("match_id", match.ea_match_id).single()

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          message: "EA match data not found. It might need to be saved first.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching EA match data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
