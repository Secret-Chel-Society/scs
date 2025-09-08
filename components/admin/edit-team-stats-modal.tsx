"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, BarChart, TrendingUp, Target, Trophy, Award, Medal, Star, Shield, Database, Settings, Zap, Clock } from "lucide-react"
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
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} title="Edit Team Statistics" className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
        <BarChart className="h-4 w-4 mr-1" />
        Edit Stats
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                <BarChart className="h-4 w-4 text-white" />
              </div>
              Edit Team Statistics
            </DialogTitle>
            <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
              Manually update comprehensive statistics for <span className="font-semibold text-ice-blue-600 dark:text-ice-blue-400">{team.name}</span>. This will override automatic calculations and enable manual control over team performance metrics.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert className="my-4 border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
              <AlertDescription className="text-goal-red-700 dark:text-goal-red-300 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6 py-4">
            {/* Record Section */}
            <div className="p-4 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Team Record</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wins" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Award className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Wins
                  </Label>
                  <Input 
                    id="wins" 
                    name="wins" 
                    type="number" 
                    min="0" 
                    value={stats.wins} 
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="losses" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Target className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    Losses
                  </Label>
                  <Input 
                    id="losses" 
                    name="losses" 
                    type="number" 
                    min="0" 
                    value={stats.losses} 
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Overtime and Points Section */}
            <div className="p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
              <div className="flex items-center gap-2 mb-4">
                <Medal className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Overtime & Points</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="otl" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Clock className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                    Overtime Losses
                  </Label>
                  <Input 
                    id="otl" 
                    name="otl" 
                    type="number" 
                    min="0" 
                    value={stats.otl} 
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Star className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Points (Calculated)
                  </Label>
                  <Input 
                    id="points" 
                    type="number" 
                    value={stats.wins * 2 + stats.otl} 
                    disabled 
                    className="hockey-search border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-200/50 dark:from-hockey-silver-800/50 dark:to-hockey-silver-700/50 text-hockey-silver-600 dark:text-hockey-silver-400 font-semibold" 
                  />
                </div>
              </div>
            </div>

            {/* Goals Section */}
            <div className="p-4 bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 rounded-lg border border-goal-red-200/30 dark:border-goal-red-700/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
                <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Goals</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goals_for" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <TrendingUp className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Goals For
                  </Label>
                  <Input
                    id="goals_for"
                    name="goals_for"
                    type="number"
                    min="0"
                    value={stats.goals_for}
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goals_against" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Shield className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    Goals Against
                  </Label>
                  <Input
                    id="goals_against"
                    name="goals_against"
                    type="number"
                    min="0"
                    value={stats.goals_against}
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Powerplay Section */}
            <div className="p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Powerplay</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="powerplay_goals" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Target className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Powerplay Goals
                  </Label>
                  <Input
                    id="powerplay_goals"
                    name="powerplay_goals"
                    type="number"
                    min="0"
                    value={stats.powerplay_goals}
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="powerplay_opportunities" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Database className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Powerplay Opportunities
                  </Label>
                  <Input
                    id="powerplay_opportunities"
                    name="powerplay_opportunities"
                    type="number"
                    min="0"
                    value={stats.powerplay_opportunities}
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Penalty Kill Section */}
            <div className="p-4 bg-gradient-to-r from-hockey-silver-50/30 to-hockey-silver-100/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-900/10 rounded-lg border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Penalty Kill</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="penalty_kill_goals_against" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Target className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    PK Goals Against
                  </Label>
                  <Input
                    id="penalty_kill_goals_against"
                    name="penalty_kill_goals_against"
                    type="number"
                    min="0"
                    value={stats.penalty_kill_goals_against}
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penalty_kill_opportunities" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Database className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                    PK Opportunities
                  </Label>
                  <Input
                    id="penalty_kill_opportunities"
                    name="penalty_kill_opportunities"
                    type="number"
                    min="0"
                    value={stats.penalty_kill_opportunities}
                    onChange={handleChange}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
