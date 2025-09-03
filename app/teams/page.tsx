"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users, Search, TrendingUp, DollarSign, Target, Medal, Star, Zap } from "lucide-react"
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

  // Calculate league statistics for the header
  const totalTeams = teams.length
  const totalPlayers = teams.reduce((sum, team) => sum + (team.player_count || 0), 0)
  const totalSalary = teams.reduce((sum, team) => sum + (team.total_salary || 0), 0)

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
              Secret Chel Society
            </h1>
            <p className="hockey-subtitle mb-8">
              Discover the elite teams competing in the most competitive hockey league
            </p>
            
            {/* League Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hockey-stat-item"
              >
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-ice-blue-600 dark:text-ice-blue-400" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  {totalTeams}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Active Teams
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.4 }}
                className="hockey-stat-item"
              >
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-rink-blue-600 dark:text-rink-blue-400" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  {totalPlayers}
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Total Players
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.6 }}
                className="hockey-stat-item"
              >
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-8 w-8 text-assist-green-600 dark:text-assist-green-400" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  ${(totalSalary / 1000000000).toFixed(1)}B
                </div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Total Salary
                </div>
              </motion.div>
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
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                Team Directory
              </h2>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Explore team rosters, statistics, and achievements
              </p>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-hockey-silver-400" />
              <Input
                placeholder="Search teams by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hockey-search pl-10"
              />
            </div>
          </div>

          {/* Teams Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
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
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Link href={`/teams/${team.id}`}>
                    <Card className="hockey-card hockey-card-hover h-full overflow-hidden">
                      <CardContent className="p-0">
                        {/* Team Logo Section */}
                        <div className="relative h-48 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 flex items-center justify-center p-6">
                          <div className="relative h-32 w-32 group-hover:scale-110 transition-transform duration-300">
                            {team.logo_url ? (
                              <Image
                                src={team.logo_url || "/placeholder.svg"}
                                alt={team.name}
                                fill
                                className="object-contain drop-shadow-lg"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              />
                            ) : (
                              <TeamLogo teamName={team.name} size="xl" />
                            )}
                          </div>
                          
                          {/* Floating Achievement Badge */}
                          {team.awards && team.awards.length > 0 && (
                            <div className="absolute top-4 right-4">
                              <div className="bg-gradient-to-r from-goal-red-500 to-assist-green-500 text-white p-2 rounded-full shadow-lg">
                                <Medal className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Team Info Section */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 text-center mb-3 group-hover:text-ice-blue-600 dark:group-hover:text-ice-blue-400 transition-colors duration-200">
                            {team.name}
                          </h3>
                          
                          {/* Record Badge */}
                          <div className="flex justify-center mb-4">
                            <Badge className="hockey-badge">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {team.wins}-{team.losses}-{team.otl}
                            </Badge>
                          </div>

                          {/* Team Awards */}
                          {team.awards && team.awards.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                              {team.awards.slice(0, 2).map((award: any) => (
                                <Badge
                                  key={award.id}
                                  className={`flex items-center gap-1 ${
                                    award.award_type === "SCS Cup"
                                      ? "bg-gradient-to-r from-goal-red-100 to-goal-red-200 text-goal-red-800 border-goal-red-300 dark:from-goal-red-900/30 dark:to-goal-red-800/30 dark:text-goal-red-200 dark:border-goal-red-600"
                                      : "bg-gradient-to-r from-assist-green-100 to-assist-green-200 text-assist-green-800 border-assist-green-300 dark:from-assist-green-900/30 dark:to-assist-green-800/30 dark:text-assist-green-200 dark:border-assist-green-600"
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
                              {team.awards.length > 2 && (
                                <Badge variant="outline" className="text-hockey-silver-600 dark:text-hockey-silver-400">
                                  +{team.awards.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Team Statistics Grid */}
                          <div className="hockey-stats-grid">
                            <div className="hockey-stat-item">
                              <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                                {team.points}
                              </div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-medium uppercase tracking-wide">
                                Points
                              </div>
                            </div>
                            
                            <div className="hockey-stat-item">
                              <div className="text-lg font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                                ${(team.total_salary / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-medium uppercase tracking-wide mb-3">
                                Salary
                              </div>
                              <div className="flex items-center justify-center text-xs text-hockey-silver-500 dark:text-hockey-silver-500 bg-hockey-silver-100 dark:bg-hockey-silver-800/50 rounded-lg px-2 py-1">
                                <Users className="h-3 w-3 mr-1" />
                                <span>{team.player_count}/{MAX_ROSTER_SIZE}</span>
                              </div>
                            </div>
                            
                            <div className="hockey-stat-item">
                              <div className="text-lg font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                                ${(team.cap_space / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-medium uppercase tracking-wide">
                                Cap Space
                              </div>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-2 text-ice-blue-600 dark:text-ice-blue-400 font-medium group-hover:text-ice-blue-700 dark:group-hover:text-ice-blue-300 transition-colors duration-200">
                              <span>View Details</span>
                              <Zap className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
              
              {filteredTeams.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full text-center py-16"
                >
                  <div className="max-w-md mx-auto">
                    <Search className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-2">
                      No teams found
                    </h3>
                    <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
                      Try adjusting your search terms or browse all available teams.
                    </p>
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