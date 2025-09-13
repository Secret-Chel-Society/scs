"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Clock, DollarSign, AlertCircle } from 'lucide-react'

interface SimpleWaiverManagerProps {
  teamId: string
  teamName: string
  players: any[]
  onPlayerWaived?: () => void
}

export default function SimpleWaiverManager({ 
  teamId, 
  teamName, 
  players, 
  onPlayerWaived 
}: SimpleWaiverManagerProps) {
  const [waivers, setWaivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const loadWaivers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Loading waivers...')
      const response = await fetch('/api/waivers/v2?status=active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch waivers: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Waivers loaded:', data)
      
      if (data.success && data.waivers) {
        setWaivers(data.waivers)
      } else {
        setError(data.error || 'Failed to load waivers')
      }
    } catch (err) {
      console.error('❌ Error loading waivers:', err)
      setError(err instanceof Error ? err.message : 'Failed to load waivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWaivers()
  }, [])

  const handleWaivePlayer = async (playerId: string) => {
    try {
      setProcessing(playerId)
      setError(null)

      console.log(`🔄 Waiving player ${playerId} from team ${teamId}`)
      
      const response = await fetch('/api/waivers/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'waive',
          playerId,
          teamId
        })
      })

      const data = await response.json()
      console.log('✅ Waive response:', data)

      if (response.ok && data.success) {
        await loadWaivers()
        onPlayerWaived?.()
        alert('Player placed on waivers successfully!')
      } else {
        setError(data.error || 'Failed to waive player')
      }
    } catch (err) {
      console.error('❌ Error waiving player:', err)
      setError(err instanceof Error ? err.message : 'Failed to waive player')
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

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available Players ({waivers.length})</h3>
        <Button onClick={loadWaivers} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {waivers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No players are currently available for claims
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {waivers.map((waiver) => (
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
                    <Badge className="bg-blue-100 text-blue-800">
                      Available
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
