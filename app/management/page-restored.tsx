"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, Trophy, DollarSign, Filter, History, Search, ArrowLeftRight } from "lucide-react"
import { WaiverPriorityDisplay } from "@/components/management/waiver-priority-display"
import { SalaryProgress } from "@/components/management/salary-progress"
import { RosterProgress } from "@/components/management/roster-progress"
import { TeamAvailabilityTab } from "@/components/management/team-availability-tab"
import { WaiverHistory } from "@/components/waiver-history"
import Image from "next/image"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamLogos } from "@/components/management/team-logos"
import { BidPlayerModal } from "@/components/management/bid-player-modal"
import { getTeamStats, getCurrentSeasonId } from "@/lib/team-utils"

interface Player {
  id: string
  salary: number
  role: string
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
  salary_cap: number
  max_players: number
  wins: number
  losses: number
  otl: number
  points: number
  games_played: number
  goals_for: number
  goals_against: number
  goal_differential: number
}

const getPositionAbbreviation = (position: string): string => {
  if (!position) return "?"

  const trimmedPosition = position.trim().toLowerCase()

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
      return "text-blue-400"
    case "Left Defense":
    case "LD":
      return "text-cyan-400"
    case "Right Defense":
    case "RD":
      return "text-yellow-400"
    default:
      return "text-gray-400"
  }
}

