"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { BidHistoryModal } from "@/components/free-agency/bid-history-modal"
import { Button } from "@/components/ui/button"
import { History, Clock, RefreshCw, User, Gamepad2, DollarSign, Timer } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"

interface FreeAgencyListProps {
  userId?: string
  searchParams?: { [key: string]: string | string[] | undefined }
  league?: string
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

// Position color mapping
function getPositionColor(position: string): string {
  const colorMap: Record<string, string> = {
    C: "bg-red-500/20 text-red-400 border-red-500/40",
    LW: "bg-green-500/20 text-green-400 border-green-500/40",
    RW: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    LD: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    RD: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    G: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  }
  return colorMap[position] || "bg-slate-500/20 text-slate-400 border-slate-500/40"
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

export function FreeAgencyList({ userId, searchParams = {}, league }: FreeAgencyListProps) {
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

  const isSiteOwner = useMemo(() => viewerRole === "Site Owner", [viewerRole])
  const isManager = useMemo(() => ["Owner", "GM", "AGM"].includes(viewerRole), [viewerRole])

  const canRevealBidTeams = useMemo(() => {
    return isSiteOwner || isManager
  }, [isSiteOwner, isManager])

  const [myTeamBids, setMyTeamBids] = useState<Record<string, any>>({})

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

    return extractedFilters
  }, [urlSearchParams, mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update current time every 30 seconds
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

      // Check if user has Site Owner role in user_roles table
      const { data: userRolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
      
      const hasSiteOwnerRole = userRolesData?.some(r => r.role === "Site Owner")
      setViewerRole(hasSiteOwnerRole ? "Site Owner" : (playerRow?.role || "Player"))

      if (!playerRow?.team_id) return null

      const { data: team } = await supabase.from("teams").select("*").eq("id", playerRow.team_id).single()
      setUserTeam(team)
    } catch (error) {
      safeLog("Error fetching user team:", error)
    }
  }, [supabase])

  // Fetch current bids for all players
  const fetchPlayerBids = useCallback(async () => {
    try {
      const { data: bidsPublic, error: bidsPublicError } = await supabase
        .from("player_bidding")
        .select("player_id,bid_amount,bid_expires_at")
        .eq("finalized", false)
        .order("bid_amount", { ascending: false })

      if (bidsPublicError) throw bidsPublicError

      const highestBidsPublic: Record<string, any> = {}
      bidsPublic?.forEach((bid) => {
        if (!highestBidsPublic[bid.player_id] || bid.bid_amount > highestBidsPublic[bid.player_id].bid_amount) {
          highestBidsPublic[bid.player_id] = bid
        }
      })
      setPlayerBids(highestBidsPublic)

      if (isSiteOwner) {
        const { data: bidsAll, error: bidsAllError } = await supabase
          .from("player_bidding")
          .select(`
            player_id,
            bid_amount,
            bid_expires_at,
            team_id,
            teams:team_id (
              id,
              name,
              logo_url
            )
          `)
          .eq("finalized", false)
          .order("bid_amount", { ascending: false })

        if (bidsAllError) throw bidsAllError

        const highestBidsAdmin: Record<string, any> = {}
        bidsAll?.forEach((bid) => {
          if (!highestBidsAdmin[bid.player_id] || bid.bid_amount > highestBidsAdmin[bid.player_id].bid_amount) {
            highestBidsAdmin[bid.player_id] = bid
          }
        })

        setPlayerBids(highestBidsAdmin)
        setMyTeamBids({})
        return
      }

      if (isManager && userTeam?.id) {
        const { data: myBids, error: myBidsError } = await supabase
          .from("player_bidding")
          .select(`
            player_id,
            bid_amount,
            bid_expires_at,
            team_id,
            teams:team_id (
              id,
              name,
              logo_url
            )
          `)
          .eq("team_id", userTeam.id)
          .eq("finalized", false)

        if (myBidsError) throw myBidsError

        const myBidsByPlayer: Record<string, any> = {}
        myBids?.forEach((bid) => {
          if (!myBidsByPlayer[bid.player_id] || bid.bid_amount > myBidsByPlayer[bid.player_id].bid_amount) {
            myBidsByPlayer[bid.player_id] = bid
          }
        })
        setMyTeamBids(myBidsByPlayer)
      } else {
        setMyTeamBids({})
      }
    } catch (error) {
      safeLog("Error fetching player bids:", error)
    }
  }, [supabase, isSiteOwner, isManager, userTeam?.id])

