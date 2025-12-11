"use client"

import { useState, useEffect, useMemo } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Trophy,
  Search,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlayerClickableLinkFlexible } from "@/components/matches/player-clickable-link-flexible"
import { useMobile } from "@/hooks/use-mobile"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { mapEaPositionToStandard } from "@/lib/ea-position-mapper"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerStats } from "@/lib/statistics"

// ⭐ NEW: import ratings from lib
import { rateOffense, rateDefense, rateGoalie, lineupLabel } from "@/lib/ratings"

// --------------------------
// Weeks
// --------------------------
const SEASON_1_WEEKS = [
  { id: "all", name: "All Weeks", startDate: null, endDate: null },
  {
    id: "week1",
    name: "Week 1",
    startDate: "2025-09-30",
    endDate: "2025-10-06",
    displayName: "Week 1 (Sep 30 - Oct 6, 2025)",
  },
  {
    id: "week2",
    name: "Week 2",
    startDate: "2025-10-07",
    endDate: "2025-10-13",
    displayName: "Week 2 (Oct 7 - Oct 13, 2025)",
  },
  {
    id: "week3",
    name: "Week 3",
    startDate: "2025-10-14",
    endDate: "2025-10-20",
    displayName: "Week 3 (Oct 14 - Oct 20, 2025)",
  },
  {
    id: "week4",
    name: "Week 4",
    startDate: "2025-10-21",
    endDate: "2025-10-27",
    displayName: "Week 4 (Oct 21 - Oct 27, 2025)",
  },
  {
    id: "week5",
    name: "Week 5",
    startDate: "2025-10-28",
    endDate: "2025-11-03",
    displayName: "Week 5 (Oct 28 - Nov 3, 2025)",
  },
  {
    id: "week6",
    name: "Week 6",
    startDate: "2025-11-04",
    endDate: "2025-11-10",
    displayName: "Week 6 (Nov 4 - Nov 10, 2025)",
  },
  {
    id: "week7",
    name: "Week 7",
    startDate: "2025-11-11",
    endDate: "2025-11-17",
    displayName: "Week 7 (Nov 11 - Nov 17, 2025)",
  },
]

// --------------------------
// Types
// --------------------------
type SortConfig = { key: string; direction: "asc" | "desc" }

type TeamRow = { id: string; name: string; is_active: boolean; logo_url?: string | null; logo?: string | null }

type TeamStats = {
  id: string
  name: string
  wins: number
  losses: number
  otl: number
  points: number
  goals_for: number
  goals_against: number
  goal_differential: number
}

interface PlayerStatsWithInfo extends PlayerStats {
  name: string
  teamId: number
  teamName: string
  teamLogo: string
}

// --------------------------
// Small helpers
// --------------------------
const getTeamInitials = (teamName?: string | null) =>
  (teamName || "FA")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()

// Use whatever field your DB has (logo_url or logo). Fallback to initials.
const getTeamLogo = (team: Partial<TeamRow>) => team.logo_url || team.logo || null

// --------------------------
// PlayerCard (mobile)
// --------------------------
const PlayerCard = ({
  stat,
  rank,
  isDefense,
  isMobile,
  activeTab,
}: { stat: any; rank: number; isDefense?: boolean; isMobile: boolean; activeTab: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  let displayPosition = stat.position
  if (stat.position === "0") displayPosition = "G"
  else if (stat.position === "1") displayPosition = "RD"
  else if (stat.position === "2") displayPosition = "LD"
  else if (stat.position === "3") displayPosition = "RW"
  else if (stat.position === "4") displayPosition = "LW"
  else if (stat.position === "5") displayPosition = "C"

  const faceoffWins = stat.faceoffs_won || 0
  const faceoffTotal = stat.faceoffs_taken || 0
  const faceoffPct = faceoffTotal > 0 ? ((faceoffWins / faceoffTotal) * 100).toFixed(1) : "0.0"
  const passAttempts = stat.pass_attempted || 0
  const passCompletions = stat.pass_completed || 0
  const passPercentage = passAttempts > 0 ? ((passCompletions / passAttempts) * 100).toFixed(1) : "0.0"

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {rank}. <PlayerClickableLinkFlexible playerName={stat.player_name} />
        </CardTitle>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
          onClick={() => setIsExpanded(!isExpanded)}
        />
      </CardHeader>
      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="w-full">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                Team: <span className="font-semibold">{stat.team_name || "Free Agent"}</span>
              </div>
              <div>
                Position: <span className="font-semibold">{displayPosition}</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                  {isDefense
                    ? (stat.rating_defense ?? "—")
                    : (activeTab === "total"
                        ? (stat.rating_total ?? "—")
                        : (stat.rating_offense ?? "—"))}
                </span>
              </div>
              <div>
                GP: <span className="font-semibold">{stat.games_played || 0}</span>
              </div>
              <div>
                Goals: <span className="font-semibold">{stat.goals || 0}</span>
              </div>
              <div>
                Assists: <span className="font-semibold">{stat.assists || 0}</span>
              </div>
              <div>
                Points: <span className="font-semibold">{(stat.goals || 0) + (stat.assists || 0)}</span>
              </div>
              <div>
                +/-: <span className="font-semibold">{stat.plus_minus || 0}</span>
              </div>
              <div>
                SOG: <span className="font-semibold">{stat.shots || 0}</span>
              </div>
              <div>
                PIM: <span className="font-semibold">{stat.pim || 0}</span>
              </div>
              <div>
                Blocks: <span className="font-semibold">{stat.blocks || 0}</span>
              </div>
              <div>
                GVA: <span className="font-semibold">{stat.giveaways || 0}</span>
              </div>
              <div>
                TKA: <span className="font-semibold">{stat.takeaways || 0}</span>
              </div>
              <div>
                INT: <span className="font-semibold">{stat.interceptions || 0}</span>
              </div>
              <div>
                Pass%: <span className="font-semibold">{passPercentage}%</span>
              </div>
              <div>
                PassAtt: <span className="font-semibold">{stat.pass_attempted || 0}</span>
              </div>
              {!isDefense && (
                <>
                  <div>
                    FOW: <span className="font-semibold">{faceoffWins}</span>
                  </div>
                  <div>
                    FO%: <span className="font-semibold">{faceoffPct}%</span>
                  </div>
                </>
              )}
              <div>
                Record:{" "}
                <span className="font-semibold">
                  {stat.wins || 0}-{stat.losses || 0}-{stat.otl || 0}
                </span>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent />
        </Collapsible>
      </CardContent>
    </Card>
  )
}

