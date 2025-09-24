"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlayerClickableLinkFlexible } from "@/components/matches/player-clickable-link-flexible"
import { useMobile } from "@/hooks/use-mobile"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { mapEaPositionToStandard } from "@/lib/ea-position-mapper"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerStats } from "@/lib/statistics"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Week definitions for Season 1 - 7 weeks total
const SEASON_1_WEEKS = [
  {
    id: "all",
    name: "All Weeks",
    startDate: null,
    endDate: null,
  },
  {
    id: "week1",
    name: "Week 1",
    startDate: "2025-06-22",
    endDate: "2025-06-28",
    displayName: "Week 1 (Jun 22-28, 2025)",
  },
  {
    id: "week2",
    name: "Week 2",
    startDate: "2025-06-29",
    endDate: "2025-07-05",
    displayName: "Week 2 (Jun 29 - Jul 5, 2025)",
  },
  {
    id: "week3",
    name: "Week 3",
    startDate: "2025-07-06",
    endDate: "2025-07-12",
    displayName: "Week 3 (Jul 6-12, 2025)",
  },
  {
    id: "week4",
    name: "Week 4",
    startDate: "2025-07-13",
    endDate: "2025-07-19",
    displayName: "Week 4 (Jul 13-19, 2025)",
  },
  {
    id: "week5",
    name: "Week 5",
    startDate: "2025-07-20",
    endDate: "2025-07-26",
    displayName: "Week 5 (Jul 20-26, 2025)",
  },
  {
    id: "week6",
    name: "Week 6",
    startDate: "2025-07-27",
    endDate: "2025-08-02",
    displayName: "Week 6 (Jul 27 - Aug 2, 2025)",
  },
  {
    id: "week7",
    name: "Week 7",
    startDate: "2025-08-03",
    endDate: "2025-08-09",
    displayName: "Week 7 (Aug 3-9, 2025)",
  },
]

// Sort configuration type
type SortConfig = {
  key: string
  direction: "asc" | "desc"
}

// Define the TeamStats type
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

