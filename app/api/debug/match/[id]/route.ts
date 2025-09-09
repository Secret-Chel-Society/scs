import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const matchId = params.id

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!home_team_id(id, name),
        away_team:teams!away_team_id(id, name)
      `)
      .eq("id", matchId)
      .single()

    if (matchError) {
      return NextResponse.json({ error: `Error fetching match: ${matchError.message}` }, { status: 500 })
    }

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Get season details if season_id exists
    let season = null
    if (match.season_id) {
      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("*")
        .eq("id", match.season_id)
        .single()

      if (!seasonError) {
        season = seasonData
      }
    }

    return NextResponse.json({
      match,
      season,
      debug: {
        season_id: match.season_id,
        season_id_type: typeof match.season_id,
        season_name: match.season_name,
        status: match.status,
        status_type: typeof match.status,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
      },
    })
  } catch (error: any) {
    console.error("Error in debug match API:", error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
