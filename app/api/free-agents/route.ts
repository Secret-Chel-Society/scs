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
        const { data, error } = await supabase.auth.getUser(token)

        if (!error && data?.user) {
          authenticatedUser = data.user
          console.log("User authenticated:", data.user.id)
        } else {
          console.log("Auth validation failed, continuing as public:", error?.message)
        }
      } catch (authError) {
        console.log("Auth error, continuing as public:", authError)
      }
    } else {
      console.log("No auth header provided, serving public data")
    }

    // --- 1) Determine current season (fallback season 9) ---
    let { data: currentSeason, error: seasonError } = await adminClient
      .from("seasons")
      .select("id, name, season_number, parent_season_id")
      .eq("is_active", true)
      .order("season_number", { ascending: false })
      .maybeSingle()

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

    if (seasonError || !currentSeason?.season_number) {
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

    const seasonNumbersToCheck = [currentSeason.season_number]

    if (currentSeason.parent_season_id) {
      const { data: parentSeason } = await adminClient
        .from("seasons")
        .select("season_number")
        .eq("id", currentSeason.parent_season_id)
        .maybeSingle()

      if (parentSeason?.season_number) {
        seasonNumbersToCheck.push(parentSeason.season_number)
      }
    }

    console.log(
      `Season check: ${currentSeason.name} numbers = ${seasonNumbersToCheck.join(", ")}`,
    )

    // --- 2) Detect Free Agent “team” if you use one (optional) ---
    // If you *don’t* have a Free Agents team row, this stays null and we fall back to team_id IS NULL only.
    const { data: freeAgentTeam } = await adminClient
      .from("teams")
      .select("id, name")
      .ilike("name", "%free%agent%")
      .maybeSingle()

    const freeAgentTeamId = freeAgentTeam?.id || null
    console.log("Free agent team detected:", freeAgentTeam?.name || "none", freeAgentTeamId || "")

    // --- 3) Fetch free agents + ONLY the approved registration for relevant season(s) ---
    // IMPORTANT:
    // - We include players with team_id NULL OR team_id == freeAgentTeamId (if it exists)
    // - We embed season_registrations but then we *normalize* to only the approved/current one.
    let playersQuery = adminClient
      .from("players")
      .select(
        `
        id,
        salary,
        user_id,
        team_id,
        users!inner (
          id,
          gamer_tag_id,
          console,
          avatar_url,
          season_registrations (
            primary_position,
            secondary_position,
            season_number,
            status
          )
        )
      `,
      )

    if (freeAgentTeamId) {
      playersQuery = playersQuery.or(`team_id.is.null,team_id.eq.${freeAgentTeamId}`)
    } else {
      playersQuery = playersQuery.is("team_id", null)
    }

    const { data: rawPlayers, error: playersError } = await playersQuery

    if (playersError) {
      console.error("Error fetching free agents:", playersError)
      throw playersError
    }

    const rawCount = rawPlayers?.length || 0
    console.log("Raw free agent players returned:", rawCount)

    // --- 4) Normalize: keep ONLY Approved registrations for seasonNumbersToCheck,
    // and prefer the current season’s registration first.
    const normalized = (rawPlayers || [])
      .filter((p) => p?.users)
      .map((p: any) => {
        const regs = Array.isArray(p.users?.season_registrations) ? p.users.season_registrations : []

        const approvedRegs = regs.filter(
          (r: any) =>
            r?.status === "Approved" && seasonNumbersToCheck.includes(Number(r?.season_number)),
        )

        // Prefer current season_number first
        approvedRegs.sort((a: any, b: any) => {
          const aScore = a?.season_number === currentSeason.season_number ? 0 : 1
          const bScore = b?.season_number === currentSeason.season_number ? 0 : 1
          return aScore - bScore
        })

        return {
          ...p,
          users: {
            ...p.users,
            // ✅ this makes your frontend safe: users.season_registrations[0]
            season_registrations: approvedRegs,
          },
        }
      })
      // only keep players that actually have an approved reg for the season(s)
      .filter((p: any) => (p.users?.season_registrations?.length || 0) > 0)
      .sort((a: any, b: any) => (b?.salary || 0) - (a?.salary || 0))

    console.log("Final free agents count after normalization:", normalized.length)

    return NextResponse.json({
      freeAgents: normalized,
      authenticated: !!authenticatedUser,
      debug: {
        message: "Successfully fetched free agents",
        season: currentSeason.name,
        seasonNumbersChecked: seasonNumbersToCheck,
        freeAgentTeamDetected: freeAgentTeam?.name || null,
        rawPlayersCount: rawCount,
        finalCount: normalized.length,
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
