"use client"

import React, { useState, useEffect } from "react"
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
import { ArrowLeft, Calendar, Trophy, Award, RefreshCw, ChevronLeft, ChevronRight, Users, Target, Zap, TrendingUp, Star, Crown, Medal } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href="/teams" className="text-purple-300 hover:text-purple-200">
              Back to Teams
            </Link>
          </div>
          <Skeleton className="h-64 w-full rounded-2xl bg-white/10 mb-8" />
          <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href="/teams" className="text-purple-300 hover:text-purple-200">
              Back to Teams
            </Link>
          </div>
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold mb-4 text-white">Team Not Found</h1>
              <p className="text-purple-300">The team you are looking for does not exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ArrowLeft className="h-5 w-5 text-purple-300" />
              <Link href="/teams" className="text-purple-300 hover:text-purple-200 transition-colors">
                Back to Teams
              </Link>
            </motion.div>

            {session?.user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshTeamStats} 
                  disabled={refreshing}
                  className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20 hover:border-purple-400/50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Stats
                </Button>
              </motion.div>
            )}
          </div>

          {/* Team Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-8 overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <div className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 p-8">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Team Logo */}
                  <motion.div 
                    className="relative h-40 w-40"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {team.logo_url ? (
                      <Image 
                        src={team.logo_url || "/placeholder.svg"} 
                        alt={team.name} 
                        fill 
                        className="object-contain drop-shadow-2xl" 
                      />
                    ) : (
                      <TeamLogo teamName={team.name} size="xl" />
                    )}
                  </motion.div>

                  {/* Team Info */}
                  <div className="text-center lg:text-left flex-1">
                    <motion.h1 
                      className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      {team.name}
                    </motion.h1>
                    
                    <motion.div 
                      className="text-xl text-purple-300 mb-6 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      Record: {team.wins}-{team.losses}-{team.otl}
                    </motion.div>

                    {/* Team Stats Grid */}
                    <motion.div 
                      className="grid grid-cols-2 md:grid-cols-5 gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                    >
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-200 flex items-center justify-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          {team.points}
                        </div>
                        <div className="text-sm text-blue-300">Points</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-200 flex items-center justify-center gap-2">
                          <Target className="h-5 w-5" />
                          {team.games_played}
                        </div>
                        <div className="text-sm text-green-300">Games</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-200 flex items-center justify-center gap-2">
                          <Zap className="h-5 w-5" />
                          {team.goals_for}
                        </div>
                        <div className="text-sm text-yellow-300">Goals For</div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-200 flex items-center justify-center gap-2">
                          <Target className="h-5 w-5" />
                          {team.goals_against}
                        </div>
                        <div className="text-sm text-red-300">Goals Against</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-200 flex items-center justify-center gap-2">
                          <Star className="h-5 w-5" />
                          {team.goal_differential > 0 ? `+${team.goal_differential}` : team.goal_differential}
                        </div>
                        <div className="text-sm text-purple-300">Goal Diff</div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Team Awards */}
          {awards && awards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full">
                      <Trophy className="h-6 w-6 text-yellow-400" />
                    </div>
                    Team Awards
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Achievements and honors earned by {team.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {awards.map((award, index) => {
                      const isPresident = award.award_type === "President Trophy"
                      const isCup = award.award_type === "SCS Cup"

                      return (
                        <motion.div
                          key={award.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.4 + index * 0.1 }}
                          className={`p-4 rounded-xl backdrop-blur-sm border ${
                            isPresident
                              ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-400/30"
                              : isCup
                                ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/30"
                                : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-3 rounded-full ${
                                isPresident
                                  ? "bg-gradient-to-br from-blue-500/30 to-indigo-500/30"
                                  : isCup
                                    ? "bg-gradient-to-br from-yellow-500/30 to-amber-500/30"
                                    : "bg-gradient-to-br from-purple-500/30 to-pink-500/30"
                              }`}
                            >
                              {isPresident ? (
                                <Crown className="h-6 w-6 text-blue-300" />
                              ) : isCup ? (
                                <Trophy className="h-6 w-6 text-yellow-300" />
                              ) : (
                                <Medal className="h-6 w-6 text-purple-300" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white">{award.award_type}</div>
                              <div className="text-sm text-purple-300">
                                Season {award.season_number} ({award.year})
                              </div>
                              {award.description && (
                                <div className="text-sm mt-1 text-purple-200">{award.description}</div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Management Button */}
          {canManageTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="mb-8"
            >
              <Link href={`/teams/${teamId}/manage`}>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg">
                  <Users className="h-5 w-5 mr-2" />
                  Manage Team
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
          >
            <Tabs defaultValue="roster" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger 
                  value="roster" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white"
                >
                  Roster
                </TabsTrigger>
                <TabsTrigger 
                  value="schedule" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-white"
                >
                  Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="matches" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                >
                  Matches
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roster" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Team Roster</CardTitle>
                    <CardDescription className="text-purple-300">
                      {roster.length} players on the roster
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20 hover:bg-white/5">
                            <TableHead className="text-purple-300">Player</TableHead>
                            <TableHead className="text-purple-300">Position</TableHead>
                            <TableHead className="text-purple-300">Role</TableHead>
                            <TableHead className="text-purple-300">Salary</TableHead>
                            <TableHead className="text-purple-300">Goals</TableHead>
                            <TableHead className="text-purple-300">Assists</TableHead>
                            <TableHead className="text-purple-300">Points</TableHead>
                            {roster.some((player) => player.user.primary_position === "G" || player.user.primary_position === "Goalie") && (
                              <>
                                <TableHead className="text-purple-300">Saves</TableHead>
                                <TableHead className="text-purple-300">Save %</TableHead>
                              </>
                            )}
                            <TableHead className="text-purple-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedRoster.map((player) => (
                            <TableRow key={player.id} className="border-white/20 hover:bg-white/5">
                              <TableCell className="font-medium text-white">
                                {player.user.gamer_tag_id}
                              </TableCell>
                              <TableCell className="text-purple-300">
                                {getPositionAbbreviation(player.user.primary_position)}
                                {player.user.secondary_position && ` / ${getPositionAbbreviation(player.user.secondary_position)}`}
                              </TableCell>
                              <TableCell className="text-purple-300">{player.role}</TableCell>
                              <TableCell className="text-purple-300">
                                ${(player.salary / 1000000).toFixed(1)}M
                              </TableCell>
                              <TableCell className="text-purple-300">{player.stats?.goals || 0}</TableCell>
                              <TableCell className="text-purple-300">{player.stats?.assists || 0}</TableCell>
                              <TableCell className="text-purple-300 font-semibold">{player.stats?.points || 0}</TableCell>
                              {(player.user.primary_position === "G" || player.user.primary_position === "Goalie") && (
                                <>
                                  <TableCell className="text-purple-300">{player.stats?.saves || 0}</TableCell>
                                  <TableCell className="text-purple-300">
                                    {player.stats?.save_percentage ? `${player.stats.save_percentage.toFixed(1)}%` : "N/A"}
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                <div className="flex gap-2">
                                  <GameAvailabilityButton
                                    teamId={teamId}
                                    userId={player.user_id}
                                    gamerTag={player.user.gamer_tag_id}
                                  />
                                  <InjuryReserveButton
                                    teamId={teamId}
                                    userId={player.user_id}
                                    gamerTag={player.user.gamer_tag_id}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Team Schedule</CardTitle>
                    <CardDescription className="text-purple-300">
                      Weekly match schedule and availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Week Navigation */}
                    <div className="flex items-center justify-between mb-6">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                        disabled={currentWeek === 1}
                        className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">Week {currentWeek}</div>
                        <div className="text-sm text-purple-300">{getWeekDateRange(currentWeek)}</div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
                        disabled={currentWeek === totalWeeks}
                        className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Week Matches */}
                    <div className="space-y-4">
                      {weekMatches.length === 0 ? (
                        <div className="text-center py-8 text-purple-300">
                          No matches scheduled for this week.
                        </div>
                      ) : (
                        weekMatches.map((match) => (
                          <div
                            key={match.id}
                            className="p-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="font-semibold text-white">{match.home_team.name}</div>
                                  <div className="text-2xl font-bold text-purple-300">{match.home_score}</div>
                                </div>
                                <div className="text-purple-300 font-medium">vs</div>
                                <div className="text-center">
                                  <div className="font-semibold text-white">{match.away_team.name}</div>
                                  <div className="text-2xl font-bold text-purple-300">{match.away_score}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-purple-300">
                                  {new Date(match.match_date).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-purple-400 capitalize">{match.status}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="matches" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">All Matches</CardTitle>
                    <CardDescription className="text-purple-300">
                      Complete match history and upcoming games
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Upcoming Matches */}
                      {upcomingMatches.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Matches</h3>
                          <div className="space-y-3">
                            {upcomingMatches.map((match) => (
                              <div
                                key={match.id}
                                className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="font-semibold text-white">{match.home_team.name}</div>
                                      <div className="text-lg font-bold text-green-300">-</div>
                                    </div>
                                    <div className="text-green-300 font-medium">vs</div>
                                    <div className="text-center">
                                      <div className="font-semibold text-white">{match.away_team.name}</div>
                                      <div className="text-lg font-bold text-green-300">-</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-green-300">
                                      {new Date(match.match_date).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-green-400">Scheduled</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed Matches */}
                      {completedMatches.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Completed Matches</h3>
                          <div className="space-y-3">
                            {completedMatches.map((match) => (
                              <div
                                key={match.id}
                                className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-400/20"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="font-semibold text-white">{match.home_team.name}</div>
                                      <div className="text-lg font-bold text-blue-300">{match.home_score}</div>
                                    </div>
                                    <div className="text-blue-300 font-medium">vs</div>
                                    <div className="text-center">
                                      <div className="font-semibold text-white">{match.away_team.name}</div>
                                      <div className="text-lg font-bold text-blue-300">{match.away_score}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-blue-300">
                                      {new Date(match.match_date).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-blue-400">Completed</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {upcomingMatches.length === 0 && completedMatches.length === 0 && (
                        <div className="text-center py-8 text-purple-300">
                          No matches found for this team.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
