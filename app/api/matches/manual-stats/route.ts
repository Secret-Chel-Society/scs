import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Create admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { match_id, season_id, player_stats } = body

    if (!match_id || !season_id || !Array.isArray(player_stats)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get match details to verify permissions
    const { data: match, error: matchError } = await supabaseAdmin
      .from("matches")
      .select("id, home_team_id, away_team_id, season_id")
      .eq("id", match_id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user has permission to edit this match
    const hasPermission = await checkUserPermission(session.user.id, match)
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Process each player's stats
    const results = []
    for (const playerStat of player_stats) {
      try {
        // Check if player stats already exist for this match
        const { data: existingStats, error: checkError } = await supabaseAdmin
          .from("ea_player_stats")
          .select("id")
          .eq("player_id", playerStat.player_id)
          .eq("match_id", match_id)
          .eq("season_id", season_id)
          .maybeSingle()

        if (checkError && checkError.code !== "PGRST116") {
          console.error("Error checking existing stats:", checkError)
          continue
        }

        const statsData = {
          player_id: playerStat.player_id,
          match_id: match_id,
          season_id: season_id,
          team_id: playerStat.team_id,
          games_played: 1, // Manual entry counts as 1 game played
          goals: playerStat.goals || 0,
          assists: playerStat.assists || 0,
          points: (playerStat.goals || 0) + (playerStat.assists || 0),
          shots: playerStat.shots || 0,
          hits: playerStat.hits || 0,
          plus_minus: playerStat.plus_minus || 0,
          pim: playerStat.pim || 0,
          ppg: playerStat.ppg || 0,
          shg: playerStat.shg || 0,
          gwg: playerStat.gwg || 0,
          giveaways: playerStat.giveaways || 0,
          takeaways: playerStat.takeaways || 0,
          faceoff_wins: playerStat.faceoff_wins || 0,
          faceoff_losses: playerStat.faceoff_losses || 0,
          // Goalie stats
          saves: playerStat.saves || null,
          shots_against: playerStat.shots_against || null,
          goals_against: playerStat.goals_against || null,
          // Calculate save percentage and GAA for goalies
          save_pct: playerStat.shots_against > 0 ? 
            ((playerStat.saves || 0) / playerStat.shots_against) * 100 : null,
          gaa: playerStat.goals_against !== undefined ? playerStat.goals_against : null,
          shutouts: (playerStat.goals_against === 0 && playerStat.shots_against > 0) ? 1 : 0,
          // Mark as manually entered
          manual_entry: true,
          updated_at: new Date().toISOString()
        }

        let result
        if (existingStats) {
          // Update existing stats
          const { data, error } = await supabaseAdmin
            .from("ea_player_stats")
            .update(statsData)
            .eq("id", existingStats.id)
            .select()

          result = { action: "updated", data, error }
        } else {
          // Insert new stats
          const { data, error } = await supabaseAdmin
            .from("ea_player_stats")
            .insert(statsData)
            .select()

          result = { action: "inserted", data, error }
        }

        if (result.error) {
          console.error(`Error ${result.action} stats for player ${playerStat.player_id}:`, result.error)
          results.push({
            player_id: playerStat.player_id,
            success: false,
            error: result.error.message
          })
        } else {
          results.push({
            player_id: playerStat.player_id,
            success: true,
            action: result.action
          })
        }
      } catch (err: any) {
        console.error(`Error processing stats for player ${playerStat.player_id}:`, err)
        results.push({
          player_id: playerStat.player_id,
          success: false,
          error: err.message
        })
      }
    }

    // Update match status to completed if it has a score
    const { data: matchData } = await supabaseAdmin
      .from("matches")
      .select("home_score, away_score")
      .eq("id", match_id)
      .single()

    if (matchData && (matchData.home_score > 0 || matchData.away_score > 0)) {
      await supabaseAdmin
        .from("matches")
        .update({ status: "Completed" })
        .eq("id", match_id)
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Successfully processed ${successCount} player stats${errorCount > 0 ? `, ${errorCount} errors` : ""}`,
      results,
      success_count: successCount,
      error_count: errorCount
    })

  } catch (error: any) {
    console.error("Error in manual stats API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to check user permissions
async function checkUserPermission(userId: string, match: any): Promise<boolean> {
  try {
    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "Admin")

    if (!adminError && adminData && adminData.length > 0) {
      return true
    }

    // Check if user is a team manager for either team
    const { data: teamManagerData, error: teamManagerError } = await supabaseAdmin
      .from("team_managers")
      .select("*")
      .eq("user_id", userId)
      .in("team_id", [match.home_team_id, match.away_team_id])

    if (!teamManagerError && teamManagerData && teamManagerData.length > 0) {
      return true
    }

    // Check if user is a player with manager role (GM, AGM, Owner)
    const { data: playerData, error: playerError } = await supabaseAdmin
      .from("players")
      .select("role")
      .eq("user_id", userId)
      .in("team_id", [match.home_team_id, match.away_team_id])

    if (!playerError && playerData) {
      const managerRoles = ["owner", "gm", "agm", "Owner", "GM", "AGM"]
      const isManager = playerData.some(player => {
        const role = (player.role || "").toLowerCase().trim()
        return managerRoles.includes(role)
      })

      if (isManager) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking user permission:", error)
    return false
  }
}