const ManagementPage = () => {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [teamData, setTeamData] = useState<Team | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [teamMatches, setTeamMatches] = useState<any[]>([])
  const [freeAgents, setFreeAgents] = useState<any[]>([])
  const [filteredFreeAgents, setFilteredFreeAgents] = useState<any[]>([])
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState<string>("")
  const [playerBids, setPlayerBids] = useState<Record<string, any>>({})
  const [myBids, setMyBids] = useState<any[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState<any>(false)
  const [now, setNow] = useState(new Date())
  const [activeBidsCount, setActiveBidsCount] = useState(0)
  const [outbidCount, setOutbidCount] = useState(0)
  const [freeAgentsError, setFreeAgentsError] = useState<string | null>(null)
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(false)
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(true)
  const [currentTeamSalary, setCurrentTeamSalary] = useState(0)
  const [projectedSalary, setProjectedSalary] = useState(0)
  const [projectedRosterSize, setProjectedRosterSize] = useState(0)
  const [currentSalaryCap] = useState(30000000)

  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "roster")

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Filter free agents
  useEffect(() => {
    let filtered = freeAgents

    if (nameFilter.trim() !== "") {
      const searchTerm = nameFilter.toLowerCase().trim()
      filtered = filtered.filter((player) => player.users?.gamer_tag_id?.toLowerCase().includes(searchTerm))
    }

    if (positionFilter !== "all") {
      filtered = filtered.filter((player) => {
        const primaryPos = getPositionAbbreviation(player.users?.primary_position || "")
        const secondaryPos = getPositionAbbreviation(player.users?.secondary_position || "")
        const filterPos = getPositionAbbreviation(positionFilter)
        return primaryPos === filterPos || secondaryPos === filterPos
      })
    }

    setFilteredFreeAgents(filtered)
  }, [positionFilter, nameFilter, freeAgents])

  // Calculate projections
  useEffect(() => {
    if (!teamData) {
      setProjectedSalary(currentTeamSalary)
      setProjectedRosterSize(teamPlayers.length)
      return
    }

    const winningBids = myBids.filter((bid) => {
      const isWinning = bid.isHighestBidder
      const isActive = new Date(bid.bid_expires_at) > now
      return isWinning && isActive
    })

    const projectedSalaryIncrease = winningBids.reduce((sum, bid) => sum + bid.bid_amount, 0)
    const projectedRosterIncrease = winningBids.length

    setProjectedSalary(currentTeamSalary + projectedSalaryIncrease)
    setProjectedRosterSize(teamPlayers.length + projectedRosterIncrease)
  }, [myBids, currentTeamSalary, teamPlayers.length, teamData, now])

  // Check bidding status
  useEffect(() => {
    const checkBiddingStatus = async () => {
      try {
        const response = await fetch("/api/bidding/status")
        const data = await response.json()
        setIsBiddingEnabled(data.enabled)
      } catch (error) {
        console.error("Error checking bidding status:", error)
        setIsBiddingEnabled(false)
      }
    }
    checkBiddingStatus()
  }, [])

  function formatTimeRemaining(expiresAt: string): string {
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  async function fetchData() {
    if (!session?.user) {
      setIsAuthorized(false)
      return
    }

    setLoading(true)
    try {
      // Check if user is a team manager (GM, AGM, Owner)
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("role, team_id")
        .eq("user_id", session.user.id)
        .single()

      if (playerError || !playerData) {
        setIsAuthorized(false)
        throw new Error("You don't have permission to access team management")
      }

      const isManager = ["GM", "AGM", "Owner"].includes(playerData.role)
      setIsAuthorized(isManager)

      if (!isManager || !playerData.team_id) {
        throw new Error("You must be a team manager to access this page")
      }

      // Get current season ID for team stats calculation
      const currentSeasonId = await getCurrentSeasonId()

      // Get calculated team stats
      const calculatedTeamStats = await getTeamStats(playerData.team_id, currentSeasonId)

      if (!calculatedTeamStats) {
        throw new Error("Could not calculate team statistics")
      }

      // Fetch basic team data from database
      const { data: basicTeamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", playerData.team_id)
        .single()

      if (teamError) throw teamError

      // Merge database team data with calculated stats
      const mergedTeamData = {
        ...basicTeamData,
        salary_cap: 30000000,
        max_players: 15,
        wins: calculatedTeamStats.wins,
        losses: calculatedTeamStats.losses,
        otl: calculatedTeamStats.otl || 0,
        points: calculatedTeamStats.points,
        games_played: calculatedTeamStats.gamesPlayed,
        goals_for: calculatedTeamStats.goalsFor,
        goals_against: calculatedTeamStats.goalsAgainst,
        goal_differential: calculatedTeamStats.goalDifferential,
      }

      setTeamData(mergedTeamData)

      // Fetch team players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          *,
          users(*)
        `)
        .eq("team_id", playerData.team_id)

      if (playersError) {
        console.error("Error fetching players:", playersError)
      } else {
        const activePlayers = playersData?.filter(p => p.users) || []
        setTeamPlayers(activePlayers)
        
        // Calculate salary totals
        const totalSalary = activePlayers.reduce((sum, player) => sum + (player.salary || 0), 0)
        setCurrentTeamSalary(totalSalary)
        setProjectedSalary(totalSalary)
      }

      // Fetch team matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:home_team_id(name, logo_url),
          away_team:away_team_id(name, logo_url)
        `)
        .or(`home_team_id.eq.${playerData.team_id},away_team_id.eq.${playerData.team_id}`)
        .order("match_date", { ascending: true })

      if (matchesError) {
        console.error("Error fetching matches:", matchesError)
      } else {
        setTeamMatches(matchesData || [])
      }

      // Fetch my team's bids
      const { data: myTeamBids, error: bidsError } = await supabase
        .from("player_bidding")
        .select(`
          *,
          players (
            id,
            users (
              id,
              gamer_tag_id,
              primary_position,
              secondary_position,
              console
            )
          )
        `)
        .eq("team_id", playerData.team_id)
        .order("bid_expires_at", { ascending: true })

      if (bidsError) {
        console.error("Error fetching team bids:", bidsError)
      } else {
        // Get all current highest bids to determine if our bids are winning
        const { data: allBids } = await supabase
          .from("player_bidding")
          .select("*")
          .order("bid_amount", { ascending: false })

        if (allBids) {
          // Group all bids by player_id to find highest bid for each player
          const highestBidsByPlayer: Record<string, any> = {}
          allBids.forEach((bid) => {
            if (!highestBidsByPlayer[bid.player_id] || bid.bid_amount > highestBidsByPlayer[bid.player_id].bid_amount) {
              highestBidsByPlayer[bid.player_id] = bid
            }
          })

          // Enhance our bids with winning status
          const enhancedBids =
            myTeamBids?.map((bid) => {
              const highestBid = highestBidsByPlayer[bid.player_id]
              const isHighestBidder = highestBid && highestBid.id === bid.id
              const isExpired = new Date(bid.bid_expires_at) <= now

              return {
                ...bid,
                isHighestBidder,
                highestBid: !isHighestBidder ? highestBid : null,
                isExpired,
                status: isExpired ? "expired" : isHighestBidder ? "winning" : "outbid",
              }
            }) || []

          setMyBids(enhancedBids)

          // Count active and outbid bids
          const activeBids = enhancedBids.filter((bid) => !bid.isExpired && bid.isHighestBidder)
          const outbidBids = enhancedBids.filter((bid) => !bid.isExpired && !bid.isHighestBidder)

          setActiveBidsCount(activeBids.length)
          setOutbidCount(outbidBids.length)
        }
      }

    } catch (error: any) {
      console.error("Error fetching management data:", error)
      toast({
        title: "Access Denied",
        description: error.message || "You don't have permission to access this page",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch free agents function
  const fetchFreeAgents = async () => {
    if (freeAgentsLoading) return

    setFreeAgentsLoading(true)
    setFreeAgentsError(null)
    try {
      const { data: freeAgentsData, error: freeAgentsError } = await supabase
        .from("players")
        .select(`
          *,
          users(*),
          player_bidding(*)
        `)
        .is("team_id", null)
        .not("users", "is", null)

      if (freeAgentsError) throw freeAgentsError

      setFreeAgents(freeAgentsData || [])
      setFilteredFreeAgents(freeAgentsData || [])

      // Fetch current bids for each free agent
      const playerIds = freeAgentsData?.map(p => p.id) || []
      if (playerIds.length > 0) {
        const { data: bidsData } = await supabase
          .from("player_bidding")
          .select(`
            *,
            teams(name)
          `)
          .in("player_id", playerIds)
          .gte("bid_expires_at", new Date().toISOString())
          .order("bid_amount", { ascending: false })

        const bidsByPlayer = bidsData?.reduce((acc, bid) => {
          if (!acc[bid.player_id] || bid.bid_amount > acc[bid.player_id].bid_amount) {
            acc[bid.player_id] = bid
          }
          return acc
        }, {}) || {}

        setPlayerBids(bidsByPlayer)
      }

    } catch (error: any) {
      console.error("Error fetching free agents:", error)
      setFreeAgentsError(error.message)
    } finally {
      setFreeAgentsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [supabase, session, toast])

  // Effect to reload free agents when switching to free-agents tab  
  useEffect(() => {
    if (activeTab === "free-agents" && teamData?.id) {
      console.log("Switching to free-agents tab, loading free agents")
      fetchFreeAgents()
    }
  }, [activeTab, teamData?.id])

  const handleBidClick = (player: any) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  if (!isAuthorized && !loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You must be a Team Manager (GM, AGM, or Owner) to access the management panel.
        </p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col gap-2 md:gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Team Management</h1>
            {teamData && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm md:text-base">
                {teamData.logo_url && (
                  <Image
                    src={teamData.logo_url || "/placeholder.svg"}
                    alt={teamData.name}
                    width={20}
                    height={20}
                    className="rounded-full md:w-6 md:h-6"
                  />
                )}
                {teamData.name}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Team Size</div>
                    <div className="text-2xl font-bold">
                      {teamPlayers.length}
                      {projectedRosterSize !== teamPlayers.length && (
                        <span className="text-sm text-muted-foreground ml-1">→ {projectedRosterSize}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Upcoming Matches</div>
                    <div className="text-2xl font-bold">
                      {teamMatches.filter((m) => m.status === "Scheduled").length}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Record</div>
                    <div className="text-2xl font-bold">
                      {teamData ? `${teamData.wins}-${teamData.losses}-${teamData.otl}` : "0-0-0"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Salary Cap</div>
                    <div className="text-2xl font-bold">
                      ${(currentTeamSalary / 1000000).toFixed(1)}M
                      {projectedSalary !== currentTeamSalary && (
                        <span className="text-sm text-muted-foreground ml-1">
                          → ${(projectedSalary / 1000000).toFixed(1)}M
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-6 md:mb-8 h-auto">
                <TabsTrigger value="roster" className="text-xs md:text-sm px-2 md:px-4 py-2">
                  <span className="hidden md:inline">Team Roster</span>
                  <span className="md:hidden">Roster</span>
                </TabsTrigger>
                <TabsTrigger value="availability" className="text-xs md:text-sm px-2 md:px-4 py-2">
                  <span className="hidden md:inline">Team Avail</span>
                  <span className="md:hidden">Avail</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs md:text-sm px-2 md:px-4 py-2">
                  <span className="hidden md:inline">Team Schedule</span>
                  <span className="md:hidden">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="free-agents" className="text-xs md:text-sm px-2 md:px-4 py-2">
                  <span className="hidden md:inline">Free Agents</span>
                  <span className="md:hidden">Free Agents</span>
                </TabsTrigger>
                <TabsTrigger value="my-bids" className="text-xs md:text-sm px-2 md:px-4 py-2">
                  <span className="hidden md:inline">My Bids</span>
                  <span className="md:hidden">Bids</span>
                </TabsTrigger>
                <TabsTrigger value="waivers" className="text-xs md:text-sm px-2 md:px-4 py-2">
                  <span className="hidden md:inline">Waivers</span>
                  <span className="md:hidden">Waivers</span>
                </TabsTrigger>
              </TabsList>

              {/* Free Agents Tab Content */}
              <TabsContent value="free-agents">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Free Agents</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Available players for bidding. {!isBiddingEnabled && "Bidding is currently disabled."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4 md:mb-6">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <Select value={positionFilter} onValueChange={setPositionFilter}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filter by position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Positions</SelectItem>
                            <SelectItem value="G">Goalie</SelectItem>
                            <SelectItem value="C">Center</SelectItem>
                            <SelectItem value="LW">Left Wing</SelectItem>
                            <SelectItem value="RW">Right Wing</SelectItem>
                            <SelectItem value="LD">Left Defense</SelectItem>
                            <SelectItem value="RD">Right Defense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <Input
                          placeholder="Search by name..."
                          value={nameFilter}
                          onChange={(e) => setNameFilter(e.target.value)}
                          className="w-full sm:w-48"
                        />
                      </div>
                      <Button onClick={fetchFreeAgents} variant="outline" className="shrink-0">
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>

                    {freeAgentsLoading ? (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground">Loading free agents...</div>
                      </div>
                    ) : freeAgentsError ? (
                      <div className="text-center py-8">
                        <div className="text-red-500 mb-4">Error loading free agents:</div>
                        <div className="text-sm text-gray-600 mb-4">{freeAgentsError}</div>
                        <Button onClick={fetchFreeAgents} variant="outline">
                          Try Again
                        </Button>
                      </div>
                    ) : filteredFreeAgents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {filteredFreeAgents.map((player) => {
                          if (!player.users) return null

                          const currentBid = playerBids[player.id]
                          const canBid = isBiddingEnabled && (!currentBid || currentBid.team_id !== teamData?.id) && projectedRosterSize < 15

                          return (
                            <div
                              key={player.id}
                              className="border rounded-lg p-3 md:p-4 shadow-sm dark:border-gray-800"
                            >
                              <div className="flex justify-between items-start mb-2 md:mb-3">
                                <div>
                                  <h3 className="font-medium text-sm md:text-base">
                                    {player.users?.gamer_tag_id || "Unknown Player"}
                                  </h3>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span
                                      className={`${getPositionColor(player.users?.primary_position)} text-xs md:text-sm`}
                                    >
                                      {getPositionAbbreviation(player.users?.primary_position || "Unknown")}
                                    </span>
                                    {player.users?.secondary_position && (
                                      <>
                                        {" / "}
                                        <span
                                          className={`${getPositionColor(player.users?.secondary_position)} text-xs md:text-sm`}
                                        >
                                          {getPositionAbbreviation(player.users?.secondary_position)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                    {player.users?.console} • ${(player.salary / 1000000).toFixed(2)}M
                                  </p>
                                </div>
                              </div>

                              {currentBid && (
                                <div className="mb-2 md:mb-3 p-2 bg-muted rounded-md">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs md:text-sm font-medium">Current Bid:</span>
                                    <span className="font-bold text-xs md:text-sm">
                                      ${currentBid.bid_amount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span>By: {currentBid.teams?.name}</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimeRemaining(currentBid.bid_expires_at)}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleBidClick(player)}
                                  className="flex-1 text-xs md:text-sm h-8 md:h-9"
                                  size="sm"
                                  disabled={!canBid}
                                  title={projectedRosterSize >= 15 ? "Roster limit reached with current bids" : ""}
                                >
                                  {currentBid && currentBid.team_id === teamData?.id ? "Extend Bid" : "Place Bid"}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
                        {freeAgents.length === 0
                          ? "No free agents available."
                          : "No players match your filter criteria."}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Other tabs with placeholder content */}
              <TabsContent value="roster">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Roster</CardTitle>
                    <CardDescription>Manage your team's players and roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamPlayers.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Player</TableHead>
                              <TableHead className="text-center">Position</TableHead>
                              <TableHead className="text-center">Role</TableHead>
                              <TableHead className="text-center">Console</TableHead>
                              <TableHead className="text-center">Salary</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamPlayers.map((player) => (
                              <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                  <div className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className={getPositionColor(player.users?.primary_position)}>
                                      {getPositionAbbreviation(player.users?.primary_position || "Unknown")}
                                    </span>
                                    {player.users?.secondary_position && (
                                      <>
                                        {" / "}
                                        <span className={getPositionColor(player.users?.secondary_position)}>
                                          {getPositionAbbreviation(player.users?.secondary_position)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={player.role === "Owner" ? "default" : "outline"}>
                                    {player.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">{player.users?.console || "Unknown"}</TableCell>
                                <TableCell className="text-center font-mono">
                                  ${(player.salary / 1000000).toFixed(2)}M
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No players on this team.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Availability</CardTitle>
                    <CardDescription>View your team's availability for upcoming games</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamData ? (
                      <TeamAvailabilityTab teamId={teamData.id} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Loading team data...</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="waivers">
                <Card>
                  <CardHeader>
                    <CardTitle>Waiver Wire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WaiverHistory />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Placeholder for other tabs */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">Schedule coming soon...</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="my-bids">
                <Card>
                  <CardHeader>
                    <CardTitle>My Bids</CardTitle>
                    <CardDescription>
                      Bids placed by {teamData?.name}. Active: {activeBidsCount} | Outbid: {outbidCount}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myBids.length > 0 ? (
                      <div className="space-y-4">
                        {myBids.map((bid) => {
                          const isExpired = bid.isExpired
                          const isWinning = bid.isHighestBidder && !isExpired

                          return (
                            <div key={bid.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">
                                    {bid.players?.users?.gamer_tag_id || "Unknown Player"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Your bid: ${bid.bid_amount.toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={isWinning ? "default" : isExpired ? "secondary" : "destructive"}>
                                    {isExpired ? "EXPIRED" : isWinning ? "WINNING" : "OUTBID"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No bids placed yet.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>

      {/* Bid Modal */}
      {selectedPlayer && (
        <BidPlayerModal
          player={selectedPlayer}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedPlayer(null)
          }}
          onBidPlaced={() => {
            fetchFreeAgents()
            fetchData()
          }}
          teamData={teamData}
          userTeam={teamData}
          fetchData={fetchData}
          fetchPlayerBids={fetchFreeAgents}
          currentTeamSalary={currentTeamSalary}
          projectedSalary={projectedSalary}
          currentSalaryCap={currentSalaryCap}
          teamPlayers={teamPlayers}
          projectedRosterSize={projectedRosterSize}
          currentBid={selectedPlayer ? playerBids[selectedPlayer.id] : null}
          salaryCap={currentSalaryCap}
        />
      )}
    </div>
  )
}

export default ManagementPage
