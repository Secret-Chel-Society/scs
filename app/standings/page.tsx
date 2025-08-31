"use client"

import React, { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TeamStandings from "@/components/team-standings"
import { calculateStandings, getCurrentSeasonId, getSeasons } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"
import Link from "next/link"
import { motion } from "framer-motion"
import { Trophy, Target, TrendingUp, Award, Calendar, Filter } from "lucide-react"

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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span>Playoff Teams</span>
              <Badge variant="outline" className="bg-green-500/20 border-green-400 text-green-300">
                Top 8 Teams
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
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white/20 border-white/30 text-white"
                    >
                      {index + 1}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{team.name}</span>
                      {team.playoff_status === "clinched" && (
                        <Badge
                          variant="default"
                          className="bg-green-600 text-white text-xs"
                          title="Clinched Playoff Spot"
                        >
                          X
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold text-green-300">{team.points} PTS</span>
                    <span className="text-white/70">
                      {team.wins}-{team.losses}-{team.otl}
                    </span>
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
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span>Bubble Teams</span>
                <Badge variant="outline" className="bg-orange-500/20 border-orange-400 text-orange-300">
                  Fighting for Playoff Spots
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
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-400/30 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white/20 border-white/30 text-white"
                      >
                        {playoffTeams.length + index + 1}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{team.name}</span>
                        {team.playoff_status === "eliminated" && (
                          <Badge
                            variant="destructive"
                            className="bg-red-600 text-white text-xs"
                            title="Eliminated from Playoffs"
                          >
                            E
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-orange-300">{team.points} PTS</span>
                      <span className="text-white/70">
                        {team.wins}-{team.losses}-{team.otl}
                      </span>
                      <span className="text-xs text-orange-300 font-medium">
                        {playoffTeams[playoffTeams.length - 1].points - team.points} pts back
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
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl h-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              {conference1Name}
            </CardTitle>
            <CardDescription className="text-white/70">{conference1Teams.length} teams</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={conference1Teams} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl h-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              {conference2Name}
            </CardTitle>
            <CardDescription className="text-white/70">{conference2Teams.length} teams</CardDescription>
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-white/10" />
        <Skeleton className="h-4 w-96 bg-white/10" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full bg-white/10" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </div>
    </div>
  )
}

async function StandingsContent({ seasonId }: { seasonId: number }) {
  const standings = await getStandingsData(seasonId)

  if (!standings || standings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl inline-block mb-4">
                <Trophy className="h-12 w-12 text-primary-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Standings Available</h3>
              <p className="text-white/70">No team data found for this season.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <Tabs defaultValue="overall" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md border border-white/20">
        <TabsTrigger 
          value="overall"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
        >
          Overall Standings
        </TabsTrigger>
        <TabsTrigger 
          value="conference"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
        >
          Conference
        </TabsTrigger>
        <TabsTrigger 
          value="playoffs"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
        >
          Playoff Picture
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-primary to-primary/60 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                League Standings
              </CardTitle>
              <CardDescription className="text-white/70">
                Complete standings for all teams in the league
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Badge variant="default" className="bg-green-600 text-white text-xs">
                      X
                    </Badge>
                    <span className="text-white/70">Clinched Playoff Spot</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="destructive" className="bg-red-600 text-white text-xs">
                      E
                    </Badge>
                    <span className="text-white/70">Eliminated from Playoffs</span>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamStandings teams={standings} />
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="conference" className="space-y-6">
        <ConferenceStandings standings={standings} />
      </TabsContent>

      <TabsContent value="playoffs" className="space-y-6">
        <PlayoffPicture standings={standings} />
      </TabsContent>
    </Tabs>
  )
}

function SeasonFilter({ seasons, currentSeasonId, selectedSeasonId }: { 
  seasons: any[], 
  currentSeasonId: number, 
  selectedSeasonId: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center gap-4 mb-6"
    >
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg">
          <Calendar className="h-4 w-4 text-primary-300" />
        </div>
        <span className="text-white font-medium">Season:</span>
        <Select defaultValue={selectedSeasonId.toString()}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white backdrop-blur-md">
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/20">
            {seasons.map((season) => (
              <SelectItem key={season.id} value={season.id.toString()}>
                <Link href={`/standings?season=${season.id}`} className="w-full">
                  {season.name || `Season ${season.number || season.id}`}
                </Link>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedSeasonId !== currentSeasonId && (
        <Badge variant="outline" className="bg-yellow-500/20 border-yellow-400 text-yellow-300 text-xs">
          Historical Data
        </Badge>
      )}
    </motion.div>
  )
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { seasons, currentSeasonId } = await getSeasonsData()
  const selectedSeasonId = searchParams.season ? Number.parseInt(searchParams.season) : currentSeasonId

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Modern Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-primary to-primary/60 rounded-2xl shadow-xl">
              <Trophy className="h-8 w-8 text-white" />
              <h1 className="text-4xl font-bold text-white">League Standings</h1>
            </div>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Current team standings, conference rankings, and playoff picture for the Secret Chel Society
            </p>
          </motion.div>

          <SeasonFilter 
            seasons={seasons} 
            currentSeasonId={currentSeasonId} 
            selectedSeasonId={selectedSeasonId} 
          />

          <Suspense fallback={<StandingsLoadingSkeleton />}>
            <StandingsContent seasonId={selectedSeasonId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
