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
import { 
  ArrowLeft, 
  Calendar, 
  Trophy, 
  Award, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Users,
  BarChart3,
  Target,
  Shield,
  Star,
  Activity,
  TrendingUp,
  DollarSign,
  Crown
} from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import { Button } from "@/components/ui/button"
import { getTeamStats, getCurrentSeasonId } from "@/lib/team-utils"
import { GameAvailabilityButton } from "@/components/team-schedule/game-availability-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InjuryReserveButton } from "@/components/team-schedule/injury-reserve-button"

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
    primary_position: string
    secondary_position: string | null
    console: string
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
  }

  return positionMap[position] || position
}

export default function TeamDetailPage() {
  const params = useParams()
  const teamId = params.id as string
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [roster, setRoster] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [canManageTeam, setCanManageTeam] = useState(false)
  const [awards, setAwards] = useState<TeamAward[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null)
  const [currentUserPlayer, setCurrentUserPlayer] = useState<Player | null>(null)

  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(1)
  const [weekMatches, setWeekMatches] = useState<Match[]>([])

  // Check if user is on team
  const isUserOnTeam = roster.some((player) => player.user_id === session?.user?.id)

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

      // Reload the page to show updated stats
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

    // Sort matches by date
    const sortedMatches = [...matchesData].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )

    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const lastMatchDate = new Date(sortedMatches[sortedMatches.length - 1].match_date)

    // Calculate the difference in weeks
    const timeDiff = lastMatchDate.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000))

    return Math.max(1, weeksDiff + 1)
  }

  // Calculate current week based on today's date
  const getCurrentWeek = (matchesData: Match[]) => {
    if (!matchesData.length) return 1

    const today = new Date()
    const sortedMatches = [...matchesData].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)

    // Calculate which week we're in
    const timeDiff = today.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000))

    // Return week number (1-based), but don't go beyond total weeks
    const totalWeeks = calculateWeeks(matchesData)
    return Math.max(1, Math.min(weeksDiff + 1, totalWeeks))
  }

  // Get week date range for display
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

  // Calculate weeks and set current week when matches load
  useEffect(() => {
    if (matches.length > 0) {
      const weeks = calculateWeeks(matches)
      setTotalWeeks(weeks)

      // Set current week based on today's date
      const currentWeekNum = getCurrentWeek(matches)
      setCurrentWeek(currentWeekNum)
    }
  }, [matches])

  // Filter matches for current week
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

        // Get current season ID as a number for team stats
        const seasonIdNumber = await getCurrentSeasonId()

        // Get the actual UUID for the current season from the seasons table
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("id")
          .eq("season_number", seasonIdNumber)
          .single()

        if (seasonError) {
          console.error("Error fetching season ID:", seasonError)
          // Continue without season-specific data
        } else if (seasonData) {
          setCurrentSeasonId(seasonData.id)
        }

        // Get team stats
        const teamStats = await getTeamStats(teamId, seasonIdNumber)

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

        // Combine team data with calculated stats
        setTeam({
          ...teamData,
          wins: teamStats.wins,
          losses: teamStats.losses,
          otl: teamStats.otl,
          goals_for: teamStats.goals_for,
          goals_against: teamStats.goals_against,
          points: teamStats.points,
          games_played: teamStats.games_played,
          goal_differential: teamStats.goal_differential,
        })

        // Fetch team awards
        const { data: awardsData, error: awardsError } = await supabase
          .from("team_awards")
          .select("*")
          .eq("team_id", teamId)
          .order("year", { ascending: false })

        if (awardsError) {
          console.error("Error fetching team awards:", awardsError)
          // Continue without awards rather than failing completely
        } else {
          setAwards(awardsData || [])
        }

        // First, fetch the basic player data without trying to join with season_registrations
        const { data: rosterData, error: rosterError } = await supabase
          .from("players")
          .select(`
            id, 
            user_id, 
            team_id, 
            role, 
            salary,
            user:users(
              id, 
              email,
              gamer_tag_id,
              primary_position,
              secondary_position,
              console
            )
          `)
          .eq("team_id", teamId)
          .order("role", { ascending: true })

        if (rosterError) {
          console.error("Error fetching roster:", rosterError)
          throw rosterError
        }

        console.log("Roster data:", rosterData)

        // Now, for each player, try to get their season registration data if we have a valid season ID
        let rosterWithSeasonData = [...rosterData]

        if (currentSeasonId) {
          // Get all season registrations for the current season in one query
          const { data: allSeasonRegs, error: allSeasonRegsError } = await supabase
            .from("season_registrations")
            .select("user_id, gamer_tag, primary_position, secondary_position, console")
            .eq("season_id", currentSeasonId)

          if (allSeasonRegsError) {
            console.error("Error fetching season registrations:", allSeasonRegsError)
          } else if (allSeasonRegs) {
            // Create a map for quick lookup
            const seasonRegMap = new Map(allSeasonRegs.map((reg) => [reg.user_id, reg]))

            // Update player data with season registration data
            rosterWithSeasonData = rosterData.map((player) => {
              const seasonReg = seasonRegMap.get(player.user_id)

              if (seasonReg) {
                return {
                  ...player,
                  user: {
                    ...player.user,
                    gamer_tag_id: seasonReg.gamer_tag || player.user.gamer_tag_id,
                    primary_position: seasonReg.primary_position || player.user.primary_position,
                    secondary_position: seasonReg.secondary_position || player.user.secondary_position,
                    console: seasonReg.console || player.user.console,
                  },
                }
              }

              return player
            })
          }
        }

        // Fetch player stats from EA player stats for current season
        const { data: eaStatsData, error: eaStatsError } = await supabase
          .from("ea_player_stats")
          .select(
            "player_name, goals, assists, position, team_id, saves, goals_against, glsaves, glga, glshots, save_pct, glsavepct",
          )
          .in("team_id", [teamId])

        if (eaStatsError) {
          console.error("Error fetching EA player stats:", eaStatsError)
        }

        // Combine player data with EA stats by matching gamer tag to player name
        const rosterWithStats = rosterWithSeasonData.map((player) => {
          // Find EA stats for this player by matching gamer tag to player name
          const playerEaStats =
            eaStatsData?.filter(
              (stat) => stat.player_name?.toLowerCase() === player.user.gamer_tag_id?.toLowerCase(),
            ) || []

          const isGoalie = player.user.primary_position === "G" || player.user.primary_position === "Goalie"

          if (isGoalie) {
            // Calculate goalie stats - use save_pct directly from EA stats
            const totalSaves = playerEaStats.reduce((sum, stat) => sum + (stat.saves || stat.glsaves || 0), 0)
            const totalGoalsAgainst = playerEaStats.reduce(
              (sum, stat) => sum + (stat.goals_against || stat.glga || 0),
              0,
            )
            const totalShotsAgainst = playerEaStats.reduce((sum, stat) => sum + (stat.glshots || 0), 0)

            // Use save_pct directly from EA stats if available, otherwise calculate
            let savePercentage = 0
            const eaSavePercentages = playerEaStats
              .map((stat) => stat.save_pct || stat.glsavepct || 0)
              .filter((pct) => pct > 0)

            if (eaSavePercentages.length > 0) {
              // Use average of available save percentages
              savePercentage = eaSavePercentages.reduce((sum, pct) => sum + pct, 0) / eaSavePercentages.length
              // Convert to percentage if it's in decimal form (0.0-1.0)
              if (savePercentage <= 1) {
                savePercentage = savePercentage * 100
              }
            }

            return {
              ...player,
              stats: {
                id: player.id,
                player_id: player.id,
                saves: totalSaves,
                goals_against: totalGoalsAgainst,
                shots_against: totalShotsAgainst,
                save_percentage: savePercentage,
                games_played: playerEaStats.length,
                goals: 0, // Goalies don't score
                assists: 0, // Goalies don't get assists
                points: 0, // Goalies don't get points
              },
            }
          } else {
            // Calculate skater stats (existing logic)
            const totalGoals = playerEaStats.reduce((sum, stat) => sum + (stat.goals || 0), 0)
            const totalAssists = playerEaStats.reduce((sum, stat) => sum + (stat.assists || 0), 0)

            return {
              ...player,
              stats: {
                id: player.id,
                player_id: player.id,
                goals: totalGoals,
                assists: totalAssists,
                points: totalGoals + totalAssists,
              },
            }
          }
        })

        console.log("Final roster data:", rosterWithStats)
        setRoster(rosterWithStats)

        // Find current user's player record
        if (session?.user) {
          const userPlayer = rosterWithStats.find((player) => player.user_id === session.user.id)
          setCurrentUserPlayer(userPlayer || null)
        }

        // Fetch team matches
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

        // Check if the current user can manage this team
        if (session?.user) {
          const { data: playerData, error: playerError } = await supabase
            .from("players")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("team_id", teamId)
            .single()

          if (!playerError && playerData) {
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

  // Split matches into upcoming and completed for the old view
  const upcomingMatches = matches
    .filter((match) => match.status === "Scheduled")
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

  const completedMatches = matches
    .filter((match) => match.status === "Completed" || match.status === "completed")
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <Link href="/teams" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200 text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              Back to Teams
            </Link>

            {session?.user && (
              <Button variant="outline" size="sm" onClick={refreshTeamStats} disabled={refreshing} className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm">
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Stats
              </Button>
            )}
          </div>

          {/* Team Header */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl mb-6 sm:mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                  {team.logo_url ? (
                    <Image src={team.logo_url || "/placeholder.svg"} alt={team.name} fill className="object-contain" />
                  ) : (
                    <TeamLogo teamName={team.name} size="xl" />
                  )}
                </div>

                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-ice-blue-600 to-rink-blue-700 dark:from-ice-blue-400 dark:to-rink-blue-500 bg-clip-text text-transparent">
                    {team.name}
                  </h1>
                  <div className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                    Record: {team.wins}-{team.losses}-{team.otl}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">{team.points}</div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">{team.games_played}</div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Games Played</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">{team.goals_for}</div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Goals For</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">{team.goals_against}</div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Goals Against</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">
                        {team.goal_differential > 0 ? `+${team.goal_differential}` : team.goal_differential}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Goal Diff</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Team Awards */}
          {awards && awards.length > 0 && (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg mb-8">
              <CardHeader className="bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/30 dark:to-goal-red-800/30 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  Team Awards
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Achievements and honors earned by {team.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {awards.map((award) => {
                    const isPresident = award.award_type === "President Trophy"
                    const isCup = award.award_type === "SCS Cup"

                    return (
                      <div
                        key={award.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${
                          isPresident
                            ? "bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-200 dark:border-ice-blue-700"
                            : isCup
                              ? "bg-gradient-to-r from-goal-red-50 to-assist-green-50 dark:from-goal-red-900/20 dark:to-assist-green-900/20 border-goal-red-200 dark:border-goal-red-700"
                              : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg ${
                            isPresident
                              ? "bg-gradient-to-r from-ice-blue-500 to-rink-blue-600"
                              : isCup
                                ? "bg-gradient-to-r from-goal-red-500 to-assist-green-600"
                                : "bg-slate-500"
                          }`}
                        >
                          {isPresident ? (
                            <Award className="h-6 w-6 text-white" />
                          ) : isCup ? (
                            <Trophy className="h-6 w-6 text-white" />
                          ) : (
                            <Award className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{award.award_type}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Season {award.season_number} ({award.year})
                          </div>
                          {award.description && (
                            <div className="text-sm text-slate-500 dark:text-slate-500 mt-1">{award.description}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="roster" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-hockey-silver-800 dark:bg-hockey-silver-900 rounded-lg p-1">
            <TabsTrigger 
              value="roster"
              className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
            >
              Roster
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white"
            >
              Team Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <Card>
              <CardHeader>
                <CardTitle>Team Roster</CardTitle>
                <CardDescription>Players currently on {team.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {roster.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-center">Position</TableHead>
                          <TableHead className="text-center">Role</TableHead>
                          <TableHead className="text-center">Gamer Tag</TableHead>
                          <TableHead className="text-center">Console</TableHead>
                          <TableHead className="text-center">Salary</TableHead>
                          <TableHead className="text-center">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRoster.map((player) => (
                          <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <Link href={`/players/${player.id}`} className="hover:text-primary transition-colors">
                                {player.user.gamer_tag_id}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">
                              {getPositionAbbreviation(player.user.primary_position || "Unknown")}
                              {player.user.secondary_position &&
                                `/${getPositionAbbreviation(player.user.secondary_position)}`}
                            </TableCell>
                            <TableCell className="text-center">
                              {player.role === "Owner" ? (
                                <span className="inline-flex items-center">
                                  {player.role} <Trophy className="h-4 w-4 ml-1 text-yellow-500" />
                                </span>
                              ) : (
                                player.role
                              )}
                            </TableCell>
                            <TableCell className="text-center">{player.user.gamer_tag_id}</TableCell>
                            <TableCell className="text-center">{player.user.console || "Unknown"}</TableCell>
                            <TableCell className="text-center">${(player.salary / 1000000).toFixed(2)}M</TableCell>
                            <TableCell className="text-center font-bold">
                              {player.user.primary_position === "G" || player.user.primary_position === "Goalie"
                                ? "N/A" // For goalies, we'd show different stats
                                : player.stats?.points || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                {/* Week Navigation */}
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

                    {/* Week selector for quick navigation */}
                    <Select
                      value={currentWeek.toString()}
                      onValueChange={(value) => setCurrentWeek(Number.parseInt(value))}
                    >
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

                {/* IR Request Button - Show once per week */}
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
                      currentSeasonId={currentSeasonId || 1}
                    />
                  </div>
                )}

                {/* Matches for current week */}
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
                                    {player.user.gamer_tag_id} (
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
                                </Link>
                                <div className="font-bold">
                                  {player.stats?.save_percentage !== undefined && player.stats.save_percentage > 0 ? (
                                    <div className="text-right">
                                      <div>{player.stats.save_percentage.toFixed(1)}% SV%</div>
                                      <div className="text-xs text-muted-foreground">
                                        {player.stats.saves}/
                                        {player.stats.shots_against || player.stats.saves + player.stats.goals_against}{" "}
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
                            (player) =>
                              player.user.primary_position === "G" || player.user.primary_position === "Goalie",
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
    </div>
  )
}