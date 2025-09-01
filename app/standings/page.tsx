import React, { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import TeamStandings from "@/components/team-standings"
import { PlayoffBracket } from "@/components/standings/playoff-bracket"
import { calculateStandings, getCurrentSeasonId, getSeasons, CONFERENCES, generatePlayoffBracket } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"
import { Trophy, Target, TrendingUp, Star, Award, Medal, Crown, Zap, MapPin, Shield } from "lucide-react"
import Image from "next/image"

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
  // Generate playoff bracket
  const playoffBracket = generatePlayoffBracket(standings)
  
  // Get teams by conference for playoff picture
  const easternTeams = standings
    .filter(team => team.conference === CONFERENCES.EASTERN_ELITES)
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
      return b.goals_for - a.goals_for
    })
    .slice(0, 4)

  const westernTeams = standings
    .filter(team => team.conference === CONFERENCES.WESTERN_WARRIORS)
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
      return b.goals_for - a.goals_for
    })
    .slice(0, 4)

  return (
    <div className="space-y-8">
      {/* Eastern Conference Playoff Teams */}
      <div className="animate-fade-in">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-200">
              <MapPin className="h-6 w-6" />
              Eastern Elites Playoff Teams
              <Badge variant="outline" className="bg-blue-500/20 border-blue-400/50 text-blue-200">
                Top 4
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {easternTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-200"
                      >
                        {index + 1}
                      </Badge>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1">
                          {index === 0 && <Crown className="h-4 w-4 text-yellow-400" />}
                          {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Award className="h-4 w-4 text-amber-600" />}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{team.name}</span>
                      {team.playoff_status === "clinched" && (
                        <Badge
                          variant="default"
                          className="bg-blue-600/20 border-blue-400/50 text-blue-200 text-xs"
                          title="Clinched Playoff Spot"
                        >
                          CLINCHED
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-200">{team.points} pts</div>
                    <div className="text-sm text-blue-300">
                      {team.wins}-{team.losses}-{team.otl}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Western Conference Playoff Teams */}
      <div className="animate-fade-in">
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-200">
              <Shield className="h-6 w-6" />
              Western Warriors Playoff Teams
              <Badge variant="outline" className="bg-purple-500/20 border-purple-400/50 text-purple-200">
                Top 4
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {westernTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-200"
                      >
                        {index + 1}
                      </Badge>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1">
                          {index === 0 && <Crown className="h-4 w-4 text-yellow-400" />}
                          {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Award className="h-4 w-4 text-amber-600" />}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{team.name}</span>
                      {team.playoff_status === "clinched" && (
                        <Badge
                          variant="default"
                          className="bg-purple-600/20 border-purple-400/50 text-purple-200 text-xs"
                          title="Clinched Playoff Spot"
                        >
                          CLINCHED
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-200">{team.points} pts</div>
                    <div className="text-sm text-purple-300">
                      {team.wins}-{team.losses}-{team.otl}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Playoff Bracket Preview */}
      <div className="animate-fade-in">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-200">
              <Trophy className="h-6 w-6" />
              Playoff Bracket Preview
            </CardTitle>
            <CardDescription className="text-green-300/80">
              1v4, 2v3 format for each conference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eastern Conference Bracket */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-200 text-center">Eastern Elites</h4>
                <div className="space-y-2">
                  <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
                    <div className="text-sm text-blue-300">Quarterfinal 1</div>
                    <div className="font-semibold text-white">
                      {easternTeams[0]?.name || "TBD"} vs {easternTeams[3]?.name || "TBD"}
                    </div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
                    <div className="text-sm text-blue-300">Quarterfinal 2</div>
                    <div className="font-semibold text-white">
                      {easternTeams[1]?.name || "TBD"} vs {easternTeams[2]?.name || "TBD"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Western Conference Bracket */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-purple-200 text-center">Western Warriors</h4>
                <div className="space-y-2">
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                    <div className="text-sm text-purple-300">Quarterfinal 1</div>
                    <div className="font-semibold text-white">
                      {westernTeams[0]?.name || "TBD"} vs {westernTeams[3]?.name || "TBD"}
                    </div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                    <div className="text-sm text-purple-300">Quarterfinal 2</div>
                    <div className="font-semibold text-white">
                      {westernTeams[1]?.name || "TBD"} vs {westernTeams[2]?.name || "TBD"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StandingsStats({ standings }: { standings: TeamStanding[] }) {
  const totalTeams = standings.length
  const totalGames = standings.reduce((sum, team) => sum + team.wins + team.losses + team.otl, 0)
  const totalPoints = standings.reduce((sum, team) => sum + team.points, 0)
  const avgPoints = totalTeams > 0 ? Math.round(totalPoints / totalTeams) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">{totalTeams}</div>
        <div className="text-blue-300">Total Teams</div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">{totalGames}</div>
        <div className="text-green-300">Games Played</div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">{totalPoints}</div>
        <div className="text-purple-300">Total Points</div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">{avgPoints}</div>
        <div className="text-yellow-300">Avg Points</div>
      </div>
    </div>
  )
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { seasons, currentSeasonId } = await getSeasonsData()
  const selectedSeasonId = searchParams.season ? parseInt(searchParams.season) : currentSeasonId
  const standings = await getStandingsData(selectedSeasonId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              League Standings
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Current season rankings and playoff picture
            </p>
          </div>

          {/* Season Selector */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {seasons.map((season) => (
                    <a
                      key={season.id}
                      href={`/standings?season=${season.id}`}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        selectedSeasonId === season.id
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white"
                          : "bg-white/10 border border-white/20 text-purple-200 hover:bg-white/20"
                      }`}
                    >
                      {season.name}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Standings Statistics */}
          <StandingsStats standings={standings} />

          {/* Main Content Tabs */}
          <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Tabs defaultValue="standings" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger 
                  value="standings" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-white"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Overall
                </TabsTrigger>
                <TabsTrigger 
                  value="eastern" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Eastern
                </TabsTrigger>
                <TabsTrigger 
                  value="western" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Western
                </TabsTrigger>
                <TabsTrigger 
                  value="playoffs" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Playoffs
                </TabsTrigger>
                <TabsTrigger 
                  value="bracket" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Bracket
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standings" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl bg-white/10" />}>
                      <TeamStandings teams={standings} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="eastern" className="mt-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-blue-200 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Eastern Elites Conference
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl bg-white/10" />}>
                      <TeamStandings teams={standings.filter(team => team.conference === CONFERENCES.EASTERN_ELITES)} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="western" className="mt-6">
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20">
                  <CardHeader>
                    <CardTitle className="text-purple-200 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Western Warriors Conference
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl bg-white/10" />}>
                      <TeamStandings teams={standings.filter(team => team.conference === CONFERENCES.WESTERN_WARRIORS)} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="playoffs" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <PlayoffPicture standings={standings} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bracket" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl bg-white/10" />}>
                      <PlayoffBracket seasonId={selectedSeasonId} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
