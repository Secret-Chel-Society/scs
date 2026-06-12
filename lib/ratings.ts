// /lib/ratings.ts
// Rating engine for EA player stats
// - 20 discrete levels per metric (1..20)
// - Ratings are 50..100 overall, null if GP < MIN_GAMES
// - Separate models for Offense (C/LW/RW), Defense (LD/RD), Goalie (G)
// - "Total" = average of Offense & Defense when both exist, else whichever applies
// - Lineup labels per your tiers

export type AggregatedSkater = {
  player_name: string
  position?: string | number // "C","LW","RW","LD","RD","G" or 0..5 EA codes
  season_id: number | string
  games_played: number

  goals: number
  assists: number
  plus_minus: number
  takeaways: number
  giveaways: number
  interceptions?: number
  hits?: number
  blocks?: number

  wins?: number
  losses?: number
  otl?: number

  pass_attempted?: number
  pass_completed?: number
  passing_pct?: number // optional direct pct (0..100 or 0..1)
}

export type AggregatedGoalie = {
  player_name: string
  position?: string | number // "G" or 0
  season_id: number | string
  games_played: number
  saves: number
  goals_against: number
  save_pct?: number // 0..1; if missing, computed from shots
  total_shots_faced?: number // optional (saves + GA)

  wins?: number
  losses?: number
  otl?: number
}

export type RatingResult = {
  rating: number | null
  label: string | null
  levels: Record<string, number> // 1..20 per metric
}

export const MIN_GAMES = 3

// -----------------------------
// Utility helpers
// -----------------------------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function toLevel(value: number, min: number, max: number, inverse = false): number {
  if (!isFinite(value)) return 1
  const v = clamp(value, Math.min(min, max), Math.max(min, max))
  const t = (v - min) / (max - min || 1)
  const scaled = inverse ? 1 - t : t
  return clamp(Math.floor(scaled * 20) + 1, 1, 20)
}

function resolvePercent(pct?: number, completed?: number, attempted?: number): number {
  if (attempted && attempted > 0 && isFinite(completed ?? 0)) {
    return clamp(((completed ?? 0) / attempted) * 100, 0, 100)
  }
  if (pct == null) return 0
  return pct <= 1 ? clamp(pct * 100, 0, 100) : clamp(pct, 0, 100)
}

function perGame(v: number | undefined, gp: number): number {
  const n = Number(v || 0)
  return gp > 0 ? n / gp : 0
}

// points% where OTL = half a win
function recordPointsPct(w?: number, l?: number, otl?: number, gp?: number): number {
  const gpN = gp || 0
  if (gpN <= 0) return 0
  const wN = w || 0
  const otN = otl || 0
  return clamp((wN + 0.5 * otN) / gpN, 0, 1)
}

function finalizeOverall(score01: number): number {
  const raw = 50 + clamp(score01, 0, 1) * 50
  return Math.round(raw)
}

// Lineup label thresholds
export function lineupLabel(overall: number | null): string | null {
  if (overall == null) return null
  if (overall >= 95) return "Elite"
  if (overall >= 90) return "Great"
  if (overall >= 85) return "Starter"
  if (overall >= 80) return "Mid"
  if (overall >= 75) return "Depth"
  if (overall >= 70) return "Bench"
  if (overall >= 65) return "AHL Line 1"
  if (overall >= 60) return "AHL Line 2"
  if (overall >= 55) return "AHL Line 3"
  return "AHL Line 3"
}

// Position normalization
export function normalizePos(pos?: string | number): "C"|"LW"|"RW"|"LD"|"RD"|"G"|"UNK" {
  if (pos === 0 || pos === "0" || String(pos).toUpperCase() === "G") return "G"
  if (pos === 1 || pos === "1" || String(pos).toUpperCase() === "RD") return "RD"
  if (pos === 2 || pos === "2" || String(pos).toUpperCase() === "LD") return "LD"
  if (pos === 3 || pos === "3" || String(pos).toUpperCase() === "RW") return "RW"
  if (pos === 4 || pos === "4" || String(pos).toUpperCase() === "LW") return "LW"
  if (pos === 5 || pos === "5" || String(pos).toUpperCase() === "C") return "C"
  return "UNK"
}

