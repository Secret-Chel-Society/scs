"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AddPlayerDialog } from "./add-player-dialog"
import { LineupPosition } from "./lineup-position"

type Player = {
  id: string
  users: {
    gamer_tag_id: string
    primary_position: string
    secondary_position?: string
    avatar_url?: string
  }
}

type LineupPlayer = {
  id: string
  position: string
  line_number: number
  is_starter: boolean
  player_id: string
  players: Player
}

interface LineupCardProps {
  matchId: string
  teamId: string
  teamName: string
  opposingTeamName: string
  matchDate: string
  availablePlayers: any[]
  initialLineup?: LineupPlayer[]
}

export function LineupCard({
  matchId,
  teamId,
  teamName,
  opposingTeamName,
  matchDate,
  availablePlayers,
  initialLineup = [],
}: LineupCardProps) {
  const { toast } = useToast()
  const [lineup, setLineup] = useState<LineupPlayer[]>(initialLineup)
  const [loading, setLoading] = useState(false)
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)

  // Get positions that are already filled
  const filledPositions = lineup.map((player) => player.position)

  // Define all possible positions
  const allPositions = [
    { value: "C", label: "Center" },
    { value: "LW", label: "Left Wing" },
    { value: "RW", label: "Right Wing" },
    { value: "LD", label: "Left Defense" },
    { value: "RD", label: "Right Defense" },
    { value: "G", label: "Goalie" },
  ]

  // Get available positions
  const availablePositions = allPositions.filter((pos) => !filledPositions.includes(pos.value))

  // Filter out players already in the lineup
  const playersNotInLineup = availablePlayers.filter(
    (player) => !lineup.some((lineupPlayer) => lineupPlayer.player_id === player.id),
  )

  const handleAddPlayer = async (playerId: string, position: string) => {
    setLoading(true)

    try {
      const response = await fetch("/api/lineups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          teamId,
          playerId,
          position,
          lineNumber: 1,
          isStarter: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add player to lineup")
      }

      // Find the player details to add to lineup
      const player = availablePlayers.find((p) => p.id === playerId)

      // Add the new player to the lineup
      setLineup([
        ...lineup,
        {
          ...data.lineup,
          players: {
            id: playerId,
            users: player.users,
          },
        },
      ])

      toast({
        title: "Player Added",
        description: `Player has been added to the lineup at position ${position}`,
      })

      setAddPlayerOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePlayer = async (lineupId: string) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/lineups/${lineupId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove player from lineup")
      }

      // Remove the player from the lineup
      setLineup(lineup.filter((player) => player.id !== lineupId))

      toast({
        title: "Player Removed",
        description: "Player has been removed from the lineup",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if lineup is complete (all positions filled)
  const isLineupComplete = lineup.length === 6
  const hasGoalie = lineup.some((player) => player.position === "G")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {teamName} Lineup vs {opposingTeamName}
          </span>
          {isLineupComplete && hasGoalie && (
            <Badge variant="success" className="ml-2">
              Complete
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Match Date: {matchDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Starting Line</h3>
            <Button size="sm" onClick={() => setAddPlayerOpen(true)} disabled={isLineupComplete || loading}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Forward Line */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Forwards</h4>
              <div className="space-y-2">
                <LineupPosition position="LW" lineup={lineup} onRemove={handleRemovePlayer} loading={loading} />
                <LineupPosition position="C" lineup={lineup} onRemove={handleRemovePlayer} loading={loading} />
                <LineupPosition position="RW" lineup={lineup} onRemove={handleRemovePlayer} loading={loading} />
              </div>
            </div>

            {/* Defense Line */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Defense</h4>
              <div className="space-y-2">
                <LineupPosition position="LD" lineup={lineup} onRemove={handleRemovePlayer} loading={loading} />
                <LineupPosition position="RD" lineup={lineup} onRemove={handleRemovePlayer} loading={loading} />
              </div>
            </div>

            {/* Goalie */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Goalie</h4>
              <LineupPosition position="G" lineup={lineup} onRemove={handleRemovePlayer} loading={loading} />
            </div>
          </div>

          {!isLineupComplete && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-amber-800 dark:text-amber-300 text-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Incomplete Lineup</p>
                  <p className="mt-1">Your lineup is missing the following positions:</p>
                  <ul className="list-disc list-inside mt-1">
                    {availablePositions.map((pos) => (
                      <li key={pos.value}>
                        {pos.label} ({pos.value})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!hasGoalie && lineup.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-red-800 dark:text-red-300 text-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Missing Goalie</p>
                  <p className="mt-1">You must add a goalie (G) to your lineup.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        availablePlayers={playersNotInLineup}
        availablePositions={availablePositions}
        onAddPlayer={handleAddPlayer}
        loading={loading}
      />
    </Card>
  )
}
