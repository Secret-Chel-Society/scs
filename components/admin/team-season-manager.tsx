"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createCustomClient } from "@/lib/supabase/custom-client"
import { toast } from "sonner"
import { Loader2, Users, Calendar } from "lucide-react"

interface Team {
  id: string
  name: string
  logo_url?: string
}

interface Season {
  id: string
  name: string
  is_active: boolean
}

interface TeamSeason {
  team_id: string
  season_id: string
  is_active: boolean
}

export function TeamSeasonManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [teamSeasons, setTeamSeasons] = useState<TeamSeason[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createCustomClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load teams (remove season_id dependency)
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .order("name")

      if (teamsError) throw teamsError

      // Load seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from("seasons")
        .select("id, name, is_active")
        .order("name")

      if (seasonsError) throw seasonsError

      // Load team-season relationships
      const { data: teamSeasonsData, error: teamSeasonsError } = await supabase
        .from("team_seasons")
        .select("team_id, season_id, is_active")

      if (teamSeasonsError) throw teamSeasonsError

      setTeams(teamsData || [])
      setSeasons(seasonsData || [])
      setTeamSeasons(teamSeasonsData || [])

      // Set current season as default
      const currentSeason = seasonsData?.find((s) => s.is_active)
      if (currentSeason) {
        setSelectedSeason(currentSeason.id)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const isTeamInSeason = (teamId: string, seasonId: string) => {
    return teamSeasons.some((ts) => ts.team_id === teamId && ts.season_id === seasonId && ts.is_active)
  }

  const toggleTeamInSeason = async (teamId: string, seasonId: string, isActive: boolean) => {
    try {
      setSaving(true)

      if (isActive) {
        // Add team to season
        const { error } = await supabase.from("team_seasons").upsert({
          team_id: teamId,
          season_id: seasonId,
          is_active: true,
        })

        if (error) throw error
      } else {
        // Remove team from season
        const { error } = await supabase
          .from("team_seasons")
          .update({ is_active: false })
          .eq("team_id", teamId)
          .eq("season_id", seasonId)

        if (error) throw error
      }

      // Reload team-season relationships
      const { data: teamSeasonsData, error: teamSeasonsError } = await supabase
        .from("team_seasons")
        .select("team_id, season_id, is_active")

      if (teamSeasonsError) throw teamSeasonsError

      setTeamSeasons(teamSeasonsData || [])
      toast.success(isActive ? "Team added to season" : "Team removed from season")
    } catch (error) {
      console.error("Error updating team-season relationship:", error)
      toast.error("Failed to update team assignment")
    } finally {
      setSaving(false)
    }
  }

  const copyTeamsFromSeason = async (fromSeasonId: string, toSeasonId: string) => {
    try {
      setSaving(true)

      // Get teams from source season
      const sourceTeams = teamSeasons.filter((ts) => ts.season_id === fromSeasonId && ts.is_active)

      // Add teams to target season
      const teamSeasonInserts = sourceTeams.map((ts) => ({
        team_id: ts.team_id,
        season_id: toSeasonId,
        is_active: true,
      }))

      const { error } = await supabase.from("team_seasons").upsert(teamSeasonInserts)

      if (error) throw error

      // Reload data
      await loadData()
      toast.success(`Copied ${sourceTeams.length} teams to selected season`)
    } catch (error) {
      console.error("Error copying teams:", error)
      toast.error("Failed to copy teams")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const selectedSeasonData = seasons.find((s) => s.id === selectedSeason)
  const teamsInSelectedSeason = teamSeasons.filter((ts) => ts.season_id === selectedSeason && ts.is_active).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Season Management
          </CardTitle>
          <CardDescription>
            Assign teams to specific seasons. Teams can participate in multiple seasons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Select Season</label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {season.name}
                        {season.is_active && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSeason && (
              <div className="flex items-center gap-2">
                <Select onValueChange={(fromSeasonId) => copyTeamsFromSeason(fromSeasonId, selectedSeason)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Copy teams from..." />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons
                      .filter((s) => s.id !== selectedSeason)
                      .map((season) => (
                        <SelectItem key={season.id} value={season.id}>
                          Copy from {season.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedSeasonData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {teamsInSelectedSeason} teams in {selectedSeasonData.name}
              </Badge>
              {selectedSeasonData.is_active && <Badge variant="default">Current Season</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSeason && (
        <Card>
          <CardHeader>
            <CardTitle>Teams in {selectedSeasonData?.name}</CardTitle>
            <CardDescription>Check the teams that should participate in this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {teams.map((team) => {
                const isInSeason = isTeamInSeason(team.id, selectedSeason)
                return (
                  <div key={team.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {team.logo_url && (
                      <img
                        src={team.logo_url || "/placeholder.svg"}
                        alt={`${team.name} logo`}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{team.name}</div>
                    </div>
                    <Checkbox
                      checked={isInSeason}
                      onCheckedChange={(checked) => toggleTeamInSeason(team.id, selectedSeason, checked as boolean)}
                      disabled={saving}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
