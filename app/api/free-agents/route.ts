import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey)
}

const adminClient = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Create regular client for session validation
const createRouteHandlerClient = () => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables for client creation")
  }
  return createClient(supabaseUrl, anonKey)
}

export async function GET(request: NextRequest) {
  try {
    console.log("Free agents API called")

    // Get query parameters to determine if we should filter by approval status
    const { searchParams } = new URL(request.url)
    const approvedOnly = searchParams.get('approved_only') === 'true'
    
    console.log("Approved only filter:", approvedOnly)

    // Check if admin client is available
    if (!adminClient) {
      console.error("Admin client not available - missing environment variables")
      return NextResponse.json(
        {
          freeAgents: [],
          error: "Server configuration error - missing environment variables",
          debug: {
            message: "Admin client not available",
            hasSupabaseUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
          },
        },
        { status: 500 }
      )
    }

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

    // Get season registrations for the active season (for enhanced data)
    // Filter by approval status if requested
    let registrationsQuery = adminClient
      .from("season_registrations")
      .select(`
        user_id,
        primary_position,
        secondary_position,
        gamer_tag,
        console,
        status
      `)
      .eq("season_id", activeSeason.id)
    
    if (approvedOnly) {
      registrationsQuery = registrationsQuery.eq("status", "Approved")
    }
    
    const { data: allRegistrations, error: registrationsError } = await registrationsQuery

    if (registrationsError) {
      console.error("Error fetching season registrations:", registrationsError)
      throw registrationsError
    }

    console.log(`Found ${allRegistrations?.length || 0} season registrations${approvedOnly ? ' (approved only)' : ''}`)

    if (!allRegistrations || allRegistrations.length === 0) {
      return NextResponse.json({
        freeAgents: [],
        authenticated: !!authenticatedUser,
        debug: {
          message: approvedOnly ? "No approved registrations found for active season" : "No season registrations found for active season",
          seasonId: activeSeason.id,
          approvedOnly,
        },
      })
    }

    // Get the user IDs from all registrations
    const registeredUserIds = allRegistrations.map((reg) => reg.user_id)

    // Get players without teams who have season registrations
    const { data: playersWithoutTeams, error: playersError } = await adminClient
      .from("players")
      .select("id, salary, user_id")
      .is("team_id", null)
      .in("user_id", registeredUserIds)

    if (playersError) {
      console.error("Error fetching players without teams:", playersError)
      throw playersError
    }

    console.log(`Found ${playersWithoutTeams?.length || 0} free agent players with season registrations`)

    if (!playersWithoutTeams || playersWithoutTeams.length === 0) {
      return NextResponse.json({
        freeAgents: [],
        authenticated: !!authenticatedUser,
        debug: {
          message: "No free agent players found with season registrations",
          totalRegistrations: allRegistrations.length,
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
        const registration = allRegistrations?.find((reg) => reg.user_id === player.user_id)

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
          registration_status: registration.status, // Include registration status
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.salary || 0) - (a?.salary || 0))

    console.log(`Final enhanced free agents count: ${enhancedFreeAgents.length}`)
    
    // Debug: Count positions to see what we have
    const positionCounts = enhancedFreeAgents.reduce((acc, player) => {
      const position = player.users?.primary_position?.toLowerCase() || 'unknown'
      acc[position] = (acc[position] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log("Position counts:", positionCounts)
    
    // Debug: Count goalies specifically
    const goalies = enhancedFreeAgents.filter(player => 
      player.users?.primary_position?.toLowerCase().includes('goalie') || 
      player.users?.primary_position?.toLowerCase().includes('goalkeeper') ||
      player.users?.primary_position?.toLowerCase() === 'g'
    )
    console.log(`Goalies found: ${goalies.length}`)

    return NextResponse.json({
      freeAgents: enhancedFreeAgents,
      authenticated: !!authenticatedUser,
      debug: {
        message: approvedOnly ? "Successfully fetched approved free agents" : "Successfully fetched free agents with season registrations",
        seasonId: activeSeason.id,
        totalRegistrations: allRegistrations.length,
        playersWithoutTeams: playersWithoutTeams.length,
        usersCount: users?.length || 0,
        finalCount: enhancedFreeAgents.length,
        approvedOnly,
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
