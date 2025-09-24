import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { seasonId } = await request.json()

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID is required" }, { status: 400 })
    }

    // Check if user is authenticated and is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // 1. Get all matches for the season
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, status")
      .eq("season_id", seasonId)
      .eq("status", "completed")

    if (matchesError) {
      return NextResponse.json({ error: `Error fetching matches: ${matchesError.message}` }, { status: 500 })
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ message: "No completed matches found for this season" }, { status: 200 })
    }

    const matchIds = matches.map((match) => match.id)

    // 2. Get all player stats for these matches
    const { data: playerStats, error: playerStatsError } = await supabase
      .from("player_stats")
      .select("*, player_id, match_id, position")
      .in("match_id", matchIds)

    if (playerStatsError) {
      return NextResponse.json({ error: `Error fetching player stats: ${playerStatsError.message}` }, { status: 500 })
    }

    // 3. Get all goalie stats for these matches
    const { data: goalieStats, error: goalieStatsError } = await supabase
      .from("goalie_stats")
      .select("*, player_id, match_id")
      .in("match_id", matchIds)

    if (goalieStatsError) {
      return NextResponse.json({ error: `Error fetching goalie stats: ${goalieStatsError.message}` }, { status: 500 })
    }

    // 4. Group player stats by player and position
    const playerStatsMap = new Map()

    if (playerStats && playerStats.length > 0) {
      playerStats.forEach((stat) => {
        const key = `${stat.player_id}_${stat.position}`
        if (!playerStatsMap.has(key)) {
          playerStatsMap.set(key, {
            player_id: stat.player_id,
            position: stat.position,
            games_played: 0,
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            hits: 0,
            giveaways: 0,
            takeaways: 0,
            interceptions: 0,
            pass_attempted: 0,
            pass_completed: 0,
            pk_clearzone: 0,
            pk_drawn: 0,
            faceoff_wins: 0,
            faceoff_losses: 0,
            time_with_puck: 0,
          })
        }

        const playerStat = playerStatsMap.get(key)
        playerStat.games_played += 1
        playerStat.goals += stat.goals || 0
        playerStat.assists += stat.assists || 0
        playerStat.points += (stat.goals || 0) + (stat.assists || 0)
        playerStat.plus_minus += stat.plus_minus || 0
        playerStat.pim += stat.pim || 0
        playerStat.shots += stat.shots || 0
        playerStat.ppg += stat.ppg || 0
        playerStat.shg += stat.shg || 0
        playerStat.gwg += stat.gwg || 0
        playerStat.hits += stat.hits || 0
        playerStat.giveaways += stat.giveaways || 0
        playerStat.takeaways += stat.takeaways || 0
        playerStat.interceptions += stat.interceptions || 0
        playerStat.pass_attempted += stat.pass_attempted || 0
        playerStat.pass_completed += stat.pass_completed || 0
        playerStat.pk_clearzone += stat.pk_clearzone || 0
        playerStat.pk_drawn += stat.pk_drawn || 0
        playerStat.faceoff_wins += stat.faceoff_wins || 0
        playerStat.faceoff_losses += stat.faceoff_losses || 0
        playerStat.time_with_puck += stat.time_with_puck || 0
      })
    }

    // 5. Group goalie stats by player
    const goalieStatsMap = new Map()

    if (goalieStats && goalieStats.length > 0) {
      goalieStats.forEach((stat) => {
        if (!goalieStatsMap.has(stat.player_id)) {
          goalieStatsMap.set(stat.player_id, {
            player_id: stat.player_id,
            games_played: 0,
            wins: 0,
            losses: 0,
            otl: 0,
            saves: 0,
            shots_against: 0,
            goals_against: 0,
            shutouts: 0,
          })
        }

        const goalieStat = goalieStatsMap.get(stat.player_id)
        goalieStat.games_played += 1
        goalieStat.saves += stat.saves || 0
        goalieStat.shots_against += stat.shots_against || 0
        goalieStat.goals_against += stat.goals_against || 0
        goalieStat.shutouts += stat.shutout ? 1 : 0

        // Determine win/loss/otl (simplified logic)
        // In a real implementation, you'd need to check the match result
        // and determine if this goalie's team won or lost
        const match = matches.find((m) => m.id === stat.match_id)
        if (match) {
          // For now, just assume a win if saves > goals_against * 3
          if (stat.saves > stat.goals_against * 3) {
            goalieStat.wins += 1
          } else if (stat.goals_against > 3) {
            goalieStat.losses += 1
          } else {
            goalieStat.otl += 1
          }
        }
      })
    }

    // 6. Upsert player season stats
    for (const [key, stats] of playerStatsMap.entries()) {
      const shooting_pct = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0

      // Check if stats already exist
      const { data: existingStats, error: existingStatsError } = await supabase
        .from("player_season_stats")
        .select("id")
        .eq("player_id", stats.player_id)
        .eq("season_id", seasonId)
        .eq("position", stats.position)
        .single()

      if (existingStatsError && existingStatsError.code !== "PGRST116") {
        // PGRST116 is the error code for "no rows returned"
        console.error(`Error checking existing stats for ${key}:`, existingStatsError)
        continue
      }

      if (existingStats) {
        // Update existing stats
        const { error: updateError } = await supabase
          .from("player_season_stats")
          .update({
            games_played: stats.games_played,
            goals: stats.goals,
            assists: stats.assists,
            points: stats.points,
            plus_minus: stats.plus_minus,
            pim: stats.pim,
            shots: stats.shots,
            shooting_pct: shooting_pct,
            ppg: stats.ppg,
            shg: stats.shg,
            gwg: stats.gwg,
            hits: stats.hits,
            giveaways: stats.giveaways,
            takeaways: stats.takeaways,
            interceptions: stats.interceptions,
            pass_attempted: stats.pass_attempted,
            pass_completed: stats.pass_completed,
            pk_clearzone: stats.pk_clearzone,
            pk_drawn: stats.pk_drawn,
            faceoff_wins: stats.faceoff_wins,
            faceoff_losses: stats.faceoff_losses,
            time_with_puck: stats.time_with_puck,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStats.id)

        if (updateError) {
          console.error(`Error updating stats for ${key}:`, updateError)
        }
      } else {
        // Insert new stats
        const { error: insertError } = await supabase.from("player_season_stats").insert({
          player_id: stats.player_id,
          season_id: seasonId,
          position: stats.position,
          games_played: stats.games_played,
          goals: stats.goals,
          assists: stats.assists,
          points: stats.points,
          plus_minus: stats.plus_minus,
          pim: stats.pim,
          shots: stats.shots,
          shooting_pct: shooting_pct,
          ppg: stats.ppg,
          shg: stats.shg,
          gwg: stats.gwg,
          hits: stats.hits,
          giveaways: stats.giveaways,
          takeaways: stats.takeaways,
          interceptions: stats.interceptions,
          pass_attempted: stats.pass_attempted,
          pass_completed: stats.pass_completed,
          pk_clearzone: stats.pk_clearzone,
          pk_drawn: stats.pk_drawn,
          faceoff_wins: stats.faceoff_wins,
          faceoff_losses: stats.faceoff_losses,
          time_with_puck: stats.time_with_puck,
        })

        if (insertError) {
          console.error(`Error inserting stats for ${key}:`, insertError)
        }
      }
    }

    // 7. Upsert goalie season stats
    for (const [playerId, stats] of goalieStatsMap.entries()) {
      const save_pct = stats.shots_against > 0 ? stats.saves / stats.shots_against : 0
      const gaa = stats.games_played > 0 ? stats.goals_against / stats.games_played : 0

      // Check if stats already exist
      const { data: existingStats, error: existingStatsError } = await supabase
        .from("goalie_season_stats")
        .select("id")
        .eq("player_id", playerId)
        .eq("season_id", seasonId)
        .single()

      if (existingStatsError && existingStatsError.code !== "PGRST116") {
        console.error(`Error checking existing goalie stats for ${playerId}:`, existingStatsError)
        continue
      }

      if (existingStats) {
        // Update existing stats
        const { error: updateError } = await supabase
          .from("goalie_season_stats")
          .update({
            games_played: stats.games_played,
            wins: stats.wins,
            losses: stats.losses,
            otl: stats.otl,
            saves: stats.saves,
            shots_against: stats.shots_against,
            goals_against: stats.goals_against,
            save_pct: save_pct,
            gaa: gaa,
            shutouts: stats.shutouts,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStats.id)

        if (updateError) {
          console.error(`Error updating goalie stats for ${playerId}:`, updateError)
        }
      } else {
        // Insert new stats
        const { error: insertError } = await supabase.from("goalie_season_stats").insert({
          player_id: playerId,
          season_id: seasonId,
          games_played: stats.games_played,
          wins: stats.wins,
          losses: stats.losses,
          otl: stats.otl,
          saves: stats.saves,
          shots_against: stats.shots_against,
          goals_against: stats.goals_against,
          save_pct: save_pct,
          gaa: gaa,
          shutouts: stats.shutouts,
        })

        if (insertError) {
          console.error(`Error inserting goalie stats for ${playerId}:`, insertError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Season statistics synchronized successfully",
      stats: {
        players: playerStatsMap.size,
        goalies: goalieStatsMap.size,
      },
    })
  } catch (error: any) {
    console.error("Error syncing season stats:", error)
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 })
  }
}
