"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Clock, Home, ExternalLink, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Filter, Calendar, Gamepad2, Trophy, Target } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default"
      case "Scheduled":
        return "secondary"
      case "In Progress":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Render team logo
  const renderTeamLogo = (team: any) => {
    if (team?.logo_url) {
      return (
        <div className="relative h-16 w-16">
          <Image
            src={team.logo_url}
            alt={team.name}
            fill
            className="object-contain"
            sizes="64px"
          />
        </div>
      )
    }
    return (
      <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center border-2 border-primary/30">
        <span className="text-primary font-bold text-lg">{team?.name?.substring(0, 2) || "??"}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background pt-4">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/8" />
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="space-y-12">
            <div className="text-center mb-16">
              <Skeleton className="h-20 w-96 mx-auto mb-8 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20" />
              <Skeleton className="h-8 w-[600px] mx-auto rounded-xl bg-gradient-to-r from-secondary/20 to-primary/20" />
            </div>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Skeleton className="h-16 w-64 rounded-xl bg-gradient-to-r from-primary/15 to-secondary/15" />
              <Skeleton className="h-16 w-64 rounded-xl bg-gradient-to-r from-secondary/15 to-primary/15" />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background pt-4">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/8" />
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Alert variant="destructive" className="border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-600/10 shadow-2xl p-8">
              <AlertCircle className="h-8 w-8" />
              <AlertTitle className="text-2xl font-bold">Championship Arena Unavailable</AlertTitle>
              <AlertDescription className="text-lg mt-2">{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  const matchesByDate = groupMatchesByDate(weekMatches)

  return (
    <div className="min-h-screen relative overflow-hidden bg-background pt-4">
      {/* Professional Hockey Arena Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/8" />
        
        {/* Championship arena floating elements */}
        <motion.div
          className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-primary/25 to-secondary/25 rounded-full shadow-xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-br from-secondary/25 to-primary/25 rounded-xl shadow-xl"
          animate={{ y: [-20, 20, -20], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="space-y-12">
          {/* Enhanced Professional Championship Header */}
          <div className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-6 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 120 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative p-6 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
                <Gamepad2 className="h-12 w-12 text-white relative z-10" />
                <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Championship Arena
              </h1>
            </motion.div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-secondary rounded-full" />
              <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
              <div className="h-1 w-32 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full" />
            </div>
            
            <motion.p 
              className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              View all <span className="font-bold text-primary">scheduled and completed matches</span> from the Secret Chel Society Championship League
            </motion.p>
          </div>

          {/* Enhanced Professional Filters Section */}
          <Card className="border-2 border-primary/30 bg-background/90 backdrop-blur-lg shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-40" />
            
            <CardHeader className="pb-8 pt-8 relative">
              <div className="flex items-center gap-6">
                <div className="relative p-4 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl opacity-90" />
                  <Filter className="h-8 w-8 text-white relative z-10" />
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-xl blur opacity-40" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Championship Filters</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground font-medium">Customize your match viewing experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-8">
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-foreground mb-3">Filter by Team</label>
                  <Select value={selectedTeam} onValueChange={handleTeamFilter}>
                    <SelectTrigger className="bg-background border-2 border-primary/30 hover:border-primary/50 text-foreground py-4 text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
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
            </CardContent>
          </Card>

          {/* Enhanced Week Navigation */}
          {totalWeeks > 1 && (
            <Card className="border-primary/20 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Week Navigation</h3>
                      <p className="text-white/70">Browse matches by week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => goToWeek(currentWeek - 1)} 
                      disabled={currentWeek === 1}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Previous Week
                    </Button>

                    <div className="text-center px-6 py-3 bg-white/10 rounded-xl border border-white/20">
                      <div className="text-2xl font-bold text-primary">Week {currentWeek}</div>
                      <div className="text-sm text-white/70">of {totalWeeks}</div>
                    </div>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => goToWeek(currentWeek + 1)}
                      disabled={currentWeek === totalWeeks}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Next Week
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Matches Display */}
          <div className="space-y-8">
            {Object.entries(matchesByDate).map(([date, dateMatches], dateIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: dateIndex * 0.1 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{date}</h2>
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                    {dateMatches.length} match{dateMatches.length !== 1 ? 'es' : ''}
                  </Badge>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {dateMatches.map((match, matchIndex) => {
                    const formattedDate = formatDate(match.match_date)
                    const isCompleted = match.status === "Completed"
                    const homeWon = isCompleted && match.home_score > match.away_score
                    const awayWon = isCompleted && match.away_score > match.home_score

                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: matchIndex * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="group"
                      >
                        <Card
                          className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-primary/20 bg-white/5 backdrop-blur-sm hover:bg-white/10"
                          onClick={() => router.push(`/matches/${match.id}`)}
                        >
                          <CardContent className="p-0">
                            <div className="p-6">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                  <Clock className="h-4 w-4" />
                                  <span>{formattedDate.time}</span>
                                </div>
                                <Badge 
                                  variant={getStatusBadgeVariant(match.status)}
                                  className={`${
                                    match.status === "Completed" 
                                      ? "bg-green-600 text-white" 
                                      : match.status === "Scheduled"
                                      ? "bg-blue-600 text-white"
                                      : "bg-orange-600 text-white"
                                  }`}
                                >
                                  {match.status}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                {/* Home Team */}
                                <div className="flex flex-col items-center gap-3 w-1/3">
                                  <div className="group-hover:scale-110 transition-transform duration-300">
                                    {renderTeamLogo(match.home_team)}
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-center text-white">{match.home_team.name}</span>
                                    <Badge variant="outline" className="mt-2 text-xs flex items-center gap-1 border-primary/30 text-primary bg-primary/10">
                                      <Home className="h-3 w-3" />
                                      Home
                                    </Badge>
                                  </div>
                                </div>

                                {/* Score */}
                                <div className="flex items-center justify-center w-1/3">
                                  {isCompleted ? (
                                    <div className="text-center">
                                      <div className="text-3xl font-bold tabular-nums text-white mb-1">
                                        {match.home_score} - {match.away_score}
                                      </div>
                                      <div className="text-sm text-white/70">
                                        {homeWon ? `${match.home_team.name} Wins` : awayWon ? `${match.away_team.name} Wins` : 'Tie'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <div className="text-2xl font-medium text-white/70 mb-1">vs</div>
                                      <div className="text-sm text-white/50">Scheduled</div>
                                    </div>
                                  )}
                                </div>

                                {/* Away Team */}
                                <div className="flex flex-col items-center gap-3 w-1/3">
                                  <div className="group-hover:scale-110 transition-transform duration-300">
                                    {renderTeamLogo(match.away_team)}
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-center text-white">{match.away_team.name}</span>
                                    <Badge variant="outline" className="mt-2 text-xs flex items-center gap-1 border-primary/30 text-primary bg-primary/10">
                                      <ExternalLink className="h-3 w-3" />
                                      Away
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-primary/10 p-4 flex justify-center border-t border-primary/20">
                              <Button variant="ghost" size="sm" className="text-primary hover:text-white hover:bg-primary/20">
                                View Details →
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}

            {/* No Matches Message */}
            {Object.keys(matchesByDate).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <div className="max-w-md mx-auto">
                  <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
                    <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-white/50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Matches Found</h3>
                    <p className="text-white/70">
                      No matches are scheduled for the selected week and team combination.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Bottom Pagination */}
          {totalWeeks > 1 && (
            <div className="mt-12 flex justify-center">
              <Card className="border-primary/20 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => goToWeek(currentWeek - 1)} 
                      disabled={currentWeek === 1}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Previous Week
                    </Button>

                    <div className="text-center px-8 py-4 bg-primary/20 rounded-xl border border-primary/30">
                      <div className="text-3xl font-bold text-primary">Week {currentWeek}</div>
                      <div className="text-lg text-primary/70">of {totalWeeks}</div>
                    </div>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => goToWeek(currentWeek + 1)}
                      disabled={currentWeek === totalWeeks}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Next Week
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
