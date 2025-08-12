"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface TeamAvailabilityTabProps {
  teamId: string
  teamName: string
}

interface Player {
  id: string
  user_id: string
  users: {
    id: string
    gamer_tag_id: string
  }
}

interface AvailabilityRecord {
  match_id: string
  user_id: string
  status: string
  created_at: string
}

interface Match {
  id: string
  match_date: string
  home_team_id: string
  away_team_id: string
  home_team: { name: string }
  away_team: { name: string }
  availability: AvailabilityRecord[]
}

interface Week {
  weekStart: string
  matches: Match[]
}

export function TeamAvailabilityTab({ teamId, teamName }: TeamAvailabilityTabProps) {
  const [loading, setLoading] = useState(true)
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [weeks, setWeeks] = useState<Week[]>([])
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build a 6-week window
      const start = new Date()
      start.setDate(start.getDate() - 1) // yesterday

      const end = new Date()
      end.setDate(end.getDate() + 42) // 6 weeks ahead

      const startDate = start.toISOString().split("T")[0]
      const endDate = end.toISOString().split("T")[0]

      console.log(`Fetching availability data for team ${teamId} from ${startDate} to ${endDate}`)

      const response = await fetch(
        `/api/management/team-availability?teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API response error:", response.status, errorText)
        throw new Error(`Failed to fetch availability data: ${response.status}`)
      }

      const data = await response.json()
      console.log("Received availability data:", data)

      if (data.error) {
        setError(data.error)
        return
      }

      setTeamPlayers(data.teamPlayers || [])
      setWeeks(data.weeks || [])

      if (data.weeks && data.weeks.length > 0) {
        setCurrentWeekIndex(0)
      }
    } catch (error: any) {
      console.error("Error fetching availability data:", error)
      setError(error.message || "Failed to load availability data")
      toast({
        title: "Error",
        description: error.message || "Failed to load availability data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (teamId) {
      fetchAvailabilityData()
    }
  }, [teamId])

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`
  }

  const getPlayerName = (userId: string) => {
    const player = teamPlayers.find((p) => p.user_id === userId)
    return player?.users?.gamer_tag_id || "Unknown Player"
  }

  const getAvailabilityStats = (match: Match) => {
    const totalPlayers = teamPlayers.length
    const availablePlayers = match.availability.filter((avail) => avail.status === "available").length
    const unavailablePlayers = match.availability.filter((avail) => avail.status === "unavailable").length
    const injuryReservePlayers = match.availability.filter((avail) => avail.status === "injury_reserve").length

    const playersWithResponse = match.availability.map((a) => a.user_id)
    const playersWithNoResponse = teamPlayers.filter((player) => !playersWithResponse.includes(player.user_id))
    const noResponse = playersWithNoResponse.length

    return {
      available: availablePlayers,
      unavailable: unavailablePlayers,
      injuryReserve: injuryReservePlayers,
      noResponse: Math.max(0, noResponse),
      total: totalPlayers,
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            {error.includes("not set up") && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">The game availability system needs to be set up first.</p>
                <Button
                  onClick={() => window.open("/admin/run-migration/game-availability", "_blank")}
                  variant="outline"
                  size="sm"
                >
                  Run Migration
                </Button>
              </div>
            )}
            <div className="mt-4">
              <Button onClick={fetchAvailabilityData} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentWeek = weeks[currentWeekIndex]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Team Availability</h2>
          <Badge variant="outline">{teamPlayers.length} players</Badge>
        </div>
      </div>

      {weeks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming games in the next 6 weeks</p>
              <p className="text-sm mt-2">Players can sign up for availability once games are scheduled.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Week Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                    disabled={currentWeekIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Previous</span>
                  </Button>

                  <Select
                    value={currentWeekIndex.toString()}
                    onValueChange={(value) => setCurrentWeekIndex(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weeks.map((week, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Week {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeekIndex(Math.min(weeks.length - 1, currentWeekIndex + 1))}
                    disabled={currentWeekIndex === weeks.length - 1}
                  >
                    <span className="hidden md:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  {currentWeek && formatWeekRange(currentWeek.weekStart)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Week Display */}
          {currentWeek ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Week {currentWeekIndex + 1}</CardTitle>
                <CardDescription>
                  {currentWeek.matches.length} game{currentWeek.matches.length !== 1 ? "s" : ""} this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentWeek.matches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No games scheduled for this week</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentWeek.matches.map((match) => {
                      const matchDate = new Date(match.match_date)
                      const isHomeTeam = match.home_team_id.toString() === teamId
                      const opponent = isHomeTeam ? match.away_team : match.home_team
                      const stats = getAvailabilityStats(match)

                      return (
                        <div key={match.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {isHomeTeam ? "HOME" : "AWAY"}
                                </Badge>
                                <span className="font-medium">vs {opponent?.name || "TBD"}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {matchDate.toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="font-medium">{stats.available}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="font-medium">{stats.unavailable}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium">{stats.injuryReserve}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{stats.noResponse}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Player Availability Details */}
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <h4 className="font-medium text-green-600 mb-2 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Available ({stats.available})
                                </h4>
                                <div className="space-y-1">
                                  {match.availability
                                    .filter((avail) => avail.status === "available")
                                    .map((avail) => (
                                      <div key={avail.user_id} className="text-muted-foreground">
                                        {getPlayerName(avail.user_id)}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-red-600 mb-2 flex items-center gap-1">
                                  <XCircle className="h-4 w-4" />
                                  Unavailable ({stats.unavailable})
                                </h4>
                                <div className="space-y-1">
                                  {match.availability
                                    .filter((avail) => avail.status === "unavailable")
                                    .map((avail) => (
                                      <div key={avail.user_id} className="text-muted-foreground">
                                        {getPlayerName(avail.user_id)}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4" />
                                  Injury Reserve ({stats.injuryReserve})
                                </h4>
                                <div className="space-y-1">
                                  {match.availability
                                    .filter((avail) => avail.status === "injury_reserve")
                                    .map((avail) => (
                                      <div key={avail.user_id} className="text-muted-foreground">
                                        {getPlayerName(avail.user_id)}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-gray-600 mb-2 flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  No Response ({stats.noResponse})
                                </h4>
                                <div className="space-y-1">
                                  {teamPlayers
                                    .filter(
                                      (player) => !match.availability.some((avail) => avail.user_id === player.user_id),
                                    )
                                    .map((player) => (
                                      <div key={player.user_id} className="text-muted-foreground">
                                        {player.users?.gamer_tag_id || "Unknown Player"}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No week selected</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
