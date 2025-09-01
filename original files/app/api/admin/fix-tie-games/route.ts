import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { calculateStandings, getCurrentSeasonId } from "@/lib/standings-calculator"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current season
    const currentSeasonId = await getCurrentSeasonId()

    // Find all tie games (1-1, 2-2, etc.)
    const { data: tieGames, error: tieError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, home_score, away_score, season_name")
      .eq("season_name", `Season ${currentSeasonId}`)
      .in("status", ["completed", "Completed", "COMPLETED"])
      .not("home_score", "is", null)
      .not("away_score", "is", null)

    if (tieError) {
      return NextResponse.json({ error: `Error fetching matches: ${tieError.message}` }, { status: 500 })
    }

    // Filter for actual tie games
    const actualTieGames = tieGames?.filter((match) => match.home_score === match.away_score) || []

    console.log(`Found ${actualTieGames.length} tie games`)

    // Recalculate standings to apply the new tie game logic
    const standings = await calculateStandings(currentSeasonId)

    // Update team statistics in the database
    for (const team of standings) {
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          wins: team.wins,
          losses: team.losses,
          otl: team.otl,
          goals_for: team.goals_for,
          goals_against: team.goals_against,
          points: team.points,
          games_played: team.games_played,
          updated_at: new Date().toISOString(),
        })
        .eq("id", team.id)

      if (updateError) {
        console.error(`Error updating team ${team.id}:`, updateError)
        return NextResponse.json({ error: `Error updating team stats: ${updateError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${actualTieGames.length} tie games and updated standings`,
      tieGames: actualTieGames.map((game) => ({
        id: game.id,
        score: `${game.home_score}-${game.away_score}`,
        teams: `${game.home_team_id} vs ${game.away_team_id}`,
      })),
      updatedTeams: standings.length,
    })
  } catch (error: any) {
    console.error("Error fixing tie games:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
