import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log("Debug seasons API called")

    // Check all seasons
    const { data: allSeasons, error: allSeasonsError } = await adminClient
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: true })

    if (allSeasonsError) {
      console.error("Error fetching all seasons:", allSeasonsError)
      return NextResponse.json({
        error: allSeasonsError.message,
        debug: "Failed to fetch all seasons"
      }, { status: 500 })
    }

    // Check active seasons
    const { data: activeSeasons, error: activeSeasonsError } = await adminClient
      .from("seasons")
      .select("*")
      .eq("is_active", true)

    if (activeSeasonsError) {
      console.error("Error fetching active seasons:", activeSeasonsError)
      return NextResponse.json({
        error: activeSeasonsError.message,
        debug: "Failed to fetch active seasons"
      }, { status: 500 })
    }

    // Check season registrations
    const { data: registrations, error: registrationsError } = await adminClient
      .from("season_registrations")
      .select("*")
      .limit(10)

    if (registrationsError) {
      console.error("Error fetching registrations:", registrationsError)
      return NextResponse.json({
        error: registrationsError.message,
        debug: "Failed to fetch registrations"
      }, { status: 500 })
    }

    // Check players
    const { data: players, error: playersError } = await adminClient
      .from("players")
      .select("*")
      .limit(10)

    if (playersError) {
      console.error("Error fetching players:", playersError)
      return NextResponse.json({
        error: playersError.message,
        debug: "Failed to fetch players"
      }, { status: 500 })
    }

    return NextResponse.json({
      allSeasons: allSeasons || [],
      activeSeasons: activeSeasons || [],
      registrations: registrations || [],
      players: players || [],
      debug: {
        allSeasonsCount: allSeasons?.length || 0,
        activeSeasonsCount: activeSeasons?.length || 0,
        registrationsCount: registrations?.length || 0,
        playersCount: players?.length || 0
      }
    })

  } catch (error: any) {
    console.error("Error in debug seasons API:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to debug seasons",
        debug: "API error occurred"
      },
      { status: 500 }
    )
  }
}
