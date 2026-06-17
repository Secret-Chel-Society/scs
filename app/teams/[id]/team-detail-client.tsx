"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Trophy, Award, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import { Button } from "@/components/ui/button"
import { getTeamStats, getCurrentSeasonId } from "@/lib/team-utils"
import { formatStandingsRecord } from "@/lib/format-record"
import { GameAvailabilityButton } from "@/components/team-schedule/game-availability-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InjuryReserveButton } from "@/components/team-schedule/injury-reserve-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  computeSkaterOffenseRating, 
  computeSkaterDefenseRating, 
  computeGoalieRating, 
  normalizePos,
  type AggregatedSkater,
  type AggregatedGoalie
} from "@/lib/ratings"

interface PlayerStats {
  id: string
  player_id: string
  goals: number
  assists: number
  points: number
  saves?: number
  goals_against?: number
  shots_against?: number
  save_percentage?: number
  games_played?: number
  // Extended stats for rating calculation
  plus_minus?: number
  takeaways?: number
  giveaways?: number
  interceptions?: number
  hits?: number
  blocks?: number
  pass_completed?: number
  pass_attempted?: number
  wins?: number
  losses?: number
  otl?: number
  // Computed ratings
  rating?: number | null
  rating_label?: string | null
}

interface Player {
  id: string
  user_id: string
  team_id: string
  role: string
  salary: number
  user: {
    id: string
    email: string
    gamer_tag_id: string
    console: string
    primary_position?: string
    secondary_position?: string | null
    is_late_signup?: boolean
  }
  stats?: PlayerStats
}

interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  match_date: string
  status: string
  home_team: {
    id: string
    name: string
    logo_url: string | null
  }
  away_team: {
    id: string
    name: string
    logo_url: string | null
  }
}

interface TeamAward {
  id: string
  team_id: string
  award_type: string
  season_number: number
  year: number
  description: string | null
}

interface Team {
  id: string
  name: string
  logo_url: string | null
  wins: number
  losses: number
  otl: number
  otw?: number
  ffw?: number
  ffl?: number
  goals_for: number
  goals_against: number
  points: number
  games_played: number
  goal_differential: number
  awards?: TeamAward[]
}

// Position abbreviation mapping
function getPositionAbbreviation(position: string): string {
  const positionMap: Record<string, string> = {
    Goalie: "G",
    "Right Wing": "RW",
    "Left Wing": "LW",
    "Left Defense": "LD",
    "Right Defense": "RD",
    Center: "C",
    Forward: "F",
    Defense: "D",
    Defenseman: "D",
    G: "G",
    RW: "RW",
    LW: "LW",
    LD: "LD",
    RD: "RD",
    C: "C",
    F: "F",
    D: "D",
    "Right Defenseman": "RD",
    "Left Defenseman": "LD",
    "Right Defense": "RD",
    "Left Defense": "LD",
  }
  return positionMap[position] || position
}

