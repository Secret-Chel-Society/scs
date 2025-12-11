import { createClient } from "@supabase/supabase-js"
import { calculateAHLStandings } from "./ahl-standings-calculator"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export interface AHLTeamStats {
  id: string
  name: string
  logo_url: string | null
  wins: number
  losses: number
  otl: number
  games_played: number
  points: number
  goals_for: number
  goals_against: number
  goal_differential: number
  shots_per_game?: number
  total_shots?: number
  powerplay_goals?: number
  powerplay_opportunities?: number
  powerplay_percentage?: number
  penalty_kill_goals_against?: number
  penalty_kill_opportunities?: number
  penalty_kill_percentage?: number
  division?: string
  conference?: string
  player_count?: number
  total_salary?: number
  cap_space?: number
}

/**
 * Gets statistics for all AHL teams
 * @param seasonId The season UUID to get statistics for
 * @returns An array of team statistics
 */
export async function getAllAHLTeamStats(seasonId: string): Promise<AHLTeamStats[]> {
  try {
    const standings = await calculateAHLStandings(seasonId)

    // Get shots data for teams - only from ea_team_stats_ahl and player stats
    const { data: eaTeamStats, error: eaTeamStatsError } = await supabase
      .from("ea_team_stats_ahl")
      .select("match_id, team_id, shots")
      .eq("season_id", seasonId)
      .or("status.eq.completed,status.eq.Completed")

    const shotsByTeam: Record<string, number> = {}

    if (!eaTeamStatsError && eaTeamStats) {
      // Calculate total shots by team from ea_team_stats_ahl
      eaTeamStats.forEach((stat) => {
        shotsByTeam[stat.team_id] = (shotsByTeam[stat.team_id] || 0) + (stat.shots || 0)
      })
    } else {
      // Fallback: try to get from ea_player_stats_ahl
      const { data: playerStats, error: playerStatsError } = await supabase
        .from("ea_player_stats_ahl")
        .select("team_id, shots")
        .not("team_id", "is", null)

      if (!playerStatsError && playerStats) {
        playerStats.forEach((stat) => {
          if (stat.team_id) {
            shotsByTeam[stat.team_id] = (shotsByTeam[stat.team_id] || 0) + (stat.shots || 0)
          }
        })
      }
    }

    // Get player counts and salaries from players table using team_id_ahl
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("team_id_ahl, salary")
      .not("team_id_ahl", "is", null)

    if (playerError) {
      console.error("Error fetching AHL player data:", playerError)
    }

    // Calculate player counts and salaries by team using team_id_ahl
    const playerCountByTeam: Record<string, number> = {}
    const totalSalaryByTeam: Record<string, number> = {}

    playerData?.forEach((player) => {
      if ((player as any).team_id_ahl) {
        const tid = (player as any).team_id_ahl as string
        playerCountByTeam[tid] = (playerCountByTeam[tid] || 0) + 1
        totalSalaryByTeam[tid] = (totalSalaryByTeam[tid] || 0) + ((player as any).salary || 0)
      }
    })

    // Combine standings with shots data and player counts
    return standings.map((team) => {
      const totalShots = shotsByTeam[team.id] || 0
      const shotsPerGame = team.games_played > 0 ? totalShots / team.games_played : 0

      const playerCount = playerCountByTeam[team.id] || 0
      const totalSalary = totalSalaryByTeam[team.id] || 0

      return {
        ...team,
        total_shots: totalShots,
        shots_per_game: Number(shotsPerGame.toFixed(1)),
        player_count: playerCount,
        total_salary: totalSalary,
        cap_space: 40000000 - totalSalary,
      }
    })
  } catch (error) {
    console.error("Error getting all AHL team stats:", error)
    return []
  }
}

/**
 * Gets statistics for a specific AHL team
 * @param teamId The team ID to get statistics for
 * @param seasonId The season UUID to get statistics for
 * @returns The team statistics or null if not found
 */
