"use client"

import React, { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Save, Users, Target, Trophy, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ManualStatsEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: any
  onStatsUpdated?: () => void
}

interface PlayerStats {
  player_id: string
  player_name: string
  team_id: string
  position: string
  // Skater stats
  goals: number
  assists: number
  shots: number
  hits: number
  plus_minus: number
  pim: number
  ppg: number
  shg: number
  gwg: number
  giveaways: number
  takeaways: number
  faceoff_wins: number
  faceoff_losses: number
  // Goalie stats
  saves?: number
  shots_against?: number
  goals_against?: number
  shutout?: boolean
}

interface TeamPlayers {
  [teamId: string]: Array<{
    id: string
    user_id: string
    users: {
      gamer_tag_id: string
      primary_position: string
    }
  }>
}

export function ManualStatsEntryModal({ open, onOpenChange, match, onStatsUpdated }: ManualStatsEntryModalProps) {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayers>({})
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({})
  const [activeTab, setActiveTab] = useState("home")

  // Load team players when modal opens
  useEffect(() => {
    if (open && match) {
      loadTeamPlayers()
    }
  }, [open, match])

  const loadTeamPlayers = async () => {
    if (!match?.home_team_id || !match?.away_team_id) return

    setLoading(true)
    setError(null)

    try {
      // Get players for both teams
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select(`
          id,
          user_id,
          team_id,
          users:user_id (
            gamer_tag_id,
            primary_position
          )
        `)
        .in("team_id", [match.home_team_id, match.away_team_id])
        .not("users.gamer_tag_id", "is", null)

      if (playersError) throw playersError

      // Group players by team
      const grouped: TeamPlayers = {
        [match.home_team_id]: [],
        [match.away_team_id]: []
      }

      players?.forEach(player => {
        if (player.team_id && grouped[player.team_id]) {
          grouped[player.team_id].push(player)
        }
      })

      setTeamPlayers(grouped)

      // Initialize player stats
      const initialStats: Record<string, PlayerStats> = {}
      players?.forEach(player => {
        if (player.users) {
          const isGoalie = player.users.primary_position?.toLowerCase().includes('goalie') || 
                          player.users.primary_position?.toLowerCase() === 'g'
          
          initialStats[player.id] = {
            player_id: player.id,
            player_name: player.users.gamer_tag_id,
            team_id: player.team_id!,
            position: player.users.primary_position || 'Unknown',
            goals: 0,
            assists: 0,
            shots: 0,
            hits: 0,
            plus_minus: 0,
            pim: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            giveaways: 0,
            takeaways: 0,
            faceoff_wins: 0,
            faceoff_losses: 0,
            ...(isGoalie && {
              saves: 0,
              shots_against: 0,
              goals_against: 0,
              shutout: false
            })
          }
        }
      })

      setPlayerStats(initialStats)
    } catch (err: any) {
      console.error("Error loading team players:", err)
      setError(err.message || "Failed to load team players")
    } finally {
      setLoading(false)
    }
  }

  const updatePlayerStat = (playerId: string, field: keyof PlayerStats, value: number | boolean) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
        // Auto-calculate points for skaters
        ...(field === 'goals' || field === 'assists' ? {
          points: (field === 'goals' ? value as number : prev[playerId]?.goals || 0) + 
                 (field === 'assists' ? value as number : prev[playerId]?.assists || 0)
        } : {})
      }
    }))
  }

  const handleSave = async () => {
    if (!session?.user || !match) {
      toast({
        title: "Error",
        description: "You must be logged in to save stats.",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Prepare stats for API
      const statsToSave = Object.values(playerStats).filter(stat => {
        // Only save stats that have some data entered
        return stat.goals > 0 || stat.assists > 0 || stat.shots > 0 || 
               stat.hits > 0 || stat.pim > 0 || stat.saves || 0 > 0
      })

      if (statsToSave.length === 0) {
        toast({
          title: "No Stats to Save",
          description: "Please enter some statistics before saving.",
          variant: "destructive"
        })
        setSaving(false)
        return
      }

      // Call API to save stats
      const response = await fetch("/api/matches/manual-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: match.id,
          season_id: match.season_id,
          player_stats: statsToSave
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save stats")
      }

      toast({
        title: "Stats Saved",
        description: `Successfully saved stats for ${statsToSave.length} players.`
      })

      onStatsUpdated?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error saving stats:", err)
      setError(err.message || "Failed to save stats")
    } finally {
      setSaving(false)
    }
  }

  const renderPlayerStatsForm = (player: any, stats: PlayerStats) => {
    const isGoalie = stats.position?.toLowerCase().includes('goalie') || 
                    stats.position?.toLowerCase() === 'g'

    return (
      <Card key={player.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{stats.player_name}</CardTitle>
            <Badge variant="outline">{stats.position}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isGoalie ? (
            // Goalie stats form
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor={`saves-${player.id}`}>Saves</Label>
                <Input
                  id={`saves-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.saves || 0}
                  onChange={(e) => updatePlayerStat(player.id, 'saves', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`shots-against-${player.id}`}>Shots Against</Label>
                <Input
                  id={`shots-against-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.shots_against || 0}
                  onChange={(e) => updatePlayerStat(player.id, 'shots_against', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`goals-against-${player.id}`}>Goals Against</Label>
                <Input
                  id={`goals-against-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.goals_against || 0}
                  onChange={(e) => updatePlayerStat(player.id, 'goals_against', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`pim-${player.id}`}>PIM</Label>
                <Input
                  id={`pim-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.pim}
                  onChange={(e) => updatePlayerStat(player.id, 'pim', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          ) : (
            // Skater stats form
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor={`goals-${player.id}`}>Goals</Label>
                <Input
                  id={`goals-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.goals}
                  onChange={(e) => updatePlayerStat(player.id, 'goals', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`assists-${player.id}`}>Assists</Label>
                <Input
                  id={`assists-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.assists}
                  onChange={(e) => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`shots-${player.id}`}>Shots</Label>
                <Input
                  id={`shots-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.shots}
                  onChange={(e) => updatePlayerStat(player.id, 'shots', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`hits-${player.id}`}>Hits</Label>
                <Input
                  id={`hits-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.hits}
                  onChange={(e) => updatePlayerStat(player.id, 'hits', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`plus-minus-${player.id}`}>+/-</Label>
                <Input
                  id={`plus-minus-${player.id}`}
                  type="number"
                  value={stats.plus_minus}
                  onChange={(e) => updatePlayerStat(player.id, 'plus_minus', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`pim-${player.id}`}>PIM</Label>
                <Input
                  id={`pim-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.pim}
                  onChange={(e) => updatePlayerStat(player.id, 'pim', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`ppg-${player.id}`}>PPG</Label>
                <Input
                  id={`ppg-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.ppg}
                  onChange={(e) => updatePlayerStat(player.id, 'ppg', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`shg-${player.id}`}>SHG</Label>
                <Input
                  id={`shg-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.shg}
                  onChange={(e) => updatePlayerStat(player.id, 'shg', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`giveaways-${player.id}`}>Giveaways</Label>
                <Input
                  id={`giveaways-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.giveaways}
                  onChange={(e) => updatePlayerStat(player.id, 'giveaways', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`takeaways-${player.id}`}>Takeaways</Label>
                <Input
                  id={`takeaways-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.takeaways}
                  onChange={(e) => updatePlayerStat(player.id, 'takeaways', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`faceoff-wins-${player.id}`}>FO Wins</Label>
                <Input
                  id={`faceoff-wins-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.faceoff_wins}
                  onChange={(e) => updatePlayerStat(player.id, 'faceoff_wins', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`faceoff-losses-${player.id}`}>FO Losses</Label>
                <Input
                  id={`faceoff-losses-${player.id}`}
                  type="number"
                  min="0"
                  value={stats.faceoff_losses}
                  onChange={(e) => updatePlayerStat(player.id, 'faceoff_losses', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Manual Stats Entry
          </DialogTitle>
          <DialogDescription>
            Enter player statistics for {match?.home_team?.name} vs {match?.away_team?.name}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading team rosters...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="home" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {match?.home_team?.name || "Home Team"}
              </TabsTrigger>
              <TabsTrigger value="away" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {match?.away_team?.name || "Away Team"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-6">
              <div className="space-y-4">
                {teamPlayers[match?.home_team_id]?.map(player => {
                  const stats = playerStats[player.id]
                  if (!stats) return null
                  return renderPlayerStatsForm(player, stats)
                })}
              </div>
            </TabsContent>

            <TabsContent value="away" className="mt-6">
              <div className="space-y-4">
                {teamPlayers[match?.away_team_id]?.map(player => {
                  const stats = playerStats[player.id]
                  if (!stats) return null
                  return renderPlayerStatsForm(player, stats)
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Stats
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
