"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"

import {
  ArrowLeftRight,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  History,
  Search,
  Trophy,
  Users,
  XCircle,
  CheckCircle2,
} from "lucide-react"

import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { WaiverPriorityDisplay } from "@/components/management/waiver-priority-display"
import { SalaryProgress } from "@/components/management/salary-progress"
import { RosterProgress } from "@/components/management/roster-progress"
import { TeamAvailabilityTab } from "@/components/management/team-availability-tab"
import { TeamLogos } from "@/components/management/team-logos"
import { BidPlayerModal } from "@/components/management/bid-player-modal"

import { getTeamStats, getCurrentSeasonId } from "@/lib/team-utils"

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
  const trimmed = position.trim().toLowerCase()
  const map: Record<string, string> = {
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
  return map[trimmed] || position.toUpperCase()
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
  const [isAuthorized, setIsAuthorized] = useState(false)

  const [teamData, setTeamData] = useState<Team | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [teamMatches, setTeamMatches] = useState<any[]>([])

  const [now, setNow] = useState(new Date())

  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "roster")

  // Free agents
  const [freeAgents, setFreeAgents] = useState<any[]>([])
  const [filteredFreeAgents, setFilteredFreeAgents] = useState<any[]>([])
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState<string>("")
  const [freeAgentsError, setFreeAgentsError] = useState<string | null>(null)
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(false)

  // Bids
  const [playerBids, setPlayerBids] = useState<Record<string, any>>({})
  const [myBids, setMyBids] = useState<any[]>([])
  const [activeBidsCount, setActiveBidsCount] = useState(0)
  const [outbidCount, setOutbidCount] = useState(0)
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(true)

  // Modal
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyPlayer, setHistoryPlayer] = useState<any>(null)

  // Salary / roster projections
  const [currentSalaryCap, setCurrentSalaryCap] = useState(65000000)
  const [currentTeamSalary, setCurrentTeamSalary] = useState(0)
  const [projectedSalary, setProjectedSalary] = useState(0)
  const [projectedRosterSize, setProjectedRosterSize] = useState(0)

  // Trade
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [selectedTeamForTrade, setSelectedTeamForTrade] = useState<string | null>(null)
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState<any[]>([])
  const [selectedMyPlayers, setSelectedMyPlayers] = useState<any[]>([])
  const [selectedOtherPlayers, setSelectedOtherPlayers] = useState<any[]>([])
  const [tradeError, setTradeError] = useState<string | null>(null)
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null)
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false)
  const [tradeMessage, setTradeMessage] = useState("")
  const [currentTeamSalaryTrade, setCurrentTeamSalaryTrade] = useState(0)
  const [projectedTeamSalary, setProjectedTeamSalary] = useState(0)
  const [otherTeamSalary, setOtherTeamSalary] = useState(0)
  const [projectedOtherTeamSalary, setProjectedOtherTeamSalary] = useState(0)
  const [capSpaceWithholding, setCapSpaceWithholding] = useState<{ [playerId: string]: number }>({})

  // Trade proposals
  const [incomingTradeProposals, setIncomingTradeProposals] = useState<any[]>([])
  const [outgoingTradeProposals, setOutgoingTradeProposals] = useState<any[]>([])
  const [isProcessingTradeResponse, setIsProcessingTradeResponse] = useState(false)
  const [cancellingTrades, setCancellingTrades] = useState<Set<string>>(new Set())

  // Waivers
  const [waivers, setWaivers] = useState<any[]>([])
  const [loadingWaivers, setLoadingWaivers] = useState(false)
  const [waiverError, setWaiverError] = useState<string | null>(null)
  const [waivingPlayers, setWaivingPlayers] = useState<Set<string>>(new Set())
  const [claimingWaivers, setClaimingWaivers] = useState<Set<string>>(new Set())

  // tick time
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // filters
  useEffect(() => {
    let filtered = freeAgents

    if (nameFilter.trim() !== "") {
      const term = nameFilter.toLowerCase().trim()
      filtered = filtered.filter((p) => p.users?.gamer_tag_id?.toLowerCase().includes(term))
    }

    if (positionFilter !== "all") {
      filtered = filtered.filter((p) => {
        const primary = getPositionAbbreviation(p.season_registrations?.[0]?.primary_position || "UNKNOWN")
        const secondary = getPositionAbbreviation(p.season_registrations?.[0]?.secondary_position || "")
        const filterPos = getPositionAbbreviation(positionFilter)
        return primary === filterPos || secondary === filterPos
      })
    }

    setFilteredFreeAgents(filtered)
  }, [positionFilter, nameFilter, freeAgents])

  const formatTimeRemaining = (expiresAt: string): string => {
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    if (diff <= 0) return "Expired"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    try {
      router.push(`/management?tab=${value}`, { scroll: false })
    } catch {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", value)
        window.history.replaceState({}, "", url.toString())
      }
    }
  }

  const getValidWithholdingAmounts = (playerSalary: number): number[] => {
    const maxWithholding = Math.floor((playerSalary * 0.25) / 250000) * 250000
    const amounts: number[] = []
    for (let i = 0; i <= maxWithholding; i += 250000) {
      if (playerSalary - i >= 750000) amounts.push(i)
    }
    return amounts
  }

  // bidding status
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch("/api/bidding/status")
        const d = await r.json()
        setIsBiddingEnabled(Boolean(d.enabled))
      } catch {
        setIsBiddingEnabled(false)
      }
    }
    check()
  }, [])

  const activeWinningBids = useMemo(() => {
    return myBids.filter((b) => b.isHighestBidder && !b.isExpired)
  }, [myBids])

  const activeWinningBidTotal = useMemo(() => {
    return activeWinningBids.reduce((sum, b) => sum + (b.bid_amount || 0), 0)
  }, [activeWinningBids])

  // projections (based on winning active bids)
  useEffect(() => {
    if (!teamData) {
      setProjectedSalary(currentTeamSalary)
      setProjectedRosterSize(teamPlayers.length)
      return
    }

    const projectedSalaryIncrease = activeWinningBids.reduce((sum, bid) => sum + bid.bid_amount, 0)
    const projectedRosterIncrease = activeWinningBids.length

    setProjectedSalary(currentTeamSalary + projectedSalaryIncrease)
    setProjectedRosterSize(teamPlayers.length + projectedRosterIncrease)
  }, [activeWinningBids, currentTeamSalary, teamPlayers.length, teamData])

  // Trade projected salaries
  useEffect(() => {
    if (!selectedTeamForTrade || !teamData) {
      setProjectedTeamSalary(currentTeamSalaryTrade)
      setProjectedOtherTeamSalary(otherTeamSalary)
      return
    }

    const myPlayersToTrade = teamPlayers.filter((p) => selectedMyPlayers.includes(p.id))
    const otherPlayersToReceive = selectedTeamPlayers.filter((p) => selectedOtherPlayers.includes(p.id))

    const myOut = myPlayersToTrade.reduce((sum, p) => {
      const withholding = capSpaceWithholding[p.id] || 0
      return sum + (p.salary - withholding)
    }, 0)

    const myIn = otherPlayersToReceive.reduce((sum, p) => sum + (p.salary || 0), 0)
    setProjectedTeamSalary(currentTeamSalaryTrade - myOut + myIn)

    const otherOut = otherPlayersToReceive.reduce((sum, p) => sum + (p.salary || 0), 0)
    const otherIn = myPlayersToTrade.reduce((sum, p) => {
      const withholding = capSpaceWithholding[p.id] || 0
      return sum + (p.salary - withholding)
    }, 0)

    setProjectedOtherTeamSalary(otherTeamSalary - otherOut + otherIn)
  }, [
    selectedTeamForTrade,
    teamData,
    selectedMyPlayers,
    selectedOtherPlayers,
    teamPlayers,
    selectedTeamPlayers,
    currentTeamSalaryTrade,
    otherTeamSalary,
    capSpaceWithholding,
  ])
  
  const fetchTradeProposals = async (teamId: string, teamName: string) => {
    try {
      const { data: incoming, error: incomingError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session?.user.id)
        .like("title", "Trade Proposal from %")
        .not("message", "like", "%STATUS:%")
        .order("created_at", { ascending: false })

      if (!incomingError) setIncomingTradeProposals(incoming || [])

      const { data: outgoing, error: outgoingError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session?.user.id)
        .like("title", "Trade Proposal to %")
        .not("message", "like", "%STATUS:%")
        .order("created_at", { ascending: false })

      if (!outgoingError) setOutgoingTradeProposals(outgoing || [])
    } catch (e) {
      console.error("Error fetching trade proposals:", e)
    }
  }

  // Fetch current bids (highest bid per player)
  const fetchPlayerBids = async () => {
    try {
      const { data: bids, error } = await supabase
        .from("player_bidding")
        .select("*, teams:team_id ( id, name, logo_url )")
        .order("bid_amount", { ascending: false })

      if (error) throw error

      const highest: Record<string, any> = {}
      bids?.forEach((bid: any) => {
        if (!highest[bid.player_id] || bid.bid_amount > highest[bid.player_id].bid_amount) {
          highest[bid.player_id] = bid
        }
      })

      setPlayerBids(highest)
    } catch (e) {
      console.log("Error fetching player bids:", e)
    }
  }

  const loadFreeAgents = async () => {
    setFreeAgentsLoading(true)
    setFreeAgentsError(null)

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

      const response = await fetch("/api/free-agents", { method: "GET", headers })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Failed to fetch free agents: ${response.status}`)
      }

      const data = await response.json()
      const list = data.freeAgents || []
      setFreeAgents(list)
      setFilteredFreeAgents(list)

      await fetchPlayerBids()
    } catch (error: any) {
      console.error("Error loading free agents:", error)
      setFreeAgentsError("Failed to load free agents: " + (error?.message || "Unknown error"))
      toast({
        title: "Error",
        description: "Failed to load free agents: " + (error?.message || "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setFreeAgentsLoading(false)
    }
  }

  const loadWaiversData = async () => {
    setLoadingWaivers(true)
    setWaiverError(null)

    try {
      // process expired (don’t hard-fail the whole tab)
      try {
        const processResponse = await fetch("/api/waivers/check-expired", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (processResponse.ok) {
          const processResult = await processResponse.json()
          if (processResult?.expiredCount > 0) {
            toast({
              title: "Waivers Processed",
              description: `${processResult.expiredCount} expired waivers have been processed.`,
            })
          }
        }
      } catch (e) {
        console.warn("Waiver expired processing failed (continuing):", e)
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

      const response = await fetch("/api/waivers?status=active", { method: "GET", headers })
      if (!response.ok) throw new Error(`Failed to fetch waivers: ${response.status}`)

      const data = await response.json()
      const raw = data.waivers || []

      const nowLocal = new Date()
      const filtered = raw.filter((w: any) => new Date(w.claim_deadline) > nowLocal)

      const teamId = teamData?.id
      const withClaimFlag = await Promise.all(
        filtered.map(async (waiver: any) => {
          if (!teamId) return { ...waiver, hasTeamClaimed: false }

          const { data: teamClaim } = await supabase
            .from("waiver_claims")
            .select("id")
            .eq("waiver_id", waiver.id)
            .eq("claiming_team_id", teamId)
            .eq("status", "pending")
            .maybeSingle()

          return { ...waiver, hasTeamClaimed: Boolean(teamClaim) }
        }),
      )

      setWaivers(withClaimFlag)
    } catch (error: any) {
      console.error("Error loading waivers:", error)
      setWaiverError(error?.message || "Failed to load waivers")
    } finally {
      setLoadingWaivers(false)
    }
  }

  const handleWaivePlayerAction = async (playerId: string) => {
    if (waivingPlayers.has(playerId)) return

    try {
      setWaivingPlayers((prev) => new Set(prev).add(playerId))

      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !freshSession?.access_token) throw new Error("Authentication session expired. Refresh the page.")

      const response = await fetch("/api/waivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshSession.access_token}`,
        },
        body: JSON.stringify({ playerId }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to waive player")

      toast({ title: "Player waived", description: "Player has been placed on waivers for 8 hours." })

      await fetchData()
      await loadWaiversData()
      handleTabChange("waivers")
    } catch (error: any) {
      console.error("Error waiving player:", error)
      toast({ title: "Error waiving player", description: error.message, variant: "destructive" })
    } finally {
      setWaivingPlayers((prev) => {
        const s = new Set(prev)
        s.delete(playerId)
        return s
      })
    }
  }

  const handleClaimPlayer = async (waiverId: string) => {
    if (claimingWaivers.has(waiverId)) return

    try {
      setClaimingWaivers((prev) => new Set(prev).add(waiverId))

      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !freshSession?.access_token) throw new Error("Authentication session expired. Refresh the page.")
      if (!teamData?.id) throw new Error("No team data found")

      const response = await fetch("/api/waivers/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshSession.access_token}`,
        },
        body: JSON.stringify({ waiverId, teamId: teamData.id }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to claim waiver")

      toast({
        title: "Claim submitted",
        description: "Your waiver claim has been submitted. You'll be notified when the waiver period ends.",
      })

      await loadWaiversData()
    } catch (error: any) {
      console.error("Error claiming player:", error)
      toast({ title: "Error claiming player", description: error.message, variant: "destructive" })
    } finally {
      setClaimingWaivers((prev) => {
        const s = new Set(prev)
        s.delete(waiverId)
        return s
      })
    }
  }

  const fetchData = async () => {
    if (!session?.user) {
      setIsAuthorized(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
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

      const currentSeasonId = await getCurrentSeasonId()
      const calculated = await getTeamStats(playerData.team_id, currentSeasonId)
      if (!calculated) throw new Error("Could not calculate team statistics")

      const { data: basicTeamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", playerData.team_id)
        .single()

      if (teamError) throw teamError

      const teamWithStats: Team = {
        ...basicTeamData,
        wins: calculated.wins,
        losses: calculated.losses,
        otl: calculated.otl,
        points: calculated.points,
        games_played: calculated.games_played,
        goals_for: calculated.goals_for,
        goals_against: calculated.goals_against,
        goal_differential: calculated.goal_differential,
      }

      setTeamData(teamWithStats)

      await fetchTradeProposals(playerData.team_id, basicTeamData.name)

      // team players (keep your existing join)
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select(
          `
          id,
          role,
          salary,
          user_id,
          users!inner (
            id,
            email,
            gamer_tag_id,
            console,
            avatar_url
          ),
          season_registrations (
            primary_position,
            secondary_position
          )
        `,
        )
        .eq("team_id", playerData.team_id)
        .order("role", { ascending: false })

      if (playersError) throw playersError
      setTeamPlayers(players || [])

      const teamSalary = (players || []).reduce((sum: number, p: any) => sum + (p.salary || 0), 0)
      setCurrentTeamSalary(teamSalary)
      setProjectedSalary(teamSalary)

      setCurrentTeamSalaryTrade(teamSalary)
      setProjectedTeamSalary(teamSalary)

      // teams list for trade
      const { data: allTeamsData } = await supabase
        .from("teams")
        .select("*")
        .neq("id", playerData.team_id)
        .order("name", { ascending: true })

      setAllTeams(allTeamsData || [])

      // matches
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(
          `
          *,
          home_team:home_team_id(id, name, logo_url),
          away_team:away_team_id(id, name, logo_url)
        `,
        )
        .or(`home_team_id.eq.${playerData.team_id},away_team_id.eq.${playerData.team_id}`)
        .order("match_date", { ascending: true })

      if (matchesError) throw matchesError
      setTeamMatches(matches || [])

      // my bids
      const { data: myTeamBids, error: bidsError } = await supabase
        .from("player_bidding")
        .select(
          `
          id,
          player_id,
          team_id,
          bid_amount,
          bid_expires_at,
          players:player_id (
            id,
            salary,
            users (
              id,
              gamer_tag_id,
              console,
              avatar_url
            ),
            season_registrations (
              primary_position,
              secondary_position
            )
          )
        `,
        )
        .eq("team_id", playerData.team_id)
        .order("bid_expires_at", { ascending: true })

      if (bidsError) {
        console.error("Error fetching team bids:", bidsError)
      } else {
        const { data: allBids } = await supabase.from("player_bidding").select("*, teams:team_id ( id, name, logo_url )")

        const highestByPlayer: Record<string, any> = {}
        ;(allBids || []).forEach((bid: any) => {
          if (!highestByPlayer[bid.player_id] || bid.bid_amount > highestByPlayer[bid.player_id].bid_amount) {
            highestByPlayer[bid.player_id] = bid
          }
        })

        const enhanced =
          (myTeamBids || []).map((bid: any) => {
            const highestBid = highestByPlayer[bid.player_id]
            const isHighestBidder = highestBid && highestBid.id === bid.id
            const isExpired = new Date(bid.bid_expires_at) <= now
            return {
              ...bid,
              isHighestBidder,
              highestBid: !isHighestBidder ? highestBid : null,
              isExpired,
              status: isExpired ? (isHighestBidder ? "won" : "lost") : isHighestBidder ? "winning" : "outbid",
            }
          }) || []

        setMyBids(enhanced)

        const activeWinning = enhanced.filter((b: any) => !b.isExpired && b.isHighestBidder)
        const activeOutbid = enhanced.filter((b: any) => !b.isExpired && !b.isHighestBidder)

        setActiveBidsCount(activeWinning.length)
        setOutbidCount(activeOutbid.length)
      }
    } catch (error: any) {
      console.error("Error fetching management data:", error)
      toast({
        title: "Access Denied",
        description: error?.message || "You don't have permission to access this page",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // initial load
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  useEffect(() => {
    if (activeTab === "waivers" && teamData?.id) loadWaiversData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, teamData?.id])

  useEffect(() => {
    if (activeTab === "free-agents" && teamData?.id) loadFreeAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, teamData?.id])

  const handleBidClick = (player: any) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const handleHistoryClick = (player: any) => {
    setHistoryPlayer(player)
    setIsHistoryModalOpen(true)
    // (you can wire your BidHistoryModal here later)
  }

    // Other team player loading (for trade)
  useEffect(() => {
    const loadOtherTeamPlayers = async () => {
      if (!selectedTeamForTrade) {
        setSelectedTeamPlayers([])
        setOtherTeamSalary(0)
        setProjectedOtherTeamSalary(0)
        return
      }

      try {
        const { data: otherPlayers, error } = await supabase
          .from("players")
          .select(
            `
            id,
            role,
            salary,
            user_id,
            users (
              id,
              email,
              gamer_tag_id,
              console,
              avatar_url
            ),
            season_registrations (
              primary_position,
              secondary_position
            )
          `,
          )
          .eq("team_id", selectedTeamForTrade)
          .order("role", { ascending: false })

        if (error) throw error

        setSelectedTeamPlayers(otherPlayers || [])
        const otherSalary = (otherPlayers || []).reduce((sum: number, p: any) => sum + (p.salary || 0), 0)
        setOtherTeamSalary(otherSalary)
        setProjectedOtherTeamSalary(otherSalary)
      } catch (e) {
        console.error("Error loading other team players:", e)
        setSelectedTeamPlayers([])
        setOtherTeamSalary(0)
        setProjectedOtherTeamSalary(0)
      }
    }

    loadOtherTeamPlayers()
  }, [selectedTeamForTrade, supabase])

  const handleTradeResponse = async (proposalId: string, accept: boolean) => {
    try {
      setIsProcessingTradeResponse(true)

      const response = await fetch("/api/trades/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: proposalId,
          accept,
          userId: session?.user?.id,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Failed to ${accept ? "accept" : "reject"} trade`)
      }

      toast({
        title: accept ? "Trade Accepted" : "Trade Rejected",
        description: accept ? "The trade has been completed successfully." : "The trade proposal has been rejected.",
      })

      await fetchData()
      if (teamData?.id && teamData?.name) await fetchTradeProposals(teamData.id, teamData.name)
    } catch (error: any) {
      console.error("Error processing trade response:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process trade response",
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
                    <div className="text-2xl font-bold">{teamMatches.filter((m) => m.status === "Scheduled").length}</div>
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
                        <span className="text-sm text-muted-foreground ml-1">→ ${(projectedSalary / 1000000).toFixed(1)}M</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
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

              {/* Roster */}
              <TabsContent value="roster">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Team Roster</CardTitle>
                    <CardDescription className="text-sm md:text-base">Manage your team's players and roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamPlayers.length > 0 ? (
                      <>
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
                                      <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                        {getPositionAbbreviation(player.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                      </span>
                                      {player.season_registrations?.[0]?.secondary_position && (
                                        <>
                                          {" / "}
                                          <span className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}>
                                            {getPositionAbbreviation(player.season_registrations?.[0]?.secondary_position)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={player.role === "Owner" ? "default" : "outline"}>{player.role}</Badge>
                                  </TableCell>
                                  <TableCell className="text-center">{player.users?.console || "Unknown"}</TableCell>
                                  <TableCell className="text-center font-mono">${(player.salary / 1000000).toFixed(2)}M</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="md:hidden space-y-3">
                          {teamPlayers.map((player) => (
                            <div key={player.id} className="border rounded-lg p-4 bg-card">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h3 className="font-medium text-base">{player.users?.gamer_tag_id || "Unknown Player"}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={getPositionColor(player.season_registrations?.[0]?.primary_position) + " text-sm font-medium"}>
                                      {getPositionAbbreviation(player.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                    </span>
                                    {player.season_registrations?.[0]?.secondary_position && (
                                      <>
                                        <span className="text-muted-foreground text-sm">/</span>
                                        <span className={getPositionColor(player.season_registrations?.[0]?.secondary_position) + " text-sm font-medium"}>
                                          {getPositionAbbreviation(player.season_registrations?.[0]?.secondary_position)}
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

              {/* Availability */}
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

              {/* Schedule */}
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
                            <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">{matchDate.toLocaleDateString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {matchDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{isHomeTeam ? "HOME" : "AWAY"}</Badge>
                                  <span>vs {opponent?.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {match.status === "Completed" ? (
                                  <div className="text-right">
                                    <div className="font-bold">
                                      {isHomeTeam ? `${match.home_score} - ${match.away_score}` : `${match.away_score} - ${match.home_score}`}
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

              {/* Free Agents */}
              <TabsContent value="free-agents">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Free Agents</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Available players for bidding. {!isBiddingEnabled && "Bidding is currently disabled."}
                      {!!teamData && (
                        <span className="block mt-1">
                          <span className="font-medium">Your active winning bids:</span>{" "}
                          <span className="font-mono">${activeWinningBidTotal.toLocaleString()}</span>{" "}
                          <span className="text-muted-foreground">({activeWinningBids.length})</span>
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-3 md:p-4">
                          <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Team Salary</h3>
                          <SalaryProgress current={currentTeamSalary} max={currentSalaryCap} projected={projectedSalary} />
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-3 md:p-4">
                          <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Roster Size</h3>
                          <RosterProgress current={teamPlayers.length} max={15} projected={projectedRosterSize} />
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-3 md:p-4">
                          <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Position Breakdown</h3>
                          <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm">
                            {(() => {
                              const positions: Record<string, number> = { C: 0, LW: 0, RW: 0, LD: 0, RD: 0, G: 0 }
                              teamPlayers.forEach((p) => {
                                const pos = getPositionAbbreviation(p.season_registrations?.[0]?.primary_position || "")
                                if (pos in positions) positions[pos]++
                              })
                              return (
                                <>
                                  <div className="flex justify-between"><span className="text-red-400 font-medium">C:</span><span className="text-white">{positions.C}</span></div>
                                  <div className="flex justify-between"><span className="text-green-400 font-medium">LW:</span><span className="text-white">{positions.LW}</span></div>
                                  <div className="flex justify-between"><span className="text-blue-400 font-medium">RW:</span><span className="text-white">{positions.RW}</span></div>
                                  <div className="flex justify-between"><span className="text-cyan-400 font-medium">LD:</span><span className="text-white">{positions.LD}</span></div>
                                  <div className="flex justify-between"><span className="text-yellow-400 font-medium">RD:</span><span className="text-white">{positions.RD}</span></div>
                                  <div className="flex justify-between"><span className="text-purple-400 font-medium">G:</span><span className="text-white">{positions.G}</span></div>
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
                      <div className="text-center py-8 text-muted-foreground">Loading free agents...</div>
                    ) : freeAgentsError ? (
                      <div className="text-center py-8">
                        <div className="text-red-500 mb-4">{freeAgentsError}</div>
                        <Button onClick={loadFreeAgents} variant="outline">Try Again</Button>
                      </div>
                    ) : filteredFreeAgents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {(() => {
                          const sortedPlayers = [...filteredFreeAgents].sort((a, b) => {
                            const A = a.users?.gamer_tag_id || ""
                            const B = b.users?.gamer_tag_id || ""
                            return A.localeCompare(B)
                          })

                          return sortedPlayers.map((player) => {
                            if (!player?.users) return null

                            const currentBid = playerBids[player.id]
                            const isYourTopBid = Boolean(currentBid && currentBid.team_id === teamData?.id)

                            // allow extend, disallow only if bidding disabled or roster cap would be exceeded (when not already winning)
                            const canBid =
                              isBiddingEnabled &&
                              (isYourTopBid ? true : projectedRosterSize < 15)

                            const cardStyle = isYourTopBid
                              ? "border rounded-lg p-3 md:p-4 shadow-sm dark:border-gray-800 opacity-70 bg-muted/40"
                              : "border rounded-lg p-3 md:p-4 shadow-sm dark:border-gray-800"

                            return (
                              <div key={player.id} className={cardStyle}>
                                <div className="flex justify-between items-start mb-2 md:mb-3">
                                  <div>
                                    <h3 className="font-medium text-sm md:text-base">{player.users?.gamer_tag_id || "Unknown Player"}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className={getPositionColor(player.season_registrations?.[0]?.primary_position) + " text-xs md:text-sm"}>
                                        {getPositionAbbreviation(player.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                      </span>
                                      {player.season_registrations?.[0]?.secondary_position && (
                                        <>
                                          {" / "}
                                          <span className={getPositionColor(player.season_registrations?.[0]?.secondary_position) + " text-xs md:text-sm"}>
                                            {getPositionAbbreviation(player.season_registrations?.[0]?.secondary_position)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                      {player.users?.console} • ${(player.salary / 1000000).toFixed(2)}M
                                    </p>
                                  </div>

                                  {isYourTopBid && (
                                    <Badge variant="outline" className="text-xs">Your Top Bid</Badge>
                                  )}
                                </div>

                                {currentBid && (
                                  <div className="mb-2 md:mb-3 p-2 bg-muted rounded-md">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs md:text-sm font-medium">Current Bid:</span>
                                      <span className="font-bold text-xs md:text-sm">${currentBid.bid_amount.toLocaleString()}</span>
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
                                    title={!isYourTopBid && projectedRosterSize >= 15 ? "Roster limit reached with current winning bids" : ""}
                                  >
                                    {isYourTopBid ? "Extend Bid" : "Place Bid"}
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
                        {freeAgents.length === 0 ? "No free agents available." : "No players match your filter criteria."}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Bids */}
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
                            cardClass = "border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 opacity-75"
                            statusBadge = { variant: "default" as const, text: "WON" }
                          } else if (isExpired) {
                            cardClass = "border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 opacity-75"
                            statusBadge = { variant: "destructive" as const, text: "LOST" }
                          }

                          return (
                            <div key={bid.id} className={cardClass}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{bid.players?.users?.gamer_tag_id || "Unknown Player"}</h3>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className={getPositionColor(bid.players?.season_registrations?.[0]?.primary_position)}>
                                      {getPositionAbbreviation(bid.players?.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                    </span>
                                    {bid.players?.season_registrations?.[0]?.secondary_position && (
                                      <>
                                        {" / "}
                                        <span className={getPositionColor(bid.players?.season_registrations?.[0]?.secondary_position)}>
                                          {getPositionAbbreviation(bid.players?.season_registrations?.[0]?.secondary_position)}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  <p className="text-sm text-muted-foreground mt-1">Your bid: ${bid.bid_amount.toLocaleString()}</p>

                                  {!bid.isHighestBidder && bid.highestBid && (
                                    <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                                      Outbid by {bid.highestBid.teams?.name}: ${bid.highestBid.bid_amount.toLocaleString()}
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
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
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

              {/* Waivers (FIXED JSX CLOSURES) */}
              <TabsContent value="waivers">
                <Card>
                  <CardHeader>
                    <CardTitle>Waiver Wire</CardTitle>
                    <CardDescription>
                      Waive players from your roster or claim players from other teams. Claims are processed based on waiver priority.
                      Waivers are automatically processed when they expire.
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
                                {Array(3).fill(0).map((_, i) => (
                                  <div key={i} className="h-20 w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
                                ))}
                              </div>
                            ) : waiverError ? (
                              <div className="text-center py-8">
                                <p className="text-red-500">{waiverError}</p>
                                <Button onClick={loadWaiversData} className="mt-4">Try Again</Button>
                              </div>
                            ) : waivers.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">No players currently on waivers</div>
                            ) : (
                              <div className="space-y-4">
                                {waivers.map((waiver) => {
                                  const timeRemaining = new Date(waiver.claim_deadline).getTime() - now.getTime()
                                  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
                                  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)))
                                  const isExpired = timeRemaining <= 0
                                  const isClaimingThisWaiver = claimingWaivers.has(waiver.id)
                                  const hasAlreadyClaimed = waiver.hasTeamClaimed

                                  return (
                                    <div key={waiver.id} className="border rounded-lg p-4 shadow-sm dark:border-gray-800">
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <h3 className="font-medium">{waiver.players?.users?.gamer_tag_id || "Unknown Player"}</h3>
                                          <div className="flex items-center gap-1 mt-1">
                                            <span className={getPositionColor(waiver.players?.season_registrations?.[0]?.primary_position)}>
                                              {getPositionAbbreviation(waiver.players?.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                            </span>
                                            {waiver.players?.season_registrations?.[0]?.secondary_position && (
                                              <>
                                                {" / "}
                                                <span className={getPositionColor(waiver.players?.season_registrations?.[0]?.secondary_position)}>
                                                  {getPositionAbbreviation(waiver.players?.season_registrations?.[0]?.secondary_position)}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Waived by {waiver.waiving_team?.name} • Salary: ${waiver.players?.salary?.toLocaleString()}
                                          </p>
                                        </div>

                                        <div className="text-right">
                                          <div className="flex items-center justify-end">
                                            <Clock className={"h-4 w-4 mr-1 " + (isExpired ? "text-red-500" : "text-muted-foreground")} />
                                            <span className={"text-sm " + (isExpired ? "text-red-500" : "text-muted-foreground")}>
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

                          <div className="lg:col-span-1">{teamData && <WaiverPriorityDisplay teamId={teamData.id} />}</div>
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
                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Waiver Process</h3>
                            <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
                              <li>• Players are placed on waivers for 8 hours</li>
                              <li>• You can cancel within 30 minutes of waiving</li>
                              <li>• Teams can claim players based on waiver priority (worst record gets first priority)</li>
                              <li>• If multiple teams claim, highest priority wins</li>
                              <li>• Winning team moves to bottom of waiver priority</li>
                              <li>• Unclaimed players become free agents</li>
                              <li>• Waivers are automatically processed when they expire</li>
                            </ul>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamPlayers
                              .filter((p) => !["Owner", "GM", "AGM"].includes(p.role))
                              .map((player) => {
                                const isWaivingThisPlayer = waivingPlayers.has(player.id)
                                return (
                                  <div key={player.id} className="border rounded-lg p-4 shadow-sm dark:border-gray-800">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h3 className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                            {getPositionAbbreviation(player.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                          </span>
                                          {player.season_registrations?.[0]?.secondary_position && (
                                            <>
                                              {" / "}
                                              <span className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}>
                                                {getPositionAbbreviation(player.season_registrations?.[0]?.secondary_position)}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">${player.salary?.toLocaleString()}</p>
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

                          {teamPlayers.filter((p) => !["Owner", "GM", "AGM"].includes(p.role)).length === 0 && (
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
              
              {/* Trades */}
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

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="font-medium">Your Players</h3>
                                    <Badge variant="outline">
                                      ${(currentTeamSalaryTrade / 1000000).toFixed(2)}M → ${(projectedTeamSalary / 1000000).toFixed(2)}M
                                    </Badge>
                                  </div>

                                  <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                                    {teamPlayers.map((player) => (
                                      <div
                                        key={player.id}
                                        className={
                                          "p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer " +
                                          (selectedMyPlayers.includes(player.id) ? "bg-primary/10" : "")
                                        }
                                        onClick={() => {
                                          if (selectedMyPlayers.includes(player.id)) {
                                            setSelectedMyPlayers(selectedMyPlayers.filter((id) => id !== player.id))
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
                                          <div className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                              {getPositionAbbreviation(player.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                            </span>
                                            {player.season_registrations?.[0]?.secondary_position && (
                                              <>
                                                {" / "}
                                                <span className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}>
                                                  {getPositionAbbreviation(player.season_registrations?.[0]?.secondary_position)}
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
                                                setCapSpaceWithholding({ ...capSpaceWithholding, [player.id]: Number(value) })
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

                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="font-medium">
                                      {allTeams.find((t) => t.id === selectedTeamForTrade)?.name || "Other Team"} Players
                                    </h3>
                                    <Badge variant="outline">
                                      ${(otherTeamSalary / 1000000).toFixed(2)}M → ${(projectedOtherTeamSalary / 1000000).toFixed(2)}M
                                    </Badge>
                                  </div>

                                  <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                                    {selectedTeamPlayers.map((player) => (
                                      <div
                                        key={player.id}
                                        className={
                                          "p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer " +
                                          (selectedOtherPlayers.includes(player.id) ? "bg-primary/10" : "")
                                        }
                                        onClick={() => {
                                          if (selectedOtherPlayers.includes(player.id)) {
                                            setSelectedOtherPlayers(selectedOtherPlayers.filter((id) => id !== player.id))
                                          } else {
                                            setSelectedOtherPlayers([...selectedOtherPlayers, player.id])
                                          }
                                        }}
                                      >
                                        <div>
                                          <div className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                              {getPositionAbbreviation(player.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                                            </span>
                                            {player.season_registrations?.[0]?.secondary_position && (
                                              <>
                                                {" / "}
                                                <span className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}>
                                                  {getPositionAbbreviation(player.season_registrations?.[0]?.secondary_position)}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        <div className="text-right font-mono">${(player.salary / 1000000).toFixed(2)}M</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {(tradeError || tradeSuccess) && (
                                <div
                                  className={
                                    "p-3 rounded-md " +
                                    (tradeError
                                      ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                      : "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300")
                                  }
                                >
                                  {tradeError || tradeSuccess}
                                </div>
                              )}

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

                                    const myPlayersToTrade = teamPlayers.filter((p) => selectedMyPlayers.includes(p.id))
                                    const otherPlayersToReceive = selectedTeamPlayers.filter((p) =>
                                      selectedOtherPlayers.includes(p.id),
                                    )

                                    const fromPlayers = myPlayersToTrade.map((p) => ({
                                      id: p.id,
                                      name: p.users?.gamer_tag_id || "Unknown Player",
                                      position: p.season_registrations?.[0]?.primary_position || "UNKNOWN",
                                      salary: p.salary,
                                      withholding: capSpaceWithholding[p.id] || 0,
                                    }))

                                    const toPlayers = otherPlayersToReceive.map((p) => ({
                                      id: p.id,
                                      name: p.users?.gamer_tag_id || "Unknown Player",
                                      position: p.season_registrations?.[0]?.primary_position || "UNKNOWN",
                                      salary: p.salary,
                                    }))

                                    const { data: otherTeamManagers } = await supabase
                                      .from("players")
                                      .select("user_id")
                                      .eq("team_id", selectedTeamForTrade)
                                      .in("role", ["GM", "AGM", "Owner"])

                                    if (!otherTeamManagers || otherTeamManagers.length === 0) {
                                      setTradeError("Could not find managers for the selected team")
                                      return
                                    }

                                    const otherTeam = allTeams.find((t) => t.id === selectedTeamForTrade)
                                    if (!otherTeam) {
                                      setTradeError("Could not find the selected team")
                                      return
                                    }

                                    const tradeData = {
                                      fromTeam: teamData?.name,
                                      toTeam: otherTeam.name,
                                      fromPlayers,
                                      toPlayers,
                                      message: tradeMessage,
                                    }

                                    const notifications = otherTeamManagers.map((manager: any) => ({
                                      user_id: manager.user_id,
                                      title: "Trade Proposal from " + teamData?.name,
                                      message:
                                        (teamData?.name || "A team") +
                                        " wants to trade " +
                                        (fromPlayers.map((p) => p.name).join(", ") || "players") +
                                        " for " +
                                        (toPlayers.map((p) => p.name).join(", ") || "players") +
                                        ". " +
                                        (tradeMessage ? "Message: " + tradeMessage : "") +
                                        "\n\nTRADE_DATA:" +
                                        JSON.stringify(tradeData),
                                      link: "/management?tab=trades",
                                      read: false,
                                    }))

                                    const selfNotification = {
                                      user_id: session?.user?.id,
                                      title: "Trade Proposal to " + otherTeam.name,
                                      message:
                                        "You proposed to trade " +
                                        (fromPlayers.map((p) => p.name).join(", ") || "players") +
                                        " for " +
                                        (toPlayers.map((p) => p.name).join(", ") || "players") +
                                        ". Waiting for response.\n\nTRADE_DATA:" +
                                        JSON.stringify(tradeData),
                                      link: "/management?tab=trades",
                                      read: false,
                                    }

                                    const { error: notificationError } = await supabase
                                      .from("notifications")
                                      .insert([...notifications, selfNotification])

                                    if (notificationError) throw notificationError

                                    setTradeSuccess("Trade proposal sent successfully!")
                                    setSelectedMyPlayers([])
                                    setSelectedOtherPlayers([])
                                    setTradeMessage("")
                                    setCapSpaceWithholding({})

                                    if (teamData?.id && teamData?.name) await fetchTradeProposals(teamData.id, teamData.name)

                                    const tabsElement = document.querySelector('[data-value="outgoing"]') as HTMLElement | null
                                    if (tabsElement) tabsElement.click()
                                  } catch (error: any) {
                                    console.error("Error submitting trade:", error)
                                    setTradeError("Failed to submit trade: " + (error?.message || "Unknown error"))
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
                              let tradeData: any = null
                              try {
                                const match = proposal.message.match(/TRADE_DATA:(.+)$/)
                                if (match) tradeData = JSON.parse(match[1])
                              } catch (e) {
                                console.error("Failed to parse trade data:", e)
                              }

                              return (
                                <Card key={proposal.id} className="overflow-hidden">
                                  <CardHeader className="bg-muted/50 pb-3">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-lg">Trade from {tradeData?.fromTeam || "Unknown Team"}</CardTitle>
                                      <CardDescription>
                                        {new Date(proposal.created_at).toLocaleDateString()} at{" "}
                                        {new Date(proposal.created_at).toLocaleTimeString()}
                                      </CardDescription>
                                    </div>
                                  </CardHeader>

                                  <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">They Offer:</h3>
                                        {tradeData?.fromPlayers?.length ? (
                                          <ul className="space-y-2">
                                            {tradeData.fromPlayers.map((p: any, idx: number) => (
                                              <li key={idx} className="flex justify-between items-center">
                                                <span>{p.name}</span>
                                                <div className="text-sm text-muted-foreground">
                                                  <span>${(p.salary / 1000000).toFixed(2)}M</span>
                                                  {p.withholding > 0 && (
                                                    <span className="ml-1 text-orange-600">
                                                      (Retain ${(p.withholding / 1000000).toFixed(2)}M)
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

                                      <div className="md:col-span-1 flex justify-center">
                                        <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                                      </div>

                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">They Want:</h3>
                                        {tradeData?.toPlayers?.length ? (
                                          <ul className="space-y-2">
                                            {tradeData.toPlayers.map((p: any, idx: number) => (
                                              <li key={idx} className="flex justify-between items-center">
                                                <span>{p.name}</span>
                                                <span className="text-sm text-muted-foreground">${(p.salary / 1000000).toFixed(2)}M</span>
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
                              let tradeData: any = null
                              try {
                                const match = proposal.message.match(/TRADE_DATA:(.+)$/)
                                if (match) tradeData = JSON.parse(match[1])
                              } catch (e) {
                                console.error("Failed to parse trade data:", e)
                              }

                              const isCancelling = cancellingTrades.has(proposal.id)

                              return (
                                <Card key={proposal.id} className="overflow-hidden">
                                  <CardHeader className="bg-muted/50 pb-3">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-lg">Trade to {tradeData?.toTeam || "Unknown Team"}</CardTitle>
                                      <CardDescription>
                                        {new Date(proposal.created_at).toLocaleDateString()} at{" "}
                                        {new Date(proposal.created_at).toLocaleTimeString()}
                                      </CardDescription>
                                    </div>
                                  </CardHeader>

                                  <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">You Offer:</h3>
                                        {tradeData?.fromPlayers?.length ? (
                                          <ul className="space-y-2">
                                            {tradeData.fromPlayers.map((p: any, idx: number) => (
                                              <li key={idx} className="flex justify-between items-center">
                                                <span>{p.name}</span>
                                                <div className="text-sm text-muted-foreground">
                                                  <span>${(p.salary / 1000000).toFixed(2)}M</span>
                                                  {p.withholding > 0 && (
                                                    <span className="ml-1 text-orange-600">
                                                      (Retain ${(p.withholding / 1000000).toFixed(2)}M)
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

                                      <div className="md:col-span-1 flex justify-center">
                                        <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                                      </div>

                                      <div className="md:col-span-3">
                                        <h3 className="font-medium mb-2">You Want:</h3>
                                        {tradeData?.toPlayers?.length ? (
                                          <ul className="space-y-2">
                                            {tradeData.toPlayers.map((p: any, idx: number) => (
                                              <li key={idx} className="flex justify-between items-center">
                                                <span>{p.name}</span>
                                                <span className="text-sm text-muted-foreground">${(p.salary / 1000000).toFixed(2)}M</span>
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
                                        disabled={isCancelling}
                                        className="flex-1"
                                        onClick={async () => {
                                          try {
                                            setCancellingTrades((prev) => new Set(prev).add(proposal.id))

                                            const otherTeamName = tradeData?.toTeam
                                            if (!otherTeamName) throw new Error("Could not determine other team")

                                            const otherTeam = allTeams.find((t) => t.name === otherTeamName)
                                            if (!otherTeam) throw new Error("Could not find other team")

                                            const { data: otherTeamManagers } = await supabase
                                              .from("players")
                                              .select("user_id")
                                              .eq("team_id", otherTeam.id)
                                              .in("role", ["GM", "AGM", "Owner"])

                                            await supabase
                                              .from("notifications")
                                              .update({ message: proposal.message + "\n\nSTATUS: CANCELLED" })
                                              .eq("id", proposal.id)

                                            if (otherTeamManagers?.length) {
                                              await supabase
                                                .from("notifications")
                                                .update({ message: proposal.message + "\n\nSTATUS: CANCELLED" })
                                                .in("user_id", otherTeamManagers.map((m: any) => m.user_id))
                                                .like("title", "Trade Proposal from " + teamData?.name + "%")
                                                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                                            }

                                            toast({ title: "Trade Cancelled", description: "Your trade proposal has been cancelled." })
                                            if (teamData?.id && teamData?.name) await fetchTradeProposals(teamData.id, teamData.name)
                                          } catch (error: any) {
                                            console.error("Error cancelling trade:", error)
                                            toast({
                                              title: "Error",
                                              description: "Failed to cancel trade: " + error.message,
                                              variant: "destructive",
                                            })
                                          } finally {
                                            setCancellingTrades((prev) => {
                                              const s = new Set(prev)
                                              s.delete(proposal.id)
                                              return s
                                            })
                                          }
                                        }}
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

              
