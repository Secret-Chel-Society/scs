import React, { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import TeamStandings from "@/components/team-standings"
import { PlayoffBracket } from "@/components/standings/playoff-bracket"
import { calculateStandings, getCurrentSeasonId, getSeasons } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"
import { motion } from "framer-motion"
import { Trophy, Target, TrendingUp, Star, Award, Medal, Crown, Zap } from "lucide-react"
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
      {/* Playoff Teams */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-200">
              <Trophy className="h-6 w-6" />
              Playoff Teams
              <Badge variant="outline" className="bg-green-500/20 border-green-400/50 text-green-200">
                Top 8
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {playoffTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 hover:border-green-400/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-200"
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
                          className="bg-green-600/20 border-green-400/50 text-green-200 text-xs"
                          title="Clinched Playoff Spot"
                        >
                          CLINCHED
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold text-green-200">{team.points} PTS</span>
                    <span className="text-green-300">
                      {team.wins}-{team.losses}-{team.otl}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bubble Teams */}
      {bubbleTeams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-200">
                <Target className="h-6 w-6" />
                Playoff Bubble
                <Badge variant="outline" className="bg-yellow-500/20 border-yellow-400/50 text-yellow-200">
                  In the Hunt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {bubbleTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/50 text-yellow-200"
                      >
                        {index + 9}
                      </Badge>
                      <span className="font-semibold text-white">{team.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-yellow-200">{team.points} PTS</span>
                      <span className="text-yellow-300">
                        {team.wins}-{team.losses}-{team.otl}
                      </span>
                      <span className="text-yellow-400">
                        {playoffTeams[7] ? `${playoffTeams[7].points - team.points} back` : ""}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

function StandingsStats({ standings }: { standings: TeamStanding[] }) {
  const totalTeams = standings.length
  const totalGames = standings.reduce((sum, team) => sum + team.wins + team.losses + team.otl, 0)
  const totalPoints = standings.reduce((sum, team) => sum + team.points, 0)
  const avgPoints = totalTeams > 0 ? Math.round(totalPoints / totalTeams) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
    >
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center">
        <div className="text-3xl font-bold text-blue-200 mb-2">{totalTeams}</div>
        <div className="text-blue-300">Total Teams</div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center">
        <div className="text-3xl font-bold text-green-200 mb-2">{totalGames}</div>
        <div className="text-green-300">Games Played</div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center">
        <div className="text-3xl font-bold text-purple-200 mb-2">{totalPoints}</div>
        <div className="text-purple-300">Total Points</div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center">
        <div className="text-3xl font-bold text-yellow-200 mb-2">{avgPoints}</div>
        <div className="text-yellow-300">Avg Points</div>
      </div>
    </motion.div>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              League Standings
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Current season rankings and playoff picture
            </p>
          </motion.div>

          {/* Season Selector */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.div>

          {/* Standings Statistics */}
          <StandingsStats standings={standings} />

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Tabs defaultValue="standings" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger 
                  value="standings" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-white"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Standings
                </TabsTrigger>
                <TabsTrigger 
                  value="playoffs" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Playoff Picture
                </TabsTrigger>
                <TabsTrigger 
                  value="bracket" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Playoff Bracket
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standings" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl bg-white/10" />}>
                      <TeamStandings standings={standings} />
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
                      <PlayoffBracket standings={standings} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