export default function TeamDetailClient() {
  const params = useParams()
  const teamId = params.id as string
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [roster, setRoster] = useState<Player[]>([])
  const [tcRoster, setTcRoster] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [canManageTeam, setCanManageTeam] = useState(false)
  const [awards, setAwards] = useState<TeamAward[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [seasonUUID, setSeasonUUID] = useState<string | null>(null)
  const [currentUserPlayer, setCurrentUserPlayer] = useState<Player | null>(null)

  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(1)
  const [weekMatches, setWeekMatches] = useState<Match[]>([])

  // Check if user is on team (active roster OR training camp roster - both can set availability)
  const isUserOnTeam =
    roster.some((player) => player.user_id === session?.user?.id) ||
    tcRoster.some((player) => player.user_id === session?.user?.id)
  
  // Check if user is a team manager (GM, AGM, Owner)
  const userPlayerOnTeam = roster.find((player) => player.user_id === session?.user?.id)
  const isUserTeamManager = userPlayerOnTeam ? ["GM", "AGM", "Owner"].includes(userPlayerOnTeam.role) : false

  async function refreshTeamStats() {
    if (refreshing) return
    try {
      setRefreshing(true)
      const response = await fetch(`/api/teams/${teamId}/refresh-stats`, { method: "POST" })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to refresh team stats")
      }
      toast({
        title: "Team stats refreshed",
        description: "Team statistics have been recalculated based on match results.",
      })
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error refreshing team stats",
        description: error.message || "Failed to refresh team stats.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate weeks from matches
  const calculateWeeks = (matchesData: Match[]) => {
    if (!matchesData.length) return 1
    const sortedMatches = [...matchesData].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const lastMatchDate = new Date(sortedMatches[sortedMatches.length - 1].match_date)
    const timeDiff = lastMatchDate.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, weeksDiff + 1)
  }

  const getCurrentWeek = (matchesData: Match[]) => {
    if (!matchesData.length) return 1
    const today = new Date()
    const sortedMatches = [...matchesData].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const timeDiff = today.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000))
    const totalWeeks = calculateWeeks(matchesData)
    return Math.max(1, Math.min(weeksDiff + 1, totalWeeks))
  }

  const getWeekDateRange = (week: number) => {
    if (matches.length === 0) return ""
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const weekStartDate = new Date(firstMatchDate)
    weekStartDate.setDate(firstMatchDate.getDate() + (week - 1) * 7)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    return `${weekStartDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekEndDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`
  }

  useEffect(() => {
    if (matches.length > 0) {
      const weeks = calculateWeeks(matches)
      setTotalWeeks(weeks)
      const currentWeekNum = getCurrentWeek(matches)
      setCurrentWeek(currentWeekNum)
    }
  }, [matches])

  useEffect(() => {
    if (matches.length === 0) {
      setWeekMatches([])
      return
    }
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const weekStartDate = new Date(firstMatchDate)
    weekStartDate.setDate(firstMatchDate.getDate() + (currentWeek - 1) * 7)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)
    const filteredMatches = matches.filter((match) => {
      const matchDate = new Date(match.match_date)
      return matchDate >= weekStartDate && matchDate <= weekEndDate
    })
    setWeekMatches(filteredMatches)
  }, [matches, currentWeek])

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true)

        const seasonIdFromFunction = await getCurrentSeasonId()
        let seasonUUIDLocal: string | null = null
        let currentSeason: any = null

        if (seasonIdFromFunction) {
          if (typeof seasonIdFromFunction === "string" && seasonIdFromFunction.includes("-")) {
            const { data: seasonData } = await supabase
              .from("seasons")
              .select("id, season_number, name, parent_season_id")
              .eq("id", seasonIdFromFunction)
              .single()
            if (seasonData) {
              currentSeason = seasonData
              seasonUUIDLocal = seasonData.id
              setSeasonUUID(seasonData.id)
            }
          } else {
            const { data: seasonData } = await supabase
              .from("seasons")
              .select("id, season_number, name, parent_season_id")
              .eq("season_number", seasonIdFromFunction)
              .single()
            if (seasonData) {
              currentSeason = seasonData
              seasonUUIDLocal = seasonData.id
              setSeasonUUID(seasonData.id)
            }
          }
        }

        // Get team stats (standings-based)
        const teamStats = await getTeamStats(teamId, seasonUUIDLocal as any)
        if (!teamStats) {
          toast({
            title: "Team not found",
            description: "The team you are looking for does not exist or has been removed.",
            variant: "destructive",
          })
          return
        }

        // Fetch team details
        const { data: teamData, error: teamError } = await supabase.from("teams").select("*").eq("id", teamId).single()
        if (teamError) throw teamError

        setTeam({
          ...teamData,
          wins: teamStats.wins,
          losses: teamStats.losses,
          otl: teamStats.otl,
          otw: (teamStats as any).otw,
          ffw: (teamStats as any).ffw,
          ffl: (teamStats as any).ffl,
          goals_for: teamStats.goals_for,
          goals_against: teamStats.goals_against,
          points: teamStats.points,
          games_played: teamStats.games_played,
          goal_differential: teamStats.goal_differential,
        })

        // Team awards
        const { data: awardsData } = await supabase
          .from("team_awards")
          .select("*")
          .eq("team_id", teamId)
          .order("year", { ascending: false })
        setAwards(awardsData || [])

        // Basic roster - exclude TC players (they show in Training Camp section)
        const { data: allRosterData, error: rosterError } = await supabase
          .from("players")
          .select(`
            id, 
            user_id, 
            team_id, 
            role, 
            salary,
            is_tc,
            user:users(
              id, 
              email,
              gamer_tag_id,
              console
            )
          `)
          .eq("team_id", teamId)
          .order("role", { ascending: true })

        if (rosterError) throw rosterError

        // Filter out TC players on client side (Supabase boolean filters are problematic)
        const rosterData = allRosterData?.filter(p => p.is_tc !== true) || []

        // Decorate with season registration (positions)
        let rosterWithSeasonData = [...(rosterData as Player[])]
        let seasonForPositions = currentSeason
        let seasonIdForPositions = seasonUUIDLocal
        if (currentSeason?.name?.includes("(Playoffs)") && currentSeason?.parent_season_id) {
          const { data: parentSeasonData } = await supabase
            .from("seasons")
            .select("id, season_number, name")
            .eq("id", currentSeason.parent_season_id)
            .single()
          if (parentSeasonData) {
            seasonForPositions = parentSeasonData
            seasonIdForPositions = parentSeasonData.id
          }
        }

        if (seasonForPositions) {
          const { data: allSeasonRegs } = await supabase
            .from("season_registrations")
            .select("user_id, gamer_tag, primary_position, secondary_position, console, is_late_signup")
            .eq("season_number", seasonForPositions.season_number)

          if (allSeasonRegs && allSeasonRegs.length > 0) {
            const seasonRegMap = new Map(allSeasonRegs.map((reg: any) => [reg.user_id, reg]))
            rosterWithSeasonData = (rosterData as Player[]).map((player) => {
              const seasonReg = seasonRegMap.get(player.user_id)
              if (seasonReg) {
                return {
                  ...player,
                  user: {
                    ...player.user,
                    // Keep gamer_tag_id from users table (not season_registrations.gamer_tag)
                    // as it's the correct one for matching ea_player_stats
                    primary_position: seasonReg.primary_position,
                    secondary_position: seasonReg.secondary_position,
                    console: seasonReg.console || player.user.console,
                    is_late_signup: seasonReg.is_late_signup || false,
                  },
                }
              }
              return {
                ...player,
                user: {
                  ...player.user,
                  primary_position: "Forward",
                  secondary_position: null,
                },
              }
            })
          } else {
            rosterWithSeasonData = (rosterData as Player[]).map((player) => ({
              ...player,
              user: {
                ...player.user,
                primary_position: "Forward",
                secondary_position: null,
              },
            }))
          }
        } else {
          rosterWithSeasonData = (rosterData as Player[]).map((player) => ({
            ...player,
            user: {
              ...player.user,
              primary_position: "Forward",
              secondary_position: null,
            },
          }))
        }

        // Fetch Training Camp (TC) roster BEFORE the EA aggregation so their gamer tags
        // are included in the season stats lookup (otherwise TC stats get filtered out).
        const { data: tcRosterData } = await supabase
          .from("players")
          .select(`
            id, 
            user_id, 
            team_id, 
            role, 
            salary,
            is_tc,
            tc_team_id,
            user:users(
              id, 
              email,
              gamer_tag_id,
              console
            )
          `)
          .eq("is_tc", true)
          .eq("tc_team_id", teamId)
          .order("role", { ascending: true })

        // Get TC players' season registration data for positions
        let tcWithSeasonData = [...(tcRosterData || [])] as Player[]
        if (seasonForPositions && tcRosterData && tcRosterData.length > 0) {
          const tcUserIds = tcRosterData.map((p: any) => p.user_id)
          const { data: tcSeasonRegs } = await supabase
            .from("season_registrations")
            .select("user_id, gamer_tag, primary_position, secondary_position, console, is_late_signup")
            .eq("season_number", seasonForPositions.season_number)
            .in("user_id", tcUserIds)

          if (tcSeasonRegs && tcSeasonRegs.length > 0) {
            const tcRegMap = new Map(tcSeasonRegs.map((reg: any) => [reg.user_id, reg]))
            tcWithSeasonData = (tcRosterData as Player[]).map((player) => {
              const seasonReg = tcRegMap.get(player.user_id)
              if (seasonReg) {
                return {
                  ...player,
                  user: {
                    ...player.user,
                    // Keep gamer_tag_id from users table (not season_registrations.gamer_tag)
                    // as it's the correct, up-to-date one for matching ea_player_stats
                    primary_position: seasonReg.primary_position || undefined,
                    secondary_position: seasonReg.secondary_position || undefined,
                    console: seasonReg.console || player.user.console,
                    is_late_signup: seasonReg.is_late_signup || false,
                  },
                }
              }
              return player
            })
          }
        }

        // ========= NEW: Season-wide EA aggregation by player across ALL teams =========
        // We use the *season number* (integer) for ea_player_stats.season_id.
        const seasonNumber: number | undefined = seasonForPositions?.season_number
        let seasonEaStats: any[] = []

        if (seasonNumber !== undefined) {
          // Include BOTH the main roster and the TC roster gamer tags so TC players'
          // season stats are matched and aggregated too.
          const namesLower = new Set(
            [...rosterWithSeasonData, ...tcWithSeasonData]
              .map((p) => (p.user?.gamer_tag_id || "").trim().toLowerCase())
              .filter((n) => Boolean(n)),
          )

          // Fetch all stats for the season using pagination to bypass Supabase's 1000-row default cap.
          // Season tables can exceed 5000+ rows so we must fetch in batches.
          const PAGE_SIZE = 1000
          let allEaRows: any[] = []
          let fetchError: any = null
          let page = 0

          while (true) {
            const { data: pageData, error: pageError } = await supabase
              .from("ea_player_stats")
              .select(
                "player_name, match_id, team_id, goals, assists, position, saves, goals_against, glsaves, glga, glshots, save_pct, glsavepct, plus_minus, takeaways, giveaways, interceptions, hits, blocks, pass_attempts, pass_complete",
              )
              .eq("season_id", seasonNumber)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (pageError) {
              fetchError = pageError
              break
            }

            allEaRows = allEaRows.concat(pageData || [])

            // If we got fewer rows than the page size, we've reached the last page
            if (!pageData || pageData.length < PAGE_SIZE) break
            page++
          }

          if (fetchError) {
            console.error("EA NHL stats season-wide error:", fetchError)
            seasonEaStats = []
          } else {
            // Filter stats to only include players on this roster using case-insensitive match
            seasonEaStats = allEaRows.filter((row) => {
              const playerNameLower = (row.player_name || "").trim().toLowerCase()
              return namesLower.has(playerNameLower)
            })
          }
        }

        // Build a results map (W/L/OTL per match) from match scores, same approach as /statistics.
        // W/L/OTL is derived from the matches table (home_score/away_score + overtime), NOT ea_player_stats.
        // We fetch ALL completed matches for this team for the season — not just those referenced in
        // ea_player_stats — so that games without EA stats still count toward GP and W/L/OTL.
        const matchResultsMap = new Map<
          string,
          { home_team_id: string; away_team_id: string; home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }
        >()

        // Collect match ids from ea_player_stats (may be a subset of all played games)
        const eaMatchIds = new Set(seasonEaStats.map((row) => row.match_id).filter(Boolean) as string[])

        // Also fetch ALL team matches for this season from the matches table
        let allTeamMatchIds: string[] = []
        if (seasonUUIDLocal) {
          const { data: allTeamMatches } = await supabase
            .from("matches")
            .select("id, home_team_id, away_team_id, home_score, away_score, status, overtime, has_overtime")
            .eq("season_id", seasonUUIDLocal)
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .in("status", ["completed", "Completed", "final", "Final"])

          allTeamMatches?.forEach((m: any) => {
            allTeamMatchIds.push(String(m.id))
            if (m.home_score == null || m.away_score == null) return
            const isOT =
              m.overtime === true ||
              m.has_overtime === true ||
              (m.status && String(m.status).toLowerCase().includes("overtime")) ||
              (m.status && String(m.status).includes("(OT)"))
            let home: "W" | "L" | "OTL"
            let away: "W" | "L" | "OTL"
            if (m.home_score > m.away_score) {
              home = "W"
              away = isOT ? "OTL" : "L"
            } else if (m.away_score > m.home_score) {
              away = "W"
              home = isOT ? "OTL" : "L"
            } else {
              home = "OTL"
              away = "OTL"
            }
            matchResultsMap.set(String(m.id), {
              home_team_id: String(m.home_team_id),
              away_team_id: String(m.away_team_id),
              home_result: home,
              away_result: away,
            })
          })
        }

        // Fallback: also resolve any ea_player_stats match_ids not already in the map
        const missingMatchIds = Array.from(eaMatchIds).filter((id) => !matchResultsMap.has(id))
        if (missingMatchIds.length > 0) {
          const { data: extraMatches } = await supabase
            .from("matches")
            .select("id, home_team_id, away_team_id, home_score, away_score, status, overtime, has_overtime")
            .in("id", missingMatchIds)

          extraMatches?.forEach((m: any) => {
            if (m.home_score == null || m.away_score == null) return
            const isOT =
              m.overtime === true ||
              m.has_overtime === true ||
              (m.status && String(m.status).toLowerCase().includes("overtime")) ||
              (m.status && String(m.status).includes("(OT)"))
            let home: "W" | "L" | "OTL"
            let away: "W" | "L" | "OTL"
            if (m.home_score > m.away_score) {
              home = "W"
              away = isOT ? "OTL" : "L"
            } else if (m.away_score > m.home_score) {
              away = "W"
              home = isOT ? "OTL" : "L"
            } else {
              home = "OTL"
              away = "OTL"
            }
            matchResultsMap.set(String(m.id), {
              home_team_id: String(m.home_team_id),
              away_team_id: String(m.away_team_id),
              home_result: home,
              away_result: away,
            })
          })
        }

        // Build a case-insensitive aggregation keyed by gamer tag
        type Agg = {
          games: Set<string> // distinct match_id
          perMatchTeam: Map<string, string> // match_id -> team_id the player played for
          g: number
          a: number
          sv: number
          ga: number
          sh: number
          // Extended stats for ratings
          plusminus: number
          takeaways: number
          giveaways: number
          interceptions: number
          hits: number
          blocks: number
          pass_attempted: number
          pass_completed: number
          wins: number
          losses: number
          otl: number
        }
        const seasonAggByName = new Map<string, Agg>()

        for (const row of seasonEaStats) {
          const name = (row.player_name || "").trim().toLowerCase()
          if (!name) continue
          const rec: Agg =
            seasonAggByName.get(name) ||
            ({ 
              games: new Set<string>(), perMatchTeam: new Map<string, string>(), g: 0, a: 0, sv: 0, ga: 0, sh: 0,
              plusminus: 0, takeaways: 0, giveaways: 0, interceptions: 0, 
              hits: 0, blocks: 0, pass_attempted: 0, pass_completed: 0,
              wins: 0, losses: 0, otl: 0
            } as Agg)
          if (row.match_id) {
            rec.games.add(row.match_id)
            if (row.team_id) rec.perMatchTeam.set(String(row.match_id), String(row.team_id))
          }

          // skater tallies
          rec.g += row.goals ?? 0
          rec.a += row.assists ?? 0

          // goalie tallies
          const saves = row.saves ?? row.glsaves ?? 0
          const ga = row.goals_against ?? row.glga ?? 0
          const shots = row.glshots ?? (saves + ga) // fallback when glshots missing
          rec.sv += saves
          rec.ga += ga
          rec.sh += shots

          // Extended stats for ratings
          rec.plusminus += row.plus_minus ?? 0
          rec.takeaways += row.takeaways ?? 0
          rec.giveaways += row.giveaways ?? 0
          rec.interceptions += row.interceptions ?? 0
          rec.hits += row.hits ?? 0
          rec.blocks += row.blocks ?? 0
          rec.pass_attempted += row.pass_attempts ?? 0
          rec.pass_completed += row.pass_complete ?? 0

          seasonAggByName.set(name, rec)
        }

        // Credit W/L/OTL per distinct match using the match result + the team the player
        // played for in that match (mirrors the /statistics page logic).
        // Fallback: if the per-match team doesn't match either side, use this team's id.
        seasonAggByName.forEach((rec) => {
          rec.games.forEach((mid) => {
            const res = matchResultsMap.get(String(mid))
            if (!res) return
            const teamForMatch = rec.perMatchTeam.get(String(mid))
            let r: "W" | "L" | "OTL" | null = null
            if (teamForMatch === res.home_team_id) r = res.home_result
            else if (teamForMatch === res.away_team_id) r = res.away_result
            // Fallback: match team using the roster team id
            else if (String(teamId) === res.home_team_id) r = res.home_result
            else if (String(teamId) === res.away_team_id) r = res.away_result
            if (r === "W") rec.wins++
            else if (r === "L") rec.losses++
            else if (r === "OTL") rec.otl++
          })
        })

        // Merge season totals into a player (reused for both main roster and TC roster)
        const buildPlayerStats = (player: Player): Player => {
          const key = (player.user.gamer_tag_id || "").trim().toLowerCase()
          const agg = seasonAggByName.get(key)

          // Check if position includes goalie (for dual positions like G/LD)
          const pos = player.user.primary_position || ""
          const posUpper = pos.toUpperCase()
          const hasGoalie = posUpper === "G" || posUpper === "GOALIE" || posUpper.includes("G/") || posUpper.includes("/G")

          if (!agg) {
            // No stats found this season; keep zeros
            return {
              ...player,
              stats: {
                id: player.id,
                player_id: player.id,
                goals: 0,
                assists: 0,
                points: 0,
                games_played: 0,
                saves: 0,
                goals_against: 0,
                shots_against: 0,
                save_percentage: 0,
                rating: null,
                rating_label: null,
              },
            }
          }

          const gp = Math.max(agg.games.size, agg.wins + agg.losses + agg.otl)
          const goals = agg.g
          const assists = agg.a
          // Total shots faced = saves + goals against (same basis as /statistics page)
          const shotsAgainst = agg.sv + agg.ga
          const savePct = shotsAgainst > 0 ? (agg.sv / shotsAgainst) * 100 : 0

          // Compute rating based on position
          let rating: number | null = null
          let ratingLabel: string | null = null
          
          const normalizedPos = normalizePos(pos)
          
          if (normalizedPos === "G") {
            // Goalie rating
            const goalieData: AggregatedGoalie = {
              player_name: player.user.gamer_tag_id || "",
              position: "G",
              season_id: 0,
              games_played: gp,
              saves: agg.sv,
              goals_against: agg.ga,
              save_pct: shotsAgainst > 0 ? (agg.sv / shotsAgainst) : 0,
              total_shots_faced: shotsAgainst,
              wins: agg.wins,
              losses: agg.losses,
              otl: agg.otl,
            }
            const result = computeGoalieRating(goalieData)
            rating = result.rating
            ratingLabel = result.label
          } else if (normalizedPos === "LD" || normalizedPos === "RD") {
            // Defense rating
            const defenseData: AggregatedSkater = {
              player_name: player.user.gamer_tag_id || "",
              position: normalizedPos,
              season_id: 0,
              games_played: gp,
              goals: agg.g,
              assists: agg.a,
              plus_minus: agg.plusminus,
              takeaways: agg.takeaways,
              giveaways: agg.giveaways,
              interceptions: agg.interceptions,
              hits: agg.hits,
              blocks: agg.blocks,
              pass_attempted: agg.pass_attempted,
              pass_completed: agg.pass_completed,
              wins: agg.wins,
              losses: agg.losses,
              otl: agg.otl,
            }
            const result = computeSkaterDefenseRating(defenseData)
            rating = result.rating
            ratingLabel = result.label
          } else {
            // Offense rating (C, LW, RW, F)
            const offenseData: AggregatedSkater = {
              player_name: player.user.gamer_tag_id || "",
              position: normalizedPos,
              season_id: 0,
              games_played: gp,
              goals: agg.g,
              assists: agg.a,
              plus_minus: agg.plusminus,
              takeaways: agg.takeaways,
              giveaways: agg.giveaways,
              pass_attempted: agg.pass_attempted,
              pass_completed: agg.pass_completed,
              wins: agg.wins,
              losses: agg.losses,
              otl: agg.otl,
            }
            const result = computeSkaterOffenseRating(offenseData)
            rating = result.rating
            ratingLabel = result.label
          }

          // Always include both skater and goalie stats - UI will decide what to show
          return {
            ...player,
            stats: {
              id: player.id,
              player_id: player.id,
              goals,
              assists,
              points: goals + assists,
              games_played: gp,
              saves: agg.sv,
              goals_against: agg.ga,
              shots_against: shotsAgainst,
              save_percentage: savePct,
              plus_minus: agg.plusminus,
              takeaways: agg.takeaways,
              giveaways: agg.giveaways,
              wins: agg.wins,
              losses: agg.losses,
              otl: agg.otl,
              rating,
              rating_label: ratingLabel,
            },
          }
        }

        // Merge season totals into main roster
        const rosterWithStats: Player[] = rosterWithSeasonData.map(buildPlayerStats)

        setRoster(rosterWithStats)

        // Merge season totals into TC roster so their stats/record show like the main roster
        const tcWithStats: Player[] = tcWithSeasonData.map(buildPlayerStats)
        setTcRoster(tcWithStats)

        // Current user's player record (check active roster first, then TC roster)
        if (session?.user) {
          const userPlayer =
            rosterWithStats.find((player) => player.user_id === session.user.id) ||
            tcWithStats.find((player) => player.user_id === session.user.id)
          setCurrentUserPlayer(userPlayer || null)
        }

        // Team matches
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select(`
            id, 
            home_team_id, 
            away_team_id, 
            home_score, 
            away_score, 
            match_date, 
            status,
            home_team:teams!home_team_id(id, name, logo_url),
            away_team:teams!away_team_id(id, name, logo_url)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order("match_date", { ascending: true })

        if (matchesError) throw matchesError
        setMatches(matchesData || [])

        // Manage permissions (avoid 406)
        if (session?.user) {
          const { data: playerData } = await supabase
            .from("players")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("team_id", teamId)
            .maybeSingle()

          if (playerData) {
            const managerRoles = ["Owner", "GM", "AGM"]
            setCanManageTeam(managerRoles.includes(playerData.role))
          }
        }
      } catch (error: any) {
        console.error("Error in fetchTeamData:", error)
        toast({
          title: "Error loading team data",
          description: error.message || "Failed to load team data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchTeamData()
    }
  }, [supabase, toast, teamId, session])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/teams" className="text-muted-foreground hover:text-foreground">
            Back to Teams
          </Link>
        </div>
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/teams" className="text-muted-foreground hover:text-foreground">
            Back to Teams
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
            <p className="text-muted-foreground">The team you are looking for does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort roster by points
  const sortedRoster = [...roster].sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))

  // Position order priority
  const positionOrder: Record<string, number> = {
    LW: 1,
    "Left Wing": 1,
    C: 2,
    Center: 2,
    RW: 3,
    "Right Wing": 3,
    LD: 4,
    "Left Defense": 4,
    "Left Defenseman": 4,
    RD: 5,
    "Right Defense": 5,
    "Right Defenseman": 5,
    D: 5.5,
    Defense: 5.5,
    Defenseman: 5.5,
    F: 2.5,
    Forward: 2.5,
    G: 6,
    Goalie: 6,
  }

  // Helper to check if position includes goalie
  const isGoaliePosition = (position: string | undefined): boolean => {
    if (!position) return false
    const pos = position.toUpperCase()
    return pos === "G" || pos === "GOALIE" || pos.includes("G/") || pos.includes("/G")
  }

  // Helper to check if position includes skater positions
  const hasSkaterPosition = (position: string | undefined): boolean => {
    if (!position) return true // default to skater
    const pos = position.toUpperCase()
    const skaterPositions = ["LW", "C", "RW", "LD", "RD", "D", "F", "LEFT", "RIGHT", "CENTER", "DEFENSE", "FORWARD", "WING"]
    return skaterPositions.some((sp) => pos.includes(sp))
  }

  // Sort roster by position order, then by points (or SV% for goalies)
  const sortedRosterByPosition = [...roster].sort((a, b) => {
    const posA = a.user.primary_position || "Forward"
    const posB = b.user.primary_position || "Forward"
    
    // Get position order (use first part if dual position like G/LD)
    const posAFirst = posA.split("/")[0].trim()
    const posBFirst = posB.split("/")[0].trim()
    
    const orderA = positionOrder[posAFirst] ?? positionOrder[getPositionAbbreviation(posAFirst)] ?? 99
    const orderB = positionOrder[posBFirst] ?? positionOrder[getPositionAbbreviation(posBFirst)] ?? 99
    
    // Sort by position first
    if (orderA !== orderB) {
      return orderA - orderB
    }
    
    // Within same position, sort by points for skaters or SV% for goalies
    const isGoalieA = isGoaliePosition(posA) && !hasSkaterPosition(posA)
    const isGoalieB = isGoaliePosition(posB) && !hasSkaterPosition(posB)
    
    if (isGoalieA && isGoalieB) {
      // Both goalies - sort by SV% descending
      return (b.stats?.save_percentage || 0) - (a.stats?.save_percentage || 0)
    } else {
      // Skaters or mixed - sort by points descending
      return (b.stats?.points || 0) - (a.stats?.points || 0)
    }
  })

  // Split matches (kept for old view)
  const upcomingMatches = matches
    .filter((match) => match.status === "Scheduled")
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

  const completedMatches = matches
    .filter((match) => match.status === "Completed" || match.status === "completed")
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <Link href="/teams" className="text-muted-foreground hover:text-foreground">
              Back to Teams
            </Link>
          </div>

          {session?.user && (
            <Button variant="outline" size="sm" onClick={refreshTeamStats} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Stats
            </Button>
          )}
        </div>

        {/* Team Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative h-32 w-32">
                {team.logo_url ? (
                  <Image src={team.logo_url || "/placeholder.svg"} alt={team.name} fill className="object-contain" />
                ) : (
                  <TeamLogo teamName={team.name} size="xl" />
                )}
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
                <div className="text-lg text-muted-foreground mb-4">
                  Record: {formatStandingsRecord(team)}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.points}</div>
                    <div className="text-sm text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.games_played}</div>
                    <div className="text-sm text-muted-foreground">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.goals_for}</div>
                    <div className="text-sm text-muted-foreground">Goals For</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.goals_against}</div>
                    <div className="text-sm text-muted-foreground">Goals Against</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {team.goal_differential > 0 ? `+${team.goal_differential}` : team.goal_differential}
                    </div>
                    <div className="text-sm text-muted-foreground">Goal Differential</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Team Awards */}
        {awards && awards.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Team Awards
              </CardTitle>
              <CardDescription>Achievements and honors earned by {team.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {awards.map((award) => {
                  const isPresident = award.award_type === "President Trophy"
                  const isCup = award.award_type === "MGHL Cup"
                  return (
                    <div
                      key={award.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isPresident
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : isCup
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                          : "bg-muted/50"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          isPresident
                            ? "bg-blue-100 dark:bg-blue-800"
                            : isCup
                            ? "bg-yellow-100 dark:bg-yellow-800"
                            : "bg-muted"
                        }`}
                      >
                        {isPresident ? (
                          <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        ) : isCup ? (
                          <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                          <Award className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{award.award_type}</div>
                        <div className="text-sm text-muted-foreground">
                          Season {award.season_number} ({award.year})
                        </div>
                        {award.description && <div className="text-sm mt-1">{award.description}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="stats">Team Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Team Roster</CardTitle>
                <CardDescription>Players currently on {team.name}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {roster.length > 0 ? (
                  <div className="divide-y divide-border">
                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                      <div className="col-span-5">Player</div>
                      <div className="col-span-1 text-center">Record</div>
                      <div className="col-span-1 text-center">GP</div>
                      <div className="col-span-1 text-center">G</div>
                      <div className="col-span-1 text-center">A</div>
                      <div className="col-span-1 text-center">P</div>
                      <div className="col-span-1 text-center">SV%</div>
                      <div className="col-span-1 text-right">SAL</div>
                    </div>
                    
                    {sortedRosterByPosition.map((player) => {
                      const pos = player.user.primary_position || ""
                      const showGoalieStats = isGoaliePosition(pos)
                      const showSkaterStats = hasSkaterPosition(pos) || !isGoaliePosition(pos)
                      
                      const gp = player.stats?.games_played || 0
                      const ga = player.stats?.goals_against || 0
                      const svPct = player.stats?.save_percentage 
                        ? player.stats.save_percentage.toFixed(1) + "%" 
                        : "-"
                      
                      const rating = player.stats?.rating
                      
                      // Get W/L/OTL record
                      const wins = player.stats?.wins || 0
                      const losses = player.stats?.losses || 0
                      const otl = player.stats?.otl || 0
                      const record = `${wins}-${losses}-${otl}`
                      
                      // Get role badge color - only show Owner, GM, AGM
                      const getRoleBadge = (role: string) => {
                        switch (role) {
                          case "Owner":
                            return <Badge variant="default" className="bg-yellow-500/90 text-black text-[10px] px-1.5 py-0">Owner</Badge>
                          case "GM":
                            return <Badge variant="default" className="bg-blue-600 text-[10px] px-1.5 py-0">GM</Badge>
                          case "AGM":
                            return <Badge variant="default" className="bg-emerald-600 text-[10px] px-1.5 py-0">AGM</Badge>
                          default:
                            return null
                        }
                      }
                      
                      // Get rating color based on value
                      const getRatingColor = (r: number) => {
                        if (r >= 90) return "text-green-500"
                        if (r >= 85) return "text-lime-500"
                        if (r >= 80) return "text-yellow-500"
                        if (r >= 75) return "text-orange-500"
                        if (r >= 70) return "text-orange-600"
                        return "text-red-500"
                      }
                      
                      // Format salary
                      const salaryFormatted = player.salary >= 1000000 
                        ? `${(player.salary / 1000000).toFixed(1)}M`
                        : `${Math.round(player.salary / 1000)}K`
                      
                      const roleBadge = getRoleBadge(player.role)
                      
                      return (
                        <Link 
                          key={player.id} 
                          href={`/players/${player.id}`}
                          className="grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors items-center"
                        >
                          {/* Player info */}
                          <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">
                              {player.user.gamer_tag_id}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {getPositionAbbreviation(pos || "F")}
                              {player.user.secondary_position && `/${getPositionAbbreviation(player.user.secondary_position)}`}
                            </span>
                            {roleBadge}
                            {rating !== null && rating !== undefined && (
                              <span className={`text-xs font-bold ${getRatingColor(rating)}`}>
                                {rating}
                              </span>
                            )}
                            {player.user.is_late_signup && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0">LS</Badge>
                            )}
                          </div>
                          
                          {/* Stats */}
                          <div className="col-span-1 text-center text-sm tabular-nums">{record}</div>
                          <div className="col-span-1 text-center text-sm tabular-nums">{gp}</div>
                          <div className="col-span-1 text-center text-sm tabular-nums">
                            {showSkaterStats ? (player.stats?.goals || 0) : "-"}
                          </div>
                          <div className="col-span-1 text-center text-sm tabular-nums">
                            {showSkaterStats ? (player.stats?.assists || 0) : "-"}
                          </div>
                          <div className="col-span-1 text-center text-sm font-semibold tabular-nums">
                            {showSkaterStats ? (player.stats?.points || 0) : "-"}
                          </div>
                          <div className="col-span-1 text-center text-sm tabular-nums">
                            {showGoalieStats ? svPct : "-"}
                          </div>
                          <div className="col-span-1 text-right text-sm tabular-nums text-muted-foreground">
                            {salaryFormatted}
                          </div>
                        </Link>
                      )
                    })}
                    
                    {/* Training Camp Roster Section - inline after main roster */}
                    {tcRoster.length > 0 && (
                      <>
                        {/* TC Roster Header */}
                        <div className="px-4 py-2 bg-yellow-500/20 border-t border-yellow-500/30">
                          <span className="text-sm font-semibold text-yellow-500">Training Camp Roster</span>
                        </div>
                        
                        {/* TC Players */}
                        {tcRoster.map((player) => {
                          const pos = player.user.primary_position || ""
                          const isLateSignup = player.user.is_late_signup
                          const showGoalieStats = isGoaliePosition(pos)
                          const showSkaterStats = hasSkaterPosition(pos) || !isGoaliePosition(pos)

                          const gp = player.stats?.games_played || 0
                          const svPct = player.stats?.save_percentage
                            ? player.stats.save_percentage.toFixed(1) + "%"
                            : "-"
                          const rating = player.stats?.rating

                          // W/L/OTL record
                          const wins = player.stats?.wins || 0
                          const losses = player.stats?.losses || 0
                          const otl = player.stats?.otl || 0
                          const record = `${wins}-${losses}-${otl}`

                          const getRatingColor = (r: number) => {
                            if (r >= 90) return "text-green-500"
                            if (r >= 85) return "text-lime-500"
                            if (r >= 80) return "text-yellow-500"
                            if (r >= 75) return "text-orange-500"
                            if (r >= 70) return "text-orange-600"
                            return "text-red-500"
                          }

                          // Format salary (TC players have $0)
                          const salaryFormatted = player.salary >= 1000000 
                            ? `${(player.salary / 1000000).toFixed(1)}M`
                            : player.salary > 0 
                              ? `${Math.round(player.salary / 1000)}K`
                              : "$0"
                          
                          return (
                            <Link 
                              key={player.id} 
                              href={`/players/${player.id}`}
                              className="grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors items-center"
                            >
                              {/* Player info */}
                              <div className="col-span-5 flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">
                                  {player.user.gamer_tag_id}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {getPositionAbbreviation(pos || "F")}
                                  {player.user.secondary_position && `/${getPositionAbbreviation(player.user.secondary_position)}`}
                                </span>
                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50 text-[10px] px-1.5 py-0">TC</Badge>
                                {rating !== null && rating !== undefined && (
                                  <span className={`text-xs font-bold ${getRatingColor(rating)}`}>
                                    {rating}
                                  </span>
                                )}
                                {isLateSignup && (
                                  <Badge variant="destructive" className="text-[10px] px-1 py-0">LS</Badge>
                                )}
                              </div>
                              
                              {/* Stats */}
                              <div className="col-span-1 text-center text-sm tabular-nums">{record}</div>
                              <div className="col-span-1 text-center text-sm tabular-nums">{gp}</div>
                              <div className="col-span-1 text-center text-sm tabular-nums">
                                {showSkaterStats ? (player.stats?.goals || 0) : "-"}
                              </div>
                              <div className="col-span-1 text-center text-sm tabular-nums">
                                {showSkaterStats ? (player.stats?.assists || 0) : "-"}
                              </div>
                              <div className="col-span-1 text-center text-sm font-semibold tabular-nums">
                                {showSkaterStats ? (player.stats?.points || 0) : "-"}
                              </div>
                              <div className="col-span-1 text-center text-sm tabular-nums">
                                {showGoalieStats ? svPct : "-"}
                              </div>
                              <div className="col-span-1 text-right text-sm tabular-nums text-muted-foreground">
                                {salaryFormatted}
                              </div>
                            </Link>
                          )
                        })}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No players currently on this team.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Team Schedule</CardTitle>
                <CardDescription>Games for {team.name} organized by week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {totalWeeks > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(currentWeek - 1)}
                        disabled={currentWeek === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous Week
                      </Button>

                      <div className="text-center">
                        <div className="font-semibold">
                          Week {currentWeek} of {totalWeeks}
                        </div>
                        <div className="text-sm text-muted-foreground">{getWeekDateRange(currentWeek)}</div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(currentWeek + 1)}
                        disabled={currentWeek === totalWeeks}
                      >
                        Next Week
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <Select value={currentWeek.toString()} onValueChange={(v) => setCurrentWeek(Number(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                          <SelectItem key={week} value={week.toString()}>
                            Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isUserOnTeam && weekMatches.length > 0 && (
                  <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Week {currentWeek} Injury Reserve</h3>
                      <p className="text-sm text-muted-foreground">
                        Request IR for the entire week ({getWeekDateRange(currentWeek)})
                      </p>
                    </div>
                    <InjuryReserveButton
                      teamId={team.id}
                      isUserOnTeam={isUserOnTeam}
                      matches={weekMatches}
                      currentSeasonId={seasonUUID}
                    />
                  </div>
                )}

                {weekMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No games scheduled for Week {currentWeek}</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Matchup</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          {isUserOnTeam && <TableHead className="text-center">Availability</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weekMatches.map((match) => {
                          const matchDate = new Date(match.match_date)
                          const formattedDate = matchDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                          const formattedTime = matchDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })

                          return (
                            <TableRow key={match.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div>{formattedDate}</div>
                                    <div className="text-sm text-muted-foreground">{formattedTime}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Link href={`/matches/${match.id}`} className="hover:text-primary transition-colors">
                                  {match.home_team.name} vs {match.away_team.name}
                                  {(match.status === "Completed" || match.status === "completed") && (
                                    <div className="text-sm text-muted-foreground">
                                      {match.home_score} - {match.away_score}
                                    </div>
                                  )}
                                </Link>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    match.status === "Completed" || match.status === "completed"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                      : match.status === "In Progress"
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                  }`}
                                >
                                  {match.status}
                                </span>
                              </TableCell>
                              {isUserOnTeam && currentUserPlayer && (
                                <TableCell className="text-center">
                                  <GameAvailabilityButton
                                    matchId={match.id}
                                    playerId={currentUserPlayer.id}
                                    userId={session?.user?.id || ""}
                                    teamId={team.id}
                                  />
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Team Statistics</CardTitle>
                  <CardDescription>Overall performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">{team.games_played}</div>
                        <div className="text-sm text-muted-foreground">Games Played</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">{team.points}</div>
                        <div className="text-sm text-muted-foreground">Total Points</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.games_played > 0 ? ((team.wins / team.games_played) * 100).toFixed(1) : "0.0"}%
                        </div>
                        <div className="text-sm text-muted-foreground">Win Percentage</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.games_played > 0 ? (team.goals_for / team.games_played).toFixed(2) : "0.00"}
                        </div>
                        <div className="text-sm text-muted-foreground">Goals Per Game</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.games_played > 0 ? (team.goals_against / team.games_played).toFixed(2) : "0.00"}
                        </div>
                        <div className="text-sm text-muted-foreground">Goals Against Per Game</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.goal_differential > 0 ? `+${team.goal_differential}` : team.goal_differential}
                        </div>
                        <div className="text-sm text-muted-foreground">Goal Differential</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Leading players on the team</CardDescription>
                </CardHeader>
                <CardContent>
                  {roster.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Points Leaders</h3>
                        <div className="space-y-2">
                          {sortedRoster
                            .filter(
                              (player) =>
                                player.user.primary_position !== "G" && player.user.primary_position !== "Goalie",
                            )
                            .slice(0, 3)
                            .map((player, index) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                        <Link
                          href={`/players/${player.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {player.user.gamer_tag_id}
                          {player.user.is_late_signup && <span className="text-red-500 ml-1 text-xs font-bold">(LS)</span>}
                          {" "}(
                          {getPositionAbbreviation(player.user.primary_position || "Unknown")}
                          {player.user.secondary_position &&
                            `/${getPositionAbbreviation(player.user.secondary_position)}`}
                          )
                                  </Link>
                                </div>
                                <div className="font-bold">{player.stats?.points || 0} PTS</div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Goal Scorers</h3>
                        <div className="space-y-2">
                          {[...sortedRoster]
                            .filter(
                              (player) =>
                                player.user.primary_position !== "G" && player.user.primary_position !== "Goalie",
                            )
                            .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
                            .slice(0, 3)
                            .map((player, index) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                        <Link
                          href={`/players/${player.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {player.user.gamer_tag_id}
                          {player.user.is_late_signup && <span className="text-red-500 ml-1 text-xs font-bold">(LS)</span>}
                        </Link>
                      </div>
                      <div className="font-bold">{player.stats?.goals || 0} G</div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Goaltending</h3>
                        <div className="space-y-2">
                          {sortedRoster
                            .filter(
                              (player) =>
                                player.user.primary_position === "G" || player.user.primary_position === "Goalie",
                            )
                            .map((player) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                        <Link
                          href={`/players/${player.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {player.user.gamer_tag_id}
                          {player.user.is_late_signup && <span className="text-red-500 ml-1 text-xs font-bold">(LS)</span>}
                        </Link>
                        <div className="font-bold">
                                  {player.stats?.save_percentage !== undefined && player.stats.save_percentage > 0 ? (
                                    <div className="text-right">
                                      <div>{player.stats.save_percentage.toFixed(1)}% SV%</div>
                                      <div className="text-xs text-muted-foreground">
                                        {player.stats.saves}/
                                        {player.stats.shots_against ||
                                          (player.stats.saves || 0) + (player.stats.goals_against || 0)}{" "}
                                        ({player.stats.goals_against} GA)
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground">No stats</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          {sortedRoster.filter(
                            (player) => player.user.primary_position === "G" || player.user.primary_position === "Goalie",
                          ).length === 0 && (
                            <div className="text-center py-2 text-muted-foreground">No goalies on roster</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No player statistics available.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
