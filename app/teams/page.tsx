"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Users,
  GamepadIcon
} from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import Link from "next/link"

interface TeamStats {
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

interface Award {
  id: string
  name: string
  description: string
  team_id: string
  player_id?: string
  season_id: number
  created_at: string
}

export default function TeamsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [teams, setTeams] = useState<TeamStats[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeamsData() {
      try {
        setLoading(true)
        setError(null)

        // Get all teams (like matches page does)
        const { data: teamsData, error: teamsError } = await supabase
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

        // Get awards
        const { data: awardsData, error: awardsError } = await supabase
          .from("awards")
          .select("*")
          .order("created_at", { ascending: false })

        if (awardsError) throw awardsError

        // Calculate team stats from matches
        const teamStats: { [key: string]: TeamStats } = {}

        // Initialize all teams with zero stats
        teamsData?.forEach(team => {
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
        const sortedTeams = Object.values(teamStats).sort((a, b) => {
          if (a.points !== b.points) return b.points - a.points
          if (a.wins !== b.wins) return b.wins - a.wins
          return b.goal_differential - a.goal_differential
        })

        setTeams(sortedTeams)
        setAwards(awardsData || [])
      } catch (error: any) {
        console.error("Error fetching teams data:", error)
        setError(error.message || "Failed to load teams data")
        toast({
          title: "Error loading teams",
          description: error.message || "Failed to load teams data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeamsData()
  }, [supabase, toast])

  // Calculate statistics
  const totalTeams = teams.length
  const totalGames = teams.reduce((sum, team) => sum + team.games_played, 0)
  const totalPoints = teams.reduce((sum, team) => sum + team.points, 0)
  const avgPoints = totalTeams > 0 ? Math.round(totalPoints / totalTeams) : 0

  // Get teams by conference
  const easternTeams = teams.filter(team => team.conference === "Eastern Elites")
  const westernTeams = teams.filter(team => team.conference === "Western Warriors")
  const unassignedTeams = teams.filter(team => !team.conference || team.conference === "Unassigned")

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30">
            <CardContent className="p-8 text-center">
              <GamepadIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Teams</h2>
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
              League Teams
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              All teams, statistics, and achievements
            </p>
          </motion.div>

          {/* Team Statistics Overview */}
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
              <div className="text-3xl font-bold text-yellow-200 mb-2">{awards.length}</div>
              <div className="text-yellow-300">Awards Won</div>
            </div>
          </motion.div>

          {/* Teams Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {loading ? (
              // Loading skeletons
              [...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Skeleton className="h-64 w-full rounded-2xl bg-white/10" />
                </motion.div>
              ))
            ) : teams.length > 0 ? (
              teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Link href={`/teams/${team.id}`}>
                    <Card className="overflow-hidden h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/25">
                      <CardContent className="p-6">
                        {/* Team Logo and Name */}
                        <div className="text-center mb-6">
                          <div className="relative h-20 w-20 mx-auto mb-4">
                            <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="lg" />
                          </div>
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                            {team.name}
                          </h3>
                          {team.conference && team.conference !== "Unassigned" && (
                            <Badge
                              variant="outline"
                              className={`mt-2 text-xs ${
                                team.conference === "Eastern Elites"
                                  ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                                  : "bg-purple-500/20 border-purple-400/50 text-purple-200"
                              }`}
                            >
                              {team.conference}
                            </Badge>
                          )}
                        </div>

                        {/* Team Stats */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300">Points:</span>
                            <span className="text-white font-bold">{team.points}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300">Record:</span>
                            <span className="text-white font-bold">{team.wins}-{team.losses}-{team.otl}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300">Games:</span>
                            <span className="text-white font-bold">{team.games_played}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300">Goal Diff:</span>
                            <span className={`font-bold ${team.goal_differential >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {team.goal_differential >= 0 ? '+' : ''}{team.goal_differential}
                            </span>
                          </div>
                        </div>

                        {/* Team Awards */}
                        {awards.filter(award => award.team_id === team.id).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="text-sm text-purple-300 mb-2">Awards:</div>
                            <div className="space-y-1">
                              {awards
                                .filter(award => award.team_id === team.id)
                                .slice(0, 2)
                                .map(award => (
                                  <div key={award.id} className="text-xs text-white bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded px-2 py-1">
                                    {award.name}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="col-span-full text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-purple-300 text-lg mb-4">No teams found.</div>
                <div className="text-purple-400">Teams will appear here once they are added to the league.</div>
              </motion.div>
            )}
          </motion.div>

          {/* Conference Breakdown */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {/* Eastern Conference */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/20">
              <CardHeader>
                <CardTitle className="text-blue-200 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Eastern Elites
                  <Badge className="bg-blue-500/20 text-blue-200">{easternTeams.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {easternTeams.map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/20">
                      <div className="flex items-center gap-2">
                        <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="xs" />
                        <span className="text-white text-sm">{team.name}</span>
                      </div>
                      <span className="text-blue-200 text-sm font-bold">{team.points} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Western Conference */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20">
              <CardHeader>
                <CardTitle className="text-purple-200 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Western Warriors
                  <Badge className="bg-purple-500/20 text-purple-200">{westernTeams.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {westernTeams.map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20">
                      <div className="flex items-center gap-2">
                        <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="xs" />
                        <span className="text-white text-sm">{team.name}</span>
                      </div>
                      <span className="text-purple-200 text-sm font-bold">{team.points} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Unassigned Teams */}
            <Card className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-sm border border-gray-400/20">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Unassigned
                  <Badge className="bg-gray-500/20 text-gray-200">{unassignedTeams.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unassignedTeams.map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-400/20">
                      <div className="flex items-center gap-2">
                        <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="xs" />
                        <span className="text-white text-sm">{team.name}</span>
                      </div>
                      <span className="text-gray-200 text-sm font-bold">{team.points} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
