"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

import { BidPlayerModal } from "@/components/management/bid-player-modal"

// NEW split components
import TeamSummaryHeader from "@/components/management/header/TeamSummaryHeader"
import TeamRosterTab from "@/components/management/tabs/TeamRosterTab"
import TeamAvailTab from "@/components/management/tabs/TeamAvailTab"
import TeamScheduleTab from "@/components/management/tabs/TeamScheduleTab"
import FreeAgentsTab from "@/components/management/tabs/FreeAgentsTab"
import MyBidsTab from "@/components/management/tabs/MyBidsTab"
import WaiversTab from "@/components/management/tabs/WaiversTab"
import TradesTab from "@/components/management/tabs/TradesTab"

// utils you referenced
import { getCurrentSeasonId, getTeamStats } from "@/lib/team-utils"

// ----------------------
// Types (from original)
// ----------------------
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
  season_registrations?: Array<{
    season_id?: string
    season_number?: number
    primary_position?: string
    secondary_position?: string | null
  }>
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
  match_date: string
  status: string
  home_score?: number
  away_score?: number
  home_team: { id: string; name: string; logo_url?: string }
  away_team: { id: string; name: string; logo_url?: string }
}

interface DraftPick {
  id: string
  season_number: number
  round: number
  original_team_id: string
  current_team_id: string
  is_traded: boolean
  original_team?: { name: string; logo_url?: string | null } | null
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
    season_registrations?: Array<{
      primary_position?: string
      secondary_position?: string | null
    }>
  }
  waiving_team: { id: string; name: string; logo_url?: string }
  waiver_claims?: Array<{
    id: string
    claiming_team_id: string
    priority_at_claim: number
    teams: { name: string; logo_url?: string }
  }>
  hasTeamClaimed?: boolean
}

// ----------------------
// Helpers (from original)
// ----------------------
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