// Define the PlayerCard component
const PlayerCard = ({
  stat,
  rank,
  isDefense,
  isMobile,
}: { stat: any; rank: number; isDefense?: boolean; isMobile: boolean }) => {
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

// Define the GoalieCard component
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

interface PlayerStatsWithInfo extends PlayerStats {
  name: string
  teamId: number
  teamName: string
  teamLogo: string
}

export default function StatisticsPage() {
  const { supabase } = useSupabase()
  const isMobile = useMobile()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<any[]>([])
  const [selectedSeason, setSelectedSeason] = useState<any | null>(null)
  const [playerStats, setPlayerStats] = useState<any[]>([])
  const [goalieStats, setGoalieStats] = useState<any[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [playerMappings, setPlayerMappings] = useState<Record<string, string>>({})
  const [playerTeamMap, setPlayerTeamMap] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState("total")
  const [playerNameToTeamMap, setPlayerNameToTeamMap] = useState<Record<string, any>>({})
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [forwards, setForwards] = useState<any[]>([])
  const [defensemen, setDefensemen] = useState<any[]>([])
  const [totalPlayers, setTotalPlayers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [validPositions, setValidPositions] = useState<string[]>([])
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [season, setSeason] = useState(searchParams.get("season") || "1")
  const [week, setWeek] = useState(searchParams.get("week") || "All")
  const [tab, setTab] = useState(searchParams.get("tab") || "Total")
  const [playerStats2, setPlayerStats2] = useState<PlayerStatsWithInfo[]>([])

  // Pagination states
  const [totalPage, setTotalPage] = useState(1)
  const [offensePage, setOffensePage] = useState(1)
  const [defensePage, setDefensePage] = useState(1)
  const [goaliePage, setGoaliePage] = useState(1)
  const playersPerPage = isMobile ? 10 : 20

  // Expanded cards state for mobile
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const [selectedWeek, setSelectedWeek] = useState<string>("all")

  // Sort states for each tab
  const [totalSortConfig, setTotalSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [offenseSortConfig, setOffenseSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [defenseSortConfig, setDefenseSortConfig] = useState<SortConfig>({ key: "points", direction: "desc" })
  const [goalieSortConfig, setGoalieSortConfig] = useState<SortConfig>({ key: "save_pct", direction: "desc" })

  // Helper function to check if a date falls within a week range
  const isDateInWeek = (matchDate: string, weekStart: string, weekEnd: string): boolean => {
    const date = new Date(matchDate + "T12:00:00") // Use noon to avoid timezone issues
    const start = new Date(weekStart + "T00:00:00")
    const end = new Date(weekEnd + "T23:59:59")

    return date >= start && date <= end
  }

  // Helper function to get selected week info
  const getSelectedWeekInfo = () => {
    return SEASON_1_WEEKS.find((week) => week.id === selectedWeek) || SEASON_1_WEEKS[0]
  }

  // Helper function to extract date from match object
  const getMatchDate = (match: any): string | null => {
    // Use match_date field specifically
    if (match.match_date) {
      // Extract just the date part (YYYY-MM-DD)
      const dateStr = match.match_date.toString().split("T")[0]
      if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr
      }
    }

    return null
  }

  const toggleCardExpansion = (playerId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId)
    } else {
      newExpanded.add(playerId)
    }
    setExpandedCards(newExpanded)
  }

  // Sort function
  const sortPlayers = (players: any[], sortConfig: SortConfig) => {
    return [...players].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.key) {
        case "points":
          aValue = (a.goals || 0) + (a.assists || 0)
          bValue = (b.goals || 0) + (b.assists || 0)
          break
        case "ppg":
          const aPoints = (a.goals || 0) + (a.assists || 0)
          const bPoints = (b.goals || 0) + (b.assists || 0)
          aValue = a.games_played > 0 ? aPoints / a.games_played : 0
          bValue = b.games_played > 0 ? bPoints / b.games_played : 0
          break
        case "save_pct":
          aValue = a.save_pct || 0
          bValue = b.save_pct || 0
          break
        case "faceoff_pct":
          const aFaceoffTotal = a.faceoffs_taken || 0
          const bFaceoffTotal = b.faceoffs_taken || 0
          aValue = aFaceoffTotal > 0 ? (a.faceoffs_won || 0) / aFaceoffTotal : 0
          bValue = bFaceoffTotal > 0 ? (b.faceoffs_won || 0) / bFaceoffTotal : 0
          break
        case "pass_pct":
          const aPassAttempts = a.pass_attempted || 0
          const bPassAttempts = b.pass_attempted || 0
          aValue = aPassAttempts > 0 ? (a.pass_completed || 0) / aPassAttempts : 0
          bValue = bPassAttempts > 0 ? (b.pass_completed || 0) / bPassAttempts : 0
          break
        case "gaa":
          aValue = a.games_played > 0 ? (a.goals_against || 0) / a.games_played : 0
          bValue = b.games_played > 0 ? (b.goals_against || 0) / b.games_played : 0
          break
        default:
          aValue = a[sortConfig.key] || 0
          bValue = b[sortConfig.key] || 0
      }

      if (sortConfig.direction === "asc") {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }

  // Handle sort change
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

  // Get sort icon for column header
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
      return null // Don't show pagination if there's only one page
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

  // Fetch teams
  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name, is_active")
          .eq("is_active", true)
          .order("name")

        if (teamsError) {
          console.error("Error fetching teams:", teamsError)
          return
        }

        if (teamsData) {
          setTeams(teamsData)
        }
      } catch (error) {
        console.error("Error in fetchTeams:", error)
      }
    }

    fetchTeams()
  }, [supabase])

  // Fetch seasons and set default season
  useEffect(() => {
    async function fetchSeasons() {
      try {
        // First try to get seasons from the seasons table
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false })

        if (seasonsError) {
          console.error("Error fetching seasons:", seasonsError)
          setError(`Error loading seasons: ${seasonsError.message}`)
          return
        }

        if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData)

          // Find active season
          const activeSeason = seasonsData.find((s) => s.is_active === true)
          if (activeSeason) {
            setSelectedSeason(activeSeason)
          } else {
            // Default to first season
            setSelectedSeason(seasonsData[0])
          }
        } else {
          // If no seasons found, try to get current season from system_settings
          await fetchCurrentSeasonFromSettings()
        }
      } catch (error: any) {
        console.error("Error in fetchSeasons:", error)
        setError(`Error loading seasons: ${error.message}`)

        // Try fallback method
        await fetchCurrentSeasonFromSettings()
      } finally {
        setLoading(false)
      }
    }

    async function fetchCurrentSeasonFromSettings() {
      try {
        // Try to get current_season from system_settings as a key-value pair
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (error) {
          console.error("Error fetching settings:", error)
          setError(`Error fetching settings: ${error.message}`)
          return
        }

        if (data && data.value) {
          console.log("Found current season in settings:", data.value)

          // Try to get the season details using the number from settings
          const seasonNumber = Number.parseInt(data.value.toString(), 10)
          if (!isNaN(seasonNumber)) {
            // First try to find the season by its number property
            const { data: seasonData, error: seasonError } = await supabase
              .from("seasons")
              .select("*")
              .eq("number", seasonNumber)
              .single()

            if (!seasonError && seasonData) {
              setSelectedSeason(seasonData)
              return
            }

            // If that fails, create a default season object with the number
            setSelectedSeason({
              id: seasonNumber.toString(),
              number: seasonNumber,
              name: `Season ${seasonNumber}`,
              is_active: true,
            })
          }
        } else {
          // Default to season 1 if nothing else works
          setSelectedSeason({
            id: "1",
            number: 1,
            name: "Season 1",
            is_active: true,
          })
        }
      } catch (error: any) {
        console.error("Error fetching current season from settings:", error)
        setError(`Error fetching current season: ${error.message}`)
        // Default to season 1 as last resort
        setSelectedSeason({
          id: "1",
          number: 1,
          name: "Season 1",
          is_active: true,
        })
      }
    }

    fetchSeasons()
  }, [supabase])

  // Fetch player mappings
  useEffect(() => {
    async function fetchPlayerMappings() {
      try {
        // Try to fetch EA player mappings
        const { data, error } = await supabase.from("ea_player_mappings").select("ea_player_id, player_id, player_name")

        if (!error && data && data.length > 0) {
          const mappings: Record<string, string> = {}
          const nameToIdMap: Record<string, string> = {}

          // Create a mapping from EA Player ID to MGHL Player ID
          data.forEach((mapping) => {
            if (mapping.ea_player_id && mapping.player_id) {
              mappings[mapping.ea_player_id.toString()] = mapping.player_id
            }

            // Also create a mapping from player name to player ID
            if (mapping.player_name && mapping.player_id) {
              nameToIdMap[mapping.player_name.toLowerCase()] = mapping.player_id
            }
          })

          // Specifically ensure the LispDoge mapping exists
          if (!mappings["1005699228134"]) {
            mappings["1005699228134"] = "657dbb12-0db5-4a8b-94da-7dea7eba7409"
          }

          // Add LispDoge to name mapping
          nameToIdMap["lispdoge"] = "657dbb12-0db5-4a8b-94da-7dea7eba7409"

          setPlayerMappings(mappings)

          // Now fetch all players with their gamer tags and team info
          const { data: playersData, error: playersError } = await supabase.from("players").select(`
              id, 
              team_id,
              teams(id, name),
              users(id, gamer_tag_id)
            `)

          if (!playersError && playersData) {
            const playerNameMap: Record<string, any> = {}

            playersData.forEach((player) => {
              if (player.users?.gamer_tag_id) {
                const gamerTag = player.users.gamer_tag_id.toLowerCase()
                playerNameMap[gamerTag] = {
                  player_id: player.id,
                  team_id: player.team_id,
                  team_name: player.teams?.name || "Free Agent",
                }
              }
            })

            setPlayerNameToTeamMap(playerNameMap)
          }
        } else {
          // If no mappings found in the database, at least add the LispDoge mapping
          setPlayerMappings({
            "1005699228134": "657dbb12-0db5-4a8b-94da-7dea7eba7409",
          })
        }
      } catch (error) {
        console.error("Error fetching player mappings:", error)
        // Even if there's an error, ensure the LispDoge mapping exists
        setPlayerMappings({
          "1005699228134": "657dbb12-0db5-4a8b-94da-7dea7eba7409",
        })
      }
    }

    fetchPlayerMappings()
  }, [supabase])

  // Fetch player team information
  useEffect(() => {
    async function fetchPlayerTeams() {
      try {
        // Fetch all players with their team information
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("id, user_id, team_id, teams(id, name), users(id, gamer_tag_id)")

        if (playersError) {
          console.error("Error fetching player teams:", playersError)
          return
        }

        if (playersData && playersData.length > 0) {
          const teamMap: Record<string, any> = {}
          const gamerTagMap: Record<string, any> = {}

          // Create a mapping of player ID to team information
          playersData.forEach((player) => {
            if (player.id) {
              teamMap[player.id] = {
                team_id: player.team_id,
                team_name: player.teams?.name || null,
              }

              // Also map gamer tag to team info
              if (player.users?.gamer_tag_id) {
                gamerTagMap[player.users.gamer_tag_id.toLowerCase()] = {
                  player_id: player.id,
                  team_id: player.team_id,
                  team_name: player.teams?.name || "Free Agent",
                }
              }
            }
          })

          // Ensure LispDoge is mapped to St Louis Skyhawks
          const lispDogeId = "657dbb12-0db5-4a8b-94da-7dea7eba7409"

          // Find St Louis Skyhawks team ID
          const { data: stLouisTeam, error: stLouisError } = await supabase
            .from("teams")
            .select("id, name")
            .ilike("name", "%St Louis%")
            .single()

          if (!stLouisError && stLouisTeam) {
            teamMap[lispDogeId] = {
              team_id: stLouisTeam.id,
              team_name: stLouisTeam.name,
            }

            // Add to gamer tag map
            gamerTagMap["lispdoge"] = {
              player_id: lispDogeId,
              team_id: stLouisTeam.id,
              team_name: stLouisTeam.name,
            }
          } else {
            // Hardcode St Louis Skyhawks if we can't find it
            teamMap[lispDogeId] = {
              team_id: "f5a923d4-2d9b-45b3-af2a-1f2e69436394",
              team_name: "St Louis Skyhawks",
            }

            // Add to gamer tag map
            gamerTagMap["lispdoge"] = {
              player_id: lispDogeId,
              team_id: "f5a923d4-2d9b-45b3-af2a-1f2e69436394",
              team_name: "St Louis Skyhawks",
            }
          }

          setPlayerTeamMap(teamMap)
          setPlayerNameToTeamMap(gamerTagMap)
        }
      } catch (error) {
        console.error("Error in fetchPlayerTeams:", error)
      }
    }

    fetchPlayerTeams()
  }, [supabase])

  // Fetch player stats when season and tab changes
  useEffect(() => {
    async function fetchPlayerStats() {
      if (!selectedSeason) return

      try {
        setLoading(true)
        let seasonNumber = 1
        const seasonId = selectedSeason.id
        const isPlayoffSeason = selectedSeason.name?.toLowerCase().includes("playoff") || false

        // Extract season number - handle playoff seasons specially
        if (selectedSeason.number && !isNaN(Number(selectedSeason.number)) && selectedSeason.number > 0) {
          seasonNumber = Number(selectedSeason.number)
        } else if (selectedSeason.name && /Season\s+(\d+)/i.test(selectedSeason.name)) {
          const match = /Season\s+(\d+)/i.exec(selectedSeason.name)
          seasonNumber = Number(match![1])
        } else if (isPlayoffSeason && selectedSeason.name) {
          // For playoff seasons, extract the base season number from the name
          const playoffMatch = /Season\s+(\d+)\s+Playoff/i.exec(selectedSeason.name)
          if (playoffMatch) {
            seasonNumber = Number(playoffMatch[1])
          }
        }

        console.log(`Fetching player stats for season ${seasonNumber}, ID: ${seasonId}, isPlayoff: ${isPlayoffSeason}`)

        // Fetch all player stats for this season
        const { data: allPlayerStats, error: playerStatsError } = await supabase
          .from("ea_player_stats")
          .select("*")
          .eq("season_id", seasonNumber)

        if (playerStatsError) {
          console.error("Error fetching player stats:", playerStatsError)
          setError(`Error fetching player stats: ${playerStatsError.message}`)
          return
        }

        console.log(`Found ${allPlayerStats?.length || 0} total player stat records for season ${seasonNumber}`)

        if (!allPlayerStats || allPlayerStats.length === 0) {
          setForwards([])
          setDefensemen([])
          setGoalieStats([])
          setTotalPlayers([])
          return
        }

        // Get all unique match IDs from the player stats
        const allMatchIds = [...new Set(allPlayerStats.map((stat) => stat.match_id))]
        console.log(`Found ${allMatchIds.length} unique match IDs in player stats`)

        // Now fetch match information for these match IDs to get dates and results
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select(
            "id, home_team_id, away_team_id, home_score, away_score, status, season_id, season_name, overtime, has_overtime, match_date",
          )
          .in("id", allMatchIds)

        if (matchesError) {
          console.error("Error fetching matches:", matchesError)
          // Continue without match data - we'll still show stats but without W/L records
        }

        console.log(`Found ${matchesData?.length || 0} matches with data`)

        // Filter player stats by week if not "all"
        let filteredPlayerStats = allPlayerStats
        const weekInfo = getSelectedWeekInfo()

        if (selectedWeek !== "all" && weekInfo.startDate && weekInfo.endDate && matchesData) {
          // Create a set of match IDs that fall within the selected week
          const weekMatchIds = new Set<string>()

          matchesData.forEach((match) => {
            const matchDate = getMatchDate(match)
            if (matchDate && isDateInWeek(matchDate, weekInfo.startDate!, weekInfo.endDate!)) {
              weekMatchIds.add(match.id)
            }
          })

          // Filter player stats to only include matches from the selected week
          filteredPlayerStats = allPlayerStats.filter((stat) => weekMatchIds.has(stat.match_id))

          console.log(
            `Filtered to ${filteredPlayerStats.length} player stat records for ${weekInfo.displayName || weekInfo.name}`,
          )
        } else {
          console.log(`Using all ${allPlayerStats.length} player stat records (All Weeks selected)`)
        }

        // Build a map of match results: match_id -> { home_result, away_result }
        const matchResultsMap = new Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>()

        if (matchesData) {
          matchesData.forEach((match) => {
            if (match.home_score !== null && match.away_score !== null) {
              // Check for overtime in multiple ways
              const isOvertime =
                match.overtime === true ||
                match.has_overtime === true ||
                (match.status && match.status.toLowerCase().includes("overtime")) ||
                (match.status && match.status.includes("(OT)"))

              let homeResult: "W" | "L" | "OTL"
              let awayResult: "W" | "L" | "OTL"

              if (match.home_score > match.away_score) {
                // Home team won
                homeResult = "W"
                awayResult = isOvertime ? "OTL" : "L"
              } else if (match.away_score > match.home_score) {
                // Away team won
                awayResult = "W"
                homeResult = isOvertime ? "OTL" : "L"
              } else {
                // Tie (shouldn't happen in hockey, but just in case)
                homeResult = "OTL"
                awayResult = "OTL"
              }

              matchResultsMap.set(match.id, { home_result: homeResult, away_result: awayResult })
            }
          })
        }

        console.log(`Built match results map with ${matchResultsMap.size} entries`)

        processPlayerStats(filteredPlayerStats, matchResultsMap, matchesData || [])

        function processPlayerStats(
          statsData: any[],
          matchResultsMap: Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>,
          matchesData: any[],
        ) {
          console.log(`Processing ${statsData.length} player stat records`)

          // Create a map of match_id to match data for quick lookup
          const matchDataMap = new Map()
          matchesData.forEach((match) => {
            matchDataMap.set(match.id, match)
          })

          // Debug: Log unique player names in the stats data
          const uniquePlayerNames = new Set(statsData.map((s) => s.player_name?.toLowerCase()?.trim()).filter(Boolean))
          console.log(
            `Found ${uniquePlayerNames.size} unique players in stats data:`,
            Array.from(uniquePlayerNames).sort(),
          )

          // Check for dtizz87 specifically
          const dtizzStats = statsData.filter((s) => s.player_name?.toLowerCase()?.trim() === "dtizz87")
          console.log(
            `Found ${dtizzStats.length} stat records for dtizz87:`,
            dtizzStats.map((s) => s.match_id),
          )

          // FIXED: Process stats by position for each tab separately
          // Create separate maps for each position category
          const offenseStatsMap = new Map<string, any>()
          const defenseStatsMap = new Map<string, any>()
          const goalieStatsMap = new Map<string, any>()
          const totalStatsMap = new Map<string, any>() // For total tab - combines all positions

          statsData.forEach((stat) => {
            // Use a more robust player name key that handles potential null/undefined values
            const rawPlayerName = stat.player_name
            if (!rawPlayerName || typeof rawPlayerName !== "string") {
              console.log("Skipping stat with invalid player name:", stat)
              return
            }

            const playerName = rawPlayerName.toLowerCase().trim()
            if (!playerName || playerName === "unknown" || playerName === "") {
              console.log("Skipping stat with empty player name:", stat)
              return
            }

            const position = mapEaPositionToStandard(stat.position || "")

            // Debug specific player
            if (playerName === "dtizz87") {
              console.log(`Found dtizz87 stat:`, {
                match_id: stat.match_id,
                position: stat.position,
                mapped_position: position,
                goals: stat.goals,
                assists: stat.assists,
              })
            }

            // Determine position category
            const isOffense =
              position === "C" ||
              position === "LW" ||
              position === "RW" ||
              position === "5" ||
              position === "4" ||
              position === "3"
            const isDefense = position === "LD" || position === "RD" || position === "1" || position === "2"
            const isGoalie = position === "G" || position === "0"

            // Helper function to initialize player stats
            const initializePlayerStats = (playerName: string, stat: any) => ({
              player_name: rawPlayerName, // Use original name for display
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

            // Helper function to aggregate stats
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

              // Goalie stats
              if (isGoalie) {
                aggregated.saves += stat.saves || 0
                aggregated.goals_against += stat.goals_against || 0
                aggregated.glshots += stat.glshots || 0
                aggregated.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
              }

              aggregated.points = aggregated.goals + aggregated.assists
            }

            // Process for offense tab (only offense positions)
            if (isOffense) {
              if (!offenseStatsMap.has(playerName)) {
                offenseStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const offenseAggregated = offenseStatsMap.get(playerName)!
              aggregateStats(offenseAggregated, stat)
            }

            // Process for defense tab (only defense positions)
            if (isDefense) {
              if (!defenseStatsMap.has(playerName)) {
                defenseStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const defenseAggregated = defenseStatsMap.get(playerName)!
              aggregateStats(defenseAggregated, stat)
            }

            // Process for goalie tab (only goalie positions)
            if (isGoalie) {
              if (!goalieStatsMap.has(playerName)) {
                goalieStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const goalieAggregated = goalieStatsMap.get(playerName)!
              aggregateStats(goalieAggregated, stat)
            }

            // Process for total tab (all positions combined)
            if (isOffense || isDefense) {
              // Exclude goalies from total tab
              if (!totalStatsMap.has(playerName)) {
                totalStatsMap.set(playerName, initializePlayerStats(playerName, stat))
              }
              const totalAggregated = totalStatsMap.get(playerName)!
              aggregateStats(totalAggregated, stat)
            }
          })

          // Debug: Log how many players we have in each category
          console.log(
            `Players by category: Total: ${totalStatsMap.size}, Offense: ${offenseStatsMap.size}, Defense: ${defenseStatsMap.size}, Goalies: ${goalieStatsMap.size}`,
          )

          // Check if dtizz87 is in any category
          console.log(`dtizz87 in categories:`, {
            total: totalStatsMap.has("dtizz87"),
            offense: offenseStatsMap.has("dtizz87"),
            defense: defenseStatsMap.has("dtizz87"),
            goalies: goalieStatsMap.has("dtizz87"),
          })

          // Helper function to finalize player stats
          const finalizePlayerStats = (playerStatsMap: Map<string, any>) => {
            const players: any[] = []

            playerStatsMap.forEach((player, playerKey) => {
              const playerName = player.player_name?.toLowerCase()?.trim()

              // Set games_played to the count of unique matches
              player.games_played = player.unique_matches.size

              // Calculate W/L/OTL for each unique match
              player.unique_matches.forEach((matchId: string) => {
                const matchResult = matchResultsMap.get(matchId)
                const matchData = matchDataMap.get(matchId)

                if (matchResult && matchData) {
                  // Find the team_id for this player in this match
                  const playerStats = statsData.filter(
                    (s) => s.match_id === matchId && s.player_name?.toLowerCase()?.trim() === playerName,
                  )

                  if (playerStats.length > 0) {
                    const stat = playerStats[0]
                    let playerResult: "W" | "L" | "OTL" | null = null

                    // Determine if player was on home or away team
                    if (stat.team_id === matchData.home_team_id) {
                      playerResult = matchResult.home_result
                    } else if (stat.team_id === matchData.away_team_id) {
                      playerResult = matchResult.away_result
                    } else {
                      // Try to match by player name if team_id doesn't match
                      const playerTeamInfo = playerNameToTeamMap[playerName]
                      if (playerTeamInfo && playerTeamInfo.team_id) {
                        if (playerTeamInfo.team_id === matchData.home_team_id) {
                          playerResult = matchResult.home_result
                        } else if (playerTeamInfo.team_id === matchData.away_team_id) {
                          playerResult = matchResult.away_result
                        }
                      }
                    }

                    // Update player's record based on result
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

              // Calculate final stats
              player.faceoffs_lost = player.faceoffs_taken - player.faceoffs_won

              // Calculate goalie save percentages
              if ((player.position === "G" || player.position === "0") && player.total_shots_faced > 0) {
                player.save_pct = player.saves / player.total_shots_faced
              }

              // Remove the unique_matches set as it's no longer needed
              delete player.unique_matches

              // Add team information
              const teamInfo = playerNameToTeamMap[playerName]
              player.team_name = teamInfo?.team_name || "Free Agent"
              player.team_id = teamInfo?.team_id || null

              // Apply team filter
              if (selectedTeam === "all" || player.team_id === selectedTeam) {
                players.push(player)
              }
            })

            return players
          }

          // Finalize stats for each tab
          const offensePlayers = finalizePlayerStats(offenseStatsMap)
          const defensePlayers = finalizePlayerStats(defenseStatsMap)
          const goaliePlayers = finalizePlayerStats(goalieStatsMap)
          const totalPlayers = finalizePlayerStats(totalStatsMap)

          console.log(
            `Final categorized players: ${totalPlayers.length} total, ${offensePlayers.length} offense, ${defensePlayers.length} defense, ${goaliePlayers.length} goalies`,
          )

          // Debug: Check if dtizz87 made it to final arrays
          const dtizzTotal = totalPlayers.find((p) => p.player_name?.toLowerCase()?.trim() === "dtizz87")
          const dtizzOffense = offensePlayers.find((p) => p.player_name?.toLowerCase()?.trim() === "dtizz87")
          const dtizzDefense = defensePlayers.find((p) => p.player_name?.toLowerCase()?.trim() === "dtizz87")

          console.log(`dtizz87 in final arrays:`, {
            total: !!dtizzTotal,
            offense: !!dtizzOffense,
            defense: !!dtizzDefense,
            totalStats: dtizzTotal
              ? `${dtizzTotal.games_played} games, ${dtizzTotal.goals}G ${dtizzTotal.assists}A`
              : "not found",
            offenseStats: dtizzOffense
              ? `${dtizzOffense.games_played} games, ${dtizzOffense.goals}G ${dtizzOffense.assists}A`
              : "not found",
            defenseStats: dtizzDefense
              ? `${dtizzDefense.games_played} games, ${dtizzDefense.goals}G ${dtizzDefense.assists}A`
              : "not found",
          })

          setTotalPlayers(totalPlayers)
          setForwards(offensePlayers)
          setDefensemen(defensePlayers)
          setGoalieStats(goaliePlayers)
        }
      } catch (error: any) {
        console.error("Error fetching player stats:", error)
        setError(`Error fetching player stats: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [supabase, selectedSeason, selectedWeek, playerTeamMap, playerNameToTeamMap, selectedTeam])

  // Reset pagination when tab changes
  useEffect(() => {
    setTotalPage(1)
    setOffensePage(1)
    setDefensePage(1)
    setGoaliePage(1)
  }, [activeTab, selectedSeason])

  // Reset pagination when week changes
  useEffect(() => {
    setTotalPage(1)
    setOffensePage(1)
    setDefensePage(1)
    setGoaliePage(1)
  }, [selectedWeek])

  // Reset pagination when team changes
  useEffect(() => {
    setTotalPage(1)
    setOffensePage(1)
    setDefensePage(1)
    setGoaliePage(1)
  }, [selectedTeam])

  const handleSeasonChange = (seasonId: string) => {
    const season = seasons.find((s) => s.id.toString() === seasonId)
    setSelectedSeason(season || null)
    // Reset filters when season changes
    setSelectedWeek("all")
    setSelectedTeam("all")
  }

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId)
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId)
  }

  const renderPlayerStatsTable = (
    players: any[],
    isDefense = false,
    currentPage = 1,
    onPageChange: (page: number) => void,
  ) => {
    if (players.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No player statistics available</p>
        </div>
      )
    }

    // Get current sort config
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

    // Sort players
    const sortedPlayers = sortPlayers(players, currentSortConfig)

    // Paginate players
    const startIndex = (currentPage - 1) * playersPerPage
    const endIndex = startIndex + playersPerPage
    const paginatedPlayers = sortedPlayers.slice(startIndex, endIndex)

    // Mobile card layout
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
                />
              )
            })}
          </div>
          {renderPagination(currentPage, sortedPlayers.length, onPageChange)}
        </div>
      )
    }

    // Desktop table layout
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
                      className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("faceoffs_won")}
                    >
                      <div className="flex items-center justify-end">
                        FOW
                        {getSortIcon("faceoffs_won")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right text-xs md:text-sm min-w-[50px] cursor-pointer hover:bg-muted/50"
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
            <TableBody>
              {paginatedPlayers.map((stat, index) => {
                const overallRank = startIndex + index + 1

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

                // Calculate PPG
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
        {renderPagination(currentPage, sortedPlayers.length, onPageChange)}
      </div>
    )
  }

  const renderGoalieStatsTable = (goalies: any[], currentPage = 1, onPageChange: (page: number) => void) => {
    if (goalies.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No goalie statistics available</p>
        </div>
      )
    }

    // Sort goalies
    const sortedGoalies = sortPlayers(goalies, goalieSortConfig)

    // Paginate goalies
    const startIndex = (currentPage - 1) * playersPerPage
    const endIndex = startIndex + playersPerPage
    const paginatedGoalies = sortedGoalies.slice(startIndex, endIndex)

    // Mobile card layout
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

    // Desktop table layout
    return (
      <div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm min-w-[40px]">Rank</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[100px]">Player</TableHead>
                <TableHead className="text-xs md:text-sm min-w-[80px]">Team</TableHead>
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

                // Calculate save percentage
                const savesPct = stat.save_pct ? (stat.save_pct * 100).toFixed(1) : "0.0"

                // Calculate GAA (goals against average per game)
                const gaa = stat.games_played > 0 ? (stat.goals_against / stat.games_played).toFixed(2) : "0.00"

                return (
                  <TableRow key={`${stat.player_name}-${index}`}>
                    <TableCell className="text-xs md:text-sm font-medium">{overallRank}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <PlayerClickableLinkFlexible playerName={stat.player_name} />
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{stat.team_name || "Free Agent"}</TableCell>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Player Statistics</h1>
          <p className="text-muted-foreground">View comprehensive player statistics across all seasons</p>
        </div>

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
                {SEASON_1_WEEKS.map((week) => (
                  <SelectItem key={week.id} value={week.id}>
                    {week.displayName || week.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={selectedTeam} onValueChange={handleTeamChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="offense">Offense</TabsTrigger>
            <TabsTrigger value="defense">Defense</TabsTrigger>
            <TabsTrigger value="goalies">Goalies</TabsTrigger>
          </TabsList>

          <TabsContent value="total" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Players</CardTitle>
                <CardDescription>Combined statistics for all skaters (excludes goalies)</CardDescription>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(totalPlayers, false, totalPage, setTotalPage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forwards</CardTitle>
                <CardDescription>Statistics for centers, left wings, and right wings</CardDescription>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(forwards, false, offensePage, setOffensePage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Defensemen</CardTitle>
                <CardDescription>Statistics for left and right defensemen</CardDescription>
              </CardHeader>
              <CardContent>{renderPlayerStatsTable(defensemen, true, defensePage, setDefensePage)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Goalies</CardTitle>
                <CardDescription>Statistics for goaltenders</CardDescription>
              </CardHeader>
              <CardContent>{renderGoalieStatsTable(goalieStats, goaliePage, setGoaliePage)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
