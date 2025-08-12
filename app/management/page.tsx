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
import { Textarea } from "@/components/ui/textarea"
import { XCircle, CheckCircle2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Home, Gavel } from "lucide-react"
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

interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  scheduled_time: string
  status: string
  home_score?: number
  away_score?: number
  home_team: {
    name: string
    logo_url?: string
  }
  away_team: {
    name: string
    logo_url?: string
  }
}

interface FreeAgent {
  id: string
  salary: number
  users: {
    id: string
    gamer_tag_id: string
    primary_position: string
    secondary_position?: string
    console: string
    avatar_url?: string
  }
}

interface Bid {
  id: string
  amount: number
  expires_at: string
  status: string
  players: {
    id: string
    salary: number
    users: {
      id: string
      gamer_tag_id: string
      primary_position: string
      secondary_position?: string
      console: string
    }
  }
}

interface Waiver {
  id: string
  player_id: string
  waiving_team_id: string
  waived_at: string
  claim_deadline: string
  status: string
  players: {
    id: string
    salary: number
    users: {
      id: string
      gamer_tag_id: string
      primary_position: string
      secondary_position?: string
      console: string
      avatar_url?: string
    }
  }
  waiving_team: {
    id: string
    name: string
    logo_url?: string
  }
  waiver_claims?: Array<{
    id: string
    claiming_team_id: string
    priority_at_claim: number
    teams: {
      name: string
      logo_url?: string
    }
  }>
  hasTeamClaimed?: boolean
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

const tabs = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "bids", label: "Bids", icon: Gavel },
  { id: "lineups", label: "Lineups", icon: Users },
  { id: "availability", label: "Availability", icon: Calendar },
]

