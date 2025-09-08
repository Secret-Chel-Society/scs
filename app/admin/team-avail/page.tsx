"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, Users, Calendar, TrendingUp, AlertCircle, Activity, Trophy, Award, Medal, Star, Shield, Database, Settings, Zap, Target, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
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
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-goal-red-500/25">
        <Activity className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">Injury Reserves Management</h2>
      <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6 max-w-md mx-auto">
        This section is currently under development. Advanced injury tracking and medical management features will be available soon.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-4 py-2 rounded-full border border-goal-red-200/30 dark:border-goal-red-700/30">
          <Activity className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
          <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Medical Tracking</span>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/30 dark:border-rink-blue-700/30">
          <Clock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
          <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Recovery Timeline</span>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/30 dark:border-assist-green-700/30">
          <CheckCircle className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
          <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Return to Play</span>
        </div>
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
          <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 shadow-md">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        )
      case "unavailable":
        return (
          <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 shadow-md">
            <XCircle className="h-3 w-3 mr-1" />
            Unavailable
          </Badge>
        )
      case "injury_reserve":
        return (
          <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 shadow-md">
            <Activity className="h-3 w-3 mr-1" />
            IR
          </Badge>
        )
      case "not_responded":
        return (
          <Badge className="bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white border-0 shadow-md">
            <AlertTriangle className="h-3 w-3 mr-1" />
            No Response
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 text-hockey-silver-700 dark:text-hockey-silver-300 border-hockey-silver-300 dark:border-hockey-silver-600">
            Unknown
          </Badge>
        )
    }
  }

  const filteredTeams =
    selectedTeam === "all" ? data?.teams || [] : data?.teams.filter((team) => team.id === selectedTeam) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Users className="h-8 w-8 text-white" />
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Loading Team Availability...</p>
            </div>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <div className="w-20 h-20 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-ice-blue-500/25">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="hockey-title mb-6">
              Team Availability
            </h1>
            <p className="hockey-subtitle mx-auto mb-8 max-w-3xl">
              Comprehensive team roster management and player availability tracking. Monitor game participation, injury reserves, and team statistics.
            </p>
            
            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/30 dark:border-assist-green-700/30">
                <Users className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Player Roster</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <Calendar className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Schedule Tracking</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-4 py-2 rounded-full border border-goal-red-200/30 dark:border-goal-red-700/30">
                <Activity className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Injury Reserves</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <TrendingUp className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Statistics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        <Tabs defaultValue="availability" className="w-full">
          <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10 mb-8">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <TabsTrigger 
                value="availability" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Users className="h-4 w-4" />
                Team Availability
              </TabsTrigger>
              <TabsTrigger 
                value="injury-reserves" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Activity className="h-4 w-4" />
                Injury Reserves
              </TabsTrigger>
            </TabsList>
          </Card>

          <TabsContent value="availability" className="p-6">
            {/* Enhanced Controls Section */}
            <Card className="hockey-card hockey-card-hover mb-6 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-t-lg"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Controls & Filters</CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Configure season and team filters for availability tracking</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                      <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Season:</Label>
                    </div>
                    <Select value={seasonId} onValueChange={setSeasonId}>
                      <SelectTrigger className="hockey-search w-[200px] border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                        <SelectValue placeholder="Select Season" />
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
              </CardContent>
            </Card>

            {/* Enhanced Week Navigation */}
            <Card className="hockey-card hockey-card-hover mb-6 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-t-lg"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                        Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                      </CardTitle>
                      <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                        {data?.matches.length || 0} games scheduled this week
                        {data?.currentSeasonName && ` • ${data.currentSeasonName}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateWeek("prev")}
                      className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous Week
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateWeek("next")}
                      className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      Next Week
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Enhanced Team Filter */}
            <Card className="hockey-card hockey-card-hover mb-6 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                    <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Filter Teams:</Label>
                  </div>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="hockey-search w-[250px] border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
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
              </CardContent>
            </Card>

            {/* Enhanced Games This Week */}
            {data?.matches && data.matches.length > 0 && (
              <Card className="hockey-card hockey-card-hover mb-6 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                <CardHeader className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-t-lg"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Games This Week</CardTitle>
                      <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Scheduled matches and game details for the selected week</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.matches.map((match) => (
                      <div key={match.id} className="p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                        <div className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                          {match.teams?.name} vs {match.away_team?.name}
                        </div>
                        <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(parseISO(match.match_date), "MMM d, h:mm a")}
                        </div>
                        <Badge 
                          variant="outline" 
                          className="bg-gradient-to-r from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/30 text-assist-green-700 dark:text-assist-green-300 border-assist-green-300 dark:border-assist-green-600"
                        >
                          {match.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Team Availability Tables */}
            {filteredTeams.map((team) => (
              <Card key={team.id} className="hockey-card hockey-card-hover mb-6 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                <CardHeader className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-t-lg"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
                        {team.name}
                        <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 shadow-md">
                          {team.players.length} players
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Player availability and games played for the selected week</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-xl border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                          <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Player</TableHead>
                          <TableHead className="text-center text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                            <div className="flex items-center justify-center gap-1">
                              <TrendingUp className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                              GP
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Available</TableHead>
                          <TableHead className="text-center text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Unavailable</TableHead>
                          <TableHead className="text-center text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                            <div className="flex items-center justify-center gap-1">
                              <Activity className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                              IR
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">No Response</TableHead>
                          <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Game Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.players.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-hockey-silver-600 dark:text-hockey-silver-400">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-hockey-silver-400 dark:text-hockey-silver-500" />
                                <span className="font-medium">No players found for this team</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          team.players.map((player) => (
                            <TableRow
                              key={player.id}
                              className={`hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30 ${
                                player.isOnIR ? "bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10" : ""
                              }`}
                            >
                              <TableCell>
                                <div>
                                  <div className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                                    {player.name}
                                    {player.isOnIR && (
                                      <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-xs border-0 shadow-md">
                                        <Activity className="h-3 w-3 mr-1" />
                                        IR
                                      </Badge>
                                    )}
                                  </div>
                                  {player.gamerTag && (
                                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-1">
                                      <Database className="h-3 w-3" />
                                      @{player.gamerTag}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-gradient-to-r from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/30 text-assist-green-700 dark:text-assist-green-300 border-assist-green-300 dark:border-assist-green-600 font-mono font-bold">
                                  {player.gamesPlayed}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 shadow-md">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {player.availableCount}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 shadow-md">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {player.unavailableCount}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 shadow-md">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {player.injuryReserveCount}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white border-0 shadow-md">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {player.noResponseCount}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {player.availability.length === 0 ? (
                                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      No games this week
                                    </div>
                                  ) : (
                                    player.availability.map((avail) => (
                                      <div key={avail.matchId} className="flex items-center gap-2 text-sm">
                                        <span className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">vs {avail.opponent}</span>
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
              <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-goal-red-500/25">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">No Data Available</h3>
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6 max-w-md mx-auto">
                    {data?.teams.length === 0
                      ? "No teams found. Make sure teams are set up and marked as active."
                      : "No team availability data found for the selected week and season."}
                  </p>
                  {data?.teams.length === 0 && (
                    <Button 
                      onClick={() => router.push("/admin/teams")} 
                      className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Teams
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="injury-reserves" className="p-6">
            <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 rounded-t-lg"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Injury Reserves Management</CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Manage player injury reserves and medical status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <InjuryReservesManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
