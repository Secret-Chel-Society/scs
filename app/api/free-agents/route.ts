import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured')
}

// Create admin client to bypass RLS
const adminClient = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Create regular client for session validation
const createRouteHandlerClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function GET(request: NextRequest) {
  try {
    if (!adminClient) {
      return NextResponse.json(
        {
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
          debug: {
            message: "Supabase configuration missing",
          },
        },
        { status: 500 },
      )
    }

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

    // First, get the active season
    const { data: activeSeason, error: seasonError } = await adminClient
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single()

    if (seasonError || !activeSeason) {
      console.error("Error fetching active season:", seasonError)
      return NextResponse.json({
        freeAgents: [],
        debug: {
          message: "No active season found",
          error: seasonError?.message,
        },
      })
    }

    console.log("Active season ID:", activeSeason.id)

    // Get approved season registrations for the active season
    const { data: approvedRegistrations, error: registrationsError } = await adminClient
      .from("season_registrations")
      .select(`
        user_id,
        primary_position,
        secondary_position,
        gamer_tag,
        console
      `)
      .eq("season_id", activeSeason.id)
      .eq("status", "Approved")

    if (registrationsError) {
      console.error("Error fetching approved registrations:", registrationsError)
      throw registrationsError
    }

    console.log(`Found ${approvedRegistrations?.length || 0} approved registrations`)

    if (!approvedRegistrations || approvedRegistrations.length === 0) {
      return NextResponse.json({
        freeAgents: [],
        authenticated: !!authenticatedUser,
        debug: {
          message: "No approved registrations found for active season",
          seasonId: activeSeason.id,
        },
      })
    }

    // Get the user IDs from approved registrations
    const approvedUserIds = approvedRegistrations.map((reg) => reg.user_id)

    // Get players without teams who have approved registrations
    const { data: playersWithoutTeams, error: playersError } = await adminClient
      .from("players")
      .select("id, salary, user_id")
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
          approvedRegistrations: approvedRegistrations.length,
        },
      })
    }

    // Get user data for the free agent players
    const playerUserIds = playersWithoutTeams.map((p) => p.user_id)
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select(`
        id,
        gamer_tag_id,
        primary_position,
        secondary_position,
        console,
        avatar_url
      `)
      .in("id", playerUserIds)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      throw usersError
    }

    console.log(`Found ${users?.length || 0} user records`)

    // Combine the data, prioritizing registration data over user data
    const enhancedFreeAgents = playersWithoutTeams
      .map((player) => {
        const user = users?.find((u) => u.id === player.user_id)
        const registration = approvedRegistrations?.find((reg) => reg.user_id === player.user_id)

        if (!user || !registration) {
          console.log(`Missing data for player ${player.id}: user=${!!user}, registration=${!!registration}`)
          return null
        }

        return {
          ...player,
          users: {
            id: user.id,
            gamer_tag_id: registration.gamer_tag || user.gamer_tag_id || "Unknown Player",
            primary_position: registration.primary_position || user.primary_position || "Unknown",
            secondary_position: registration.secondary_position || user.secondary_position,
            console: registration.console || user.console || "Unknown",
            avatar_url: user.avatar_url,
          },
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.salary || 0) - (a?.salary || 0))

    console.log(`Final enhanced free agents count: ${enhancedFreeAgents.length}`)

    return NextResponse.json({
      freeAgents: enhancedFreeAgents,
      authenticated: !!authenticatedUser,
      debug: {
        message: "Successfully fetched approved free agents",
        seasonId: activeSeason.id,
        approvedRegistrations: approvedRegistrations.length,
        playersWithoutTeams: playersWithoutTeams.length,
        usersCount: users?.length || 0,
        finalCount: enhancedFreeAgents.length,
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
