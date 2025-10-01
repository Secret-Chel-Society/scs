"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { EditScoreModal } from "./edit-score-modal"
import { TeamLogo } from "@/components/team-logo"
import { UploadMatchButton } from "./upload-match-button"

interface ComprehensiveMatchViewProps {
  match: any
  isAdmin?: boolean
}

interface PlayerStat {
  player_name: string
  player_id: string
  team_id: string
  goals: number
  assists: number
  shots: number
  hits: number
  pim: number
  plus_minus: number
  blocks: number
  position?: string
  toi?: string
  save_pct?: number
  saves?: number
  goals_against?: number
  rating?: number
  takeaways?: number
  giveaways?: number
  faceoffs_won?: number
  faceoffs_taken?: number
  faceoff_pct?: number
  passing_pct?: number
  shot_attempts?: number
  shot_pct?: number
  pass_attempts?: number
  pass_complete?: number
  penalties_drawn?: number
  ppg?: number
  shg?: number
  time_with_puck?: number
  interceptions?: number
}

interface Lineup {
  id: string
  match_id: string
  team_id: string
  player_id: string
  position: string
  line_number: number
  is_starter: boolean
  player_name?: string
}

interface TeamStats {
  goals: number
  shots: number
  hits: number
  pim: number
  blocks: number
  passing_pct?: number
  faceoff_pct?: number
  pp_goals?: number
  pp_opportunities?: number
  team_name: string
  team_id: string
  toa?: number
  total_faceoffs_won?: number
  total_faceoffs_taken?: number
  total_pass_complete?: number
  total_pass_attempts?: number
}

interface TeamStanding {
  id: string
  name: string
  wins: number
  losses: number
  otl: number
  points: number
}

// Team color mappings
const getTeamColors = (teamName: string) => {
  const teamColorMap: { [key: string]: { primary: string; secondary: string; accent: string } } = {
    Firebirds: { primary: "bg-red-600", secondary: "bg-red-700", accent: "border-red-500" },
    Bruins: { primary: "bg-yellow-500", secondary: "bg-yellow-600", accent: "border-yellow-400" },
    Rangers: { primary: "bg-blue-600", secondary: "bg-blue-700", accent: "border-blue-500" },
    Penguins: { primary: "bg-yellow-400", secondary: "bg-black", accent: "border-yellow-300" },
    Capitals: { primary: "bg-red-600", secondary: "bg-red-700", accent: "border-red-500" },
    Lightning: { primary: "bg-blue-500", secondary: "bg-blue-600", accent: "border-blue-400" },
    Panthers: { primary: "bg-red-500", secondary: "bg-blue-800", accent: "border-red-400" },
    "Maple Leafs": { primary: "bg-blue-600", secondary: "bg-blue-700", accent: "border-blue-500" },
  }

  return teamColorMap[teamName] || { primary: "bg-ice-blue-600", secondary: "bg-ice-blue-700", accent: "border-ice-blue-500" }
}

