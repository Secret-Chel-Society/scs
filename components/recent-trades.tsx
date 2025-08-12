"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeftRight, AlertCircle } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

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
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">{gamerTag}</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              {positions && (
                <Badge variant="outline" className="text-xs py-0 h-5 w-fit">
                  {positions}
                </Badge>
              )}
              {salary > 0 && <span className="text-xs text-muted-foreground">${(salary / 1000000).toFixed(2)}M</span>}
            </div>
          </div>
        )
      }
      return <span className="text-sm">{player}</span>
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
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">{gamerTag}</span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
          {positions && (
            <Badge variant="outline" className="text-xs py-0 h-5 w-fit">
              {positions}
            </Badge>
          )}
          {salary > 0 && <span className="text-xs text-muted-foreground">${(salary / 1000000).toFixed(2)}M</span>}
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
        <div className="flex items-center gap-2 min-w-0">
          {team.logo_url ? (
            <Image
              src={team.logo_url || "/placeholder.svg"}
              alt={team.name}
              width={24}
              height={24}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <TeamLogo teamName={team.name} size="sm" />
          )}
          <span className="font-medium text-sm truncate">{team.name}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 bg-muted rounded-full flex-shrink-0" />
        <span className="font-medium text-sm truncate text-muted-foreground">{fallbackName || `Team ${teamId}`}</span>
      </div>
    )
  }

  if (!tableExists) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Latest player movements around the league</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">Trades feature is not yet set up.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/news/trades">Set Up Trades</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Latest player movements around the league</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Latest player movements around the league</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Latest player movements around the league</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No trades found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Latest player movements around the league ({trades.length} total)</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 bg-transparent">
          <Link href="/news/trades" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">View All</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {trades.slice(0, 5).map((trade) => {
            const team1Players = parsePlayerData(trade.team1_players)
            const team2Players = parsePlayerData(trade.team2_players)

            return (
              <div key={trade.id} className="space-y-4 pb-6 border-b last:border-0 last:pb-0">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {renderTeamInfo(trade.team1_id)}
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mx-2" />
                      {renderTeamInfo(trade.team2_id)}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {teams[trade.team1_id]?.name || `Team ${trade.team1_id}`} Traded
                    </div>
                    {team1Players && team1Players.length > 0 ? (
                      <div className="space-y-2 pl-3 border-l-2 border-muted">
                        {team1Players.map((player: any, index: number) => (
                          <div key={`team1-${index}`}>{renderPlayer(player)}</div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-sm pl-3">No players</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {teams[trade.team2_id]?.name || `Team ${trade.team2_id}`} Traded
                    </div>
                    {team2Players && team2Players.length > 0 ? (
                      <div className="space-y-2 pl-3 border-l-2 border-muted">
                        {team2Players.map((player: any, index: number) => (
                          <div key={`team2-${index}`}>{renderPlayer(player)}</div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-sm pl-3">No players</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
