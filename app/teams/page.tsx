"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users, Search, Star, TrendingUp, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"
import { getAllTeamStats, getCurrentSeasonId } from "@/lib/team-utils"

// Maximum roster size constant
const MAX_ROSTER_SIZE = 15

// Team color gradients for visual variety
const teamGradients = [
  "from-blue-500 via-purple-500 to-pink-500",
  "from-green-400 via-emerald-500 to-teal-500",
  "from-orange-400 via-red-500 to-pink-500",
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-yellow-400 via-orange-500 to-red-500",
  "from-cyan-500 via-blue-500 to-indigo-500",
  "from-pink-500 via-rose-500 to-red-500",
  "from-emerald-400 via-green-500 to-teal-500",
  "from-violet-500 via-purple-500 to-indigo-500",
  "from-amber-400 via-yellow-500 to-orange-500",
  "from-sky-400 via-blue-500 to-indigo-500",
  "from-lime-400 via-green-500 to-emerald-500",
]

export default function TeamsPage() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true)

        // Get current season ID
        const seasonId = await getCurrentSeasonId()

        // Get team stats
        const teamStats = await getAllTeamStats(seasonId)

        // Get team awards
        const response = await fetch("/api/teams/awards")
        const { awards } = await response.json()

        // Group awards by team
        const awardsByTeam: Record<string, any[]> = {}
        awards?.forEach((award: any) => {
          if (!awardsByTeam[award.team_id]) {
            awardsByTeam[award.team_id] = []
          }
          awardsByTeam[award.team_id].push(award)
        })

        // Combine team stats with awards
        const teamsWithAwards = teamStats.map((team) => ({
          ...team,
          awards: awardsByTeam[team.id] || [],
        }))

        setTeams(teamsWithAwards)
      } catch (error: any) {
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
  }, [toast])

  // Filter teams based on search query
  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
          <div className="text-center mb-12">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Secret Chel Society
            </motion.h1>
            <motion.p 
              className="text-xl text-purple-200 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Discover the elite teams competing for glory
            </motion.p>
            
            {/* Search Bar */}
            <motion.div 
              className="relative max-w-md mx-auto mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300/70 focus:bg-white/20 focus:border-purple-400 transition-all duration-300"
              />
            </motion.div>
          </div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-200 mb-2">{teams.length}</div>
              <div className="text-blue-300">Total Teams</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-200 mb-2">
                {teams.reduce((acc, team) => acc + team.player_count, 0)}
              </div>
              <div className="text-green-300">Active Players</div>
            </div>
            <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm border border-pink-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-pink-200 mb-2">
                {teams.reduce((acc, team) => acc + (team.awards?.length || 0), 0)}
              </div>
              <div className="text-pink-300">Total Awards</div>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Skeleton className="h-80 w-full rounded-2xl bg-white/10" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTeams.map((team, index) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <motion.div 
                    className="group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="overflow-hidden h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/25">
                      <CardContent className="p-6 relative">
                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${teamGradients[index % teamGradients.length]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                          {/* Team Logo */}
                          <div className="relative h-32 w-32 mb-6 group-hover:scale-110 transition-transform duration-300">
                            {team.logo_url ? (
                              <Image
                                src={team.logo_url || "/placeholder.svg"}
                                alt={team.name}
                                fill
                                className="object-contain drop-shadow-lg"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <TeamLogo teamName={team.name} size="xl" />
                            )}
                          </div>
                          
                          {/* Team Name */}
                          <h2 className="text-2xl font-bold text-center mb-3 text-white group-hover:text-purple-200 transition-colors">
                            {team.name}
                          </h2>
                          
                          {/* Record */}
                          <div className="text-sm text-purple-300 text-center mb-4 font-medium">
                            Record: {team.wins}-{team.losses}-{team.otl}
                          </div>

                          {/* Team Awards */}
                          {team.awards && team.awards.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                              {team.awards.slice(0, 3).map((award: any) => (
                                <Badge
                                  key={award.id}
                                  className={`flex items-center gap-1 bg-gradient-to-r ${
                                    award.award_type === "SCS Cup"
                                      ? "from-yellow-500/20 to-amber-500/20 border-yellow-400/50 text-yellow-200"
                                      : "from-blue-500/20 to-indigo-500/20 border-blue-400/50 text-blue-200"
                                  } backdrop-blur-sm`}
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
                                <Badge className="bg-purple-500/20 border-purple-400/50 text-purple-200 backdrop-blur-sm">
                                  +{team.awards.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-4 w-full text-center">
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-3">
                              <div className="text-lg font-bold text-blue-200 flex items-center justify-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {team.points}
                              </div>
                              <div className="text-xs text-blue-300">PTS</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-3">
                              <div className="text-lg font-bold text-green-200 flex items-center justify-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {(team.total_salary / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-green-300">SALARY</div>
                              <div className="text-xs text-green-300 flex items-center justify-center mt-1">
                                <Users className="h-3 w-3 mr-1" />
                                <span>
                                  {team.player_count}/{MAX_ROSTER_SIZE}
                                </span>
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-xl p-3">
                              <div className="text-lg font-bold text-purple-200 flex items-center justify-center gap-1">
                                <Star className="h-4 w-4" />
                                {(team.cap_space / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-purple-300">CAP SPACE</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
              {filteredTeams.length === 0 && (
                <motion.div 
                  className="col-span-full text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-purple-300 text-lg">No teams found matching your search.</div>
                </motion.div>
              )}
            </div>
          )}
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
