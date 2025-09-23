"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Clock, Home, ExternalLink, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Filter, Calendar, Trophy, Zap, Target, Users, TrendingUp } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { TeamLogo } from "@/components/team-logo"

export default function MatchesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSeason, setCurrentSeason] = useState<any>(null)

  // Pagination and filtering state
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(1)
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [weekMatches, setWeekMatches] = useState<any[]>([])

  // Get initial filters from URL params
  useEffect(() => {
    const week = searchParams.get("week")
    const team = searchParams.get("team")

    if (week) setCurrentWeek(Number.parseInt(week))
    if (team) setSelectedTeam(team)
  }, [searchParams])

  // Fetch current season
  useEffect(() => {
    async function fetchCurrentSeason() {
      try {
        console.log("Fetching current season...")
        // First try to get seasons from the seasons table
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false })

        if (!seasonsError && seasonsData && seasonsData.length > 0) {
          // Find active season
          const activeSeason = seasonsData.find((s) => s.is_active === true)
          if (activeSeason) {
            console.log("Found active season:", activeSeason)
            setCurrentSeason(activeSeason)
          } else {
            // Default to first season
            console.log("No active season, using first season:", seasonsData[0])
            setCurrentSeason(seasonsData[0])
          }
        } else {
          // Try to get current season from system_settings
          const { data, error } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "current_season")
            .single()

          if (!error && data && data.value) {
            const seasonNumber = Number.parseInt(data.value.toString(), 10)
            if (!isNaN(seasonNumber)) {
              const season = {
                id: seasonNumber.toString(),
                number: seasonNumber,
                name: `Season ${seasonNumber}`,
                is_active: true,
              }
              console.log("Using season from system_settings:", season)
              setCurrentSeason(season)
            }
          } else {
            // Default to season 1
            const defaultSeason = {
              id: "1",
              number: 1,
              name: "Season 1",
              is_active: true,
            }
            console.log("Using default season:", defaultSeason)
            setCurrentSeason(defaultSeason)
          }
        }
      } catch (error) {
        console.error("Error fetching current season:", error)
        // Default to season 1
        const defaultSeason = {
          id: "1",
          number: 1,
          name: "Season 1",
          is_active: true,
        }
        setCurrentSeason(defaultSeason)
      }
    }

    fetchCurrentSeason()
  }, [supabase])

  // Fetch teams for filter
  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data, error } = await supabase.from("teams").select("id, name").eq("is_active", true).order("name")

        if (error) throw error
        setTeams(data || [])
      } catch (error) {
        console.error("Error fetching teams:", error)
      }
    }

    fetchTeams()
  }, [supabase])

  // Fetch all matches
  useEffect(() => {
    async function fetchMatches() {
      if (!currentSeason) return

      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from("matches")
          .select(
            `
            id,
            match_date,
            status,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            season_id,
            season_name,
            home_team:teams!home_team_id(id, name, logo_url),
            away_team:teams!away_team_id(id, name, logo_url)
          `,
          )
          .eq("season_name", currentSeason.name)

        // Apply team filter if selected
        if (selectedTeam !== "all") {
          query = query.or(`home_team_id.eq.${selectedTeam},away_team_id.eq.${selectedTeam}`)
        }

        const { data, error } = await query.order("match_date", { ascending: true })

        if (error) throw error

        console.log(`Found ${data?.length || 0} matches for ${currentSeason.name}`)
        setMatches(data || [])

        // Calculate weeks based on matches
        if (data && data.length > 0) {
          const weeks = calculateWeeks(data)
          setTotalWeeks(weeks)
        }
      } catch (error: any) {
        console.error("Error fetching matches:", error)
        setError(`Error: ${error.message}`)
        toast({
          title: "Error",
          description: "Failed to load matches. Please try again.",
          variant: "destructive",
        })
        setMatches([])
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [supabase, toast, selectedTeam, currentSeason])

  // Calculate weeks from matches
  const calculateWeeks = (matchesData: any[]) => {
    if (!matchesData.length) return 1

    // Group matches by week (7-day periods starting from first match)
    const firstMatchDate = new Date(matchesData[0].match_date)
    const lastMatchDate = new Date(matchesData[matchesData.length - 1].match_date)

    // Calculate the difference in weeks
    const timeDiff = lastMatchDate.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000))

    return Math.max(1, weeksDiff + 1)
  }

  // Get matches for current week
  useEffect(() => {
    if (matches.length === 0) {
      setWeekMatches([])
      return
    }

    const firstMatchDate = new Date(matches[0].match_date)
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

  // Update URL when filters change
  const updateURL = (week: number, team: string) => {
    const params = new URLSearchParams()
    if (week > 1) params.set("week", week.toString())
    if (team !== "all") params.set("team", team)

    const newURL = params.toString() ? `/matches?${params.toString()}` : "/matches"
    router.replace(newURL, { scroll: false })
  }

  // Handle week navigation
  const goToWeek = (week: number) => {
    setCurrentWeek(week)
    updateURL(week, selectedTeam)
  }

  // Handle team filter change
  const handleTeamFilter = (team: string) => {
    setSelectedTeam(team)
    setCurrentWeek(1) // Reset to first week when changing team filter
    updateURL(1, team)
  }

  // Group matches by date
  const groupMatchesByDate = (matches: any[]) => {
    const groups: Record<string, any[]> = {}

    matches.forEach((match) => {
      const date = new Date(match.match_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      if (!groups[date]) {
        groups[date] = []
      }

      groups[date].push(match)
    })

    return groups
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "outline"
      case "In Progress":
        return "secondary"
      case "Completed":
        return "success"
      default:
        return "default"
    }
  }



  // Get week date range for display
  const getWeekDateRange = () => {
    if (matches.length === 0) return ""

    const firstMatchDate = new Date(matches[0].match_date)
    const weekStartDate = new Date(firstMatchDate)
    weekStartDate.setDate(firstMatchDate.getDate() + (currentWeek - 1) * 7)

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

  // Calculate match statistics
  const getMatchStats = () => {
    const totalMatches = matches.length
    const completedMatches = matches.filter(m => m.status === "Completed").length
    const scheduledMatches = matches.filter(m => m.status === "Scheduled").length
    const inProgressMatches = matches.filter(m => m.status === "In Progress").length

    return { totalMatches, completedMatches, scheduledMatches, inProgressMatches }
  }

  const matchStats = getMatchStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="hockey-header relative py-16 px-4 mb-12">
            <div className="container mx-auto text-center">
              <Skeleton className="h-12 w-96 mx-auto mb-6" />
              <Skeleton className="h-6 w-80 mx-auto" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2].map((j) => (
                    <Skeleton key={j} className="h-40 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Add a fallback UI for connection errors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="hockey-header relative py-16 px-4 mb-12">
            <div className="container mx-auto text-center">
              <h1 className="hockey-title mb-6">Match Schedule</h1>
              <p className="hockey-subtitle">Track all games and results</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="hockey-card p-8 text-center">
              <AlertCircle className="h-16 w-16 text-goal-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
                Error Loading Matches
              </h2>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-2">{error}</p>
              <p className="text-hockey-silver-500 dark:text-hockey-silver-500 mb-8">
                There was a problem connecting to the database. This could be due to a type mismatch or server issue.
              </p>
              <Button onClick={() => window.location.reload()} className="hockey-button">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const matchesByDate = groupMatchesByDate(weekMatches)

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="hockey-title mb-6">
              Match Schedule
            </h1>
            <p className="hockey-subtitle mb-8">
              Track all games, results, and upcoming matches in the Secret Chel Society
            </p>
            
            {/* Match Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hockey-stat-item"
              >
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-ice-blue-600 dark:text-ice-blue-400" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  {matchStats.totalMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Total Matches
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.4 }}
                className="hockey-stat-item"
              >
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-8 w-8 text-assist-green-600 dark:text-assist-green-400" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  {matchStats.completedMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Completed
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.6 }}
                className="hockey-stat-item"
              >
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-rink-blue-600 dark:text-rink-blue-400" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  {matchStats.scheduledMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Scheduled
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.8 }}
                className="hockey-stat-item"
              >
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-goal-red-600 dark:text-goal-red-400" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  {matchStats.inProgressMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  In Progress
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          {/* Enhanced Filters and Controls */}
          <div className="mb-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                Match Schedule
              </h2>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Filter and navigate through the season schedule with advanced viewing options
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Team Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-hockey-silver-500" />
                <Select value={selectedTeam} onValueChange={handleTeamFilter}>
                  <SelectTrigger className="hockey-input w-48">
                    <SelectValue placeholder="Filter by team" />
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

              {/* View Options */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hockey-button"
                  onClick={() => {/* Add compact view toggle */}}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Compact View
                </Button>
              </div>

              {/* Season Badge */}
              <div className="flex items-center gap-2">
                <Badge className="hockey-badge text-base py-2 px-4">
                  <Trophy className="h-4 w-4 mr-2" />
                  {currentSeason?.name || "Loading..."}
                </Badge>
              </div>
            </div>
          </div>

          {/* Enhanced Match Statistics Bar */}
          <div className="mb-8 hockey-card p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-ice-blue-600 dark:text-ice-blue-400 mb-1">
                  {matchStats.totalMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Total Matches
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-assist-green-600 dark:text-assist-green-400 mb-1">
                  {matchStats.completedMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Completed
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-rink-blue-600 dark:text-rink-blue-400 mb-1">
                  {matchStats.scheduledMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Scheduled
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-goal-red-600 dark:text-goal-red-400 mb-1">
                  {matchStats.inProgressMatches}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  In Progress
                </div>
              </div>
            </div>
          </div>

          {/* Week Navigation */}
          {totalWeeks > 1 && (
            <div className="mb-8 hockey-week-nav">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => goToWeek(currentWeek - 1)} 
                    disabled={currentWeek === 1}
                    className="hockey-button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Week
                  </Button>

                  <div className="text-center">
                    <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                      Week {currentWeek} of {totalWeeks}
                    </div>
                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {getWeekDateRange()}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToWeek(currentWeek + 1)}
                    disabled={currentWeek === totalWeeks}
                    className="hockey-button"
                  >
                    Next Week
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Week selector for quick navigation */}
                <Select value={currentWeek.toString()} onValueChange={(value) => goToWeek(Number.parseInt(value))}>
                  <SelectTrigger className="hockey-search w-32">
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
            </div>
          )}

          {/* No matches message */}
          {weekMatches.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Target className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-2">
                  No matches found
                </h3>
                <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
                  {selectedTeam === "all"
                    ? `No matches scheduled for Week ${currentWeek}.`
                    : `No matches found for the selected team in Week ${currentWeek}.`}
                </p>
              </div>
            </div>
          )}

          {/* Matches by date */}
          <div className="space-y-8">
            {Object.entries(matchesByDate).map(([date, dateMatches]) => (
              <motion.div 
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="hockey-date-header">
                  <div className="hockey-date-indicator"></div>
                  <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    {date}
                  </h2>
                </div>
                
                <div className="hockey-match-grid">
                  {dateMatches.map((match, index) => {
                    const formattedDate = formatDate(match.match_date)
                    const isCompleted = match.status === "Completed"

                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="group cursor-pointer"
                        onClick={() => router.push(`/matches/${match.id}`)}
                      >
                        <Card className="hockey-match-card hockey-match-card-hover h-full overflow-hidden">
                          <CardContent className="p-0">
                            {/* Match Header */}
                            <div className="hockey-match-content">
                              <div className="hockey-match-header">
                                <div className="flex items-center gap-2 text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">{formattedDate.time}</span>
                                </div>
                                <Badge 
                                  variant={getStatusBadgeVariant(match.status)}
                                  className={`${
                                    match.status === "Completed" 
                                      ? "bg-gradient-to-r from-assist-green-100 to-assist-green-200 text-assist-green-800 border-assist-green-300 dark:from-assist-green-900/30 dark:to-assist-green-800/30 dark:text-assist-green-200 dark:border-assist-green-600"
                                      : match.status === "In Progress"
                                      ? "bg-gradient-to-r from-goal-red-100 to-goal-red-200 text-goal-red-800 border-goal-red-300 dark:from-goal-red-900/30 dark:to-goal-red-800/30 dark:text-goal-red-200 dark:border-goal-red-600"
                                      : "hockey-badge"
                                  }`}
                                >
                                  {match.status}
                                </Badge>
                              </div>

                              {/* Teams and Score */}
                              <div className="hockey-match-teams">
                                {/* Home Team */}
                                <div className="hockey-team-section">
                                                                     <div className="hockey-team-logo">
                                     {match.home_team.logo_url ? (
                                       <Image
                                         src={match.home_team.logo_url || "/placeholder.svg"}
                                         alt={match.home_team.name}
                                         width={80}
                                         height={80}
                                         className="object-contain"
                                       />
                                     ) : (
                                       <TeamLogo 
                                         teamName={match.home_team.name}
                                         logoUrl={match.home_team.logo_url}
                                         size="lg"
                                       />
                                     )}
                                   </div>
                                  <div className="flex flex-col items-center">
                                    <span className="hockey-team-name">
                                      {match.home_team.name}
                                    </span>
                                    <Badge className="hockey-team-badge hockey-home-badge">
                                      <Home className="h-3 w-3" />
                                      Home
                                    </Badge>
                                  </div>
                                </div>

                                {/* Score */}
                                <div className="hockey-score-section">
                                  {isCompleted ? (
                                    <div className="hockey-score-display">
                                      <div className="hockey-score-number">
                                        {match.home_score}
                                      </div>
                                      <div className="hockey-score-separator">
                                        -
                                      </div>
                                      <div className="hockey-score-number">
                                        {match.away_score}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="hockey-score-display">
                                      <div className="hockey-vs-text">
                                        VS
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Away Team */}
                                <div className="hockey-team-section">
                                                                     <div className="hockey-team-logo">
                                     {match.away_team.logo_url ? (
                                       <Image
                                         src={match.away_team.logo_url || "/placeholder.svg"}
                                         alt={match.away_team.name}
                                         width={80}
                                         height={80}
                                         className="object-contain"
                                       />
                                     ) : (
                                       <TeamLogo 
                                         teamName={match.away_team.name}
                                         logoUrl={match.away_team.logo_url}
                                         size="lg"
                                       />
                                     )}
                                   </div>
                                  <div className="flex flex-col items-center">
                                    <span className="hockey-team-name">
                                      {match.away_team.name}
                                    </span>
                                    <Badge className="hockey-team-badge hockey-away-badge">
                                      <ExternalLink className="h-3 w-3" />
                                      Away
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="hockey-match-action">
                              <div className="inline-flex items-center gap-2 text-ice-blue-600 dark:text-ice-blue-400 font-medium group-hover:text-ice-blue-700 dark:group-hover:text-ice-blue-300 transition-colors duration-200">
                                <span>View Details</span>
                                <Zap className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom pagination for convenience */}
          {totalWeeks > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => goToWeek(currentWeek - 1)} 
                  disabled={currentWeek === 1}
                  className="hockey-button"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="px-6 py-2 text-lg font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                  Week {currentWeek} of {totalWeeks}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToWeek(currentWeek + 1)}
                  disabled={currentWeek === totalWeeks}
                  className="hockey-button"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
