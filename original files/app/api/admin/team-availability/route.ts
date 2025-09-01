import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const matchId = searchParams.get("matchId")
    const weekStart = searchParams.get("weekStart")
    const weekEnd = searchParams.get("weekEnd")
    const seasonId = searchParams.get("seasonId")

    // If this is a single team query (existing functionality)
    if (teamId && !weekStart && !weekEnd) {
      // Get team players
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select(`
          id,
          user_id,
          role,
          users!players_user_id_fkey(id, gamer_tag_id)
        `)
        .eq("team_id", teamId)

      if (playersError) {
        console.error("Error fetching players:", playersError)
        return NextResponse.json({ error: "Failed to fetch team players" }, { status: 500 })
      }

      let availabilityData = []

      // If matchId is provided, get availability for that specific match
      if (matchId) {
        const { data: availability, error: availabilityError } = await supabase
          .from("game_availability")
          .select("*")
          .eq("team_id", teamId)
          .eq("match_id", matchId)

        if (availabilityError && availabilityError.code !== "42P01") {
          console.error("Error fetching availability:", availabilityError)
        } else if (availability) {
          availabilityData = availability
        }
      }

      // Get injury reserves for the team
      const { data: injuryReserves, error: irError } = await supabase
        .from("injury_reserves")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "active")

      if (irError && irError.code !== "42P01") {
        console.error("Error fetching injury reserves:", irError)
      }

      return NextResponse.json({
        players: players || [],
        availability: availabilityData,
        injuryReserves: injuryReserves || [],
      })
    }

    // Admin overview query - get all teams and their availability for the week
    if (!weekStart || !weekEnd) {
      return NextResponse.json({ error: "Week start and end dates are required for admin overview" }, { status: 400 })
    }

    console.log(`Admin overview: fetching data for week ${weekStart} to ${weekEnd}, season ${seasonId}`)

    // Get all seasons - order by season_number ascending to get Season 1 first
    const { data: seasons, error: seasonsError } = await supabase
      .from("seasons")
      .select("*")
      .order("season_number", { ascending: true })

    if (seasonsError) {
      console.error("Error fetching seasons:", seasonsError)
      return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 })
    }

    // Determine which season to use - prioritize regular season over playoffs
    let currentSeasonId = seasonId
    let currentSeason = null

    if (seasonId && seasonId !== "current") {
      // Try to find season by season_number first
      currentSeason = seasons?.find((s) => s.season_number?.toString() === seasonId)
      if (!currentSeason) {
        // Try to find by ID
        currentSeason = seasons?.find((s) => s.id === seasonId)
      }
    }

    // If no season found or "current" requested, find the regular Season 1 (not playoffs)
    if (!currentSeason) {
      // Look for regular Season 1 first (name should be "Season 1", not contain "Playoffs")
      currentSeason = seasons?.find(
        (s) =>
          s.season_number === 1 &&
          s.name &&
          s.name.toLowerCase().includes("season 1") &&
          !s.name.toLowerCase().includes("playoff"),
      )

      // If still not found, just get the first season with season_number 1
      if (!currentSeason) {
        currentSeason = seasons?.find((s) => s.season_number === 1)
      }

      // Last resort: get the first season
      if (!currentSeason) {
        currentSeason = seasons?.[0]
      }
    }

    if (!currentSeason) {
      return NextResponse.json({ error: "No seasons found" }, { status: 404 })
    }

    currentSeasonId = currentSeason.id
    console.log(`Using season: ${currentSeason.name} (ID: ${currentSeasonId}, Number: ${currentSeason.season_number})`)

    // Get matches for the week - simplified query first
    const { data: matchesRaw, error: matchesError } = await supabase
      .from("matches")
      .select(`
        id,
        match_date,
        home_team_id,
        away_team_id,
        status,
        season_id,
        season_name
      `)
      .gte("match_date", weekStart)
      .lte("match_date", weekEnd + "T23:59:59")
      .eq("season_id", currentSeasonId)
      .order("match_date")

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
    }

    console.log(`Found ${matchesRaw?.length || 0} matches for the week with season_id ${currentSeasonId}`)

    // If no matches found with season_id, try with season_name
    let matches = matchesRaw
    if (!matches || matches.length === 0) {
      console.log(`No matches found with season_id, trying with season_name: ${currentSeason.name}`)

      const { data: matchesByName, error: matchesByNameError } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          home_team_id,
          away_team_id,
          status,
          season_id,
          season_name
        `)
        .gte("match_date", weekStart)
        .lte("match_date", weekEnd + "T23:59:59")
        .eq("season_name", currentSeason.name)
        .order("match_date")

      if (matchesByNameError) {
        console.error("Error fetching matches by season name:", matchesByNameError)
      } else {
        matches = matchesByName
        console.log(`Found ${matches?.length || 0} matches using season_name`)
      }
    }

    // If still no matches, try "Season 1" as season_name
    if (!matches || matches.length === 0) {
      console.log(`Still no matches found, trying with season_name: "Season 1"`)

      const { data: matchesSeason1, error: matchesSeason1Error } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          home_team_id,
          away_team_id,
          status,
          season_id,
          season_name
        `)
        .gte("match_date", weekStart)
        .lte("match_date", weekEnd + "T23:59:59")
        .eq("season_name", "Season 1")
        .order("match_date")

      if (matchesSeason1Error) {
        console.error("Error fetching matches with Season 1:", matchesSeason1Error)
      } else {
        matches = matchesSeason1
        console.log(`Found ${matches?.length || 0} matches using "Season 1"`)
      }
    }

    // Get team names for the matches
    const teamIds = new Set<number>()
    matches?.forEach((match) => {
      teamIds.add(match.home_team_id)
      teamIds.add(match.away_team_id)
    })

    const { data: teamsForMatches, error: teamsForMatchesError } = await supabase
      .from("teams")
      .select("id, name, logo_url")
      .in("id", Array.from(teamIds))

    if (teamsForMatchesError) {
      console.error("Error fetching teams for matches:", teamsForMatchesError)
    }

    // Create team lookup map
    const teamLookup = new Map()
    teamsForMatches?.forEach((team) => {
      teamLookup.set(team.id, team)
    })

    // Enrich matches with team data
    const enrichedMatches =
      matches?.map((match) => ({
        ...match,
        home_team: teamLookup.get(match.home_team_id),
        away_team: teamLookup.get(match.away_team_id),
      })) || []

    // Get all teams
    const { data: allTeams, error: teamsError } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        logo_url,
        is_active
      `)
      .eq("is_active", true)
      .order("name")

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    console.log(`Found ${allTeams?.length || 0} active teams`)

    // Get all players for all teams
    const { data: allPlayers, error: playersError } = await supabase
      .from("players")
      .select(`
        id,
        user_id,
        team_id,
        role
      `)
      .in("team_id", allTeams?.map((t) => t.id) || [])

    if (playersError) {
      console.error("Error fetching all players:", playersError)
      return NextResponse.json({ error: "Failed to fetch players", details: playersError.message }, { status: 500 })
    }

    console.log(`Found ${allPlayers?.length || 0} players across all teams`)

    // Get user details separately to avoid join issues
    const userIds = allPlayers?.map((p) => p.user_id).filter(Boolean) || []
    let usersData: any[] = []

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, gamer_tag_id, email")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching users:", usersError)
        // Don't fail the whole request, just log the error
      } else {
        usersData = users || []
      }
    }

    console.log(`Found ${usersData.length} user records`)

    // Get EA player stats for the week to calculate games played
    // Match by player_name in ea_player_stats with gamer_tag_id in users
    let eaPlayerStats: any[] = []
    const gamerTags = usersData.map((u) => u.gamer_tag_id).filter(Boolean)

    if (gamerTags.length > 0) {
      const { data: stats, error: statsError } = await supabase
        .from("ea_player_stats")
        .select(`
          player_name,
          match_id,
          created_at
        `)
        .in("player_name", gamerTags)
        .gte("created_at", weekStart + "T00:00:00")
        .lte("created_at", weekEnd + "T23:59:59")

      if (statsError && statsError.code !== "42P01") {
        console.error("Error fetching EA player stats:", statsError)
      } else if (stats) {
        eaPlayerStats = stats
        console.log(`Found ${stats.length} EA player stats records for the week`)
      }
    }

    // Get all availability data for the matches
    const matchIds = enrichedMatches?.map((m) => m.id) || []
    let availabilityData: any[] = []

    if (matchIds.length > 0) {
      const { data: availability, error: availabilityError } = await supabase
        .from("game_availability")
        .select(`
          id,
          match_id,
          player_id,
          user_id,
          team_id,
          status,
          created_at,
          updated_at
        `)
        .in("match_id", matchIds)

      if (availabilityError && availabilityError.code !== "42P01") {
        console.error("Error fetching availability data:", availabilityError)
      } else if (availability) {
        availabilityData = availability
        console.log(`Found ${availability.length} availability records`)
      }
    }

    // Get injury reserves for the week
    let injuryReservesData: any[] = []
    const { data: injuryReserves, error: irError } = await supabase
      .from("injury_reserves")
      .select(`
        id,
        user_id,
        team_id,
        week_start_date,
        week_end_date,
        status,
        reason,
        created_at
      `)
      .eq("status", "active")
      .lte("week_start_date", weekEnd)
      .gte("week_end_date", weekStart)

    if (irError && irError.code !== "42P01") {
      console.error("Error fetching injury reserves:", irError)
    } else if (injuryReserves) {
      injuryReservesData = injuryReserves
      console.log(`Found ${injuryReserves.length} active injury reserves`)
    }

    // Structure the data for each team
    const teamsWithAvailability =
      allTeams?.map((team) => {
        const teamPlayers = allPlayers?.filter((p) => p.team_id === team.id) || []
        const teamMatches =
          enrichedMatches?.filter((m) => m.home_team_id === team.id || m.away_team_id === team.id) || []

        const playersWithAvailability = teamPlayers.map((player) => {
          // Find user data for this player
          const userData = usersData.find((u) => u.id === player.user_id)

          // Calculate games played this week from EA stats using gamer_tag_id match
          const playerStats = eaPlayerStats.filter((stat) => stat.player_name === userData?.gamer_tag_id)
          const gamesPlayedThisWeek = playerStats.length

          // Check if player is on injury reserve for this week
          const playerIR = injuryReservesData.find((ir) => ir.user_id === player.user_id && ir.team_id === team.id)

          const playerAvailability = teamMatches.map((match) => {
            // If player is on IR, mark all games as injury_reserve
            if (playerIR) {
              return {
                matchId: match.id,
                matchDate: match.match_date,
                opponent:
                  match.home_team_id === team.id ? match.away_team?.name || "TBD" : match.home_team?.name || "TBD",
                status: "injury_reserve" as const,
                signedUpAt: playerIR.created_at || null,
              }
            }

            const availability = availabilityData.find((a) => a.match_id === match.id && a.user_id === player.user_id)
            const opponent = match.home_team_id === team.id ? match.away_team : match.home_team

            return {
              matchId: match.id,
              matchDate: match.match_date,
              opponent: opponent?.name || "TBD",
              status: availability?.status || "not_responded",
              signedUpAt: availability?.created_at || null,
            }
          })

          const availableCount = playerAvailability.filter((a) => a.status === "available").length
          const unavailableCount = playerAvailability.filter((a) => a.status === "unavailable").length
          const injuryReserveCount = playerAvailability.filter((a) => a.status === "injury_reserve").length
          const noResponseCount = playerAvailability.filter((a) => a.status === "not_responded").length

          return {
            id: player.id,
            userId: player.user_id,
            name: userData?.gamer_tag_id || userData?.email || `Player ${player.id}`,
            gamerTag: userData?.gamer_tag_id || "",
            gamesPlayed: gamesPlayedThisWeek,
            availability: playerAvailability,
            availableCount,
            unavailableCount,
            injuryReserveCount,
            noResponseCount,
            isOnIR: !!playerIR,
          }
        })

        return {
          id: team.id,
          name: team.name,
          logoUrl: team.logo_url,
          players: playersWithAvailability,
          matches: teamMatches,
        }
      }) || []

    const responseData = {
      teams: teamsWithAvailability,
      matches: enrichedMatches || [],
      seasons: seasons || [],
      currentSeasonId: currentSeason.season_number?.toString() || currentSeason.id,
      currentSeasonName: currentSeason.name,
      weekStart,
      weekEnd,
    }

    console.log(`Returning data for ${teamsWithAvailability.length} teams with ${enrichedMatches?.length || 0} matches`)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Error in admin team availability API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { teamId, matchId, playerId, userId, status } = body

    if (!teamId || !matchId || !playerId || !userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if availability record exists
    const { data: existingAvailability, error: checkError } = await supabase
      .from("game_availability")
      .select("id")
      .eq("match_id", matchId)
      .eq("player_id", playerId)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116" && checkError.code !== "42P01") {
      console.error("Error checking existing availability:", checkError)
      return NextResponse.json({ error: "Failed to check availability" }, { status: 500 })
    }

    let result
    if (existingAvailability) {
      // Update existing record
      const { data: updatedAvailability, error: updateError } = await supabase
        .from("game_availability")
        .update({ status })
        .eq("id", existingAvailability.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating availability:", updateError)
        return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
      }

      result = updatedAvailability
    } else {
      // Create new record
      const { data: newAvailability, error: insertError } = await supabase
        .from("game_availability")
        .insert({
          match_id: matchId,
          player_id: playerId,
          user_id: userId,
          team_id: teamId,
          status,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating availability:", insertError)
        return NextResponse.json({ error: "Failed to create availability" }, { status: 500 })
      }

      result = newAvailability
    }

    return NextResponse.json({
      success: true,
      availability: result,
    })
  } catch (error: any) {
    console.error("Error in team availability POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
