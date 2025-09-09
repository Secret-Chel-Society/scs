// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, Users, DollarSign, Trophy, Zap, RefreshCw } from "lucide-react"
import { processBidWinner } from "@/app/actions/bidding"

interface Bid {
  id: string
  player_id: string
  team_id: string
  bid_amount: number
  bid_expires_at: string
  status: string
  finalized: boolean
  created_at: string
  players: {
    id: string
    user_id: string
    users: {
      gamer_tag_id: string
      discord_id?: string
    }
  }
  teams: {
    id: string
    name: string
    logo_url?: string
  }
}

export function BidProcessor() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [autoProcessing, setAutoProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    activeBids: number
    expiredBids: number
    totalBids: number
  } | null>(null)
  const { toast } = useToast()
  const { supabase } = useSupabase()

  const fetchBids = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("player_bidding")
        .select(`
          *,
          players!player_bidding_player_id_fkey(
            id,
            user_id,
            users!players_user_id_fkey(gamer_tag_id, discord_id)
          ),
          teams!player_bidding_team_id_fkey(
            id,
            name,
            logo_url
          )
        `)
        .eq("finalized", false)
        .order("bid_amount", { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setBids(data || [])
      
      // Also fetch stats
      await fetchStats()
    } catch (err: any) {
      console.error("Error fetching bids:", err)
      setError(err.message || "Failed to fetch bids")
      toast({
        title: "Error",
        description: "Failed to fetch bids",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/process-expired-bids", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const processExpiredBids = async () => {
    try {
      setAutoProcessing(true)
      
      const response = await fetch("/api/admin/process-expired-bids", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Bids Processed Successfully",
          description: result.message,
        })
        await fetchBids() // Refresh the list
      } else {
        throw new Error(result.message || "Failed to process expired bids")
      }
    } catch (err: any) {
      console.error("Error processing expired bids:", err)
      toast({
        title: "Error Processing Bids",
        description: err.message || "Failed to process expired bids",
        variant: "destructive",
      })
    } finally {
      setAutoProcessing(false)
    }
  }

  useEffect(() => {
    fetchBids()
  }, [])

  const processBid = async (bidId: string, teamId: string, amount: number) => {
    try {
      setProcessing(bidId)
      
      const result = await processBidWinner(bidId, teamId, amount)
      
      if (result.success) {
        toast({
          title: "Bid Processed Successfully",
          description: result.message,
        })
        await fetchBids() // Refresh the list
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      console.error("Error processing bid:", err)
      toast({
        title: "Error Processing Bid",
        description: err.message || "Failed to process bid",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const getBidStatus = (bid: Bid) => {
    const now = new Date()
    const expiresAt = new Date(bid.bid_expires_at)
    
    if (expiresAt <= now) {
      return { status: "expired", color: "destructive", icon: Clock }
    }
    
    const timeLeft = expiresAt.getTime() - now.getTime()
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hoursLeft < 1) {
      return { status: `${minutesLeft}m left`, color: "destructive", icon: Clock }
    } else if (hoursLeft < 24) {
      return { status: `${hoursLeft}h left`, color: "default", icon: Clock }
    } else {
      return { status: `${Math.floor(hoursLeft / 24)}d left`, color: "secondary", icon: Clock }
    }
  }

  const getHighestBidForPlayer = (playerId: string) => {
    const playerBids = bids.filter(bid => bid.player_id === playerId)
    return playerBids.reduce((highest, current) => 
      current.bid_amount > highest.bid_amount ? current : highest
    )
  }

  const getPlayerBids = (playerId: string) => {
    return bids.filter(bid => bid.player_id === playerId)
      .sort((a, b) => b.bid_amount - a.bid_amount)
  }

  const uniquePlayers = Array.from(new Set(bids.map(bid => bid.player_id)))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Bid Processor
          </CardTitle>
          <CardDescription>Process winning bids and assign players to teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Bid Processor
          </CardTitle>
          <CardDescription>Process winning bids and assign players to teams</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchBids} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Bid Processor
        </CardTitle>
        <CardDescription>
          Process winning bids and assign players to teams. Found {bids.length} active bids for {uniquePlayers.length} players.
        </CardDescription>
        {stats && (
          <div className="flex gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {stats.activeBids} Active
            </Badge>
            <Badge variant="destructive" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {stats.expiredBids} Expired
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {stats.totalBids} Total
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Automatic Processing Section */}
        {stats && stats.expiredBids > 0 && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <Zap className="h-4 w-4 text-orange-600" />
            <AlertTitle>Expired Bids Detected</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                There are {stats.expiredBids} expired bids waiting to be processed automatically. 
                The system will process these automatically via cron job, or you can process them manually now.
              </span>
              <Button
                size="sm"
                onClick={processExpiredBids}
                disabled={autoProcessing}
                className="ml-4 bg-orange-600 hover:bg-orange-700"
              >
                {autoProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Process Now
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {bids.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>No Active Bids</AlertTitle>
            <AlertDescription>
              There are currently no active bids to process.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {uniquePlayers.map(playerId => {
              const playerBids = getPlayerBids(playerId)
              const highestBid = getHighestBidForPlayer(playerId)
              const player = highestBid.players
              const bidStatus = getBidStatus(highestBid)
              const StatusIcon = bidStatus.icon

              return (
                <Card key={playerId} className="border-ice-blue-200/50 dark:border-ice-blue-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-ice-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{player.users.gamer_tag_id}</CardTitle>
                          <CardDescription>
                            {playerBids.length} bid{playerBids.length !== 1 ? 's' : ''} • Highest: ${highestBid.bid_amount.toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={bidStatus.color as any} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {bidStatus.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {playerBids.map((bid, index) => (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            index === 0 
                              ? 'bg-ice-blue-50/50 dark:bg-ice-blue-900/20 border-ice-blue-200 dark:border-ice-blue-700' 
                              : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {bid.teams.logo_url && (
                                <img 
                                  src={bid.teams.logo_url} 
                                  alt={bid.teams.name}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <span className="font-medium">{bid.teams.name}</span>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${bid.bid_amount.toLocaleString()}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="default" className="bg-green-600">
                                Highest
                              </Badge>
                            )}
                          </div>
                          {index === 0 && (
                            <Button
                              size="sm"
                              onClick={() => processBid(bid.id, bid.team_id, bid.bid_amount)}
                              disabled={processing === bid.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing === bid.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                "Process Bid"
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t">
          <Button onClick={fetchBids} variant="outline">
            Refresh Bids
          </Button>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
