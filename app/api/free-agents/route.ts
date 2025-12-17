import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

// Create regular client for session validation
const createRouteHandlerClient = () => {
  return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(request: NextRequest) {
  try {
    console.log("Free agents API called")

    // Optional authentication - don't require it for public viewing
    let authenticatedUser = null
    const authHeader = request.headers.get("authorization")

    if (authHeader) {
      try {
        const supabase = createRouteHandlerClient()
        const token = authHeader.replace("Bearer ", "")
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token)

        if (!authError && user) {
          authenticatedUser = user
          console.log("User authenticated:", user.id)
        } else {
          console.log("Auth validation failed, but continuing as public:", authError?.message)
        }
      } catch (authError) {
        console.log("Auth error, but continuing as public:", authError)
      }
    } else {
      console.log("No auth header provided, serving public data")
    }

    console.log("Fetching free agents using admin client...")

    // First try to get the current active season
    let { data: currentSeason, error: seasonError } = await adminClient
      .from("seasons")
      .select("id, name, season_number, parent_season_id")
      .eq("is_active", true)
      .order("season_number", { ascending: false })
      .maybeSingle()

    // If no active season found, fall back to season 9 (current season)
    if (!currentSeason) {
      console.log("No active season found, falling back to season 9")
      const { data: fallbackSeason, error: fallbackError } = await adminClient
        .from("seasons")
        .select("id, name, season_number, parent_season_id")
        .eq("season_number", 9)
        .maybeSingle()

      currentSeason = fallbackSeason
      seasonError = fallbackError
    }

    if (seasonError || !currentSeason) {
      console.error("Error fetching current season:", seasonError)
      return NextResponse.json({
        freeAgents: [],
        authenticated: !!authenticatedUser,
        debug: {
          message: "Current season not found",
          error: seasonError?.message,
        },
      })
    }

    console.log(
      `Current Season: ${currentSeason.name} (ID: ${currentSeason.id}, Number: ${currentSeason.season_number})`,
    )

    const seasonNumbersToCheck = [currentSeason.season_number]

    // If this season has a parent, also include the parent season's number
    if (currentSeason.parent_season_id) {
      console.log(`Season has parent_season_id: ${currentSeason.parent_season_id}`)

      const { data: parentSeason, error: parentSeasonError } = await adminClient
        .from("seasons")
        .select("season_number")
        .eq("id", currentSeason.parent_season_id)
        .single()

      if (!parentSeasonError && parentSeason) {
        seasonNumbersToCheck.push(parentSeason.season_number)
        console.log(`Including parent season number: ${parentSeason.season_number}`)
      } else {
        console.log("Could not fetch parent season:", parentSeasonError?.message)
      }
    }

    console.log(`Checking for registrations in season numbers: ${seasonNumbersToCheck.join(", ")}`)

    const { data: approvedRegistrations, error: registrationError } = await adminClient
      .from("season_registrations")
      .select("user_id")
      .in("season_number", seasonNumbersToCheck)
      .eq("status", "Approved")

    if (registrationError) {
      console.error("Error fetching approved registrations:", registrationError)
      throw registrationError
    }

    console.log(`Found ${approvedRegistrations?.length || 0} approved registrations`)

    if (!approvedRegistrations || approvedRegistrations.length === 0) {
      return NextResponse.json({
        freeAgents: [],
        authenticated: !!authenticatedUser,
        debug: {
          message: `No approved registrations found for ${currentSeason.name} or parent season`,
          season: currentSeason.name,
          seasonNumbersChecked: seasonNumbersToCheck,
        },
      })
    }

    const approvedUserIds = approvedRegistrations.map((reg) => reg.user_id)

    const { data: playersWithoutTeams, error: playersError } = await adminClient
      .from("players")
      .select(`
        id,
        salary,
        user_id,
        users!inner (
          id,
          gamer_tag_id,
          console,
          avatar_url,
          season_registrations!left (
            primary_position,
            secondary_position,
            season_number
          )
        )
      `)
      .is("team_id", null)
      .in("user_id", approvedUserIds)

    if (playersError) {
      console.error("Error fetching players without teams:", playersError)
      throw playersError
    }

    console.log(`Found ${playersWithoutTeams?.length || 0} free agent players with approved registrations`)

    if (!playersWithoutTeams || playersWithoutTeams.length === 0) {
      return NextResponse.json({
        freeAgents: [],
        authenticated: !!authenticatedUser,
        debug: {
          message: "No free agent players found with approved registrations",
          season: currentSeason.name,
          approvedRegistrationsCount: approvedRegistrations.length,
        },
      })
    }

    // Sort by salary descending
    const sortedFreeAgents = playersWithoutTeams
      .filter((player) => player.users) // Only include players with valid user data
      .sort((a, b) => (b?.salary || 0) - (a?.salary || 0))

    console.log(`Final free agents count: ${sortedFreeAgents.length}`)

    return NextResponse.json({
      freeAgents: sortedFreeAgents,
      authenticated: !!authenticatedUser,
      debug: {
        message: "Successfully fetched free agents",
        season: currentSeason.name,
        approvedRegistrationsCount: approvedRegistrations.length,
        finalCount: sortedFreeAgents.length,
      },
    })
  } catch (error: any) {
    console.error("Error in free agents API:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch free agents",
        debug: {
          message: "API error occurred",
          error: error.message,
        },
      },
      { status: 500 },
    )
  }
}
