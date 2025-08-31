"use client"

import React, { useState, useEffect } from "react"
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
import { motion } from "framer-motion"
import { ArrowLeft, Users, Plus, Trash2, AlertTriangle, Crown, Shield, UserPlus, UserMinus, Settings, Target, DollarSign } from "lucide-react"
import Link from "next/link"

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

  const addPlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerPosition.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsAddingPlayer(true)
    try {
      const result = await makeAuthenticatedRequest(`/api/teams/${teamId}/players`, {
        method: "POST",
        body: JSON.stringify({
          name: newPlayerName,
          position: newPlayerPosition,
        }),
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Player added successfully",
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

  const waivePlayer = async (playerId: string) => {
    setWaivingPlayer(playerId)
    try {
      const result = await makeAuthenticatedRequest(`/api/waivers`, {
        method: "POST",
        body: JSON.stringify({
          player_id: playerId,
          team_id: teamId,
        }),
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Player waived successfully",
        })
        fetchPlayers()
        fetchWaivers()
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

  const claimWaiver = async (waiverId: string) => {
    setClaimingWaiver(waiverId)
    try {
      const result = await makeAuthenticatedRequest(`/api/waivers/${waiverId}/claim`, {
        method: "POST",
        body: JSON.stringify({
          team_id: teamId,
        }),
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Player claimed successfully",
        })
        fetchPlayers()
        fetchWaivers()
      } else {
        throw new Error(result.error || "Failed to claim player")
      }
    } catch (error: any) {
      console.error("Error claiming player:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to claim player",
        variant: "destructive",
      })
    } finally {
      setClaimingWaiver(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href={`/teams/${teamId}`} className="text-purple-300 hover:text-purple-200">
              Back to Team
            </Link>
          </div>
          <div className="animate-pulse">
            <div className="h-64 bg-white/10 rounded-2xl mb-8"></div>
            <div className="h-96 bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href="/teams" className="text-purple-300 hover:text-purple-200">
              Back to Teams
            </Link>
          </div>
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold mb-4 text-white">Team Not Found</h1>
              <p className="text-purple-300">The team you are looking for does not exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Navigation */}
          <motion.div 
            className="flex items-center gap-2 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href={`/teams/${teamId}`} className="text-purple-300 hover:text-purple-200 transition-colors">
              Back to Team
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full">
                    <Settings className="h-6 w-6 text-purple-400" />
                  </div>
                  Team Management
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Manage {team.name} roster, waivers, and team settings
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Roster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    Current Roster
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    {players.length} players on the roster
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/5">
                          <TableHead className="text-purple-300">Player</TableHead>
                          <TableHead className="text-purple-300">Position</TableHead>
                          <TableHead className="text-purple-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player) => (
                          <TableRow key={player.id} className="border-white/20 hover:bg-white/5">
                            <TableCell className="font-medium text-white">{player.name}</TableCell>
                            <TableCell className="text-purple-300">{player.position}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => waivePlayer(player.id)}
                                disabled={waivingPlayer === player.id}
                                className="bg-red-500/10 border-red-400/30 text-red-300 hover:bg-red-500/20 hover:border-red-400/50"
                              >
                                {waivingPlayer === player.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-300"></div>
                                ) : (
                                  <>
                                    <UserMinus className="h-4 w-4 mr-1" />
                                    Waive
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {players.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-purple-300 py-8">
                              No players on roster
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Add Player & Waivers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-8"
            >
              {/* Add Player */}
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full">
                      <UserPlus className="h-5 w-5 text-green-400" />
                    </div>
                    Add Player
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Add a new player to the roster
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="player-name" className="text-purple-300">Player Name</Label>
                    <Input
                      id="player-name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Enter player name"
                      className="bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300/70 focus:bg-white/20 focus:border-purple-400/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="player-position" className="text-purple-300">Position</Label>
                    <Input
                      id="player-position"
                      value={newPlayerPosition}
                      onChange={(e) => setNewPlayerPosition(e.target.value)}
                      placeholder="Enter position"
                      className="bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300/70 focus:bg-white/20 focus:border-purple-400/50"
                    />
                  </div>
                  <Button
                    onClick={addPlayer}
                    disabled={isAddingPlayer || !newPlayerName.trim() || !newPlayerPosition.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {isAddingPlayer ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Player
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Available Waivers */}
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    Available Waivers
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    {waivers.length} players available on waivers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {waivers.length > 0 ? (
                      <div className="space-y-3">
                        {waivers.map((waiver) => (
                          <div
                            key={waiver.id}
                            className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border border-yellow-400/20"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">{waiver.player.name}</div>
                                <div className="text-sm text-yellow-300">{waiver.player.position}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => claimWaiver(waiver.id)}
                                disabled={claimingWaiver === waiver.id}
                                className="bg-green-500/10 border-green-400/30 text-green-300 hover:bg-green-500/20 hover:border-green-400/50"
                              >
                                {claimingWaiver === waiver.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-300"></div>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Claim
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-purple-300 py-8">
                        No players available on waivers
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default TeamManagePage