// -----------------------------
// Offense (C/LW/RW)
// Ranges:
//  - PPG:     0.00..6.00
//  - +/-:   -100..+100
//  - A/GP:    0.00..4.00
//  - G/GP:    0.00..2.50
//  - TKA/GP:  0.00..8.00
//  - Pass%:  50.0..90.0
//  - GVA/GP: 25.0..5.0 (inverse)
//  - REC%:    0.00..1.00  (W + 0.5*OTL)/GP
// Weights sum to 1.00
// -----------------------------
const OFFENSE_WEIGHTS = {
  ppg: 0.32,
  goalsPer: 0.15,
  assistsPer: 0.10,
  plusMinus: 0.10,
  takeawaysPer: 0.05,
  passPct: 0.07,
  giveawaysPer: 0.06,
  recordPct: 0.15,
} as const

export function computeSkaterOffenseRating(s: AggregatedSkater): RatingResult {
  if ((s.games_played || 0) < MIN_GAMES) return { rating: null, label: null, levels: {} }

  const gp = s.games_played
  const pointsPer = perGame((s.goals || 0) + (s.assists || 0), gp)
  const goalsPer = perGame(s.goals, gp)
  const assistsPer = perGame(s.assists, gp)
  const takeawaysPer = perGame(s.takeaways, gp)
  const giveawaysPer = perGame(s.giveaways, gp)
  const passPct = resolvePercent(s.passing_pct, s.pass_completed, s.pass_attempted)
  const recPct = recordPointsPct(s.wins, s.losses, s.otl, gp)

  const lvl_ppg        = toLevel(pointsPer,     0.0, 5.5)
  const lvl_plusminus  = toLevel(s.plus_minus || 0, -50, 50)
  const lvl_assistsPer = toLevel(assistsPer,    0.0, 2.5)
  const lvl_goalsPer   = toLevel(goalsPer,      0.0, 2.5)
  const lvl_tkaPer     = toLevel(takeawaysPer,  0.0, 4.0)
  const lvl_passPct    = toLevel(passPct,      55.0, 90.0)
  const lvl_gvaPer     = toLevel(giveawaysPer, 25.0, 7.0, true)
  const lvl_rec        = toLevel(recPct,        0.25, .85)

  const levels = {
    ppg: lvl_ppg,
    plus_minus: lvl_plusminus,
    assists_per: lvl_assistsPer,
    goals_per: lvl_goalsPer,
    takeaways_per: lvl_tkaPer,
    pass_pct: lvl_passPct,
    giveaways_per: lvl_gvaPer,
    record_pct: lvl_rec,
  }

  const to01 = (lvl: number) => (lvl - 1) / 19
  const score01 =
    to01(lvl_ppg)        * OFFENSE_WEIGHTS.ppg +
    to01(lvl_goalsPer)   * OFFENSE_WEIGHTS.goalsPer +
    to01(lvl_assistsPer) * OFFENSE_WEIGHTS.assistsPer +
    to01(lvl_plusminus)  * OFFENSE_WEIGHTS.plusMinus +
    to01(lvl_tkaPer)     * OFFENSE_WEIGHTS.takeawaysPer +
    to01(lvl_passPct)    * OFFENSE_WEIGHTS.passPct +
    to01(lvl_gvaPer)     * OFFENSE_WEIGHTS.giveawaysPer +
    to01(lvl_rec)        * OFFENSE_WEIGHTS.recordPct

  const rating = finalizeOverall(score01)
  return { rating, label: lineupLabel(rating), levels }
}

// -----------------------------
// Defense (LD/RD)
// Ranges:
//  - PPG:     0.00..3.50
//  - G/GP:    0.00..1.50
//  - A/GP:    0.00..2.50
//  - +/-:   -100..+100
//  - GVA/GP: 15.0..3.0 (inverse)
//  - TKA/GP: 0.00..8.00
//  - Hits/G: 0.00..12.0
//  - INT/G:  0.00..5.00
//  - BLK/G:  0.00..6.00
//  - Pass%:  40.0..85.0
//  - REC%:   0.00..1.00
// Weights sum to 1.00
// -----------------------------
const DEFENSE_WEIGHTS = {
  plusMinus: 0.25,
  takeawaysPer: 0.15,
  interceptionsPer: 0.06,
  hitsPer: 0.03,
  blocksPer: 0.09,
  giveawaysPer: 0.06,
  passPct: 0.05,
  ppg: 0.07,
  assistsPer: 0.09,
  goalsPer: 0.08,
  recordPct: 0.10,
} as const

