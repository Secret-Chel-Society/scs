"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, PlusCircle, AlertTriangle, Loader2, InfoIcon } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RunLineupsMigration } from "./run-lineups-migration"
import { format, startOfWeek, endOfWeek } from "date-fns"

const positions = [
  { value: "C", label: "Center" },
  { value: "LW", label: "Left Wing" },
  { value: "RW", label: "Right Wing" },
  { value: "LD", label: "Left Defense" },
  { value: "RD", label: "Right Defense" },
  { value: "G", label: "Goalie" },
]

export function TeamLineupManager({ matchId, teamId, match }: { matchId: string; teamId: string; match: any }) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [teamLineup, setTeamLineup] = useState<any[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [selectedPosition, setSelectedPosition] = useState<string>("")
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [checkingTable, setCheckingTable] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)
  const [availableSignedUpPlayers, setAvailableSignedUpPlayers] = useState<any[]>([])
  const [irPlayerIds, setIrPlayerIds] = useState<Set<string>>(new Set())

  // Determine if this team is home or away
  const isHomeTeam = match.home_team_id === teamId
  const teamName = isHomeTeam ? match.home_team.name : match.away_team.name
  const opposingTeamName = isHomeTeam ? match.away_team.name : match.home_team.name

  // Check if the lineups table exists
  useEffect(() => {
    async function checkTable() {
      try {
        setCheckingTable(true)
        setTableError(null)

        // Try to query the lineups table
        const { data, error } = await supabase.from("lineups").select("id").limit(1)

        if (error) {
          console.error("Error checking lineups table:", error)
          if (error.message.includes("does not exist")) {
            setTableExists(false)
            setTableError("The lineups table does not exist in the database.")
          } else {
            setTableError(error.message)
          }
        } else {
          setTableExists(true)
        }
      } catch (error: any) {
        console.error("Exception checking lineups table:", error)
        setTableError(error.message)
        if (error.message && error.message.includes("does not exist")) {
          setTableExists(false)
        }
      } finally {
        setCheckingTable(false)
      }
    }

    checkTable()
  }, [supabase])

  useEffect(() => {
    async function fetchData() {
      if (!tableExists) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch the team players
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select(`
            *,
            user:users(id, email, gamer_tag_id, primary_position, secondary_position)
          `)
          .eq("team_id", teamId)

        if (playersError) {
          throw playersError
        }

        setTeamPlayers(playersData || [])

        // Fetch injury reserves for this match's week
        const matchDate = new Date(match.match_date)
        const weekStart = format(startOfWeek(matchDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
        const weekEnd = format(endOfWeek(matchDate, { weekStartsOn: 1 }), "yyyy-MM-dd")

        const { data: injuryReserves, error: irError } = await supabase
          .from("injury_reserves")
          .select("user_id, player_id")
          .eq("status", "active")
          .lte("week_start_date", weekEnd)
          .gte("week_end_date", weekStart)

        if (irError) {
          console.error("Error fetching injury reserves:", irError)
        }

        const irPlayerIdsSet = new Set(injuryReserves?.map((ir) => ir.player_id) || [])
        setIrPlayerIds(irPlayerIdsSet)

        // Fetch game availability for this match
        const { data: availabilityData, error: availabilityError } = await supabase
          .from("game_availability")
          .select(`
            player_id,
            status,
            player:players(
              id,
              user:users(id, email, gamer_tag_id, primary_position, secondary_position)
            )
          `)
          .eq("match_id", matchId)
          .eq("team_id", teamId)
          .eq("status", "available")

        if (availabilityError) {
          console.error("Error fetching availability:", availabilityError)
        } else {
          setAvailableSignedUpPlayers(availabilityData || [])
        }

        // Fetch existing lineups
        const { data: lineupData, error: lineupError } = await supabase
          .from("lineups")
          .select("*")
          .eq("match_id", matchId)
          .eq("team_id", teamId)

        if (lineupError) {
          console.error("Error fetching lineups:", lineupError)
          if (lineupError.message.includes("does not exist")) {
            setTableExists(false)
            setTableError("The lineups table does not exist in the database.")
          } else {
            toast({
              title: "Error",
              description: "Failed to load lineup data: " + lineupError.message,
              variant: "destructive",
            })
          }
        } else {
          setTeamLineup(lineupData || [])
        }
      } catch (error: any) {
        console.error("Error loading data:", error)
        if (error.message && error.message.includes("does not exist")) {
          setTableExists(false)
          setTableError("The lineups table does not exist in the database.")
        } else {
          toast({
            title: "Error",
            description: "Failed to load data: " + error.message,
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    if (matchId && teamId && !checkingTable && tableExists) {
      fetchData()
    }
  }, [supabase, toast, matchId, teamId, tableExists, checkingTable, match.match_date])

  // Update available players whenever lineups change
  useEffect(() => {
    if (teamPlayers.length > 0 && teamLineup.length >= 0) {
      const usedPlayerIds = teamLineup.map((item) => item.player_id)

      // Separate signed up players from others, excluding IR players
      const signedUpPlayerIds = availableSignedUpPlayers.map((avail) => avail.player_id)
      const signedUpPlayers = teamPlayers.filter(
        (player) =>
          signedUpPlayerIds.includes(player.id) && !usedPlayerIds.includes(player.id) && !irPlayerIds.has(player.id),
      )
      const otherPlayers = teamPlayers.filter(
        (player) =>
          !signedUpPlayerIds.includes(player.id) && !usedPlayerIds.includes(player.id) && !irPlayerIds.has(player.id),
      )

      // Prioritize signed up players
      setAvailablePlayers([...signedUpPlayers, ...otherPlayers])
    }
  }, [teamPlayers, teamLineup, availableSignedUpPlayers, irPlayerIds])

  const handleAddPlayer = async () => {
    if (!selectedPlayer || !selectedPosition) {
      toast({
        title: "Missing Information",
        description: "Please select a player and position.",
        variant: "destructive",
      })
      return
    }

    // Check if we already have a player in this position
    const existingPlayerInPosition = teamLineup.find((player) => player.position === selectedPosition)
    if (existingPlayerInPosition) {
      toast({
        title: "Position Already Filled",
        description: `There is already a player assigned to the ${selectedPosition} position. Please remove them first or select a different position.`,
        variant: "destructive",
      })
      return
    }

    // Always use line 1 since we're restricting to one line
    const newLineupItem = {
      match_id: matchId,
      team_id: teamId,
      player_id: selectedPlayer,
      position: selectedPosition,
      line_number: 1, // Always line 1
      is_starter: true, // Always a starter
    }

    try {
      setSaving(true)

      const { data, error } = await supabase.from("lineups").insert(newLineupItem).select()

      if (error) {
        throw error
      }

      // Update the lineup state
      setTeamLineup([...teamLineup, data[0]])

      toast({
        title: "Player Added",
        description: "Player has been added to the lineup.",
      })

      // Reset the form
      setSelectedPlayer("")
      setSelectedPosition("")
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
      setTeamLineup(teamLineup.filter((item) => item.id !== lineupId))

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

  if (checkingTable) {
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

  if (!tableExists || tableError) {
    return (
      <div className="space-y-4">
        {tableError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>{tableError}</AlertDescription>
          </Alert>
        )}
        <RunLineupsMigration />
      </div>
    )
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

  // Get player name from lookup
  const getPlayerName = (playerId: string) => {
    const player = teamPlayers.find((p) => p.id === playerId)
    return player ? player.user?.gamer_tag_id || "Unknown Player" : "Unknown Player"
  }

  // Get player position from lookup
  const getPlayerPosition = (playerId: string) => {
    const player = teamPlayers.find((p) => p.id === playerId)
    return player ? player.user?.primary_position || "Unknown" : "Unknown"
  }

  const matchDate = new Date(match.match_date)
  const formattedDate = matchDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = matchDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Check if we have a complete line (6 players)
  const hasCompleteLine = teamLineup.length === 6
  const hasGoalie = teamLineup.some((player) => player.position === "G")
  const lineupPositions = teamLineup.map((player) => player.position)
  const missingPositions = positions.filter((pos) => !lineupPositions.includes(pos.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {teamName} Lineup vs {opposingTeamName}
        </CardTitle>
        <CardDescription>
          Set your team's lineup for the match on {formattedDate} at {formattedTime}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{teamName} Starting Line</h3>
            <Dialog open={addPlayerDialogOpen} onOpenChange={setAddPlayerDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={hasCompleteLine} onClick={() => setAddPlayerDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Player to Lineup</DialogTitle>
                  <DialogDescription>Add a player to your team's starting line for this match.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="player">Player</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayers.map((player) => {
                          const isSignedUp = availableSignedUpPlayers.some((avail) => avail.player_id === player.id)
                          const isOnIR = irPlayerIds.has(player.id)
                          const primaryPos = player.user?.primary_position || "?"
                          const secondaryPos = player.user?.secondary_position || ""
                          const positionText = secondaryPos ? `${primaryPos}/${secondaryPos}` : primaryPos

                          return (
                            <SelectItem key={player.id} value={player.id} disabled={isOnIR}>
                              <div className="flex items-center gap-2">
                                {isOnIR && <span className="text-orange-600 text-xs">IR</span>}
                                {isSignedUp && <span className="text-green-600 text-xs">✓ Available</span>}
                                <span className={isOnIR ? "text-muted-foreground line-through" : ""}>
                                  {player.user?.gamer_tag_id || "Unknown Player"}
                                </span>
                                <span className="text-muted-foreground">({positionText})</span>
                              </div>
                            </SelectItem>
                          )
                        })}
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
                        {positions
                          .filter((pos) => !lineupPositions.includes(pos.value))
                          .map((position) => (
                            <SelectItem key={position.value} value={position.value}>
                              {position.label} ({position.value})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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

          {availableSignedUpPlayers.length > 0 && (
            <div className="mb-4 p-4 bg-slate-800 border border-slate-600 rounded-lg">
              <h4 className="font-semibold text-green-400 mb-2">
                Players Available ({availableSignedUpPlayers.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSignedUpPlayers.map((availability) => {
                  const player = teamPlayers.find((p) => p.id === availability.player_id)
                  if (!player) return null

                  const primaryPos = player.user?.primary_position || "?"
                  const secondaryPos = player.user?.secondary_position || ""
                  const positionText = secondaryPos ? `${primaryPos}/${secondaryPos}` : primaryPos
                  const isInLineup = teamLineup.some((lineup) => lineup.player_id === player.id)

                  return (
                    <div
                      key={availability.player_id}
                      className={`text-sm p-2 rounded ${isInLineup ? "bg-blue-600 text-blue-100" : "bg-slate-700 text-white"}`}
                    >
                      <div className="font-medium">{player.user?.gamer_tag_id}</div>
                      <div className="text-xs text-muted-foreground">{positionText}</div>
                      {isInLineup && <div className="text-xs text-blue-600">In Lineup</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {teamLineup.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Natural Position</TableHead>
                  <TableHead>Lineup Position</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamLineup.map((lineupItem) => (
                  <TableRow key={lineupItem.id}>
                    <TableCell>{getPlayerName(lineupItem.player_id)}</TableCell>
                    <TableCell>{getPlayerPosition(lineupItem.player_id)}</TableCell>
                    <TableCell>{lineupItem.position}</TableCell>
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
              <Button className="mt-4 bg-transparent" variant="outline" onClick={() => setAddPlayerDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
          )}

          {!hasCompleteLine && teamLineup.length > 0 && (
            <Alert variant="warning" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Incomplete Lineup</AlertTitle>
              <AlertDescription>
                <p>Your lineup is incomplete. You need to add players for the following positions:</p>
                <ul className="list-disc list-inside mt-2">
                  {missingPositions.map((pos) => (
                    <li key={pos.value}>
                      {pos.label} ({pos.value})
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {!hasGoalie && teamLineup.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Missing Goalie</AlertTitle>
              <AlertDescription>You must add a goalie (G) to your lineup.</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Lineup Information</AlertTitle>
              <AlertDescription>
                <p>
                  Set your team's starting line for the upcoming match. You need to assign exactly one player to each
                  position.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>You must have exactly 6 players: 1 center, 2 wings, 2 defensemen, and 1 goalie</li>
                  <li>Try to match players' natural positions when possible</li>
                  <li>All players in this lineup will be starters for the game</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