// ----------------------
// Page Component
// ----------------------
export default function ManagementPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // core data
  const [teamData, setTeamData] = useState<Team | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [teamMatches, setTeamMatches] = useState<any[]>([])

  // free agents
  const [freeAgents, setFreeAgents] = useState<any[]>([])
  const [filteredFreeAgents, setFilteredFreeAgents] = useState<any[]>([])
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState<string>("")
  const [playerBids, setPlayerBids] = useState<Record<string, any>>({})
  const [myBids, setMyBids] = useState<any[]>([])
  const [activeBidsCount, setActiveBidsCount] = useState(0)
  const [outbidCount, setOutbidCount] = useState(0)
  const [freeAgentsError, setFreeAgentsError] = useState<string | null>(null)
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(false)
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(true)

  // waivers
  const [waivers, setWaivers] = useState<Waiver[]>([])
  const [loadingWaivers, setLoadingWaivers] = useState(false)
  const [waiverError, setWaiverError] = useState<string | null>(null)
  const [waivingPlayers, setWaivingPlayers] = useState<Set<string>>(new Set())
  const [claimingWaivers, setClaimingWaivers] = useState<Set<string>>(new Set())

  // trades
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [selectedTeamForTrade, setSelectedTeamForTrade] = useState<string | null>(null)
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState<any[]>([])
  const [selectedMyPlayers, setSelectedMyPlayers] = useState<string[]>([])
  const [selectedOtherPlayers, setSelectedOtherPlayers] = useState<string[]>([])
  const [currentSalaryCap, setCurrentSalaryCap] = useState(100000000) // $100M salary cap
  const [currentTeamSalary, setCurrentTeamSalary] = useState(0)
  const [projectedTeamSalary, setProjectedTeamSalary] = useState(0)
  const [otherTeamSalary, setOtherTeamSalary] = useState(0)
  const [projectedOtherTeamSalary, setProjectedOtherTeamSalary] = useState(0)
  const [tradeMessage, setTradeMessage] = useState("")
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false)
  const [tradeError, setTradeError] = useState<string | null>(null)
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null)
  const [incomingTradeProposals, setIncomingTradeProposals] = useState<any[]>([])
  const [outgoingTradeProposals, setOutgoingTradeProposals] = useState<any[]>([])
  const [isProcessingTradeResponse, setIsProcessingTradeResponse] = useState(false)
  const [cancellingTrades, setCancellingTrades] = useState<Set<string>>(new Set())
  const [capSpaceWithholding, setCapSpaceWithholding] = useState<Record<string, number>>({})

  // picks
  const [myPicks, setMyPicks] = useState<DraftPick[]>([])
  const [otherTeamPicks, setOtherTeamPicks] = useState<DraftPick[]>([])
  const [selectedMyPicks, setSelectedMyPicks] = useState<string[]>([])
  const [selectedOtherPicks, setSelectedOtherPicks] = useState<string[]>([])

  // projections (bids)
  const [projectedSalary, setProjectedSalary] = useState(0)
  const [projectedRosterSize, setProjectedRosterSize] = useState(0)

  // UI
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState<any>(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<any>(false) // kept for parity, hook used by FreeAgentsTab
  const [historyPlayer, setHistoryPlayer] = useState<any>(null)

  const [now, setNow] = useState(new Date())
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "roster")

  // ----------------------
  // Utils (from original)
  // ----------------------
  const formatPick = (p: DraftPick) =>
    `S${p.season_number} • R${p.round} • ${p.original_team?.name ? `via ${p.original_team.name}` : "Original"}`
  const toggleFromArray = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((i) => i !== id) : [...arr, id])

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

  const calculatePostTradePlayerSalary = (player: any, withholding = 0): number => {
    const originalSalary = player.salary || 0
    const postTradeSalary = originalSalary - withholding
    return Math.max(postTradeSalary, 750000)
  }

  const getValidWithholdingAmounts = (playerSalary: number): number[] => {
    const maxWithholding = Math.floor((playerSalary * 0.25) / 250000) * 250000 // 25% in 250k steps
    const amounts: number[] = []
    for (let i = 0; i <= maxWithholding; i += 250000) {
      if (playerSalary - i >= 750000) amounts.push(i)
    }
    return amounts
  }

  const handleBidClick = (player: any) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const handleHistoryClick = (player: any) => {
    setHistoryPlayer(player)
    setIsHistoryModalOpen(true)
  }

  // ----------------------
  // Data loaders (REPLACE this function)
  // ----------------------
  const fetchTradeProposals = async (teamId: string, teamName: string) => {
    try {
      // original notification queries
      const { data: incomingRaw } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session?.user.id)
        .like("title", `Trade Proposal from %`)
        .not("message", "like", "%STATUS:%")
        .order("created_at", { ascending: false })

      const { data: outgoingRaw } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session?.user.id)
        .like("title", `Trade Proposal to %`)
        .not("message", "like", "%STATUS:%")
        .order("created_at", { ascending: false })

      // --- NEW: parse TRADE_DATA for tradeIds we can verify against the trades table
      const TRADE_DATA_REGEX = /TRADE_DATA:(.+)$/s
      const allNotifs = [...(incomingRaw || []), ...(outgoingRaw || [])]

      const tradeIds = Array.from(
        new Set(
          allNotifs
            .map((n) => {
              try {
                const m = n.message?.match(TRADE_DATA_REGEX)
                if (!m) return null
                const payload = JSON.parse(m[1])
                return payload?.tradeId || null
              } catch {
                return null
              }
            })
            .filter(Boolean),
        ),
      ) as string[]

      // lookup statuses for those tradeIds
      const statusById: Record<string, string> = {}
      if (tradeIds.length > 0) {
        const { data: trades, error: tradesErr } = await supabase.from("trades").select("id, status").in("id", tradeIds)

        if (!tradesErr && trades) {
          for (const t of trades) statusById[t.id] = t.status
        }
      }

      // keep only notifications whose trade is still 'pending'
      const filterByTradeStatus = (arr: any[] | null | undefined) =>
        (arr || []).filter((n) => {
          try {
            const m = n.message?.match(TRADE_DATA_REGEX)
            if (!m) return true // not a trade payload => keep (legacy/other)
            const payload = JSON.parse(m[1])
            const tid = payload?.tradeId as string | undefined
            if (!tid) return true // legacy trade without id => keep
            const st = statusById[tid]
            return !st || st === "pending" // hide cancelled/accepted/rejected/etc.
          } catch {
            return true
          }
        })

      const incoming = filterByTradeStatus(incomingRaw)
      const outgoing = filterByTradeStatus(outgoingRaw)

      setIncomingTradeProposals(incoming || [])
      setOutgoingTradeProposals(outgoing || [])
    } catch (e) {
      console.error("Error fetching trade proposals:", e)
    }
  }

  const fetchPlayerBids = async () => {
    try {
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
      const highest: Record<string, any> = {}
      bids?.forEach((b) => {
        if (!highest[b.player_id] || b.bid_amount > highest[b.player_id].bid_amount) highest[b.player_id] = b
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
      const response = await fetch("/api/free-agents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch free agents: ${response.status}`)
      }
      const data = await response.json()
      const freeAgentsList = data.freeAgents || []
      setFreeAgents(freeAgentsList)
      setFilteredFreeAgents(freeAgentsList)
      await fetchPlayerBids()
    } catch (e: any) {
      setFreeAgentsError(`Failed to load free agents: ${e.message}`)
      toast({ title: "Error", description: "Failed to load free agents: " + e.message, variant: "destructive" })
    } finally {
      setFreeAgentsLoading(false)
    }
  }

  const loadWaiversData = async () => {
    setLoadingWaivers(true)
    setWaiverError(null)
    try {
      // process expired first
      try {
        const processResponse = await fetch("/api/waivers/check-expired", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
        if (processResponse.ok) {
          const processResult = await processResponse.json()
          if (processResult.expiredCount > 0) {
            toast({
              title: "Waivers Processed",
              description: `${processResult.expiredCount} expired waivers have been processed.`,
            })
            await fetchData()
          }
        }
      } catch (e) {
        console.error("Error processing waivers:", e)
      }

      const response = await fetch("/api/waivers?status=active", {
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })
      if (!response.ok) throw new Error(`Failed to fetch waivers: ${response.status}`)
      const data = await response.json()

      const nowTs = new Date()
      const filtered = (data.waivers || []).filter((w: any) => new Date(w.claim_deadline) > nowTs)

      // add hasTeamClaimed flags
      const withClaims: Waiver[] = await Promise.all(
        filtered.map(async (waiver: Waiver) => {
          const { data: teamClaim } = await supabase
            .from("waiver_claims")
            .select("id")
            .eq("waiver_id", waiver.id)
            .eq("claiming_team_id", teamData?.id)
            .eq("status", "pending")
            .maybeSingle()
          return { ...waiver, hasTeamClaimed: !!teamClaim }
        }),
      )

      setWaivers(withClaims)
    } catch (e: any) {
      console.error("Error loading waivers:", e)
      setWaiverError(e.message || "Failed to load waivers")
    } finally {
      setLoadingWaivers(false)
    }
  }

  const handleWaivePlayerAction = async (playerId: string) => {
    if (waivingPlayers.has(playerId)) return
    try {
      setWaivingPlayers((prev) => new Set(prev).add(playerId))
      if (!session?.user?.id) throw new Error("No valid session found")
      if (!teamData?.id) throw new Error("No team data found")
      const { data: sessionRes } = await supabase.auth.getSession()
      const fresh = sessionRes?.session
      if (!fresh) throw new Error("Authentication session expired. Please refresh the page.")

      const res = await fetch("/api/waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${fresh.access_token}` },
        body: JSON.stringify({ playerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to waive player")

      toast({ title: "Player waived", description: "Player has been placed on waivers for 8 hours." })
      await fetchData()
      await loadWaiversData()
      handleTabChange("waivers")
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", "waivers")
        window.history.replaceState({}, "", url.toString())
      }
    } catch (e: any) {
      toast({ title: "Error waiving player", description: e.message, variant: "destructive" })
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
      if (!session?.user?.id) throw new Error("No valid session found")
      if (!teamData?.id) throw new Error("No team data found")
      const { data: sessionRes } = await supabase.auth.getSession()
      const fresh = sessionRes?.session
      if (!fresh) throw new Error("Authentication session expired. Please refresh the page.")

      const res = await fetch(`/api/waivers/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${fresh.access_token}` },
        body: JSON.stringify({ waiverId, teamId: teamData.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to claim waiver")
      toast({
        title: "Claim submitted",
        description: "Your waiver claim has been submitted. You'll be notified when the waiver period ends.",
      })
      await loadWaiversData()
    } catch (e: any) {
      toast({ title: "Error claiming player", description: e.message, variant: "destructive" })
    } finally {
      setClaimingWaivers((prev) => {
        const s = new Set(prev)
        s.delete(waiverId)
        return s
      })
    }
  }

  const handleTradeResponse = async (proposalId: string, accept: boolean) => {
    try {
      setIsProcessingTradeResponse(true)
      if (!session?.user?.id) throw new Error("No valid session found")
      if (!teamData?.id) throw new Error("No team data found")

      const response = await fetch("/api/trades/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify({ notificationId: proposalId, accept, userId: session.user.id }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Failed to ${accept ? "accept" : "reject"} trade`)
      }
      toast({
        title: accept ? "Trade Accepted" : "Trade Rejected",
        description: accept ? "The trade has been completed successfully." : "The trade proposal has been rejected.",
      })
      await fetchData()
      if (teamData?.id && teamData.name) await fetchTradeProposals(teamData.id, teamData.name)
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || `Failed to ${accept ? "accept" : "reject"} trade`,
        variant: "destructive",
      })
    } finally {
      setIsProcessingTradeResponse(false)
    }
  }

  // ----------------------
  // Master fetch (from original) + FIX: attach season_registrations on players
  // ----------------------
  async function fetchData() {
    if (!session?.user) {
      setIsAuthorized(false)
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
      if (!isManager || !playerData.team_id) throw new Error("You must be a team manager to access this page")

      const currentSeasonId = await getCurrentSeasonId()
      const calculatedTeamStats = await getTeamStats(playerData.team_id, currentSeasonId)
      if (!calculatedTeamStats) throw new Error("Could not calculate team statistics")

      const { data: activeSeasonRow } = await supabase
        .from("seasons")
        .select("id, season_number")
        .eq("id", currentSeasonId)
        .maybeSingle()

      const activeSeasonNumber = activeSeasonRow?.season_number ?? null

      const { data: basicTeamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", playerData.team_id)
        .single()
      if (teamError) throw teamError

      const teamWithStats: Team = {
        ...basicTeamData,
        wins: calculatedTeamStats.wins,
        losses: calculatedTeamStats.losses,
        otl: calculatedTeamStats.otl,
        points: calculatedTeamStats.points,
        games_played: calculatedTeamStats.games_played,
        goals_for: calculatedTeamStats.goals_for, // FIX
        goals_against: calculatedTeamStats.goals_against,
        goal_differential: calculatedTeamStats.goal_differential,
      }
      setTeamData(teamWithStats)

      // picks (tradeable)
      const { data: myTeamPicks, error: picksErr } = await supabase
        .from("tradeable_draft_picks")
        .select(
          `
          id, season_number, round, original_team_id, current_team_id, is_traded,
          original_team:teams!tradeable_draft_picks_original_team_id_fkey ( name, logo_url )
        `,
        )
        .eq("current_team_id", playerData.team_id)
        .order("season_number", { ascending: true })
        .order("round", { ascending: true })
      if (!picksErr && myTeamPicks) setMyPicks(myTeamPicks as DraftPick[])

      await fetchTradeProposals(playerData.team_id, basicTeamData.name)

      // players (with user + active-season registrations attached)
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select(
          `
          id, role, salary, user_id,
          users!inner ( id, email, gamer_tag_id, console, avatar_url )
        `,
        )
        .eq("team_id", playerData.team_id)
        .order("role", { ascending: false })

      if (playersError) {
        // fallback path omitted here for brevity — original logic enhanced users/registrations; keep behavior:
        const { data: playersOnly } = await supabase
          .from("players")
          .select(`id, role, salary, user_id`)
          .eq("team_id", playerData.team_id)
          .order("role", { ascending: false })

        const userIds = playersOnly?.map((p) => p.user_id) || []
        let enhancedPlayers = playersOnly || []
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("users")
            .select(`id, email, gamer_tag_id, console, avatar_url`)
            .in("id", userIds)

          let registrations: any[] = []
          const { data: activeSeason } = await supabase
            .from("seasons")
            .select("id, season_number")
            .eq("is_active", true)
            .single()
          if (activeSeason) {
            const { data: activeRegs } = await supabase
              .from("season_registrations")
              .select(`user_id, primary_position, secondary_position, gamer_tag, console`)
              .in("user_id", userIds)
              .eq("season_id", activeSeason.id)
              .eq("status", "Approved")
            registrations = activeRegs || []
          }

          enhancedPlayers =
            playersOnly?.map((p) => {
              const user = users?.find((u: any) => u.id === p.user_id)
              const reg = registrations?.find((r) => r.user_id === p.user_id)
              return {
                ...p,
                users: {
                  id: user?.id || p.user_id,
                  email: user?.email,
                  gamer_tag_id: reg?.gamer_tag || user?.gamer_tag_id || "Unknown Player",
                  console: reg?.console || user?.console,
                  avatar_url: user?.avatar_url,
                },
                // IMPORTANT: attach season_registrations array so tabs can read it
                season_registrations: reg
                  ? [
                      {
                        season_id: activeSeason?.id,
                        season_number: activeSeason?.season_number,
                        primary_position: reg.primary_position,
                        secondary_position: reg.secondary_position,
                      },
                    ]
                  : [],
              }
            }) || []
        }
        setTeamPlayers(enhancedPlayers)
      } else {
        // enhance with active season registration if available
        const userIds = players?.map((p) => p.user_id) || []
        let registrations: any[] = []
        const { data: activeSeason } = await supabase
          .from("seasons")
          .select("id, season_number")
          .eq("is_active", true)
          .single()
        if (activeSeason) {
          const { data: activeRegs } = await supabase
            .from("season_registrations")
            .select(`user_id, primary_position, secondary_position, gamer_tag, console`)
            .in("user_id", userIds)
            .eq("season_id", activeSeason.id)
            .eq("status", "Approved")
          registrations = activeRegs || []
        }

        const enhanced = (players || []).map((p: any) => {
          const reg = registrations.find((r) => r.user_id === p.user_id)
          if (reg) {
            return {
              ...p,
              users: {
                ...p.users,
                gamer_tag_id: reg.gamer_tag || p.users.gamer_tag_id,
                console: reg.console || p.users.console,
              },
              // IMPORTANT: attach season_registrations array so tabs can read it
              season_registrations: [
                {
                  season_id: activeSeason?.id,
                  season_number: activeSeason?.season_number,
                  primary_position: reg.primary_position,
                  secondary_position: reg.secondary_position,
                },
              ],
            }
          }
          // No registration: still provide an empty array
          return { ...p, season_registrations: [] }
        })
        setTeamPlayers(enhanced)
      }

      // salary
      const totalSalary =
        (Array.isArray(teamPlayers) && teamPlayers.length > 0 ? teamPlayers : (players as any[]) || []).reduce(
          (sum: number, p: any) => sum + (p.salary || 0),
          0,
        ) || 0
      setCurrentTeamSalary(totalSalary)
      setProjectedTeamSalary(totalSalary)

      // other teams (for trades)
      const { data: allTeamsData } = await supabase
        .from("teams")
        .select("*")
        .neq("id", playerData.team_id)
        .order("name", { ascending: true })
      setAllTeams(allTeamsData || [])

      // schedule
      const { data: matches } = await supabase
        .from("matches")
        .select(`*, home_team:home_team_id(id, name, logo_url), away_team:away_team_id(id, name, logo_url)`)
        .or(`home_team_id.eq.${playerData.team_id},away_team_id.eq.${playerData.team_id}`)
        .order("match_date", { ascending: true })
      setTeamMatches(matches || [])

      // bids (mine)
      const { data: activeSeason } = await supabase
        .from("seasons")
        .select("id, season_number, parent_season_id")
        .eq("is_active", true)
        .single()

      console.log("[v0] Active season for myBids:", activeSeason)

      const seasonNumbersToCheck: number[] = []
      if (activeSeason?.season_number) {
        seasonNumbersToCheck.push(activeSeason.season_number)
      }

      // Check for parent season
      if (activeSeason?.parent_season_id) {
        const { data: parentSeason } = await supabase
          .from("seasons")
          .select("season_number")
          .eq("id", activeSeason.parent_season_id)
          .single()

        if (parentSeason?.season_number) {
          seasonNumbersToCheck.push(parentSeason.season_number)
        }
      }

      console.log("[v0] Season numbers to check for registrations:", seasonNumbersToCheck)

      // bids (mine)
      const { data: myTeamBids, error: bidsError } = await supabase
        .from("player_bidding")
        .select(
          `
          *,
          players (
            id,
            user_id,
            salary,
            users (
              id,
              gamer_tag_id,
              console,
              avatar_url
            )
          ),
          teams:team_id (id, name, logo_url)
        `,
        )
        .eq("team_id", playerData.team_id)
        .order("bid_expires_at", { ascending: true })

      console.log("[v0] myTeamBids query result:", myTeamBids, "error:", bidsError)

      if (myTeamBids && myTeamBids.length > 0) {
        const { data: allBids } = await supabase
          .from("player_bidding")
          .select("*")
          .order("bid_amount", { ascending: false })

        console.log("[v0] allBids for comparison:", allBids?.length)

        const highestByPlayer: Record<string, any> = {}
        allBids?.forEach((b: any) => {
          if (!highestByPlayer[b.player_id] || b.bid_amount > highestByPlayer[b.player_id].bid_amount) {
            highestByPlayer[b.player_id] = b
          }
        })

        const userIds = myTeamBids.map((bid: any) => bid.players?.user_id).filter(Boolean)

        console.log("[v0] fetching season_registrations for userIds:", userIds)

        const registrationsByUser: Record<string, any> = {}
        if (userIds.length > 0) {
          let query = supabase.from("season_registrations").select("*").in("user_id", userIds).eq("status", "Approved") // Capitalized to match DB values

          if (seasonNumbersToCheck.length > 0) {
            query = query.in("season_number", seasonNumbersToCheck)
          }

          const { data: registrations, error: regError } = await query

          console.log("[v0] season_registrations result:", registrations, "error:", regError)

          registrations?.forEach((reg: any) => {
            if (!registrationsByUser[reg.user_id]) {
              registrationsByUser[reg.user_id] = reg
            }
          })
        }

        console.log("[v0] registrationsByUser map:", registrationsByUser)

        const nowTs = new Date()
        const enhanced = myTeamBids.map((bid: any) => {
          const highest = highestByPlayer[bid.player_id]
          const isHighestBidder = highest && highest.id === bid.id
          const isExpired = new Date(bid.bid_expires_at) <= nowTs
          const userId = bid.players?.user_id
          const userReg = userId ? registrationsByUser[userId] : null

          console.log(
            "[v0] Bid for player:",
            bid.players?.users?.gamer_tag_id,
            "user_id:",
            userId,
            "registration:",
            userReg,
          )

          return {
            ...bid,
            isHighestBidder,
            highestBid: !isHighestBidder ? highest : null,
            isExpired,
            status: isExpired ? "expired" : isHighestBidder ? "winning" : "outbid",
            registration: userReg,
          }
        })

        console.log("[v0] enhanced myBids:", enhanced)

        setMyBids(enhanced)
        setActiveBidsCount(enhanced.filter((b: any) => !b.isExpired && b.isHighestBidder).length)
        setOutbidCount(enhanced.filter((b: any) => !b.isExpired && !b.isHighestBidder).length)
      } else {
        console.log("[v0] No bids found for team or query failed")
        setMyBids([])
        setActiveBidsCount(0)
        setOutbidCount(0)
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

  // ----------------------
  // Effects (from original)
  // ----------------------
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = freeAgents
    if (nameFilter.trim() !== "") {
      const searchTerm = nameFilter.toLowerCase().trim()
      filtered = filtered.filter((p) => p.users?.gamer_tag_id?.toLowerCase().includes(searchTerm))
    }
    if (positionFilter !== "all") {
      filtered = filtered.filter((player) => {
        const primaryPos = getPositionAbbreviation(
          player.users?.season_registrations?.[0]?.primary_position || "UNKNOWN",
        )
        const secondaryPos = getPositionAbbreviation(player.users?.season_registrations?.[0]?.secondary_position || "")
        const filterPos = getPositionAbbreviation(positionFilter)
        return primaryPos === filterPos || secondaryPos === filterPos
      })
    }
    setFilteredFreeAgents(filtered)
  }, [positionFilter, nameFilter, freeAgents])

  useEffect(() => {
    if (!teamData) {
      setProjectedSalary(currentTeamSalary)
      setProjectedRosterSize(teamPlayers.length)
      return
    }
    const winningBids = myBids.filter((b) => b.isHighestBidder && new Date(b.bid_expires_at) > now)
    const projectedSalaryIncrease = winningBids.reduce((sum, b) => sum + b.bid_amount, 0)
    const projectedRosterIncrease = winningBids.length
    setProjectedSalary(currentTeamSalary + projectedSalaryIncrease)
    setProjectedRosterSize(teamPlayers.length + projectedRosterIncrease)
  }, [myBids, currentTeamSalary, teamPlayers.length, teamData, now])

  useEffect(() => {
    const checkBiddingStatus = async () => {
      try {
        const response = await fetch("/api/bidding/status")
        const data = await response.json()
        setIsBiddingEnabled(data.enabled)
      } catch {
        setIsBiddingEnabled(false)
      }
    }
    checkBiddingStatus()
  }, [])

  useEffect(() => {
    const loadOtherTeamPlayers = async () => {
      if (!selectedTeamForTrade) {
        setSelectedTeamPlayers([])
        setOtherTeamSalary(0)
        setProjectedOtherTeamSalary(0)
        setOtherTeamPicks([])
        return
      }
      try {
        const { data: otherPlayers } = await supabase
          .from("players")
          .select(`id, role, salary, user_id`)
          .eq("team_id", selectedTeamForTrade)
          .order("role", { ascending: false })

        const { data: activeSeason } = await supabase
          .from("seasons")
          .select("id, season_number")
          .eq("is_active", true)
          .single()
        const userIds = otherPlayers?.map((p) => p.user_id) || []
        let enhanced = otherPlayers || []
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("users")
            .select(`id, email, gamer_tag_id, console, avatar_url`)
            .in("id", userIds)

          let registrations: any[] = []
          if (activeSeason) {
            const { data: regData } = await supabase
              .from("season_registrations")
              .select(`user_id, primary_position, secondary_position, gamer_tag, console`)
              .in("user_id", userIds)
              .eq("season_id", activeSeason.id)
              .eq("status", "Approved")
            registrations = regData || []
          }
          enhanced =
            otherPlayers?.map((p: any) => {
              const user = users?.find((u: any) => u.id === p.user_id)
              const reg = registrations.find((r) => r.user_id === p.user_id)
              return {
                ...p,
                users: {
                  id: user?.id || p.user_id,
                  email: user?.email,
                  gamer_tag_id: reg?.gamer_tag || user?.gamer_tag_id || "Unknown Player",
                  console: reg?.console || user?.console,
                  avatar_url: user?.avatar_url,
                },
                season_registrations: reg
                  ? [
                      {
                        season_id: activeSeason?.id,
                        season_number: activeSeason?.season_number,
                        primary_position: reg.primary_position,
                        secondary_position: reg.secondary_position,
                      },
                    ]
                  : [],
              }
            }) || []
        }
        setSelectedTeamPlayers(enhanced)

        const { data: theirPicks } = await supabase
          .from("tradeable_draft_picks")
          .select(
            `
            id, season_number, round, original_team_id, current_team_id, is_traded,
            original_team:teams!tradeable_draft_picks_original_team_id_fkey ( name, logo_url )
          `,
          )
          .eq("current_team_id", selectedTeamForTrade)
          .order("season_number", { ascending: true })
          .order("round", { ascending: true })
        setOtherTeamPicks((theirPicks as DraftPick[]) || [])

        setSelectedMyPicks([])
        setSelectedOtherPicks([])

        const otherCurrentSalary = otherPlayers?.reduce((sum: number, p: any) => sum + (p.salary || 0), 0) || 0
        setOtherTeamSalary(otherCurrentSalary)
        setProjectedOtherTeamSalary(otherCurrentSalary)
      } catch (e) {
        console.error("Error loading other team players:", e)
        setSelectedTeamPlayers([])
        setOtherTeamSalary(0)
        setProjectedOtherTeamSalary(0)
        setOtherTeamPicks([])
      }
    }
    loadOtherTeamPlayers()
  }, [selectedTeamForTrade, supabase])

  useEffect(() => {
    if (!selectedTeamForTrade || !teamData) {
      setProjectedTeamSalary(currentTeamSalary)
      setProjectedOtherTeamSalary(otherTeamSalary)
      return
    }
    const myPlayersToTrade = teamPlayers.filter((p) => selectedMyPlayers.includes(p.id))
    const otherPlayersToReceive = selectedTeamPlayers.filter((p) => selectedOtherPlayers.includes(p.id))

    const myOut = myPlayersToTrade.reduce((sum, p) => sum + (p.salary - (capSpaceWithholding[p.id] || 0)), 0)
    const otherIn = otherPlayersToReceive.reduce((sum, p) => sum + (p.salary || 0), 0)
    setProjectedTeamSalary(currentTeamSalary - myOut + otherIn)

    const otherOut = otherPlayersToReceive.reduce((sum, p) => sum + (p.salary || 0), 0)
    const myIn = myPlayersToTrade.reduce((sum, p) => sum + (p.salary - (capSpaceWithholding[p.id] || 0)), 0)
    setProjectedOtherTeamSalary(otherTeamSalary - otherOut + myIn)
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

  useEffect(() => {
    fetchData()
  }, [supabase, session])

  useEffect(() => {
    if (activeTab === "waivers" && teamData?.id) loadWaiversData()
  }, [activeTab, teamData?.id])

  useEffect(() => {
    if (activeTab === "free-agents" && teamData?.id) loadFreeAgents()
  }, [activeTab, teamData?.id])

  // ----------------------
  // Navigation helpers
  // ----------------------
  const handleTabChange = (value: string) => {
    try {
      router.push(`/management?tab=${value}`, { scroll: false })
    } catch (error) {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", value)
        window.history.replaceState({}, "", url.toString())
      }
    }
    setActiveTab(value)
  }

  // ----------------------
  // Guard
  // ----------------------
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

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* HEADER / SUMMARY (split out) */}
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
            <TeamSummaryHeader
              teamData={teamData}
              teamPlayersCount={teamPlayers.length}
              projectedRosterSize={projectedRosterSize}
              scheduledMatchesCount={teamMatches.filter((m: any) => m.status === "Scheduled").length}
              currentTeamSalary={currentTeamSalary}
              projectedSalary={projectedSalary}
            />

            {/* TABS */}
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
                  <span className="md-hidden">Schedule</span>
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

              {/* ROSTER */}
              <TabsContent value="roster">
                <TeamRosterTab
                  teamPlayers={teamPlayers}
                  getPositionAbbreviation={getPositionAbbreviation}
                  getPositionColor={getPositionColor}
                />
              </TabsContent>

              {/* AVAILABILITY */}
              <TabsContent value="availability">
                <TeamAvailTab teamId={teamData?.id} teamName={teamData?.name} />
              </TabsContent>

              {/* SCHEDULE */}
              <TabsContent value="schedule">
                <TeamScheduleTab teamData={teamData} teamMatches={teamMatches} />
              </TabsContent>

              {/* FREE AGENTS */}
              <TabsContent value="free-agents">
                <FreeAgentsTab
                  // summary widgets
                  currentTeamSalary={currentTeamSalary}
                  currentSalaryCap={currentSalaryCap}
                  projectedSalary={projectedSalary}
                  rosterCount={teamPlayers.length}
                  projectedRosterSize={projectedRosterSize}
                  teamPlayers={teamPlayers}
                  // filters
                  positionFilter={positionFilter}
                  nameFilter={nameFilter}
                  setPositionFilter={setPositionFilter}
                  setNameFilter={setNameFilter}
                  // data
                  teamData={teamData}
                  freeAgents={filteredFreeAgents}
                  freeAgentsRaw={freeAgents}
                  freeAgentsLoading={freeAgentsLoading}
                  freeAgentsError={freeAgentsError}
                  playerBids={playerBids}
                  isBiddingEnabled={isBiddingEnabled}
                  now={now}
                  // actions
                  reloadFreeAgents={loadFreeAgents}
                  handleBidClick={handleBidClick}
                  handleHistoryClick={handleHistoryClick}
                  formatTimeRemaining={formatTimeRemaining}
                  getPositionAbbreviation={getPositionAbbreviation}
                  getPositionColor={getPositionColor}
                />
              </TabsContent>

              {/* MY BIDS */}
              <TabsContent value="my-bids">
                <MyBidsTab
                  myBids={myBids}
                  activeBidsCount={activeBidsCount}
                  outbidCount={outbidCount}
                  formatTimeRemaining={formatTimeRemaining}
                  getPositionAbbreviation={getPositionAbbreviation}
                  getPositionColor={getPositionColor}
                />
              </TabsContent>

              {/* WAIVERS */}
              <TabsContent value="waivers">
                <WaiversTab
                  waivers={waivers}
                  loadingWaivers={loadingWaivers}
                  waiverError={waiverError}
                  reloadWaivers={loadWaiversData}
                  handleClaimPlayer={handleClaimPlayer}
                  now={now}
                  teamData={teamData}
                  teamPlayers={teamPlayers}
                  getPositionAbbreviation={getPositionAbbreviation}
                  getPositionColor={getPositionColor}
                  handleWaivePlayerAction={handleWaivePlayerAction}
                  waivingPlayers={waivingPlayers}
                  claimingWaivers={claimingWaivers}
                />
              </TabsContent>

              {/* TRADES */}
              <TabsContent value="trades">
                <TradesTab
                  /* data */
                  allTeams={allTeams}
                  teamData={teamData}
                  teamPlayers={teamPlayers}
                  selectedTeamPlayers={selectedTeamPlayers}
                  myPicks={myPicks}
                  otherTeamPicks={otherTeamPicks}
                  /* salary/cap */
                  currentSalaryCap={currentSalaryCap}
                  currentTeamSalary={currentTeamSalary}
                  projectedTeamSalary={projectedTeamSalary}
                  otherTeamSalary={otherTeamSalary}
                  projectedOtherTeamSalary={projectedOtherTeamSalary}
                  /* selections */
                  selectedTeamForTrade={selectedTeamForTrade}
                  setSelectedTeamForTrade={setSelectedTeamForTrade}
                  selectedMyPlayers={selectedMyPlayers}
                  setSelectedMyPlayers={setSelectedMyPlayers}
                  selectedOtherPlayers={selectedOtherPlayers}
                  setSelectedOtherPlayers={setSelectedOtherPlayers}
                  selectedMyPicks={selectedMyPicks}
                  setSelectedMyPicks={setSelectedMyPicks}
                  selectedOtherPicks={selectedOtherPicks}
                  setSelectedOtherPicks={setSelectedOtherPicks}
                  /* withholding */
                  capSpaceWithholding={capSpaceWithholding}
                  setCapSpaceWithholding={setCapSpaceWithholding}
                  getValidWithholdingAmounts={getValidWithholdingAmounts}
                  /* text + helpers */
                  tradeMessage={tradeMessage}
                  setTradeMessage={setTradeMessage}
                  formatPick={formatPick}
                  toggleFromArray={toggleFromArray}
                  getPositionAbbreviation={getPositionAbbreviation}
                  getPositionColor={getPositionColor}
                  /* actions/state */
                  isSubmittingTrade={isSubmittingTrade}
                  setIsSubmittingTrade={setIsSubmittingTrade}
                  tradeError={tradeError}
                  setTradeError={setTradeError}
                  tradeSuccess={tradeSuccess}
                  setTradeSuccess={setTradeSuccess}
                  handleTradeResponse={handleTradeResponse}
                  /* proposals */
                  incomingTradeProposals={incomingTradeProposals}
                  outgoingTradeProposals={outgoingTradeProposals}
                  isProcessingTradeResponse={isProcessingTradeResponse}
                  cancellingTrades={cancellingTrades}
                  setCancellingTrades={setCancellingTrades}
                  /* env/tools */
                  supabase={supabase}
                  session={session}
                  fetchTradeProposals={fetchTradeProposals}
                  toast={toast}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>

      {/* Bid Modal (unchanged) */}
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
