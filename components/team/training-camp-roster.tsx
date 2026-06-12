"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, UserPlus, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TCPlayer {
  id: string
  user_id: string
  gamer_tag_id: string
  primary_position: string | null
  secondary_position: string | null
  console: string | null
  is_late_signup: boolean
  tc_team_id: string | null
  tc_team_id_ahl: string | null
  tc_team_id_ecl: string | null
  called_up_ahl: boolean | null
  called_up_ecl: boolean | null
}

interface TrainingCampRosterProps {
  teamId: string
  league: "nhl" | "ahl" | "ecl"
  isManager?: boolean
  onPlayerCallUp?: () => void
}

export function TrainingCampRoster({ teamId, league, isManager = false, onPlayerCallUp }: TrainingCampRosterProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [tcPlayers, setTcPlayers] = useState<TCPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [callingUp, setCallingUp] = useState<string | null>(null)

  useEffect(() => {
    fetchTCPlayers()
  }, [teamId, league])

  async function fetchTCPlayers() {
    setLoading(true)
    try {
      const teamIdField =
        league === "nhl" ? "tc_team_id" : league === "ahl" ? "tc_team_id_ahl" : "tc_team_id_ecl"

      // Filter on the league's tc_team_id column directly (NOT is_tc), so players who were
      // called up to another league but still hold a TC spot here continue to show up.
      const { data, error } = await supabase
        .from("players")
        .select("id, user_id, gamer_tag_id, primary_position, secondary_position, console, is_late_signup, tc_team_id, tc_team_id_ahl, tc_team_id_ecl, called_up_ahl, called_up_ecl")
        .eq(teamIdField, teamId)
        .order("gamer_tag_id")

      if (error) throw error

      setTcPlayers(data || [])
    } catch (error: any) {
      console.error("Error fetching TC players:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCallUp(playerId: string) {
    const player = tcPlayers.find((p) => p.id === playerId)
    if (!player) return

    if (player.is_late_signup) {
      toast({
        title: "Cannot Call Up",
        description: "Late Signup players cannot be called up from Training Camp",
        variant: "destructive",
      })
      return
    }

    setCallingUp(playerId)
    try {
      const response = await fetch("/api/tc/call-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, league }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to call up player")
      }

      toast({
        title: "Success",
        description: data.message,
      })

      // Refresh TC players list and notify parent
      fetchTCPlayers()
      onPlayerCallUp?.()
    } catch (error: any) {
      console.error("Error calling up player:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCallingUp(null)
    }
  }

  function getPositionAbbreviation(position: string | null): string {
    if (!position) return "?"
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Training Camp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tcPlayers.length === 0) {
    return null // Don't show the section if there are no TC players
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Training Camp
          <Badge variant="secondary" className="ml-2">{tcPlayers.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          TC players have $0 salary and don&apos;t count toward roster limits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Console</TableHead>
                {isManager && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tcPlayers.map((player) => {
                // For AHL/ECL TC rosters, a player flagged as called up has been pulled up
                // to a higher league but still holds their TC spot here.
                const isCalledUp =
                  (league === "ahl" && player.called_up_ahl) ||
                  (league === "ecl" && player.called_up_ecl)
                return (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    {player.gamer_tag_id}
                    {player.is_late_signup && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">
                        LS
                      </Badge>
                    )}
                    {isCalledUp && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Called up
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {getPositionAbbreviation(player.primary_position)}
                    {player.secondary_position && `/${getPositionAbbreviation(player.secondary_position)}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {player.console || "—"}
                  </TableCell>
                  {isManager && (
                    <TableCell className="text-right">
                      {isCalledUp ? (
                        <span className="text-xs text-muted-foreground">Called up</span>
                      ) : player.is_late_signup ? (
                        <span className="text-xs text-muted-foreground">Cannot call up LS</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallUp(player.id)}
                          disabled={callingUp === player.id}
                        >
                          {callingUp === player.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 mr-1" />
                              Call Up
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
