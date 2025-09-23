"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BidPlayerModal as BidModal } from "@/components/management/bid-player-modal"
import { BidHistoryModal } from "@/components/free-agency/bid-history-modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { History, Clock, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
// import Image from "next/image" // Removed since we're using regular img tags
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface FreeAgencyListProps {
  userId?: string
  searchParams?: { [key: string]: string | string[] | undefined }
}

// Update the getPositionAbbreviation function to handle both full names and abbreviations
const getPositionAbbreviation = (position: string): string => {
  if (!position) return "?"

  const trimmedPosition = position.trim().toLowerCase()

  // Position mapping that handles both full names and abbreviations
  const positionMap: Record<string, string> = {
    goalie: "G",
    g: "G",
    center: "C",
    c: "C",
    "left wing": "LW",
    lw: "LW",
    "right wing": "RW",
    rw: "RW",
    "left defense": "LD",
    ld: "LD",
    "right defense": "RD",
    rd: "RD",
  }

  return positionMap[trimmedPosition] || position.toUpperCase()
}

// Function to get position color
const getPositionColor = (position: string): string => {
  switch (position) {
    case "Goalie":
    case "G":
      return "text-purple-400"
    case "Center":
    case "C":
      return "text-red-400"
    case "Left Wing":
    case "LW":
      return "text-green-400"
    case "Right Wing":
    case "RW":
      return "text-ice-blue-400"
    case "Left Defense":
    case "LD":
      return "text-cyan-400"
    case "Right Defense":
    case "RD":
      return "text-yellow-400"
    default:
      return "text-hockey-silver-400"
  }
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
  const [filteredFreeAgents, setFilteredFreeAgents] = useState<any[]>([])
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [myActiveBids, setMyActiveBids] = useState<any[]>([])
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(false)
  const [freeAgentsError, setFreeAgentsError] = useState<string | null>(null)

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

  // Update the position filter logic in the useEffect
  useEffect(() => {
    console.log("=== Filtering free agents ===")
    console.log("freeAgents length:", freeAgents?.length || 0)
    console.log("nameFilter:", nameFilter)
    console.log("positionFilter:", positionFilter)
    
    const agents = freeAgents || []
    let filtered = agents

    // Apply name filter if provided
    if (nameFilter.trim() !== "") {
      const searchTerm = nameFilter.toLowerCase().trim()
      filtered = filtered.filter((player) => player.users?.gamer_tag_id?.toLowerCase().includes(searchTerm))
    }

    // Apply position filter if not "all"
    if (positionFilter !== "all") {
      filtered = filtered.filter((player) => {
        const primaryPosition = player.users?.primary_position?.toLowerCase()
        const secondaryPosition = player.users?.secondary_position?.toLowerCase()
        
        // Handle different position formats and variations
        const positionVariations = {
          'goalie': ['goalie', 'goalkeeper', 'g'],
          'center': ['center', 'c'],
          'left wing': ['left wing', 'lw', 'leftwing'],
          'right wing': ['right wing', 'rw', 'rightwing'],
          'left defense': ['left defense', 'ld', 'leftdefense', 'left d'],
          'right defense': ['right defense', 'rd', 'rightdefense', 'right d']
        }
        
        const variations = positionVariations[positionFilter as keyof typeof positionVariations] || [positionFilter]
        
        return variations.some(variation => 
          primaryPosition?.includes(variation) || 
          secondaryPosition?.includes(variation)
        )
      })
    }

    console.log("filtered length:", filtered.length)
    setFilteredFreeAgents(filtered)
  }, [freeAgents, nameFilter, positionFilter])

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
        await fetchFreeAgents()
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

  // Fetch free agents using API endpoint
  const fetchFreeAgents = async () => {
    console.log("=== fetchFreeAgents called ===")
    try {
      setFreeAgentsLoading(true)
      setFreeAgentsError(null)

      console.log("Loading free agents via API...")
      console.log("Current session:", !!supabase)
      console.log("Team data:", userTeam?.name)

      const response = await fetch("/api/free-agents?approved_only=true", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Free agents API response status:", response.status)

      let data
      if (!response.ok) {
        data = await response.json()
        throw new Error(data.error || `Failed to fetch free agents: ${response.status}`)
      } else {
        data = await response.json()
      }
      console.log("Free agents API response:", {
        freeAgentsCount: data.freeAgents?.length || 0,
        debug: data.debug,
      })

      const freeAgentsList = data.freeAgents || []
      
      // Count goalies for debugging
      const goalies = freeAgentsList.filter((player: any) => 
        player.users?.primary_position?.toLowerCase().includes('goalie') || 
        player.users?.primary_position?.toLowerCase().includes('goalkeeper')
      )
      console.log(`Total free agents: ${freeAgentsList.length}`)
      console.log(`Goalies found: ${goalies.length}`)
      console.log("Goalies:", goalies.map((g: any) => ({ name: g.users?.gamer_tag_id, position: g.users?.primary_position })))
      
      // Log some sample players to see what we're getting
      console.log("Sample free agents:", freeAgentsList.slice(0, 5).map((p: any) => ({
        name: p.users?.gamer_tag_id,
        position: p.users?.primary_position,
        salary: p.salary
      })))
      
      setFreeAgents(freeAgentsList)
      setFilteredFreeAgents(freeAgentsList)

      console.log("Successfully loaded free agents:", freeAgentsList.length)
    } catch (error: any) {
      console.error("Error loading free agents:", error)
      setFreeAgentsError(`Failed to load free agents: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to load free agents: " + error.message,
        variant: "destructive",
      })
    } finally {
      setFreeAgentsLoading(false)
    }
  }

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
      players.forEach((player: any) => {
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

  // This filtering is now handled by the useEffect above

  // Initial load
  useEffect(() => {
    if (mounted) {
      fetchFreeAgents()
      fetchUserTeam()
    }
  }, [mounted, fetchUserTeam])

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

  // Bid submission is now handled by the BidModal component

  // Sort players by bid expiration time
  const sortedPlayers = useMemo(() => {
    return [...filteredFreeAgents].sort((a, b) => {
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
  }, [filteredFreeAgents, playerBids])

  // Add a refresh function for manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchFreeAgents()
      await fetchPlayerBids()
    } catch (error) {
      safeLog("Error refreshing:", error)
      setError("Failed to refresh data")
    } finally {
      setRefreshing(false)
    }
  }, [fetchPlayerBids])

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="goalie">Goalie</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="left wing">Left Wing</SelectItem>
            <SelectItem value="right wing">Right Wing</SelectItem>
            <SelectItem value="left defense">Left Defense</SelectItem>
            <SelectItem value="right defense">Right Defense</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="flex-1"
        />
      </div>

      {freeAgentsLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : freeAgentsError ? (
        <div className="text-center py-8 text-red-500">
          {freeAgentsError}
        </div>
      ) : (filteredFreeAgents?.length || 0) === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No free agents available
        </div>
      ) : (
        <div className="space-y-4">
          {(filteredFreeAgents || []).map((player) => (
            <div
              key={player.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer gap-3"
              onClick={() => handleBidClick(player)}
            >
              <div className="flex items-center gap-4 flex-1">
                {player.users?.avatar_url && (
                  <img
                    src={player.users.avatar_url}
                    alt={player.users.gamer_tag_id}
                    width={40}
                    height={40}
                    className="rounded-full flex-shrink-0 w-10 h-10 object-cover"
                    onError={(e) => {
                      console.warn('Failed to load avatar for', player.users?.gamer_tag_id, ':', player.users?.avatar_url)
                      e.currentTarget.style.display = 'none'
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded avatar for', player.users?.gamer_tag_id)
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{player.users?.gamer_tag_id}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className={getPositionColor(player.users?.primary_position)}>
                      {getPositionAbbreviation(player.users?.primary_position)}
                    </span>
                    {player.users?.secondary_position && (
                      <>
                        <span>•</span>
                        <span className={getPositionColor(player.users?.secondary_position)}>
                          {getPositionAbbreviation(player.users?.secondary_position)}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="truncate">{player.users?.console}</span>
                    <span>•</span>
                    <span className="font-medium">${(player.salary / 1000000).toFixed(2)}M</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full sm:w-auto">Bid</Button>
            </div>
          ))}
        </div>
      )}

      {selectedPlayer && (
        <BidModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          player={selectedPlayer}
          userTeam={userTeam}
          onBidPlaced={() => {
            setIsModalOpen(false)
            fetchFreeAgents()
          }}
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
    </div>
  )
}
