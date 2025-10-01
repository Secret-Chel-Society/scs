"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import {
  Clock,
  Home,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Trophy,
} from "lucide-react"
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
  const [currentSeason, setCurrentSeason] = useState<any>(null)

  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(1)
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [weekMatches, setWeekMatches] = useState<any[]>([])

  useEffect(() => {
    const week = searchParams.get("week")
    const team = searchParams.get("team")

    if (week) setCurrentWeek(Number.parseInt(week))
    if (team) setSelectedTeam(team)
  }, [searchParams])

  useEffect(() => {
    async function fetchCurrentSeason() {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (settingsError) throw settingsError

        if (settingsData?.value) {
          const { data: seasonData, error: seasonError } = await supabase
            .from("seasons")
            .select("id, name, is_active")
            .eq("id", settingsData.value)
            .single()

          if (seasonError) throw seasonError
          setCurrentSeason(seasonData)
        }
      } catch (error) {
        console.error("Error fetching current season:", error)
        const { data: fallbackSeason } = await supabase
          .from("seasons")
          .select("id, name, is_active")
          .eq("name", "SCSHL Season 1")
          .single()

        if (fallbackSeason) {
          setCurrentSeason(fallbackSeason)
        }
      }
    }

    fetchCurrentSeason()
  }, [supabase])

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

        if (selectedTeam !== "all") {
          query = query.or(`home_team_id.eq.${selectedTeam},away_team_id.eq.${selectedTeam}`)
        }

        const { data, error } = await query.order("match_date", { ascending: true })

        if (error) throw error

        console.log(`Found ${data?.length || 0} matches for ${currentSeason.name}`)
        setMatches(data || [])

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

  const calculateWeeks = (matchesData: any[]) => {
    if (!matchesData.length) return 1

    const firstMatchDate = new Date(matchesData[0].match_date)
    const lastMatchDate = new Date(matchesData[matchesData.length - 1].match_date)

    const timeDiff = lastMatchDate.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000))

    return Math.max(1, weeksDiff + 1)
  }

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

  const updateURL = (week: number, team: string) => {
    const params = new URLSearchParams()
    if (week > 1) params.set("week", week.toString())
    if (team !== "all") params.set("team", team)

    const newURL = params.toString() ? `/matches?${params.toString()}` : "/matches"
    router.replace(newURL, { scroll: false })
  }

  const goToWeek = (week: number) => {
    setCurrentWeek(week)
    updateURL(week, selectedTeam)
  }

  const handleTeamFilter = (team: string) => {
    setSelectedTeam(team)
    setCurrentWeek(1)
    updateURL(1, team)
  }

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

    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
        {team.name.substring(0, 2)}
      </div>
    )
  }

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
      <div className="min-h-screen relative">
        <div
          className="fixed inset-0 opacity-5 bg-no-repeat bg-center bg-contain pointer-events-none"
          style={{
            backgroundImage:
              "url('https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png')",
          }}
        />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MGHL Matches
              </h1>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg">Follow all the action from your favorite teams</p>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-12 w-32" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative">
        <div
          className="fixed inset-0 opacity-5 bg-no-repeat bg-center bg-contain pointer-events-none"
          style={{
            backgroundImage:
              "url('https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/team-logos/69ECC8EB-551A-4F62-B3A4-BAFE00F05DC7-removebg-preview%20(1).png')",
          }}
        />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SCS Matches
              </h1>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="max-w-md mx-auto bg-card border border-destructive/20 rounded-xl p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Unable to Load Matches</h2>
            <p className="text-muted-foreground mb-2">{error}</p>
            <p className="text-muted-foreground mb-6">
              There was a problem connecting to the database. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
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
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 opacity-5 bg-no-repeat bg-center bg-contain pointer-events-none"
        style={{
          backgroundImage:
            "url('https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/team-logos/69ECC8EB-551A-4F62-B3A4-BAFE00F05DC7-removebg-preview%20(1).png')",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SCS Matches
            </h1>
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">Follow all the action from your favorite teams</p>
        </div>

        <Card className="mb-8 border-2 border-primary/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Filter className="h-5 w-5" />
              <h3 className="font-semibold">Filter Matches</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Select value={selectedTeam} onValueChange={handleTeamFilter}>
                    <SelectTrigger className="w-64 border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Filter by team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🏒 All Teams</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {totalWeeks > 1 && (
                  <div className="flex items-center gap-2">
                    <Select value={currentWeek.toString()} onValueChange={(value) => goToWeek(Number.parseInt(value))}>
                      <SelectTrigger className="w-48 border-primary/20 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                          <SelectItem key={week} value={week.toString()}>
                            📅 Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-base py-2 px-4 border-primary/30 bg-primary/5">
                  🏆 {currentSeason?.name || "Loading..."}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {totalWeeks > 1 && (
          <Card className="mb-8 border-accent/20 bg-accent/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => goToWeek(currentWeek - 1)}
                  disabled={currentWeek === 1}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous Week
                </Button>

                <div className="text-center">
                  <div className="font-bold text-lg text-primary">
                    Week {currentWeek} of {totalWeeks}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {getWeekDateRange()}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => goToWeek(currentWeek + 1)}
                  disabled={currentWeek === totalWeeks}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  Next Week
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {weekMatches.length === 0 && (
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">🏒</div>
              <h3 className="text-xl font-semibold mb-2">No Matches Found</h3>
              <p className="text-muted-foreground">
                {selectedTeam === "all"
                  ? `No matches scheduled for Week ${currentWeek}.`
                  : `No matches found for the selected team in Week ${currentWeek}.`}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-10">
          {Object.entries(matchesByDate).map(([date, dateMatches]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent flex-1" />
                <h2 className="text-2xl font-bold text-primary bg-background px-4">{date}</h2>
                <div className="h-px bg-gradient-to-r from-primary via-transparent to-transparent flex-1" />
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {dateMatches.map((match) => {
                  const formattedDate = formatDate(match.match_date)
                  const isCompleted = match.status === "Completed"

                  return (
                    <Card
                      key={match.id}
                      className="group overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 bg-card/80 backdrop-blur-sm"
                      onClick={() => router.push(`/matches/${match.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{formattedDate.time}</span>
                            </div>
                            <Badge
                              variant={getStatusBadgeVariant(match.status)}
                              className={`${match.status === "Completed" ? "bg-accent text-accent-foreground" : ""}`}
                            >
                              {match.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-3 w-2/5">
                              <div className="relative">
                                {renderTeamLogo(match.home_team)}
                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <Home className="h-3 w-3" />
                                </div>
                              </div>
                              <div className="text-center">
                                <span className="font-bold text-sm">{match.home_team.name}</span>
                                <div className="text-xs text-muted-foreground">Home</div>
                                {isCompleted && (
                                  <div className="text-2xl font-black tabular-nums text-primary mt-1">
                                    {match.home_score}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-center justify-center w-1/5">
                              <div className="text-2xl font-bold text-muted-foreground">VS</div>
                            </div>

                            <div className="flex flex-col items-center gap-3 w-2/5">
                              <div className="relative">
                                {renderTeamLogo(match.away_team)}
                                <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground rounded-full p-1">
                                  <ExternalLink className="h-3 w-3" />
                                </div>
                              </div>
                              <div className="text-center">
                                <span className="font-bold text-sm">{match.away_team.name}</span>
                                <div className="text-xs text-muted-foreground">Away</div>
                                {isCompleted && (
                                  <div className="text-2xl font-black tabular-nums text-primary mt-1">
                                    {match.away_score}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-3 flex justify-center group-hover:from-primary/10 group-hover:via-accent/10 group-hover:to-primary/10 transition-all duration-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary"
                          >
                            View Match Details →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {totalWeeks > 1 && (
          <Card className="mt-12 border-primary/20 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex justify-center">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => goToWeek(currentWeek - 1)}
                    disabled={currentWeek === 1}
                    className="border-primary/30 hover:bg-primary hover:text-primary-foreground"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="px-6 py-2 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="font-bold text-primary">
                      Week {currentWeek} of {totalWeeks}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => goToWeek(currentWeek + 1)}
                    disabled={currentWeek === totalWeeks}
                    className="border-primary/30 hover:bg-primary hover:text-primary-foreground"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
