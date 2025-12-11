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
import { rateOffense, rateDefense, rateGoalie, lineupLabel } from "@/lib/ratings"

const TORONTO_TZ = "America/Toronto" // ← added

const SEASON_1_WEEKS = [
  { id: "all", name: "All Weeks", startDate: null, endDate: null },
  {
    id: "week1",
    name: "Week 1",
    startDate: "2026-01-01",
    endDate: "2026-01-07",
    displayName: "Week 1 (Jan 1-7, 2026)",
  },
  {
    id: "week2",
    name: "Week 2",
    startDate: "2026-01-08",
    endDate: "2026-01-14",
    displayName: "Week 2 (Jan 8-14, 2026)",
  },
  {
    id: "week3",
    name: "Week 3",
    startDate: "2025-10-15",
    endDate: "2025-10-21",
    displayName: "Week 3 (Oct 15-21, 2025)",
  },
  {
    id: "week4",
    name: "Week 4",
    startDate: "2025-10-22",
    endDate: "2025-10-28",
    displayName: "Week 4 (Oct 22-28, 2025)",
  },
  {
    id: "week5",
    name: "Week 5",
    startDate: "2025-10-29",
    endDate: "2025-11-04",
    displayName: "Week 5 (Oct 29- Nov 4, 2025)",
  },
  {
    id: "week6",
    name: "Week 6",
    startDate: "2025-11-05",
    endDate: "2025-11-11",
    displayName: "Week 6 (Nov 5-11, 2025)",
  },
  {
    id: "week7",
    name: "Week 7",
    startDate: "2025-11-12",
    endDate: "2025-11-18",
    displayName: "Week 7 (Nov 12-18, 2025)",
  },
]

// Sort configuration type
type SortConfig = {
  key: string
  direction: "asc" | "desc"
}

// Added TeamRow type
type TeamRow = { id: string; name: string; is_active: boolean; logo_url?: string | null; logo?: string | null }

const getTeamInitials = (teamName?: string | null) =>
  (teamName || "FA")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()

