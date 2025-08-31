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
import { ChevronLeft, ChevronRight, Users, Calendar, TrendingUp, AlertCircle, Activity, Clock, Filter } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-400" />
            Injury Reserves Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage player injury reserve status and availability
          </p>
        </div>
        
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Under Development
            </CardTitle>
            <CardDescription className="text-white/70">
              This section is currently under development and will be available soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="h-16 w-16 text-orange-400/50 mx-auto mb-4" />
              <p className="text-white/70">Injury reserves management features are coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
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
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            Available
          </Badge>
        )
      case "unavailable":
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Unavailable</Badge>
      case "injury_reserve":
        return (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            IR
          </Badge>
        )
      case "not_responded":
        return <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30">No Response</Badge>
      default:
        return <Badge variant="outline" className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>
    }
  }

  const filteredTeams =
    selectedTeam === "all" ? data?.teams || [] : data?.teams.filter((team) => team.id === selectedTeam) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-400" />
            Team Availability
          </h1>
          <p className="text-white/70 text-lg">
            Monitor player availability and team readiness for upcoming matches
          </p>
        </div>

        <Tabs defaultValue="availability" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-white/20">
            <TabsTrigger value="availability" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Team Availability</TabsTrigger>
            <TabsTrigger value="injury-reserves" className="text-white data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">Injury Reserves</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="mt-6 space-y-6">
            {/* Season Selection */}
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-400" />
                  Season Selection
                </CardTitle>
                <CardDescription className="text-white/70">Choose the season to view availability data</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={seasonId} onValueChange={setSeasonId}>
                  <SelectTrigger className="w-[280px] bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Season" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="current" className="text-white hover:bg-slate-700">Current Season</SelectItem>
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.season_number?.toString() || season.id} className="text-white hover:bg-slate-700">
                        {season.name || `Season ${season.season_number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Week Navigation */}
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-400" />
                      Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {data?.matches.length || 0} games scheduled this week
                      {data?.currentSeasonName && ` • ${data.currentSeasonName}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateWeek("prev")}
                      className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous Week
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateWeek("next")}
                      className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                    >
                      Next Week
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Team Filter */}
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-400" />
                  Team Filter
                </CardTitle>
                <CardDescription className="text-white/70">Filter availability data by specific team</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-[280px] bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">All Teams</SelectItem>
                    {data?.teams.map((team) => (
                      <SelectItem key={team.id} value={team.id} className="text-white hover:bg-slate-700">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Games This Week */}
            {data?.matches && data.matches.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    Games This Week
                  </CardTitle>
                  <CardDescription className="text-white/70">Scheduled matches for the selected week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.matches.map((match) => (
                      <div key={match.id} className="p-4 border border-white/20 rounded-lg bg-slate-800/30">
                        <div className="font-medium text-white">
                          {match.teams?.name} vs {match.away_team?.name}
                        </div>
                        <div className="text-sm text-white/70 mt-1">
                          {format(parseISO(match.match_date), "MMM d, h:mm a")}
                        </div>
                        <Badge variant="outline" className="mt-2 bg-slate-700/50 border-white/20 text-white">
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
              <Card key={team.id} className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    {team.name}
                    <Badge variant="outline" className="bg-slate-700/50 border-white/20 text-white">{team.players.length} players</Badge>
                  </CardTitle>
                  <CardDescription className="text-white/70">Player availability and games played for the selected week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-white/20 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="text-white">Player</TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center gap-1 text-white">
                              <TrendingUp className="h-4 w-4" />
                              GP
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-white">Available</TableHead>
                          <TableHead className="text-center text-white">Unavailable</TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center gap-1 text-white">
                              <Activity className="h-4 w-4" />
                              IR
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-white">No Response</TableHead>
                          <TableHead className="text-white">Game Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.players.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-white/70">
                              No players found for this team
                            </TableCell>
                          </TableRow>
                        ) : (
                          team.players.map((player) => (
                            <TableRow
                              key={player.id}
                              className={`border-white/20 hover:bg-slate-800/30 ${player.isOnIR ? "bg-orange-500/10" : ""}`}
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium flex items-center gap-2 text-white">
                                    {player.name}
                                    {player.isOnIR && (
                                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                        IR
                                      </Badge>
                                    )}
                                  </div>
                                  {player.gamerTag && (
                                    <div className="text-sm text-white/70">@{player.gamerTag}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="font-mono bg-slate-700/50 border-white/20 text-white">
                                  {player.gamesPlayed}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                                  {player.availableCount}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">{player.unavailableCount}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                  {player.injuryReserveCount}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30">{player.noResponseCount}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {player.availability.length === 0 ? (
                                    <div className="text-sm text-white/70 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      No games this week
                                    </div>
                                  ) : (
                                    player.availability.map((avail) => (
                                      <div key={avail.matchId} className="flex items-center gap-2 text-sm">
                                        <span className="text-white/70">vs {avail.opponent}</span>
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
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-white/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-white">No Data Available</h3>
                  <p className="text-white/70">
                    {data?.teams.length === 0
                      ? "No teams found. Make sure teams are set up and marked as active."
                      : "No team availability data found for the selected week and season."}
                  </p>
                  {data?.teams.length === 0 && (
                    <Button 
                      onClick={() => router.push("/admin/teams")} 
                      variant="outline" 
                      className="mt-4 bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                    >
                      Manage Teams
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="injury-reserves" className="mt-6">
            <InjuryReservesManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
