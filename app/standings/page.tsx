"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Star, 
  Award, 
  Medal, 
  Crown, 
  Zap, 
  MapPin, 
  Shield,
  Users
} from "lucide-react"
import { TeamLogo } from "@/components/team-logo"

interface TeamStanding {
  id: string
  name: string
  logo_url: string | null
  wins: number
  losses: number
  otl: number
  games_played: number
  points: number
  goals_for: number
  goals_against: number
  goal_differential: number
  conference?: string
  playoff_status?: string
}

export default function StandingsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true)
        setError(null)

        // Get all teams (like matches page does)
        const { data: teams, error: teamsError } = await supabase
          .from("teams")
          .select("id, name, logo_url, conference")
          .order("name")

        if (teamsError) throw teamsError

        // Get completed matches
        const { data: matches, error: matchesError } = await supabase
          .from("matches")
          .select("id, home_team_id, away_team_id, home_score, away_score, status")
          .eq("status", "Completed")
          .not("home_score", "is", null)
          .not("away_score", "is", null)

        if (matchesError) throw matchesError

        // Calculate standings from matches
        const teamStats: { [key: string]: TeamStanding } = {}

        // Initialize all teams with zero stats
        teams?.forEach(team => {
          teamStats[team.id] = {
            id: team.id,
            name: team.name,
            logo_url: team.logo_url,
            wins: 0,
            losses: 0,
            otl: 0,
            games_played: 0,
            points: 0,
            goals_for: 0,
            goals_against: 0,
            goal_differential: 0,
            conference: team.conference || "Unassigned",
            playoff_status: "active"
          }
        })

        // Calculate stats from matches
        matches?.forEach(match => {
          const homeTeam = teamStats[match.home_team_id]
          const awayTeam = teamStats[match.away_team_id]
          
          if (homeTeam && awayTeam) {
            const homeScore = parseInt(match.home_score) || 0
            const awayScore = parseInt(match.away_score) || 0

            // Update games played
            homeTeam.games_played++
            awayTeam.games_played++

            // Update goals
            homeTeam.goals_for += homeScore
            homeTeam.goals_against += awayScore
            awayTeam.goals_for += awayScore
            awayTeam.goals_against += homeScore

            // Update wins/losses/points
            if (homeScore > awayScore) {
              homeTeam.wins++
              awayTeam.losses++
              homeTeam.points += 2
            } else if (awayScore > homeScore) {
              awayTeam.wins++
              homeTeam.losses++
              awayTeam.points += 2
            } else {
              // Tie - both teams get 1 point
              homeTeam.otl++
              awayTeam.otl++
              homeTeam.points += 1
              awayTeam.points += 1
            }
          }
        })

        // Calculate goal differentials
        Object.values(teamStats).forEach(team => {
          team.goal_differential = team.goals_for - team.goals_against
        })

        // Sort teams by points, then wins, then goal differential
        const sortedStandings = Object.values(teamStats).sort((a, b) => {
          if (a.points !== b.points) return b.points - a.points
          if (a.wins !== b.wins) return b.wins - a.wins
          return b.goal_differential - a.goal_differential
        })

        setStandings(sortedStandings)
      } catch (error: any) {
        console.error("Error fetching standings:", error)
        setError(error.message || "Failed to load standings")
        toast({
          title: "Error loading standings",
          description: error.message || "Failed to load standings data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [supabase, toast])

  // Calculate statistics
  const totalTeams = standings.length
  const totalGames = standings.reduce((sum, team) => sum + team.games_played, 0)
  const totalPoints = standings.reduce((sum, team) => sum + team.points, 0)
  const avgPoints = totalTeams > 0 ? Math.round(totalPoints / totalTeams) : 0

  // Get teams by conference
  const easternTeams = standings.filter(team => team.conference === "Eastern Elites")
  const westernTeams = standings.filter(team => team.conference === "Western Warriors")
  const unassignedTeams = standings.filter(team => !team.conference || team.conference === "Unassigned")

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Standings</h2>
              <p className="text-red-300 mb-4">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

          {/* Standings Statistics */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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

          {/* Main Content Tabs */}
          <motion.div 
            className="animate-slide-up"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs defaultValue="overall" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger 
                  value="overall" 
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
                  value="unassigned" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500/20 data-[state=active]:to-slate-500/20 data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Unassigned
                </TabsTrigger>
                <TabsTrigger 
                  value="playoffs" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Playoffs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overall" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
                    ) : (
                      <div className="space-y-4">
                        {standings.map((team, index) => (
                          <motion.div
                            key={team.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300"
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
                                <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="sm" />
                                <span className="font-semibold text-white">{team.name}</span>
                                {team.conference && team.conference !== "Unassigned" && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      team.conference === "Eastern Elites"
                                        ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                                        : "bg-purple-500/20 border-purple-400/50 text-purple-200"
                                    }`}
                                  >
                                    {team.conference}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">{team.points} pts</div>
                              <div className="text-sm text-purple-300">
                                {team.wins}-{team.losses}-{team.otl}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
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
                    {loading ? (
                      <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
                    ) : (
                      <div className="space-y-4">
                        {easternTeams.map((team, index) => (
                          <motion.div
                            key={team.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/20 hover:border-blue-400/50 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Badge
                                  variant="outline"
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-200"
                                >
                                  {index + 1}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="sm" />
                                <span className="font-semibold text-white">{team.name}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-200">{team.points} pts</div>
                              <div className="text-sm text-blue-300">
                                {team.wins}-{team.losses}-{team.otl}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
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
                    {loading ? (
                      <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
                    ) : (
                      <div className="space-y-4">
                        {westernTeams.map((team, index) => (
                          <motion.div
                            key={team.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 hover:border-purple-400/50 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Badge
                                  variant="outline"
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-200"
                                >
                                  {index + 1}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="sm" />
                                <span className="font-semibold text-white">{team.name}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-200">{team.points} pts</div>
                              <div className="text-sm text-purple-300">
                                {team.wins}-{team.losses}-{team.otl}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="unassigned" className="mt-6">
                <Card className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-sm border border-gray-400/20">
                  <CardHeader>
                    <CardTitle className="text-gray-200 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Unassigned Teams
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
                    ) : (
                      <div className="space-y-4">
                        {unassignedTeams.map((team, index) => (
                          <motion.div
                            key={team.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-500/10 to-slate-500/10 backdrop-blur-sm border border-gray-400/20 hover:border-gray-400/50 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Badge
                                  variant="outline"
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-gray-500/20 to-slate-500/20 border-gray-400/50 text-gray-200"
                                >
                                  {index + 1}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="sm" />
                                <span className="font-semibold text-white">{team.name}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-200">{team.points} pts</div>
                              <div className="text-sm text-gray-300">
                                {team.wins}-{team.losses}-{team.otl}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="playoffs" className="mt-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20">
                  <CardHeader>
                    <CardTitle className="text-green-200 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Playoff Picture
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
                    ) : (
                      <div className="space-y-8">
                        {/* Eastern Conference Playoff Teams */}
                        <div>
                          <h3 className="text-lg font-semibold text-blue-200 mb-4 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Eastern Elites - Top 4
                          </h3>
                          <div className="space-y-2">
                            {easternTeams.slice(0, 4).map((team, index) => (
                              <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/20">
                                <div className="flex items-center gap-3">
                                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500/20 text-blue-200">
                                    {index + 1}
                                  </Badge>
                                  <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="xs" />
                                  <span className="text-white">{team.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-blue-200">{team.points} pts</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Western Conference Playoff Teams */}
                        <div>
                          <h3 className="text-lg font-semibold text-purple-200 mb-4 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Western Warriors - Top 4
                          </h3>
                          <div className="space-y-2">
                            {westernTeams.slice(0, 4).map((team, index) => (
                              <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20">
                                <div className="flex items-center gap-3">
                                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-purple-500/20 text-purple-200">
                                    {index + 1}
                                  </Badge>
                                  <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="xs" />
                                  <span className="text-white">{team.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-purple-200">{team.points} pts</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