// --------------------------
// GoalieCard (mobile)
// --------------------------
const GoalieCard = ({ stat, rank, isMobile }: { stat: any; rank: number; isMobile: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const savesPct = stat.save_pct ? (stat.save_pct * 100).toFixed(1) : "0.0"
  const gaa = stat.games_played > 0 ? (stat.goals_against / stat.games_played).toFixed(2) : "0.00"

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {rank}. <PlayerClickableLinkFlexible playerName={stat.player_name} />
        </CardTitle>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
          onClick={() => setIsExpanded(!isExpanded)}
        />
      </CardHeader>
      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="w-full">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                Team: <span className="font-semibold">{stat.team_name || "Free Agent"}</span>
              </div>
              <div>
                Rating:{" "}
                <span className="font-semibold">
                  {stat.rating_goalie ?? "—"}
                </span>
                {stat.rating_goalie_label && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                    {stat.rating_goalie_label}
                  </span>
                )}
              </div>
              <div>
                GP: <span className="font-semibold">{stat.games_played || 0}</span>
              </div>
              <div>
                Saves: <span className="font-semibold">{stat.saves || 0}</span>
              </div>
              <div>
                GA: <span className="font-semibold">{stat.goals_against || 0}</span>
              </div>
              <div>
                SV%: <span className="font-semibold">{savesPct}%</span>
              </div>
              <div>
                GAA: <span className="font-semibold">{gaa}</span>
              </div>
              <div>
                Record:{" "}
                <span className="font-semibold">
                  {stat.wins || 0}-{stat.losses || 0}-{stat.otl || 0}
                </span>
              </div>
              <div>
                Shots: <span className="font-semibold">{(stat.saves || 0) + (stat.goals_against || 0)}</span>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent />
        </Collapsible>
      </CardContent>
    </Card>
  )
}

