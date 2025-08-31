"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users, Search, Star, TrendingUp, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"
import { getAllTeamStats, getCurrentSeasonId } from "@/lib/team-utils"

// Maximum roster size constant
const MAX_ROSTER_SIZE = 15

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${
            i % 4 === 0 ? 'bg-gradient-to-r from-blue-500/40 to-cyan-500/40' :
            i % 4 === 1 ? 'bg-gradient-to-r from-red-500/40 to-pink-500/40' :
            i % 4 === 2 ? 'bg-gradient-to-r from-green-500/40 to-emerald-500/40' :
            'bg-gradient-to-r from-purple-500/40 to-violet-500/40'
          }`}
          style={{
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
          }}
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
          }}
          animate={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
          }}
          transition={{
            duration: Math.random() * 25 + 15,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  )
}

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <FloatingParticles />
      
      {/* Hockey-themed animated overlay elements */}
      <motion.div
        className="absolute top-20 right-10 w-20 h-20 border-2 border-primary/30 rounded-full flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <Trophy className="h-8 w-8 text-primary/50" />
      </motion.div>
      <motion.div
        className="absolute bottom-20 left-10 w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <Shield className="h-8 w-8 text-primary/50" />
      </motion.div>
      <motion.div
        className="absolute top-1/2 left-20 w-12 h-12 bg-gradient-to-r from-blue-500/20 to-red-500/20 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <motion.h1 
                className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                SCS Teams
              </motion.h1>
              <motion.p 
                className="text-slate-300 text-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                All teams competing in the Secret Chel Society
              </motion.p>
            </div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm pl-10 bg-background/30 backdrop-blur-sm border-primary/20 text-foreground placeholder:text-slate-400"
              />
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Skeleton className="h-64 w-full rounded-lg bg-background/30" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/teams/${team.id}`}>
                    <motion.div 
                      whileHover={{ y: -8, scale: 1.02 }} 
                      transition={{ type: "spring", stiffness: 300 }}
                      className="group"
                    >
                      <Card className="overflow-hidden h-full bg-gradient-to-br from-slate-800/90 via-purple-900/20 to-slate-800/90 border-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 shadow-2xl hover:shadow-3xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                        <CardContent className="relative p-6">
                          <div className="flex flex-col items-center">
                            <motion.div 
                              className="relative h-32 w-32 mb-4"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                            >
                              {team.logo_url ? (
                                <Image
                                  src={team.logo_url || "/placeholder.svg"}
                                  alt={team.name}
                                  fill
                                  className="object-contain"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              ) : (
                                <TeamLogo teamName={team.name} size="xl" />
                              )}
                            </motion.div>
                            
                            <h2 className="text-xl font-bold text-center mb-2 text-white group-hover:text-blue-300 transition-colors">
                              {team.name}
                            </h2>
                            
                            <div className="text-sm text-slate-300 text-center mb-4">
                              Record: <span className="font-semibold text-green-400">{team.wins}</span>-
                              <span className="font-semibold text-red-400">{team.losses}</span>-
                              <span className="font-semibold text-yellow-400">{team.otl}</span>
                            </div>

                            {/* Team Awards */}
                            {team.awards && team.awards.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-2 mb-4">
                                {team.awards.slice(0, 3).map((award: any) => (
                                  <motion.div
                                    key={award.id}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Badge
                                      variant="outline"
                                      className={`flex items-center gap-1 ${
                                        award.award_type === "SCS Cup"
                                          ? "border-yellow-500 text-yellow-500 bg-yellow-500/10"
                                          : "border-blue-500 text-blue-500 bg-blue-500/10"
                                      }`}
                                    >
                                      {award.award_type === "SCS Cup" ? (
                                        <Trophy className="h-3 w-3" />
                                      ) : (
                                        <Award className="h-3 w-3" />
                                      )}
                                      {award.award_type === "SCS Cup" ? "Cup" : "Trophy"} {award.year}
                                    </Badge>
                                  </motion.div>
                                ))}
                                {team.awards.length > 3 && (
                                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400">
                                    +{team.awards.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 w-full text-center">
                              <motion.div 
                                className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-3 border border-blue-500/30"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="text-lg font-bold text-blue-300">{team.points}</div>
                                <div className="text-xs text-slate-300">PTS</div>
                              </motion.div>
                              
                              <motion.div 
                                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-green-500/30"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="text-lg font-bold text-green-300">${(team.total_salary / 1000000).toFixed(1)}M</div>
                                <div className="text-xs text-slate-300">SALARY</div>
                                <div className="text-xs text-slate-300 flex items-center justify-center mt-1">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>
                                    {team.player_count}/{MAX_ROSTER_SIZE} Players
                                  </span>
                                </div>
                              </motion.div>
                              
                              <motion.div 
                                className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-lg p-3 border border-purple-500/30"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="text-lg font-bold text-purple-300">${(team.cap_space / 1000000).toFixed(1)}M</div>
                                <div className="text-xs text-slate-300">CAP SPACE</div>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
              
              {filteredTeams.length === 0 && (
                <motion.div 
                  className="col-span-full text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/20 rounded-lg p-8 border border-primary/20">
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-300 text-lg">No teams found matching your search.</p>
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
