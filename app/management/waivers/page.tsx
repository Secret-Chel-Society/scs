// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Clock, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Gavel,
  UserMinus,
  UserPlus,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Player {
  id: string
  salary: number
  role: string
  status: string
  users: {
    id: string
    gamer_tag_id: string
    primary_position: string
    secondary_position?: string
    console: string
    avatar_url?: string
  }
}

interface Team {
  id: string
  name: string
  logo_url?: string
}

interface Waiver {
  id: string
  player_id: string
  waiving_team_id: string
  waived_at: string
  claim_deadline: string
  status: string
  winning_team_id?: string
  processed_at?: string
  created_at: string
  updated_at: string
  players: Player
  waiving_team: Team
  winning_team?: Team
  waiver_claims?: Array<{
    id: string
    claiming_team_id: string
    priority_at_claim: number
    status: string
    created_at: string
    teams: Team
  }>
  hasTeamClaimed?: boolean
}

interface WaiverPriority {
  id: string
  team_id: string
  priority: number
  last_used?: string
  teams: Team
}

const WaiversPage = () => {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  
  // State
  const [waivers, setWaivers] = useState<Waiver[]>([])
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [waiverPriority, setWaiverPriority] = useState<WaiverPriority[]>([])
  const [teamData, setTeamData] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingWaivers, setLoadingWaivers] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [waiveReason, setWaiveReason] = useState('')
  const [showWaiveDialog, setShowWaiveDialog] = useState(false)
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [selectedWaiver, setSelectedWaiver] = useState<Waiver | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load waivers when status changes
  useEffect(() => {
    if (teamData) {
      loadWaivers()
    }
  }, [selectedStatus, teamData])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user's team
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data: player } = await supabase
        .from('players')
        .select(`
          team_id,
          teams (
            id,
            name,
            logo_url
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (player?.team_id) {
        setTeamData(player.teams)
        await Promise.all([
          loadTeamPlayers(player.team_id),
          loadWaiverPriority()
        ])
      } else {
        setError('You are not on a team')
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamPlayers = async (teamId: string) => {
    try {
      setLoadingPlayers(true)
      const { data: players, error } = await supabase
        .from('players')
        .select(`
          id,
          salary,
          role,
          status,
          users (
            id,
            gamer_tag_id,
            primary_position,
            secondary_position,
            console,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('salary', { ascending: false })

      if (error) throw error
      setTeamPlayers(players || [])
    } catch (error) {
      console.error('Error loading team players:', error)
      toast({
        title: "Error",
        description: "Failed to load team players",
        variant: "destructive"
      })
    } finally {
      setLoadingPlayers(false)
    }
  }

  const loadWaivers = async () => {
    try {
      setLoadingWaivers(true)
      setError(null)

      const response = await fetch(`/api/waivers/v3?status=${selectedStatus}&teamId=${teamData?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setWaivers(data.waivers || [])
    } catch (error) {
      console.error('Error loading waivers:', error)
      setError(error instanceof Error ? error.message : 'Failed to load waivers')
      toast({
        title: "Error",
        description: "Failed to load waivers",
        variant: "destructive"
      })
    } finally {
      setLoadingWaivers(false)
    }
  }

  const loadWaiverPriority = async () => {
    try {
      const { data: priority, error } = await supabase
        .from('waiver_priority')
        .select(`
          id,
          team_id,
          priority,
          last_used,
          teams (
            id,
            name,
            logo_url
          )
        `)
        .order('priority', { ascending: true })

      if (error) throw error
      setWaiverPriority(priority || [])
    } catch (error) {
      console.error('Error loading waiver priority:', error)
    }
  }

  const handleWaivePlayer = async () => {
    if (!selectedPlayer || !teamData) return

    try {
      const response = await fetch('/api/waivers/v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'waive_player',
          playerId: selectedPlayer.id,
          teamId: teamData.id,
          userId: session?.user?.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to waive player')
      }

      toast({
        title: "Success",
        description: "Player placed on waivers successfully",
      })

      setShowWaiveDialog(false)
      setSelectedPlayer(null)
      setWaiveReason('')
      await loadTeamPlayers(teamData.id)
      await loadWaivers()
    } catch (error) {
      console.error('Error waiving player:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to waive player',
        variant: "destructive"
      })
    }
  }

  const handleClaimWaiver = async (waiver: Waiver) => {
    if (!teamData) return

    try {
      const response = await fetch('/api/waivers/v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claim_waiver',
          waiverId: waiver.id,
          teamId: teamData.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim waiver')
      }

      toast({
        title: "Success",
        description: "Waiver claim submitted successfully",
      })

      setShowClaimDialog(false)
      setSelectedWaiver(null)
      await loadWaivers()
    } catch (error) {
      console.error('Error claiming waiver:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to claim waiver',
        variant: "destructive"
      })
    }
  }

  const handleCancelWaiver = async (waiver: Waiver) => {
    if (!teamData) return

    try {
      const response = await fetch('/api/waivers/v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel_waiver',
          waiverId: waiver.id,
          teamId: teamData.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel waiver')
      }

      toast({
        title: "Success",
        description: "Waiver cancelled successfully",
      })

      await loadTeamPlayers(teamData.id)
      await loadWaivers()
    } catch (error) {
      console.error('Error cancelling waiver:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to cancel waiver',
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'claimed': return 'bg-green-100 text-green-800'
      case 'cleared': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />
      case 'claimed': return <CheckCircle2 className="h-4 w-4" />
      case 'cleared': return <XCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const filteredWaivers = waivers.filter(waiver => {
    const playerName = waiver.players.users.gamer_tag_id.toLowerCase()
    const teamName = waiver.waiving_team.name.toLowerCase()
    const search = searchTerm.toLowerCase()
    
    return playerName.includes(search) || teamName.includes(search)
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Waiver Management</h1>
            <p className="text-muted-foreground">Manage player waivers and claims</p>
          </div>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadInitialData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waiver Management</h1>
          <p className="text-muted-foreground">Manage player waivers and claims</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadWaivers} disabled={loadingWaivers}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingWaivers ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Team Info */}
      {teamData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {teamData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{teamPlayers.length}</div>
                <div className="text-sm text-muted-foreground">Active Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {waivers.filter(w => w.waiving_team_id === teamData.id).length}
                </div>
                <div className="text-sm text-muted-foreground">Players on Waivers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {waivers.filter(w => w.hasTeamClaimed).length}
                </div>
                <div className="text-sm text-muted-foreground">Claims Made</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" onClick={() => setSelectedStatus('active')}>
            Active Waivers
          </TabsTrigger>
          <TabsTrigger value="claimed" onClick={() => setSelectedStatus('claimed')}>
            Claimed
          </TabsTrigger>
          <TabsTrigger value="cleared" onClick={() => setSelectedStatus('cleared')}>
            Cleared
          </TabsTrigger>
          <TabsTrigger value="team" onClick={() => setSelectedStatus('team')}>
            My Team
          </TabsTrigger>
        </TabsList>

        {/* Active Waivers Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingWaivers ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWaivers.map((waiver) => (
                <motion.div
                  key={waiver.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {waiver.players.users.avatar_url ? (
                              <Image
                                src={waiver.players.users.avatar_url}
                                alt={waiver.players.users.gamer_tag_id}
                                width={48}
                                height={48}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <Badge className={`absolute -top-2 -right-2 ${getStatusColor(waiver.status)}`}>
                              {getStatusIcon(waiver.status)}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold">{waiver.players.users.gamer_tag_id}</h3>
                            <p className="text-sm text-muted-foreground">
                              {waiver.players.users.primary_position} • {waiver.players.users.console}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${waiver.players.salary.toLocaleString()} • Waived by {waiver.waiving_team.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Time Remaining</div>
                            <div className="font-semibold">
                              {formatTimeRemaining(waiver.claim_deadline)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {waiver.status === 'active' && !waiver.hasTeamClaimed && teamData && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedWaiver(waiver)
                                  setShowClaimDialog(true)
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Claim
                              </Button>
                            )}
                            {waiver.status === 'active' && waiver.waiving_team_id === teamData?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Waiver</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel this waiver? The player will be returned to your team.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelWaiver(waiver)}>
                                      Yes, Cancel Waiver
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Claims Display */}
                      {waiver.waiver_claims && waiver.waiver_claims.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Claims ({waiver.waiver_claims.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {waiver.waiver_claims.map((claim) => (
                              <Badge key={claim.id} variant="outline">
                                {claim.teams.name} (Priority: {claim.priority_at_claim})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredWaivers.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Waivers Found</h3>
                    <p className="text-muted-foreground">
                      {selectedStatus === 'active' 
                        ? 'No active waivers at this time.'
                        : `No ${selectedStatus} waivers found.`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Players</h3>
            <Button
              onClick={() => {
                setSelectedPlayer(null)
                setShowWaiveDialog(true)
              }}
              disabled={teamPlayers.length === 0}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Waive Player
            </Button>
          </div>

          {loadingPlayers ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {teamPlayers.map((player) => (
                <Card key={player.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {player.users.avatar_url ? (
                            <Image
                              src={player.users.avatar_url}
                              alt={player.users.gamer_tag_id}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{player.users.gamer_tag_id}</h4>
                          <p className="text-sm text-muted-foreground">
                            {player.users.primary_position} • {player.users.console}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${player.salary.toLocaleString()} • {player.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPlayer(player)
                          setShowWaiveDialog(true)
                        }}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Waive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {teamPlayers.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Players Found</h3>
                    <p className="text-muted-foreground">
                      No active players found on your team.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Waive Player Dialog */}
      <Dialog open={showWaiveDialog} onOpenChange={setShowWaiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waive Player</DialogTitle>
            <DialogDescription>
              Place a player on waivers. Other teams will have 48 hours to claim them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Player</Label>
              <Select
                value={selectedPlayer?.id || ''}
                onValueChange={(value) => {
                  const player = teamPlayers.find(p => p.id === value)
                  setSelectedPlayer(player || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a player to waive" />
                </SelectTrigger>
                <SelectContent>
                  {teamPlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.users.gamer_tag_id} - {player.users.primary_position} (${player.salary.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for waiving player..."
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowWaiveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleWaivePlayer}
              disabled={!selectedPlayer}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Waive Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim Waiver Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Waiver</DialogTitle>
            <DialogDescription>
              Submit a claim for this player. Your team's waiver priority will be used.
            </DialogDescription>
          </DialogHeader>
          {selectedWaiver && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedWaiver.players.users.avatar_url ? (
                    <Image
                      src={selectedWaiver.players.users.avatar_url}
                      alt={selectedWaiver.players.users.gamer_tag_id}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedWaiver.players.users.gamer_tag_id}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedWaiver.players.users.primary_position} • {selectedWaiver.players.users.console}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${selectedWaiver.players.salary.toLocaleString()} • Waived by {selectedWaiver.waiving_team.name}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Time Remaining:</strong> {formatTimeRemaining(selectedWaiver.claim_deadline)}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Current Claims:</strong> {selectedWaiver.waiver_claims?.length || 0}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedWaiver && handleClaimWaiver(selectedWaiver)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Submit Claim
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WaiversPage