export function computeSkaterDefenseRating(s: AggregatedSkater): RatingResult {
  if ((s.games_played || 0) < MIN_GAMES) return { rating: null, label: null, levels: {} }

  const gp = s.games_played
  const pointsPer = perGame((s.goals || 0) + (s.assists || 0), gp)
  const goalsPer = perGame(s.goals, gp)
  const assistsPer = perGame(s.assists, gp)
  const takeawaysPer = perGame(s.takeaways, gp)
  const interceptionsPer = perGame(s.interceptions || 0, gp)
  const hitsPer = perGame(s.hits || 0, gp)
  const blocksPer = perGame(s.blocks || 0, gp)
  const giveawaysPer = perGame(s.giveaways, gp)
  const passPct = resolvePercent(s.passing_pct, s.pass_completed, s.pass_attempted)
  const recPct = recordPointsPct(s.wins, s.losses, s.otl, gp)

  const lvl_ppg        = toLevel(pointsPer,        0.0, 2.2)
  const lvl_goalsPer   = toLevel(goalsPer,         0.0, 0.5)
  const lvl_assistsPer = toLevel(assistsPer,       0.0, 1.8)
  const lvl_plusminus  = toLevel(s.plus_minus||0, -100, 50)
  const lvl_gvaPer     = toLevel(giveawaysPer,    16.0, 5.5, true)
  const lvl_tkaPer     = toLevel(takeawaysPer,     0.0, 4.0)
  const lvl_hitsPer    = toLevel(hitsPer,          0.0, 7.0)
  const lvl_intPer     = toLevel(interceptionsPer, 0.0, 2.5)
  const lvl_blkPer     = toLevel(blocksPer,        0.0, 2.0)
  const lvl_passPct    = toLevel(passPct,         50.0, 88.0)
  const lvl_rec        = toLevel(recPct,           0.25, .85)

  const levels = {
    ppg: lvl_ppg,
    goals_per: lvl_goalsPer,
    assists_per: lvl_assistsPer,
    plus_minus: lvl_plusminus,
    giveaways_per: lvl_gvaPer,
    takeaways_per: lvl_tkaPer,
    hits_per: lvl_hitsPer,
    interceptions_per: lvl_intPer,
    blocks_per: lvl_blkPer,
    pass_pct: lvl_passPct,
    record_pct: lvl_rec,
  }

  const to01 = (lvl: number) => (lvl - 1) / 19
  const score01 =
    to01(lvl_plusminus)  * DEFENSE_WEIGHTS.plusMinus +
    to01(lvl_tkaPer)     * DEFENSE_WEIGHTS.takeawaysPer +
    to01(lvl_intPer)     * DEFENSE_WEIGHTS.interceptionsPer +
    to01(lvl_hitsPer)    * DEFENSE_WEIGHTS.hitsPer +
    to01(lvl_blkPer)     * DEFENSE_WEIGHTS.blocksPer +
    to01(lvl_gvaPer)     * DEFENSE_WEIGHTS.giveawaysPer +
    to01(lvl_passPct)    * DEFENSE_WEIGHTS.passPct +
    to01(lvl_ppg)        * DEFENSE_WEIGHTS.ppg +
    to01(lvl_assistsPer) * DEFENSE_WEIGHTS.assistsPer +
    to01(lvl_goalsPer)   * DEFENSE_WEIGHTS.goalsPer +
    to01(lvl_rec)        * DEFENSE_WEIGHTS.recordPct

  const rating = finalizeOverall(score01)
  return { rating, label: lineupLabel(rating), levels }
}

// -----------------------------
// Goalie
// Ranges:
//  - SV%:  0.600..0.860
//  - GAA:  6.00..1.00 (inverse)
//  - REC%: 0.00..1.00
// Weights sum to 1.00
// -----------------------------
const GOALIE_WEIGHTS = {
  savePct: 0.60,
  gaa: 0.15,
  recordPct: 0.25,
} as const