const getTeamLogo = (team: Partial<TeamRow>) => team.logo_url || team.logo || null

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
          const team = teamsById[player.team_id_ahl as string] || null
          const logo = team ? getTeamLogo(team) : null
          const teamName = team?.name || player?.team_name || "Free Agent"

          return (
            <div
              key={`${player.player_name}-${idx}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition"
            >
              <div className="flex-shrink-0">
                {logo ? (
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

// Modified PlayerCard to accept activeTab prop and display ratings
const PlayerCard = ({
  stat,
  rank,
  isDefense,
  isMobile,
  activeTab,
}: { stat: any; rank: number; isDefense?: boolean; isMobile: boolean; activeTab: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format position display
  let displayPosition = stat.position
  if (stat.position === "0") displayPosition = "G"
  else if (stat.position === "1") displayPosition = "RD"
  else if (stat.position === "2") displayPosition = "LD"
  else if (stat.position === "3") displayPosition = "RW"
  else if (stat.position === "4") displayPosition = "LW"
  else if (stat.position === "5") displayPosition = "C"

  // Calculate faceoff stats
  const faceoffWins = stat.faceoffs_won || 0
  const faceoffLosses = stat.faceoffs_lost || 0
  const faceoffTotal = stat.faceoffs_taken || 0
  const faceoffPct = faceoffTotal > 0 ? ((faceoffWins / faceoffTotal) * 100).toFixed(1) : "0.0"

  // Get pass attempts and completions
  const passAttempts = stat.pass_attempted || 0
  const passCompletions = stat.pass_completed || 0
  const passPercentage = passAttempts > 0 ? ((passCompletions / passAttempts) * 100).toFixed(1) : "0.0"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs">
                Team: <span className="font-semibold">{stat.team_name || "Free Agent"}</span>
              </div>
              <div className="text-xs">
                Position: <span className="font-semibold">{displayPosition}</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                  {isDefense
                    ? (stat.rating_defense ?? "—")
                    : activeTab === "total"
                      ? (stat.rating_total ?? "—")
                      : (stat.rating_offense ?? "—")}
                </span>
              </div>
              <div className="text-xs">
                GP: <span className="font-semibold">{stat.games_played || 0}</span>
              </div>
              <div className="text-xs">
                Goals: <span className="font-semibold">{stat.goals || 0}</span>
              </div>
              <div className="text-xs">
                Assists: <span className="font-semibold">{stat.assists || 0}</span>
              </div>
              <div className="text-xs">
                Points: <span className="font-semibold">{(stat.goals || 0) + (stat.assists || 0)}</span>
              </div>
              <div className="text-xs">
                +/-: <span className="font-semibold">{stat.plus_minus || 0}</span>
              </div>
              <div className="text-xs">
                SOG: <span className="font-semibold">{stat.shots || 0}</span>
              </div>
              <div className="text-xs">
                PIM: <span className="font-semibold">{stat.pim || 0}</span>
              </div>
              <div className="text-xs">
                Blocks: <span className="font-semibold">{stat.blocks || 0}</span>
              </div>
              <div className="text-xs">
                GVA: <span className="font-semibold">{stat.giveaways || 0}</span>
              </div>
              <div className="text-xs">
                TKA: <span className="font-semibold">{stat.takeaways || 0}</span>
              </div>
              <div className="text-xs">
                INT: <span className="font-semibold">{stat.interceptions || 0}</span>
              </div>
              <div className="text-xs">
                Pass%: <span className="font-semibold">{passPercentage}%</span>
              </div>
              <div className="text-xs">
                PassAtt: <span className="font-semibold">{stat.pass_attempted || 0}</span>
              </div>
              {!isDefense && (
                <>
                  <div className="text-xs">
                    FOW: <span className="font-semibold">{faceoffWins}</span>
                  </div>
                  <div className="text-xs">
                    FO%: <span className="font-semibold">{faceoffPct}%</span>
                  </div>
                </>
              )}
              <div className="text-xs">
                Record:{" "}
                <span className="font-semibold">
                  {stat.wins || 0}-{stat.losses || 0}-{stat.otl || 0}
                </span>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent></CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

// Modified GoalieCard to display ratings
const GoalieCard = ({ stat, rank, isMobile }: { stat: any; rank: number; isMobile: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate save percentage
  const savesPct = stat.save_pct ? (stat.save_pct * 100).toFixed(1) : "0.0"

  // Calculate GAA (goals against average per game)
  const gaa = stat.games_played > 0 ? (stat.goals_against / stat.games_played).toFixed(2) : "0.00"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs">
                Team: <span className="font-semibold">{stat.team_name || "Free Agent"}</span>
              </div>
              <div className="text-xs">
                Rating: <span className="font-semibold">{stat.rating_goalie ?? "—"}</span>
                {stat.rating_goalie_label && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted">{stat.rating_goalie_label}</span>
                )}
              </div>
              <div className="text-xs">
                GP: <span className="font-semibold">{stat.games_played || 0}</span>
              </div>
              <div className="text-xs">
                Saves: <span className="font-semibold">{stat.saves || 0}</span>
              </div>
              <div className="text-xs">
                GA: <span className="font-semibold">{stat.goals_against || 0}</span>
              </div>
              <div className="text-xs">
                SV%: <span className="font-semibold">{savesPct}%</span>
              </div>
              <div className="text-xs">
                GAA: <span className="font-semibold">{gaa}</span>
              </div>
              <div className="text-xs">
                Record:{" "}
                <span className="font-semibold">
                  {stat.wins || 0}-{stat.losses || 0}-{stat.otl || 0}
                </span>
              </div>
              <div className="text-xs">
                Shots: <span className="font-semibold">{(stat.saves || 0) + (stat.goals_against || 0)}</span>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent></CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

/** ===== TZ HELPERS (new) ===== **/
const ymdInTZ = (dateLike: string | number | Date, timeZone: string) => {
  const d = new Date(dateLike)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find(p => p.type === "year")?.value || "0000"
  const m = parts.find(p => p.type === "month")?.value || "01"
  const dd = parts.find(p => p.type === "day")?.value || "01"
  return `${y}-${m}-${dd}`
}

export default function AHLStatisticsPage() {
  const { supabase } = useSupabase()
  const isMobile = useMobile()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<any[]>([])
  const [selectedSeason, setSelectedSeason] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("total")
  const [playerNameToTeamMap, setPlayerNameToTeamMap] = useState<Record<string, any>>({})
  const [totalPlayers, setTotalPlayers] = useState<any[]>([])
  const [forwards, setForwards] = useState<any[]>([])
  const [defensemen, setDefensemen] = useState<any[]>([])
  const [goalieStats, setGoalieStats] = useState<any[]>([])
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("all") // ← fixed (removed stray "the")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Pagination states
  const [totalPage, setTotalPage] = useState(1)
  const [offensePage, setOffensePage] = useState(1)
  const [defensePage, setDefensePage] = useState(1)
  const [goaliePage, setGoaliePage] = useState(1)
  const playersPerPage = isMobile ? 10 : 20

  const [selectedWeek, setSelectedWeek] = useState<string>("all")

  const [selectedMatchDate, setSelectedMatchDate] = useState<string>("all")
  const [matchDates, setMatchDates] = useState<{ date: string; displayName: string }[]>([])

  // Sort states for each tab
  const [totalSortConfig, setTotalSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [offenseSortConfig, setOffenseSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [defenseSortConfig, setDefenseSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [goalieSortConfig, setGoalieSortConfig] = useState<SortConfig>({ key: "save_pct", direction: "desc" })

  const teamsById = useMemo(() => {
    const m: Record<string, TeamRow> = {}
    teams.forEach((t) => (m[t.id] = t))
    return m
  }, [teams])

  // Helper function to check if a date falls within a week range (Toronto-local YYYY-MM-DD)
  const isDateInWeek = (matchDate: string, weekStart: string, weekEnd: string): boolean => {
    // matchDate, weekStart, weekEnd are all YYYY-MM-DD; string compare is safe
    return matchDate >= weekStart && matchDate <= weekEnd
  }

  const getSelectedWeekInfo = () => {
    return SEASON_6_WEEKS.find((week) => week.id === selectedWeek) || SEASON_6_WEEKS[0]
  }

  // TZ-aware date normalizer (Toronto) — robust version
  const getMatchDate = (match: any): string | null => {
    const raw = match?.match_date
    if (!raw) return null

    try {
      const d = new Date(raw)
      if (isNaN(d.getTime())) return null
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TORONTO_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(d)
      const y = parts.find(p => p.type === "year")?.value
      const m = parts.find(p => p.type === "month")?.value
      const da = parts.find(p => p.type === "day")?.value
      if (!y || !m || !da) return null
      return `${y}-${m}-${da}`
    } catch {
      const m = String(raw).match(/^(\d{4}-\d{2}-\d{2})/)
      return m ? m[1] : null
    }
  }

  const sortPlayers = (players: any[], sortConfig: SortConfig, tab: string) =>
    [...players].sort((a, b) => {
      let av: number
      let bv: number
      switch (sortConfig.key) {
        case "rating": {
          const getRating = (p: any) =>
            tab === "goalies"
              ? (p.rating_goalie ?? -1)
              : tab === "offense"
                ? (p.rating_offense ?? -1)
                : tab === "defense"
                  ? (p.rating_defense ?? -1)
                  : (p.rating_total ?? -1)
          av = getRating(a)
          bv = getRating(b)
          break
        }

        case "points": {
          av = (a.goals || 0) + (a.assists || 0)
          bv = (b.goals || 0) + (b.assists || 0)
          break
        }

        case "ppg": {
          const ap = (a.goals || 0) + (a.assists || 0)
          const bp = (b.goals || 0) + (b.assists || 0)
          av = a.games_played > 0 ? ap / a.games_played : 0
          bv = b.games_played > 0 ? bp / b.games_played : 0
          break
        }

        case "save_pct": {
          av = a.save_pct || 0
          bv = b.save_pct || 0
          break
        }

        case "faceoff_pct": {
          const at = a.faceoffs_taken || 0
          const bt = b.faceoffs_taken || 0
          av = at > 0 ? (a.faceoffs_won || 0) / at : 0
          bv = bt > 0 ? (b.faceoffs_won || 0) / bt : 0
          break
        }

        case "pass_pct": {
          const aa = a.pass_attempted || 0
          const ba = b.pass_attempted || 0
          av = aa > 0 ? (a.pass_completed || 0) / aa : 0
          bv = ba > 0 ? (b.pass_completed || 0) / ba : 0
          break
        }

        case "gaa": {
          av = a.games_played > 0 ? (a.goals_against || 0) / a.games_played : 0
          bv = b.games_played > 0 ? (b.goals_against || 0) / b.games_played : 0
          break
        }

        default: {
          av = a[sortConfig.key] || 0
          bv = b[sortConfig.key] || 0
        }
      }

      return sortConfig.direction === "asc" ? av - bv : bv - av
    })

  const handleSort = (key: string) => {
    let currentSortConfig: SortConfig
    let setSortConfig: (config: SortConfig) => void

    switch (activeTab) {
      case "total":
        currentSortConfig = totalSortConfig
        setSortConfig = setTotalSortConfig
        break
      case "offense":
        currentSortConfig = offenseSortConfig
        setSortConfig = setOffenseSortConfig
        break
      case "defense":
        currentSortConfig = defenseSortConfig
        setSortConfig = setDefenseSortConfig
        break
      case "goalies":
        currentSortConfig = goalieSortConfig
        setSortConfig = setGoalieSortConfig
        break
      default:
        return
    }

    const direction = currentSortConfig.key === key && currentSortConfig.direction === "desc" ? "asc" : "desc"
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: string) => {
    let currentSortConfig: SortConfig

    switch (activeTab) {
      case "total":
        currentSortConfig = totalSortConfig
        break
      case "offense":
        currentSortConfig = offenseSortConfig
        break
      case "defense":
        currentSortConfig = defenseSortConfig
        break
      case "goalies":
        currentSortConfig = goalieSortConfig
        break
      default:
        return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    }

    if (currentSortConfig.key === key) {
      return currentSortConfig.direction === "desc" ? (
        <ChevronDown className="h-3 w-3 ml-1" />
      ) : (
        <ChevronUp className="h-3 w-3 ml-1" />
      )
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
  }

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / playersPerPage)

    if (totalPages <= 1) {
      return null
    }

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

  const exportToCSV = () => {
    let data: any[] = []
    let filename = ""

    switch (activeTab) {
      case "total":
        data = sortPlayers(filterPlayersBySearch(totalPlayers), totalSortConfig, "total")
        filename = "ahl-total-stats.csv"
        break
      case "offense":
        data = sortPlayers(filterPlayersBySearch(forwards), offenseSortConfig, "offense")
        filename = "ahl-offense-stats.csv"
        break
      case "defense":
        data = sortPlayers(filterPlayersBySearch(defensemen), defenseSortConfig, "defense")
        filename = "ahl-defense-stats.csv"
        break
      case "goalies":
        data = sortPlayers(filterPlayersBySearch(goalieStats), goalieSortConfig, "goalies")
        filename = "ahl-goalie-stats.csv"
        break
    }

    if (data.length === 0) {
      alert("No data to export")
      return
    }

    let csvContent = ""

    if (activeTab === "goalies") {
      csvContent =
        "Rank,Player,Team,Rating,Rating Label,GP,Saves,GA,SV%,GAA,Wins,Losses,OTL,Shots\n" +
        data
          .map((stat, index) => {
            const rank = index + 1
            const savesPct = stat.save_pct ? (stat.save_pct * 100).toFixed(1) : "0.0"
            const gaa = stat.games_played > 0 ? (stat.goals_against / stat.games_played).toFixed(2) : "0.00"
            const shots = (stat.saves || 0) + (stat.goals_against || 0)
            return `${rank},"${stat.player_name}","${stat.team_name || "Free Agent"}","${stat.rating_goalie ?? "—"}","${stat.rating_goalie_label ?? ""}",${stat.games_played || 0},${stat.saves || 0},${stat.goals_against || 0},${savesPct},${gaa},${stat.wins || 0},${stat.losses || 0},${stat.otl || 0},${shots}`
          })
          .join("\n")
    } else {
      const isDefense = activeTab === "defense"
      let headers =
        "Rank,Player,Team,Pos,Rating,Rating Label,GP,Goals,Assists,Points,PPG,+/-,SOG,Hits,PIM,Blocks,TKA,GVA,INT,Pass%,PassAtt"
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

            let row = `${rank},"${stat.player_name}","${stat.team_name || "Free Agent"}",${displayPosition},"${
              activeTab === "offense"
                ? (stat.rating_offense ?? "—")
                : activeTab === "defense"
                  ? (stat.rating_defense ?? "—")
                  : (stat.rating_total ?? "—")
            }","${
              activeTab === "offense"
                ? (stat.rating_offense_label ?? "")
                : activeTab === "defense"
                  ? (stat.rating_defense_label ?? "")
                  : (stat.rating_total_label ?? "")
            }",${stat.games_played || 0},${stat.goals || 0},${stat.assists || 0},${points},${ppg},${stat.plus_minus || 0},${
              stat.shots || 0
            },${stat.hits || 0},${stat.pim || 0},${stat.blocks || 0},${stat.takeaways || 0},${stat.giveaways || 0},${
              stat.interceptions || 0
            },${passPercentage},${stat.pass_attempted || 0}`
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

  useEffect(() => {
    async function fetchTeams() {
      if (!selectedSeason) return

      const { data, error } = await supabase
        .from("team_seasons_ahl")
        .select(`
          team_id,
          teams_ahl (
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
          .filter((ts: any) => ts.teams_ahl)
          .map((ts: any) => ({
            id: ts.teams_ahl.id,
            name: ts.teams_ahl.name,
            is_active: ts.teams_ahl.is_active,
            logo_url: ts.teams_ahl.logo_url,
          })) as TeamRow[]

        setTeams(activeTeams)
      }
    }
    fetchTeams()
  }, [supabase, selectedSeason])

  // Build name -> AHL team map from players
  useEffect(() => {
    async function fetchPlayerNameToTeamMap() {
      try {
        const { data, error } = await supabase
          .from("players")
          .select(`
          id,
          user_id,
          team_id_ahl,
          users ( id, gamer_tag_id ),
          teams_ahl:team_id_ahl ( id, name )
        `)

        if (error) {
          console.error("Error fetching players for AHL map:", error)
          return
        }

        const map: Record<string, any> = {}
        for (const p of data || []) {
          const key = (p?.users?.gamer_tag_id || "").toLowerCase().trim()
          if (!key) continue
          map[key] = {
            team_id_ahl: p.team_id_ahl ?? null,
            team_name: p?.teams_ahl?.name || "Free Agent",
          }
        }
        setPlayerNameToTeamMap(map)
      } catch (e) {
        console.error("fetchPlayerNameToTeamMap error:", e)
      }
    }

    fetchPlayerNameToTeamMap()
  }, [supabase])

  useEffect(() => {
    async function fetchSeasons() {
      try {
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons_ahl")
          .select("*")
          .order("created_at", { ascending: false })

        if (seasonsError) {
          console.error("Error fetching AHL seasons:", seasonsError)
          setError(`Error loading AHL seasons: ${seasonsError.message}`)
          return
        }

        if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData)

          // Try to find Season 6 AHL
          const season6 = seasonsData.find((s) => s.number === 6 || s.name?.includes("Season 6"))
          if (season6) {
            setSelectedSeason(season6)
          } else {
            // Find active season
            const activeSeason = seasonsData.find((s) => s.is_active === true)
            if (activeSeason) {
              setSelectedSeason(activeSeason)
            } else {
              // Default to first season
              setSelectedSeason(seasonsData[0])
            }
          }
        } else {
          // Try to get current season from system_settings_ahl
          await fetchCurrentSeasonFromSettings()
        }
      } catch (error: any) {
        console.error("Error in fetchSeasons:", error)
        setError(`Error loading AHL seasons: ${error.message}`)
        await fetchCurrentSeasonFromSettings()
      } finally {
        setLoading(false)
      }
    }

    async function fetchCurrentSeasonFromSettings() {
      try {
        const { data, error } = await supabase
          .from("system_settings_ahl")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (error) {
          console.error("Error fetching AHL settings:", error)
          // Default to Season 6 AHL
          setSelectedSeason({
            id: "6",
            number: 6,
            name: "Season 6 AHL",
            is_active: true,
            is_playoffs: false,
          })
          return
        }

        if (data && data.value) {
          const seasonNumber = Number.parseInt(data.value.toString(), 10)
          if (!isNaN(seasonNumber)) {
            const { data: seasonData, error: seasonError } = await supabase
              .from("seasons_ahl")
              .select("*")
              .eq("number", seasonNumber)
              .single()

            if (!seasonError && seasonData) {
              setSelectedSeason(seasonData)
              return
            }

            setSelectedSeason({
              id: seasonNumber.toString(),
              number: seasonNumber,
              name: `Season ${seasonNumber} AHL`,
              is_active: true,
              is_playoffs: false,
            })
          }
        } else {
          // Default to Season 6 AHL
          setSelectedSeason({
            id: "1",
            number: 1,
            name: "Season 1 AHL",
            is_active: true,
            is_playoffs: false,
          })
        }
      } catch (error: any) {
        console.error("Error fetching current AHL season from settings:", error)
        // Default to Season 6 AHL as last resort
        setSelectedSeason({
          id: "6",
          number: 6,
          name: "Season 6 AHL",
          is_active: true,
          is_playoffs: false,
        })
      }
    }

    fetchSeasons()
  }, [supabase])

  // *** UPDATED: fetchMatchDates with season_id-first and season_name fallback, TZ-correct labels
  useEffect(() => {
    async function fetchMatchDates() {
      if (!selectedSeason) return
      try {
        const seasonId = selectedSeason.id
        const seasonName = selectedSeason.name || null

        // Remember current selection so we can preserve it if still valid
        const prevSelected = selectedMatchDate

        // 1) Strict by season_id
        let { data, error } = await supabase
          .from("matches_ahl")
          .select("id, match_date, season_id, season_name, status")
          .eq("season_id", seasonId)
          .not("match_date", "is", null)
          .order("match_date", { ascending: true })

        if (error) throw error

        // 2) Fallback by season_name (handles rows missing/incorrect season_id)
        if ((!data || data.length === 0) && seasonName) {
          const fb = await supabase
            .from("matches_ahl")
            .select("id, match_date, season_id, season_name, status")
            .ilike("season_name", seasonName)
            .not("match_date", "is", null)
            .order("match_date", { ascending: true })

          if (fb.error) throw fb.error
          data = fb.data || []
        }

        if (data && data.length) {
          const isoDates = data
            .map((m: any) => getMatchDate(m))
            .filter((d): d is string => Boolean(d))

          const uniqueSorted = Array.from(new Set(isoDates)).sort()

          const fmt = new Intl.DateTimeFormat(undefined, {
            timeZone: TORONTO_TZ,
            weekday: "long",
            month: "short",
            day: "numeric",
          })

          const dates = uniqueSorted.map((dateStr) => {
            const labelDate = new Date(`${dateStr}T12:00:00`) // noon anchor avoids DST edges
            return { date: dateStr, displayName: fmt.format(labelDate) }
          })

          setMatchDates(dates)

          // keep current selection if it still exists; otherwise default to "all"
          if (prevSelected !== "all" && dates.some((d) => d.date === prevSelected)) {
            setSelectedMatchDate(prevSelected)
          } else {
            setSelectedMatchDate("all")
          }
        } else {
          setMatchDates([])
          setSelectedMatchDate("all")
        }
      } catch (e: any) {
        console.error("Error fetching AHL match dates:", e)
        setMatchDates([])
        setSelectedMatchDate("all")
      }
    }
    fetchMatchDates()
  }, [supabase, selectedSeason]) // ← dependencies unchanged

  useEffect(() => {
    async function fetchPlayerStats() {
      if (!selectedSeason) return

      try {
        setLoading(true)
        const seasonNumber = selectedSeason.season_number || selectedSeason.number || 6
        const isPlayoffSeason = selectedSeason.is_playoffs || false

        console.log(`[v0] Fetching AHL player stats for season number: ${seasonNumber}, isPlayoff: ${isPlayoffSeason}`)

        const { data: allPlayerStats, error: playerStatsError } = await supabase
          .from("ea_player_stats_ahl")
          .select("*")
          .eq("season_id", seasonNumber)

        if (playerStatsError) {
          console.error("Error fetching AHL player stats:", playerStatsError)
          setError(`Error fetching AHL player stats: ${playerStatsError.message}`)
          return
        }

        console.log(
          `[v0] Found ${allPlayerStats?.length || 0} total AHL player stat records for season ${seasonNumber}`,
        )

        if (!allPlayerStats || allPlayerStats.length === 0) {
          setForwards([])
          setDefensemen([])
          setGoalieStats([])
          setTotalPlayers([])
          return
        }

        const allMatchIds = [...new Set(allPlayerStats.map((stat) => stat.match_id))]
        console.log(`Found ${allMatchIds.length} unique match IDs in AHL player stats`)

        const { data: matchesData, error: matchesError } = await supabase
          .from("matches_ahl")
          .select(
            "id, home_team_id, away_team_id, home_score, away_score, status, season_id, season_name, overtime, has_overtime, match_date",
          )
          .in("id", allMatchIds)

        if (matchesError) {
          console.error("Error fetching AHL matches:", matchesError)
        }

        console.log(`Found ${matchesData?.length || 0} AHL matches with data`)

        let filteredPlayerStats = allPlayerStats
        const weekInfo = getSelectedWeekInfo()

        if (selectedWeek !== "all" && weekInfo.startDate && weekInfo.endDate && matchesData) {
          const weekMatchIds = new Set<string>()
          matchesData.forEach((match) => {
            const matchDate = getMatchDate(match)
            if (matchDate && isDateInWeek(matchDate, weekInfo.startDate!, weekInfo.endDate!)) {
              if (selectedMatchDate === "all" || matchDate === selectedMatchDate) {
                weekMatchIds.add(match.id)
              }
            }
          })
          filteredPlayerStats = allPlayerStats.filter((stat) => weekMatchIds.has(stat.match_id))
          console.log(
            `Filtered to ${filteredPlayerStats.length} AHL player stat records for ${weekInfo.displayName || weekInfo.name}`,
          )
        } else if (selectedMatchDate !== "all" && matchesData) {
          const dateMatchIds = new Set<string>()
          matchesData.forEach((match) => {
            const matchDate = getMatchDate(match)
            if (matchDate === selectedMatchDate) dateMatchIds.add(match.id)
          })
          filteredPlayerStats = allPlayerStats.filter((stat) => dateMatchIds.has(stat.match_id))
        } else {
          console.log(`Using all ${allPlayerStats.length} AHL player stat records (All Weeks selected)`)
        }

        const matchResultsMap = new Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>()

        if (matchesData) {
          matchesData.forEach((match) => {
            if (match.home_score !== null && match.away_score !== null) {
              const isOvertime =
                match.overtime === true ||
                match.has_overtime === true ||
                (match.status && match.status.toLowerCase().includes("overtime")) ||
                (match.status && match.status.includes("(OT)"))

              let homeResult: "W" | "L" | "OTL"
              let awayResult: "W" | "L" | "OTL"

              if (match.home_score > match.away_score) {
                homeResult = "W"
                awayResult = isOvertime ? "OTL" : "L"
              } else if (match.away_score > match.home_score) {
                awayResult = "W"
                homeResult = isOvertime ? "OTL" : "L"
              } else {
                homeResult = "OTL"
                awayResult = "OTL"
              }

              matchResultsMap.set(match.id, { home_result: homeResult, away_result: awayResult })
            }
          })
        }

        console.log(`Built AHL match results map with ${matchResultsMap.size} entries`)

        processPlayerStats(filteredPlayerStats, matchResultsMap, matchesData || [])

        function processPlayerStats(
          statsData: any[],
          matchResultsMap: Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>,
          matchesData: any[],
        ) {
          console.log(`Processing ${statsData.length} AHL player stat records`)

          const matchDataMap = new Map()
          matchesData.forEach((match) => {
            matchDataMap.set(match.id, match)
          })

          const offenseStatsMap = new Map<string, any>()
          const defenseStatsMap = new Map<string, any>()
          const goalieStatsMap = new Map<string, any>()
          const totalStatsMap = new Map<string, any>()

          statsData.forEach((stat) => {
            const rawPlayerName = stat.player_name
            if (!rawPlayerName || typeof rawPlayerName !== "string") {
              return
            }

            const playerName = rawPlayerName.toLowerCase().trim()
            if (!playerName || playerName === "unknown" || playerName === "") {
              return
            }

            const position = mapEaPositionToStandard(stat.position || "")

            const isOffense =
              position === "C" ||
              position === "LW" ||
              position === "RW" ||
              position === "5" ||
              position === "4" ||
              position === "3"
            const isDefense = position === "LD" || position === "RD" || position === "1" || position === "2"
            const isGoalie = position === "G" || position === "0"

            const initializePlayerStats = (playerName: string, stat: any) => ({
              player_name: rawPlayerName,
              position: stat.position,
              season_id: stat.season_id,
              games_played: 0,
              unique_matches: new Set(),
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
            })

            const aggregateStats = (aggregated: any, stat: any) => {
              aggregated.unique_matches.add(stat.match_id)
              aggregated.goals += stat.goals || 0
              aggregated.assists += stat.assists || 0
              aggregated.plus_minus += stat.plus_minus || 0
              aggregated.pim += stat.pim || 0
              aggregated.shots += stat.shots || 0
              aggregated.hits += stat.hits || 0
              aggregated.blocks += stat.blocks || 0
              aggregated.takeaways += stat.takeaways || 0
              aggregated.giveaways += stat.giveaways || 0
              aggregated.faceoffs_won += stat.faceoffs_won || 0
              aggregated.faceoffs_taken += stat.faceoffs_taken || 0
              aggregated.pass_attempted += stat.pass_attempts || stat.pass_attempted || 0
              aggregated.pass_completed += stat.pass_complete || stat.pass_completed || 0
              aggregated.interceptions += stat.interceptions || 0

              if (isGoalie) {
                aggregated.saves += stat.saves || 0
                aggregated.goals_against += stat.goals_against || 0
                aggregated.glshots += stat.glshots || 0
                aggregated.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
              }

              aggregated.points = aggregated.goals + aggregated.assists
            }

            if (isOffense) {
              if (!offenseStatsMap.has(playerName)) {
                offenseStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const offenseAggregated = offenseStatsMap.get(playerName)!
              aggregateStats(offenseAggregated, stat)
            }

            if (isDefense) {
              if (!defenseStatsMap.has(playerName)) {
                defenseStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const defenseAggregated = defenseStatsMap.get(playerName)!
              aggregateStats(defenseAggregated, stat)
            }

            if (isGoalie) {
              if (!goalieStatsMap.has(playerName)) {
                goalieStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const goalieAggregated = goalieStatsMap.get(playerName)!
              aggregateStats(goalieAggregated, stat)
            }

            if (isOffense || isDefense) {
              if (!totalStatsMap.has(playerName)) {
                totalStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const totalAggregated = totalStatsMap.get(playerName)!
              aggregateStats(totalAggregated, stat)
            }
          })

          const finalizePlayerStats = (playerStatsMap: Map<string, any>) => {
            const players: any[] = []

            playerStatsMap.forEach((player, playerKey) => {
              const playerName = player.player_name?.toLowerCase()?.trim()

              player.games_played = player.unique_matches.size

              player.unique_matches.forEach((matchId: string) => {
                const matchResult = matchResultsMap.get(matchId)
                const matchData = matchDataMap.get(matchId)

                if (matchResult && matchData) {
                  const playerStats = statsData.filter(
                    (s) => s.match_id === matchId && s.player_name?.toLowerCase()?.trim() === playerName,
                  )

                  if (playerStats.length > 0) {
                    const stat = playerStats[0]
                    let playerResult: "W" | "L" | "OTL" | null = null

                    if (stat.team_id === matchData.home_team_id) {
                      playerResult = matchResult.home_result
                    } else if (stat.team_id === matchData.away_team_id) {
                      playerResult = matchResult.away_result
                    } else {
                      const playerTeamInfo = playerNameToTeamMap[playerName]
                      // ↓ fixed: use team_id_ahl (the map's shape)
                      if (playerTeamInfo && playerTeamInfo.team_id_ahl) {
                        if (playerTeamInfo.team_id_ahl === matchData.home_team_id) {
                          playerResult = matchResult.home_result
                        } else if (playerTeamInfo.team_id_ahl === matchData.away_team_id) {
                          playerResult = matchResult.away_result
                        }
                      }
                    }

                    if (playerResult === "W") {
                      player.wins += 1
                    } else if (playerResult === "OTL") {
                      player.otl += 1
                    } else if (playerResult === "L") {
                      player.losses += 1
                    }
                  }
                }
              })

              player.faceoffs_lost = player.faceoffs_taken - player.faceoffs_won

              if ((player.position === "G" || player.position === "0") && player.total_shots_faced > 0) {
                player.save_pct = player.saves / player.total_shots_faced
              }

              delete player.unique_matches

              const teamInfo = playerNameToTeamMap[playerName]
              player.team_name = teamInfo?.team_name || "Free Agent"
              player.team_id_ahl = teamInfo?.team_id_ahl || null

              if (selectedTeam === "all" || player.team_id_ahl === selectedTeam) {
                players.push(player)
              }
            })

            return players
          }

          const offensePlayers = finalizePlayerStats(offenseStatsMap).map((p) => {
            const r = rateOffense(p)
            return { ...p, rating_offense: r?.rating ?? null, rating_offense_label: r?.label ?? null }
          })

          const defensePlayers = finalizePlayerStats(defenseStatsMap).map((p) => {
            const r = rateDefense(p)
            return { ...p, rating_defense: r?.rating ?? null, rating_defense_label: r?.label ?? null }
          })

          const goaliePlayers = finalizePlayerStats(goalieStatsMap).map((p) => {
            const r = rateGoalie(p)
            return { ...p, rating_goalie: r?.rating ?? null, rating_goalie_label: r?.label ?? null }
          })

          const defByName = new Map(defensePlayers.map((p) => [p.player_name, p]))
          const offByName = new Map(offensePlayers.map((p) => [p.player_name, p]))

          const totalPlayers = finalizePlayerStats(totalStatsMap).map((p) => {
            const off = offByName.get(p.player_name)?.rating_offense ?? null
            const def = defByName.get(p.player_name)?.rating_defense ?? null
            let ovr: number | null = null
            if (off != null && def != null) ovr = Math.round((off + def) / 2)
            else if (off != null) ovr = off
            else if (def != null) ovr = def
            return { ...p, rating_total: ovr, rating_total_label: ovr == null ? null : lineupLabel(ovr) }
          })

          console.log(
            `Final AHL categorized players: ${totalPlayers.length} total, ${offensePlayers.length} offense, ${defensePlayers.length} defense, ${goaliePlayers.length} goalies`,
          )

          setTotalPlayers(totalPlayers)
          setForwards(offensePlayers)
          setDefensemen(defensePlayers)
          setGoalieStats(goaliePlayers)
        }
      } catch (error: any) {
        console.error("Error fetching AHL player stats:", error)
        setError(`Error fetching AHL player stats: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [supabase, selectedSeason, selectedWeek, selectedMatchDate, playerNameToTeamMap, selectedTeam, teamsById])

  const handleSeasonChange = (seasonId: string) => {
    const season = seasons.find((s) => s.id.toString() === seasonId)
    setSelectedSeason(season || null)
    setSelectedWeek("all")
    setSelectedTeam("all")
  }

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId)
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId)
  }

  // Added match date change handler
  const handleMatchDateChange = (date: string) => setSelectedMatchDate(date)

  const filterPlayersBySearch = (players: any[]) => {
    if (!searchQuery.trim()) {
      return players
    }

    const query = searchQuery.toLowerCase().trim()
    return players.filter((player) => player.player_name?.toLowerCase().includes(query))
  }

  const renderPlayerStatsTable = (
    players: any[],
    isDefense = false,
    currentPage = 1,
    onPageChange: (page: number) => void,
  ) => {
    const filteredPlayers = filterPlayersBySearch(players)

    if (filteredPlayers.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? `No players found matching "${searchQuery}"` : "No AHL player statistics available"}
          </p>
        </div>
      )
    }

    let currentSortConfig: SortConfig
    switch (activeTab) {
      case "total":
        currentSortConfig = totalSortConfig
        break
      case "offense":
        currentSortConfig = offenseSortConfig
        break
      case "defense":
        currentSortConfig = defenseSortConfig
        break
      default:
        currentSortConfig = { key: "points", direction: "desc" }
    }

    const sortedPlayers = sortPlayers(filteredPlayers, currentSortConfig, activeTab)
    const startIndex = (currentPage - 1) * playersPerPage
    const endIndex = startIndex + playersPerPage
    const paginatedPlayers = sortedPlayers.slice(startIndex, endIndex)

    const TableBodyRows = paginatedPlayers.map((stat, index) => {
      const overallRank = startIndex + index + 1

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
          <TableCell className="text-xs md:text-sm font-medium">{overallRank}</TableCell>
          <TableCell className="text-xs md:text-sm">
            <PlayerClickableLinkFlexible playerName={stat.player_name} />
          </TableCell>
          <TableCell className="text-xs md:text-sm">{stat.team_name || "Free Agent"}</TableCell>
          <TableCell className="text-xs md:text-sm">{displayPosition}</TableCell>
          <TableCell className="text-xs md:text-sm">
            {activeTab === "offense" && stat.rating_offense != null && <span className="font-medium">{stat.rating_offense}</span>}
            {activeTab === "defense" && stat.rating_defense != null && <span className="font-medium">{stat.rating_defense}</span>}
            {activeTab === "total" && stat.rating_total != null && <span className="font-medium">{stat.rating_total}</span>}
            {(activeTab === "offense" && stat.rating_offense_label) ||
            (activeTab === "defense" && stat.rating_defense_label) ||
            (activeTab === "total" && stat.rating_total_label) ? (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                {activeTab === "offense"
                  ? stat.rating_offense_label
                  : activeTab === "defense"
                    ? stat.rating_defense_label
                    : stat.rating_total_label}
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
    })

    if (isMobile) {
      return (
        <div>
          <div className="space-y-3">
            {paginatedPlayers.map((stat, index) => {
              const overallRank = startIndex + index + 1
              return (
                <PlayerCard
                  key={`${stat.player_name}-${index}`}
                  stat={stat}
                  rank={overallRank}
                  isDefense={isDefense}
                  isMobile={isMobile}
                  activeTab={activeTab}
                />
              )
            })}
          </div>
          {renderPagination(currentPage, sortedPlayers.length, onPageChange)}
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
                <TableHead className="text-xs md:text-sm min-w-[100px]">Player</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[80px]">Team</TableHead>
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
                  <div className="flex items-center justify-end">
                    GP
                    {getSortIcon("games_played")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("goals")}
                >
                  <div className="flex items-center justify-end">
                    Goals
                    {getSortIcon("goals")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("assists")}
                >
                  <div className="flex items-center justify-end">
                    Assists
                    {getSortIcon("assists")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("points")}
                >
                  <div className="flex items-center justify-end">
                    Pts
                    {getSortIcon("points")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("ppg")}
                >
                  <div className="flex items-center justify-end">
                    PPG
                    {getSortIcon("ppg")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("plus_minus")}
                >
                  <div className="flex items-center justify-end">
                    +/- 
                    {getSortIcon("plus_minus")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("shots")}
                >
                  <div className="flex items-center justify-end">
                    SOG
                    {getSortIcon("shots")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("hits")}
                >
                  <div className="flex items-center justify-end">
                    Hits
                    {getSortIcon("hits")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pim")}
                >
                  <div className="flex items-center justify-end">
                    PIM
                    {getSortIcon("pim")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("blocks")}
                >
                  <div className="flex items-center justify-end">
                    Blocks
                    {getSortIcon("blocks")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("takeaways")}
                >
                  <div className="flex items-center justify-end">
                    TKA
                    {getSortIcon("takeaways")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("giveaways")}
                >
                  <div className="flex items-center justify-end">
                    GVA
                    {getSortIcon("giveaways")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("interceptions")}
                >
                  <div className="flex items-center justify-end">
                    INT
                    {getSortIcon("interceptions")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pass_pct")}
                >
                  <div className="flex items-center justify-end">
                    Pass%
                    {getSortIcon("pass_pct")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pass_attempted")}
                >
                  <div className="flex items-center justify-end">
                    PassAtt
                    {getSortIcon("pass_attempted")}
                  </div>
                </TableHead>
                {!isDefense && (
                  <>
                    <TableHead
                      className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bgMuted/50"
                      onClick={() => handleSort("faceoffs_won")}
                    >
                      <div className="flex items-center justify-end">
                        FOW
                        {getSortIcon("faceoffs_won")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bgMuted/50"
                      onClick={() => handleSort("faceoff_pct")}
                    >
                      <div className="flex items-center justify-end">
                        FO%
                        {getSortIcon("faceoff_pct")}
                      </div>
                    </TableHead>
                  </>
                )}
                <TableHead className="text-right text-xs md:text-sm min-w-[80px]">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{TableBodyRows}</TableBody>
          </Table>
        </div>
        {renderPagination(currentPage, sortedPlayers.length, onPageChange)}
      </div>
    )
  }

  const renderGoalieStatsTable = (goalies: any[], currentPage = 1, onPageChange: (page: number) => void) => {
    const filteredGoalies = filterPlayersBySearch(goalies)

    if (filteredGoalies.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? `No goalies found matching "${searchQuery}"` : "No AHL goalie statistics available"}
          </p>
        </div>
      )
    }

    const sortedGoalies = sortPlayers(filteredGoalies, goalieSortConfig, "goalies")
    const startIndex = (currentPage - 1) * playersPerPage
    const endIndex = startIndex + playersPerPage
    const paginatedGoalies = sortedGoalies.slice(startIndex, endIndex)

    if (isMobile) {
      return (
        <div>
          <div className="space-y-3">
            {paginatedGoalies.map((stat, index) => {
              const overallRank = startIndex + index + 1
              return (
                <GoalieCard key={`${stat.player_name}-${index}`} stat={stat} rank={overallRank} isMobile={isMobile} />
              )
            })}
          </div>
          {renderPagination(currentPage, sortedGoalies.length, onPageChange)}
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
                <TableHead className="text-xs md:text-sm min-w-[100px]">Player</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[80px]">Team</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[60px]">Rating</TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[40px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("games_played")}
                >
                  <div className="flex items-center justify-end">
                    GP
                    {getSortIcon("games_played")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("saves")}
                >
                  <div className="flex items-center justify-end">
                    Saves
                    {getSortIcon("saves")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("goals_against")}
                >
                  <div className="flex items-center justify-end">
                    GA
                    {getSortIcon("goals_against")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("save_pct")}
                >
                  <div className="flex items-center justify-end">
                    SV%
                    {getSortIcon("save_pct")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("gaa")}
                >
                  <div className="flex items-center justify-end">
                    GAA
                    {getSortIcon("gaa")}
                  </div>
                </TableHead>
                <TableHead className="text-right text-xs md:text-sm min-w-[80px]">Record</TableHead>
                <TableHead
                  className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("total_shots_faced")}
                >
                  <div className="flex items-center justify-end">
                    Shots
                    {getSortIcon("total_shots_faced")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGoalies.map((stat, index) => {
                const overallRank = startIndex + index + 1
                const savesPct = stat.save_pct ? (stat.save_pct * 100).toFixed(1) : "0.0"
                const gaa = stat.games_played > 0 ? (stat.goals_against / stat.games_played).toFixed(2) : "0.00"

                return (
                  <TableRow key={`${stat.player_name}-${index}`}>
                    <TableCell className="text-xs md:text-sm font-medium">{overallRank}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <PlayerClickableLinkFlexible playerName={stat.player_name} />
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{stat.team_name || "Free Agent"}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {stat.rating_goalie != null ? (
                        <>
                          <span className="font-medium">{stat.rating_goalie}</span>
                          {stat.rating_goalie_label && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                              {stat.rating_goalie_label}
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
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
        {renderPagination(currentPage, sortedGoalies.length, onPageChange)}
      </div>
    )
  }

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

  const totalLeaders = [...totalPlayers].sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
  const offenseLeaders = [...forwards].sort((a, b) => b.goals - a.goals)
  const defenseLeaders = [...defensemen].sort((a, b) => b.plus_minus - a.plus_minus)
  const goalieLeaders = [...goalieStats].sort((a, b) => (b.save_pct || 0) - (a.save_pct || 0))

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
                    {season.name || `Season ${season.number || season.id} AHL`}
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
                {SEASON_6_WEEKS.map((week) => (
                  <SelectItem key={week.id} value={week.id}>
                    {week.displayName || week.name}
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
                  onClick={() => setSelectedTeam(t.id)}
                  className={`shrink-0 p-2 rounded-full border flex items-center justify-center hover:bg-muted transition ${
                    selectedTeam === t.id ? "bg-muted" : "bg-background"
                  }`}
                  title={t.name}
                >
                  {logo ? (
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

        {/* Statistics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="offense">Offense</TabsTrigger>
            <TabsTrigger value="defense">Defense</TabsTrigger>
            <TabsTrigger value="goalies">Goalies</TabsTrigger>
          </TabsList>

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

          <TabsContent value="total" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All SCSDHL Players</CardTitle>
                <CardDescription>Combined statistics for all AHL skaters (excludes goalies)</CardDescription>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(totalPlayers, false, totalPage, setTotalPage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SCSDHL Forwards</CardTitle>
                <CardDescription>Statistics for centers, left wings, and right wings</CardDescription>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(forwards, false, offensePage, setOffensePage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SCSDHL Defensemen</CardTitle>
                <CardDescription>Statistics for left and right defensemen</CardDescription>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(defensemen, true, defensePage, setDefensePage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SCSDHL Goalies</CardTitle>
                <CardDescription>Statistics for AHL goaltenders</CardDescription>
              </CardHeader>
              <CardContent>{renderGoalieStatsTable(goalieStats, goaliePage, setGoaliePage)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
