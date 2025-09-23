// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, Trophy, DollarSign, Filter, History, Search, ArrowLeftRight } from "lucide-react"
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

  // Add these state variables after the existing useState declarations
  const [projectedSalary, setProjectedSalary] = useState(0)
  const [projectedRosterSize, setProjectedRosterSize] = useState(0)
  const [currentSalaryCap, setCurrentSalaryCap] = useState(65000000) // $65M salary cap
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(true)

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
      console.log('No session found, redirecting to login')
      router.push('/login?message=You must be logged in to access team management&redirect=/management')
      return
    }

    setLoading(true)
    try {
      console.log('Checking team manager access for user:', session.user.id)
      
      // Check for any manager role using in operator
      const { data: playerRoles, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', session.user.id)
        .in('role', ['GM', 'AGM', 'Owner', 'owner'])
      
      // Check for admin roles in user_roles table
      const { data: adminRoles, error: adminError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["Admin", "Super Admin"])
      
      // Log the results for debugging
      console.log('Role check results:', {
        userId: session.user.id,
        playerRoles,
        playerError,
        adminRoles,
        adminError
      })
      
      // Check if user has any manager or admin roles
      const isManager = !!playerRoles?.length
      const isAdmin = !!adminRoles?.length
      const hasAccess = isManager || isAdmin
      
      // Get the first team ID if user is a manager
      const playerData = playerRoles?.[0]
      
      // Update the authorization state
      setIsAuthorized(hasAccess)

      // If no access, redirect to unauthorized
      if (!hasAccess) {
        const errorMsg = "You must be a team manager (GM, AGM, or Owner) to access this page"
        console.log(errorMsg)
        // Clear any existing team data since user is no longer authorized
        setTeamData(null)
        setTeamPlayers([])
        setMyBids([])
        setWaivers([])
        
        // Use replace instead of push to prevent going back to the management page
        router.replace('/unauthorized?message=' + encodeURIComponent(errorMsg))
        return
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
      console.log("Request data:", { 
        action: 'waive',
        playerId,
        teamId: teamData.id
      })

      const response = await fetch("/api/waivers/working", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use the fresh session access token
          Authorization: `Bearer ${freshSession.access_token}`,
        },
        body: JSON.stringify({ 
          action: 'waive',
          playerId,
          teamId: teamData.id
        }),
      })

      console.log("Waiver response status:", response.status)

      let data
      if (!response.ok) {
        try {
          data = await response.json()
          console.error("Error response:", data)
          throw new Error(data.error || `Server error: ${response.status}`)
        } catch (jsonError) {
          console.error("Error parsing response:", jsonError)
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      } else {
        data = await response.json()
      }
      console.log("Waiver response data:", data)


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

      let data
      if (!response.ok) {
        try {
          data = await response.json()
          console.error("Error response:", data)
          throw new Error(data.error || `Server error: ${response.status}`)
        } catch (jsonError) {
          console.error("Error parsing response:", jsonError)
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      } else {
        data = await response.json()
      }
      console.log("Claim response data:", data)

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

      let data
      if (!response.ok) {
        data = await response.json()
        console.error("Trade response error:", data)
        throw new Error(data.error || `Failed to ${accept ? "accept" : "reject"} trade`)
      } else {
        data = await response.json()
      }
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/20 flex items-center justify-center p-6">
        <Card className="hockey-card w-full max-w-lg">
          <CardHeader className="text-center pb-6">
            <div className="hockey-icon-container-red mx-auto mb-6 w-fit">
              <XCircle className="h-12 w-12 text-white" />
        </div>
            <CardTitle className="hockey-gradient-text-red text-3xl font-black mb-4">Access Denied</CardTitle>
            <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
              You must be a Team Manager (GM, AGM, or Owner) to access the management panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="hockey-button w-full">
              <Link href="/" className="flex items-center gap-3">
                <Home className="h-5 w-5" />
                Return to Home
              </Link>
        </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Enhanced Hockey-Themed Header */}
          <div className="hockey-header p-8 mb-8 rounded-3xl">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="hockey-icon-container">
                <Gavel className="h-12 w-12 text-white" />
                  </div>
              <div className="text-center md:text-left">
                <h1 className="hockey-title mb-4">Team Management</h1>
            {teamData && (
                    <div className="flex items-center justify-center md:justify-start gap-3">
                {teamData.logo_url && (
                  <Image
                    src={teamData.logo_url || "/placeholder.svg"}
                    alt={teamData.name}
                            width={32}
                            height={32}
                        className="rounded-full shadow-lg"
                          />
                      )}
                    <p className="hockey-subtitle">
                {teamData.name}
              </p>
                    </div>
            )}
                </div>
              </div>
            <div className="hockey-divider" />
        </div>

        {loading ? (
          <div className="grid gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        ) : (
          <>
          {/* Enhanced Hockey-Themed Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hockey-card p-6 text-center hover:scale-105 transition-all duration-300"
            >
              <div className="hockey-icon-container mx-auto mb-4 w-16 h-16">
                <Users className="h-8 w-8 text-white" />
                  </div>
              <div className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                      {teamPlayers.length}
                      {projectedRosterSize !== teamPlayers.length && (
                  <span className="text-lg text-ice-blue-500 ml-1">â†’ {projectedRosterSize}</span>
                      )}
                    </div>
              <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-1">Team Size</div>
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Current roster</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hockey-card p-6 text-center hover:scale-105 transition-all duration-300"
            >
              <div className="hockey-icon-container-indigo mx-auto mb-4 w-16 h-16">
                <Calendar className="h-8 w-8 text-white" />
                  </div>
              <div className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                      {teamMatches.filter((m) => m.status === "Scheduled").length}
                    </div>
              <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-1">Upcoming Matches</div>
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Scheduled games</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hockey-card p-6 text-center hover:scale-105 transition-all duration-300"
            >
              <div className="hockey-icon-container-red mx-auto mb-4 w-16 h-16">
                <Trophy className="h-8 w-8 text-white" />
                  </div>
              <div className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                      {teamData ? `${teamData.wins}-${teamData.losses}-${teamData.otl}` : "0-0-0"}
                    </div>
              <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-1">Record</div>
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Season record</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="hockey-card p-6 text-center hover:scale-105 transition-all duration-300"
            >
              <div className="hockey-icon-container-emerald mx-auto mb-4 w-16 h-16">
                <DollarSign className="h-8 w-8 text-white" />
                  </div>
              <div className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                      ${(currentTeamSalary / 1000000).toFixed(1)}M
                      {projectedSalary !== currentTeamSalary && (
                  <span className="text-lg text-assist-green-500 ml-1">
                          â†’ ${(projectedSalary / 1000000).toFixed(1)}M
                        </span>
                      )}
                    </div>
              <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-1">Salary Cap</div>
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Current usage</div>
            </motion.div>
            </div>

          {/* Clean Professional Tabs */}
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-8 h-12 bg-hockey-silver-800 dark:bg-hockey-silver-900 rounded-lg p-1">
              <TabsTrigger 
                value="roster" 
                className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
              >
                <span className="hidden md:inline">Team Roster</span>
                <span className="md:hidden">Roster</span>
              </TabsTrigger>
              <TabsTrigger 
                value="availability" 
                className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
              >
                <span className="hidden md:inline">Team Avail</span>
                <span className="md:hidden">Avail</span>
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
              >
                <span className="hidden md:inline">Team Schedule</span>
                <span className="md:hidden">Schedule</span>
              </TabsTrigger>
              <TabsTrigger 
                value="free-agents" 
                className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
              >
                <span className="hidden md:inline">Free Agents</span>
                <span className="md:hidden">Free Agents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="my-bids" 
                className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
              >
                <span className="hidden md:inline">My Bids</span>
                <span className="md:hidden">Bids</span>
              </TabsTrigger>
            </TabsList>

              {/* Roster Tab Content */}
              <TabsContent value="roster">
                <Card className="hockey-card">
                  <CardHeader className="text-center pb-6">
                    <div className="hockey-icon-container mx-auto mb-4 w-fit">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="hockey-gradient-text text-2xl md:text-3xl font-black mb-2">Team Roster</CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      Manage your team's players and roles
                    </CardDescription>
                    <div className="hockey-divider mt-4" />
                  </CardHeader>
                  <CardContent>
                    {teamPlayers.length > 0 ? (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden md:block rounded-xl border border-ice-blue-200 dark:border-ice-blue-700 overflow-x-auto hockey-scrollbar-enhanced">
                          <Table className="hockey-standings-table">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Player</TableHead>
                                <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Position</TableHead>
                                <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Role</TableHead>
                                <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Console</TableHead>
                                <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Salary</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teamPlayers.map((player) => (
                                <TableRow key={player.id} className="hockey-table-row-hover">
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
                        <div className="md:hidden space-y-4">
                          {teamPlayers.map((player) => (
                            <div key={player.id} className="hockey-card p-6 hover:scale-105 transition-all duration-300">
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
                      <div className="text-center py-12">
                        <div className="hockey-icon-container mx-auto mb-4 w-fit">
                          <Users className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-2">No Players Found</h3>
                        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">No players are currently on this team.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Availability Tab Content */}
              <TabsContent value="availability">
                <Card className="hockey-card">
                  <CardHeader className="text-center pb-6">
                    <div className="hockey-icon-container-indigo mx-auto mb-4 w-fit">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="hockey-gradient-text text-2xl md:text-3xl font-black mb-2">Team Availability</CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      View your team's availability for upcoming games
                    </CardDescription>
                    <div className="hockey-divider mt-4" />
                  </CardHeader>
                  <CardContent>
                    {teamData ? (
                      <TeamAvailabilityTab teamId={teamData.id} teamName={teamData.name} />
                    ) : (
                      <div className="text-center py-12">
                        <div className="hockey-icon-container mx-auto mb-4 w-fit">
                          <Calendar className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-2">Loading Team Data</h3>
                        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Please wait while we load your team information...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab Content */}
              <TabsContent value="schedule">
                <Card className="hockey-card">
                  <CardHeader className="text-center pb-6">
                    <div className="hockey-icon-container-red mx-auto mb-4 w-fit">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="hockey-gradient-text text-2xl md:text-3xl font-black mb-2">Team Schedule</CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      Upcoming and recent matches for {teamData?.name}
                    </CardDescription>
                    <div className="hockey-divider mt-4" />
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
                              className="hockey-card p-6 hover:scale-105 transition-all duration-300"
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
                <Card className="hockey-card">
                  <CardHeader className="text-center pb-6">
                    <div className="hockey-icon-container-emerald mx-auto mb-4 w-fit">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="hockey-gradient-text text-2xl md:text-3xl font-black mb-2">Free Agents</CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      Available players for bidding. {!isBiddingEnabled && "Bidding is currently disabled."}
                    </CardDescription>
                    <div className="hockey-divider mt-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                      {/* Team Salary */}
                      <Card className="hockey-card">
                        <CardContent className="p-4 text-center">
                          <div className="hockey-icon-container-emerald mx-auto mb-3 w-fit">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold mb-3">Team Salary</h3>
                          <SalaryProgress
                            current={currentTeamSalary}
                            max={currentSalaryCap}
                            projected={projectedSalary}
                          />
                        </CardContent>
                      </Card>

                      {/* Roster Size */}
                      <Card className="hockey-card">
                        <CardContent className="p-4 text-center">
                          <div className="hockey-icon-container mx-auto mb-3 w-fit">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold mb-3">Roster Size</h3>
                          <RosterProgress current={teamPlayers.length} max={15} projected={projectedRosterSize} />
                        </CardContent>
                      </Card>

                      {/* Position Breakdown */}
                      <Card className="hockey-card">
                        <CardContent className="p-4 text-center">
                          <div className="hockey-icon-container-indigo mx-auto mb-3 w-fit">
                            <Trophy className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold mb-3">
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
                                    <span className="text-ice-blue-500 font-medium">RW:</span>
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
                                className="border border-ice-blue-200 dark:border-ice-blue-700 rounded-lg p-3 md:p-4 shadow-sm"
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
                                      {player.users?.console} â€¢ ${(player.salary / 1000000).toFixed(2)}M
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
                <Card className="hockey-card">
                  <CardHeader className="text-center pb-6">
                    <div className="hockey-icon-container-emerald mx-auto mb-4 w-fit">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="hockey-gradient-text text-2xl md:text-3xl font-black mb-2">My Bids</CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      Bids placed by {teamData?.name}. Active: {activeBidsCount} | Outbid: {outbidCount}
                    </CardDescription>
                    <div className="hockey-divider mt-4" />
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


            </Tabs>
          </>
        )}
      </motion.div>
      </div>