export function computeGoalieRating(g: AggregatedGoalie): RatingResult {
  if ((g.games_played || 0) < MIN_GAMES) return { rating: null, label: null, levels: {} }

  // resolve save% 0..1
  let sv = g.save_pct
  if (sv == null) {
    const shots = g.total_shots_faced ?? ((g.saves || 0) + (g.goals_against || 0))
    sv = shots > 0 ? (g.saves || 0) / shots : 0
  }
  const gaa = g.games_played > 0 ? (g.goals_against || 0) / g.games_played : 99
  const recPct = recordPointsPct(g.wins, g.losses, g.otl, g.games_played)

  const lvl_sv   = toLevel(sv ?? 0, 0.600, 0.870)
  const lvl_gaa  = toLevel(gaa, 6.00, 1.00, true)
  const lvl_rec  = toLevel(recPct, 0.00, 1.00)

  const levels = {
    save_pct: lvl_sv,
    gaa: lvl_gaa,
    record_pct: lvl_rec,
  }

  const to01 = (lvl: number) => (lvl - 1) / 19
  const score01 =
    to01(lvl_sv)  * GOALIE_WEIGHTS.savePct +
    to01(lvl_gaa) * GOALIE_WEIGHTS.gaa +
    to01(lvl_rec) * GOALIE_WEIGHTS.recordPct

  const rating = finalizeOverall(score01)
  return { rating, label: lineupLabel(rating), levels }
}

// -----------------------------
// Combined / convenience
// -----------------------------
export function computeSkaterTotalRating(sOff?: AggregatedSkater | null, sDef?: AggregatedSkater | null): RatingResult {
  const off = sOff ? computeSkaterOffenseRating(sOff) : null
  const def = sDef ? computeSkaterDefenseRating(sDef) : null

  if ((!off || off.rating == null) && (!def || def.rating == null)) {
    return { rating: null, label: null, levels: {} }
  }
  if (!off || off.rating == null) return def!
  if (!def || def.rating == null) return off

  const avg = Math.round((off.rating + def.rating) / 2)
  return { rating: avg, label: lineupLabel(avg), levels: { ...off.levels, ...def.levels } }
}

export function computeBestRatingForRow(row: AggregatedSkater | AggregatedGoalie): RatingResult {
  const pos = normalizePos((row as any).position)
  if (pos === "G") return computeGoalieRating(row as AggregatedGoalie)
  if (pos === "LD" || pos === "RD") return computeSkaterDefenseRating(row as AggregatedSkater)
  if (pos === "C"  || pos === "LW" || pos === "RW") return computeSkaterOffenseRating(row as AggregatedSkater)
  return computeSkaterOffenseRating(row as AggregatedSkater)
}

export function attachRatingsToRow(row: any, activeTab: "total"|"offense"|"defense"|"goalies") {
  const pos = normalizePos(row.position)
  let rOff: RatingResult | null = null
  let rDef: RatingResult | null = null
  let rTot: RatingResult | null = null
  let rG  : RatingResult | null = null

  if (activeTab === "goalies" || pos === "G") {
    rG = computeGoalieRating(row as AggregatedGoalie)
  } else {
    rOff = computeSkaterOffenseRating(row as AggregatedSkater)
    rDef = computeSkaterDefenseRating(row as AggregatedSkater)
    rTot = computeSkaterTotalRating(row, row)
  }

  return {
    ...row,
    rating_offense: rOff?.rating ?? null,
    rating_offense_label: rOff?.label ?? null,
    rating_defense: rDef?.rating ?? null,
    rating_defense_label: rDef?.label ?? null,
    rating_total: rTot?.rating ?? null,
    rating_total_label: rTot?.label ?? null,
    rating_goalie: rG?.rating ?? null,
    rating_goalie_label: rG?.label ?? null,
  }
}

// ---- Compatibility aliases for legacy imports ----
export const rateDefense = computeSkaterDefenseRating
export const rateOffense = computeSkaterOffenseRating
export const rateGoalie  = computeGoalieRating
export const rateTotal   = computeSkaterTotalRating
export const LineupLabel = lineupLabel
