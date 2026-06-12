import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    console.log("Initialize draft picks API called")
    const supabase = createAdminClient()

    const { league } = await request.json()
    console.log("League requested:", league)

    if (!league || !["nhl", "ahl"].includes(league)) {
      return NextResponse.json({ error: "Invalid league specified" }, { status: 400 })
    }

    console.log("Admin client initialized, proceeding...")

    const isNHL = league === "nhl"
    const seasonsTable = isNHL ? "seasons" : "seasons_ahl"
    const teamSeasonsTable = isNHL ? "team_seasons" : "team_seasons_ahl"
    const teamsTable = isNHL ? "teams" : "teams_ahl"
    const picksTable = isNHL ? "tradeable_draft_picks" : "tradeable_draft_picks_ahl"
    const settingsTable = isNHL ? "system_settings" : "system_settings_ahl"

    // Fetch current season from system_settings
    let currentSeasonId: string | null = null
    let currentSeasonNumber = 1

    if (isNHL) {
      const { data: settings } = await supabase
        .from("system_settings")
        .select("current_season_id")
        .eq("id", "default")
        .single()
      
      if (settings?.current_season_id) {
        currentSeasonId = settings.current_season_id
        const { data: seasonData } = await supabase
          .from("seasons")
          .select("id, season_number")
          .eq("id", currentSeasonId)
          .single()
        if (seasonData) {
          currentSeasonNumber = seasonData.season_number
        }
      }
    } else {
      // For AHL, try to get from system_settings_ahl - if not available, return error
      try {
        const { data: ahlSettings, error: ahlError } = await supabase
          .from("system_settings_ahl")
          .select("current_season_id")
          .eq("id", "default")
          .single()
        
        if (ahlError || !ahlSettings?.current_season_id) {
          return NextResponse.json(
            { error: "AHL season not available. No AHL draft picks can be created." },
            { status: 400 }
          )
        }
        
        currentSeasonId = ahlSettings.current_season_id
        const { data: seasonData } = await supabase
          .from("seasons_ahl")
          .select("id, season_number")
          .eq("id", currentSeasonId)
          .single()
        if (seasonData) {
          currentSeasonNumber = seasonData.season_number
        } else {
          return NextResponse.json(
            { error: "AHL season data not found." },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: "AHL tables not available." },
          { status: 400 }
        )
      }
    }

    const nextSeason = currentSeasonNumber + 1

    console.log("Current season number:", currentSeasonNumber)
    console.log("Next season (draft):", nextSeason)

    // Fetch current season record
    const { data: currentSeason, error: seasonError } = await supabase
      .from(seasonsTable)
      .select("id")
      .eq("season_number", currentSeasonNumber)
      .maybeSingle()

    console.log("Current season data:", currentSeason)
    console.log("Season error:", seasonError)

    if (seasonError || !currentSeason) {
      console.error("Fetch current season error:", seasonError)
      return NextResponse.json({ error: "Failed to fetch current season" }, { status: 500 })
    }

    console.log("Fetching teams for season ID:", currentSeason.id)

    const { data: teamSeasons, error: teamSeasonsError } = await supabase
      .from(teamSeasonsTable)
      .select(`
        team_id,
        ${teamsTable}:team_id (
          id,
          name
        )
      `)
      .eq("season_id", currentSeason.id)

    console.log("Team seasons data:", teamSeasons)
    console.log("Team seasons error:", teamSeasonsError)

    if (teamSeasonsError || !teamSeasons) {
      console.error("Fetch team_seasons error:", teamSeasonsError)
      return NextResponse.json({ error: "Failed to fetch teams for current season" }, { status: 500 })
    }

    const teams = teamSeasons.map((ts: any) => ts[teamsTable]).filter((team: any) => team && team.id)

    console.log("Teams found:", teams.length)
    console.log("Teams:", teams)

    if (teams.length === 0) {
      return NextResponse.json({ error: "No teams found for current season" }, { status: 404 })
    }

    // Create 3 draft picks (rounds 1-3) for each team
    const draftPicks = []
    for (const team of teams) {
      for (let round = 1; round <= 3; round++) {
        draftPicks.push({
          season_number: nextSeason,
          round,
          original_team_id: team.id,
          current_team_id: team.id,
          is_traded: false,
        })
      }
    }

    console.log("Draft picks to insert:", draftPicks.length)
    console.log("Sample draft pick:", draftPicks[0])

    const { data: insertedPicks, error: insertErr } = await supabase.from(picksTable).insert(draftPicks).select()

    console.log("Insert result:", insertedPicks)
    console.log("Insert error:", insertErr)

    if (insertErr) {
      console.error("Insert picks error:", insertErr)
      return NextResponse.json(
        {
          error: insertErr.message,
          details: insertErr,
          hint: "Check if draft picks already exist for this season",
        },
        { status: 500 },
      )
    }

    console.log("Successfully inserted draft picks")

    return NextResponse.json({
      message: `Initialized ${draftPicks.length} draft picks for ${league.toUpperCase()} Season ${nextSeason}`,
      count: draftPicks.length,
      teamsCount: teams.length,
    })
  } catch (err) {
    console.error("Initialize-draft-picks fatal error:", err)
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 })
  }
}
