"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, PlusCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const positions = [
  { value: "C", label: "Center" },
  { value: "LW", label: "Left Wing" },
  { value: "RW", label: "Right Wing" },
  { value: "LD", label: "Left Defense" },
  { value: "RD", label: "Right Defense" },
  { value: "G", label: "Goalie" },
]

export function LineupManager({ matchId }: { matchId: string }) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [match, setMatch] = useState<any>(null)
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<any[]>([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<any[]>([])
  const [homeTeamLineup, setHomeTeamLineup] = useState<any[]>([])
  const [awayTeamLineup, setAwayTeamLineup] = useState<any[]>([])
  const [availableHomeTeamPlayers, setAvailableHomeTeamPlayers] = useState<any[]>([])
  const [availableAwayTeamPlayers, setAvailableAwayTeamPlayers] = useState<any[]>([])
  const [currentTeam, setCurrentTeam] = useState<"home" | "away">("home")
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [selectedPosition, setSelectedPosition] = useState<string>("")
  const [selectedLine, setSelectedLine] = useState<number>(1)
  const [isStarter, setIsStarter] = useState<boolean>(false)
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchMatchData() {
      try {
        setLoading(true)

        // Fetch the match data
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select(`
            *,
            home_team:teams!home_team_id(id, name, logo_url),
            away_team:teams!away_team_id(id, name, logo_url)
          `)
          .eq("id", matchId)
          .single()

        if (matchError) {
          throw matchError
        }

        setMatch(matchData)

        // Fetch the home team players
        const { data: homePlayersData, error: homePlayersError } = await supabase
          .from("players")
          .select(`
            *,
            user:users(id, email, gamer_tag_id)
          `)
          .eq("team_id", matchData.home_team_id)

        if (homePlayersError) {
          throw homePlayersError
        }

        setHomeTeamPlayers(homePlayersData || [])

        // Fetch the away team players
        const { data: awayPlayersData, error: awayPlayersError } = await supabase
          .from("players")
          .select(`
            *,
            user:users(id, email, gamer_tag_id)
          `)
          .eq("team_id", matchData.away_team_id)

        if (awayPlayersError) {
          throw awayPlayersError
        }

        setAwayTeamPlayers(awayPlayersData || [])

        // Fetch existing lineups
        const { data: lineupData, error: lineupError } = await supabase
          .from("lineups")
          .select("*")
          .eq("match_id", matchId)

        if (lineupError) {
          console.error("Error fetching lineups:", lineupError)
          toast({
            title: "Error",
            description: "Failed to load lineup data.",
            variant: "destructive",
          })
        } else {
          // Split the lineups by team
          const homeLineup = lineupData?.filter((player) => player.team_id === matchData.home_team_id) || []
          const awayLineup = lineupData?.filter((player) => player.team_id === matchData.away_team_id) || []

          setHomeTeamLineup(homeLineup)
          setAwayTeamLineup(awayLineup)
        }
      } catch (error: any) {
        console.error("Error loading match data:", error)
        toast({
          title: "Error",
          description: "Failed to load match data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (matchId) {
      fetchMatchData()
    }
  }, [supabase, toast, matchId])

  // Update available players whenever lineups change
  useEffect(() => {
    if (homeTeamPlayers.length > 0 && homeTeamLineup.length >= 0) {
      const usedPlayerIds = homeTeamLineup.map((item) => item.player_id)
      const availablePlayers = homeTeamPlayers.filter((player) => !usedPlayerIds.includes(player.id))
      setAvailableHomeTeamPlayers(availablePlayers)
    }

    if (awayTeamPlayers.length > 0 && awayTeamLineup.length >= 0) {
      const usedPlayerIds = awayTeamLineup.map((item) => item.player_id)
      const availablePlayers = awayTeamPlayers.filter((player) => !usedPlayerIds.includes(player.id))
      setAvailableAwayTeamPlayers(availablePlayers)
    }
  }, [homeTeamPlayers, awayTeamPlayers, homeTeamLineup, awayTeamLineup])

  const handleAddPlayer = async () => {
    if (!selectedPlayer || !selectedPosition) {
      toast({
        title: "Missing Information",
        description: "Please select a player and position.",
        variant: "destructive",
      })
      return
    }

    const teamId = currentTeam === "home" ? match.home_team_id : match.away_team_id

    const newLineupItem = {
      match_id: matchId,
      team_id: teamId,
      player_id: selectedPlayer,
      position: selectedPosition,
      line_number: selectedLine,
      is_starter: isStarter,
    }

    try {
      setSaving(true)

      const { data, error } = await supabase.from("lineups").insert(newLineupItem).select()

      if (error) {
        throw error
      }

      // Update the lineup state
      if (currentTeam === "home") {
        setHomeTeamLineup([...homeTeamLineup, data[0]])
      } else {
        setAwayTeamLineup([...awayTeamLineup, data[0]])
      }

      toast({
        title: "Player Added",
        description: "Player has been added to the lineup.",
      })

      // Reset the form
      setSelectedPlayer("")
      setSelectedPosition("")
      setSelectedLine(1)
      setIsStarter(false)
      setAddPlayerDialogOpen(false)
    } catch (error: any) {
      console.error("Error adding player to lineup:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add player to lineup.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemovePlayer = async (lineupId: string) => {
    try {
      const { error } = await supabase.from("lineups").delete().eq("id", lineupId)

      if (error) {
        throw error
      }

      // Update the lineup state
      setHomeTeamLineup(homeTeamLineup.filter((item) => item.id !== lineupId))
      setAwayTeamLineup(awayTeamLineup.filter((item) => item.id !== lineupId))

      toast({
        title: "Player Removed",
        description: "Player has been removed from the lineup.",
      })
    } catch (error: any) {
      console.error("Error removing player from lineup:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove player from lineup.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStarter = async (lineupId: string, isStarterValue: boolean) => {
    try {
      setSaving(true)

      const { error } = await supabase.from("lineups").update({ is_starter: isStarterValue }).eq("id", lineupId)

      if (error) {
        throw error
      }

      // Update the lineup state
      setHomeTeamLineup(
        homeTeamLineup.map((item) => (item.id === lineupId ? { ...item, is_starter: isStarterValue } : item)),
      )
      setAwayTeamLineup(
        awayTeamLineup.map((item) => (item.id === lineupId ? { ...item, is_starter: isStarterValue } : item)),
      )

      toast({
        title: "Starter Status Updated",
        description: `Player is ${isStarterValue ? "now" : "no longer"} a starter.`,
      })
    } catch (error: any) {
      console.error("Error updating starter status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update starter status.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!match) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Not Found</CardTitle>
          <CardDescription>
            The requested match could not be found or you don't have permission to view it.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Get player name from lookup
  const getPlayerName = (playerId: string, teamType: "home" | "away") => {
    const playerList = teamType === "home" ? homeTeamPlayers : awayTeamPlayers
    const player = playerList.find((p) => p.id === playerId)
    return player ? player.user?.gamer_tag_id || "Unknown Player" : "Unknown Player"
  }

  // Sort lineup by position and line
  const sortLineup = (lineup: any[]) => {
    const positionOrder = ["C", "LW", "RW", "LD", "RD", "G"]

    return [...lineup].sort((a, b) => {
      // Sort by line number first
      if (a.line_number !== b.line_number) {
        return a.line_number - b.line_number
      }

      // Then by position order
      const posA = positionOrder.indexOf(a.position)
      const posB = positionOrder.indexOf(b.position)
      return posA - posB
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Lineup Management - {match.home_team.name} vs {match.away_team.name}
        </CardTitle>
        <CardDescription>
          Set the lineups for this match scheduled for {new Date(match.match_date).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="home" onValueChange={(value) => setCurrentTeam(value as "home" | "away")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">{match.home_team.name}</TabsTrigger>
            <TabsTrigger value="away">{match.away_team.name}</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{match.home_team.name} Lineup</h3>
                <Dialog
                  open={addPlayerDialogOpen && currentTeam === "home"}
                  onOpenChange={(open) => {
                    setAddPlayerDialogOpen(open)
                    if (open) setCurrentTeam("home")
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Player
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Player to Lineup</DialogTitle>
                      <DialogDescription>
                        Add a player to the {match.home_team.name} lineup for this match.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="player">Player</Label>
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableHomeTeamPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.user?.gamer_tag_id || "Unknown Player"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map((position) => (
                              <SelectItem key={position.value} value={position.value}>
                                {position.label} ({position.value})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="line">Line Number</Label>
                        <Select
                          value={selectedLine.toString()}
                          onValueChange={(value) => setSelectedLine(Number.parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select line" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Line 1</SelectItem>
                            <SelectItem value="2">Line 2</SelectItem>
                            <SelectItem value="3">Line 3</SelectItem>
                            <SelectItem value="4">Line 4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="starter" checked={isStarter} onCheckedChange={setIsStarter} />
                        <Label htmlFor="starter">Starter</Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddPlayerDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPlayer} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saving ? "Adding..." : "Add to Lineup"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {homeTeamLineup.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Line</TableHead>
                      <TableHead>Starter</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortLineup(homeTeamLineup).map((lineupItem) => (
                      <TableRow key={lineupItem.id}>
                        <TableCell>{getPlayerName(lineupItem.player_id, "home")}</TableCell>
                        <TableCell>{lineupItem.position}</TableCell>
                        <TableCell>Line {lineupItem.line_number}</TableCell>
                        <TableCell>
                          <Switch
                            checked={lineupItem.is_starter}
                            onCheckedChange={(checked) => handleToggleStarter(lineupItem.id, checked)}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleRemovePlayer(lineupItem.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No players have been added to the lineup yet.</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      setCurrentTeam("home")
                      setAddPlayerDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="away">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{match.away_team.name} Lineup</h3>
                <Dialog
                  open={addPlayerDialogOpen && currentTeam === "away"}
                  onOpenChange={(open) => {
                    setAddPlayerDialogOpen(open)
                    if (open) setCurrentTeam("away")
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Player
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Player to Lineup</DialogTitle>
                      <DialogDescription>
                        Add a player to the {match.away_team.name} lineup for this match.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="player">Player</Label>
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAwayTeamPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.user?.gamer_tag_id || "Unknown Player"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map((position) => (
                              <SelectItem key={position.value} value={position.value}>
                                {position.label} ({position.value})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="line">Line Number</Label>
                        <Select
                          value={selectedLine.toString()}
                          onValueChange={(value) => setSelectedLine(Number.parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select line" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Line 1</SelectItem>
                            <SelectItem value="2">Line 2</SelectItem>
                            <SelectItem value="3">Line 3</SelectItem>
                            <SelectItem value="4">Line 4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="starter-away" checked={isStarter} onCheckedChange={setIsStarter} />
                        <Label htmlFor="starter-away">Starter</Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddPlayerDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPlayer} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saving ? "Adding..." : "Add to Lineup"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {awayTeamLineup.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Line</TableHead>
                      <TableHead>Starter</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortLineup(awayTeamLineup).map((lineupItem) => (
                      <TableRow key={lineupItem.id}>
                        <TableCell>{getPlayerName(lineupItem.player_id, "away")}</TableCell>
                        <TableCell>{lineupItem.position}</TableCell>
                        <TableCell>Line {lineupItem.line_number}</TableCell>
                        <TableCell>
                          <Switch
                            checked={lineupItem.is_starter}
                            onCheckedChange={(checked) => handleToggleStarter(lineupItem.id, checked)}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleRemovePlayer(lineupItem.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No players have been added to the lineup yet.</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      setCurrentTeam("away")
                      setAddPlayerDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
