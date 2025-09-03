"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users, Search, Target, TrendingUp, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"
import { getAllTeamStats } from "@/lib/team-utils"

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
        let seasonId = 1 // Default fallback
        try {
          const response = await fetch("/api/seasons?current=true")
          if (response.ok) {
            const { currentSeason } = await response.json()
            seasonId = currentSeason
          }
        } catch (error) {
          console.error("Error getting current season:", error)
          // Use default season 1
        }

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-xl">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                SCS Teams
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Discover all teams competing in the Secret Chel Society. Each team brings unique talent, 
              strategy, and determination to the ice.
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mt-6" />
          </div>

          {/* Enhanced Search Section */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search teams by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm rounded-xl"
              />
            </div>
          </div>

          {/* Teams Count Display */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="text-white font-semibold">
                {loading ? "Loading..." : `${filteredTeams.length} Teams Found`}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Skeleton className="h-80 w-full rounded-2xl" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Link href={`/teams/${team.id}`}>
                  <Card className="overflow-hidden h-full hover:border-primary/50 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10 group-hover:shadow-2xl group-hover:shadow-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        {/* Enhanced Team Logo Section */}
                        <div className="relative mb-6">
                          <div className="relative h-36 w-36 mb-4 group-hover:scale-110 transition-transform duration-300">
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
                          </div>
                          {/* Glow effect on hover */}
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                        </div>

                        {/* Enhanced Team Name */}
                        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors duration-300">
                          {team.name}
                        </h2>

                        {/* Enhanced Record Display */}
                        <div className="mb-6">
                          <Badge 
                            variant="outline" 
                            className="border-primary/30 text-primary bg-primary/10 px-4 py-2 text-sm font-semibold"
                          >
                            Record: {team.wins}-{team.losses}-{team.otl}
                          </Badge>
                        </div>

                        {/* Enhanced Team Awards */}
                        {team.awards && team.awards.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {team.awards.slice(0, 3).map((award: any) => (
                              <Badge
                                key={award.id}
                                variant="outline"
                                className={`flex items-center gap-1 px-3 py-1 ${
                                  award.award_type === "SCS Cup"
                                    ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                                    : "border-blue-500/50 text-blue-400 bg-blue-500/10"
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
                              <Badge variant="outline" className="border-white/30 text-white/70 bg-white/10">
                                +{team.awards.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Enhanced Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 w-full">
                          {/* Points */}
                          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                            <div className="text-2xl font-bold text-blue-400 mb-1">{team.points}</div>
                            <div className="text-xs text-blue-300/70 font-medium">POINTS</div>
                          </div>

                          {/* Salary & Roster */}
                          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                            <div className="text-lg font-bold text-green-400 mb-1">
                              ${(team.total_salary / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-green-300/70 font-medium mb-2">SALARY</div>
                            <div className="flex items-center justify-center gap-1 text-xs text-green-300/70">
                              <Users className="h-3 w-3" />
                              <span>{team.player_count}/{MAX_ROSTER_SIZE}</span>
                            </div>
                          </div>

                          {/* Cap Space */}
                          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                            <div className="text-lg font-bold text-purple-400 mb-1">
                              ${(team.cap_space / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-purple-300/70 font-medium">CAP SPACE</div>
                          </div>
                        </div>

                        {/* Hover Indicator */}
                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            Click to view details →
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}

            {/* No Results Message */}
            {filteredTeams.length === 0 && !loading && (
              <motion.div 
                className="col-span-full text-center py-16"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="max-w-md mx-auto">
                  <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 mb-6">
                    <Search className="h-16 w-16 mx-auto mb-4 text-white/50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Teams Found</h3>
                    <p className="text-white/70">
                      No teams match your search criteria. Try adjusting your search terms.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
