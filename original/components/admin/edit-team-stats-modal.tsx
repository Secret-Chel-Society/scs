"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, BarChart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TeamStats } from "@/lib/team-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateTeamStats } from "@/app/actions/update-team-stats"

interface EditTeamStatsModalProps {
  team: TeamStats
  onStatsUpdated: () => void
}

export function EditTeamStatsModal({ team, onStatsUpdated }: EditTeamStatsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [stats, setStats] = useState({
    wins: team.wins,
    losses: team.losses,
    otl: team.otl,
    goals_for: team.goals_for,
    goals_against: team.goals_against,
    powerplay_goals: team.powerplay_goals || 0,
    powerplay_opportunities: team.powerplay_opportunities || 0,
    penalty_kill_goals_against: team.penalty_kill_goals_against || 0,
    penalty_kill_opportunities: team.penalty_kill_opportunities || 0,
    manual_override: true,
  })

  // Reset stats when team changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setStats({
        wins: team.wins,
        losses: team.losses,
        otl: team.otl,
        goals_for: team.goals_for,
        goals_against: team.goals_against,
        powerplay_goals: team.powerplay_goals || 0,
        powerplay_opportunities: team.powerplay_opportunities || 0,
        penalty_kill_goals_against: team.penalty_kill_goals_against || 0,
        penalty_kill_opportunities: team.penalty_kill_opportunities || 0,
        manual_override: true,
      })
      setError(null)
    }
  }, [team, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setStats({
      ...stats,
      [name]: Number(value) || 0,
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Use the server action to update team stats
      const result = await updateTeamStats(team.id.toString(), stats)

      if (!result.success) {
        throw new Error(result.error || "Failed to update team statistics")
      }

      toast({
        title: "Statistics updated",
        description: `${team.name}'s statistics have been updated successfully.`,
      })

      setIsOpen(false)

      // Call the onStatsUpdated callback to refresh the parent component
      onStatsUpdated()

      // Force a refresh after a short delay to ensure the UI updates
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error("Error updating team statistics:", error)
      setError(error.message || "Failed to update team statistics")
      toast({
        title: "Error",
        description: error.message || "Failed to update team statistics",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} title="Edit Team Statistics">
        <BarChart className="h-4 w-4 mr-1" />
        Edit Stats
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Statistics</DialogTitle>
            <DialogDescription>
              Manually update statistics for {team.name}. This will override automatic calculations.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="my-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wins">Wins</Label>
                <Input id="wins" name="wins" type="number" min="0" value={stats.wins} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="losses">Losses</Label>
                <Input id="losses" name="losses" type="number" min="0" value={stats.losses} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="otl">Overtime Losses</Label>
                <Input id="otl" name="otl" type="number" min="0" value={stats.otl} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points (Calculated)</Label>
                <Input id="points" type="number" value={stats.wins * 2 + stats.otl} disabled className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goals_for">Goals For</Label>
                <Input
                  id="goals_for"
                  name="goals_for"
                  type="number"
                  min="0"
                  value={stats.goals_for}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goals_against">Goals Against</Label>
                <Input
                  id="goals_against"
                  name="goals_against"
                  type="number"
                  min="0"
                  value={stats.goals_against}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="powerplay_goals">Powerplay Goals</Label>
                <Input
                  id="powerplay_goals"
                  name="powerplay_goals"
                  type="number"
                  min="0"
                  value={stats.powerplay_goals}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="powerplay_opportunities">Powerplay Opportunities</Label>
                <Input
                  id="powerplay_opportunities"
                  name="powerplay_opportunities"
                  type="number"
                  min="0"
                  value={stats.powerplay_opportunities}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="penalty_kill_goals_against">PK Goals Against</Label>
                <Input
                  id="penalty_kill_goals_against"
                  name="penalty_kill_goals_against"
                  type="number"
                  min="0"
                  value={stats.penalty_kill_goals_against}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="penalty_kill_opportunities">PK Opportunities</Label>
                <Input
                  id="penalty_kill_opportunities"
                  name="penalty_kill_opportunities"
                  type="number"
                  min="0"
                  value={stats.penalty_kill_opportunities}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
