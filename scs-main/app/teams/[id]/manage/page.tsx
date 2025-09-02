"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { makeAuthenticatedRequest } from "@/lib/supabase/auth-client"

interface Team {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
}

interface Player {
  id: string
  name: string
  position: string
  team_id: string
}

interface Waiver {
  id: string
  player_id: string
  team_id: string
  created_at: string
  player: Player
}

const TeamManagePage = () => {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [waivers, setWaivers] = useState<Waiver[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerPosition, setNewPlayerPosition] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [waivingPlayer, setWaivingPlayer] = useState<string | null>(null)
  const [claimingWaiver, setClaimingWaiver] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamData()
    fetchPlayers()
    fetchWaivers()
  }, [teamId])

  const fetchTeamData = async () => {
    setIsLoading(true)
    try {
      const result = await makeAuthenticatedRequest(`/api/teams/${teamId}`, {
        method: "GET",
      })

      if (result.success) {
        setTeam(result.team)
      } else {
        throw new Error(result.error || "Failed to fetch team data")
      }
    } catch (error: any) {
      console.error("Error fetching team:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch team data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      const result = await makeAuthenticatedRequest(`/api/teams/${teamId}/players`, {
        method: "GET",
      })

      if (result.success) {
        setPlayers(result.players)
      } else {
        throw new Error(result.error || "Failed to fetch players")
      }
    } catch (error: any) {
      console.error("Error fetching players:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch players",
        variant: "destructive",
      })
    }
  }

  const fetchWaivers = async () => {
    try {
      const result = await makeAuthenticatedRequest(`/api/waivers`, {
        method: "GET",
      })

      if (result.success) {
        setWaivers(result.waivers)
      } else {
        throw new Error(result.error || "Failed to fetch waivers")
      }
    } catch (error: any) {
      console.error("Error fetching waivers:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch waivers",
        variant: "destructive",
      })
    }
  }

  const handleAddPlayer = async () => {
    setIsAddingPlayer(true)
    try {
      const result = await makeAuthenticatedRequest(`/api/teams/${teamId}/players`, {
        method: "POST",
        body: JSON.stringify({ name: newPlayerName, position: newPlayerPosition }),
      })

      if (result.success) {
        toast({
          title: "Player Added",
          description: result.message,
        })
        setNewPlayerName("")
        setNewPlayerPosition("")
        fetchPlayers()
      } else {
        throw new Error(result.error || "Failed to add player")
      }
    } catch (error: any) {
      console.error("Error adding player:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add player",
        variant: "destructive",
      })
    } finally {
      setIsAddingPlayer(false)
    }
  }

  const handleWaivePlayer = async (playerId: string) => {
    try {
      setWaivingPlayer(playerId)

      const result = await makeAuthenticatedRequest("/api/waivers", {
        method: "POST",
        body: JSON.stringify({ playerId }),
      })

      if (result.success) {
        toast({
          title: "Player Waived",
          description: result.message,
        })

        // Refresh the team data
        fetchTeamData()
      } else {
        throw new Error(result.error || "Failed to waive player")
      }
    } catch (error: any) {
      console.error("Error waiving player:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to waive player",
        variant: "destructive",
      })
    } finally {
      setWaivingPlayer(null)
    }
  }

  const handleClaimWaiver = async (waiverId: string) => {
    try {
      setClaimingWaiver(waiverId)

      const result = await makeAuthenticatedRequest("/api/waivers/claim", {
        method: "POST",
        body: JSON.stringify({ waiverId }),
      })

      if (result.success) {
        toast({
          title: "Waiver Claimed",
          description: result.message,
        })

        // Refresh waivers data
        fetchWaivers()
      } else {
        throw new Error(result.error || "Failed to claim waiver")
      }
    } catch (error: any) {
      console.error("Error claiming waiver:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to claim waiver",
        variant: "destructive",
      })
    } finally {
      setClaimingWaiver(null)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!team) {
    return <div>Team not found</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{team.name} Management</CardTitle>
          <CardDescription>{team.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Team Players</h2>
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>{player.name}</TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleWaivePlayer(player.id)}
                            disabled={waivingPlayer === player.id}
                          >
                            {waivingPlayer === player.id ? "Waiving..." : "Waive"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Add Player</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Player</DialogTitle>
                    <DialogDescription>Add a new player to your team.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="position" className="text-right">
                        Position
                      </Label>
                      <Input
                        id="position"
                        value={newPlayerPosition}
                        onChange={(e) => setNewPlayerPosition(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <Button type="submit" onClick={handleAddPlayer} disabled={isAddingPlayer}>
                    {isAddingPlayer ? "Adding..." : "Add Player"}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Waivers</h2>
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Waived At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waivers.map((waiver) => (
                      <TableRow key={waiver.id}>
                        <TableCell>{waiver.player.name}</TableCell>
                        <TableCell>{waiver.player.position}</TableCell>
                        <TableCell>{new Date(waiver.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleClaimWaiver(waiver.id)}
                            disabled={claimingWaiver === waiver.id}
                          >
                            {claimingWaiver === waiver.id ? "Claiming..." : "Claim"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TeamManagePage
