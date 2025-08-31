"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeftRight, AlertCircle, TrendingUp, Users, Clock, Zap } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export function RecentTrades() {
  const { supabase } = useSupabase()
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Record<string, any>>({})
  const [players, setPlayers] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Check if trades table exists
        const { error: tableError } = await supabase.from("trades").select("id").limit(1)
        if (tableError && tableError.message.includes("relation") && tableError.message.includes("does not exist")) {
          setTableExists(false)
          setError("The trades table does not exist yet.")
          setLoading(false)
          return
        }

        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*")
        if (teamsError) {
          console.error("Error fetching teams:", teamsError)
          setError(`Failed to load teams: ${teamsError.message}`)
          setLoading(false)
          return
        }

        const teamMap: Record<string, any> = {}
        teamsData?.forEach((team) => {
          teamMap[team.id] = team
        })
        setTeams(teamMap)

        // Fetch players
        const { data: playersData, error: playersError } = await supabase.from("players").select(`
          id,
          user_id,
          team_id,
          salary,
          role,
          users (
            id,
            gamer_tag_id,
            email,
            primary_position,
            secondary_position
          )
        `)

        if (playersError) {
          console.error("Error fetching players:", playersError)
          setError(`Failed to load players: ${playersError.message}`)
          setLoading(false)
          return
        }

        const playerMap: Record<string, any> = {}
        playersData?.forEach((player) => {
          playerMap[player.id] = player
        })
        setPlayers(playerMap)

        // Fetch trades - try without status filter first to see all trades
        const { data: allTradesData, error: allTradesError } = await supabase
          .from("trades")
          .select(`
            id, 
            created_at, 
            team1_id, 
            team2_id, 
            team1_players, 
            team2_players,
            status,
            trade_date
          `)
          .order("created_at", { ascending: false })

        if (allTradesError) {
          console.error("Error loading trades:", allTradesError)
          setError(`Failed to load trades: ${allTradesError.message}`)
          setLoading(false)
          return
        }

        console.log("All trades from database:", allTradesData)
        console.log("Number of trades:", allTradesData?.length || 0)

        // Filter for completed trades or use all trades if no status column
        const filteredTrades = allTradesData || []

        // Check if status column exists and filter accordingly
        if (filteredTrades.length > 0 && "status" in filteredTrades[0]) {
          const completedTrades = filteredTrades.filter((trade) => trade.status === "completed")
          console.log("Completed trades:", completedTrades.length)

          // If no completed trades but there are trades, show all trades
          if (completedTrades.length === 0 && filteredTrades.length > 0) {
            console.log("No completed trades found, showing all trades")
            setTrades(filteredTrades)
          } else {
            setTrades(completedTrades)
          }
        } else {
          // No status column, show all trades
          console.log("No status column found, showing all trades")
          setTrades(filteredTrades)
        }

        setLoading(false)
      } catch (error: any) {
        console.error("Error in fetchData:", error)
        setError(`Failed to load data: ${error.message || "Unknown error"}`)
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription
    const tradesSubscription = supabase
      .channel("recent-trades-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trades",
        },
        (payload) => {
          console.log("Trade subscription event:", payload)
          if (payload.new) {
            setTrades((currentTrades) => {
              const updatedTrades = [payload.new, ...currentTrades]
              updatedTrades.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              return updatedTrades.slice(0, 10)
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tradesSubscription)
    }
  }, [supabase])

  const renderPlayer = (player: any) => {
    if (typeof player === "string") {
      const playerData = players[player]
      if (playerData) {
        const gamerTag = playerData.users?.gamer_tag_id || "Unknown Player"
        const primaryPos = playerData.users?.primary_position || ""
        const secondaryPos = playerData.users?.secondary_position || ""
        const positions = [primaryPos, secondaryPos].filter(Boolean).join("/")
        const salary = playerData.salary || 0

        return (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-sm text-white">{gamerTag}</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {positions && (
                <Badge variant="outline" className="text-xs py-1 h-6 w-fit bg-blue-500/10 text-blue-300 border-blue-500/30">
                  {positions}
                </Badge>
              )}
              {salary > 0 && (
                <Badge variant="outline" className="text-xs py-1 h-6 w-fit bg-green-500/10 text-green-300 border-green-500/30">
                  ${(salary / 1000000).toFixed(2)}M
                </Badge>
              )}
            </div>
          </div>
        )
      }
      return <span className="text-sm text-white/70">{player}</span>
    }

    const playerId = player?.id || player?.player_id
    const playerData = playerId ? players[playerId] : null

    let gamerTag, primaryPos, secondaryPos, salary

    if (playerData) {
      gamerTag = playerData.users?.gamer_tag_id || "Unknown Player"
      primaryPos = playerData.users?.primary_position || ""
      secondaryPos = playerData.users?.secondary_position || ""
      salary = playerData.salary || 0
    } else {
      gamerTag = player?.name || player?.player_name || player?.gamer_tag_id || "Unknown Player"
      primaryPos = player?.primary_position || player?.position || ""
      secondaryPos = player?.secondary_position || ""
      salary = player?.salary || 0
    }

    const positions = [primaryPos, secondaryPos].filter(Boolean).join("/")

    return (
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-sm text-white">{gamerTag}</span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {positions && (
            <Badge variant="outline" className="text-xs py-1 h-6 w-fit bg-blue-500/10 text-blue-300 border-blue-500/30">
              {positions}
            </Badge>
          )}
          {salary > 0 && (
            <Badge variant="outline" className="text-xs py-1 h-6 w-fit bg-green-500/10 text-green-300 border-green-500/30">
              ${(salary / 1000000).toFixed(2)}M
            </Badge>
          )}
        </div>
      </div>
    )
  }

  const parsePlayerData = (playerData: any) => {
    if (!playerData) return []

    try {
      if (typeof playerData === "string") {
        return JSON.parse(playerData)
      }
      return Array.isArray(playerData) ? playerData : []
    } catch (e) {
      console.error("Error parsing player data:", e)
      return []
    }
  }

  const renderTeamInfo = (teamId: string, fallbackName?: string) => {
    const team = teams[teamId]

    if (team) {
      return (
        <div className="flex items-center gap-3 min-w-0">
          {team.logo_url ? (
            <Image
              src={team.logo_url || "/placeholder.svg"}
              alt={team.name}
              width={32}
              height={32}
              className="rounded-full flex-shrink-0 border-2 border-white/20"
            />
          ) : (
            <TeamLogo teamName={team.name} size="md" />
          )}
          <span className="font-semibold text-sm truncate text-white">{team.name}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex-shrink-0 border border-white/20" />
        <span className="font-semibold text-sm truncate text-white/70">{fallbackName || `Team ${teamId}`}</span>
      </div>
    )
  }

  if (!tableExists) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Recent Trades</CardTitle>
              <CardDescription className="text-white/70">Latest player movements around the league</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-white/70 mb-4">Trades feature is not yet set up.</p>
              <Button variant="outline" size="sm" asChild className="bg-transparent border-white/20 text-white hover:bg-white/10">
                <Link href="/news/trades">Set Up Trades</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Recent Trades</CardTitle>
              <CardDescription className="text-white/70">Latest player movements around the league</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full bg-white/10" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Recent Trades</CardTitle>
              <CardDescription className="text-white/70">Latest player movements around the league</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (trades.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Recent Trades</CardTitle>
              <CardDescription className="text-white/70">Latest player movements around the league</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full">
                <ArrowLeftRight className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-white/70">No trades found.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-white">Recent Trades</CardTitle>
            <CardDescription className="text-white/70">
              Latest player movements around the league ({trades.length} total)
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 bg-transparent border-white/20 text-white hover:bg-white/10">
          <Link href="/news/trades" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">View All</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {trades.slice(0, 5).map((trade, index) => {
            const team1Players = parsePlayerData(trade.team1_players)
            const team2Players = parsePlayerData(trade.team2_players)

            return (
              <motion.div 
                key={trade.id} 
                className="space-y-4 pb-6 border-b border-white/10 last:border-0 last:pb-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {/* Trade Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {renderTeamInfo(trade.team1_id)}
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full">
                        <ArrowLeftRight className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    {renderTeamInfo(trade.team2_id)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60 whitespace-nowrap ml-4">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Team 1 Players */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                        {teams[trade.team1_id]?.name || `Team ${trade.team1_id}`} Traded
                      </span>
                    </div>
                    {team1Players && team1Players.length > 0 ? (
                      <div className="space-y-3 pl-4 border-l-2 border-blue-500/30">
                        {team1Players.map((player: any, playerIndex: number) => (
                          <motion.div 
                            key={`team1-${playerIndex}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.1 + playerIndex * 0.05 }}
                          >
                            {renderPlayer(player)}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 italic text-sm pl-4">No players</p>
                    )}
                  </div>

                  {/* Team 2 Players */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full" />
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                        {teams[trade.team2_id]?.name || `Team ${trade.team2_id}`} Traded
                      </span>
                    </div>
                    {team2Players && team2Players.length > 0 ? (
                      <div className="space-y-3 pl-4 border-l-2 border-purple-500/30">
                        {team2Players.map((player: any, playerIndex: number) => (
                          <motion.div 
                            key={`team2-${playerIndex}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.1 + playerIndex * 0.05 }}
                          >
                            {renderPlayer(player)}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 italic text-sm pl-4">No players</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
