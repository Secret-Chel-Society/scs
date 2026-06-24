// /api/matches/update-from-ea/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { mapEaPositionToStandard } from "@/lib/ea-position-mapper"

// Helper function to format time on ice
function formatTimeOnIce(seconds: number): string {
  if (!seconds) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Helper function to safely prepare player stats for database insertion
function preparePlayerStatsForDB(stat: any, matchId: string, eaMatchId: string | null, seasonId = 1) {
  // ✅ normalize: never store "" for ids; use null instead
  const normalizedPid =
    stat.player_id == null ? null : String(stat.player_id).trim() === "" ? null : String(stat.player_id).trim()

  // Create a base object with required fields
  const safeData: Record<string, any> = {
    match_id: matchId,
    ea_match_id: eaMatchId ?? null,
    player_name: (stat.player_name || "Unknown Player").toString().trim(),
    player_id: normalizedPid,
    team_id: stat.team_id || "",
    position: stat.position || "",
    season_id: seasonId, // Always set season_id
  }

  // Add numeric stats if they exist
  if (stat.goals !== undefined) safeData.goals = stat.goals
  if (stat.assists !== undefined) safeData.assists = stat.assists
  if (stat.shots !== undefined) safeData.shots = stat.shots
  if (stat.hits !== undefined) safeData.hits = stat.hits
  if (stat.pim !== undefined) safeData.pim = stat.pim
  if (stat.plus_minus !== undefined) safeData.plus_minus = stat.plus_minus
  if (stat.blocks !== undefined) safeData.blocks = stat.blocks
  if (stat.takeaways !== undefined) safeData.takeaways = stat.takeaways
  if (stat.giveaways !== undefined) safeData.giveaways = stat.giveaways
  if (stat.passing_pct !== undefined) safeData.passing_pct = stat.passing_pct
  if (stat.faceoffs_won !== undefined) safeData.faceoffs_won = stat.faceoffs_won
  if (stat.faceoffs_taken !== undefined) safeData.faceoffs_taken = stat.faceoffs_taken
  if (stat.faceoff_pct !== undefined) safeData.faceoff_pct = stat.faceoff_pct
  if (stat.saves !== undefined) safeData.saves = stat.saves
  if (stat.goals_against !== undefined) safeData.goals_against = stat.goals_against
  if (stat.save_pct !== undefined) safeData.save_pct = stat.save_pct
  if (stat.toi !== undefined) safeData.toi = stat.toi
  if (stat.pass_complete !== undefined) safeData.pass_complete = stat.pass_complete
  if (stat.pass_attempts !== undefined) safeData.pass_attempts = stat.pass_attempts
  if (stat.interceptions !== undefined) safeData.interceptions = stat.interceptions

  // Properly map ppg from skppg or ppg
  if (stat.ppg !== undefined) safeData.ppg = stat.ppg
  else if (stat.skppg !== undefined) safeData.ppg = Number.parseInt(stat.skppg.toString(), 10) || 0

  if (stat.shg !== undefined) safeData.shg = stat.shg
  if (stat.time_with_puck !== undefined) safeData.time_with_puck = stat.time_with_puck
  if (stat.category !== undefined) safeData.category = stat.category
  if (stat.shot_attempts !== undefined) safeData.shot_attempts = stat.shot_attempts
  if (stat.shot_pct !== undefined) safeData.shot_pct = stat.shot_pct
  if (stat.defensive_zone_time !== undefined) safeData.defensive_zone_time = stat.defensive_zone_time
  if (stat.offensive_zone_time !== undefined) safeData.offensive_zone_time = stat.offensive_zone_time
  if (stat.neutral_zone_time !== undefined) safeData.neutral_zone_time = stat.neutral_zone_time
  if (stat.dekes !== undefined) safeData.dekes = stat.dekes
  if (stat.successful_dekes !== undefined) safeData.successful_dekes = stat.successful_dekes

  // Add EA-specific fields if they exist
  if (stat.skinterceptions !== undefined) safeData.skinterceptions = stat.skinterceptions
  if (stat.skfow !== undefined) safeData.skfow = stat.skfow
  if (stat.skfol !== undefined) safeData.skfol = stat.skfol
  if (stat.skpenaltiesdrawn !== undefined) safeData.skpenaltiesdrawn = stat.skpenaltiesdrawn
  if (stat.skpasses !== undefined) safeData.skpasses = stat.skpasses
  if (stat.skpassattempts !== undefined) safeData.skpassattempts = stat.skpassattempts
  if (stat.skpossession !== undefined) safeData.skpossession = stat.skpossession
  if (stat.glgaa !== undefined) safeData.glgaa = stat.glgaa
  if (stat.skppg !== undefined) safeData.skppg = stat.skppg
  if (stat.skshg !== undefined) safeData.skshg = stat.skshg
  if (stat.glshots !== undefined) safeData.glshots = stat.glshots
  if (stat.toiseconds !== undefined) safeData.toiseconds = stat.toiseconds
  if (stat.glsaves !== undefined) safeData.glsaves = stat.glsaves
  if (stat.glga !== undefined) safeData.glga = stat.glga
  if (stat.glsavepct !== undefined) safeData.glsavepct = stat.glsavepct

  return safeData
}

// ------ NEW/UPDATED: league-aware table picker (adds ALLSTAR + AWHL) ------
function pickTables(league: "NHL" | "AHL" | "ALLSTAR" | "AWHL") {
  const lg = (league || "NHL").toUpperCase()
  if (lg === "AHL") {
    return {
      seasons: "seasons_ahl",
      matches: "matches_ahl",
      teams: "teams_ahl",
      eaMatchData: "ea_match_data_ahl",
      eaPlayerStats: "ea_player_stats_ahl",
      eaTeamStats: "ea_team_stats_ahl", // optional
    }
  }
  if (lg === "ALLSTAR") {
    return {
      seasons: "allstar_seasons",
      matches: "allstar_matches",
      teams: "allstar_teams",
      eaMatchData: "allstar_ea_match_data",
      eaPlayerStats: "allstar_ea_player_stats",
      eaTeamStats: "allstar_ea_team_stats",
    }
  }
  if (lg === "AWHL") {
    return {
      seasons: "whl_seasons",
      matches: "whl_matches",
      teams: "whl_teams",
      eaMatchData: "whl_ea_match_data",
      eaPlayerStats: "whl_ea_player_stats",
      eaTeamStats: "whl_ea_team_stats",
    }
  }
  // NHL default
  return {
    seasons: "seasons",
    matches: "matches",
    teams: "teams",
    eaMatchData: "ea_match_data",
    eaPlayerStats: "ea_player_stats",
    eaTeamStats: "ea_team_stats",
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() { return [] },
        setAll() { /* no-op for service role */ },
      },
    })

    // TEMPORARILY DISABLE AUTHORIZATION FOR DEPLOYED WEBSITE
    // TODO: Re-enable authorization once the deployment auth issues are resolved

    console.log("=== TEMPORARILY BYPASSING AUTHORIZATION ===")
    console.log("This is a temporary fix for deployment auth issues")
    console.log("Authorization will be re-enabled once the issue is resolved")

    // Get the request body
    const body = await request.json()

    console.log("===== REQUEST BODY =====")
    console.log("Full body:", JSON.stringify(body, null, 2))

    const {
      matchId,
      eaMatchId,
      eaMatchData,
      isManualImport = false,
      adminOverride = false,
      league = "NHL", // <-- incoming hint; may be overridden by inference/query
    } = body as {
      matchId: string
      eaMatchId?: string
      eaMatchData: any
      isManualImport?: boolean
      adminOverride?: boolean
      league?: "NHL" | "AHL" | "ALLSTAR" | "AWHL"
    }

    // ===== NEW: Resolve final league (query param > body > referer inference) =====
    const url = new URL(request.url)
    const leagueQuery = (url.searchParams.get("league") || "").toUpperCase() as "NHL" | "AHL" | "ALLSTAR" | "AWHL" | ""
    const referer = (request.headers.get("referer") || "").toLowerCase()

    let leagueFromBody = (league || "NHL").toUpperCase() as "NHL" | "AHL" | "ALLSTAR" | "AWHL"
    // AWHL must be checked before AHL since "/awhl/" also contains "ahl"
    if (!leagueQuery && /\/awhl\//.test(referer)) leagueFromBody = "AWHL"
    else if (!leagueQuery && /\/allstar\//.test(referer)) leagueFromBody = "ALLSTAR"
    else if (!leagueQuery && /\/ahl\//.test(referer)) leagueFromBody = "AHL"

    let leagueFinal = (leagueQuery || leagueFromBody || "NHL") as "NHL" | "AHL" | "ALLSTAR" | "AWHL"
    let T = pickTables(leagueFinal)

    console.log("===== EXTRACTED PARAMETERS =====")
    console.log("matchId:", matchId)
    console.log("matchId type:", typeof matchId)
    console.log("eaMatchId:", eaMatchId)
    console.log("league param:", league)
    console.log("leagueFinal:", leagueFinal, "via", { leagueQuery, leagueFromBody, referer })

    if (!matchId || !eaMatchData) {
      return NextResponse.json({ error: "Match ID and EA Match Data are required" }, { status: 400 })
    }

    console.log(`===== TABLE SELECTION =====`)
    console.log(`LeagueFinal: ${leagueFinal}`)
    console.log(`Using tables:`, JSON.stringify(T, null, 2))
    console.log(`Looking for match ID: ${matchId}`)

    const { data: activeSeason, error: seasonError } = await supabase
      .from(T.seasons)
      .select("season_number")
      .eq("is_active", true)
      .single()

    if (seasonError || !activeSeason) {
      console.error("Error fetching active season:", seasonError)
      return NextResponse.json(
        { error: `Could not determine current active ${leagueFinal} season. Please ensure a season is marked as active.` },
        { status: 500 },
      )
    }

    const currentSeasonId = activeSeason.season_number
    console.log(`Using current active season number: ${currentSeasonId} [${leagueFinal}]`)

    // Check if this is a combined match
    const isCombinedMatch = eaMatchId?.startsWith("combined-") || eaMatchData.isCombined
    console.log(`Processing ${isCombinedMatch ? "combined" : "regular"} match: ${eaMatchId}`)

    if (isCombinedMatch) {
      console.log("Combined match data:", {
        matchId: eaMatchData.matchId,
        isCombined: eaMatchData.isCombined,
        combinedFrom: eaMatchData.combinedFrom,
        combinedCount: eaMatchData.combinedCount,
      })
    }

    // Get the match details to check team IDs
    console.log(`===== QUERYING DATABASE =====`)
    console.log(`Querying ${T.matches} table for match ID: ${matchId}`)
    console.log(
      `Query: supabase.from("${T.matches}").select("home_team_id, away_team_id, status").eq("id", "${matchId}").maybeSingle()`,
    )

    let { data: match, error: matchError } = await supabase
      .from(T.matches)
      .select("home_team_id, away_team_id, status")
      .eq("id", matchId)
      .maybeSingle()

    console.log(`===== QUERY RESULT =====`)
    console.log(`Match data:`, match ? JSON.stringify(match, null, 2) : "null")
    console.log(`Match error:`, matchError ? JSON.stringify(matchError, null, 2) : "null")

    // ===== Fallback: try other league tables if primary miss =====
    if (!match) {
      const fallbackLeagues = (["AWHL", "ALLSTAR", "AHL", "NHL"] as const).filter(l => l !== leagueFinal)
      for (const fbLeague of fallbackLeagues) {
        console.log(`Primary table miss. Retrying against ${fbLeague} auto-fallback.`)
        const Tfb = pickTables(fbLeague)
        const { data: fbMatch, error: fbError } = await supabase
          .from(Tfb.matches)
          .select("home_team_id, away_team_id, status")
          .eq("id", matchId)
          .maybeSingle()
        if (fbMatch) {
          match = fbMatch
          leagueFinal = fbLeague
          T = pickTables(leagueFinal)
          console.log(`Auto-switched league to ${fbLeague} based on fallback hit.`)
          break
        } else {
          console.log(`${fbLeague} fallback miss:`, fbError)
        }
      }
    }

    if (matchError && !match) {
      console.error("Match query error:", matchError)
      return NextResponse.json({ error: `Match not found: ${matchError.message}` }, { status: 404 })
    }

    if (!match) {
      console.error("===== MATCH NOT FOUND AFTER FALLBACKS =====")
      console.error("Match ID:", matchId)
      console.error("Table queried:", T.matches)
      console.error("LeagueFinal:", leagueFinal)

      console.log("===== DEBUGGING: Checking NHL/AHL/ALLSTAR/AWHL tables =====")

      const debugTables = [
        { label: "NHL", table: "matches" },
        { label: "AHL", table: "matches_ahl" },
        { label: "ALLSTAR", table: "allstar_matches" },
        { label: "AWHL", table: "whl_matches" },
      ]
      const debugResults: Record<string, boolean> = {}
      for (const dt of debugTables) {
        const { data: dtMatch } = await supabase
          .from(dt.table)
          .select("id")
          .eq("id", matchId)
          .maybeSingle()
        debugResults[dt.label] = !!dtMatch
        console.log(`${dt.label} (${dt.table}): ${dtMatch ? "FOUND" : "NOT FOUND"}`)
        if (dtMatch) console.log(`Match found in ${dt.label} table but league parameter was:`, league)
      }

      return NextResponse.json(
        {
          error: `Match not found with ID: ${matchId} in table: ${T.matches}`,
          league: leagueFinal,
          table: T.matches,
          debug: {
            ...Object.fromEntries(Object.entries(debugResults).map(([k, v]) => [`foundIn${k}`, v])),
            requestedLeague: league,
            resolvedLeague: leagueFinal,
          },
        },
        { status: 404 },
      )
    }

    console.log("Match found:", match)
    console.log("Proceeding with match update (authorization bypassed)")

    // Get team EA club IDs
    const { data: teams, error: teamsError } = await supabase
      .from(T.teams)
      .select("id, ea_club_id")
      .in("id", [match.home_team_id, match.away_team_id])

    if (teamsError) {
      return NextResponse.json({ error: `Failed to get team EA club IDs (${leagueFinal})` }, { status: 500 })
    }

    // Map team IDs to EA club IDs
    const teamEaClubIds: Record<string, string> = {}
    ;(teams || []).forEach((team) => {
      if (team.ea_club_id) {
        teamEaClubIds[team.id] = team.ea_club_id
      }
    })

    // Extract scores from EA match data
    const homeTeamEaClubId = teamEaClubIds[match.home_team_id]
    const awayTeamEaClubId = teamEaClubIds[match.away_team_id]

    // For manual imports, we might not have EA club IDs set up
    if (isManualImport) {
      console.log("Manual import - skipping EA club ID validation")
    } else if (!homeTeamEaClubId || !awayTeamEaClubId) {
      return NextResponse.json({ error: "One or both teams are missing EA club IDs" }, { status: 400 })
    }

    // Extract scores from EA match data - handle both manual and automatic imports
    let homeScore = 0
    let awayScore = 0
    let periodScores = [
      { home: 0, away: 0 },
      { home: 0, away: 0 },
      { home: 0, away: 0 },
    ]

    try {
      // Try to extract scores from EA match data
      if (isManualImport) {
        // For manual imports, try to get scores from the top level
        homeScore = eaMatchData.homeScore || 0
        awayScore = eaMatchData.awayScore || 0
        periodScores = eaMatchData.periodScores || periodScores
      } else {
        // For automatic imports, extract from the clubs data
        const homeClub = homeTeamEaClubId ? eaMatchData.clubs?.[homeTeamEaClubId] : null
        const awayClub = awayTeamEaClubId ? eaMatchData.clubs?.[awayTeamEaClubId] : null

        if (homeClub && awayClub) {
          homeScore = homeClub.details?.goals ?? homeClub.goals ?? 0
          awayScore = awayClub.details?.goals ?? awayClub.goals ?? 0

          // Create period scores (this is a simplification - EA API doesn't provide period scores)
          periodScores = [
            { home: Math.floor(homeScore / 3), away: Math.floor(awayScore / 3) },
            { home: Math.floor(homeScore / 3), away: Math.floor(awayScore / 3) },
            { home: homeScore - 2 * Math.floor(homeScore / 3), away: awayScore - 2 * Math.floor(awayScore / 3) },
          ]
        } else {
          console.warn("Could not find club data in EA match data, using default scores")
        }
      }
    } catch (err) {
      console.error("Error extracting scores from EA match data:", err)
      // Continue with default scores
    }

    console.log(`Scores: ${homeScore} - ${awayScore}`)

    // Update the match - don't automatically set status to "Completed"
    {
      const updatePayload: any = {
        home_score: homeScore,
        away_score: awayScore,
        period_scores: periodScores,
        // Removed: status: "Completed",
        is_manual_import: isManualImport,
        updated_at: new Date().toISOString(),
      }

      // NHL matches table stores raw JSON; for AHL/ALLSTAR you might keep it separate
      if (leagueFinal === "NHL") {
        updatePayload.ea_match_id = eaMatchId
        updatePayload.ea_match_data = eaMatchData
      } else {
        // If your *_ahl or allstar_matches has ea_match_id, keep this; remove if not in schema.
        updatePayload.ea_match_id = eaMatchId
      }

      const { error: updateError } = await supabase.from(T.matches).update(updatePayload).eq("id", matchId)

      if (updateError) {
        console.error("Error updating match:", updateError)
        return NextResponse.json({ error: `Failed to update match: ${updateError.message}` }, { status: 500 })
      }
    }

    // Log the power play stats that are being saved
    console.log("Power play stats being saved to match record:")
    if (eaMatchData && eaMatchData.clubs) {
      Object.keys(eaMatchData.clubs).forEach((clubId) => {
        const club = eaMatchData.clubs[clubId]
        console.log(`Club ${clubId}: PPG=${club.ppg || 0}, PPO=${club.ppo || 0}`)
      })
    }

    // Update team standings (league-aware)
    await updateTeamStandings(supabase, T.teams, match.home_team_id, match.away_team_id, homeScore, awayScore, false)

    // Add this debugging code to log power play stats before saving
    if (eaMatchData && eaMatchData.clubs) {
      console.log("Power play stats before saving to database:")
      Object.keys(eaMatchData.clubs).forEach((clubId) => {
        const club = eaMatchData.clubs[clubId]
        console.log(`Club ${clubId}: PPG=${club.ppg || 0}, PPO=${club.ppo || 0}`)

        // Ensure ppg and ppo are defined and are numbers
        if (club.ppg === undefined || club.ppg === null) {
          console.log(`Setting undefined PPG to 0 for club ${clubId}`)
          club.ppg = 0
        }

        if (club.ppo === undefined || club.ppo === null) {
          console.log(`Setting undefined PPO to 0 for club ${clubId}`)
          club.ppo = 0
        }

        // Convert to numbers if they're strings
        if (typeof club.ppg === "string") {
          club.ppg = Number(club.ppg)
        }

        if (typeof club.ppo === "string") {
          club.ppo = Number(club.ppo)
        }
      })
    }

    // If this is a combined match, ensure ppg and ppo are properly accumulated
    if (eaMatchData && (eaMatchData.isCombined || eaMatchId?.startsWith("combined-"))) {
      console.log("Processing combined match data for power play stats")

      // If we have combinedFrom data, we can verify the ppg/ppo accumulation
      if (eaMatchData.combinedFrom && Array.isArray(eaMatchData.combinedFrom)) {
        console.log(`This match combines data from ${eaMatchData.combinedFrom.length} individual matches`)
      }
    }

    // Save raw EA data if available (league-aware)
    if (eaMatchData && eaMatchId) {
      try {
        // First check if the record already exists
        const { data: existingData, error: checkError } = await supabase
          .from(T.eaMatchData)
          .select("id")
          .eq("match_id", eaMatchId)
          .maybeSingle()

        if (checkError) {
          console.error(`Error checking existing ${T.eaMatchData}:`, checkError)
        } else {
          if (existingData) {
            // Record exists, update it
            const { error: updateRawDataError } = await supabase
              .from(T.eaMatchData)
              .update({
                data: eaMatchData,
                updated_at: new Date().toISOString(),
              })
              .eq("match_id", eaMatchId)

            if (updateRawDataError) {
              console.error(`Error updating raw EA data in ${T.eaMatchData}:`, updateRawDataError)
            } else {
              console.log(`Successfully updated raw EA match data in ${T.eaMatchData}`)
            }
          } else {
            // Record doesn't exist, insert it
            const { error: insertRawDataError } = await supabase.from(T.eaMatchData).insert({
              match_id: eaMatchId,
              data: eaMatchData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            if (insertRawDataError) {
              console.error(`Error inserting raw EA data into ${T.eaMatchData}:`, insertRawDataError)
            } else {
              console.log(`Successfully inserted raw EA match data into ${T.eaMatchData}`)
            }
          }
        }
      } catch (rawDataError) {
        console.error("Error processing raw EA data:", rawDataError)
        // Continue anyway since the match was updated
      }
    }

    const homePlayerStats: any[] = []
    const awayPlayerStats: any[] = []

    // Check if the ea_player_stats table exists (league-aware)
    let tableExists = false
    try {
      // Try to query the table
      const { error: checkTableError } = await supabase.from(T.eaPlayerStats).select("id").limit(1)
      tableExists = !checkTableError
    } catch (error) {
      console.log("Table does not exist or other error:", error)
      tableExists = false
    }

    if (tableExists) {
      // Delete any existing stats for this match before adding new ones
      const { error: deleteError } = await supabase.from(T.eaPlayerStats).delete().eq("match_id", matchId)

      if (deleteError) {
        console.error("Error deleting existing player stats:", deleteError)
      }

      // Process home team players
      let homePlayerStats: any[] = []

      // Import player statistics for home team
      if (homeTeamEaClubId && eaMatchData.clubs && eaMatchData.clubs[homeTeamEaClubId]) {
        const homeClub = eaMatchData.clubs[homeTeamEaClubId]

        // Get players either from club.players or from top-level players structure
        const homePlayers = homeClub.players
          ? Object.values(homeClub.players)
          : eaMatchData.players && eaMatchData.players[homeTeamEaClubId]
            ? Object.values(eaMatchData.players[homeTeamEaClubId])
            : []

        console.log(`Processing ${homePlayers.length} home team players`)

        homePlayerStats = homePlayers.map((player: any) => {
          // Use mapEaPositionToStandard for more reliable mapping
          let position = "Skater"
          if (player.posSorted) {
            position = mapEaPositionToStandard(player.posSorted)
          } else if (player.position === "0" || player.position === "goalie") {
            position = "G"
          } else if (player.position === "1") {
            position = "RD"
          } else if (player.position === "2") {
            position = "LD"
          } else if (player.position === "5" || player.position === "center") {
            position = "C"
          } else if (player.position === "4" || player.position === "leftWing") {
            position = "LW"
          } else if (player.position === "3" || player.position === "rightWing") {
            position = "RW"
          } else if (player.position === "defenseMen" || player.position === "defensemen") {
            // For generic defensemen without specific side, default to D
            position = "D"
          }

          const isPlayerGoalie = position === "G"

          console.log(
            `Player ${player.persona || player.playername || "Unknown"}: ${player.skgoals || player.goals || 0} goals, ${player.skassists || player.assists || 0} assists, position: ${position}`,
          )

          // Create player stats object with all fields
          const playerStats: any = {
            match_id: matchId,
            ea_match_id: eaMatchId,
            player_name: player.persona || player.playername || "Unknown Player",
            player_id: player.playerId ? String(player.playerId).trim() : null, // ✅ normalize
            team_id: match.home_team_id,
            position: position,
            season_id: currentSeasonId, // Set the current active season ID
            goals: Number.parseInt(player.skgoals || player.goals || "0", 10),
            assists: Number.parseInt(player.skassists || player.assists || "0", 10),
            shots: Number.parseInt(player.skshots || player.shots || "0", 10),
            hits: Number.parseInt(player.skhits || player.hits || "0", 10),
            pim: Number.parseInt(player.skpim || player.pim || "0", 10),
            plus_minus: Number.parseInt(player.skplusmin || player.plusMinus || "0", 10),
            blocks: Number.parseInt(player.skbs || player.blocks || "0", 10),
            takeaways: Number.parseInt(player.sktakeaways || player.takeaways || "0", 10),
            giveaways: Number.parseInt(player.skgiveaways || player.giveaways || "0", 10),
            passing_pct: Number.parseFloat(player.skpasspct || player.passingPct || "0"),

            // Store raw EA fields
            skinterceptions: player.skinterceptions || null,
            skfow: player.skfow || null,
            skfol: player.skfol || null,
            skpenaltiesdrawn: player.skpenaltiesdrawn || null,
            skpasses: player.skpasses || null,
            skpassattempts: player.skpassattempts || null,
            skpossession: player.skpossession || null,
            skppg: player.skppg || null,
            skshg: player.skshg || null,
            toiseconds: player.toiseconds || null,

            // Map EA fields to database fields
            interceptions: Number.parseInt(player.skinterceptions || "0", 10),
            pass_complete: Number.parseInt(player.skpasses || "0", 10),
            pass_attempts: Number.parseInt(player.skpassattempts || "0", 10),
            ppg: Number.parseInt(player.skppg || "0", 10),
            shg: Number.parseInt(player.skshg || "0", 10),
            faceoffs_won: Number.parseInt(player.skfow || "0", 10),
            faceoffs_taken: Number.parseInt(player.skfow || "0", 10) + Number.parseInt(player.skfol || "0", 10),
            faceoff_pct:
              Number.parseInt(player.skfow || "0", 10) + Number.parseInt(player.skfol || "0", 10) > 0
                ? (Number.parseInt(player.skfow || "0", 10) /
                    (Number.parseInt(player.skfow || "0", 10) + Number.parseInt(player.skfol || "0", 10))) *
                  100
                : 0,
            time_with_puck: Number.parseInt(player.skpossession || "0", 10),
            toi: formatTimeOnIce(Number.parseInt(player.toiseconds || "0", 10)),
          }

          // Log power play goals for debugging
          if (playerStats.ppg > 0) {
            console.log(`Player ${playerStats.player_name} has ${playerStats.ppg} power play goals`)
          }

          // Add goalie-specific stats
          if (isPlayerGoalie) {
            // Store raw goalie stats if available
            if (player.glshots) playerStats.glshots = player.glshots
            if (player.glsaves) playerStats.glsaves = player.glsaves
            if (player.glsavepct) playerStats.glsavepct = player.glsavepct
            if (player.glgaa) playerStats.glgaa = player.glgaa
            if (player.glga) playerStats.glga = player.glga

            // Always set the standard fields that we know exist in the database
            playerStats.saves = Number.parseInt(player.glsaves || "0", 10)
            playerStats.goals_against = Number.parseInt(player.glga || "0", 10)
            playerStats.save_pct = Number.parseFloat(player.glsavepct || "0")
          }

          // Add category if available
          playerStats.category =
            player.category ||
            (position === "G" ? "goalie" : position === "RD" || position === "LD" ? "defense" : "offense")

          return playerStats
        })
      }

      // Process away team players - similar changes as above
      let awayPlayerStats: any[] = []

      // Import player statistics for away team
      if (awayTeamEaClubId && eaMatchData.clubs && eaMatchData.clubs[awayTeamEaClubId]) {
        const awayClub = eaMatchData.clubs[awayTeamEaClubId]

        // Get players either from club.players or from top-level players structure
        const awayPlayers = awayClub.players
          ? Object.values(awayClub.players)
          : eaMatchData.players && eaMatchData.players[awayTeamEaClubId]
            ? Object.values(eaMatchData.players[awayTeamEaClubId])
            : []

        console.log(`Processing ${awayPlayers.length} away team players`)

        awayPlayerStats = awayPlayers.map((player: any) => {
          // Use mapEaPositionToStandard for more reliable mapping
          let position = "Skater"
          if (player.posSorted) {
            position = mapEaPositionToStandard(player.posSorted)
          } else if (player.position === "0" || player.position === "goalie") {
            position = "G"
          } else if (player.position === "1") {
            position = "RD"
          } else if (player.position === "2") {
            position = "LD"
          } else if (player.position === "5" || player.position === "center") {
            position = "C"
          } else if (player.position === "4" || player.position === "leftWing") {
            position = "LW"
          } else if (player.position === "3" || player.position === "rightWing") {
            position = "RW"
          } else if (player.position === "defenseMen" || player.position === "defensemen") {
            // For generic defensemen without specific side, default to D
            position = "D"
          }

          const isPlayerGoalie = position === "G"

          console.log(
            `Player ${player.persona || player.playername || "Unknown"}: ${player.skgoals || player.goals || 0} goals, ${player.skassists || player.assists || 0} assists, position: ${position}`,
          )

          // Create player stats object with all fields
          const playerStats: any = {
            match_id: matchId,
            ea_match_id: eaMatchId,
            player_name: player.persona || player.playername || "Unknown Player",
            player_id: player.playerId ? String(player.playerId).trim() : null, // ✅ normalize
            team_id: match.away_team_id,
            position: position,
            season_id: currentSeasonId, // Set the current active season ID
            goals: Number.parseInt(player.skgoals || player.goals || "0", 10),
            assists: Number.parseInt(player.skassists || player.assists || "0", 10),
            shots: Number.parseInt(player.skshots || player.shots || "0", 10),
            hits: Number.parseInt(player.skhits || player.hits || "0", 10),
            pim: Number.parseInt(player.skpim || player.pim || "0", 10),
            plus_minus: Number.parseInt(player.skplusmin || player.plusMinus || "0", 10),
            blocks: Number.parseInt(player.skbs || player.blocks || "0", 10),
            takeaways: Number.parseInt(player.sktakeaways || player.takeaways || "0", 10),
            giveaways: Number.parseInt(player.skgiveaways || player.giveaways || "0", 10),
            passing_pct: Number.parseFloat(player.skpasspct || player.passingPct || "0"),

            // Store raw EA fields
            skinterceptions: player.skinterceptions || null,
            skfow: player.skfow || null,
            skfol: player.skfol || null,
            skpenaltiesdrawn: player.skpenaltiesdrawn || null,
            skpasses: player.skpasses || null,
            skpassattempts: player.skpassattempts || null,
            skpossession: player.skpossession || null,
            skppg: player.skppg || null,
            skshg: player.skshg || null,
            toiseconds: player.toiseconds || null,

            // Map EA fields to database fields
            interceptions: Number.parseInt(player.skinterceptions || "0", 10),
            pass_complete: Number.parseInt(player.skpasses || "0", 10),
            pass_attempts: Number.parseInt(player.skpassattempts || "0", 10),
            ppg: Number.parseInt(player.skppg || "0", 10),
            shg: Number.parseInt(player.skshg || "0", 10),
            faceoffs_won: Number.parseInt(player.skfow || "0", 10),
            faceoffs_taken: Number.parseInt(player.skfow || "0", 10) + Number.parseInt(player.skfol || "0", 10),
            faceoff_pct:
              Number.parseInt(player.skfow || "0", 10) + Number.parseInt(player.skfol || "0", 10) > 0
                ? (Number.parseInt(player.skfow || "0", 10) /
                    (Number.parseInt(player.skfow || "0", 10) + Number.parseInt(player.skfol || "0", 10))) *
                  100
                : 0,
            time_with_puck: Number.parseInt(player.skpossession || "0", 10),
            toi: formatTimeOnIce(Number.parseInt(player.toiseconds || "0", 10)),
          }

          // Log power play goals for debugging
          if (playerStats.ppg > 0) {
            console.log(`Player ${playerStats.player_name} has ${playerStats.ppg} power play goals`)
          }

          // Add goalie-specific stats
          if (isPlayerGoalie) {
            // Store raw goalie stats if available
            if (player.glshots) playerStats.glshots = player.glshots
            if (player.glsaves) playerStats.glsaves = player.glsaves
            if (player.glsavepct) playerStats.glsavepct = player.glsavepct
            if (player.glgaa) playerStats.glgaa = player.glgaa
            if (player.glga) playerStats.glga = player.glga

            // Always set the standard fields that we know exist in the database
            playerStats.saves = Number.parseInt(player.glsaves || "0", 10)
            playerStats.goals_against = Number.parseInt(player.glga || "0", 10)
            playerStats.save_pct = Number.parseFloat(player.glsavepct || "0")
          }

          // Add category if available
          playerStats.category =
            player.category ||
            (position === "G" ? "goalie" : position === "RD" || position === "LD" ? "defense" : "offense")

          return playerStats
        })
      }

      // Combine all player stats and prepare them for insertion
      const allPlayerStats = [...homePlayerStats, ...awayPlayerStats]

      if (allPlayerStats.length > 0) {
        console.log(`Inserting ${allPlayerStats.length} player stats records with season_id = ${currentSeasonId}`)

        // Prepare player stats for insertion
        const preparedStats = allPlayerStats.map((stat) =>
          preparePlayerStatsForDB(stat, matchId, eaMatchId, currentSeasonId),
        )

        // ✅ De-dupe inside this payload first (avoid double rows in same request)
        const deduped: any[] = []
        const seenWith = new Set<string>()
        const seenWithout = new Set<string>()

        for (const r of preparedStats) {
          if (r.player_id) {
            const k = `${r.match_id}:${r.player_id}`
            if (seenWith.has(k)) continue
            seenWith.add(k)
            deduped.push(r)
          } else {
            const k = `${r.match_id}:${r.team_id}:${(r.player_name || "").toLowerCase()}`
            if (seenWithout.has(k)) continue
            seenWithout.add(k)
            deduped.push(r)
          }
        }

        // Split by presence of player_id to match DB unique constraints
        const withId = deduped.filter((r) => r.player_id)
        const withoutId = deduped.filter((r) => !r.player_id)

        // ✅ Upsert WITH player_id against (match_id,player_id)
        if (withId.length) {
          const { error } = await supabase
            .from(T.eaPlayerStats)
            .upsert(withId, { onConflict: "match_id,player_id", ignoreDuplicates: false })
            .select()

          if (error) {
            console.error("[ea import] upsert with player_id failed", error)
            return NextResponse.json(
              { success: false, error: `Failed to insert player stats (with player_id): ${error.message}` },
              { status: 500 },
            )
          }
        }

        // ✅ Upsert WITHOUT player_id against (match_id,team_id,player_name)
        if (withoutId.length) {
          const { error } = await supabase
            .from(T.eaPlayerStats)
            .upsert(withoutId, { onConflict: "match_id,team_id,player_name", ignoreDuplicates: false })
            .select()

          if (error) {
            console.error("[ea import] upsert without player_id failed", error)
            return NextResponse.json(
              { success: false, error: `Failed to insert player stats (no player_id): ${error.message}` },
              { status: 500 },
            )
          }
        }

        console.log(`Processed ${deduped.length} player statistics records`)
        if (deduped.length > 0) {
          console.log("Sample player stat:", deduped[0])
        }
      }
    }

    // Save team stats to ea_team_stats table if it exists (league-aware)
    try {
      // Check if ea_team_stats table exists
      let teamStatsTableExists = false
      try {
        const { data, error } = await supabase.from(T.eaTeamStats).select("id").limit(1)
        teamStatsTableExists = !error
      } catch (checkError) {
        console.log(`${T.eaTeamStats} table does not exist`)
        teamStatsTableExists = false
      }

      if (teamStatsTableExists && eaMatchData && eaMatchData.clubs) {
        console.log("Processing team stats for database insertion...")

        // Delete any existing team stats for this match
        const { error: deleteTeamStatsError } = await supabase.from(T.eaTeamStats).delete().eq("match_id", matchId)

        if (deleteTeamStatsError) {
          console.error("Error deleting existing team stats:", deleteTeamStatsError)
        }

        // Process team stats from EA data
        const teamStatsToInsert: any[] = []

        // Process home team stats
        if (homeTeamEaClubId && eaMatchData.clubs[homeTeamEaClubId]) {
          const homeClub = eaMatchData.clubs[homeTeamEaClubId]

          // Calculate aggregated stats from player data
          let homeHits = 0,
            homePim = 0,
            homeBlocks = 0,
            homeTakeaways = 0,
            homeGiveaways = 0
          let homeFaceoffsWon = 0,
            homeFaceoffsTaken = 0,
            homeShotAttempts = 0
          let homePassComplete = 0,
            homePassAttempts = 0,
            homePpGoals = 0

          // Sum from home team players
          if ((homePlayerStats as any[]) && (homePlayerStats as any[]).length > 0) {
            ;(homePlayerStats as any[]).forEach((player: any) => {
              homeHits += player.hits || 0
              homePim += player.pim || 0
              homeBlocks += player.blocks || 0
              homeTakeaways += player.takeaways || 0
              homeGiveaways += player.giveaways || 0
              homeFaceoffsWon += player.faceoffs_won || 0
              homeFaceoffsTaken += player.faceoffs_taken || 0
              homeShotAttempts += player.shot_attempts || 0
              homePassComplete += player.pass_complete || 0
              homePassAttempts += player.pass_attempts || 0
              homePpGoals += player.ppg || 0
            })
          }

          const homeTeamStats = {
            match_id: matchId,
            ea_match_id: eaMatchId,
            team_id: match.home_team_id,
            team_name: homeClub.details?.name || "Home Team",
            goals: Number.parseInt(homeClub.goals || homeClub.score || "0", 10),
            shots: Number.parseInt(homeClub.shots || "0", 10),
            hits: homeHits,
            blocks: homeBlocks,
            pim: homePim,
            pp_goals: Number.parseInt(homeClub.ppg || "0", 10),
            pp_opportunities: Number.parseInt(homeClub.ppo || "0", 10),
            pp_pct:
              Number.parseInt(homeClub.ppo || "0", 10) > 0
                ? (Number.parseInt(homeClub.ppg || "0", 10) / Number.parseInt(homeClub.ppo || "0", 10)) * 100
                : 0,
            faceoff_wins: homeFaceoffsWon,
            faceoff_losses: homeFaceoffsTaken - homeFaceoffsWon,
            faceoff_pct: homeFaceoffsTaken > 0 ? (homeFaceoffsWon / homeFaceoffsTaken) * 100 : 0,
            passing_pct:
              Number.parseInt(homeClub.passa || "0", 10) > 0
                ? (Number.parseInt(homeClub.passc || "0", 10) / Number.parseInt(homeClub.passa || "0", 10)) * 100
                : 0,
            shot_attempts: homeShotAttempts,
            shot_pct: homeShotAttempts > 0 ? (Number.parseInt(homeClub.shots || "0", 10) / homeShotAttempts) * 100 : 0,
            pass_attempts: Number.parseInt(homeClub.passa || "0", 10),
            pass_complete: Number.parseInt(homeClub.passc || "0", 10),
            time_in_offensive_zone: Number.parseInt(homeClub.toa || "0", 10),
            time_in_defensive_zone: 0,
            time_in_neutral_zone: 0,
            takeaways: homeTakeaways,
            giveaways: homeGiveaways,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          teamStatsToInsert.push(homeTeamStats)
          console.log("Home team stats prepared:", homeTeamStats)
        }

        // Process away team stats
        if (awayTeamEaClubId && eaMatchData.clubs[awayTeamEaClubId]) {
          const awayClub = eaMatchData.clubs[awayTeamEaClubId]

          // Calculate aggregated stats from player data
          let awayHits = 0,
            awayPim = 0,
            awayBlocks = 0,
            awayTakeaways = 0,
            awayGiveaways = 0
          let awayFaceoffsWon = 0,
            awayFaceoffsTaken = 0,
            awayShotAttempts = 0
          let awayPassComplete = 0,
            awayPassAttempts = 0,
            awayPpGoals = 0

          // Sum from away team players
          if ((awayPlayerStats as any[]) && (awayPlayerStats as any[]).length > 0) {
            ;(awayPlayerStats as any[]).forEach((player: any) => {
              awayHits += player.hits || 0
              awayPim += player.pim || 0
              awayBlocks += player.blocks || 0
              awayTakeaways += player.takeaways || 0
              awayGiveaways += player.giveaways || 0
              awayFaceoffsWon += player.faceoffs_won || 0
              awayFaceoffsTaken += player.faceoffs_taken || 0
              awayShotAttempts += player.shot_attempts || 0
              awayPassComplete += player.pass_complete || 0
              awayPassAttempts += player.pass_attempts || 0
              awayPpGoals += player.ppg || 0
            })
          }

          const awayTeamStats = {
            match_id: matchId,
            ea_match_id: eaMatchId,
            team_id: match.away_team_id,
            team_name: awayClub.details?.name || "Away Team",
            goals: Number.parseInt(awayClub.goals || awayClub.score || "0", 10),
            shots: Number.parseInt(awayClub.shots || "0", 10),
            hits: awayHits,
            blocks: awayBlocks,
            pim: awayPim,
            pp_goals: Number.parseInt(awayClub.ppg || "0", 10),
            pp_opportunities: Number.parseInt(awayClub.ppo || "0", 10),
            pp_pct:
              Number.parseInt(awayClub.ppo || "0", 10) > 0
                ? (Number.parseInt(awayClub.ppg || "0", 10) / Number.parseInt(awayClub.ppo || "0", 10)) * 100
                : 0,
            faceoff_wins: awayFaceoffsWon,
            faceoff_losses: awayFaceoffsTaken - awayFaceoffsWon,
            faceoff_pct: awayFaceoffsTaken > 0 ? (awayFaceoffsWon / awayFaceoffsTaken) * 100 : 0,
            passing_pct:
              Number.parseInt(awayClub.passa || "0", 10) > 0
                ? (Number.parseInt(awayClub.passc || "0", 10) / Number.parseInt(awayClub.passa || "0", 10)) * 100
                : 0,
            shot_attempts: awayShotAttempts,
            shot_pct: awayShotAttempts > 0 ? (Number.parseInt(awayClub.shots || "0", 10) / awayShotAttempts) * 100 : 0,
            pass_attempts: Number.parseInt(awayClub.passa || "0", 10),
            pass_complete: Number.parseInt(awayClub.passc || "0", 10),
            time_in_offensive_zone: Number.parseInt(awayClub.toa || "0", 10),
            time_in_defensive_zone: 0,
            time_in_neutral_zone: 0,
            takeaways: awayTakeaways,
            giveaways: awayGiveaways,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          teamStatsToInsert.push(awayTeamStats)
          console.log("Away team stats prepared:", awayTeamStats)
        }

        // Insert team stats if we have any
        if (teamStatsToInsert.length > 0) {
          console.log(`Inserting ${teamStatsToInsert.length} team stats records`)

          const { error: insertTeamStatsError } = await supabase.from(T.eaTeamStats).insert(teamStatsToInsert)

          if (insertTeamStatsError) {
            console.error("Error inserting team stats:", insertTeamStatsError)
          } else {
            console.log(`Successfully inserted team stats into ${T.eaTeamStats}`)
          }
        }
      }
    } catch (teamStatsError) {
      console.error("Error processing team stats in update-from-ea:", teamStatsError)
      // Don't fail the entire operation if team stats fail
    }

    console.log(`=== MATCH UPDATE SUCCESSFUL (AUTHORIZATION BYPASSED) [${leagueFinal}] ===`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating match from EA data:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

// ------ UPDATED: standings updater accepts teams table name ------
async function updateTeamStandings(
  supabase: any,
  teamsTable: string,
  homeTeamId: string,
  awayTeamId: number | string,
  homeScore: number,
  awayScore: number,
  hasOvertime: boolean,
) {
  try {
    // Get current team records
    const { data: homeTeam } = await supabase
      .from(teamsTable)
      .select("wins, losses, otl, goals_for, goals_against")
      .eq("id", homeTeamId)
      .single()

    const { data: awayTeam } = await supabase
      .from(teamsTable)
      .select("wins, losses, otl, goals_for, goals_against")
      .eq("id", awayTeamId)
      .single()

    if (!homeTeam || !awayTeam) return

    // Determine win/loss/otl
    let homeWins = homeTeam.wins
    let homeLosses = homeTeam.losses
    let homeOtl = homeTeam.otl
    let awayWins = awayTeam.wins
    let awayLosses = awayTeam.losses
    let awayOtl = awayTeam.otl

    if (homeScore > awayScore) {
      // Home team won
      homeWins += 1
      if (hasOvertime) {
        awayOtl += 1
      } else {
        awayLosses += 1
      }
    } else {
      // Away team won
      awayWins += 1
      if (hasOvertime) {
        homeOtl += 1
      } else {
        homeLosses += 1
      }
    }

    // Update home team
    await supabase
      .from(teamsTable)
      .update({
        wins: homeWins,
        losses: homeLosses,
        otl: homeOtl,
        goals_for: homeTeam.goals_for + homeScore,
        goals_against: homeTeam.goals_against + awayScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", homeTeamId)

    // Update away team
    await supabase
      .from(teamsTable)
      .update({
        wins: awayWins,
        losses: awayLosses,
        otl: awayOtl,
        goals_for: awayTeam.goals_for + awayScore,
        goals_against: awayTeam.goals_against + homeScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", awayTeamId)
  } catch (error) {
    console.error("Error updating team standings:", error)
  }
}
