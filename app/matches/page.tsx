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
import { Clock, Home, ExternalLink, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Filter, Gamepad2, Trophy, Calendar } from "lucide-react"
import Image from "next/image"




export default function MatchesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          .eq("season_name", "Season 1")

        // Apply team filter if selected
        if (selectedTeam !== "all") {
          query = query.or(`home_team_id.eq.${selectedTeam},away_team_id.eq.${selectedTeam}`)
        }

        const { data, error } = await query.order("match_date", { ascending: true })

        if (error) throw error

        console.log(`Found ${data?.length || 0} matches for Season 1`)
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
  }, [supabase, toast, selectedTeam])

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

  // Render team logo
  const renderTeamLogo = (team: any) => {
    if (!team) return null

    if (team.logo_url) {
      return (
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-background border">
          <Image
            src={team.logo_url || "/placeholder.svg"}
            alt={team.name}
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      )
    }

    // Fallback if no logo
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
        {team.name.substring(0, 2)}
      </div>
    )
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

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            SCS Matches
          </h1>
          <div className="mb-6 flex gap-4">
            <Skeleton className="h-10 w-48 bg-background/30" />
            <Skeleton className="h-10 w-32 bg-background/30" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full bg-background/30" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Add a fallback UI for connection errors
  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            SCS Matches
          </h1>

          <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/20 p-8 rounded-lg text-center border border-primary/20">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-slate-300">Error Loading Matches</h2>
            <p className="text-slate-400 mb-2">{error}</p>
            <p className="text-slate-400 mb-6">
              There was a problem connecting to the database. This could be due to a type mismatch or server issue.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" className="bg-background/30 border-primary/20">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const matchesByDate = groupMatchesByDate(weekMatches)

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">


      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          SCS Matches
        </h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={selectedTeam} onValueChange={handleTeamFilter}>
              <SelectTrigger className="w-48 bg-background/30 backdrop-blur-sm border-primary/20 text-foreground">
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

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base py-1 px-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300">
              <Calendar className="h-3 w-3 mr-1" />
              Season 1
            </Badge>
          </div>
        </div>

        {/* Week Navigation */}
        {totalWeeks > 1 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToWeek(currentWeek - 1)} 
                disabled={currentWeek === 1}
                className="bg-background/30 border-primary/20 hover:bg-background/50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Week
              </Button>

              <div className="text-center">
                <div className="font-semibold text-white">
                  Week {currentWeek} of {totalWeeks}
                </div>
                <div className="text-sm text-slate-300">{getWeekDateRange()}</div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToWeek(currentWeek + 1)}
                disabled={currentWeek === totalWeeks}
                className="bg-background/30 border-primary/20 hover:bg-background/50"
              >
                Next Week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Week selector for quick navigation */}
            <Select value={currentWeek.toString()} onValueChange={(value) => goToWeek(Number.parseInt(value))}>
              <SelectTrigger className="w-32 bg-background/30 backdrop-blur-sm border-primary/20 text-foreground">
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

        {/* No matches message */}
        {weekMatches.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/20 rounded-lg p-8 border border-primary/20">
              <Gamepad2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300 text-lg">
                {selectedTeam === "all"
                  ? `No matches found for Week ${currentWeek}.`
                  : `No matches found for the selected team in Week ${currentWeek}.`}
              </p>
            </div>
          </div>
        )}

        {/* Matches by date */}
        <div className="space-y-8">
          {Object.entries(matchesByDate).map(([date, dateMatches], dateIndex) => (
            <div key={date}>
              <h2 className="text-xl font-semibold mb-4 text-white">{date}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {dateMatches.map((match, matchIndex) => {
                  const formattedDate = formatDate(match.match_date)
                  const isCompleted = match.status === "Completed"

                  return (
                    <div key={match.id}>
                      <Card
                        className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-slate-800/90 via-purple-900/20 to-slate-800/90 border-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30"
                        onClick={() => router.push(`/matches/${match.id}`)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                        <CardContent className="relative p-0">
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Clock className="h-4 w-4" />
                                <span>{formattedDate.time}</span>
                              </div>
                              <Badge 
                                variant={getStatusBadgeVariant(match.status)}
                                className={`${
                                  match.status === "Completed" 
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600" 
                                    : match.status === "In Progress"
                                    ? "bg-gradient-to-r from-orange-600 to-red-600"
                                    : "bg-gradient-to-r from-blue-600 to-cyan-600"
                                }`}
                              >
                                {match.status}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              {/* Home Team */}
                              <div className="flex flex-col items-center gap-2 w-1/3">
                                <div>
                                  {renderTeamLogo(match.home_team)}
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="font-medium text-center text-white">{match.home_team.name}</span>
                                  <Badge variant="outline" className="mt-1 text-xs flex items-center gap-1 bg-blue-500/10 border-blue-500/30 text-blue-300">
                                    <Home className="h-3 w-3" />
                                    Home
                                  </Badge>
                                </div>
                              </div>

                              {/* Score */}
                              <div className="flex items-center justify-center w-1/3">
                                {isCompleted ? (
                                  <div className="text-2xl font-bold tabular-nums text-white">
                                    {match.home_score} - {match.away_score}
                                  </div>
                                ) : (
                                  <div className="text-xl font-medium text-slate-300">vs</div>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className="flex flex-col items-center gap-2 w-1/3">
                                <div>
                                  {renderTeamLogo(match.away_team)}
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="font-medium text-center text-white">{match.away_team.name}</span>
                                  <Badge variant="outline" className="mt-1 text-xs flex items-center gap-1 bg-purple-500/10 border-purple-500/30 text-purple-300">
                                    <ExternalLink className="h-3 w-3" />
                                    Away
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-2 flex justify-center">
                            <Button variant="ghost" size="sm" className="text-xs bg-background/30 hover:bg-background/50">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom pagination for convenience */}
        {totalWeeks > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToWeek(currentWeek - 1)} 
                disabled={currentWeek === 1}
                className="bg-background/30 border-primary/20 hover:bg-background/50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="px-4 py-2 text-sm text-slate-300">
                Week {currentWeek} of {totalWeeks}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToWeek(currentWeek + 1)}
                disabled={currentWeek === totalWeeks}
                className="bg-background/30 border-primary/20 hover:bg-background/50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
