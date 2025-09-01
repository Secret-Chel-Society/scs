"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trophy, 
  Award, 
  Users, 
  Search, 
  Star, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Shield,
  Crown,
  Medal,
  Zap,
  Building2,
  Users2,
  BarChart3
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"

// Maximum roster size constant
const MAX_ROSTER_SIZE = 15

export default function TeamsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true)

        // Get all teams with basic info
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (teamsError) {
          throw teamsError
        }

        if (!teamsData || teamsData.length === 0) {
          setTeams([])
          return
        }

        // Get player counts for each team
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("team_id, salary")
          .not("team_id", "is", null)

        if (playerError) {
          console.error("Error fetching player data:", playerError)
        }

        // Calculate player counts and salaries by team
        const playerCountByTeam: Record<string, number> = {}
        const totalSalaryByTeam: Record<string, number> = {}

        playerData?.forEach((player) => {
          if (player.team_id) {
            playerCountByTeam[player.team_id] = (playerCountByTeam[player.team_id] || 0) + 1
            totalSalaryByTeam[player.team_id] = (totalSalaryByTeam[player.team_id] || 0) + (player.salary || 0)
          }
        })

        // Get team awards
        const { data: awardsData, error: awardsError } = await supabase
          .from("team_awards")
          .select("id, team_id, award_type, season_number, year")
          .order("year", { ascending: false })

        if (awardsError) {
          console.error("Error fetching team awards:", awardsError)
        }

        // Group awards by team
        const awardsByTeam: Record<string, any[]> = {}
        awardsData?.forEach((award) => {
          if (!awardsByTeam[award.team_id]) {
            awardsByTeam[award.team_id] = []
          }
          awardsByTeam[award.team_id].push(award)
        })

        // Combine all data
        const teamsWithData = teamsData.map((team) => ({
          ...team,
          player_count: playerCountByTeam[team.id] || 0,
          total_salary: totalSalaryByTeam[team.id] || 0,
          cap_space: 30000000 - (totalSalaryByTeam[team.id] || 0),
          awards: awardsByTeam[team.id] || [],
        }))

        setTeams(teamsWithData)
      } catch (error: any) {
        console.error("Error loading teams:", error)
        toast({
          title: "Error loading teams",
          description: error.message || "Failed to load teams data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [supabase, toast])

  // Filter teams based on search query
  const filteredTeams = teams.filter((team) => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate league statistics
  const getLeagueStats = () => {
    const totalTeams = teams.length
    const totalPlayers = teams.reduce((sum, team) => sum + (team.player_count || 0), 0)
    const totalSalary = teams.reduce((sum, team) => sum + (team.total_salary || 0), 0)
    const avgTeamSalary = totalTeams > 0 ? totalSalary / totalTeams : 0

    return { totalTeams, totalPlayers, totalSalary, avgTeamSalary }
  }

  const leagueStats = getLeagueStats()

  // Get team rank based on points
  const getTeamRank = (team: any) => {
    const sortedTeams = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0))
    return sortedTeams.findIndex(t => t.id === team.id) + 1
  }

  // Get rank badge color
  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-500/30 to-amber-500/30 border-yellow-400/50"
    if (rank === 2) return "from-gray-400/30 to-slate-400/30 border-gray-400/50"
    if (rank === 3) return "from-orange-600/30 to-red-600/30 border-orange-400/50"
    return "from-slate-700/30 to-slate-600/30 border-slate-500/50"
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
            <div className="inline-flex items-center gap-3 mb-6 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
              <Building2 className="h-8 w-8 text-purple-300" />
              <span className="text-purple-300 font-medium">Secret Chel Society</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Team Directory
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Discover all teams competing in the league with detailed rosters, statistics, and achievements
            </p>
          </motion.div>

          {/* League Statistics Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="group relative overflow-hidden bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold text-blue-200 mb-2">{leagueStats.totalTeams}</div>
                <div className="text-blue-300 font-medium">Total Teams</div>
                <Building2 className="h-6 w-6 mx-auto mt-3 text-blue-400 opacity-60" />
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold text-green-200 mb-2">{leagueStats.totalPlayers}</div>
                <div className="text-green-300 font-medium">Total Players</div>
                <Users2 className="h-6 w-6 mx-auto mt-3 text-green-400 opacity-60" />
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold text-yellow-200 mb-2">${(leagueStats.avgTeamSalary / 1000000).toFixed(1)}M</div>
                <div className="text-yellow-300 font-medium">Avg Team Salary</div>
                <DollarSign className="h-6 w-6 mx-auto mt-3 text-yellow-400 opacity-60" />
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold text-purple-200 mb-2">{MAX_ROSTER_SIZE}</div>
                <div className="text-purple-300 font-medium">Max Roster Size</div>
                <Shield className="h-6 w-6 mx-auto mt-3 text-purple-400 opacity-60" />
              </div>
            </div>
          </motion.div>

          {/* Search Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <Input
                    placeholder="Search teams by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300 focus:bg-white/20 focus:border-purple-400/50 transition-all duration-200"
                  />
                </div>
                <div className="mt-3 text-sm text-purple-300">
                  Found {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Teams Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <AnimatePresence>
              {loading ? (
                // Loading skeletons
                [...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Skeleton className="h-80 w-full rounded-2xl bg-white/10" />
                  </motion.div>
                ))
              ) : filteredTeams.length > 0 ? (
                filteredTeams.map((team, index) => {
                  const teamRank = getTeamRank(team)
                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group"
                    >
                      <Link href={`/teams/${team.id}`}>
                        <Card className="overflow-hidden h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/25">
                          <CardContent className="p-6">
                            {/* Team Rank Badge */}
                            <div className="flex justify-between items-start mb-4">
                              <Badge className={`bg-gradient-to-r ${getRankColor(teamRank)} backdrop-blur-sm flex items-center gap-1`}>
                                {teamRank <= 3 && <Medal className="h-3 w-3" />}
                                #{teamRank}
                              </Badge>
                              <div className="text-sm text-purple-300 font-medium">
                                {team.points || 0} PTS
                              </div>
                            </div>

                            {/* Team Logo and Name */}
                            <div className="text-center mb-6">
                              <div className="relative h-32 w-32 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                {team.logo_url ? (
                                  <Image
                                    src={team.logo_url || "/placeholder.svg"}
                                    alt={team.name}
                                    fill
                                    className="object-contain drop-shadow-lg"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="h-32 w-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border-2 border-purple-400/30">
                                    <span className="text-purple-200 font-bold text-4xl">
                                      {team.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <h2 className="text-2xl font-bold text-white group-hover:text-purple-200 transition-colors mb-2">
                                {team.name}
                              </h2>
                              <div className="text-purple-300 text-sm font-medium mb-4">
                                Record: {team.wins || 0}-{team.losses || 0}-{team.otl || 0}
                              </div>
                            </div>

                            {/* Team Awards */}
                            {team.awards && team.awards.length > 0 && (
                              <div className="mb-6">
                                <div className="text-center text-purple-300 text-sm font-medium mb-3">🏆 Achievements</div>
                                <div className="flex flex-wrap justify-center gap-2">
                                  {team.awards.slice(0, 3).map((award: any) => (
                                    <Badge
                                      key={award.id}
                                      variant="outline"
                                      className={`flex items-center gap-1 ${
                                        award.award_type === "SCS Cup"
                                          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50 text-yellow-300"
                                          : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-300"
                                      }`}
                                    >
                                      {award.award_type === "SCS Cup" ? (
                                        <Trophy className="h-3 w-3" />
                                      ) : (
                                        <Award className="h-3 w-3" />
                                      )}
                                      {award.award_type === "SCS Cup" ? "Cup" : "Trophy"} {award.year}
                                    </Badge>
                                  ))}
                                  {team.awards.length > 3 && (
                                    <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300">
                                      +{team.awards.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Team Statistics */}
                            <div className="grid grid-cols-3 gap-4 w-full text-center">
                              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-3 border border-blue-400/20">
                                <div className="text-2xl font-bold text-blue-200">{team.points || 0}</div>
                                <div className="text-xs text-blue-300 font-medium">POINTS</div>
                              </div>
                              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-400/20">
                                <div className="text-lg font-bold text-green-200">${((team.total_salary || 0) / 1000000).toFixed(1)}M</div>
                                <div className="text-xs text-green-300 font-medium">SALARY</div>
                                <div className="text-xs text-green-400 flex items-center justify-center mt-1">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>
                                    {team.player_count || 0}/{MAX_ROSTER_SIZE}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-400/20">
                                <div className="text-lg font-bold text-purple-200">${((team.cap_space || 0) / 1000000).toFixed(1)}M</div>
                                <div className="text-xs text-purple-300 font-medium">CAP SPACE</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div 
                  className="col-span-full text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-12 w-12 text-purple-400" />
                  </div>
                  <div className="text-purple-300 text-xl font-medium mb-2">No teams found</div>
                  <div className="text-purple-400">Try adjusting your search query or check back later.</div>
                </motion.div>
              )}
            </AnimatePresence>
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
