"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type League = "NHL" | "AHL" | "ALLSTAR" | "AWHL"

interface EditScoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: any
  canEdit?: boolean
  onUpdate?: (updatedMatch: any) => void
  /** Which league/table to update (optional; will be inferred from URL if not provided) */
  league?: League
}

const pickTables = (league: League) => {
  if (league === "AHL") {
    return {
      matches: "matches_ahl",
      teams: "teams_ahl",
      // optional
      teamManagersAhl: "team_managers_ahl",
      teamManagersAllstar: "allstar_team_managers",
    }
  }
  if (league === "ALLSTAR") {
    return {
      matches: "allstar_matches",
      teams: "allstar_teams",
      // optional
      teamManagersAhl: "team_managers_ahl",
      teamManagersAllstar: "allstar_team_managers",
    }
  }
  if (league === "AWHL") {
    return {
      matches: "whl_matches",
      teams: "whl_teams",
      teamManagersAhl: "team_managers_ahl",
      teamManagersAllstar: "allstar_team_managers",
    }
  }
  // NHL default
  return {
    matches: "matches",
    teams: "teams",
    // optional
    teamManagersAhl: "team_managers_ahl",
    teamManagersAllstar: "allstar_team_managers",
  }
}

export function EditScoreModal({
  open,
  onOpenChange,
  match,
  canEdit = false,
  onUpdate,
  league, // no default here; we infer below
}: EditScoreModalProps) {
  const pathname = usePathname()
  const effectiveLeague: League =
    league
      ?? (pathname?.toLowerCase().includes("/allstar/") ? "ALLSTAR"
          : pathname?.toLowerCase().includes("/awhl/") ? "AWHL"
          : pathname?.toLowerCase().includes("/ahl/") ? "AHL"
          : "NHL")

  const T = pickTables(effectiveLeague)
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const [homeScore, setHomeScore] = useState<number>(match?.home_score ?? 0)
  const [awayScore, setAwayScore] = useState<number>(match?.away_score ?? 0)
  const [hasOvertime, setHasOvertime] = useState<boolean>(match?.has_overtime || match?.overtime || false)
  const [isForfeit, setIsForfeit] = useState<boolean>(match?.is_forfeit || false)
  const [forfeitTeamId, setForfeitTeamId] = useState<string | null>(match?.forfeit_team_id || null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [permissionChecked, setPermissionChecked] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Period scores state
  const [period1Home, setPeriod1Home] = useState<number>(0)
  const [period1Away, setPeriod1Away] = useState<number>(0)
  const [period2Home, setPeriod2Home] = useState<number>(0)
  const [period2Away, setPeriod2Away] = useState<number>(0)
  const [period3Home, setPeriod3Home] = useState<number>(0)
  const [period3Away, setPeriod3Away] = useState<number>(0)
  const [otHome, setOtHome] = useState<number>(0)
  const [otAway, setOtAway] = useState<number>(0)

  // Seed period scores
  useEffect(() => {
    if (match && match.period_scores) {
      try {
        const ps = typeof match.period_scores === "string" ? JSON.parse(match.period_scores) : match.period_scores
        setPeriod1Home(ps?.period1?.home ?? 0)
        setPeriod1Away(ps?.period1?.away ?? 0)
        setPeriod2Home(ps?.period2?.home ?? 0)
        setPeriod2Away(ps?.period2?.away ?? 0)
        setPeriod3Home(ps?.period3?.home ?? 0)
        setPeriod3Away(ps?.period3?.away ?? 0)
        setOtHome(ps?.overtime?.home ?? 0)
        setOtAway(ps?.overtime?.away ?? 0)
      } catch {
        setPeriod1Home(0); setPeriod1Away(0)
        setPeriod2Home(0); setPeriod2Away(0)
        setPeriod3Home(0); setPeriod3Away(0)
        setOtHome(0); setOtAway(0)
      }
    }
  }, [match])

  // Recompute totals from period values
  useEffect(() => {
    setHomeScore(period1Home + period2Home + period3Home + (hasOvertime ? otHome : 0))
    setAwayScore(period1Away + period2Away + period3Away + (hasOvertime ? otAway : 0))
  }, [period1Home, period2Home, period3Home, otHome, period1Away, period2Away, period3Away, otAway, hasOvertime])

  // Permission check (admin OR manager for either team)
  const checkPermission = async () => {
    if (!session?.user || !match) {
      setPermissionError("You must be logged in to edit match scores.")
      setPermissionChecked(true)
      return false
    }

    try {
      setError(null)
      setPermissionError(null)

      // Admin?
      const { data: adminData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["Admin", "admin"])
      if (adminData?.length) {
        setPermissionChecked(true)
        return true
      }

      // Team manager?
      let isManager = false
      const { data: tm } = await supabase
        .from("team_managers")
        .select("team_id, role")
        .eq("user_id", session.user.id)
        .in("team_id", [match.home_team_id, match.away_team_id])
      if (tm?.length) isManager = true

      // Try AHL-specific managers table if present (optional)
      if (!isManager && T.teamManagersAhl) {
        try {
          const { data: tmAhl, error: tmAhlErr } = await supabase
            .from(T.teamManagersAhl)
            .select("team_id, role")
            .eq("user_id", session.user.id)
            .in("team_id", [match.home_team_id, match.away_team_id])
          if (!tmAhlErr && tmAhl?.length) isManager = true
        } catch { /* ignore if table doesn't exist */ }
      }

      // Optional: All-Star specific managers table if you add one later
      if (!isManager && T.teamManagersAllstar) {
        try {
          const { data: tmAll, error: tmAllErr } = await supabase
            .from(T.teamManagersAllstar)
            .select("team_id, role")
            .eq("user_id", session.user.id)
            .in("team_id", [match.home_team_id, match.away_team_id])
          if (!tmAllErr && tmAll?.length) isManager = true
        } catch { /* ignore */ }
      }

      // Player-manager fallback (GM/AGM/Owner) — uses ONLY the players table (no players_ahl)
      if (!isManager) {
        const mgrRoles = ["owner", "gm", "agm", "Owner", "GM", "AGM"]
        const { data: players } = await supabase
          .from("players")
          .select("team_id, role")
          .eq("user_id", session.user.id)
          .in("team_id", [match.home_team_id, match.away_team_id])
        if (players?.some(p => mgrRoles.includes((p.role || "").trim()))) isManager = true
      }

      if (isManager) {
        setPermissionChecked(true)
        return true
      }

      // Debug details to help diagnose
      const { data: allTeams } = await supabase
        .from(T.teams)
        .select("id, name")
        .in("id", [match.home_team_id, match.away_team_id])
      const { data: userTeams } = await supabase.from("team_managers").select("team_id")

      setDebugInfo({
        userId: session.user.id,
        league: effectiveLeague,
        targetMatchesTable: T.matches,
        matchTeams: [match.home_team_id, match.away_team_id],
        allTeams, userTeams,
      })

      setPermissionError("You don't have permission to update this match. Only team managers or admins can update match data.")
      setPermissionChecked(true)
      return false
    } catch (e: any) {
      setPermissionError(e.message || "Failed to check permission")
      setPermissionChecked(true)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const ok = await checkPermission()
      if (!ok && !canEdit) {
        setLoading(false)
        return
      }

      // For forfeit games, set score to 3-0 automatically
      const finalHomeScore = isForfeit ? (forfeitTeamId === match.home_team_id ? 0 : 3) : homeScore
      const finalAwayScore = isForfeit ? (forfeitTeamId === match.away_team_id ? 0 : 3) : awayScore

      const periodScores = isForfeit 
        ? {
            period1: { home: finalHomeScore, away: finalAwayScore },
            period2: { home: 0, away: 0 },
            period3: { home: 0, away: 0 },
          }
        : {
            period1: { home: period1Home, away: period1Away },
            period2: { home: period2Home, away: period2Away },
            period3: { home: period3Home, away: period3Away },
            ...(hasOvertime ? { overtime: { home: otHome, away: otAway } } : {}),
          }

      // Use the same casing you already display as "FINAL"
      const COMPLETED_STATUS = "Completed"

      const updates = {
        home_score: finalHomeScore,
        away_score: finalAwayScore,
        has_overtime: isForfeit ? false : hasOvertime,
        overtime: isForfeit ? false : hasOvertime,
        period_scores: periodScores,
        status: COMPLETED_STATUS,
        is_forfeit: isForfeit,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from(T.matches) // matches_ahl / matches / allstar_matches
        .update(updates)
        .eq("id", match.id)

      if (updateError) throw updateError

      // Optimistic update for UI
      onUpdate?.({ ...match, ...updates })

      const leagueLabel = effectiveLeague === "ALLSTAR" ? "All-Star" : effectiveLeague
      const forfeitMsg = isForfeit ? ` - Forfeit (${finalHomeScore}-${finalAwayScore})` : ""
      toast({ title: "Score Updated", description: `The match was marked as ${COMPLETED_STATUS} (${leagueLabel})${forfeitMsg}.` })
      onOpenChange(false)
    } catch (e: any) {
      setError(e.message || "Failed to update score")
    } finally {
      setLoading(false)
    }
  }

  // Reset state on open
  useEffect(() => {
    if (open) {
      setHomeScore(match?.home_score ?? 0)
      setAwayScore(match?.away_score ?? 0)
      setHasOvertime(match?.has_overtime || match?.overtime || false)
      setIsForfeit(match?.is_forfeit || false)
      setForfeitTeamId(match?.forfeit_team_id || null)
      setPermissionChecked(false)
      setPermissionError(null)
      setError(null)
      if (canEdit === undefined) void checkPermission()
    }
    // include pathname so the inferred league reacts if route changes
  }, [open, match, canEdit, pathname])

  if (!open) return null

  const leagueBadge = effectiveLeague === "ALLSTAR" ? "All-Star" : effectiveLeague

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Match Score</DialogTitle>
          <DialogDescription>
            Update the score for {match?.home_team?.name} vs {match?.away_team?.name} ({leagueBadge})
          </DialogDescription>
        </DialogHeader>

        {permissionError && !canEdit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>{permissionError}</AlertDescription>
            {debugInfo && (
              <div className="mt-2 text-xs">
                <details>
                  <summary>Debug Details</summary>
                  <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4 mb-2">
              <div />
              <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="w-20 text-center">{match?.home_team?.name || "Home"}</div>
                <span />
                <div className="w-20 text-center">{match?.away_team?.name || "Away"}</div>
              </div>
            </div>

            {[
              { label: "Period 1", h: period1Home, a: period1Away, setH: setPeriod1Home, setA: setPeriod1Away },
              { label: "Period 2", h: period2Home, a: period2Away, setH: setPeriod2Home, setA: setPeriod2Away },
              { label: "Period 3", h: period3Home, a: period3Away, setH: setPeriod3Home, setA: setPeriod3Away },
            ].map((row) => (
              <div className="grid grid-cols-3 items-center gap-4" key={row.label}>
                <Label className="text-right">{row.label}</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={row.h}
                    onChange={(e) => row.setH(Number.parseInt(e.target.value) || 0)}
                    className="w-20"
                    disabled={isForfeit || loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    min="0"
                    value={row.a}
                    onChange={(e) => row.setA(Number.parseInt(e.target.value) || 0)}
                    className="w-20"
                    disabled={isForfeit || loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                  />
                </div>
              </div>
            ))}

            {/* Forfeit Section */}
            <div className="border border-orange-500/30 rounded-lg p-3 bg-orange-500/5">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="is-forfeit"
                  checked={isForfeit}
                  onCheckedChange={(checked) => {
                    setIsForfeit(checked === true)
                    if (!checked) {
                      setForfeitTeamId(null)
                    }
                  }}
                  disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                />
                <Label htmlFor="is-forfeit" className="flex items-center gap-2 text-orange-600 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  This game was a forfeit
                </Label>
              </div>

              {isForfeit && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-right text-sm">Which team forfeited?</Label>
                  <div className="col-span-2">
                    <Select
                      value={forfeitTeamId || ""}
                      onValueChange={(value) => setForfeitTeamId(value)}
                      disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team that forfeited" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={match.home_team_id}>
                          {match.home_team?.name || "Home Team"} (Forfeit Loss)
                        </SelectItem>
                        <SelectItem value={match.away_team_id}>
                          {match.away_team?.name || "Away Team"} (Forfeit Loss)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score will be set to 3-0 automatically. Forfeiting team gets -1 point, winner gets 3 points.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Overtime Section - only show if not a forfeit */}
            {!isForfeit && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-overtime"
                    checked={hasOvertime}
                    onCheckedChange={(checked) => setHasOvertime(checked === true)}
                    disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                  />
                  <Label htmlFor="has-overtime">Game went to overtime</Label>
                </div>

                {hasOvertime && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-right">Overtime</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={otHome}
                        onChange={(e) => setOtHome(Number.parseInt(e.target.value) || 0)}
                        className="w-20"
                        disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        min="0"
                        value={otAway}
                        onChange={(e) => setOtAway(Number.parseInt(e.target.value) || 0)}
                        className="w-20"
                        disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right font-bold">Final Score</Label>
              <div className="col-span-2 flex items-center gap-2">
                {isForfeit ? (
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-orange-600">
                      {forfeitTeamId === match.home_team_id ? "0 - 3" : "3 - 0"}
                    </div>
                    <span className="text-sm text-orange-600 font-medium">(Forfeit)</span>
                  </div>
                ) : (
                  <div className="text-lg font-bold">{homeScore} - {awayScore}</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
            >
              {loading ? "Updating..." : "Update Score"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
