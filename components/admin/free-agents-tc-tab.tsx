"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Search, Users, Shuffle, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FreeAgent {
  id: string
  user_id: string
  gamer_tag_id: string
  primary_position: string
  secondary_position: string | null
  console: string
  is_late_signup: boolean
  status: string
}

interface Team {
  id: string
  name: string
}

export function FreeAgentsTCTab() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [freeAgents, setFreeAgents] = useState<FreeAgent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<FreeAgent[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsAhl, setTeamsAhl] = useState<Team[]>([])
  const [teamsEcl, setTeamsEcl] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [league, setLeague] = useState<"nhl" | "ahl" | "ecl">("nhl")

  useEffect(() => {
    fetchFreeAgents()
    fetchTeams()
  }, [])

  useEffect(() => {
    filterAgents()
  }, [freeAgents, searchTerm])

  async function fetchFreeAgents() {
    setLoading(true)
    try {
      // Get current season number from system_settings
      const { data: currentSeasonSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "current_season")
        .single()

      // Get the season number from the seasons table using the current season ID
      let seasonNumber: number | null = null
      if (currentSeasonSetting?.value) {
        const { data: seasonData } = await supabase
          .from("seasons")
          .select("season_number")
          .eq("id", currentSeasonSetting.value)
          .single()
        
        seasonNumber = seasonData?.season_number || null
      }

      if (!seasonNumber) {
        console.error("No current season found")
        setFreeAgents([])
        setLoading(false)
        return
      }

      // First, get all approved registrations for the current season
      const { data: approvedRegistrations, error: regError } = await supabase
        .from("season_registrations")
        .select("user_id, primary_position, secondary_position, is_late_signup, gamer_tag")
        .eq("season_number", seasonNumber)
        .eq("status", "Approved")

      if (regError) {
        console.error("Error fetching registrations:", regError)
        throw regError
      }

      if (!approvedRegistrations || approvedRegistrations.length === 0) {
        setFreeAgents([])
        setLoading(false)
        return
      }

      const approvedUserIds = approvedRegistrations.map((r: any) => r.user_id)

      // Now fetch players who are approved AND not on any team AND not already TC
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          id, 
          user_id, 
          status, 
          team_id, 
          team_id_ahl, 
          team_id_ecl,
          is_tc,
          user:users(id, gamer_tag_id, console)
        `)
        .in("user_id", approvedUserIds)
        .is("team_id", null)
        .is("team_id_ahl", null)
        .is("team_id_ecl", null)
        .or("is_tc.is.null,is_tc.eq.false")
        .order("created_at", { ascending: false })

      if (playersError) {
        console.error("Error fetching players:", playersError)
        throw playersError
      }

      let agentsWithPositions: FreeAgent[] = []

      if (playersData && playersData.length > 0) {
        // Create a map from approvedRegistrations for quick lookup
        const registrationMap = new Map<string, { primary_position: string; secondary_position: string | null; is_late_signup: boolean; gamer_tag: string | null }>()
        approvedRegistrations.forEach((reg: any) => {
          registrationMap.set(reg.user_id, {
            primary_position: reg.primary_position || "Unknown",
            secondary_position: reg.secondary_position || null,
            is_late_signup: reg.is_late_signup || false,
            gamer_tag: reg.gamer_tag || null,
          })
        })

        agentsWithPositions = playersData.map((player: any) => {
          const regData = registrationMap.get(player.user_id) || { primary_position: "Unknown", secondary_position: null, is_late_signup: false, gamer_tag: null }
          return {
            id: player.id,
            user_id: player.user_id,
            gamer_tag_id: regData.gamer_tag || player.user?.gamer_tag_id || "Unknown",
            primary_position: regData.primary_position,
            secondary_position: regData.secondary_position,
            console: player.user?.console || "Unknown",
            is_late_signup: regData.is_late_signup,
            status: player.status || "free_agent",
          }
        })
      }

      setFreeAgents(agentsWithPositions)
      setFilteredAgents(agentsWithPositions)
    } catch (error: any) {
      console.error("Error fetching free agents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch free agents: " + (error.message || "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchTeams() {
    try {
      // Get current NHL season from system_settings
      const { data: nhlSeasonSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "current_season")
        .single()

      if (nhlSeasonSetting?.value) {
        // Load NHL teams from team_seasons for the current season
        const { data: teamSeasons } = await supabase
          .from("team_seasons")
          .select("team_id, teams:team_id(id, name)")
          .eq("season_id", nhlSeasonSetting.value)

        if (teamSeasons) {
          const nhlTeams = teamSeasons
            .map((ts: any) => ts.teams)
            .filter((t: any) => t !== null)
            .sort((a: Team, b: Team) => a.name.localeCompare(b.name))
          setTeams(nhlTeams)
        }
      } else {
        // Fallback to all teams if no current season set
        const { data: nhlTeams } = await supabase
          .from("teams")
          .select("id, name")
          .order("name")

        if (nhlTeams) {
          setTeams(nhlTeams)
        }
      }

      // Get current AHL season from system_settings_ahl
      const { data: ahlSeasonSetting } = await supabase
        .from("system_settings_ahl")
        .select("value")
        .eq("key", "current_season")
        .single()

      if (ahlSeasonSetting?.value) {
        // Load AHL teams from team_seasons_ahl for the current season
        const { data: ahlTeamSeasons } = await supabase
          .from("team_seasons_ahl")
          .select("team_id, teams_ahl:team_id(id, name)")
          .eq("season_id", ahlSeasonSetting.value)

        if (ahlTeamSeasons) {
          const ahlTeamsFiltered = ahlTeamSeasons
            .map((ts: any) => ts.teams_ahl)
            .filter((t: any) => t !== null)
            .sort((a: Team, b: Team) => a.name.localeCompare(b.name))
          setTeamsAhl(ahlTeamsFiltered)
        }
      } else {
        // Fallback to all AHL teams if no current season set
        const { data: ahlTeamsData } = await supabase
          .from("teams_ahl")
          .select("id, name")
          .order("name")

        if (ahlTeamsData) {
          setTeamsAhl(ahlTeamsData)
        }
      }

      // Get current ECL season from system_settings_ecl
      const { data: eclSeasonSetting } = await supabase
        .from("system_settings_ecl")
        .select("value")
        .eq("key", "current_season")
        .single()

      if (eclSeasonSetting?.value) {
        // Load ECL teams from team_seasons_ecl for the current season
        const { data: eclTeamSeasons } = await supabase
          .from("team_seasons_ecl")
          .select("team_id, teams_ecl:team_id(id, name)")
          .eq("season_id", eclSeasonSetting.value)

        if (eclTeamSeasons) {
          const eclTeamsFiltered = eclTeamSeasons
            .map((ts: any) => ts.teams_ecl)
            .filter((t: any) => t !== null)
            .sort((a: Team, b: Team) => a.name.localeCompare(b.name))
          setTeamsEcl(eclTeamsFiltered)
        }
      } else {
        // Fallback to all ECL teams if no current season set
        const { data: eclTeamsData } = await supabase
          .from("teams_ecl")
          .select("id, name")
          .order("name")

        if (eclTeamsData) {
          setTeamsEcl(eclTeamsData)
        }
      }
    } catch (error: any) {
      console.error("Error fetching teams:", error)
    }
  }

  function filterAgents() {
    if (!searchTerm) {
      setFilteredAgents(freeAgents)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = freeAgents.filter(
      (agent) =>
        agent.gamer_tag_id?.toLowerCase().includes(term) ||
        agent.primary_position?.toLowerCase().includes(term) ||
        agent.console?.toLowerCase().includes(term)
    )
    setFilteredAgents(filtered)
  }

  function toggleSelectAll() {
    if (selectedPlayers.length === filteredAgents.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(filteredAgents.map((a) => a.id))
    }
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  async function assignToTC(random: boolean) {
    if (selectedPlayers.length === 0) {
      toast({
        title: "No players selected",
        description: "Please select at least one player to assign to Training Camp",
        variant: "destructive",
      })
      return
    }

    if (!random && !selectedTeam) {
      toast({
        title: "No team selected",
        description: "Please select a team for manual assignment",
        variant: "destructive",
      })
      return
    }

    setAssigning(true)
    try {
      const body: any = {
        playerIds: selectedPlayers,
        randomAssign: random,
        league,
      }

      if (!random) {
        if (league === "nhl") {
          body.teamId = selectedTeam
        } else if (league === "ahl") {
          body.teamIdAhl = selectedTeam
        } else {
          body.teamIdEcl = selectedTeam
        }
      }

      const response = await fetch("/api/tc/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign players to TC")
      }

      // Check if any assignments failed
      const failedResults = data.results?.filter((r: any) => !r.success) || []
      if (failedResults.length > 0) {
        const errorMessages = failedResults.map((r: any) => r.error).join(", ")
        toast({
          title: "Warning",
          description: `${data.message}. Errors: ${errorMessages}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: data.message,
        })
      }

      // Refresh the list
      setSelectedPlayers([])
      fetchFreeAgents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  function getPositionAbbreviation(position: string): string {
    const posMap: Record<string, string> = {
      Center: "C",
      "Left Wing": "LW",
      "Right Wing": "RW",
      "Left Defense": "LD",
      "Right Defense": "RD",
      Goalie: "G",
      Forward: "F",
      Defense: "D",
    }
    return posMap[position] || position?.slice(0, 2) || "?"
  }

  const currentTeams = league === "nhl" ? teams : league === "ahl" ? teamsAhl : teamsEcl

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Free Agents / Training Camp
        </CardTitle>
        <CardDescription>
          Assign free agents to team Training Camps. TC players have $0 salary and don&apos;t count toward roster limits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, position, or console..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={league} onValueChange={(v) => { setLeague(v as "nhl" | "ahl" | "ecl"); setSelectedTeam(""); }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="League" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nhl">NHL</SelectItem>
                <SelectItem value="ahl">AHL</SelectItem>
                <SelectItem value="ecl">ECL</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchFreeAgents} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {/* Assignment Controls */}
          <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Selected: {selectedPlayers.length}</span>
            </div>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent>
                {currentTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => assignToTC(false)}
              disabled={assigning || selectedPlayers.length === 0 || !selectedTeam}
            >
              {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Assign to Team TC
            </Button>
            <Button
              variant="secondary"
              onClick={() => assignToTC(true)}
              disabled={assigning || selectedPlayers.length === 0}
            >
              {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
              Random TC Assignment
            </Button>
          </div>
        </div>

        {/* Free Agents Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No free agents found. All players are either on a team or already in Training Camp.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedPlayers.length === filteredAgents.length && filteredAgents.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Gamer Tag</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Console</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPlayers.includes(agent.id)}
                        onCheckedChange={() => togglePlayer(agent.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {agent.gamer_tag_id}
                      {agent.is_late_signup && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          LS
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getPositionAbbreviation(agent.primary_position)}
                      {agent.secondary_position && `/${getPositionAbbreviation(agent.secondary_position)}`}
                    </TableCell>
                    <TableCell>{agent.console}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {agent.status || "Free Agent"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          <p><strong>Note:</strong> Late Signup (LS) players can be assigned to TC but cannot be called up to active roster.</p>
        </div>
      </CardContent>
    </Card>
  )
}
