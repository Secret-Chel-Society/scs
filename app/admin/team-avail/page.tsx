"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, Users, Calendar, TrendingUp, AlertCircle, Activity } from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlayerAvailability {
  matchId: string
  matchDate: string
  opponent: string
  status: "available" | "unavailable" | "injury_reserve" | "not_responded"
  signedUpAt: string | null
}

interface Player {
  id: string
  userId: string
  name: string
  gamerTag: string
  gamesPlayed: number
  availability: PlayerAvailability[]
  availableCount: number
  unavailableCount: number
  injuryReserveCount: number
  noResponseCount: number
  isOnIR: boolean
}

interface Team {
  id: string
  name: string
  logoUrl: string | null
  players: Player[]
  matches: any[]
}

interface TeamAvailabilityData {
  teams: Team[]
  matches: any[]
  seasons: any[]
  currentSeasonId: string
  currentSeasonName: string
  weekStart: string
  weekEnd: string
}

const InjuryReservesManagement = () => {
  return (
    <div>
      <h2>Injury Reserves Management</h2>
      <p>This section is under development.</p>
    </div>
  )
}

export default function TeamAvailabilityPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [data, setData] = useState<TeamAvailabilityData | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [seasonId, setSeasonId] = useState("current")
  const [seasons, setSeasons] = useState<any[]>([])

  useEffect(() => {
    async function checkAuthorization() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
        await loadAvailabilityData()
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  useEffect(() => {
    if (isAdmin) {
      loadAvailabilityData()
    }
  }, [currentWeek, seasonId, isAdmin])

  const loadAvailabilityData = async () => {
    try {
      setLoading(true)

      const weekStart = format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")
      const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")

      console.log(`Loading availability data for week ${weekStart} to ${weekEnd}, season ${seasonId}`)

      const response = await fetch(
        `/api/admin/team-availability?weekStart=${weekStart}&weekEnd=${weekEnd}&seasonId=${seasonId}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API response error:", response.status, errorText)
        throw new Error(`Failed to fetch availability data: ${response.status} - ${errorText}`)
      }

      const availabilityData = await response.json()
      console.log("Received availability data:", availabilityData)

      if (availabilityData.error) {
        throw new Error(availabilityData.error)
      }

      setData(availabilityData)
      setSeasons(availabilityData.seasons || [])
    } catch (error: any) {
      console.error("Error loading availability data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load availability data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek((prev) => (direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Available
          </Badge>
        )
      case "unavailable":
        return <Badge variant="destructive">Unavailable</Badge>
      case "injury_reserve":
        return (
          <Badge variant="secondary" className="bg-orange-500 text-white">
            IR
          </Badge>
        )
      case "not_responded":
        return <Badge variant="secondary">No Response</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredTeams =
    selectedTeam === "all" ? data?.teams || [] : data?.teams.filter((team) => team.id === selectedTeam) || []

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="availability">Team Availability</TabsTrigger>
          <TabsTrigger value="injury-reserves">Injury Reserves</TabsTrigger>
        </TabsList>

        <TabsContent value="availability">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Team Availability</h1>
            <div className="flex items-center gap-4">
              <Select value={seasonId} onValueChange={setSeasonId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Season</SelectItem>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.season_number?.toString() || season.id}>
                      {season.name || `Season ${season.season_number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Week Navigation */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                  </CardTitle>
                  <CardDescription>
                    {data?.matches.length || 0} games scheduled this week
                    {data?.currentSeasonName && ` • ${data.currentSeasonName}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous Week
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                    Next Week
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Team Filter */}
          <div className="mb-6">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {data?.teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Games This Week */}
          {data?.matches && data.matches.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Games This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.matches.map((match) => (
                    <div key={match.id} className="p-3 border rounded-lg">
                      <div className="font-medium">
                        {match.teams?.name} vs {match.away_team?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(match.match_date), "MMM d, h:mm a")}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {match.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Availability Tables */}
          {filteredTeams.map((team) => (
            <Card key={team.id} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {team.name}
                  <Badge variant="outline">{team.players.length} players</Badge>
                </CardTitle>
                <CardDescription>Player availability and games played for the selected week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            GP
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Available</TableHead>
                        <TableHead className="text-center">Unavailable</TableHead>
                        <TableHead className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Activity className="h-4 w-4" />
                            IR
                          </div>
                        </TableHead>
                        <TableHead className="text-center">No Response</TableHead>
                        <TableHead>Game Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.players.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                            No players found for this team
                          </TableCell>
                        </TableRow>
                      ) : (
                        team.players.map((player) => (
                          <TableRow
                            key={player.id}
                            className={player.isOnIR ? "bg-orange-50 dark:bg-orange-950/20" : ""}
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {player.name}
                                  {player.isOnIR && (
                                    <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
                                      IR
                                    </Badge>
                                  )}
                                </div>
                                {player.gamerTag && (
                                  <div className="text-sm text-muted-foreground">@{player.gamerTag}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-mono">
                                {player.gamesPlayed}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-green-500">
                                {player.availableCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive">{player.unavailableCount}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-orange-500 text-white">
                                {player.injuryReserveCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{player.noResponseCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {player.availability.length === 0 ? (
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    No games this week
                                  </div>
                                ) : (
                                  player.availability.map((avail) => (
                                    <div key={avail.matchId} className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">vs {avail.opponent}</span>
                                      {getStatusBadge(avail.status)}
                                    </div>
                                  ))
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTeams.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  {data?.teams.length === 0
                    ? "No teams found. Make sure teams are set up and marked as active."
                    : "No team availability data found for the selected week and season."}
                </p>
                {data?.teams.length === 0 && (
                  <Button onClick={() => router.push("/admin/teams")} variant="outline" className="mt-4">
                    Manage Teams
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="injury-reserves">
          <InjuryReservesManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
