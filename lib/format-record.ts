/**
 * Shared helper to format a team's standings record consistently across the site.
 *
 * Display order is W / OTW / OTL / L (e.g. "5-1-2-0"):
 *  - W   = regulation wins + forfeit wins (ffw)
 *  - OTW = overtime wins
 *  - OTL = overtime losses
 *  - L   = regulation losses + forfeit losses (ffl)
 *
 * Both the NHL and AHL standings calculators store regulation wins/losses
 * separately from ffw/ffl.  The FFW/FFL columns in the standings table show
 * the raw counts; the compact record folds them into W and L for display.
 */
export interface RecordLike {
  wins?: number | null
  losses?: number | null
  otl?: number | null
  otw?: number | null
  ffw?: number | null
  ffl?: number | null
}

export function formatStandingsRecord(team: RecordLike | null | undefined): string {
  const wins = (team?.wins ?? 0) + (team?.ffw ?? 0)
  const otw = team?.otw ?? 0
  const otl = team?.otl ?? 0
  const losses = (team?.losses ?? 0) + (team?.ffl ?? 0)
  return `${wins}-${otw}-${otl}-${losses}`
}