  // Load free agents using API endpoint
  const loadFreeAgents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const url = league ? `/api/free-agents?league=${league}` : "/api/free-agents"
      const response = await fetch(url)
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
  }, [fetchPlayerBids, league])

  // Fetch team stats
  const fetchTeamStats = useCallback(async () => {
    if (!userTeam?.id) return

    try {
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select(`
          salary,
          users!inner(
            id,
            season_registrations!inner(
              primary_position,
              secondary_position
            )
          )
        `)
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

  // Apply filters
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

  // Refresh bids when role/team changes
  useEffect(() => {
    if (!mounted) return
    fetchPlayerBids()
  }, [mounted, viewerRole, userTeam?.id, fetchPlayerBids])

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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-700/50" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-slate-700/50 rounded" />
                <div className="h-4 w-20 bg-slate-700/50 rounded" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full bg-slate-700/50 rounded" />
              <div className="h-4 w-3/4 bg-slate-700/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading Free Agents</h3>
        <p className="text-slate-400 mb-6 max-w-md">{error}</p>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="bg-slate-700 hover:bg-slate-600"
        >
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
      </div>
    )
  }

  if (filteredPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Free Agents Found</h3>
        <p className="text-slate-400 mb-6 max-w-md">
          {freeAgents.length > 0
            ? "No players match your filter criteria. Try adjusting your filters."
            : "Check back later for available players."}
        </p>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          className="border-slate-600 hover:bg-slate-700"
        >
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          Showing <span className="text-white font-medium">{sortedPlayers.length}</span> free agents
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="text-slate-400 hover:text-white hover:bg-slate-700/50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlayers.map((player) => {
          if (!player.users) return null

          const currentBid = playerBids[player.id]
          const bidExpiring = currentBid && new Date(currentBid.bid_expires_at).getTime() - now.getTime() < 3600000

          const myBidForPlayer = myTeamBids?.[player.id]
          const isMyTeamWinning = currentBid && myBidForPlayer && currentBid.team_id === userTeam?.id
          const canShowBidderIdentityHere = isSiteOwner || isMyTeamWinning
          const bidderTeam = isSiteOwner ? currentBid?.teams : (isMyTeamWinning ? myBidForPlayer?.teams : null)

          const primaryPos = getPositionAbbreviation(player.users.season_registrations?.[0]?.primary_position || "N/A")
          const secondaryPos = player.users.season_registrations?.[0]?.secondary_position 
            ? getPositionAbbreviation(player.users.season_registrations[0].secondary_position)
            : null

          return (
            <div 
              key={player.id} 
              className="group bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 hover:bg-slate-800/40 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Image
                      src={player.users.avatar_url || "/placeholder.svg?height=56&width=56"}
                      alt={player.users.gamer_tag_id || "Player"}
                      width={56}
                      height={56}
                      className="rounded-full object-cover ring-2 ring-slate-700/50"
                    />
                    {player.users.season_registrations?.[0]?.is_late_signup && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        LS
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate text-base">
                      {player.users.gamer_tag_id || "Unknown Player"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPositionColor(primaryPos)}`}>
                        {primaryPos}
                      </span>
                      {secondaryPos && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPositionColor(secondaryPos)}`}>
                          {secondaryPos}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* History Button */}
                  {isSiteOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleHistoryClick(player)}
                      className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View Bid History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="px-4 py-2 bg-slate-900/30 border-t border-b border-slate-700/30 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  <span>{player.users.console || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-white font-medium">${(player.salary || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Bid Section */}
              {currentBid ? (
                <div className="p-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Current Bid</p>
                      <p className="text-lg font-bold text-green-400">${currentBid.bid_amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      {canShowBidderIdentityHere && bidderTeam ? (
                        <div className="flex items-center gap-2">
                          {bidderTeam.logo_url && (
                            <Image
                              src={bidderTeam.logo_url}
                              alt={bidderTeam.name || "Team"}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span className="text-sm text-slate-300">{bidderTeam.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Bid in progress</span>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${bidExpiring ? 'text-red-400' : 'text-slate-500'}`}>
                        <Timer className="h-3 w-3" />
                        <span className="text-xs font-medium">{formatTimeRemaining(currentBid.bid_expires_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 pt-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">No active bids</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {historyPlayer && isSiteOwner && (
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
