"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BidPlayerModal as BidModal } from "@/components/management/bid-player-modal"
import { BidHistoryModal } from "@/components/free-agency/bid-history-modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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

interface PotentialStats {
  potentialSalary: number
  potentialRosterSize: number
  potentialPositions: { [key: string]: number }
}

export function FreeAgencyList({ userId, searchParams = {} }: FreeAgencyListProps) {
  const [players, setPlayers] = useState<any[]>([])
  const [playerBids, setPlayerBids] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyPlayer, setHistoryPlayer] = useState<any>(null)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [now, setNow] = useState(new Date())
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [freeAgents, setFreeAgents] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [myActiveBids, setMyActiveBids] = useState<any[]>([])

  // Use useSearchParams hook for better client-side URL parameter handling
  const urlSearchParams = useSearchParams()

  // Extract filters from URL parameters using the hook
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

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update current time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
      checkExpiredBids()
    }, 30000)

    return () => clearInterval(interval)
  }, [playerBids])

  // Function to check for expired bids and assign players
  const checkExpiredBids = async () => {
    const expiredBids = Object.values(playerBids).filter((bid: any) => {
      return new Date(bid.bid_expires_at) < now
    })

    if (expiredBids.length > 0) {
      for (const bid of expiredBids) {
        await assignPlayerToTeam(bid)
      }

      // Refresh the free agents list if any bids were processed
      if (expiredBids.length > 0) {
        await loadFreeAgents()
      }
    }
  }

  // Function to assign a player to the winning team
  const assignPlayerToTeam = async (bid: any) => {
    try {
      // Get the player information
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", bid.player_id)
        .single()

      if (playerError) {
        safeLog("Error fetching player:", playerError)
        return
      }

      // Check if player is already assigned to a team
      if (player.team_id) {
        safeLog("Player already assigned to a team")
        return
      }

      // Update the player's team and salary
      const { error: updateError } = await supabase
        .from("players")
        .update({
          team_id: bid.team_id,
          salary: bid.bid_amount,
        })
        .eq("id", bid.player_id)

      if (updateError) {
        safeLog("Error updating player:", updateError)
        return
      }

      // Get team name for notification
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("name")
        .eq("id", bid.team_id)
        .single()

      if (teamError) {
        safeLog("Error fetching team:", teamError)
        return
      }

      // Send notification to the player
      await supabase.from("notifications").insert({
        user_id: player.user_id,
        title: "Bid Successful - You've Been Signed!",
        message: `Congratulations! ${team.name} has successfully signed you for $${bid.bid_amount.toLocaleString()}.`,
        link: "/profile",
      })

      // Send notification to the team managers
      const { data: managers } = await supabase
        .from("players")
        .select("user_id")
        .eq("team_id", bid.team_id)
        .in("role", ["GM", "AGM", "Owner"])

      if (managers && managers.length > 0) {
        // Get player name
        const { data: userData } = await supabase.from("users").select("gamer_tag_id").eq("id", player.user_id).single()

        const notifications = managers.map((manager) => ({
          user_id: manager.user_id,
          title: "Bid Won - Player Signed",
          message: `Your team has successfully signed ${userData?.gamer_tag_id || "a player"} for $${bid.bid_amount.toLocaleString()}.`,
          link: "/management",
        }))

        await supabase.from("notifications").insert(notifications)
      }

      safeLog(`Player ${player.id} assigned to team ${bid.team_id} with salary ${bid.bid_amount}`)
    } catch (error) {
      safeLog("Error assigning player to team:", error)
    }
  }

  const fetchActiveSeason = async () => {
    const { data: seasons, error } = await supabase.from("seasons").select("*").eq("is_active", true).single()

    if (error) {
      safeLog("Error fetching active season:", error)
      return null
    }

    return seasons
  }

  // Fetch user's team if they are logged in
  const fetchUserTeam = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return null

      const { data: player } = await supabase.from("players").select("team_id").eq("user_id", session.user.id).single()

      if (!player?.team_id) return null

      const { data: team } = await supabase.from("teams").select("*").eq("id", player.team_id).single()

      setUserTeam(team)
    } catch (error) {
      safeLog("Error fetching user team:", error)
    }
  }, [supabase])

  // Fetch current bids for all players
  const fetchPlayerBids = useCallback(async () => {
    try {
      const { data: bids, error } = await supabase
        .from("player_bidding")
        .select(`
        *,
        teams:team_id (
          id,
          name,
          logo_url
        )
      `)
        .order("bid_amount", { ascending: false })

      if (error) throw error

      // Group bids by player_id and keep only the highest bid for each player
      const highestBids: Record<string, any> = {}

      bids?.forEach((bid) => {
        if (!highestBids[bid.player_id] || bid.bid_amount > highestBids[bid.player_id].bid_amount) {
          highestBids[bid.player_id] = bid
        }
      })

      setPlayerBids(highestBids)

      // Also fetch my team's active bids for potential calculations
      if (userTeam?.id) {
        const myBids = bids?.filter((bid) => bid.team_id === userTeam.id && new Date(bid.bid_expires_at) > now) || []
        setMyActiveBids(myBids)
      }
    } catch (error) {
      safeLog("Error fetching player bids:", error)
    }
  }, [supabase, userTeam?.id, now])

  // Load free agents using API endpoint to bypass RLS
  const loadFreeAgents = useCallback(
    async (teamId?: string) => {
      setLoading(true)
      setError(null)

      try {
        console.log("=== DEBUG: Starting loadFreeAgents via API ===")

        // Use API endpoint to get free agents (bypasses RLS issues)
        const response = await fetch("/api/free-agents")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch free agents")
        }

        const data = await response.json()
        console.log("Free agents from API:", data.freeAgents?.length || 0)

        const freeAgentsList = data.freeAgents || []

        setFreeAgents(freeAgentsList)
        setPlayers(freeAgentsList)

        // Fetch bids for all players
        await fetchPlayerBids()

        console.log("=== DEBUG: End loadFreeAgents via API ===")
      } catch (error: any) {
        console.error("Error loading free agents:", error)
        setError(`Failed to load free agents: ${error.message}`)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [fetchPlayerBids],
  )

  // Fetch team stats
  const fetchTeamStats = useCallback(async () => {
    if (!userTeam?.id) return

    try {
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("salary, users(primary_position)")
        .eq("team_id", userTeam.id)

      if (playersError) {
        console.error("Error fetching team players:", playersError)
        return
      }

      const current_salary = players.reduce((sum, player) => sum + (player.salary || 0), 0)
      const roster_size = players.length

      // Calculate position breakdown
      const positions: { [key: string]: number } = {}
      players.forEach((player) => {
        const pos = player.users?.primary_position || "Unknown"
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

  // Calculate potential stats based on all active winning bids
  const calculatePotentialStats = (): PotentialStats | null => {
    if (!userTeam || !teamStats || !myActiveBids.length) return null

    // Filter to only winning bids that haven't expired
    const winningBids = myActiveBids.filter((bid) => {
      const highestBid = playerBids[bid.player_id]
      const isWinning = highestBid && highestBid.id === bid.id
      const isActive = new Date(bid.bid_expires_at) > now
      return isWinning && isActive
    })

    if (winningBids.length === 0) return null

    // Calculate potential salary increase
    const potentialSalaryIncrease = winningBids.reduce((sum, bid) => {
      // Find the player data to get their salary
      const player = freeAgents.find((p) => p.id === bid.player_id)
      return sum + (player?.salary || 0)
    }, 0)

    const potentialSalary = teamStats.current_salary + potentialSalaryIncrease
    const potentialRosterSize = teamStats.roster_size + winningBids.length

    // Calculate potential position breakdown
    const potentialPositions = { ...teamStats.positions }
    winningBids.forEach((bid) => {
      const player = freeAgents.find((p) => p.id === bid.player_id)
      if (player?.users?.primary_position) {
        const pos = player.users.primary_position
        potentialPositions[pos] = (potentialPositions[pos] || 0) + 1
      }
    })

    return {
      potentialSalary,
      potentialRosterSize,
      potentialPositions,
    }
  }

  // Apply filters based on URL parameters
  const filteredPlayers = useMemo(() => {
    if (!mounted || freeAgents.length === 0) {
      return []
    }

    let filtered = [...freeAgents]

    // Apply name filter
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase().trim()
      filtered = filtered.filter((player) => player.users?.gamer_tag_id?.toLowerCase().includes(searchTerm))
    }

    // Apply position filter
    if (filters.position && filters.position !== "all") {
      filtered = filtered.filter((player) => {
        const primaryPos = getPositionAbbreviation(player.users?.primary_position || "")
        const secondaryPos = getPositionAbbreviation(player.users?.secondary_position || "")
        return primaryPos === filters.position || secondaryPos === filters.position
      })
    }

    // Apply console filter
    if (filters.console && filters.console !== "all") {
      filtered = filtered.filter((player) => player.users?.console === filters.console)
    }

    // Apply salary filters
    if (filters.minSalary) {
      const minSal = Number.parseInt(filters.minSalary)
      if (!isNaN(minSal)) {
        filtered = filtered.filter((player) => (player.salary || 0) >= minSal)
      }
    }

    if (filters.maxSalary) {
      const maxSal = Number.parseInt(filters.maxSalary)
      if (!isNaN(maxSal)) {
        filtered = filtered.filter((player) => (player.salary || 0) <= maxSal)
      }
    }

    return filtered
  }, [freeAgents, filters, mounted])

  // Initial load
  useEffect(() => {
    if (mounted) {
      loadFreeAgents()
      fetchUserTeam()
    }
  }, [mounted, loadFreeAgents, fetchUserTeam])

  // Load team stats when user team changes
  useEffect(() => {
    fetchTeamStats()
  }, [userTeam, fetchTeamStats])

  const handleBidClick = (player: any) => {
    console.log("handleBidClick called for player:", player)
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const handleHistoryClick = (player: any) => {
    setHistoryPlayer(player)
    setIsHistoryModalOpen(true)
  }

  function formatTimeRemaining(expiresAt: string): string {
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    // For 4 hour duration, show hours and minutes instead of minutes and seconds
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  // Update the handleBidSubmit function to enforce minimum bid increment
  const handleBidSubmit = async (amount: number) => {
    if (!userTeam || !selectedPlayer) return

    try {
      // Check team's available cap space
      const { data: teamPlayers, error: teamError } = await supabase
        .from("players")
        .select("salary")
        .eq("team_id", userTeam.id)

      if (teamError) throw new Error(teamError.message)

      const currentSalaryTotal = teamPlayers.reduce((sum, player) => sum + (player.salary || 0), 0)
      const salaryCap = 75000000 // $75M salary cap

      if (currentSalaryTotal + amount > salaryCap) {
        toast({
          title: "Exceeds salary cap",
          description: "This bid would put your team over the salary cap.",
          variant: "destructive",
        })
        return
      }

      // Check if this team already has the highest bid
      const currentBid = playerBids[selectedPlayer.id]
      if (currentBid && currentBid.team_id === userTeam.id) {
        // Allow rebidding to extend the timer
        // No additional checks needed since we want to allow extending the timer
      }

      // Check if the bid meets the minimum increment requirement
      if (currentBid && amount < currentBid.bid_amount + 250000) {
        toast({
          title: "Bid too low",
          description: "New bids must be at least $250,000 higher than the current highest bid.",
          variant: "destructive",
        })
        return
      }

      // Get the current bidding duration from system settings
      const { data: durationSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "bidding_duration")
        .single()

      // Default to 14400 seconds (4 hours) if setting not found
      const bidDurationSeconds = durationSetting?.value ? Number.parseInt(durationSetting.value) : 14400
      const bidExpirationTime = new Date(Date.now() + bidDurationSeconds * 1000).toISOString()

      const { error: bidError } = await supabase.from("player_bidding").insert({
        player_id: selectedPlayer.id,
        team_id: userTeam.id,
        bid_amount: amount,
        bid_expires_at: bidExpirationTime,
      })

      if (bidError) throw new Error(bidError.message)

      // Send notification to the player
      await supabase.from("notifications").insert({
        user_id: selectedPlayer.user_id,
        title: "New Bid Received",
        message: `${userTeam.name} has placed a bid of $${amount.toLocaleString()} for you.`,
        link: "/free-agency",
      })

      // If there was a previous highest bidder and it's not the current team, notify them
      if (currentBid && currentBid.team_id !== userTeam.id) {
        // Get the GM/AGM/Owner of the outbid team
        const { data: teamManagers } = await supabase
          .from("players")
          .select("user_id")
          .eq("team_id", currentBid.team_id)
          .in("role", ["GM", "AGM", "Owner"])

        if (teamManagers && teamManagers.length > 0) {
          // Send notification to each team manager
          const notifications = teamManagers.map((manager) => ({
            user_id: manager.user_id,
            title: "Your Bid Was Outbid",
            message: `Your bid on ${selectedPlayer.users?.gamer_tag_id || "a player"} has been outbid by ${userTeam.name} with $${amount.toLocaleString()}.`,
            link: "/management",
          }))

          await supabase.from("notifications").insert(notifications)
        }
      }

      toast({
        title: "Bid placed successfully",
        description: `Your bid of $${amount.toLocaleString()} has been placed.`,
      })

      setIsModalOpen(false)

      // Refresh bids
      await loadFreeAgents()
    } catch (error: any) {
      toast({
        title: "Error placing bid",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Sort players by bid expiration time
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const bidA = playerBids[a.id]
      const bidB = playerBids[b.id]

      // If both players have bids, sort by expiration time (ascending)
      if (bidA && bidB) {
        return new Date(bidA.bid_expires_at).getTime() - new Date(bidB.bid_expires_at).getTime()
      }

      // If only player A has a bid, it comes first
      if (bidA) return -1

      // If only player B has a bid, it comes first
      if (bidB) return 1

      // If neither has a bid, sort by name
      return (a.users?.gamer_tag_id || "").localeCompare(b.users?.gamer_tag_id || "")
    })
  }, [filteredPlayers, playerBids])

  // Add a refresh function for manual refresh
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

  // Calculate potential stats for display
  const potentialStats = calculatePotentialStats()

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return <div className="text-center py-4">Loading...</div>
  }

  if (loading) {
    return <div className="text-center py-4">Loading free agents...</div>
  }

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
      {/* Team Summary Stats with Potential Stats */}
      {userTeam && teamStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Team Salary */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 text-sm md:text-base">Team Salary</h3>
            <div className="space-y-2">
              <div>
                <p className="text-white text-lg font-bold">
                  ${(teamStats.current_salary / 1000000).toFixed(1)}M / $75M
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(teamStats.current_salary / 75000000) * 100}%` }}
                  />
                </div>
              </div>
              {potentialStats && potentialStats.potentialSalary !== teamStats.current_salary && (
                <div className="text-gray-400 text-sm">
                  <p>Potential: ${(potentialStats.potentialSalary / 1000000).toFixed(1)}M</p>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-yellow-500 h-1 rounded-full"
                      style={{ width: `${(potentialStats.potentialSalary / 75000000) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Roster Size */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 text-sm md:text-base">Roster Size</h3>
            <div className="space-y-2">
              <div>
                <p className="text-white text-lg font-bold">{teamStats.roster_size} / 15 players</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(teamStats.roster_size / 15) * 100}%` }}
                  />
                </div>
              </div>
              {potentialStats && potentialStats.potentialRosterSize !== teamStats.roster_size && (
                <div className="text-gray-400 text-sm">
                  <p>Potential: {potentialStats.potentialRosterSize} players</p>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-yellow-500 h-1 rounded-full"
                      style={{ width: `${(potentialStats.potentialRosterSize / 15) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Position Breakdown */}
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
              {potentialStats && (
                <div className="text-gray-400 text-xs border-t border-gray-600 pt-2">
                  <p className="mb-1">Potential:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(potentialStats.potentialPositions).map(([pos, count]) => (
                      <div key={pos} className="flex justify-between">
                        <span>{getPositionAbbreviation(pos)}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            // Skip players with null users
            if (!player.users) return null

            const currentBid = playerBids[player.id]
            const hasTeam = !!userTeam
            const canBid = hasTeam && (!currentBid || currentBid.team_id !== userTeam.id)
            const bidExpiring = currentBid && new Date(currentBid.bid_expires_at).getTime() - now.getTime() < 3600000 // 1 hour

            return (
              <div key={player.id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  {/* Player Avatar */}
                  <div className="flex-shrink-0">
                    <Image
                      src={player.users.avatar_url || "/placeholder.svg?height=60&width=60"}
                      alt={player.users.gamer_tag_id || "Player"}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                    />
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{player.users.gamer_tag_id || "Unknown Player"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-orange-400 font-medium">
                        ({getPositionAbbreviation(player.users.primary_position || "N/A")})
                      </span>
                      {player.users.secondary_position && (
                        <>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-blue-400 font-medium">
                            ({getPositionAbbreviation(player.users.secondary_position)})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Console and Salary */}
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

                <div className="flex gap-2">
                  {userTeam && (
                    <Button onClick={() => handleBidClick(player)} className="flex-1">
                      {currentBid && currentBid.team_id === userTeam.id ? "Extend Bid" : "Place Bid"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleHistoryClick(player)}
                    title="View Bid History"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedPlayer && (
        <BidModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          player={selectedPlayer}
          onSubmit={handleBidSubmit}
          currentSalary={selectedPlayer.salary || 0}
        />
      )}

      {historyPlayer && (
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
