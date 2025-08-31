"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users, Search, TrendingUp, Target, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"
import { getAllTeamStats, getCurrentSeasonId } from "@/lib/team-utils"

// Maximum roster size constant
const MAX_ROSTER_SIZE = 15

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Modern Header Section */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-primary to-primary/60 rounded-2xl shadow-xl"
            >
              <Trophy className="h-8 w-8 text-white" />
              <h1 className="text-4xl font-bold text-white">SCS Teams</h1>
            </motion.div>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Discover all teams competing in the Secret Chel Society. Each franchise brings unique talent and strategy to the league.
            </p>
          </div>

          {/* Modern Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row justify-center items-center gap-4"
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-md focus:bg-white/15 transition-all duration-300"
              />
            </div>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white px-4 py-2">
              {filteredTeams.length} Teams Found
            </Badge>
          </motion.div>

          {/* Teams Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Skeleton className="h-80 w-full rounded-2xl bg-white/10" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team, index) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:bg-white/15">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-6">
                          {/* Team Logo */}
                          <motion.div 
                            className="relative h-32 w-32 mb-4"
                            whileHover={{ rotate: 5 }}
                            transition={{ duration: 0.3 }}
                          >
                            {team.logo_url ? (
                              <div className="w-full h-full rounded-2xl overflow-hidden bg-white/10 border border-white/20 shadow-lg">
                                <Image
                                  src={team.logo_url || "/placeholder.svg"}
                                  alt={team.name}
                                  fill
                                  className="object-contain p-2"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg">
                                <TeamLogo teamName={team.name} size="xl" />
                              </div>
                            )}
                          </motion.div>

                          {/* Team Name */}
                          <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                              {team.name}
                            </h2>
                            <div className="text-lg text-white/70 font-medium">
                              Record: {team.wins}-{team.losses}-{team.otl}
                            </div>
                          </div>

                          {/* Team Awards */}
                          {team.awards && team.awards.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2">
                              {team.awards.slice(0, 3).map((award: any) => (
                                <Badge
                                  key={award.id}
                                  variant="outline"
                                  className={`flex items-center gap-1 backdrop-blur-md ${
                                    award.award_type === "SCS Cup"
                                      ? "bg-yellow-500/20 border-yellow-400 text-yellow-300"
                                      : "bg-blue-500/20 border-blue-400 text-blue-300"
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
                                <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                                  +{team.awards.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Team Stats Grid */}
                          <div className="grid grid-cols-3 gap-4 w-full">
                            <motion.div 
                              className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="text-2xl font-bold text-blue-300">{team.points}</div>
                              <div className="text-xs text-blue-200/80">PTS</div>
                            </motion.div>
                            
                            <motion.div 
                              className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="text-lg font-bold text-green-300">${(team.total_salary / 1000000).toFixed(1)}M</div>
                              <div className="text-xs text-green-200/80">SALARY</div>
                              <div className="text-xs text-green-200/80 flex items-center justify-center mt-1">
                                <Users className="h-3 w-3 mr-1" />
                                <span>{team.player_count}/{MAX_ROSTER_SIZE}</span>
                              </div>
                            </motion.div>
                            
                            <motion.div 
                              className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="text-lg font-bold text-purple-300">${(team.cap_space / 1000000).toFixed(1)}M</div>
                              <div className="text-xs text-purple-200/80">CAP SPACE</div>
                            </motion.div>
                          </div>

                          {/* View Details Button */}
                          <motion.div
                            className="w-full pt-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl p-3 text-center">
                              <span className="text-primary-200 font-medium">View Team Details</span>
                            </div>
                          </motion.div>
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
                  <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
                    <Search className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white/80 text-lg">No teams found matching your search.</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