// --------------------------
// Top-4 Leaders UI
// --------------------------
const FeaturedLeader = ({
  title,
  leader,
  team,
  metricLabel,
  metricValue,
}: {
  title: string
  leader: any
  team?: Partial<TeamRow> | null
  metricLabel: string
  metricValue: string | number
}) => {
  const logo = team ? getTeamLogo(team) : null
  const teamName = team?.name || leader?.team_name || "Free Agent"

  return (
    <Card className="relative overflow-hidden">
      {logo && (
        <div className="absolute inset-0 opacity-10">
          {/* background logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo || "/placeholder.svg"} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2">
          {logo ? (
            <div className="relative h-8 w-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo || "/placeholder.svg"} alt={teamName} className="h-8 w-8 object-contain" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
              {getTeamInitials(teamName)}
            </div>
          )}
          <span>{title}</span>
        </CardTitle>
        <CardDescription className="text-sm">
          {leader?.player_name} • {teamName}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold">{metricValue}</div>
        <div className="text-muted-foreground text-xs">{metricLabel}</div>
      </CardContent>
    </Card>
  )
}

const CompactLeaderRow = ({
  idx,
  player,
  valueLabel,
  value,
}: { idx: number; player: any; valueLabel: string; value: string | number }) => {
  return (
    <div className="flex items-center justify-between text-sm py-2 px-3 rounded-md hover:bg-muted/60">
      <div className="flex items-center gap-2">
        <div className="text-xs w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center">{idx}</div>
        <PlayerClickableLinkFlexible playerName={player.player_name} />
        <span className="text-muted-foreground text-xs">({player.team_name || "FA"})</span>
      </div>
      <div className="font-medium">
        {value}
        <span className="text-muted-foreground text-xs ml-1">{valueLabel}</span>
      </div>
    </div>
  )
}

const TopFourStrip = ({
  title,
  items,
  teamsById,
  valueKey,
  valueLabel,
  formatter,
}: {
  title: string
  items: any[]
  teamsById: Record<string, TeamRow>
  valueKey: string
  valueLabel: string
  formatter?: (n: number, player?: any) => string
}) => {
  const top4 = items.slice(0, 4)
  if (top4.length === 0) return null
  const one = top4[0]
  // 🔵 Prefer current roster team for display
  const team = teamsById[String(one.current_team_id || one.team_id)] || null
  const fmt = (n: number, player?: any) => (formatter ? formatter(n, player) : String(n))

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="md:col-span-2">
        <FeaturedLeader
          title={title}
          leader={one}
          team={team}
          metricLabel={valueLabel}
          metricValue={fmt(one[valueKey] ?? 0, one)}
        />
      </div>
      <Card className="md:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top 2–4</CardTitle>
          <CardDescription>Chasing the leader</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {top4.slice(1).map((p, i) => (
            <CompactLeaderRow
              key={`${p.player_name}-${i}`}
              idx={i + 2}
              player={p}
              valueLabel={valueLabel}
              value={fmt(p[valueKey] ?? 0, p)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// --------------------------
// --------------------------
const StatLeaderCard = ({
  title,
  items,
  teamsById,
  valueKey,
  valueLabel,
  formatter,
}: {
  title: string
  items: any[]
  teamsById: Record<string, TeamRow>
  valueKey: string
  valueLabel: string
  formatter?: (n: number, player?: any) => string
}) => {
  const top3 = items.slice(0, 3)
  if (top3.length === 0) return null
  const fmt = (n: number, player?: any) => (formatter ? formatter(n, player) : String(n))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top3.map((player, idx) => {
          // 🔵 Prefer current roster team for display
          const team = teamsById[String(player.current_team_id || player.team_id)] || null
          const logo = team ? getTeamLogo(team) : null
          const teamName = team?.name || player?.team_name || "Free Agent"

          return (
            <div
              key={`${player.player_name}-${idx}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition"
            >
              <div className="flex-shrink-0">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo || "/placeholder.svg"} alt={teamName} className="h-10 w-10 object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs font-bold">
                    {getTeamInitials(teamName)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  <PlayerClickableLinkFlexible playerName={player.player_name} />
                </div>
                <div className="text-xs text-muted-foreground truncate">{teamName}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold">{fmt(player[valueKey] ?? 0, player)}</div>
                <div className="text-xs text-muted-foreground">{valueLabel}</div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// --------------------------
// Page component
// --------------------------
export default function StatisticsPage() {
  const { supabase } = useSupabase()
  const isMobile = useMobile()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<any[]>([])
  const [selectedSeason, setSelectedSeason] = useState<any | null>(null)

  const [goalieStats, setGoalieStats] = useState<any[]>([])
  const [forwards, setForwards] = useState<any[]>([])
  const [defensemen, setDefensemen] = useState<any[]>([])
  const [totalPlayers, setTotalPlayers] = useState<any[]>([])

  const [playerNameToTeamMap, setPlayerNameToTeamMap] = useState<Record<string, any>>({})
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("all")

  const [activeTab, setActiveTab] = useState("total")
  const [selectedWeek, setSelectedWeek] = useState<string>("all")
  const [selectedMatchDate, setSelectedMatchDate] = useState<string>("all")
  const [matchDates, setMatchDates] = useState<{ date: string; displayName: string }[]>([])

  const [searchQuery, setSearchQuery] = useState<string>("")

  // sort & pagination (unchanged)
  const [totalSortConfig, setTotalSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [offenseSortConfig, setOffenseSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [defenseSortConfig, setDefenseSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [goalieSortConfig, setGoalieSortConfig] = useState<SortConfig>({ key: "save_pct", direction: "desc" })
  const [totalPage, setTotalPage] = useState(1)
  const [offensePage, setOffensePage] = useState(1)
  const [defensePage, setDefensePage] = useState(1)
  const [goaliePage, setGoaliePage] = useState(1)
  const playersPerPage = isMobile ? 10 : 20

  // --- helper fns
  const isDateInWeek = (matchDate: string, weekStart: string, weekEnd: string): boolean => {
    const date = new Date(matchDate + "T12:00:00")
    const start = new Date(weekStart + "T00:00:00")
    const end = new Date(weekEnd + "T23:59:59")
    return date >= start && date <= end
  }
  const getSelectedWeekInfo = () => SEASON_1_WEEKS.find((w) => w.id === selectedWeek) || SEASON_1_WEEKS[0]
  const getMatchDate = (match: any): string | null =>
    match.match_date ? match.match_date.toString().split("T")[0] : null

  // --------------------------
  // Fetch teams
  // --------------------------
  useEffect(() => {
    async function fetchTeams() {
      if (!selectedSeason) return

      const { data, error } = await supabase
        .from("team_seasons")
        .select(`
          team_id,
          teams (
            id,
            name,
            is_active,
            logo_url
          )
        `)
        .eq("is_active", true)
        .eq("season_id", selectedSeason.id)

      if (!error && data) {
        const activeTeams = data
          .filter((ts: any) => ts.teams)
          .map((ts: any) => ({
            id: ts.teams.id,
            name: ts.teams.name,
            is_active: ts.teams.is_active,
            logo_url: ts.teams.logo_url,
          })) as TeamRow[]

        setTeams(activeTeams)
      }
    }
    fetchTeams()
  }, [supabase, selectedSeason])

  // Build quick lookup by id
  const teamsById = useMemo(() => {
    const m: Record<string, TeamRow> = {}
    teams.forEach((t) => (m[String(t.id)] = t))
    return m
  }, [teams])

  // --------------------------
  // Fetch seasons
  // --------------------------
  useEffect(() => {
    async function fetchSeasons() {
      try {
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false })

        if (seasonsError) throw seasonsError

        if (seasonsData?.length) {
          setSeasons(seasonsData)
          const activeSeason = seasonsData.find((s) => s.is_active)
          setSelectedSeason(activeSeason || seasonsData[0])
        } else {
          const { data, error } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "current_season")
            .single()
          if (error) throw error
          const seasonNumber = Number.parseInt(String(data?.value ?? "1"), 10) || 1
          setSelectedSeason({
            id: seasonNumber.toString(),
            number: seasonNumber,
            name: `Season ${seasonNumber}`,
            is_active: true,
            is_playoffs: false,
          })
        }
      } catch (e: any) {
        setSelectedSeason({
          id: "1",
          number: 1,
          name: "Season 1",
          is_active: true,
          is_playoffs: false,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSeasons()
  }, [supabase])

  // --------------------------
  // Fetch player-name → current team map (from players table)
  // --------------------------
  useEffect(() => {
    async function fetchPlayerTeams() {
      const { data, error } = await supabase
        .from("players")
        .select("id, user_id, team_id, teams(id, name), users(id, gamer_tag_id)")
      if (error || !data) return
      const m: Record<string, any> = {}
      data.forEach((p: any) => {
        if (p?.users?.gamer_tag_id) {
          const tag = String(p.users.gamer_tag_id).toLowerCase()
          m[tag] = {
            player_id: p.id,
            team_id: p.team_id, // may be null
            team_name: p.teams?.name || "Free Agent",
          }
        }
      })
      setPlayerNameToTeamMap(m)
    }
    fetchPlayerTeams()
  }, [supabase])

  // --------------------------
  // Fetch distinct match dates for filter
  // --------------------------
  useEffect(() => {
    async function fetchMatchDates() {
      if (!selectedSeason) return
      try {
        const seasonId = selectedSeason.id
        const { data, error } = await supabase
          .from("matches")
          .select("match_date, season_id")
          .eq("season_id", seasonId)
          .order("match_date", { ascending: true })

        if (error) throw error
        if (data) {
          const dates = [...new Set(data.map((m: any) => getMatchDate(m)?.split("T")[0]))]
            .filter((d) => d)
            .map((dateString) => {
              const date = new Date(dateString!)
              return {
                date: dateString!,
                displayName: `${date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`,
              }
            })
          setMatchDates(dates)
          setSelectedMatchDate("all")
        }
      } catch (e: any) {
        console.error("Error fetching match dates:", e)
      }
    }
    fetchMatchDates()
  }, [supabase, selectedSeason])

  // --------------------------
  // Fetch & process stats
  // --------------------------
  useEffect(() => {
    async function fetchPlayerStats() {
      if (!selectedSeason) return
      try {
        setLoading(true)
        const seasonNumber = selectedSeason.season_number || selectedSeason.number || 1

        const { data: allPlayerStats, error: playerStatsError } = await supabase
          .from("ea_player_stats")
          .select("*")
          .eq("season_id", seasonNumber)

        if (playerStatsError || !allPlayerStats?.length) {
          setForwards([])
          setDefensemen([])
          setGoalieStats([])
          setTotalPlayers([])
          return
        }

        const allMatchIds = [...new Set(allPlayerStats.map((s) => s.match_id))]
        const { data: matchesData } = await supabase
          .from("matches")
          .select(
            "id, home_team_id, away_team_id, home_score, away_score, status, season_id, season_name, overtime, has_overtime, match_date",
          )
          .in("id", allMatchIds)

        // Week/day filtering
        let filtered = allPlayerStats
        const weekInfo = getSelectedWeekInfo()

        if (selectedWeek !== "all" && weekInfo.startDate && weekInfo.endDate && matchesData) {
          const weekMatchIds = new Set<string>()
          matchesData.forEach((m) => {
            const d = getMatchDate(m)
            if (d && isDateInWeek(d, weekInfo.startDate!, weekInfo.endDate!)) {
              if (selectedMatchDate === "all" || d === selectedMatchDate) {
                weekMatchIds.add(m.id)
              }
            }
          })
          filtered = allPlayerStats.filter((s) => weekMatchIds.has(s.match_id))
        } else if (selectedMatchDate !== "all" && matchesData) {
          const dateMatchIds = new Set<string>()
          matchesData.forEach((m) => {
            const d = getMatchDate(m)
            if (d === selectedMatchDate) dateMatchIds.add(m.id)
          })
          filtered = allPlayerStats.filter((s) => dateMatchIds.has(s.match_id))
        }

        // Build results map
        const matchResultsMap = new Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>()
        matchesData?.forEach((m) => {
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
          matchResultsMap.set(m.id, { home_result: home, away_result: away })
        })

        // Aggregate
        const matchDataMap = new Map(matchesData?.map((m) => [m.id, m]) || [])
        const offenseMap = new Map<string, any>()
        const defenseMap = new Map<string, any>()
        const goalieMap = new Map<string, any>()
        const totalMap = new Map<string, any>()

        // 🔵 store per-match team id to compute record correctly across team changes
        const init = (rawName: string, s: any) => ({
          player_name: rawName,
          position: s.position,
          season_id: s.season_id,
          games_played: 0,
          unique_matches: new Set<string>(),
          per_match_team: new Map<string, string>(), // NEW

          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,

          // keep a default team_id value; we will still hydrate current team later
          team_id: String(s.team_id),
          current_team_id: String(s.team_id),
        })

        const add = (agg: any, s: any, isGoalie: boolean) => {
          agg.unique_matches.add(s.match_id)
          // NEW: remember the team in THIS match
          agg.per_match_team.set(String(s.match_id), String(s.team_id))

          agg.goals += s.goals || 0
          agg.assists += s.assists || 0
          agg.plus_minus += s.plus_minus || 0
          agg.pim += s.pim || 0
          agg.shots += s.shots || 0
          agg.hits += s.hits || 0
          agg.blocks += s.blocks || 0
          agg.takeaways += s.takeaways || 0
          agg.giveaways += s.giveaways || 0
          agg.faceoffs_won += s.faceoffs_won || 0
          agg.faceoffs_taken += s.faceoffs_taken || 0
          agg.pass_attempted += s.pass_attempts || s.pass_attempted || 0
          agg.pass_completed += s.pass_complete || s.pass_completed || 0
          agg.interceptions += s.interceptions || 0
          if (isGoalie) {
            agg.saves += s.saves || 0
            agg.goals_against += s.goals_against || 0
            agg.glshots += s.glshots || 0
            agg.total_shots_faced += (s.saves || 0) + (s.goals_against || 0)
          }
          agg.points = agg.goals + agg.assists
        }

        filtered.forEach((s) => {
          const name = (s.player_name || "").toString()
          if (!name) return
          const pos = mapEaPositionToStandard(s.position || "")
          const isOff = ["C", "LW", "RW", "5", "4", "3"].includes(pos as any)
          const isDef = ["LD", "RD", "2", "1"].includes(pos as any)
          const isG = ["G", "0"].includes(pos as any)

          if (isOff) {
            if (!offenseMap.has(name)) offenseMap.set(name, init(name, s))
            add(offenseMap.get(name), s, false)
          }
          if (isDef) {
            if (!defenseMap.has(name)) defenseMap.set(name, init(name, s))
            add(defenseMap.get(name), s, false)
          }
          if (isG) {
            if (!goalieMap.has(name)) goalieMap.set(name, init(name, s))
            add(goalieMap.get(name), s, true)
          }
          if (isOff || isDef) {
            if (!totalMap.has(name)) totalMap.set(name, init(name, s))
            add(totalMap.get(name), s, false)
          }
        })

        // 🔵 finalize: compute record using per-match team id; hydrate & filter by current roster team
        const finalize = (map: Map<string, any>) => {
          const arr: any[] = []
          map.forEach((p) => {
            p.games_played = p.unique_matches.size

            // W-L-OTL from the team they played for in that match
            p.unique_matches.forEach((mid: string) => {
              const res = matchResultsMap.get(mid)
              const md = matchDataMap.get(mid)
              if (!res || !md) return

              const teamIdForThisMatch = p.per_match_team.get(mid) ?? p.team_id
              let r: "W" | "L" | "OTL" | null = null
              if (String(teamIdForThisMatch) === String(md.home_team_id)) r = res.home_result
              else if (String(teamIdForThisMatch) === String(md.away_team_id)) r = res.away_result

              if (r === "W") p.wins++
              else if (r === "L") p.losses++
              else if (r === "OTL") p.otl++
            })

            p.faceoffs_lost = p.faceoffs_taken - p.faceoffs_won
            if ((p.position === "G" || p.position === "0") && p.total_shots_faced > 0) {
              p.save_pct = p.saves / p.total_shots_faced
            }

            // hydrate roster team for display/filter
            const tag = p.player_name?.toLowerCase?.()
            const roster = playerNameToTeamMap[tag || ""]
            if (roster?.team_id) {
              p.current_team_id = String(roster.team_id)
              p.team_name = roster.team_name || teamsById[String(roster.team_id)]?.name || "Free Agent"
            } else {
              p.current_team_id = String(p.team_id)
              p.team_name = teamsById[String(p.team_id)]?.name || "Free Agent"
            }

            // filter by CURRENT roster team
            if (selectedTeam === "all" || String(p.current_team_id) === String(selectedTeam)) {
              arr.push(p)
            }
          })
          return arr
        }

        const offensePlayers = finalize(offenseMap).map(p => {
          const r = rateOffense(p)
          return { ...p, rating_offense: r?.rating ?? null, rating_offense_label: r?.label ?? null }
        })

        const defensePlayers = finalize(defenseMap).map(p => {
          const r = rateDefense(p)
          return { ...p, rating_defense: r?.rating ?? null, rating_defense_label: r?.label ?? null }
        })

        const goaliePlayers = finalize(goalieMap).map(p => {
          const r = rateGoalie(p)
          return { ...p, rating_goalie: r?.rating ?? null, rating_goalie_label: r?.label ?? null }
        })

        const defByName = new Map(defensePlayers.map(p => [p.player_name, p]))
        const offByName = new Map(offensePlayers.map(p => [p.player_name, p]))

        const totalPlayers = finalize(totalMap).map(p => {
          const off = offByName.get(p.player_name)?.rating_offense ?? null
          const def = defByName.get(p.player_name)?.rating_defense ?? null
          let ovr: number | null = null
          if (off != null && def != null) ovr = Math.round((off + def) / 2)
          else if (off != null) ovr = off
          else if (def != null) ovr = def
          return { ...p, rating_total: ovr, rating_total_label: ovr==null ? null : lineupLabel(ovr) }
        })

        setForwards(offensePlayers)
        setDefensemen(defensePlayers)
        setGoalieStats(goaliePlayers)
        setTotalPlayers(totalPlayers)
      } catch (e: any) {
        setError(e.message || "Error fetching stats")
      } finally {
        setLoading(false)
      }
    }
    fetchPlayerStats()
  }, [supabase, selectedSeason, selectedWeek, selectedTeam, selectedMatchDate, playerNameToTeamMap, teamsById])

  // --------------------------
  // Sorting, search, pagination
  // --------------------------
  const sortPlayers = (players: any[], sortConfig: SortConfig, tab: string) =>
    [...players].sort((a, b) => {
      let av: number;
      let bv: number;
      switch (sortConfig.key) {
        case "rating": {
          const getRating = (p: any) => (
            tab === "goalies" ? (p.rating_goalie  ?? -1) :
            tab === "offense" ? (p.rating_offense ?? -1) :
            tab === "defense" ? (p.rating_defense ?? -1) :
                                (p.rating_total   ?? -1)
          );
          av = getRating(a);
          bv = getRating(b);
          break;
        }
        case "points": {
          av = (a.goals || 0) + (a.assists || 0);
          bv = (b.goals || 0) + (b.assists || 0);
          break;
        }
        case "ppg": {
          const ap = (a.goals || 0) + (a.assists || 0);
          const bp = (b.goals || 0) + (b.assists || 0);
          av = a.games_played > 0 ? ap / a.games_played : 0;
          bv = b.games_played > 0 ? bp / b.games_played : 0;
          break;
        }
        case "save_pct": {
          av = a.save_pct || 0;
          bv = b.save_pct || 0;
          break;
        }
        case "faceoff_pct": {
          const at = a.faceoffs_taken || 0;
          const bt = b.faceoffs_taken || 0;
          av = at > 0 ? (a.faceoffs_won || 0) / at : 0;
          bv = bt > 0 ? (b.faceoffs_won || 0) / bt : 0;
          break;
        }
        case "pass_pct": {
          const aa = a.pass_attempted || 0;
          const ba = b.pass_attempted || 0;
          av = aa > 0 ? (a.pass_completed || 0) / aa : 0;
          bv = ba > 0 ? (b.pass_completed || 0) / ba : 0;
          break;
        }
        case "gaa": {
          av = a.games_played > 0 ? (a.goals_against || 0) / a.games_played : 0;
          bv = b.games_played > 0 ? (b.goals_against || 0) / b.games_played : 0;
          break;
        }
        default: {
          av = a[sortConfig.key] || 0;
          bv = b[sortConfig.key] || 0;
        }
      }
      return sortConfig.direction === "asc" ? av - bv : bv - av;
    });

  const handleSort = (key: string) => {
    const map: Record<string, [SortConfig, (c: SortConfig) => void]> = {
      total: [totalSortConfig, setTotalSortConfig],
      offense: [offenseSortConfig, setOffenseSortConfig],
      defense: [defenseSortConfig, setDefenseSortConfig],
      goalies: [goalieSortConfig, setGoalieSortConfig],
    }
    const [cur, set] = map[activeTab] || [totalSortConfig, setTotalSortConfig]
    const direction = cur.key === key && cur.direction === "desc" ? "asc" : "desc"
    set({ key, direction })
  }

  const getSortIcon = (key: string) => {
    const map: Record<string, SortConfig> = {
      total: totalSortConfig,
      offense: offenseSortConfig,
      defense: defenseSortConfig,
      goalies: goalieSortConfig,
    }
    const cur = map[activeTab]
    if (!cur) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    if (cur.key === key)
      return cur.direction === "desc" ? (
        <ChevronDown className="h-3 w-3 ml-1" />
      ) : (
        <ChevronUp className="h-3 w-3 ml-1" />
      )
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
  }

  const filterPlayersBySearch = (players: any[]) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return players
    return players.filter((p) => p.player_name?.toLowerCase().includes(q))
  }

  useEffect(() => {
    setTotalPage(1)
    setOffensePage(1)
    setDefensePage(1)
    setGoaliePage(1)
  }, [activeTab, selectedSeason, selectedWeek, selectedMatchDate, selectedTeam, searchQuery])

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / playersPerPage)
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const renderPlayerStatsTable = (
    players: any[],
    isDefense = false,
    currentPage = 1,
    onPageChange: (page: number) => void,
  ) => {
    const filtered = filterPlayersBySearch(players)
    if (!filtered.length)
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? `No players found matching "${searchQuery}"` : "No player statistics available"}
          </p>
        </div>
      )

    const sortMap: Record<string, SortConfig> = {
      total: totalSortConfig,
      offense: offenseSortConfig,
      defense: defenseSortConfig,
    }
    const sorted = sortPlayers(filtered, sortMap[activeTab] || { key: "points", direction: "desc" }, activeTab)
    const startIndex = (currentPage - 1) * playersPerPage
    const paginated = sorted.slice(startIndex, startIndex + playersPerPage)

    if (isMobile) {
      return (
        <div>
          <div className="space-y-3">
            {paginated.map((stat, idx) => (
              <PlayerCard
                key={`${stat.player_name}-${idx}`}
                stat={stat}
                rank={startIndex + idx + 1}
                isDefense={isDefense}
                isMobile={isMobile}
                activeTab={activeTab}
              />
            ))}
          </div>
          {renderPagination(currentPage, sorted.length, onPageChange)}
        </div>
      )
    }

    return (
      <div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm min-w-[40px]">Rank</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[140px]">Player</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[100px]">Team</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[40px]">Pos</TableHead>
                <TableHead
                  className="text-xs md:text-sm min-w-[60px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("rating")}
                >
                  <div className="flex items-center">Rating{getSortIcon("rating")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[40px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("games_played")}
                >
                  <div className="flex items-center justify-end">GP{getSortIcon("games_played")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("goals")}
                >
                  <div className="flex items-center justify-end">Goals{getSortIcon("goals")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("assists")}
                >
                  <div className="flex items-center justify-end">Assists{getSortIcon("assists")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("points")}
                >
                  <div className="flex items-center justify-end">Pts{getSortIcon("points")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("ppg")}
                >
                  <div className="flex items-center justify-end">PPG{getSortIcon("ppg")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("plus_minus")}
                >
                  <div className="flex items-center justify-end">+/-{getSortIcon("plus_minus")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("shots")}
                >
                  <div className="flex items-center justify-end">SOG{getSortIcon("shots")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("hits")}
                >
                  <div className="flex items-center justify-end">Hits{getSortIcon("hits")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pim")}
                >
                  <div className="flex items-center justify-end">PIM{getSortIcon("pim")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("blocks")}
                >
                  <div className="flex items-center justify-end">Blocks{getSortIcon("blocks")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("takeaways")}
                >
                  <div className="flex items-center justify-end">TKA{getSortIcon("takeaways")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("giveaways")}
                >
                  <div className="flex items-center justify-end">GVA{getSortIcon("giveaways")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("interceptions")}
                >
                  <div className="flex items-center justify-end">INT{getSortIcon("interceptions")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pass_pct")}
                >
                  <div className="flex items-center justify-end">Pass%{getSortIcon("pass_pct")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pass_attempted")}
                >
                  <div className="flex items-center justify-end">PassAtt{getSortIcon("pass_attempted")}</div>
                </TableHead>
                {!isDefense && (
                  <>
                    <TableHead
                      className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("faceoffs_won")}
                    >
                      <div className="flex items-center justify-end">FOW{getSortIcon("faceoffs_won")}</div>
                    </TableHead>
                    <TableHead
                      className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("faceoff_pct")}
                    >
                      <div className="flex items-center justify-end">FO%{getSortIcon("faceoff_pct")}</div>
                    </TableHead>
                  </>
                )}
                <TableHead className="text-right text-xs md:text-sm min-w-[80px]">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((stat, index) => {
                const rank = startIndex + index + 1
                let displayPosition = stat.position
                if (stat.position === "0") displayPosition = "G"
                else if (stat.position === "1") displayPosition = "RD"
                else if (stat.position === "2") displayPosition = "LD"
                else if (stat.position === "3") displayPosition = "RW"
                else if (stat.position === "4") displayPosition = "LW"
                else if (stat.position === "5") displayPosition = "C"
                const faceoffWins = stat.faceoffs_won || 0
                const faceoffTotal = stat.faceoffs_taken || 0
                const faceoffPct = faceoffTotal > 0 ? ((faceoffWins / faceoffTotal) * 100).toFixed(1) : "0.0"
                const passAttempts = stat.pass_attempted || 0
                const passCompletions = stat.pass_completed || 0
                const passPercentage = passAttempts > 0 ? ((passCompletions / passAttempts) * 100).toFixed(1) : "0.0"
                const points = (stat.goals || 0) + (stat.assists || 0)
                const ppg = stat.games_played > 0 ? (points / stat.games_played).toFixed(2) : "0.00"

                return (
                  <TableRow key={`${stat.player_name}-${index}`}>
                    <TableCell className="text-xs md:text-sm font-medium">{rank}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <PlayerClickableLinkFlexible playerName={stat.player_name} />
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{stat.team_name || "Free Agent"}</TableCell>
                    <TableCell className="text-xs md:text-sm">{displayPosition}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {activeTab === "offense" && stat.rating_offense != null && (
                        <span className="font-medium">{stat.rating_offense}</span>
                      )}
                      {activeTab === "defense" && stat.rating_defense != null && (
                        <span className="font-medium">{stat.rating_defense}</span>
                      )}
                      {activeTab === "total" && stat.rating_total != null && (
                        <span className="font-medium">{stat.rating_total}</span>
                      )}
                      {(activeTab === "offense" && stat.rating_offense_label) ||
                      (activeTab === "defense" && stat.rating_defense_label) ||
                      (activeTab === "total"   && stat.rating_total_label) ? (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                          {
                            activeTab === "offense" ? stat.rating_offense_label :
                            activeTab === "defense" ? stat.rating_defense_label :
                            stat.rating_total_label
                          }
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.games_played || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.goals || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.assists || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm font-medium">{points}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{ppg}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.plus_minus || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.shots || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.hits || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.pim || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.blocks || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.takeaways || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.giveaways || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.interceptions || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{passPercentage}%</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.pass_attempted || 0}</TableCell>
                    {!isDefense && (
                      <>
                        <TableCell className="text-right text-xs md:text-sm">{faceoffWins}</TableCell>
                        <TableCell className="text-right text-xs md:text-sm">{faceoffPct}%</TableCell>
                      </>
                    )}
                    <TableCell className="text-right text-xs md:text-sm">
                      {stat.wins || 0}-{stat.losses || 0}-{stat.otl || 0}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {renderPagination(currentPage, sorted.length, onPageChange)}
      </div>
    )
  }

  const renderGoalieStatsTable = (goalies: any[], currentPage = 1, onPageChange: (page: number) => void) => {
    const filtered = filterPlayersBySearch(goalies)
    if (!filtered.length)
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? `No goalies found matching "${searchQuery}"` : "No goalie statistics available"}
          </p>
        </div>
      )
    const sorted = sortPlayers(filtered, goalieSortConfig, "goalies")
    const startIndex = (currentPage - 1) * playersPerPage
    const paginated = sorted.slice(startIndex, startIndex + playersPerPage)

    if (isMobile) {
      return (
        <div>
          <div className="space-y-3">
            {paginated.map((stat, idx) => (
              <GoalieCard
                key={`${stat.player_name}-${idx}`}
                stat={stat}
                rank={startIndex + idx + 1}
                isMobile={isMobile}
              />
            ))}
          </div>
          {renderPagination(currentPage, sorted.length, onPageChange)}
        </div>
      )
    }

    return (
      <div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm min-w-[40px]">Rank</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[120px]">Player</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[100px]">Team</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[60px]">Rating</TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[40px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("games_played")}
                >
                  <div className="flex items-center justify-end">GP{getSortIcon("games_played")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("saves")}
                >
                  <div className="flex items-center justify-end">Saves{getSortIcon("saves")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("goals_against")}
                >
                  <div className="flex items-center justify-end">GA{getSortIcon("goals_against")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bgMuted/50"
                  onClick={() => handleSort("save_pct")}
                >
                  <div className="flex items-center justify-end">SV%{getSortIcon("save_pct")}</div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("gaa")}
                >
                  <div className="flex items-center justify-end">GAA{getSortIcon("gaa")}</div>
                </TableHead>
                <TableHead className="text-right text-xs md:text-sm min-w-[80px]">Record</TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("total_shots_faced")}
                >
                  <div className="flex items-center justify-end">Shots{getSortIcon("total_shots_faced")}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((stat, index) => {
                const rank = startIndex + index + 1
                const savesPct = stat.save_pct ? (stat.save_pct * 100).toFixed(1) : "0.0"
                const gaa = stat.games_played > 0 ? (stat.goals_against / stat.games_played).toFixed(2) : "0.00"
                return (
                  <TableRow key={`${stat.player_name}-${index}`}>
                    <TableCell className="text-xs md:text-sm font-medium">{rank}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <PlayerClickableLinkFlexible playerName={stat.player_name} />
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{stat.team_name || "Free Agent"}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {stat.rating_goalie != null ? (
                        <>
                          <span className="font-medium">{stat.rating_goalie}</span>
                          {stat.rating_goalie_label && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted">{stat.rating_goalie_label}</span>
                          )}
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.games_played || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.saves || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{stat.goals_against || 0}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm font-medium">{savesPct}%</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">{gaa}</TableCell>
                    <TableCell className="text-right text-xs md:text-sm">
                      {stat.wins || 0}-{stat.losses || 0}-{stat.otl || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs md:text-sm">
                      {(stat.saves || 0) + (stat.goals_against || 0)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {renderPagination(currentPage, sorted.length, onPageChange)}
      </div>
    )
  }

  const exportToCSV = () => {
    let data: any[] = []
    let filename = ""

    switch (activeTab) {
      case "total":
        data = sortPlayers(filterPlayersBySearch(totalPlayers), totalSortConfig, "total")
        filename = "total-stats.csv"
        break
      case "offense":
        data = sortPlayers(filterPlayersBySearch(forwards), offenseSortConfig, "offense")
        filename = "offense-stats.csv"
        break
      case "defense":
        data = sortPlayers(filterPlayersBySearch(defensemen), defenseSortConfig, "defense")
        filename = "defense-stats.csv"
        break
      case "goalies":
        data = sortPlayers(filterPlayersBySearch(goalieStats), goalieSortConfig, "goalies")
        filename = "goalie-stats.csv"
        break
    }

    if (data.length === 0) {
      alert("No data to export")
      return
    }

    let csvContent = ""

    if (activeTab === "goalies") {
      csvContent =
        "Rank,Player,Team,GP,Saves,GA,SV%,GAA,Wins,Losses,OTL,Shots\n" +
        data
          .map((stat, index) => {
            const rank = index + 1
            const savesPct = stat.save_pct ? (stat.save_pct * 100).toFixed(1) : "0.0"
            const gaa = stat.games_played > 0 ? (stat.goals_against / stat.games_played).toFixed(2) : "0.00"
            const shots = (stat.saves || 0) + (stat.goals_against || 0)
            return `${rank},"${stat.player_name}","${stat.team_name || "Free Agent"}",${stat.games_played || 0},${stat.saves || 0},${stat.goals_against || 0},${savesPct},${gaa},${stat.wins || 0},${stat.losses || 0},${stat.otl || 0},${shots}`
          })
          .join("\n")
    } else {
      const isDefense = activeTab === "defense"
      let headers =
        "Rank,Player,Team,Position,GP,Goals,Assists,Points,PPG,+/-,SOG,Hits,PIM,Blocks,TKA,GVA,INT,Pass%,PassAtt"
      if (!isDefense) {
        headers += ",FOW,FO%"
      }
      headers += ",Record\n"

      csvContent =
        headers +
        data
          .map((stat, index) => {
            const rank = index + 1
            let displayPosition = stat.position
            if (stat.position === "0") displayPosition = "G"
            else if (stat.position === "1") displayPosition = "RD"
            else if (stat.position === "2") displayPosition = "LD"
            else if (stat.position === "3") displayPosition = "RW"
            else if (stat.position === "4") displayPosition = "LW"
            else if (stat.position === "5") displayPosition = "C"

            const points = (stat.goals || 0) + (stat.assists || 0)
            const ppg = stat.games_played > 0 ? (points / stat.games_played).toFixed(2) : "0.00"
            const passAttempts = stat.pass_attempted || 0
            const passCompletions = stat.pass_completed || 0
            const passPercentage = passAttempts > 0 ? ((passCompletions / passAttempts) * 100).toFixed(1) : "0.0"
            const faceoffWins = stat.faceoffs_won || 0
            const faceoffTotal = stat.faceoffs_taken || 0
            const faceoffPct = faceoffTotal > 0 ? ((faceoffWins / faceoffTotal) * 100).toFixed(1) : "0.0"
            const record = `${stat.wins || 0}-${stat.losses || 0}-${stat.otl || 0}`

            let row = `${rank},"${stat.player_name}","${stat.team_name || "Free Agent"}",${displayPosition},${stat.games_played || 0},${stat.goals || 0},${stat.assists || 0},${points},${ppg},${stat.plus_minus || 0},${stat.shots || 0},${stat.hits || 0},${stat.pim || 0},${stat.blocks || 0},${stat.takeaways || 0},${stat.giveaways || 0},${stat.interceptions || 0},${passPercentage},${stat.pass_attempted || 0}`
            if (!isDefense) {
              row += `,${faceoffWins},${faceoffPct}`
            }
            row += `,"${record}"`
            return row
          })
          .join("\n")
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --------------------------
  // UI
  // --------------------------
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Leaders data per tab
  const totalLeaders = [...totalPlayers].sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
  const offenseLeaders = [...forwards].sort((a, b) => b.goals - a.goals)
  const defenseLeaders = [...defensemen].sort((a, b) => b.plus_minus - a.plus_minus)
  const goalieLeaders = [...goalieStats].sort((a, b) => (b.save_pct || 0) - (a.save_pct || 0))

  const handleSeasonChange = (seasonId: string) => {
    const season = seasons.find((s) => s.id.toString() === seasonId)
    setSelectedSeason(season || null)
    setSelectedWeek("all")
    setSelectedTeam("all")
    setSelectedMatchDate("all")
  }
  const handleWeekChange = (weekId: string) => setSelectedWeek(weekId)
  const handleMatchDateChange = (date: string) => setSelectedMatchDate(date)
  const handleTeamChange = (teamId: string) => setSelectedTeam(teamId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Player Statistics</h1>
          <p className="text-muted-foreground">View comprehensive player statistics across all seasons</p>
        </div>

        {selectedSeason?.is_playoffs && (
          <Alert>
            <Trophy className="h-4 w-4" />
            <AlertTitle>Playoff Statistics</AlertTitle>
            <AlertDescription>
              Showing statistics for playoff teams only. These stats are separate from regular season.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedSeason?.id?.toString() || ""} onValueChange={handleSeasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.name || `Season ${season.number || season.id}`}
                    {season.is_playoffs && " 🏆"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={selectedWeek} onValueChange={handleWeekChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {SEASON_1_WEEKS.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.displayName || w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={selectedMatchDate} onValueChange={handleMatchDateChange}>
              <SelectTrigger>
                <SelectValue placeholder="By Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {matchDates.map((md) => (
                  <SelectItem key={md.date} value={md.date}>
                    {md.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team logo filter strip */}
        <div className="overflow-x-auto py-2 -mx-2 px-2">
          <div className="flex items-center gap-2">
            <Button
              variant={selectedTeam === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTeam("all")}
              className="shrink-0 rounded-full"
            >
              All
            </Button>
            {teams.map((t) => {
              const logo = getTeamLogo(t)
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeam(String(t.id))}
                  className={`shrink-0 p-2 rounded-full border flex items-center justify-center hover:bg-muted transition ${
                    selectedTeam === String(t.id) ? "bg-muted" : "bg-background"
                  }`}
                  title={t.name}
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo || "/placeholder.svg"} alt={t.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                      {getTeamInitials(t.name)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Search and Export */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for a player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={exportToCSV} variant="outline" className="shrink-0 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="offense">Offense</TabsTrigger>
            <TabsTrigger value="defense">Defense</TabsTrigger>
            <TabsTrigger value="goalies">Goalies</TabsTrigger>
          </TabsList>

          {/* Leaders (changes per tab) */}
          {activeTab === "total" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <StatLeaderCard
                title="Points Leaders"
                items={totalLeaders}
                teamsById={teamsById}
                valueKey="points"
                valueLabel="Points"
              />
              <StatLeaderCard
                title="+/- Leaders"
                items={[...totalPlayers].sort((a, b) => (b.plus_minus || 0) - (a.plus_minus || 0))}
                teamsById={teamsById}
                valueKey="plus_minus"
                valueLabel="+/-"
              />
              <StatLeaderCard
                title="Takeaways Leaders"
                items={[...totalPlayers].sort((a, b) => (b.takeaways || 0) - (a.takeaways || 0))}
                teamsById={teamsById}
                valueKey="takeaways"
                valueLabel="TKA"
              />
            </div>
          )}
          {activeTab === "offense" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <StatLeaderCard
                title="Points Leaders"
                items={[...forwards].sort((a, b) => b.goals + b.assists - (a.goals + a.assists))}
                teamsById={teamsById}
                valueKey="points"
                valueLabel="Points"
              />
              <StatLeaderCard
                title="Goals Leaders"
                items={offenseLeaders}
                teamsById={teamsById}
                valueKey="goals"
                valueLabel="Goals"
              />
              <StatLeaderCard
                title="Assists Leaders"
                items={[...forwards].sort((a, b) => (b.assists || 0) - (a.assists || 0))}
                teamsById={teamsById}
                valueKey="assists"
                valueLabel="Assists"
              />
            </div>
          )}
          {activeTab === "defense" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <StatLeaderCard
                title="Points Leaders"
                items={[...defensemen].sort((a, b) => b.goals + b.assists - (a.goals + a.assists))}
                teamsById={teamsById}
                valueKey="points"
                valueLabel="Points"
              />
              <StatLeaderCard
                title="+/- Leaders"
                items={defenseLeaders}
                teamsById={teamsById}
                valueKey="plus_minus"
                valueLabel="+/-"
              />
              <StatLeaderCard
                title="Takeaways Leaders"
                items={[...defensemen].sort((a, b) => (b.takeaways || 0) - (a.takeaways || 0))}
                teamsById={teamsById}
                valueKey="takeaways"
                valueLabel="TKA"
              />
            </div>
          )}
          {activeTab === "goalies" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <StatLeaderCard
                title="Save % Leaders"
                items={goalieLeaders}
                teamsById={teamsById}
                valueKey="save_pct"
                valueLabel="SV%"
                formatter={(n) => `${(n * 100).toFixed(1)}%`}
              />
              <StatLeaderCard
                title="GAA Leaders"
                items={[...goalieStats].sort((a, b) => {
                  const aGAA = a.games_played > 0 ? (a.goals_against || 0) / a.games_played : 999
                  const bGAA = b.games_played > 0 ? (b.goals_against || 0) / b.games_played : 999
                  return aGAA - bGAA
                })}
                teamsById={teamsById}
                valueKey="goals_against"
                valueLabel="GAA"
                formatter={(n, player) => {
                  const gp = player?.games_played || 1
                  return (n / gp).toFixed(2)
                }}
              />
            </div>
          )}

          {/* Tables */}
          <TabsContent value="total" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Players</CardTitle>
                <CardDescription>Combined statistics for all skaters (excludes goalies)</CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="absolute top-4 right-4 bg-transparent"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(totalPlayers, false, totalPage, setTotalPage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forwards</CardTitle>
                <CardDescription>Statistics for centers, left wings, and right wings</CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="absolute top-4 right-4 bg-transparent"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(forwards, false, offensePage, setOffensePage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Defensemen</CardTitle>
                <CardDescription>Statistics for left and right defensemen</CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="absolute top-4 right-4 bg-transparent"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(defensemen, true, defensePage, setDefensePage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Goalies</CardTitle>
                <CardDescription>Statistics for goaltenders</CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="absolute top-4 right-4 bg-transparent"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>{renderGoalieStatsTable(goalieStats, goaliePage, setGoaliePage)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