export async function getAHLTeamStats(teamId: string, seasonId: string): Promise<AHLTeamStats | null> {
  try {
    console.log("[v0] getAHLTeamStats called with:", { teamId, seasonId })

    const standings = await calculateAHLStandings(seasonId)

    console.log("[v0] AHL standings calculator returned:", standings.length, "teams")

    // Find the team in the standings
    const team = standings.find((t) => t.id === teamId)

    console.log("[v0] Found team in standings:", team ? team.name : "NOT FOUND")

    if (!team) {
      console.log("[v0] Team not found in AHL standings for teamId:", teamId)
      return null
    }

    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, salary")
      .eq("team_id_ahl", teamId)

    if (playerError) {
      console.error("Error fetching AHL player data:", playerError)
    }

    // Calculate total salary
    const totalSalary = playerData?.reduce((sum, player) => sum + ((player as any).salary || 0), 0) || 0

    return {
      ...team,
      player_count: playerData?.length || 0,
      total_salary: totalSalary,
      cap_space: 40000000 - totalSalary,
    }
  } catch (error) {
    console.error("Error getting AHL team stats:", error)
    return null
  }
}

/**
 * Gets the current AHL season ID
 * @returns The current season UUID
 */
export async function getCurrentAHLSeasonId(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("system_settings_ahl")
      .select("value")
      .eq("key", "current_season")
      .single()

    if (error) {
      console.error("Error fetching current AHL season:", error)
      return "1"
    }

    return data?.value || "1"
  } catch (error) {
    console.error("Error getting current AHL season:", error)
    return "1"
  }
}

/* ========================= NEW: Season-wide AHL player GP ================== */
/** Season totals object for AHL */
export type AHLPlayerSeasonTotals = { gp: number; g: number; a: number; pts: number }
/** Map keyed by player_id */
export type AHLPlayerTotalsMap = Map<string, AHLPlayerSeasonTotals>

/**
 * Get season-wide totals per player_id for the AHL (ignores team_id so trades don’t reset GP).
 * Assumes ea_player_stats_ahl has season_id and game_id.
 * If season is on matches_ahl instead, use the commented JOIN version.
 */
export async function getAHLPlayerSeasonTotalsMap(seasonId: string): Promise<AHLPlayerTotalsMap> {
  const { data, error } = await supabase
    .from("ea_player_stats_ahl")
    .select("player_id, game_id, goals, assists, points, season_id")
    .eq("season_id", seasonId)

  // If season_id is on matches_ahl instead of the stats table, use:
  // const { data, error } = await supabase
  //   .from("ea_player_stats_ahl")
  //   .select("player_id, game_id, goals, assists, points, matches_ahl!inner(season_id)")
  //   .eq("matches_ahl.season_id", seasonId)

  if (error) {
    console.error("getAHLPlayerSeasonTotalsMap error:", error)
    return new Map()
  }

  type Row = {
    player_id: string
    game_id: string
    goals?: number
    assists?: number
    points?: number
  }

  const agg = new Map<string, { gp: number; g: number; a: number; pts: number; games: Set<string> }>()
  for (const r of (data as Row[]) || []) {
    if (!r.player_id || !r.game_id) continue
    const rec = agg.get(r.player_id) ?? { gp: 0, g: 0, a: 0, pts: 0, games: new Set<string>() }
    if (!rec.games.has(r.game_id)) {
      rec.games.add(r.game_id)
      rec.gp++
    }
    rec.g += r.goals ?? 0
    rec.a += r.assists ?? 0
    rec.pts += r.points ?? ((r.goals ?? 0) + (r.assists ?? 0))
    agg.set(r.player_id, rec)
  }

  const out: AHLPlayerTotalsMap = new Map()
  for (const [player_id, r] of agg.entries()) {
    out.set(player_id, { gp: r.gp, g: r.g, a: r.a, pts: r.pts })
  }
  return out
}

/**
 * Merge AHL season totals into any players array you already have.
 * Adds: season_gp, season_g, season_a, season_pts (defaults to 0).
 */
export function mergeAHLSeasonTotalsIntoPlayers<T extends { id: string }>(
  players: T[],
  totals: AHLPlayerTotalsMap
): (T & { season_gp: number; season_g: number; season_a: number; season_pts: number })[] {
  return players.map((p) => {
    const t = totals.get(p.id)
    return {
      ...p,
      season_gp: t?.gp ?? 0,
      season_g: t?.g ?? 0,
      season_a: t?.a ?? 0,
      season_pts: t?.pts ?? 0,
    }
  })
}
/* ========================================================================== */
