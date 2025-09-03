"use client"

import { Suspense, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TeamStandings from "@/components/team-standings"
import { calculateStandings, getCurrentSeasonId, getSeasons } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"
import { motion } from "framer-motion"
import { Trophy, Target, TrendingUp, Award, Medal, Star, Zap, Users, TrendingDown, ArrowUp, ArrowDown, Minus } from "lucide-react"

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="hockey-card hockey-card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Playoff Teams
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Top 8 Teams - Clinched Spots
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {playoffTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border border-assist-green-200 dark:border-assist-green-700 hover:shadow-lg hover:shadow-assist-green-500/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Badge className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg">
                      {index + 1}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        {team.name}
                      </span>
                      {team.playoff_status === "clinched" && (
                        <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                          <Medal className="h-3 w-3 mr-1" />
                          CLINCHED
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                        {team.points}
                      </div>
                      <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide">
                        Points
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300">
                        {team.wins}-{team.losses}-{team.otl}
                      </div>
                      <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide">
                        Record
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {bubbleTeams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="hockey-card hockey-card-hover">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    Bubble Teams
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Fighting for Playoff Spots
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {bubbleTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 border border-goal-red-200 dark:border-goal-red-700 hover:shadow-lg hover:shadow-goal-red-500/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-lg">
                        {playoffTeams.length + index + 1}
                      </Badge>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                          {team.name}
                        </span>
                        {team.playoff_status === "eliminated" && (
                          <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            ELIMINATED
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                          {team.points}
                        </div>
                        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide">
                          Points
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300">
                          {team.wins}-{team.losses}-{team.otl}
                        </div>
                        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 uppercase tracking-wide">
                          Record
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-goal-red-600 dark:text-goal-red-400">
                          {playoffTeams[playoffTeams.length - 1].points - team.points}
                        </div>
                        <div className="text-xs text-goal-red-600 dark:text-goal-red-400 uppercase tracking-wide">
                          Pts Back
                        </div>
                      </div>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="hockey-card hockey-card-hover h-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  {conference1Name}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  {conference1Teams.length} teams
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={conference1Teams} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="hockey-card hockey-card-hover h-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  {conference2Name}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  {conference2Teams.length} teams
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={conference2Teams} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function StandingsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  )
}

async function StandingsContent({ seasonId }: { seasonId: number }) {
  const standings = await getStandingsData(seasonId)

  if (!standings || standings.length === 0) {
    return (
      <Card className="hockey-card">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Target className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-2">
              No Standings Available
            </h3>
            <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
              No team data found for this season.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="overall" className="space-y-8">
      <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 p-1 rounded-xl border border-ice-blue-200/50 dark:border-rink-blue-700/50">
        <TabsTrigger 
          value="overall" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Overall Standings
        </TabsTrigger>
        <TabsTrigger 
          value="conference" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
        >
          <Users className="h-4 w-4 mr-2" />
          Conference
        </TabsTrigger>
        <TabsTrigger 
          value="playoffs" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
        >
          <Trophy className="h-4 w-4 mr-2" />
          Playoff Picture
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="hockey-card hockey-card-hover">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    League Standings
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Complete standings for all teams in the league
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-xs px-2 py-1 rounded-full">
                    X
                  </Badge>
                  <span className="text-hockey-silver-600 dark:text-hockey-silver-400">Clinched Playoff Spot</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-xs px-2 py-1 rounded-full">
                    E
                  </Badge>
                  <span className="text-hockey-silver-600 dark:text-hockey-silver-400">Eliminated from Playoffs</span>
                </div>
              </div>
              <TeamStandings teams={standings} />
            </CardContent>
          </Card>
        </motion.div>
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

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { seasons, currentSeasonId } = await getSeasonsData()
  const selectedSeasonId = searchParams.season ? Number.parseInt(searchParams.season) : currentSeasonId

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="hockey-title mb-6">
              League Standings
            </h1>
            <p className="hockey-subtitle mb-8">
              Track team performance, conference rankings, and playoff races
            </p>
            
            {/* Season Selector */}
            <div className="max-w-md mx-auto">
              <Select value={selectedSeasonId.toString()} onValueChange={(value) => window.location.href = `/standings?season=${value}`}>
                <SelectTrigger className="hockey-search">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Suspense fallback={<StandingsLoadingSkeleton />}>
            <StandingsContent seasonId={selectedSeasonId} />
          </Suspense>
        </motion.div>
      </div>
    </div>
  )
}
