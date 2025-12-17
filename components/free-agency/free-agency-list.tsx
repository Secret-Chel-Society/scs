"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { BidHistoryModal } from "@/components/free-agency/bid-history-modal"
import { Button } from "@/components/ui/button"
import { History, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"

interface FreeAgencyListProps {
  userId?: string
  searchParams?: { [key: string]: string | string[] | undefined }
}

// Position abbreviation mapping function
function getPositionAbbreviation(position: string): string {
  const positionMap: Record<string, string> = {
    Goalie: "G",
    "Right Wing": "RW",
    "Left Wing": "LW",
    "Left Defense": "LD",
    "Right Defense": "RD",
    Center: "C",
  }

  return positionMap[position] || position
}

// Simple logging function that only logs in development
const safeLog = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}

interface TeamStats {
  current_salary: number
  roster_size: number
  positions: { [key: string]: number }
}

export function FreeAgencyList({ userId, searchParams = {} }: FreeAgencyListProps) {
  const [players, setPlayers] = useState<any[]>([])
  const [playerBids, setPlayerBids] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyPlayer, setHistoryPlayer] = useState<any>(null)

  const [userTeam, setUserTeam] = useState<any>(null)
  const [now, setNow] = useState(new Date())
  const { supabase } = useSupabase()

  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [freeAgents, setFreeAgents] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)

  // viewer role gate (players shouldn't see teams)
  const [viewerRole, setViewerRole] = useState<string>("Player")
  const canRevealBidTeams = useMemo(() => {
    return ["Admin", "Owner", "GM", "AGM"].includes(viewerRole)
  }, [viewerRole])

  const urlSearchParams = useSearchParams()

  const filters = useMemo(() => {
    if (!mounted) return {}

    const extractedFilters = {
      position: urlSearchParams.get("position") || null,
      console: urlSearchParams.get("console") || null,
      name: urlSearchParams.get("name") || null,
      minSalary: urlSearchParams.get("minSalary") || null,
      maxSalary: urlSearchParams.get("maxSalary") || null,
    }

    safeLog("=== FILTER EXTRACTION ===")
    safeLog("URL Search Params:", Object.fromEntries(urlSearchParams.entries()))
    safeLog("Extracted filters:", extractedFilters)
    safeLog("=== END FILTER EXTRACTION ===")

    return extractedFilters
  }, [urlSearchParams, mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update current time every 30 seconds (NO bidding logic here)
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Fetch user's team + viewer role
  const fetchUserTeam = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return null

      const { data: playerRow } = await supabase
        .from("players")
        .select("team_id, role")
        .eq("user_id", session.user.id)
        .single()

      setViewerRole(playerRow?.role || "Player")

      if (!playerRow?.team_id) return null

      const { data: team } = await supabase.from("teams").select("*").eq("id", playerRow.team_id).single()
      setUserTeam(team)
    } catch (error) {
      safeLog("Error fetching user team:", error)
    }
  }, [supabase])

  // Fetch current bids for all players (READ-ONLY)
  const fetchPlayerBids = useCallback(async () => {
    try {
      // Managers can see team details
      if (canRevealBidTeams) {
        const { data: bids, error } = await supabase
          .from("player_bidding")
          .select(
            `
            *,
            teams:team_id (
              id,
              name,
              logo_url
            )
          `,
          )
          .order("bid_amount", { ascending: false })

        if (error) throw error

        const highestBids: Record<string, any> = {}
        bids?.forEach((bid) => {
          if (!highestBids[bid.player_id] || bid.bid_amount > highestBids[bid.player_id].bid_amount) {
            highestBids[bid.player_id] = bid
          }
        })

        setPlayerBids(highestBids)
        return
      }

      // Players: public-only bid info (NO team_id / NO team join)
      const { data: bidsPublic, error: bidsPublicError } = await supabase
        .from("player_bidding")
        .select("player_id,bid_amount,bid_expires_at")
        .order("bid_amount", { ascending: false })

      if (bidsPublicError) throw bidsPublicError

      const highestBids: Record<string, any> = {}
      bidsPublic?.forEach((bid) => {
        if (!highestBids[bid.player_id] || bid.bid_amount > highestBids[bid.player_id].bid_amount) {
          highestBids[bid.player_id] = bid
        }
      })
      setPlayerBids(highestBids)
    } catch (error) {
      safeLog("Error fetching player bids:", error)
    }
  }, [supabase, canRevealBidTeams])

  // Load free agents using API endpoint to bypass RLS
  const loadFreeAgents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/free-agents")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch free agents")
      }

      const data = await response.json()
      const freeAgentsList = data.freeAgents || []

      setFreeAgents(freeAgentsList)
      setPlayers(freeAgentsList)

      await fetchPlayerBids()
    } catch (error: any) {
      console.error("Error loading free agents:", error)
      setError(`Failed to load free agents: ${error.message}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fetchPlayerBids])

  // Fetch team stats (kept)
  const fetchTeamStats = useCallback(async () => {
    if (!userTeam?.id) return

    try {
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select(
          `
          salary,
          users!inner(
            id,
            season_registrations!inner(
              primary_position,
              secondary_position
            )
          )
        `,
        )
        .eq("team_id", userTeam.id)

      if (playersError) {
        console.error("Error fetching team players:", playersError)
        return
      }

      const current_salary = players.reduce((sum, player) => sum + (player.salary || 0), 0)
      const roster_size = players.length

      const positions: { [key: string]: number } = {}
      players.forEach((player) => {
        const pos = player.users?.season_registrations?.[0]?.primary_position || "Unknown"
        positions[pos] = (positions[pos] || 0) + 1
      })

      setTeamStats({
        current_salary,
        roster_size,
        positions,
      })
    } catch (error) {
      console.error("Error fetching team stats:", error)
    }
  }, [supabase, userTeam?.id])

  // Apply filters based on URL parameters
  const filteredPlayers = useMemo(() => {
    if (!mounted || freeAgents.length === 0) return []

    let filtered = [...freeAgents]

    if ((filters as any).name) {
      const searchTerm = (filters as any).name.toLowerCase().trim()
      filtered = filtered.filter((player) => player.users?.gamer_tag_id?.toLowerCase().includes(searchTerm))
    }

    if ((filters as any).position && (filters as any).position !== "all") {
      const posFilter = (filters as any).position
      filtered = filtered.filter((player) => {
        const primaryPos = getPositionAbbreviation(player.users?.season_registrations?.[0]?.primary_position || "")
        const secondaryPos = getPositionAbbreviation(player.users?.season_registrations?.[0]?.secondary_position || "")
        return primaryPos === posFilter || secondaryPos === posFilter
      })
    }

    if ((filters as any).console && (filters as any).console !== "all") {
      const consoleFilter = (filters as any).console
      filtered = filtered.filter((player) => player.users?.console === consoleFilter)
    }

    if ((filters as any).minSalary) {
      const minSal = Number.parseInt((filters as any).minSalary)
      if (!isNaN(minSal)) filtered = filtered.filter((player) => (player.salary || 0) >= minSal)
    }

    if ((filters as any).maxSalary) {
      const maxSal = Number.parseInt((filters as any).maxSalary)
      if (!isNaN(maxSal)) filtered = filtered.filter((player) => (player.salary || 0) <= maxSal)
    }

    return filtered
  }, [freeAgents, filters, mounted])

  // Initial load
  useEffect(() => {
    if (mounted) {
      fetchUserTeam()
      loadFreeAgents()
    }
  }, [mounted, loadFreeAgents, fetchUserTeam])

  // Load team stats when user team changes
  useEffect(() => {
    fetchTeamStats()
  }, [userTeam, fetchTeamStats])

  const handleHistoryClick = (player: any) => {
    setHistoryPlayer(player)
    setIsHistoryModalOpen(true)
  }

  function formatTimeRemaining(expiresAt: string): string {
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    if (diff <= 0) return "Expired"
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  // Sort players by bid expiration time
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const bidA = playerBids[a.id]
      const bidB = playerBids[b.id]

      if (bidA && bidB) {
        return new Date(bidA.bid_expires_at).getTime() - new Date(bidB.bid_expires_at).getTime()
      }
      if (bidA) return -1
      if (bidB) return 1
      return (a.users?.gamer_tag_id || "").localeCompare(b.users?.gamer_tag_id || "")
    })
  }, [filteredPlayers, playerBids])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadFreeAgents()
      await fetchPlayerBids()
    } catch (error) {
      safeLog("Error refreshing:", error)
      setError("Failed to refresh data")
    } finally {
      setRefreshing(false)
    }
  }, [loadFreeAgents, fetchPlayerBids])

  if (!mounted) return <div className="text-center py-4">Loading...</div>
  if (loading) return <div className="text-center py-4">Loading free agents...</div>

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-red-600">Error Loading Free Agents</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button onClick={handleRefresh} className="mt-4" disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Try Again"}
        </Button>
      </div>
    )
  }

  return (
    <>
      {teamStats && (
        <div className="mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 text-sm md:text-base">Position Breakdown</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
                {Object.entries(teamStats.positions).map(([pos, count]) => (
                  <div key={pos} className="flex justify-between">
                    <span className="text-gray-300">{getPositionAbbreviation(pos)}:</span>
                    <span className="text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">No free agents available</h3>
          <p className="text-muted-foreground mt-2">
            {freeAgents.length > 0
              ? "No players match your filter criteria. Try adjusting your filters."
              : "Check back later for available players"}
          </p>
          <Button onClick={handleRefresh} className="mt-4" disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPlayers.map((player) => {
            if (!player.users) return null

            const currentBid = playerBids[player.id]
            const bidExpiring = currentBid && new Date(currentBid.bid_expires_at).getTime() - now.getTime() < 3600000

            return (
              <div key={player.id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <Image
                      src={player.users.avatar_url || "/placeholder.svg?height=60&width=60"}
                      alt={player.users.gamer_tag_id || "Player"}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{player.users.gamer_tag_id || "Unknown Player"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-orange-400 font-medium">
                        ({getPositionAbbreviation(player.users.season_registrations?.[0]?.primary_position || "N/A")})
                      </span>
                      {player.users.season_registrations?.[0]?.secondary_position && (
                        <>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-blue-400 font-medium">
                            ({getPositionAbbreviation(player.users.season_registrations[0].secondary_position)})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Console:</span>
                    <span>{player.users.console || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Salary:</span>
                    <span>${(player.salary || 0).toLocaleString()}</span>
                  </div>
                </div>

                {currentBid && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground text-sm">Current Bid:</span>
                      <span className="font-bold">${currentBid.bid_amount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {canRevealBidTeams ? (
                          <>
                            <span className="text-muted-foreground text-sm mr-2">By:</span>
                            {currentBid.teams?.logo_url ? (
                              <Image
                                src={currentBid.teams.logo_url || "/placeholder.svg"}
                                alt={currentBid.teams.name || "Team"}
                                width={16}
                                height={16}
                                className="mr-1 object-contain"
                              />
                            ) : null}
                            <span className="text-sm font-medium">{currentBid.teams?.name || "Unknown Team"}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">Bid in progress</span>
                        )}
                      </div>

                      <div className="flex items-center">
                        <Clock className={`h-3 w-3 mr-1 ${bidExpiring ? "text-red-400" : "text-muted-foreground"}`} />
                        <span
                          className={`text-xs font-medium ${bidExpiring ? "text-red-400" : "text-muted-foreground"}`}
                        >
                          {formatTimeRemaining(currentBid.bid_expires_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* NO BIDDING ACTIONS ON THIS PAGE */}
                <div className="flex gap-2">
                  {canRevealBidTeams && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleHistoryClick(player)}
                      title="View Bid History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {historyPlayer && canRevealBidTeams && (
        <BidHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          playerId={historyPlayer.id}
          playerName={historyPlayer.users?.gamer_tag_id || "Unknown Player"}
        />
      )}
    </>
  )
}