export function ComprehensiveMatchView({ match, isAdmin = false }: ComprehensiveMatchViewProps) {
  const { supabase } = useSupabase()
  const [openScoreModal, setOpenScoreModal] = useState(false)
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [teamStandings, setTeamStandings] = useState<{ [key: string]: TeamStanding }>({})
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [loading, setLoading] = useState(true)
  const [standingsLoading, setStandingsLoading] = useState(true)
  const [seasonInfo, setSeasonInfo] = useState<{ week: number; season: string } | null>(null)

  useEffect(() => {
    fetchMatchStats()
    fetchTeamStandings()
    fetchSeasonInfo()
    fetchLineups()
  }, [match.id])

  const fetchLineups = async () => {
    try {
      const { data: lineupsData, error } = await supabase
        .from("lineups")
        .select(`
          *,
          players (
            id,
            users (
              id,
              gamer_tag_id,
              username
            )
          )
        `)
        .eq("match_id", match.id)
        .order("team_id")
        .order("line_number")
        .order("position")

      if (error) {
        console.error("Error fetching lineups:", error)
        return
      }

      if (lineupsData) {
        const mappedLineups = lineupsData.map((lineup: any) => ({
          ...lineup,
          player_name: lineup.players?.users?.gamer_tag_id || lineup.players?.users?.username || "Unknown Player",
        }))
        setLineups(mappedLineups)
      }
    } catch (error) {
      console.error("Error fetching lineups:", error)
    }
  }

  const fetchSeasonInfo = async () => {
    try {
      // Get season information from the match
      if (match.season_name) {
        // Extract season number from season name (e.g., "Season 51" -> 51)
        const seasonMatch = match.season_name.match(/Season (\d+)/)
        const seasonNumber = seasonMatch ? seasonMatch[1] : "51"

        // Calculate week based on match date or use a default
        // This is a simplified calculation - you might want to implement proper week calculation
        const matchDate = new Date(match.match_date || match.date)
        const seasonStart = new Date(matchDate.getFullYear(), 8, 1) // Assume season starts Sept 1
        const weeksDiff = Math.floor((matchDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const week = Math.max(1, Math.min(weeksDiff + 1, 20)) // Cap between 1-20 weeks

        setSeasonInfo({
          week: week,
          season: `Season ${seasonNumber}`,
        })
      } else {
        // Fallback to default
        setSeasonInfo({
          week: 8,
          season: "Season 51",
        })
      }
    } catch (error) {
      console.error("Error calculating season info:", error)
      setSeasonInfo({
        week: 8,
        season: "Season 51",
      })
    }
  }

  const fetchTeamStandings = async () => {
    try {
      setStandingsLoading(true)
      console.log("Fetching standings for season:", match.season_name)

      // Try to get season-specific standings, but fallback to general standings
      const url = "/api/standings"

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log("Standings response:", data)

        // Handle both array response and object with standings property
        const standings = Array.isArray(data) ? data : data.standings || []

        const standingsMap: { [key: string]: TeamStanding } = {}
        standings.forEach((team: TeamStanding) => {
          standingsMap[team.id] = team
        })
        setTeamStandings(standingsMap)
        console.log("Standings map:", standingsMap)
      } else {
        console.error("Failed to fetch standings:", response.status, response.statusText)
        // Set empty standings to prevent loading state from hanging
        setTeamStandings({})
      }
    } catch (error) {
      console.error("Error fetching team standings:", error)
      // Set empty standings to prevent loading state from hanging
      setTeamStandings({})
    } finally {
      setStandingsLoading(false)
    }
  }

  const fetchMatchStats = async () => {
    try {
      setLoading(true)

      // Fetch EA player stats
      const { data: statsData } = await supabase.from("ea_player_stats").select("*").eq("match_id", match.id)

      if (statsData && statsData.length > 0) {
        setPlayerStats(statsData)

        // Calculate team stats from player stats
        const homeStats: TeamStats = {
          team_id: match.home_team_id,
          team_name: match.home_team.name,
          goals: 0,
          shots: 0,
          hits: 0,
          pim: 0,
          blocks: 0,
          pp_goals: 0,
          pp_opportunities: 0,
          toa: 0,
          total_faceoffs_won: 0,
          total_faceoffs_taken: 0,
          total_pass_complete: 0,
          total_pass_attempts: 0,
        }

        const awayStats: TeamStats = {
          team_id: match.away_team_id,
          team_name: match.away_team.name,
          goals: 0,
          shots: 0,
          hits: 0,
          pim: 0,
          blocks: 0,
          pp_goals: 0,
          pp_opportunities: 0,
          toa: 0,
          total_faceoffs_won: 0,
          total_faceoffs_taken: 0,
          total_pass_complete: 0,
          total_pass_attempts: 0,
        }

        statsData.forEach((stat) => {
          const teamStat = stat.team_id === match.home_team_id ? homeStats : awayStats
          teamStat.goals += stat.goals || 0
          teamStat.shots += stat.shots || 0
          teamStat.hits += stat.hits || 0
          teamStat.pim += stat.pim || 0
          teamStat.blocks += stat.blocks || 0
          teamStat.pp_goals += stat.ppg || 0
          teamStat.total_faceoffs_won += stat.faceoffs_won || 0
          teamStat.total_faceoffs_taken += stat.faceoffs_taken || 0
          teamStat.total_pass_complete += stat.pass_complete || 0
          teamStat.total_pass_attempts += stat.pass_attempts || 0
        })

        // Calculate percentages
        homeStats.faceoff_pct =
          homeStats.total_faceoffs_taken > 0 ? (homeStats.total_faceoffs_won / homeStats.total_faceoffs_taken) * 100 : 0
        awayStats.faceoff_pct =
          awayStats.total_faceoffs_taken > 0 ? (awayStats.total_faceoffs_won / awayStats.total_faceoffs_taken) * 100 : 0

        homeStats.passing_pct =
          homeStats.total_pass_attempts > 0 ? (homeStats.total_pass_complete / homeStats.total_pass_attempts) * 100 : 0
        awayStats.passing_pct =
          awayStats.total_pass_attempts > 0 ? (awayStats.total_pass_complete / awayStats.total_pass_attempts) * 100 : 0

        setTeamStats([homeStats, awayStats])
      }
    } catch (error) {
      console.error("Error fetching match stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }

  const getTopPlayers = (teamId: string, limit = 3) => {
    return playerStats
      .filter((p) => p.team_id === teamId && p.position !== "G")
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
      .slice(0, limit)
  }

  const getGoalies = (teamId: string) => {
    return playerStats.filter((p) => p.team_id === teamId && p.position === "G")
  }

  const getSkaters = (teamId: string) => {
    return playerStats.filter((p) => p.team_id === teamId && p.position !== "G")
  }

  // Helper function to calculate GAA
  const calculateGAA = (goalsAgainst: number, toi: string) => {
    if (!toi || !goalsAgainst) return "0.00"

    // Parse TOI (format: "MM:SS")
    const [minutes, seconds] = toi.split(":").map(Number)
    const totalMinutes = minutes + seconds / 60

    if (totalMinutes === 0) return "0.00"

    // GAA = (Goals Against * 60) / Minutes Played
    const gaa = (goalsAgainst * 60) / totalMinutes
    return gaa.toFixed(2)
  }

  // Helper function to format save percentage
  const formatSavePercentage = (savePct: number) => {
    if (!savePct) return ".000"
    // Convert to decimal format (e.g., 0.875 becomes ".875")
    return savePct.toFixed(3)
  }

  const homeTeamStats = teamStats.find((t) => t.team_id === match.home_team_id)
  const awayTeamStats = teamStats.find((t) => t.team_id === match.away_team_id)
  const homeColors = getTeamColors(match.home_team.name)
  const awayColors = getTeamColors(match.away_team.name)

  // Get team standings
  const homeStanding = teamStandings[match.home_team_id]
  const awayStanding = teamStandings[match.away_team_id]

  // Use match_date or date field
  const matchDate = match.match_date || match.date

  // Show edit button only for "in progress" games
  const showEditButton = isAdmin && (match.status === "in progress" || match.status === "In Progress")

  // Get period scores from match data
  const getPeriodScores = () => {
    if (!match.period_scores) return []

    try {
      const scores = typeof match.period_scores === "string" ? JSON.parse(match.period_scores) : match.period_scores

      return [
        { period: 1, home: scores.period1?.home || 0, away: scores.period1?.away || 0 },
        { period: 2, home: scores.period2?.home || 0, away: scores.period2?.away || 0 },
        { period: 3, home: scores.period3?.home || 0, away: scores.period3?.away || 0 },
        ...(match.overtime || match.has_overtime
          ? [{ period: "OT", home: scores.overtime?.home || 0, away: scores.overtime?.away || 0 }]
          : []),
      ]
    } catch {
      return []
    }
  }

  const periodScores = getPeriodScores()

  // Component for stat comparison bars
  const StatComparisonBar = ({
    label,
    homeValue,
    awayValue,
    homeTeam,
    awayTeam,
    isPercentage = false,
  }: {
    label: string
    homeValue: number
    awayValue: number
    homeTeam: string
    awayTeam: string
    isPercentage?: boolean
  }) => {
    const total = homeValue + awayValue
    const homePercentage = total > 0 ? (homeValue / total) * 100 : 50
    const awayPercentage = total > 0 ? (awayValue / total) * 100 : 50

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-hockey-silver-300">{label}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-white font-semibold w-12 text-right">
            {isPercentage ? `${homeValue.toFixed(1)}%` : homeValue}
          </span>
          <div className="flex-1 h-2 bg-hockey-silver-700 dark:bg-hockey-silver-600 rounded-full overflow-hidden">
            <div
              className={`h-full ${homeColors.primary} transition-all duration-300`}
              style={{ width: `${homePercentage}%` }}
            />
          </div>
          <div className="flex-1 h-2 bg-hockey-silver-700 dark:bg-hockey-silver-600 rounded-full overflow-hidden">
            <div
              className={`h-full ${awayColors.primary} transition-all duration-300 ml-auto`}
              style={{ width: `${awayPercentage}%` }}
            />
          </div>
          <span className="text-white font-semibold w-12 text-left">
            {isPercentage ? `${awayValue.toFixed(1)}%` : awayValue}
          </span>
        </div>
        <div className="flex justify-between text-xs text-hockey-silver-400">
          <span>{homeTeam}</span>
          <span>{awayTeam}</span>
        </div>
      </div>
    )
  }

  const getTeamLineups = (teamId: string) => {
    return lineups.filter((lineup) => lineup.team_id === teamId)
  }

  const getLineupsByLine = (teamId: string, lineNumber: number) => {
    return lineups
      .filter((lineup) => lineup.team_id === teamId && lineup.line_number === lineNumber)
      .sort((a, b) => {
        // Sort by position priority: C, LW, RW, LD, RD, G
        const positionOrder = { C: 1, LW: 2, RW: 3, LD: 4, RD: 5, G: 6 }
        return (
          (positionOrder[a.position as keyof typeof positionOrder] || 99) -
          (positionOrder[b.position as keyof typeof positionOrder] || 99)
        )
      })
  }

  const getUniqueLineNumbers = (teamId: string) => {
    const lineNumbers = lineups.filter((lineup) => lineup.team_id === teamId).map((lineup) => lineup.line_number)
    return [...new Set(lineNumbers)].sort((a, b) => a - b)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header Section with Team Logos as Full Backgrounds */}
      <div className="relative">
        <div className="flex flex-col md:flex-row">
          {/* Home Team Side - Full Logo Background */}
          <div
            className="flex-1 relative overflow-hidden min-h-[120px] md:min-h-[200px]"
            style={{
              backgroundImage: match.home_team.logo_url ? `url(${match.home_team.logo_url})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Team color overlay */}
            <div className={`absolute inset-0 ${homeColors.primary} opacity-80`} />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 p-4 md:p-8 h-full flex items-center justify-between">
              <div className="flex items-center space-x-3 md:space-x-6">
                <TeamLogo
                  teamName={match.home_team.name}
                  logoUrl={match.home_team.logo_url}
                  size="lg"
                  className="md:size-xl"
                />
                <div>
                  <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">{match.home_team.name}</h2>
                  <p className="text-white/90 text-sm md:text-lg font-semibold drop-shadow-md">
                    {standingsLoading
                      ? "Loading..."
                      : homeStanding
                        ? `${homeStanding.wins}-${homeStanding.losses}-${homeStanding.otl}`
                        : "0-0-0"}
                  </p>
                </div>
              </div>
              <div className="text-4xl md:text-8xl font-bold text-white drop-shadow-lg hidden sm:block">
                {match.home_score !== null ? match.home_score : "-"}
              </div>
            </div>
          </div>

          {/* Center Score Section */}
          <div className="bg-ice-blue-800/90 dark:bg-ice-blue-900/90 backdrop-blur-sm px-4 md:px-8 py-4 md:py-8 flex flex-col items-center justify-center md:min-w-[300px] relative z-20 border-y border-ice-blue-600/50">
            <Badge
              variant={match.status === "completed" || match.status === "Completed" ? "default" : "secondary"}
              className="mb-2 md:mb-4 text-sm md:text-lg px-3 md:px-4 py-1 md:py-2"
            >
              {match.status === "completed" || match.status === "Completed"
                ? "FINAL"
                : match.status?.toUpperCase() || "SCHEDULED"}
            </Badge>

            <div className="flex items-center justify-center space-x-4 mb-2 md:mb-0 sm:hidden">
              <div className="text-3xl font-bold text-white">{match.home_score !== null ? match.home_score : "-"}</div>
              <div className="text-2xl text-slate-400">-</div>
              <div className="text-3xl font-bold text-white">{match.away_score !== null ? match.away_score : "-"}</div>
            </div>

            {matchDate && <p className="text-slate-300 text-center text-sm md:text-base">{formatDate(matchDate)}</p>}
            {showEditButton && (
              <Button
                onClick={() => setOpenScoreModal(true)}
                variant="outline"
                size="sm"
                className="mt-2 md:mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
              >
                <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Edit Score
              </Button>
            )}
            {showEditButton && (
              <div className="mt-1 md:mt-2">
                <UploadMatchButton
                  match={match}
                  teamId={match.home_team_id}
                  eaClubId={match.home_team?.ea_club_id}
                  homeTeamEaClubId={match.home_team?.ea_club_id}
                  awayTeamEaClubId={match.away_team?.ea_club_id}
                  onImportSuccess={() => window.location.reload()}
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </div>

          {/* Away Team Side - Full Logo Background */}
          <div
            className="flex-1 relative overflow-hidden min-h-[120px] md:min-h-[200px]"
            style={{
              backgroundImage: match.away_team.logo_url ? `url(${match.away_team.logo_url})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Team color overlay */}
            <div className={`absolute inset-0 ${awayColors.primary} opacity-80`} />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 p-4 md:p-8 h-full flex items-center justify-between">
              <div className="text-4xl md:text-8xl font-bold text-white drop-shadow-lg hidden sm:block">
                {match.away_score !== null ? match.away_score : "-"}
              </div>
              <div className="flex items-center space-x-3 md:space-x-6">
                <div className="text-right">
                  <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">{match.away_team.name}</h2>
                  <p className="text-white/90 text-sm md:text-lg font-semibold drop-shadow-md">
                    {standingsLoading
                      ? "Loading..."
                      : awayStanding
                        ? `${awayStanding.wins}-${awayStanding.losses}-${awayStanding.otl}`
                        : "0-0-0"}
                  </p>
                </div>
                <TeamLogo
                  teamName={match.away_team.name}
                  logoUrl={match.away_team.logo_url}
                  size="lg"
                  className="md:size-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Period Stats and Team Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Period Stats */}
            {periodScores.length > 0 && (
              <Card className="bg-ice-blue-900/80 dark:bg-ice-blue-950/80 border-ice-blue-600/50 backdrop-blur-sm shadow-hockey-glow">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4 text-ice-blue-100">Period Stats</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-sm font-semibold text-hockey-silver-300 border-b border-ice-blue-600/50 pb-2">
                      <span>Team</span>
                      <span className="text-center">1</span>
                      <span className="text-center">2</span>
                      <span className="text-center">3</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center justify-center py-1">
                        <TeamLogo teamName={match.home_team.name} logoUrl={match.home_team.logo_url} size="sm" />
                      </div>
                      {periodScores.slice(0, 3).map((period) => (
                        <span key={period.period} className="text-center text-white">
                          {period.home}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center justify-center py-1">
                        <TeamLogo teamName={match.away_team.name} logoUrl={match.away_team.logo_url} size="sm" />
                      </div>
                      {periodScores.slice(0, 3).map((period) => (
                        <span key={period.period} className="text-center text-white">
                          {period.away}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Stats with Comparison Bars */}
            <Card className="bg-ice-blue-900/80 dark:bg-ice-blue-950/80 border-ice-blue-600/50 backdrop-blur-sm shadow-hockey-glow">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-ice-blue-100">Team Stats</h3>
                {homeTeamStats && awayTeamStats && (
                  <div className="space-y-6">
                    <StatComparisonBar
                      label="Goals"
                      homeValue={homeTeamStats.goals}
                      awayValue={awayTeamStats.goals}
                      homeTeam={match.home_team.name}
                      awayTeam={match.away_team.name}
                    />
                    <StatComparisonBar
                      label="Shots"
                      homeValue={homeTeamStats.shots}
                      awayValue={awayTeamStats.shots}
                      homeTeam={match.home_team.name}
                      awayTeam={match.away_team.name}
                    />
                    <StatComparisonBar
                      label="Hits"
                      homeValue={homeTeamStats.hits}
                      awayValue={awayTeamStats.hits}
                      homeTeam={match.home_team.name}
                      awayTeam={match.away_team.name}
                    />
                    <StatComparisonBar
                      label="Faceoff %"
                      homeValue={homeTeamStats.faceoff_pct || 0}
                      awayValue={awayTeamStats.faceoff_pct || 0}
                      homeTeam={match.home_team.name}
                      awayTeam={match.away_team.name}
                      isPercentage={true}
                    />
                    <StatComparisonBar
                      label="Passing %"
                      homeValue={homeTeamStats.passing_pct || 0}
                      awayValue={awayTeamStats.passing_pct || 0}
                      homeTeam={match.home_team.name}
                      awayTeam={match.away_team.name}
                      isPercentage={true}
                    />
                    <StatComparisonBar
                      label="PIM"
                      homeValue={homeTeamStats.pim}
                      awayValue={awayTeamStats.pim}
                      homeTeam={match.home_team.name}
                      awayTeam={match.away_team.name}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Season Info */}
            <Card className="bg-ice-blue-900/80 dark:bg-ice-blue-950/80 border-ice-blue-600/50 backdrop-blur-sm shadow-hockey-glow">
              <CardContent className="p-4 text-center">
                <p className="text-hockey-silver-300">
                  {seasonInfo ? `Week ${seasonInfo.week} of ${seasonInfo.season}` : "Loading..."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Three Stars */}
            {playerStats.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-ice-blue-100">Three Stars</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const allPlayers = [
                      ...getTopPlayers(match.home_team_id, 10),
                      ...getTopPlayers(match.away_team_id, 10),
                    ].sort((a, b) => b.goals + b.assists - (a.goals + a.assists))

                    return allPlayers.slice(0, 3).map((player, index) => {
                      const isHomeTeam = player.team_id === match.home_team_id
                      const teamData = isHomeTeam ? match.home_team : match.away_team
                      const starNumber = index + 1

                      return (
                        <Card
                          key={player.player_id}
                          className="border-none relative overflow-hidden bg-ice-blue-900/80 backdrop-blur-sm shadow-hockey-glow"
                          style={{
                            backgroundImage: teamData.logo_url ? `url(${teamData.logo_url})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                        >
                          <div className="absolute inset-0 bg-black/60" />
                          <CardContent className="p-6 text-center relative z-10">
                            {/* Star Number */}
                            <div className="absolute top-4 left-4">
                              <div className="bg-yellow-500 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                                {starNumber}
                              </div>
                            </div>

                            {/* Player Name */}
                            <div className="text-xl font-bold text-white mb-4 mt-8">{player.player_name}</div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2 text-center text-white text-sm">
                              <div>
                                <div className="font-bold text-lg">{player.goals}</div>
                                <div className="text-xs opacity-80">G</div>
                              </div>
                              <div>
                                <div className="font-bold text-lg">{player.assists}</div>
                                <div className="text-xs opacity-80">A</div>
                              </div>
                              <div>
                                <div className="font-bold text-lg">{player.goals + player.assists}</div>
                                <div className="text-xs opacity-80">P</div>
                              </div>
                              <div>
                                <div className="font-bold text-lg">
                                  {player.plus_minus > 0 ? "+" : ""}
                                  {player.plus_minus}
                                </div>
                                <div className="text-xs opacity-80">+/-</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {/* Player Stats */}
            <Card className="bg-ice-blue-900/80 dark:bg-ice-blue-950/80 border-ice-blue-600/50 backdrop-blur-sm shadow-hockey-glow">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-ice-blue-100">Player Stats</h3>
                {playerStats.length > 0 ? (
                  <div className="space-y-8">
                    {/* Home Team */}
                    <div>
                      <div className={`${homeColors.primary} py-2 px-4 rounded-t-md`}>
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <TeamLogo
                            teamName={match.home_team.name}
                            logoUrl={match.home_team.logo_url}
                            size="sm"
                            className="mr-2"
                          />
                          {match.home_team.name}
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-ice-blue-600/50 text-hockey-silver-300 bg-ice-blue-800/50">
                              <th className="text-left py-2 px-2">Player</th>
                              <th className="text-center py-2 px-1">Pos</th>
                              <th className="text-center py-2 px-1">G</th>
                              <th className="text-center py-2 px-1">A</th>
                              <th className="text-center py-2 px-1">P</th>
                              <th className="text-center py-2 px-1">+/-</th>
                              <th className="text-center py-2 px-1">TWP</th>
                              <th className="text-center py-2 px-1">S</th>
                              <th className="text-center py-2 px-1">H</th>
                              <th className="text-center py-2 px-1">BLK</th>
                              <th className="text-center py-2 px-1">GVA</th>
                              <th className="text-center py-2 px-1">TKA</th>
                              <th className="text-center py-2 px-1">INT</th>
                              <th className="text-center py-2 px-1">FOW</th>
                              <th className="text-center py-2 px-1">FO%</th>
                              <th className="text-center py-2 px-1">PassCom</th>
                              <th className="text-center py-2 px-1">PassAtt</th>
                              <th className="text-center py-2 px-1">PDraws</th>
                              <th className="text-center py-2 px-1">PPG</th>
                              <th className="text-center py-2 px-1">PIM</th>
                              <th className="text-center py-2 px-1">TOI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSkaters(match.home_team_id)
                              .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
                              .map((player, index) => (
                                <tr
                                  key={player.player_id}
                                  className="border-b border-ice-blue-700/30 hover:bg-ice-blue-800/20"
                                >
                                  <td className="py-2 px-2 text-white font-medium">
                                    <div className="flex items-center">
                                      <TeamLogo
                                        teamName={match.home_team.name}
                                        logoUrl={match.home_team.logo_url}
                                        size="xs"
                                        className="mr-2"
                                      />
                                      {player.player_name}
                                    </div>
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.position || "-"}</td>
                                  <td className="py-2 px-1 text-center text-white">{player.goals}</td>
                                  <td className="py-2 px-1 text-center text-white">{player.assists}</td>
                                  <td className="py-2 px-1 text-center text-white font-semibold">
                                    {player.goals + player.assists}
                                  </td>
                                  <td
                                    className={`py-2 px-1 text-center ${player.plus_minus > 0 ? "text-green-400" : player.plus_minus < 0 ? "text-red-400" : "text-slate-300"}`}
                                  >
                                    {player.plus_minus > 0 ? "+" : ""}
                                    {player.plus_minus}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.time_with_puck
                                      ? `${Math.floor(player.time_with_puck / 60)}:${(player.time_with_puck % 60).toString().padStart(2, "0")}`
                                      : "0:00"}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.shots}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.hits}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.blocks}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.giveaways || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.takeaways || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.interceptions || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.faceoffs_won || 0}/{player.faceoffs_taken || 0}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.faceoff_pct ? player.faceoff_pct.toFixed(1) : "0.0"}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.pass_complete || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.pass_attempts || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.penalties_drawn || 0}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.ppg || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.pim}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.toi || "0:00"}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div>
                      <div className={`${awayColors.primary} py-2 px-4 rounded-t-md`}>
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <TeamLogo
                            teamName={match.away_team.name}
                            logoUrl={match.away_team.logo_url}
                            size="sm"
                            className="mr-2"
                          />
                          {match.away_team.name}
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-ice-blue-600/50 text-hockey-silver-300 bg-ice-blue-800/50">
                              <th className="text-left py-2 px-2">Player</th>
                              <th className="text-center py-2 px-1">Pos</th>
                              <th className="text-center py-2 px-1">G</th>
                              <th className="text-center py-2 px-1">A</th>
                              <th className="text-center py-2 px-1">P</th>
                              <th className="text-center py-2 px-1">+/-</th>
                              <th className="text-center py-2 px-1">TWP</th>
                              <th className="text-center py-2 px-1">S</th>
                              <th className="text-center py-2 px-1">H</th>
                              <th className="text-center py-2 px-1">BLK</th>
                              <th className="text-center py-2 px-1">GVA</th>
                              <th className="text-center py-2 px-1">TKA</th>
                              <th className="text-center py-2 px-1">INT</th>
                              <th className="text-center py-2 px-1">FOW</th>
                              <th className="text-center py-2 px-1">FO%</th>
                              <th className="text-center py-2 px-1">PassCom</th>
                              <th className="text-center py-2 px-1">PassAtt</th>
                              <th className="text-center py-2 px-1">PDraws</th>
                              <th className="text-center py-2 px-1">PPG</th>
                              <th className="text-center py-2 px-1">PIM</th>
                              <th className="text-center py-2 px-1">TOI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSkaters(match.away_team_id)
                              .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
                              .map((player, index) => (
                                <tr
                                  key={player.player_id}
                                  className="border-b border-ice-blue-700/30 hover:bg-ice-blue-800/20"
                                >
                                  <td className="py-2 px-2 text-white font-medium">
                                    <div className="flex items-center">
                                      <TeamLogo
                                        teamName={match.away_team.name}
                                        logoUrl={match.away_team.logo_url}
                                        size="xs"
                                        className="mr-2"
                                      />
                                      {player.player_name}
                                    </div>
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.position || "-"}</td>
                                  <td className="py-2 px-1 text-center text-white">{player.goals}</td>
                                  <td className="py-2 px-1 text-center text-white">{player.assists}</td>
                                  <td className="py-2 px-1 text-center text-white font-semibold">
                                    {player.goals + player.assists}
                                  </td>
                                  <td
                                    className={`py-2 px-1 text-center ${player.plus_minus > 0 ? "text-green-400" : player.plus_minus < 0 ? "text-red-400" : "text-slate-300"}`}
                                  >
                                    {player.plus_minus > 0 ? "+" : ""}
                                    {player.plus_minus}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.time_with_puck
                                      ? `${Math.floor(player.time_with_puck / 60)}:${(player.time_with_puck % 60).toString().padStart(2, "0")}`
                                      : "0:00"}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.shots}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.hits}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.blocks}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.giveaways || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.takeaways || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.interceptions || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.faceoffs_won || 0}/{player.faceoffs_taken || 0}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.faceoff_pct ? player.faceoff_pct.toFixed(1) : "0.0"}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.pass_complete || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.pass_attempts || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">
                                    {player.penalties_drawn || 0}
                                  </td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.ppg || 0}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.pim}</td>
                                  <td className="py-2 px-1 text-center text-slate-300">{player.toi || "0:00"}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Goalie Stats Section */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-white border-b border-slate-600 pb-2">
                        Goalie Stats
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-ice-blue-600/50 text-hockey-silver-300 bg-ice-blue-800/50">
                              <th className="text-left py-2 px-2">Player</th>
                              <th className="text-center py-2 px-2">TOI</th>
                              <th className="text-center py-2 px-2">SV%</th>
                              <th className="text-center py-2 px-2">GA</th>
                              <th className="text-center py-2 px-2">Sv</th>
                              <th className="text-center py-2 px-2">GAA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getGoalies(match.home_team_id).map((player) => (
                              <tr key={player.player_id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                <td className="py-2 px-2 text-white font-medium">
                                  <div className="flex items-center">
                                    <TeamLogo
                                      teamName={match.home_team.name}
                                      logoUrl={match.home_team.logo_url}
                                      size="xs"
                                      className="mr-2"
                                    />
                                    {player.player_name}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-center text-white">{player.toi || "60:00"}</td>
                                <td className="py-2 px-2 text-center text-white">
                                  {formatSavePercentage(player.save_pct || 0)}
                                </td>
                                <td className="py-2 px-2 text-center text-white">{player.goals_against || 0}</td>
                                <td className="py-2 px-2 text-center text-white">{player.saves || 0}</td>
                                <td className="py-2 px-2 text-center text-white">
                                  {calculateGAA(player.goals_against || 0, player.toi || "60:00")}
                                </td>
                              </tr>
                            ))}
                            {getGoalies(match.away_team_id).map((player) => (
                              <tr key={player.player_id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                <td className="py-2 px-2 text-white font-medium">
                                  <div className="flex items-center">
                                    <TeamLogo
                                      teamName={match.away_team.name}
                                      logoUrl={match.away_team.logo_url}
                                      size="xs"
                                      className="mr-2"
                                    />
                                    {player.player_name}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-center text-white">{player.toi || "60:00"}</td>
                                <td className="py-2 px-2 text-center text-white">
                                  {formatSavePercentage(player.save_pct || 0)}
                                </td>
                                <td className="py-2 px-2 text-center text-white">{player.goals_against || 0}</td>
                                <td className="py-2 px-2 text-center text-white">{player.saves || 0}</td>
                                <td className="py-2 px-2 text-center text-white">
                                  {calculateGAA(player.goals_against || 0, player.toi || "60:00")}
                                </td>
                              </tr>
                            ))}
                            {getGoalies(match.home_team_id).length === 0 &&
                              getGoalies(match.away_team_id).length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-4 text-center text-slate-400">
                                    No goalie statistics available for this match.
                                  </td>
                                </tr>
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-hockey-silver-400">No player statistics available for this match.</div>
                )}
              </CardContent>
            </Card>

            {/* Lineups Section */}
            {lineups.length > 0 && (
              <Card className="bg-ice-blue-900/80 dark:bg-ice-blue-950/80 border-ice-blue-600/50 backdrop-blur-sm shadow-hockey-glow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6 text-ice-blue-100">Lineups</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Home Team Lineups */}
                    <div>
                      <div className={`${homeColors.primary} py-3 px-4 rounded-t-md mb-4`}>
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <TeamLogo
                            teamName={match.home_team.name}
                            logoUrl={match.home_team.logo_url}
                            size="sm"
                            className="mr-2"
                          />
                          {match.home_team.name}
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {getUniqueLineNumbers(match.home_team_id).map((lineNumber) => (
                          <div key={lineNumber} className="bg-slate-700/50 rounded-lg p-4">
                            <h5 className="text-sm font-semibold text-slate-300 mb-3">
                              {lineNumber === 0 ? "Starting Lineup" : `Line ${lineNumber}`}
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              {getLineupsByLine(match.home_team_id, lineNumber).map((player) => (
                                <div
                                  key={player.id}
                                  className={`text-center p-2 rounded ${player.is_starter ? "bg-slate-600" : "bg-slate-700"}`}
                                >
                                  <div className="text-xs font-medium text-slate-300 mb-1">{player.position}</div>
                                  <div className="text-sm text-white font-medium">{player.player_name}</div>
                                  {player.is_starter && <div className="text-xs text-yellow-400 mt-1">★</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Away Team Lineups */}
                    <div>
                      <div className={`${awayColors.primary} py-3 px-4 rounded-t-md mb-4`}>
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <TeamLogo
                            teamName={match.away_team.name}
                            logoUrl={match.away_team.logo_url}
                            size="sm"
                            className="mr-2"
                          />
                          {match.away_team.name}
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {getUniqueLineNumbers(match.away_team_id).map((lineNumber) => (
                          <div key={lineNumber} className="bg-slate-700/50 rounded-lg p-4">
                            <h5 className="text-sm font-semibold text-slate-300 mb-3">
                              {lineNumber === 0 ? "Starting Lineup" : `Line ${lineNumber}`}
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              {getLineupsByLine(match.away_team_id, lineNumber).map((player) => (
                                <div
                                  key={player.id}
                                  className={`text-center p-2 rounded ${player.is_starter ? "bg-slate-600" : "bg-slate-700"}`}
                                >
                                  <div className="text-xs font-medium text-slate-300 mb-1">{player.position}</div>
                                  <div className="text-sm text-white font-medium">{player.player_name}</div>
                                  {player.is_starter && <div className="text-xs text-yellow-400 mt-1">★</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Score Modal */}
      <EditScoreModal
        open={openScoreModal}
        onOpenChange={setOpenScoreModal}
        match={match}
        canEdit={isAdmin}
        onUpdate={() => {
          // Refresh match data
          window.location.reload()
        }}
      />
    </div>
  )
}
