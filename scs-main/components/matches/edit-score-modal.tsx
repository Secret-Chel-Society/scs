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
import { AlertCircle } from "lucide-react"

interface EditScoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: any
  canEdit?: boolean
  onUpdate?: (updatedMatch: any) => void
}

export function EditScoreModal({ open, onOpenChange, match, canEdit = false, onUpdate }: EditScoreModalProps) {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [homeScore, setHomeScore] = useState<number>(match?.home_score || 0)
  const [awayScore, setAwayScore] = useState<number>(match?.away_score || 0)
  const [hasOvertime, setHasOvertime] = useState<boolean>(match?.has_overtime || match?.overtime || false)
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

  // Initialize period scores from match data
  useEffect(() => {
    if (match && match.period_scores) {
      try {
        const periodScores =
          typeof match.period_scores === "string" ? JSON.parse(match.period_scores) : match.period_scores

        setPeriod1Home(periodScores.period1?.home || 0)
        setPeriod1Away(periodScores.period1?.away || 0)
        setPeriod2Home(periodScores.period2?.home || 0)
        setPeriod2Away(periodScores.period2?.away || 0)
        setPeriod3Home(periodScores.period3?.home || 0)
        setPeriod3Away(periodScores.period3?.away || 0)
        setOtHome(periodScores.overtime?.home || 0)
        setOtAway(periodScores.overtime?.away || 0)
      } catch (e) {
        console.error("Error parsing period scores:", e)
        // Initialize with zeros if there's an error
        setPeriod1Home(0)
        setPeriod1Away(0)
        setPeriod2Home(0)
        setPeriod2Away(0)
        setPeriod3Home(0)
        setPeriod3Away(0)
        setOtHome(0)
        setOtAway(0)
      }
    }
  }, [match])

  // Update total scores when period scores change
  useEffect(() => {
    const newHomeScore = period1Home + period2Home + period3Home + (hasOvertime ? otHome : 0)
    const newAwayScore = period1Away + period2Away + period3Away + (hasOvertime ? otAway : 0)

    setHomeScore(newHomeScore)
    setAwayScore(newAwayScore)
  }, [period1Home, period1Away, period2Home, period2Away, period3Home, period3Away, otHome, otAway, hasOvertime])

  // Check if the user has permission to edit this match
  const checkPermission = async () => {
    if (!session?.user || !match) {
      setPermissionError("You must be logged in to edit match scores.")
      setPermissionChecked(true)
      return false
    }

    try {
      setError(null)
      setPermissionError(null)

      // First, check if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("role", "Admin")

      if (!adminError && adminData && adminData.length > 0) {
        // User is an admin, they have permission
        setPermissionChecked(true)
        return true
      }

      // Check if the user is a team manager for either team in the match
      const { data: teamManagerData, error: teamManagerError } = await supabase
        .from("team_managers")
        .select("*")
        .eq("user_id", session.user.id)
        .in("team_id", [match.home_team_id, match.away_team_id])

      if (teamManagerError) {
        console.error("Error checking team manager status:", teamManagerError)
        throw new Error("Failed to check team manager status")
      }

      // If the user is a team manager for either team, they have permission
      if (teamManagerData && teamManagerData.length > 0) {
        setPermissionChecked(true)
        return true
      }

      // If we get here, also check the players table for GM, AGM, or Owner roles
      // This is a fallback for users who might not have entries in the team_managers table yet
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", session.user.id)
        .in("team_id", [match.home_team_id, match.away_team_id])

      if (playerError) {
        console.error("Error checking player status:", playerError)
        throw new Error("Failed to check player status")
      }

      // Check if any of the player entries have a manager role
      const managerRoles = ["owner", "gm", "agm", "Owner", "GM", "AGM"]
      const isManager = playerData?.some((player) => {
        const role = (player.role || "").toLowerCase().trim()
        return managerRoles.includes(role)
      })

      if (isManager) {
        setPermissionChecked(true)
        return true
      }

      // Get all teams for debugging
      const { data: allTeams, error: allTeamsError } = await supabase
        .from("teams")
        .select("id, name")
        .in("id", [match.home_team_id, match.away_team_id])

      // Get all user teams for debugging
      const { data: userTeams, error: userTeamsError } = await supabase
        .from("team_managers")
        .select("team_id, teams:team_id(name)")
        .eq("user_id", session.user.id)

      // Set debug info
      setDebugInfo({
        userId: session.user.id,
        matchTeams: [match.home_team_id, match.away_team_id],
        userTeams: userTeams?.map((t) => ({ id: t.team_id, name: t.teams?.name })) || [],
        allTeams: allTeams || [],
      })

      // User doesn't have permission
      setPermissionError(
        "You don't have permission to update this match. Only team managers or admins can update match data.",
      )
      setPermissionChecked(true)
      return false
    } catch (error: any) {
      console.error("Error checking permission:", error)
      setPermissionError(error.message || "Failed to check permission")
      setPermissionChecked(true)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check permission first
      const hasPermission = await checkPermission()
      if (!hasPermission && !canEdit) {
        setLoading(false)
        return
      }

      // Create period scores object
      const periodScores = {
        period1: { home: period1Home, away: period1Away },
        period2: { home: period2Home, away: period2Away },
        period3: { home: period3Home, away: period3Away },
      }

      // Add overtime if applicable
      if (hasOvertime) {
        periodScores["overtime"] = { home: otHome, away: otAway }
      }

      // Determine match status - use proper capitalization to match the constraint
      let status = match.status
      if (homeScore > 0 || awayScore > 0) {
        // Use "Completed" with capital C to match the database constraint
        status = "Completed"
      }

      // Update the match
      const { data, error } = await supabase
        .from("matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          has_overtime: hasOvertime,
          overtime: hasOvertime, // Update both fields for compatibility
          period_scores: periodScores,
          status: status,
        })
        .eq("id", match.id)
        .select()

      if (error) {
        throw new Error(`Error response from server: ${JSON.stringify({ error: error.message })}`)
      }

      toast({
        title: "Score Updated",
        description: "The match score has been successfully updated.",
      })

      // Call the onUpdate callback with the updated match
      if (onUpdate && data && data.length > 0) {
        onUpdate(data[0])
      }

      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating score:", error)
      setError(error.message || "Failed to update score")
    } finally {
      setLoading(false)
    }
  }

  // Check permission when the modal opens
  useEffect(() => {
    if (open) {
      setHomeScore(match?.home_score || 0)
      setAwayScore(match?.away_score || 0)
      setHasOvertime(match?.has_overtime || match?.overtime || false)
      setPermissionChecked(false)
      setPermissionError(null)
      setError(null)

      // Only check permission if canEdit is not explicitly provided
      if (canEdit === undefined) {
        checkPermission()
      }
    }
  }, [open, match, canEdit])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Match Score</DialogTitle>
          <DialogDescription>
            Update the score for {match?.home_team?.name} vs {match?.away_team?.name}
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
                  <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
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
              <div></div>
              <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="w-20 text-center">{match?.home_team?.name || "Home"}</div>
                <span></span>
                <div className="w-20 text-center">{match?.away_team?.name || "Away"}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="period1-home" className="text-right">
                Period 1
              </Label>
              <div className="col-span-2 flex items-center gap-2">
                <Input
                  id="period1-home"
                  type="number"
                  min="0"
                  value={period1Home}
                  onChange={(e) => setPeriod1Home(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                />
                <span>-</span>
                <Input
                  id="period1-away"
                  type="number"
                  min="0"
                  value={period1Away}
                  onChange={(e) => setPeriod1Away(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="period2-home" className="text-right">
                Period 2
              </Label>
              <div className="col-span-2 flex items-center gap-2">
                <Input
                  id="period2-home"
                  type="number"
                  min="0"
                  value={period2Home}
                  onChange={(e) => setPeriod2Home(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                />
                <span>-</span>
                <Input
                  id="period2-away"
                  type="number"
                  min="0"
                  value={period2Away}
                  onChange={(e) => setPeriod2Away(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="period3-home" className="text-right">
                Period 3
              </Label>
              <div className="col-span-2 flex items-center gap-2">
                <Input
                  id="period3-home"
                  type="number"
                  min="0"
                  value={period3Home}
                  onChange={(e) => setPeriod3Home(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                />
                <span>-</span>
                <Input
                  id="period3-away"
                  type="number"
                  min="0"
                  value={period3Away}
                  onChange={(e) => setPeriod3Away(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                />
              </div>
            </div>

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
                <Label htmlFor="ot-home" className="text-right">
                  Overtime
                </Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Input
                    id="ot-home"
                    type="number"
                    min="0"
                    value={otHome}
                    onChange={(e) => setOtHome(Number.parseInt(e.target.value) || 0)}
                    className="w-20"
                    disabled={loading || (!canEdit && !permissionChecked) || (permissionError !== null && !canEdit)}
                  />
                  <span>-</span>
                  <Input
                    id="ot-away"
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

            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="total-score" className="text-right font-bold">
                Final Score
              </Label>
              <div className="col-span-2 flex items-center gap-2">
                <div className="text-lg font-bold">
                  {homeScore} - {awayScore}
                </div>
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