const ManagementPage = () => {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  // Safe search params handling
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<any>(false)
  const [historyPlayer, setHistoryPlayer] = useState<any>(null)
  const [now, setNow] = useState(new Date())
  const [activeBidsCount, setActiveBidsCount] = useState(0)
  const [outbidCount, setOutbidCount] = useState(0)
  const [freeAgentsError, setFreeAgentsError] = useState<string | null>(null)
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(false)

  // Get active tab from search params or default to "roster"
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "roster")

  // Trade state
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [selectedTeamForTrade, setSelectedTeamForTrade] = useState<string | null>(null)
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState<any[]>([])
  const [selectedMyPlayers, setSelectedMyPlayers] = useState<any[]>([])
  const [selectedOtherPlayers, setSelectedOtherPlayers] = useState<any[]>([])
  const [tradeError, setTradeError] = useState<string | null>(null)
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null)
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false)
  const [currentSalaryCap, setCurrentSalaryCap] = useState(30000000) // $30M salary cap
  const [currentTeamSalary, setCurrentTeamSalary] = useState(0)
  const [projectedTeamSalary, setProjectedTeamSalary] = useState(0)
  const [otherTeamSalary, setOtherTeamSalary] = useState(0)
  const [projectedOtherTeamSalary, setProjectedOtherTeamSalary] = useState(0)
  const [tradeMessage, setTradeMessage] = useState("")
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(true)

  // Trade proposals
  const [incomingTradeProposals, setIncomingTradeProposals] = useState<any[]>([])
  const [outgoingTradeProposals, setOutgoingTradeProposals] = useState<any[]>([])
  const [selectedTradeProposal, setSelectedTradeProposal] = useState<any>(null)
  const [isTradeDetailsOpen, setIsTradeDetailsOpen] = useState(false)
  const [isProcessingTradeResponse, setIsProcessingTradeResponse] = useState(false)
  const [cancellingTrades, setCancellingTrades] = useState<Set<string>>(new Set())

  // Add these state variables after the existing useState declarations
  const [projectedSalary, setProjectedSalary] = useState(0)
  const [projectedRosterSize, setProjectedRosterSize] = useState(0)

  // Waiver state
  const [waivers, setWaivers] = useState<any[]>([])
  const [loadingWaivers, setLoadingWaivers] = useState(false)
  const [waiverError, setWaiverError] = useState<string | null>(null)
  const [waivingPlayers, setWaivingPlayers] = useState<Set<string>>(new Set())
  const [claimingWaivers, setClaimingWaivers] = useState<Set<string>>(new Set())

  // Add this state variable near the top with other useState declarations
  const [userRole, setUserRole] = useState<string | null>(null)
  const [bidModalOpen, setBidModalOpen] = useState(false)

  // Add state for cap space withholding
  const [capSpaceWithholding, setCapSpaceWithholding] = useState<{ [playerId: string]: number }>({})

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Update the position filter logic in the useEffect
  useEffect(() => {
    let filtered = freeAgents

    // Apply name filter if provided
    if (nameFilter.trim() !== "") {
      const searchTerm = nameFilter.toLowerCase().trim()
      filtered = filtered.filter((player) => player.users?.gamer_tag_id?.toLowerCase().includes(searchTerm))
    }

    // Apply position filter if not "all"
    if (positionFilter !== "all") {
      filtered = filtered.filter((player) => {
        // Normalize positions to abbreviations for comparison
        const primaryPos = getPositionAbbreviation(player.users?.primary_position || "")
        const secondaryPos = getPositionAbbreviation(player.users?.secondary_position || "")
        const filterPos = getPositionAbbreviation(positionFilter)

        return primaryPos === filterPos || secondaryPos === filterPos
      })
    }

    setFilteredFreeAgents(filtered)
  }, [positionFilter, nameFilter, freeAgents])

  // Fixed useEffect to calculate projections based on winning bids - ALWAYS RUNS
  useEffect(() => {
    if (!teamData) {
      setProjectedSalary(currentTeamSalary)
      setProjectedRosterSize(teamPlayers.length)
      return
    }

    // Calculate projected values based on winning bids that haven't expired
    const winningBids = myBids.filter((bid) => {
      const isWinning = bid.isHighestBidder
      const isActive = new Date(bid.bid_expires_at) > now
      return isWinning && isActive
    })

    console.log("Calculating projections - Winning bids:", winningBids.length) // Debug log

    const projectedSalaryIncrease = winningBids.reduce((sum, bid) => sum + bid.bid_amount, 0)
    const projectedRosterIncrease = winningBids.length

    const newProjectedSalary = currentTeamSalary + projectedSalaryIncrease
    const newProjectedRosterSize = teamPlayers.length + projectedRosterIncrease

    console.log("Setting projected salary:", newProjectedSalary, "roster:", newProjectedRosterSize) // Debug log

    setProjectedSalary(newProjectedSalary)
    setProjectedRosterSize(newProjectedRosterSize)
  }, [myBids, currentTeamSalary, teamPlayers.length, teamData, now]) // Always runs when these change

  // Check bidding status
  useEffect(() => {
    const checkBiddingStatus = async () => {
      try {
        const response = await fetch("/api/bidding/status")
        const data = await response.json()
        setIsBiddingEnabled(data.enabled)
      } catch (error) {
        console.error("Error checking bidding status:", error)
        setIsBiddingEnabled(false) // Default to disabled on error
      }
    }

    checkBiddingStatus()
  }, [])

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    const loadOtherTeamPlayers = async () => {
      if (!selectedTeamForTrade) {
        setSelectedTeamPlayers([])
        setOtherTeamSalary(0)
        setProjectedOtherTeamSalary(0)
        return
      }

      console.log("Loading players for team:", selectedTeamForTrade) // Debug log

      try {
        // Fetch other team's players
        const { data: otherPlayers, error: otherPlayersError } = await supabase
          .from("players")
          .select(`
          id,
          role,
          salary,
          user_id
        `)
          .eq("team_id", selectedTeamForTrade)
          .order("role", { ascending: false })

        if (otherPlayersError) {
          console.error("Error fetching other team players:", otherPlayersError)
          throw otherPlayersError
        }

        console.log("Fetched other team players:", otherPlayers?.length) // Debug log

        // Get the active season for position data
        const { data: activeSeason, error: seasonError } = await supabase
          .from("seasons")
          .select("id")
          .eq("is_active", true)
          .single()

        if (seasonError) {
          console.error("Error fetching active season:", seasonError)
        }

        // Get position data from season_registrations and user data
        const userIds = otherPlayers?.map((player) => player.user_id) || []
        let enhancedOtherPlayers = otherPlayers || []

        if (userIds.length > 0) {
          // Get user data
          const { data: users, error: usersError } = await supabase
            .from("users")
            .select(`
            id,
            email,
            gamer_tag_id,
            console,
            avatar_url
          `)
            .in("id", userIds)

          if (usersError) {
            console.error("Error fetching users:", usersError)
          }

          // Get registration data for positions if we have an active season
          let registrations = []
          if (activeSeason) {
            const { data: regData, error: regError } = await supabase
              .from("season_registrations")
              .select(`
              user_id,
              primary_position,
              secondary_position,
              gamer_tag,
              console
            `)
              .in("user_id", userIds)
              .eq("season_id", activeSeason.id)
              .eq("status", "Approved")

            if (regError) {
              console.error("Error fetching player registrations:", regError)
            } else {
              registrations = regData || []
            }
          }

          // Combine all data
          enhancedOtherPlayers =
            otherPlayers?.map((player) => {
              const user = users?.find((u) => u.id === player.user_id)
              const registration = registrations?.find((reg) => reg.user_id === player.user_id)

              return {
                ...player,
                users: {
                  id: user?.id || player.user_id,
                  email: user?.email,
                  gamer_tag_id: registration?.gamer_tag || user?.gamer_tag_id || "Unknown Player",
                  primary_position: registration?.primary_position || "Unknown",
                  secondary_position: registration?.secondary_position || null,
                  console: registration?.console || user?.console,
                  avatar_url: user?.avatar_url,
                },
              }
            }) || []
        }

        console.log("Enhanced other team players:", enhancedOtherPlayers?.length) // Debug log
        setSelectedTeamPlayers(enhancedOtherPlayers)

        // Calculate other team's current salary
        const otherTeamCurrentSalary = otherPlayers?.reduce((sum, player) => sum + (player.salary || 0), 0) || 0
        setOtherTeamSalary(otherTeamCurrentSalary)
        setProjectedOtherTeamSalary(otherTeamCurrentSalary)
      } catch (error) {
        console.error("Error loading other team players:", error)
        // Set empty state on error
        setSelectedTeamPlayers([])
        setOtherTeamSalary(0)
        setProjectedOtherTeamSalary(0)
      }
    }

    loadOtherTeamPlayers()
  }, [selectedTeamForTrade, supabase])

  // Add useEffect to calculate projected trade salaries
  useEffect(() => {
    if (!selectedTeamForTrade || !teamData) {
      setProjectedTeamSalary(currentTeamSalary)
      setProjectedOtherTeamSalary(otherTeamSalary)
      return
    }

    // Calculate salary changes for my team
    const myPlayersToTrade = teamPlayers.filter((p) => selectedMyPlayers.includes(p.id))
    const otherPlayersToReceive = selectedTeamPlayers.filter((p) => selectedOtherPlayers.includes(p.id))

    const myPlayersSalaryOut = myPlayersToTrade.reduce((sum, player) => {
      const withholding = capSpaceWithholding[player.id] || 0
      return sum + (player.salary - withholding)
    }, 0)

    const otherPlayersSalaryIn = otherPlayersToReceive.reduce((sum, player) => sum + (player.salary || 0), 0)

    const newProjectedTeamSalary = currentTeamSalary - myPlayersSalaryOut + otherPlayersSalaryIn

    // Calculate salary changes for other team
    const otherPlayersSalaryOut = otherPlayersToReceive.reduce((sum, player) => sum + (player.salary || 0), 0)
    const myPlayersSalaryIn = myPlayersToTrade.reduce((sum, player) => {
      const withholding = capSpaceWithholding[player.id] || 0
      return sum + (player.salary - withholding)
    }, 0)

    const newProjectedOtherTeamSalary = otherTeamSalary - otherPlayersSalaryOut + myPlayersSalaryIn

    setProjectedTeamSalary(newProjectedTeamSalary)
    setProjectedOtherTeamSalary(newProjectedOtherTeamSalary)
  }, [
    selectedMyPlayers,
    selectedOtherPlayers,
    teamPlayers,
    selectedTeamPlayers,
    currentTeamSalary,
    otherTeamSalary,
    capSpaceWithholding,
    selectedTeamForTrade,
    teamData,
  ])

  // Handle tab change
  const handleTabChange = (value: string) => {
    try {
      router.push(`/management?tab=${value}`, { scroll: false })
    } catch (error) {
      console.warn("Error navigating:", error)
      // Fallback: just update the URL without router
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", value)
        window.history.replaceState({}, "", url.toString())
      }
    }
  }

  function formatTimeRemaining(expiresAt: string): string {
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
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
      console.log("Current season ID:", currentSeasonId)

      // Get calculated team stats (this will give us the actual record)
      const calculatedTeamStats = await getTeamStats(playerData.team_id, currentSeasonId)
      console.log("Calculated team stats:", calculatedTeamStats)

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

      // Combine basic team data with calculated stats
      const teamWithStats: Team = {
        ...basicTeamData,
        wins: calculatedTeamStats.wins,
        losses: calculatedTeamStats.losses,
        otl: calculatedTeamStats.otl,
        points: calculatedTeamStats.points,
        games_played: calculatedTeamStats.games_played,
        goals_for: calculatedTeamStats.goals_against,
        goal_differential: calculatedTeamStats.goal_differential,
      }

      console.log("Final team data with calculated stats:", teamWithStats)
      setTeamData(teamWithStats)

      // Fetch trade proposals
      await fetchTradeProposals(playerData.team_id, basicTeamData.name)

      // Fetch team players with comprehensive position data fetching
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select(`
          id,
          role,
          salary,
          user_id,
          users!inner (
            id,
            email,
            gamer_tag_id,
            primary_position,
            secondary_position,
            console,
            avatar_url
          )
        `)
        .eq("team_id", playerData.team_id)
        .order("role", { ascending: false })

      if (playersError) {
        console.error("Error fetching players with users:", playersError)
        // Fallback to separate queries
        const { data: playersOnly, error: playersOnlyError } = await supabase
          .from("players")
          .select(`
            id,
            role,
            salary,
            user_id
          `)
          .eq("team_id", playerData.team_id)
          .order("role", { ascending: false })

        if (playersOnlyError) throw playersOnlyError

        // Get user IDs for fetching additional data
        const userIds = playersOnly?.map((player) => player.user_id) || []
        let enhancedPlayers = playersOnly || []

        if (userIds.length > 0) {
          // Get user data first
          const { data: users, error: usersError } = await supabase
            .from("users")
            .select(`
              id,
              email,
              gamer_tag_id,
              primary_position,
              secondary_position,
              console,
              avatar_url
            `)
            .in("id", userIds)

          if (usersError) {
            console.error("Error fetching users:", usersError)
          }

          // Get season registrations for position data (try multiple approaches)
          let registrations: any[] = []

          // First try: Get active season registrations
          const { data: activeSeason } = await supabase.from("seasons").select("id").eq("is_active", true).single()

          if (activeSeason) {
            const { data: activeSeasonRegs } = await supabase
              .from("season_registrations")
              .select(`
                user_id,
                primary_position,
                secondary_position,
                gamer_tag,
                console
              `)
              .in("user_id", userIds)
              .eq("season_id", activeSeason.id)
              .eq("status", "Approved")

            if (activeSeasonRegs && activeSeasonRegs.length > 0) {
              registrations = activeSeasonRegs
            }
          }

          // Second try: Get any approved registrations if active season didn't work
          if (registrations.length === 0) {
            const { data: anyApprovedRegs } = await supabase
              .from("season_registrations")
              .select(`
                user_id,
                primary_position,
                secondary_position,
                gamer_tag,
                console,
                season_id
              `)
              .in("user_id", userIds)
              .eq("status", "Approved")
              .order("season_id", { ascending: false })

            if (anyApprovedRegs && anyApprovedRegs.length > 0) {
              // Group by user_id and take the most recent registration for each user
              const latestRegs = anyApprovedRegs.reduce(
                (acc, reg) => {
                  if (!acc[reg.user_id] || reg.season_id > acc[reg.user_id].season_id) {
                    acc[reg.user_id] = reg
                  }
                  return acc
                },
                {} as Record<string, any>,
              )

              registrations = Object.values(latestRegs)
            }
          }

          console.log("Found registrations for team players:", registrations.length)

          // Combine all data with fallback logic
          enhancedPlayers = playersOnly.map((player) => {
            const user = users?.find((u) => u.id === player.user_id)
            const registration = registrations?.find((reg) => reg.user_id === player.user_id)

            return {
              ...player,
              users: {
                id: user?.id || player.user_id,
                email: user?.email,
                gamer_tag_id: registration?.gamer_tag || user?.gamer_tag_id || "Unknown Player",
                primary_position: registration?.primary_position || user?.primary_position || "Unknown",
                secondary_position: registration?.secondary_position || user?.secondary_position || null,
                console: registration?.console || user?.console || "Unknown",
                avatar_url: user?.avatar_url,
              },
            }
          })
        }

        setTeamPlayers(enhancedPlayers)
      } else {
        // Direct query worked, but still try to enhance with season registration data
        const userIds = players?.map((player) => player.user_id) || []

        if (userIds.length > 0) {
          // Get season registrations for enhanced position data
          let registrations: any[] = []

          // Try to get active season registrations
          const { data: activeSeason } = await supabase.from("seasons").select("id").eq("is_active", true).single()

          if (activeSeason) {
            const { data: activeSeasonRegs } = await supabase
              .from("season_registrations")
              .select(`
                user_id,
                primary_position,
                secondary_position,
                gamer_tag,
                console
              `)
              .in("user_id", userIds)
              .eq("season_id", activeSeason.id)
              .eq("status", "Approved")

            if (activeSeasonRegs && activeSeasonRegs.length > 0) {
              registrations = activeSeasonRegs
            }
          }

          // Enhance players with registration data if available
          const enhancedPlayers = players.map((player) => {
            const registration = registrations?.find((reg) => reg.user_id === player.user_id)

            if (registration) {
              return {
                ...player,
                users: {
                  ...player.users,
                  gamer_tag_id: registration.gamer_tag || player.users.gamer_tag_id,
                  primary_position: registration.primary_position || player.users.primary_position,
                  secondary_position: registration.secondary_position || player.users.secondary_position,
                  console: registration.console || player.users.console,
                },
              }
            }

            return player
          })

          setTeamPlayers(enhancedPlayers)
        } else {
          setTeamPlayers(players || [])
        }
      }

      // Calculate current team salary
      const totalSalary = (players || teamPlayers)?.reduce((sum, player) => sum + (player.salary || 0), 0) || 0
      setCurrentTeamSalary(totalSalary)
      setProjectedTeamSalary(totalSalary)

      // Fetch all teams for trade functionality
      const { data: allTeamsData, error: allTeamsError } = await supabase
        .from("teams")
        .select("*")
        .neq("id", playerData.team_id)
        .order("name", { ascending: true })

      if (allTeamsError) {
        console.error("Error fetching teams:", allTeamsError)
      } else {
        setAllTeams(allTeamsData || [])
      }

      // Fetch team matches with lineups - Fixed the query structure
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:home_team_id(id, name, logo_url),
          away_team:away_team_id(id, name, logo_url)
        `)
        .or(`home_team_id.eq.${playerData.team_id},away_team_id.eq.${playerData.team_id}`)
        .order("match_date", { ascending: true })

      if (matchesError) throw matchesError
      setTeamMatches(matches || [])

      // Load free agents - this will be called separately when needed
      // await loadFreeAgents()

      // Fetch my team's bids with enhanced status tracking
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
        const { data: allBids, error: allBidsError } = await supabase
          .from("player_bidding")
          .select("*")
          .order("bid_amount", { ascending: false })

        if (!allBidsError && allBids) {
          // Group all bids by player_id to find highest bid for each player
          const highestBidsByPlayer: Record<string, any> = {}
          allBids.forEach((bid) => {
            if (!highestBidsByPlayer[bid.player_id] || bid.bid_amount > highestBidsByPlayer[bid.player_id].bid_amount) {
              highestBidsByPlayer[bid.player_id] = bid
            }
          })

          // Enhance our bids with winning status and categorize them
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

  // Fetch trade proposals
  const fetchTradeProposals = async (teamId: string, teamName: string) => {
    try {
      // Fetch incoming trade proposals (exclude processed ones)
      const { data: incoming, error: incomingError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session?.user.id)
        .like("title", `Trade Proposal from %`)
        .not("message", "like", "%STATUS:%")
        .order("created_at", { ascending: false })

      if (incomingError) {
        console.error("Error fetching incoming trade proposals:", incomingError)
      } else {
        console.log("Fetched incoming trade proposals:", incoming?.length || 0)
        setIncomingTradeProposals(incoming || [])
      }

      // Fetch outgoing trade proposals (exclude processed ones)
      const { data: outgoing, error: outgoingError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session?.user.id)
        .like("title", `Trade Proposal to %`)
        .not("message", "like", "%STATUS:%")
        .order("created_at", { ascending: false })

      if (outgoingError) {
        console.error("Error fetching outgoing trade proposals:", outgoingError)
      } else {
        console.log("Fetched outgoing trade proposals:", outgoing?.length || 0)
        setOutgoingTradeProposals(outgoing || [])
      }
    } catch (error) {
      console.error("Error fetching trade proposals:", error)
    }
  }

  // Enhanced loadFreeAgents function with better error handling for team managers
  const loadFreeAgents = async () => {
    setFreeAgentsLoading(true)
    setFreeAgentsError(null)

    try {
      console.log("Loading free agents via API...")
      console.log("Current session:", !!session)
      console.log("User role:", session?.user?.role)
      console.log("Team data:", teamData?.name)

      const response = await fetch("/api/free-agents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Include authorization header if we have a session
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })

      console.log("Free agents API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch free agents: ${response.status}`)
      }

      const data = await response.json()
      console.log("Free agents API response:", {
        freeAgentsCount: data.freeAgents?.length || 0,
        debug: data.debug,
      })

      const freeAgentsList = data.freeAgents || []
      setFreeAgents(freeAgentsList)
      setFilteredFreeAgents(freeAgentsList)

      // Fetch bids for all players
      await fetchPlayerBids()

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

  // Fetch current bids for all players
  const fetchPlayerBids = async () => {
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
    } catch (error) {
      console.log("Error fetching player bids:", error)
    }
  }

  // Find the loadWaiversData function and update it to handle expired waivers better

  // Replace the loadWaiversData function with this improved version:
  const loadWaiversData = async () => {
    setLoadingWaivers(true)
    setWaiverError(null)

    try {
      console.log("Loading waivers data...")

      // First, process any expired waivers with better error handling
      try {
        console.log("Processing expired waivers...")
        const processResponse = await fetch("/api/waivers/check-expired", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (processResponse.ok) {
          const processResult = await processResponse.json()
          console.log("Waiver processing result:", processResult)

          if (processResult.expiredCount > 0) {
            toast({
              title: "Waivers Processed",
              description: `${processResult.expiredCount} expired waivers have been processed.`,
            })

            // Refresh team data since players may have been assigned
            await fetchData()
          }
        } else {
          console.warn("Failed to process expired waivers:", processResponse.status)
          const errorData = await processResponse.json()
          console.warn("Process error details:", errorData)
        }
      } catch (processError) {
        console.error("Error processing waivers:", processError)
        // Don't fail the whole operation if processing fails
      }

      // Then fetch current active waivers (should exclude processed ones)
      console.log("Fetching active waivers...")
      const response = await fetch("/api/waivers?status=active", {
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch waivers: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched active waivers:", data.waivers?.length || 0)

      // Filter out any waivers that are expired but still showing as active
      const now = new Date()
      const filteredWaivers = (data.waivers || []).filter((waiver) => {
        const deadline = new Date(waiver.claim_deadline)
        return deadline > now
      })

      console.log(`Filtered out ${(data.waivers || []).length - filteredWaivers.length} expired waivers`)

      // Process the waivers to add the hasTeamClaimed property
      const waiversWithClaims = await Promise.all(
        filteredWaivers.map(async (waiver) => {
          // Check if the current team has claimed this waiver
          const { data: teamClaim, error: teamClaimError } = await supabase
            .from("waiver_claims")
            .select("id")
            .eq("waiver_id", waiver.id)
            .eq("claiming_team_id", teamData?.id)
            .eq("status", "pending")
            .maybeSingle()

          const hasTeamClaimed = !!teamClaim

          return {
            ...waiver,
            hasTeamClaimed,
          }
        }),
      )

      console.log("Final waivers to display:", waiversWithClaims.length)
      setWaivers(waiversWithClaims)
    } catch (error) {
      console.error("Error loading waivers:", error)
      setWaiverError(error.message || "Failed to load waivers")
    } finally {
      setLoadingWaivers(false)
    }
  }

  // Enhanced waive player function with better error handling and session validation
  const handleWaivePlayerAction = async (playerId: string) => {
    if (waivingPlayers.has(playerId)) return // Prevent double-clicks

    console.log("Attempting to waive player:", playerId)
    console.log("Current session:", session)
    console.log("Team data:", teamData)

    try {
      setWaivingPlayers((prev) => new Set(prev).add(playerId))

      // Validate session before making request
      if (!session?.user?.id) {
        throw new Error("No valid session found")
      }

      if (!teamData?.id) {
        throw new Error("No team data found")
      }

      // Get fresh session to ensure we have valid tokens
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !freshSession) {
        console.error("Session error:", sessionError)
        throw new Error("Authentication session expired. Please refresh the page.")
      }

      console.log("Making waiver request with fresh session")

      const response = await fetch("/api/waivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use the fresh session access token
          Authorization: `Bearer ${freshSession.access_token}`,
        },
        body: JSON.stringify({ playerId }),
      })

      console.log("Waiver response status:", response.status)

      const data = await response.json()
      console.log("Waiver response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to waive player")
      }

      toast({
        title: "Player waived",
        description: "Player has been placed on waivers for 8 hours.",
      })

      // Refresh data
      console.log("Refreshing data after waiving player...")
      await fetchData()
      await loadWaiversData()

      // Switch to the available tab to show the newly waived player
      console.log("Switching to available tab...")
      handleTabChange("waivers")

      // Force a re-render by updating the URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", "waivers")
        window.history.replaceState({}, "", url.toString())
      }
    } catch (error: any) {
      console.error("Error waiving player:", error)
      toast({
        title: "Error waiving player",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setWaivingPlayers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(playerId)
        return newSet
      })
    }
  }

  // Enhanced claim player function with better error handling and session validation
  const handleClaimPlayer = async (waiverId: string) => {
    if (claimingWaivers.has(waiverId)) return // Prevent double-clicks

    console.log("Attempting to claim waiver:", waiverId)
    console.log("Current session:", session)
    console.log("Team data:", teamData)

    try {
      setClaimingWaivers((prev) => new Set(prev).add(waiverId))

      // Validate session before making request
      if (!session?.user?.id) {
        throw new Error("No valid session found")
      }

      if (!teamData?.id) {
        throw new Error("No team data found")
      }

      // Get fresh session to ensure we have valid tokens
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !freshSession) {
        console.error("Session error:", sessionError)
        throw new Error("Authentication session expired. Please refresh the page.")
      }

      console.log("Making claim request with fresh session")

      const response = await fetch(`/api/waivers/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use the fresh session access token
          Authorization: `Bearer ${freshSession.access_token}`,
        },
        body: JSON.stringify({
          waiverId,
          teamId: teamData.id,
        }),
      })

      console.log("Claim response status:", response.status)

      const data = await response.json()
      console.log("Claim response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim waiver")
      }

      toast({
        title: "Claim submitted",
        description: "Your waiver claim has been submitted. You'll be notified when the waiver period ends.",
      })

      // Refresh waivers to show the updated claim
      await loadWaiversData()
    } catch (error: any) {
      console.error("Error claiming player:", error)
      toast({
        title: "Error claiming player",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setClaimingWaivers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(waiverId)
        return newSet
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, [supabase, session, toast])

  // Add this effect to load waivers when the tab changes to "waivers"
  useEffect(() => {
    if (activeTab === "waivers" && teamData?.id) {
      console.log("Loading waivers data...")
      loadWaiversData()
    }
  }, [activeTab, teamData?.id])

  // Effect to reload free agents when switching to free-agents tab
  useEffect(() => {
    if (activeTab === "free-agents" && teamData?.id) {
      console.log("Switching to free-agents tab, reloading free agents") // Debug log
      loadFreeAgents()
    }
  }, [activeTab, teamData?.id])

  const handleBidClick = (player: any) => {
    console.log("handleBidClick called for player:", player)
    console.log("Current userTeam:", teamData)
    console.log("Current isModalOpen:", isModalOpen)
    setSelectedPlayer(player)
    setIsModalOpen(true)
    console.log("After setting modal open, isModalOpen should be true")
  }

  const handleHistoryClick = (player: any) => {
    setHistoryPlayer(player)
    setIsHistoryModalOpen(true)
  }

  // Add function to calculate salary after withholding
  const calculatePostTradePlayerSalary = (player: any, withholding = 0): number => {
    const originalSalary = player.salary || 0
    const postTradeSalary = originalSalary - withholding
    return Math.max(postTradeSalary, 750000) // Minimum $750k
  }

  // Add function to get validwithholding amounts
  const getValidWithholdingAmounts = (playerSalary: number): number[] => {
    const maxWithholding = Math.floor((playerSalary * 0.25) / 250000) * 250000 // 25% in $250k increments
    const amounts = []
    for (let i = 0; i <= maxWithholding; i += 250000) {
      if (playerSalary - i >= 750000) {
        // Ensure minimum salary
        amounts.push(i)
      }
    }
    return amounts
  }

  // Enhanced trade response handler with better error handling
  const handleTradeResponse = async (proposalId: string, accept: boolean) => {
    try {
      setIsProcessingTradeResponse(true)

      console.log("Processing trade response:", { proposalId, accept, userId: session?.user?.id })

      // Validate session before making request
      if (!session?.user?.id) {
        throw new Error("No valid session found")
      }

      if (!teamData?.id) {
        throw new Error("No team data found")
      }

      const response = await fetch("/api/trades/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: proposalId,
          accept: accept,
          userId: session.user.id,
        }),
      })

      console.log("Trade response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Trade response error:", errorData)
        throw new Error(errorData.error || `Failed to ${accept ? "accept" : "reject"} trade`)
      }

      const data = await response.json()
      console.log("Trade response data:", data)

      toast({
        title: accept ? "Trade Accepted" : "Trade Rejected",
        description: accept ? "The trade has been completed successfully." : "The trade proposal has been rejected.",
      })

      // Refresh data and trade proposals
      console.log("Refreshing data after trade response...")
      await fetchData()
      if (teamData?.id && teamData?.name) {
        await fetchTradeProposals(teamData.id, teamData.name)
      }

      // Close any open modals
      setIsTradeDetailsOpen(false)
      setSelectedTradeProposal(null)
    } catch (error: any) {
      console.error(`Error ${accept ? "accepting" : "rejecting"} trade:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${accept ? "accept" : "reject"} trade`,
        variant: "destructive",
      })
    } finally {
      setIsProcessingTradeResponse(false)
    }
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
        {/* Update the main title section to be more mobile-friendly: */}
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
            {/* Update the stats cards grid to be more mobile-friendly by changing the grid classes: */}
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

            {/* Update the tabs to be more mobile-friendly: */}
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
                <TabsTrigger value="trades" className="text-xs md:text-sm px-2 md:px-4 py-2 relative">
                  <span className="hidden md:inline">Trades</span>
                  <span className="md:hidden">Trades</span>
                  {incomingTradeProposals.length > 0 && (
                    <span className="ml-1 md:ml-2 bg-primary text-primary-foreground rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-xs">
                      {incomingTradeProposals.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Roster Tab Content */}
              <TabsContent value="roster">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Team Roster</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Manage your team's players and roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamPlayers.length > 0 ? (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden md:block rounded-md border overflow-x-auto">
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

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                          {teamPlayers.map((player) => (
                            <div key={player.id} className="border rounded-lg p-4 bg-card">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h3 className="font-medium text-base">
                                    {player.users?.gamer_tag_id || "Unknown Player"}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`${getPositionColor(player.users?.primary_position)} text-sm font-medium`}
                                    >
                                      {getPositionAbbreviation(player.users?.primary_position || "Unknown")}
                                    </span>
                                    {player.users?.secondary_position && (
                                      <>
                                        <span className="text-muted-foreground text-sm">/</span>
                                        <span
                                          className={`${getPositionColor(player.users?.secondary_position)} text-sm font-medium`}
                                        >
                                          {getPositionAbbreviation(player.users?.secondary_position)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={player.role === "Owner" ? "default" : "outline"} className="text-xs">
                                  {player.role}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{player.users?.console || "Unknown"}</span>
                                <span className="font-mono font-medium">${(player.salary / 1000000).toFixed(2)}M</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No players on this team.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Availability Tab Content */}
              <TabsContent value="availability">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Availability</CardTitle>
                    <CardDescription>View your team's availability for upcoming games</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamData ? (
                      <TeamAvailabilityTab teamId={teamData.id} teamName={teamData.name} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Loading team data...</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab Content */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Schedule</CardTitle>
                    <CardDescription>Upcoming and recent matches for {teamData?.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamMatches.length > 0 ? (
                      <div className="space-y-4">
                        {teamMatches.map((match) => {
                          const isHomeTeam = match.home_team_id === teamData?.id
                          const opponent = isHomeTeam ? match.away_team : match.home_team
                          const matchDate = new Date(match.match_date)

                          return (
                            <div
                              key={match.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">{matchDate.toLocaleDateString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {matchDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {isHomeTeam ? "HOME" : "AWAY"}
                                  </Badge>
                                  <span>vs {opponent?.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {match.status === "Completed" ? (
                                  <div className="text-right">
                                    <div className="font-bold">
                                      {isHomeTeam
                                        ? `${match.home_score} - ${match.away_score}`
                                        : `${match.away_score} - ${match.home_score}`}
                                    </div>
                                    <Badge
                                      variant={
                                        (isHomeTeam && match.home_score > match.away_score) ||
                                        (!isHomeTeam && match.away_score > match.home_score)
                                          ? "default"
                                          : "destructive"
                                      }
                                    >
                                      {(isHomeTeam && match.home_score > match.away_score) ||
                                      (!isHomeTeam && match.away_score > match.home_score)
                                        ? "WIN"
                                        : "LOSS"}
                                    </Badge>
                                  </div>
                                ) : (
                                  <Badge variant="outline">{match.status}</Badge>
                                )}
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/matches/${match.id}`}>View</Link>
                                </Button>
                                {match.status === "Scheduled" && (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/management/lineups/${match.id}`}>Set Lineup</Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No matches scheduled.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                      {/* Team Salary */}
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-3 md:p-4">
                          <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Team Salary</h3>
                          <SalaryProgress
                            current={currentTeamSalary}
                            max={currentSalaryCap}
                            projected={projectedSalary}
                          />
                        </CardContent>
                      </Card>

                      {/* Roster Size */}
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-3 md:p-4">
                          <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Roster Size</h3>
                          <RosterProgress current={teamPlayers.length} max={15} projected={projectedRosterSize} />
                        </CardContent>
                      </Card>

                      {/* Position Breakdown */}
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-3 md:p-4">
                          <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">
                            Position Breakdown
                          </h3>
                          <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm">
                            {/* Calculate position counts */}
                            {(() => {
                              const positions = {
                                C: 0,
                                LW: 0,
                                RW: 0,
                                LD: 0,
                                RD: 0,
                                G: 0,
                              }

                              teamPlayers.forEach((player) => {
                                const pos = getPositionAbbreviation(player.users?.primary_position || "")
                                if (positions.hasOwnProperty(pos)) {
                                  positions[pos as keyof typeof positions]++
                                }
                              })

                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-red-400 font-medium">C:</span>
                                    <span className="text-white">{positions.C}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-green-400 font-medium">LW:</span>
                                    <span className="text-white">{positions.LW}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-400 font-medium">RW:</span>
                                    <span className="text-white">{positions.RW}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-cyan-400 font-medium">LD:</span>
                                    <span className="text-white">{positions.LD}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-yellow-400 font-medium">RD:</span>
                                    <span className="text-white">{positions.RD}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-400 font-medium">G:</span>
                                    <span className="text-white">{positions.G}</span>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

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
                    </div>

                    {freeAgentsLoading ? (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground">Loading free agents...</div>
                      </div>
                    ) : freeAgentsError ? (
                      <div className="text-center py-8">
                        <div className="text-red-500 mb-4">{freeAgentsError}</div>
                        <Button onClick={loadFreeAgents} variant="outline">
                          Try Again
                        </Button>
                      </div>
                    ) : filteredFreeAgents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {(() => {
                          // Sort players by gamer_tag_id
                          const sortedPlayers = [...filteredFreeAgents].sort((a, b) => {
                            const nameA = a.users?.gamer_tag_id || ""
                            const nameB = b.users?.gamer_tag_id || ""
                            return nameA.localeCompare(nameB)
                          })

                          const userTeam = teamData

                          return sortedPlayers.map((player) => {
                            // Skip players with null users
                            if (!player.users) return null

                            const currentBid = playerBids[player.id]
                            const hasTeam = !!userTeam
                            const canBid =
                              isBiddingEnabled &&
                              (!currentBid || currentBid.team_id !== teamData?.id) &&
                              projectedRosterSize < 15

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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleHistoryClick(player)}
                                    title="View Bid History"
                                    className="h-8 md:h-9 w-8 md:w-9 p-0"
                                  >
                                    <History className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })
                        })()}
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

              {/* My Bids Tab Content */}
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
                          const isOutbid = !bid.isHighestBidder && !isExpired

                          let cardClass = "border rounded-lg p-4"
                          let statusBadge = { variant: "secondary" as const, text: "EXPIRED" }

                          if (isWinning) {
                            cardClass = "border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
                            statusBadge = { variant: "default" as const, text: "WINNING" }
                          } else if (isOutbid) {
                            cardClass = "border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
                            statusBadge = { variant: "destructive" as const, text: "OUTBID" }
                          } else if (isExpired && bid.isHighestBidder) {
                            cardClass =
                              "border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 opacity-75"
                            statusBadge = { variant: "default" as const, text: "WON" }
                          } else if (isExpired) {
                            cardClass = "border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 opacity-75"
                            statusBadge = { variant: "destructive" as const, text: "LOST" }
                          }

                          return (
                            <div key={bid.id} className={cardClass}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">
                                    {bid.players?.users?.gamer_tag_id || "Unknown Player"}
                                  </h3>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className={getPositionColor(bid.players?.users?.primary_position)}>
                                      {getPositionAbbreviation(bid.players?.users?.primary_position || "Unknown")}
                                    </span>
                                    {bid.players?.users?.secondary_position && (
                                      <>
                                        {" / "}
                                        <span className={getPositionColor(bid.players?.users?.secondary_position)}>
                                          {getPositionAbbreviation(bid.players?.users?.secondary_position)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Your bid: ${bid.bid_amount.toLocaleString()}
                                  </p>
                                  {!bid.isHighestBidder && bid.highestBid && (
                                    <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                                      Outbid by {bid.highestBid.teams?.name}: $
                                      {bid.highestBid.bid_amount.toLocaleString()}
                                    </p>
                                  )}
                                  {isExpired && !bid.isHighestBidder && (
                                    <p className="text-sm text-red-600 dark:text-red-400 font-bold">BID LOST</p>
                                  )}
                                  {isExpired && bid.isHighestBidder && (
                                    <p className="text-sm text-green-600 dark:text-green-400 font-bold">BID WON</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeRemaining(bid.bid_expires_at)}
                                  </div>
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

              {/* Waivers Tab Content */}
              <TabsContent value="waivers">
                <Card>
                  <CardHeader>
                    <CardTitle>Waiver Wire</CardTitle>
                    <CardDescription>
                      Waive players from your roster or claim players from other teams. Claims are processed based on
                      waiver priority. Waivers are automatically processed when they expire.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="available" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="available">Available Players</TabsTrigger>
                        <TabsTrigger value="waive">Waive Player</TabsTrigger>
                      </TabsList>

                      <TabsContent value="available">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                          <div className="lg:col-span-2">
                            {loadingWaivers ? (
                              <div className="space-y-4">
                                {Array(3)
                                  .fill(0)
                                  .map((_, i) => (
                                    <div
                                      key={i}
                                      className="h-20 w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"
                                    />
                                  ))}
                              </div>
                            ) : waiverError ? (
                              <div className="text-center py-8">
                                <p className="text-red-500">{waiverError}</p>
                                <Button onClick={loadWaiversData} className="mt-4">
                                  Try Again
                                </Button>
                              </div>
                            ) : waivers.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                No players currently on waivers
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {waivers.map((waiver) => {
                                  const timeRemaining = new Date(waiver.claim_deadline).getTime() - now.getTime()
                                  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
                                  const minutesRemaining = Math.max(
                                    0,
                                    Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)),
                                  )
                                  const isExpired = timeRemaining <= 0
                                  const isClaimingThisWaiver = claimingWaivers.has(waiver.id)

                                  // Check if current team has already claimed this waiver
                                  const hasAlreadyClaimed = waiver.hasTeamClaimed

                                  return (
                                    <div
                                      key={waiver.id}
                                      className="border rounded-lg p-4 shadow-sm dark:border-gray-800"
                                    >
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <h3 className="font-medium">
                                            {waiver.players?.users?.gamer_tag_id || "Unknown Player"}
                                          </h3>
                                          <div className="flex items-center gap-1 mt-1">
                                            <span className={getPositionColor(waiver.players?.users?.primary_position)}>
                                              {getPositionAbbreviation(waiver.players?.users?.primary_position)}
                                            </span>
                                            {waiver.players?.users?.secondary_position && (
                                              <>
                                                {" / "}
                                                <span
                                                  className={getPositionColor(
                                                    waiver.players?.users?.secondary_position,
                                                  )}
                                                >
                                                  {getPositionAbbreviation(waiver.players?.users?.secondary_position)}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Waived by {waiver.waiving_team?.name} • Salary: $
                                            {waiver.players?.salary?.toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <div className="flex items-center">
                                            <Clock
                                              className={`h-4 w-4 mr-1 ${isExpired ? "text-red-500" : "text-muted-foreground"}`}
                                            />
                                            <span
                                              className={`text-sm ${isExpired ? "text-red-500" : "text-muted-foreground"}`}
                                            >
                                              {isExpired ? "Processing..." : `${hoursRemaining}h ${minutesRemaining}m`}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Display Claiming Teams */}
                                      {waiver.waiver_claims && waiver.waiver_claims.length > 0 && (
                                        <div className="mb-3 p-2 bg-muted rounded-md">
                                          <h4 className="text-sm font-medium mb-2">
                                            Claiming Teams ({waiver.waiver_claims.length}):
                                          </h4>
                                          <TeamLogos teams={waiver.waiver_claims.map((claim: any) => claim.teams)} />
                                        </div>
                                      )}

                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleClaimPlayer(waiver.id)}
                                          className="flex-1"
                                          size="sm"
                                          disabled={
                                            isExpired ||
                                            isClaimingThisWaiver ||
                                            hasAlreadyClaimed ||
                                            waiver.waiving_team_id === teamData?.id
                                          }
                                        >
                                          {isClaimingThisWaiver
                                            ? "Claiming..."
                                            : hasAlreadyClaimed
                                              ? "Claim Submitted"
                                              : waiver.waiving_team_id === teamData?.id
                                                ? "Your Waiver"
                                                : isExpired
                                                  ? "Processing..."
                                                  : "Claim Player"}
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Add the WaiverPriorityDisplay component here */}
                          <div className="lg:col-span-1">
                            {teamData && <WaiverPriorityDisplay teamId={teamData.id} />}
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <Button variant="outline" size="sm" onClick={loadWaiversData} disabled={loadingWaivers}>
                            {loadingWaivers ? "Loading..." : "Refresh Waivers"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="waive">
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                              Waiver Process
                            </h3>
                            <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
                              <li>• Players are placed on waivers for 8 hours</li>
                              <li>• You can cancel within 30 minutes of waiving</li>
                              <li>
                                • Teams can claim players based on waiver priority (worst record gets first priority)
                              </li>
                              <li>• If multiple teams claim, highest priority wins</li>
                              <li>• Winning team moves to bottom of waiver priority</li>
                              <li>• Unclaimed players become free agents</li>
                              <li>• Waivers are automatically processed when they expire</li>
                            </ul>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamPlayers
                              .filter((player) => !["Owner", "GM", "AGM"].includes(player.role))
                              .map((player) => {
                                const isWaivingThisPlayer = waivingPlayers.has(player.id)

                                return (
                                  <div key={player.id} className="border rounded-lg p-4 shadow-sm dark:border-gray-800">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h3 className="font-medium">
                                          {player.users?.gamer_tag_id || "Unknown Player"}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className={getPositionColor(player.users?.primary_position)}>
                                            {getPositionAbbreviation(player.users?.primary_position)}
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
                                        <p className="text-sm text-muted-foreground mt-1">
                                          ${player.salary?.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{player.users?.console}</p>
                                      </div>
                                      <Badge variant="outline">{player.role}</Badge>
                                    </div>
                                    <Button
                                      onClick={() => handleWaivePlayerAction(player.id)}
                                      variant="destructive"
                                      size="sm"
                                      className="w-full"
                                      disabled={isWaivingThisPlayer}
                                    >
                                      {isWaivingThisPlayer ? "Waiving..." : "Waive Player"}
                                    </Button>
                                  </div>
                                )
                              })}
                          </div>

                          {teamPlayers.filter((player) => !["Owner", "GM", "AGM"].includes(player.role)).length ===
                            0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              No players available to waive (management roles cannot be waived)
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Trades Tab Content */}
              <TabsContent value="trades">
                <Card>
                  <CardHeader>
                    <CardTitle>Trade Center</CardTitle>
                    <CardDescription>Propose trades with other teams and manage trade proposals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="propose" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="propose">Propose Trade</TabsTrigger>
                        <TabsTrigger value="incoming">
                          Incoming Proposals
                          {incomingTradeProposals.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {incomingTradeProposals.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="outgoing">Outgoing Proposals</TabsTrigger>
                      </TabsList>

                      <TabsContent value="propose">
                        <div className="space-y-6">
                          {/* Team Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="tradeTeam">Select Team to Trade With</Label>
                            <Select value={selectedTeamForTrade || ""} onValueChange={setSelectedTeamForTrade}>
                              <SelectTrigger id="tradeTeam">
                                <SelectValue placeholder="Select a team" />
                              </SelectTrigger>
                              <SelectContent>
                                {allTeams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedTeamForTrade && (
                            <>
                              {/* Trade Message */}
                              <div className="space-y-2">
                                <Label htmlFor="tradeMessage">Trade Message (Optional)</Label>
                                <Textarea
                                  id="tradeMessage"
                                  placeholder="Add a message to the other team..."
                                  value={tradeMessage}
                                  onChange={(e) => setTradeMessage(e.target.value)}
                                  className="resize-none"
                                  rows={2}
                                />
                              </div>

                              {/* Trade Players Selection */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Your Team */}
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="font-medium">Your Players</h3>
                                    <Badge variant="outline">
                                      ${(currentTeamSalary / 1000000).toFixed(2)}M → $
                                      {(projectedTeamSalary / 1000000).toFixed(2)}M
                                    </Badge>
                                  </div>
                                  <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                                    {teamPlayers.map((player) => (
                                      <div
                                        key={player.id}
                                        className={`p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer ${
                                          selectedMyPlayers.includes(player.id) ? "bg-primary/10" : ""
                                        }`}
                                        onClick={() => {
                                          if (selectedMyPlayers.includes(player.id)) {
                                            setSelectedMyPlayers(selectedMyPlayers.filter((id) => id !== player.id))
                                            // Reset withholding when deselected
                                            setCapSpaceWithholding((prev) => {
                                              const updated = { ...prev }
                                              delete updated[player.id]
                                              return updated
                                            })
                                          } else {
                                            setSelectedMyPlayers([...selectedMyPlayers, player.id])
                                          }
                                        }}
                                      >
                                        <div>
                                          <div className="font-medium">
                                            {player.users?.gamer_tag_id || "Unknown Player"}
                                          </div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-1">
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
                                        </div>
                                        <div className="text-right">
                                          <div className="font-mono">${(player.salary / 1000000).toFixed(2)}M</div>
                                          {selectedMyPlayers.includes(player.id) && (
                                            <Select
                                              value={String(capSpaceWithholding[player.id] || 0)}
                                              onValueChange={(value) => {
                                                setCapSpaceWithholding({
                                                  ...capSpaceWithholding,
                                                  [player.id]: Number(value),
                                                })
                                              }}
                                            >
                                              <SelectTrigger className="h-7 text-xs w-24">
                                                <SelectValue placeholder="Retain" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {getValidWithholdingAmounts(player.salary).map((amount) => (
                                                  <SelectItem key={amount} value={String(amount)}>
                                                    Retain ${(amount / 1000000).toFixed(2)}M
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Other Team */}
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="font-medium">
                                      {allTeams.find((team) => team.id === selectedTeamForTrade)?.name || "Other Team"}{" "}
                                      Players
                                    </h3>
                                    <Badge variant="outline">
                                      ${(otherTeamSalary / 1000000).toFixed(2)}M → $
                                      {(projectedOtherTeamSalary / 1000000).toFixed(2)}M
                                    </Badge>
                                  </div>
                                  <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                                    {selectedTeamPlayers.map((player) => (
                                      <div
                                        key={player.id}
                                        className={`p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer ${
                                          selectedOtherPlayers.includes(player.id) ? "bg-primary/10" : ""
                                        }`}
                                        onClick={() => {
                                          if (selectedOtherPlayers.includes(player.id)) {
                                            setSelectedOtherPlayers(
                                              selectedOtherPlayers.filter((id) => id !== player.id),
                                            )
                                          } else {
                                            setSelectedOtherPlayers([...selectedOtherPlayers, player.id])
                                          }
                                        }}
                                      >
                                        <div>
                                          <div className="font-medium">
                                            {player.users?.gamer_tag_id || "Unknown Player"}
                                          </div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-1">
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
                                        </div>
                                        <div className="text-right font-mono">
                                          ${(player.salary / 1000000).toFixed(2)}M
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Trade Validation */}
                              {(tradeError || tradeSuccess) && (
                                <div
                                  className={`p-3 rounded-md ${
                                    tradeError
                                      ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                      : "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  }`}
                                >
                                  {tradeError || tradeSuccess}
                                </div>
                              )}

                              {/* Submit Trade Button */}
                              <Button
                                className="w-full"
                                disabled={
                                  isSubmittingTrade ||
                                  (selectedMyPlayers.length === 0 && selectedOtherPlayers.length === 0) ||
                                  projectedTeamSalary > currentSalaryCap ||
                                  projectedOtherTeamSalary > currentSalaryCap
                                }
                                onClick={async () => {
                                  try {
                                    setIsSubmittingTrade(true)
                                    setTradeError(null)
                                    setTradeSuccess(null)

                                    // Validate trade
                                    if (selectedMyPlayers.length === 0 && selectedOtherPlayers.length === 0) {
                                      setTradeError("Please select at least one player to trade")
                                      return
                                    }

                                    if (projectedTeamSalary > currentSalaryCap) {
                                      setTradeError("This trade would put your team over the salary cap")
                                      return
                                    }

                                    if (projectedOtherTeamSalary > currentSalaryCap) {
                                      setTradeError("This trade would put the other team over the salary cap")
                                      return
                                    }

                                    // Get player details for the trade
                                    const myPlayersToTrade = teamPlayers.filter((p) => selectedMyPlayers.includes(p.id))
                                    const otherPlayersToReceive = selectedTeamPlayers.filter((p) =>
                                      selectedOtherPlayers.includes(p.id),
                                    )

                                    // Format player data for notification
                                    const fromPlayers = myPlayersToTrade.map((p) => ({
                                      id: p.id,
                                      name: p.users?.gamer_tag_id || "Unknown Player",
                                      position: p.users?.primary_position,
                                      salary: p.salary,
                                      withholding: capSpaceWithholding[p.id] || 0,
                                    }))

                                    const toPlayers = otherPlayersToReceive.map((p) => ({
                                      id: p.id,
                                      name: p.users?.gamer_tag_id || "Unknown Player",
                                      position: p.users?.primary_position,
                                      salary: p.salary,
                                    }))

                                    // Get other team's managers
                                    const { data: otherTeamManagers } = await supabase
                                      .from("players")
                                      .select("user_id")
                                      .eq("team_id", selectedTeamForTrade)
                                      .in("role", ["GM", "AGM", "Owner"])

                                    if (!otherTeamManagers || otherTeamManagers.length === 0) {
                                      setTradeError("Could not find managers for the selected team")
                                      return
                                    }

                                    // Get other team name
                                    const otherTeam = allTeams.find((team) => team.id === selectedTeamForTrade)
                                    if (!otherTeam) {
                                      setTradeError("Could not find the selected team")
                                      return
                                    }

                                    // Create trade data object
                                    const tradeData = {
                                      fromTeam: teamData.name,
                                      toTeam: otherTeam.name,
                                      fromPlayers,
                                      toPlayers,
                                      message: tradeMessage,
                                    }

                                    // Send notifications to other team's managers
                                    const notifications = otherTeamManagers.map((manager) => ({
                                      user_id: manager.user_id,
                                      title: `Trade Proposal from ${teamData.name}`,
                                      message: `${teamData.name} wants to trade ${fromPlayers.map((p) => p.name).join(", ") || "players"} for ${toPlayers.map((p) => p.name).join(", ") || "players"}. ${tradeMessage ? `Message: ${tradeMessage}` : ""}\n\nTRADE_DATA:${JSON.stringify(tradeData)}`,
                                      link: "/management?tab=trades",
                                      read: false,
                                    }))

                                    // Send notification to self for tracking
                                    const selfNotification = {
                                      user_id: session.user.id,
                                      title: `Trade Proposal to ${otherTeam.name}`,
                                      message: `You proposed to trade ${fromPlayers.map((p) => p.name).join(", ") || "players"} for ${toPlayers.map((p) => p.name).join(", ") || "players"}. Waiting for response.\n\nTRADE_DATA:${JSON.stringify(tradeData)}`,
                                      link: "/management?tab=trades",
                                      read: false,
                                    }

                                    // Insert all notifications
                                    const { error: notificationError } = await supabase
                                      .from("notifications")
                                      .insert([...notifications, selfNotification])

                                    if (notificationError) {
                                      throw notificationError
                                    }

                                    setTradeSuccess("Trade proposal sent successfully!")

                                    // Reset selections
                                    setSelectedMyPlayers([])
                                    setSelectedOtherPlayers([])
                                    setTradeMessage("")
                                    setCapSpaceWithholding({})

                                    // Refresh trade proposals
                                    await fetchTradeProposals(teamData.id, teamData.name)

                                    // Switch to outgoing tab
                                    const tabsElement = document.querySelector('[data-value="outgoing"]')
                                    if (tabsElement) {
                                      tabsElement.click()
                                    }
                                  } catch (error: any) {
                                    console.error("Error submitting trade:", error)
                                    setTradeError(`Failed to submit trade: ${error.message}`)
                                  } finally {
                                    setIsSubmittingTrade(false)
                                  }
                                }}
                              >
                                {isSubmittingTrade ? "Submitting..." : "Propose Trade"}
                              </Button>
                            </>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="incoming">
                        <div className="space-y-4">
                          {incomingTradeProposals.length > 0 ? (
                            incomingTradeProposals.map((proposal) => {
                              // Extract trade data from message
                              let tradeData = null
                              try {
                                const tradeDataMatch = proposal.message.match(/TRADE_DATA:(.+)$/)
                                if (tradeDataMatch) {
                                  tradeData = JSON.parse(tradeDataMatch[1])
                                }
                              } catch (e) {
                                console.error("Failed to parse trade data:", e)
                              }

                              return (
                                <Card key={proposal.id} className="overflow-hidden">
                                  <CardHeader className="bg-muted/50 pb-3">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-lg">
                                        Trade from {tradeData?.fromTeam || "Unknown Team"}
                                      </CardTitle>
                                      <CardDescription>
                                        {new Date(proposal.created_at).toLocaleDateString()} at{" "}
                                        {new Date(proposal.created_at).toLocaleTimeString()}
                                      </CardDescription>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                      {/* They Offer - Fixed: Show fromPlayers (what they're giving up) */}
                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">They Offer:</h3>
                                        {tradeData?.fromPlayers && tradeData.fromPlayers.length > 0 ? (
                                          <ul className="space-y-2">
                                            {tradeData.fromPlayers.map((player: any, index: number) => (
                                              <li key={index} className="flex justify-between items-center">
                                                <span>{player.name}</span>
                                                <div className="text-sm text-muted-foreground">
                                                  <span>${(player.salary / 1000000).toFixed(2)}M</span>
                                                  {player.withholding > 0 && (
                                                    <span className="ml-1 text-orange-600">
                                                      (Retain ${(player.withholding / 1000000).toFixed(2)}M)
                                                    </span>
                                                  )}
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-muted-foreground">No players</p>
                                        )}
                                      </div>

                                      {/* Trade Arrow */}
                                      <div className="md:col-span-1 flex justify-center">
                                        <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                                      </div>

                                      {/* They Want - Fixed: Show toPlayers (what they want from us) */}
                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">They Want:</h3>
                                        {tradeData?.toPlayers && tradeData.toPlayers.length > 0 ? (
                                          <ul className="space-y-2">
                                            {tradeData.toPlayers.map((player: any, index: number) => (
                                              <li key={index} className="flex justify-between items-center">
                                                <span>{player.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                  ${(player.salary / 1000000).toFixed(2)}M
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-muted-foreground">No players</p>
                                        )}
                                      </div>
                                    </div>

                                    {tradeData?.message && (
                                      <div className="mt-4 p-3 bg-muted rounded-md">
                                        <h4 className="font-medium mb-1">Message:</h4>
                                        <p className="text-sm">{tradeData.message}</p>
                                      </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                      <Button
                                        onClick={() => handleTradeResponse(proposal.id, true)}
                                        disabled={isProcessingTradeResponse}
                                        className="flex-1"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Accept Trade
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleTradeResponse(proposal.id, false)}
                                        disabled={isProcessingTradeResponse}
                                        className="flex-1"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject Trade
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">No incoming trade proposals</div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="outgoing">
                        <div className="space-y-4">
                          {outgoingTradeProposals.length > 0 ? (
                            outgoingTradeProposals.map((proposal) => {
                              // Extract trade data from message
                              let tradeData = null
                              try {
                                const tradeDataMatch = proposal.message.match(/TRADE_DATA:(.+)$/)
                                if (tradeDataMatch) {
                                  tradeData = JSON.parse(tradeDataMatch[1])
                                }
                              } catch (e) {
                                console.error("Failed to parse trade data:", e)
                              }

                              const isCancelling = cancellingTrades.has(proposal.id)

                              return (
                                <Card key={proposal.id} className="overflow-hidden">
                                  <CardHeader className="bg-muted/50 pb-3">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-lg">
                                        Trade to {tradeData?.toTeam || "Unknown Team"}
                                      </CardTitle>
                                      <CardDescription>
                                        {new Date(proposal.created_at).toLocaleDateString()} at{" "}
                                        {new Date(proposal.created_at).toLocaleTimeString()}
                                      </CardDescription>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                      {/* You Offer */}
                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">You Offer:</h3>
                                        {tradeData?.fromPlayers && tradeData.fromPlayers.length > 0 ? (
                                          <ul className="space-y-2">
                                            {tradeData.fromPlayers.map((player: any, index: number) => (
                                              <li key={index} className="flex justify-between items-center">
                                                <span>{player.name}</span>
                                                <div className="text-sm text-muted-foreground">
                                                  <span>${(player.salary / 1000000).toFixed(2)}M</span>
                                                  {player.withholding > 0 && (
                                                    <span className="ml-1 text-orange-600">
                                                      (Retain ${(player.withholding / 1000000).toFixed(2)}M)
                                                    </span>
                                                  )}
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-muted-foreground">No players</p>
                                        )}
                                      </div>

                                      {/* Trade Arrow */}
                                      <div className="md:col-span-1 flex justify-center">
                                        <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                                      </div>

                                      {/* You Want */}
                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">You Want:</h3>
                                        {tradeData?.toPlayers && tradeData.toPlayers.length > 0 ? (
                                          <ul className="space-y-2">
                                            {tradeData.toPlayers.map((player: any, index: number) => (
                                              <li key={index} className="flex justify-between items-center">
                                                <span>{player.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                  ${(player.salary / 1000000).toFixed(2)}M
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-muted-foreground">No players</p>
                                        )}
                                      </div>
                                    </div>

                                    {tradeData?.message && (
                                      <div className="mt-4 p-3 bg-muted rounded-md">
                                        <h4 className="font-medium mb-1">Message:</h4>
                                        <p className="text-sm">{tradeData.message}</p>
                                      </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                      <Button
                                        variant="destructive"
                                        onClick={async () => {
                                          try {
                                            setCancellingTrades((prev) => new Set(prev).add(proposal.id))

                                            // Extract trade data to find the other team
                                            const otherTeamName = tradeData?.toTeam
                                            if (!otherTeamName) {
                                              throw new Error("Could not determine other team")
                                            }

                                            // Find the other team's ID
                                            const otherTeam = allTeams.find((team) => team.name === otherTeamName)
                                            if (!otherTeam) {
                                              throw new Error("Could not find other team")
                                            }

                                            // Get other team's managers
                                            const { data: otherTeamManagers, error: managersError } = await supabase
                                              .from("players")
                                              .select("user_id")
                                              .eq("team_id", otherTeam.id)
                                              .in("role", ["GM", "AGM", "Owner"])

                                            if (managersError) {
                                              console.error("Error fetching other team managers:", managersError)
                                              throw managersError
                                            }

                                            // Mark the outgoing notification as cancelled
                                            const { error: updateError } = await supabase
                                              .from("notifications")
                                              .update({
                                                message: proposal.message + "\n\nSTATUS: CANCELLED",
                                              })
                                              .eq("id", proposal.id)

                                            if (updateError) {
                                              console.error("Error updating outgoing notification:", updateError)
                                              throw updateError
                                            }

                                            // Update corresponding incoming notifications for the other team
                                            if (otherTeamManagers && otherTeamManagers.length > 0) {
                                              const { error: incomingUpdateError } = await supabase
                                                .from("notifications")
                                                .update({
                                                  message: supabase.raw(`message || '\n\nSTATUS: CANCELLED'`),
                                                })
                                                .in(
                                                  "user_id",
                                                  otherTeamManagers.map((m) => m.user_id),
                                                )
                                                .like("title", `Trade Proposal from ${teamData.name}`)
                                                .gte(
                                                  "created_at",
                                                  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                                                ) // Only recent proposals

                                              if (incomingUpdateError) {
                                                console.error(
                                                  "Error updating incoming notifications:",
                                                  incomingUpdateError,
                                                )
                                                // Don't throw here - the outgoing cancellation still worked
                                              }
                                            }

                                            toast({
                                              title: "Trade Cancelled",
                                              description: "Your trade proposal has been cancelled.",
                                            })

                                            // Refresh trade proposals
                                            await fetchTradeProposals(teamData.id, teamData.name)
                                          } catch (error: any) {
                                            console.error("Error cancelling trade:", error)
                                            toast({
                                              title: "Error",
                                              description: "Failed to cancel trade: " + error.message,
                                              variant: "destructive",
                                            })
                                          } finally {
                                            setCancellingTrades((prev) => {
                                              const newSet = new Set(prev)
                                              newSet.delete(proposal.id)
                                              return newSet
                                            })
                                          }
                                        }}
                                        disabled={isCancelling}
                                        className="flex-1"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {isCancelling ? "Cancelling..." : "Cancel Trade"}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">No outgoing trade proposals</div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
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
            // Refresh bids and free agents
            fetchPlayerBids()
            fetchData()
          }}
          teamData={teamData}
          currentBid={playerBids[selectedPlayer.id]}
          projectedSalary={projectedSalary}
          salaryCap={currentSalaryCap}
          projectedRosterSize={projectedRosterSize}
        />
      )}
    </div>
  )
}

export default ManagementPage
