"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TeamStandings from "@/components/team-standings"
import { calculateStandings, getCurrentSeasonId, getSeasons } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"
import { Trophy, Target, TrendingUp, Award, Medal, Star, Zap, Users, TrendingDown, ArrowUp, ArrowDown, Minus, Crown, Flame, Shield, Rocket, Calendar, BarChart3, TrendingUp2 } from "lucide-react"

interface StandingsPageProps {
  searchParams: { season?: string }
}

async function getStandingsData(seasonId: number) {
  try {
    const standings = await calculateStandings(seasonId)
    return standings
  } catch (error) {
    console.error("Error fetching standings:", error)
    return []
  }
}

async function getSeasonsData() {
  try {
    const seasons = await getSeasons()
    const currentSeasonId = await getCurrentSeasonId()
    return { seasons, currentSeasonId }
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return { seasons: [], currentSeasonId: 1 }
  }
}

function PlayoffPicture({ standings }: { standings: TeamStanding[] }) {
  // Sort teams by points for playoff seeding
  const sortedTeams = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
    return b.goals_for - a.goals_for
  })

  const playoffTeams = sortedTeams.slice(0, 8) // Top 8 teams make playoffs
  const bubbleTeams = sortedTeams.slice(8, 12) // Next 4 teams in the hunt

  return (
    <div className="space-y-8">
      <div>
        <Card className="hockey-card hockey-card-hover group">
          <CardHeader className="pb-4 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
            <CardTitle className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-assist-green-500/25">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Playoff Teams
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Top 8 Teams - Clinched Spots
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-4">
              {playoffTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="group/team flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border border-assist-green-200 dark:border-assist-green-700 hover:shadow-xl hover:shadow-assist-green-500/25 hover:border-assist-green-300 dark:hover:border-assist-green-600 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Badge className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-xl group-hover/team:scale-110 transition-transform duration-200">
                        {index + 1}
                      </Badge>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xl text-hockey-silver-800 dark:text-hockey-silver-200 group-hover/team:text-assist-green-700 dark:group-hover/team:text-assist-green-300 transition-colors duration-200">
                        {team.name}
                      </span>
                      {team.playoff_status === "clinched" && (
                        <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg shadow-assist-green-500/25 border-2 border-white dark:border-hockey-silver-800">
                          <Medal className="h-3 w-3 mr-1" />
                          CLINCHED
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-1">
                        {team.points}
                      </div>
                      <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide font-medium">
                        Points
                      </div>
                      <div className="w-12 h-1 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full mx-auto mt-2 group-hover/team:w-16 transition-all duration-300"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-1">
                        {team.wins}-{team.losses}-{team.otl}
                      </div>
                      <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide font-medium">
                        Record
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {bubbleTeams.length > 0 && (
        <div>
          <Card className="hockey-card hockey-card-hover group">
            <CardHeader className="pb-4 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <CardTitle className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-goal-red-500/25">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    Bubble Teams
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Fighting for Playoff Spots
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid gap-4">
                {bubbleTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className="group/team flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 border border-goal-red-200 dark:border-goal-red-700 hover:shadow-xl hover:shadow-goal-red-500/25 hover:border-goal-red-300 dark:hover:border-goal-red-600 hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Badge className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-xl group-hover/team:scale-110 transition-transform duration-200">
                          {playoffTeams.length + index + 1}
                        </Badge>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xl text-hockey-silver-800 dark:text-hockey-silver-200 group-hover/team:text-goal-red-700 dark:group-hover/team:text-goal-red-300 transition-colors duration-200">
                          {team.name}
                        </span>
                        {team.playoff_status === "eliminated" && (
                          <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-xs px-3 py-1 rounded-full shadow-lg shadow-goal-red-500/25 border-2 border-white dark:border-hockey-silver-800">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            ELIMINATED
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-1">
                          {team.points}
                        </div>
                        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide font-medium">
                          Points
                        </div>
                        <div className="w-12 h-1 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full mx-auto mt-2 group-hover/team:w-16 transition-all duration-300"></div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-1">
                          {team.wins}-{team.losses}-{team.otl}
                        </div>
                        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide font-medium">
                          Record
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-goal-red-600 dark:text-goal-red-400 mb-1">
                          {playoffTeams[playoffTeams.length - 1].points - team.points}
                        </div>
                        <div className="text-xs text-goal-red-600 dark:text-goal-red-400 uppercase tracking-wide font-medium">
                          Pts Back
                        </div>
                        <div className="w-12 h-1 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full mx-auto mt-2 group-hover/team:w-16 transition-all duration-300"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ConferenceStandings({ standings }: { standings: TeamStanding[] }) {
  // Group teams by conference/division
  const nhlTeams = standings.filter((team) => team.division === "NHL" || team.conference === "NHL")
  const customTeams = standings.filter((team) => team.division === "Custom" || team.conference === "Custom")

  // If no division data, split teams roughly in half
  const hasConferenceData = nhlTeams.length > 0 || customTeams.length > 0

  const conference1Teams = hasConferenceData ? nhlTeams : standings.slice(0, Math.ceil(standings.length / 2))
  const conference2Teams = hasConferenceData ? customTeams : standings.slice(Math.ceil(standings.length / 2))

  const conference1Name = hasConferenceData ? "NHL Conference" : "Eastern Conference"
  const conference2Name = hasConferenceData ? "Custom Conference" : "Western Conference"

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <Card className="hockey-card hockey-card-hover h-full group">
          <CardHeader className="pb-4 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
            <CardTitle className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  {conference1Name}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  {conference1Teams.length} teams
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <TeamStandings teams={conference1Teams} />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="hockey-card hockey-card-hover h-full group">
          <CardHeader className="pb-4 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
            <CardTitle className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-rink-blue-500/25">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  {conference2Name}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  {conference2Teams.length} teams
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <TeamStandings teams={conference2Teams} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StandingsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  )
}

async function StandingsContent({ seasonId }: { seasonId: number }) {
  const standings = await getStandingsData(seasonId)

  if (!standings || standings.length === 0) {
    return (
      <Card className="hockey-card">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-hockey-silver-200 to-ice-blue-200 dark:from-hockey-silver-700 dark:to-ice-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-hockey-silver-500 dark:text-hockey-silver-400" />
            </div>
            <h3 className="text-2xl font-bold text-hockey-silver-700 dark:text-hockey-silver-300 mb-3">
              No Standings Available
            </h3>
            <p className="text-hockey-silver-500 dark:text-hockey-silver-500 text-lg">
              No team data found for this season.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="overall" className="space-y-8">
      <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 p-1 rounded-xl border border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg">
        <TabsTrigger 
          value="overall" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Overall Standings
        </TabsTrigger>
        <TabsTrigger 
          value="conference" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Users className="h-4 w-4 mr-2" />
          Conference
        </TabsTrigger>
        <TabsTrigger 
          value="playoffs" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Trophy className="h-4 w-4 mr-2" />
          Playoff Picture
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-8">
        <div>
          <Card className="hockey-card hockey-card-hover group">
            <CardHeader className="pb-4 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <CardTitle className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    League Standings
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Complete standings for all teams in the league
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="mb-8 flex items-center gap-8 text-sm">
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-sm px-3 py-1 rounded-full shadow-lg shadow-assist-green-500/25">
                    X
                  </Badge>
                  <span className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Clinched Playoff Spot</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-sm px-3 py-1 rounded-full shadow-lg shadow-goal-red-500/25">
                    E
                  </Badge>
                  <span className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Eliminated from Playoffs</span>
                </div>
              </div>
              <TeamStandings teams={standings} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="conference" className="space-y-8">
        <ConferenceStandings standings={standings} />
      </TabsContent>

      <TabsContent value="playoffs" className="space-y-8">
        <PlayoffPicture standings={standings} />
      </TabsContent>
    </Tabs>
  )
}

export default function StandingsPage({ searchParams }: StandingsPageProps) {
  const [seasons, setSeasons] = useState<any[]>([])
  const [currentSeasonId, setCurrentSeasonId] = useState<number>(1)
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { seasons: seasonsData, currentSeasonId: currentId } = await getSeasonsData()
        setSeasons(seasonsData)
        setCurrentSeasonId(currentId)
        setSelectedSeasonId(searchParams.season ? Number.parseInt(searchParams.season) : currentId)
      } catch (error) {
        console.error("Error fetching seasons:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams.season])

  const handleSeasonChange = (value: string) => {
    const newSeasonId = Number.parseInt(value)
    setSelectedSeasonId(newSeasonId)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('season', value)
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              League Standings
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Track team performance, conference rankings, and playoff races. See who's leading the pack and fighting for playoff spots.
            </p>
            
            {/* Enhanced Season Selector */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Select value={selectedSeasonId.toString()} onValueChange={handleSeasonChange} disabled={loading}>
                  <SelectTrigger className="hockey-search h-14 text-lg border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                          {season.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div>
          <Suspense fallback={<StandingsLoadingSkeleton />}>
            <StandingsContent seasonId={selectedSeasonId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
