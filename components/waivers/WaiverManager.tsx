"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Clock, Users, DollarSign, AlertCircle } from 'lucide-react'
import { fetchWaivers, waivePlayer, claimPlayer, cancelWaiver, type Waiver } from '@/lib/waivers'
import { useSupabase } from '@/hooks/use-supabase'

interface WaiverManagerProps {
  teamId: string
  teamName: string
  players: any[]
  onPlayerWaived?: () => void
  onPlayerClaimed?: () => void
}

export default function WaiverManager({ 
  teamId, 
  teamName, 
  players, 
  onPlayerWaived,
  onPlayerClaimed 
}: WaiverManagerProps) {
  const { session } = useSupabase()
  const [waivers, setWaivers] = useState<Waiver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const loadWaivers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchWaivers('active')
      
      if (result.success && result.waivers) {
        setWaivers(result.waivers)
      } else {
        setError(result.error || 'Failed to load waivers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load waivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWaivers()
  }, [])

  const handleWaivePlayer = async (playerId: string) => {
    if (!session?.user?.id) {
      setError('You must be logged in to waive players')
      return
    }

    try {
      setProcessing(playerId)
      setError(null)

      const result = await waivePlayer(playerId, teamId)
      
      if (result.success) {
        await loadWaivers()
        onPlayerWaived?.()
      } else {
        setError(result.error || 'Failed to waive player')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to waive player')
    } finally {
      setProcessing(null)
    }
  }

  const handleClaimPlayer = async (waiverId: string) => {
    if (!session?.user?.id) {
      setError('You must be logged in to claim players')
      return
    }

    try {
      setProcessing(waiverId)
      setError(null)

      const result = await claimPlayer(waiverId, teamId)
      
      if (result.success) {
        await loadWaivers()
        onPlayerClaimed?.()
      } else {
        setError(result.error || 'Failed to claim player')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim player')
    } finally {
      setProcessing(null)
    }
  }

  const handleCancelWaiver = async (waiverId: string) => {
    if (!session?.user?.id) {
      setError('You must be logged in to cancel waivers')
      return
    }

    try {
      setProcessing(waiverId)
      setError(null)

      const result = await cancelWaiver(waiverId, teamId)
      
      if (result.success) {
        await loadWaivers()
      } else {
        setError(result.error || 'Failed to cancel waiver')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel waiver')
    } finally {
      setProcessing(null)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'claimed': return 'bg-green-100 text-green-800'
      case 'cleared': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const myTeamWaivers = waivers.filter(w => w.waiving_team_id === teamId)
  const otherTeamWaivers = waivers.filter(w => w.waiving_team_id !== teamId)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading waivers...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Players</TabsTrigger>
          <TabsTrigger value="my-waivers">My Waivers</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Players Available for Claims</h3>
            <Button onClick={loadWaivers} variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          {otherTeamWaivers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No players are currently available for claims
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {otherTeamWaivers.map((waiver) => (
                <Card key={waiver.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-semibold">
                            {waiver.players?.users?.gamer_tag_id || 'Unknown Player'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {waiver.players?.users?.primary_position} • {waiver.waiving_team?.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${waiver.players?.salary?.toLocaleString() || 'N/A'}</span>
                          </Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeRemaining(waiver.claim_deadline)}</span>
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {waiver.waiver_claims?.some(claim => claim.claiming_team_id === teamId) ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Claimed
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleClaimPlayer(waiver.id)}
                            disabled={processing === waiver.id}
                            size="sm"
                          >
                            {processing === waiver.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Claim'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-waivers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Waived Players</h3>
            <Button onClick={loadWaivers} variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          {myTeamWaivers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                You haven't waived any players
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myTeamWaivers.map((waiver) => (
                <Card key={waiver.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-semibold">
                            {waiver.players?.users?.gamer_tag_id || 'Unknown Player'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {waiver.players?.users?.primary_position} • Claim Deadline: {new Date(waiver.claim_deadline).toLocaleString()}
                          </p>
                          {waiver.waiver_claims && waiver.waiver_claims.length > 0 && (
                            <p className="text-sm text-blue-600">
                              {waiver.waiver_claims.length} claim(s) received
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(waiver.status)}>
                            {waiver.status}
                          </Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeRemaining(waiver.claim_deadline)}</span>
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleCancelWaiver(waiver.id)}
                          disabled={processing === waiver.id || waiver.status !== 'active'}
                          variant="outline"
                          size="sm"
                        >
                          {processing === waiver.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Team Roster for Waiving */}
      <Card>
        <CardHeader>
          <CardTitle>Team Roster - Waive Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {players
              .filter(player => player.team_id === teamId && player.status === 'active')
              .map((player) => (
                <div key={player.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h4 className="font-semibold">{player.users?.gamer_tag_id || 'Unknown Player'}</h4>
                    <p className="text-sm text-gray-600">
                      {player.users?.primary_position} • ${player.salary?.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleWaivePlayer(player.id)}
                    disabled={processing === player.id}
                    variant="outline"
                    size="sm"
                  >
                    {processing === player.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Waive'
                    )}
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
