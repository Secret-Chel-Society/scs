"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users, Search, TrendingUp, DollarSign, Target, Medal, Star, Zap, Crown, Flame, Shield, Rocket } from "lucide-react"
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
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="hockey-title mb-6">
              Elite Team Directory
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Discover the powerhouse teams competing in the most competitive hockey league. Each team brings unique talent, strategy, and determination to the ice.
            </p>
            
            {/* Enhanced League Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group"
              >
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    {totalTeams}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Active Teams
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.4 }}
                className="group"
              >
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-rink-blue-500/25 transition-all duration-300">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                    {totalPlayers}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Elite Players
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.6 }}
                className="group"
              >
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    ${(totalSalary / 1000000000).toFixed(1)}B
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Total Value
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* Enhanced Search and Filter Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
                Team Directory
              </h2>
              <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-2xl mx-auto">
                Explore team rosters, statistics, and achievements. Find your favorite team or discover new contenders.
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-hockey-silver-400 z-10" />
                <Input
                  placeholder="Search teams by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hockey-search pl-12 pr-6 py-4 text-lg border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Search Results Counter */}
              {searchQuery && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-4"
                >
                  <span className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    Found <span className="font-semibold text-ice-blue-600 dark:text-ice-blue-400">{filteredTeams.length}</span> team{filteredTeams.length !== 1 ? 's' : ''}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Enhanced Teams Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div className="h-96 w-full rounded-2xl bg-gradient-to-br from-hockey-silver-100 to-ice-blue-100 dark:from-hockey-silver-800 dark:to-ice-blue-900/20 animate-pulse"></div>
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
                  whileHover={{ y: -12, scale: 1.03 }}
                  className="group"
                >
                  <Link href={`/teams/${team.id}`}>
                    <Card className="hockey-card hockey-card-hover h-full overflow-hidden border-2 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-500">
                      <CardContent className="p-0">
                        {/* Enhanced Team Logo Section */}
                        <div className="relative h-52 bg-gradient-to-br from-ice-blue-100 via-white to-rink-blue-100 dark:from-ice-blue-900/30 dark:via-hockey-silver-800 dark:to-rink-blue-900/30 flex items-center justify-center p-6 overflow-hidden">
                          {/* Background Pattern */}
                          <div className="absolute inset-0 bg-hockey-pattern opacity-10"></div>
                          
                          {/* Logo Container */}
                          <div className="relative h-36 w-36 group-hover:scale-110 transition-transform duration-500 z-10">
                            {team.logo_url ? (
                              <Image
                                src={team.logo_url || "/placeholder.svg"}
                                alt={team.name}
                                fill
                                className="object-contain drop-shadow-2xl filter group-hover:drop-shadow-ice-blue-500/50 transition-all duration-500"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              />
                            ) : (
                              <TeamLogo teamName={team.name} size="xl" />
                            )}
                          </div>
                          
                          {/* Enhanced Floating Achievement Badge */}
                          {team.awards && team.awards.length > 0 && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="absolute top-4 right-4"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-goal-red-500 to-assist-green-500 rounded-full blur-sm opacity-75"></div>
                                <div className="relative bg-gradient-to-r from-goal-red-500 to-assist-green-500 text-white p-3 rounded-full shadow-xl border-2 border-white dark:border-hockey-silver-800">
                                  <Medal className="h-5 w-5" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Team Name Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-hockey-silver-900/80 to-transparent p-4">
                            <h3 className="text-lg font-bold text-white text-center drop-shadow-lg">
                              {team.name}
                            </h3>
                          </div>
                        </div>

                        {/* Enhanced Team Info Section */}
                        <div className="p-6 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-800 dark:to-ice-blue-900/20">
                          {/* Record Badge */}
                          <div className="flex justify-center mb-6">
                            <Badge className="hockey-badge text-lg px-4 py-2 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 text-ice-blue-800 border-ice-blue-300 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 dark:text-ice-blue-200 dark:border-ice-blue-600">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              {team.wins}-{team.losses}-{team.otl}
                            </Badge>
                          </div>

                          {/* Enhanced Team Awards */}
                          {team.awards && team.awards.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                              {team.awards.slice(0, 2).map((award: any) => (
                                <Badge
                                  key={award.id}
                                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${
                                    award.award_type === "SCS Cup"
                                      ? "bg-gradient-to-r from-goal-red-100 to-goal-red-200 text-goal-red-800 border-goal-red-300 dark:from-goal-red-900/30 dark:to-goal-red-800/30 dark:text-goal-red-200 dark:border-goal-red-600 shadow-lg shadow-goal-red-500/25"
                                      : "bg-gradient-to-r from-assist-green-100 to-assist-green-200 text-assist-green-800 border-assist-green-300 dark:from-assist-green-900/30 dark:to-assist-green-800/30 dark:text-assist-green-200 dark:border-assist-green-600 shadow-lg shadow-assist-green-500/25"
                                  } hover:scale-105 transition-transform duration-200`}
                                >
                                  {award.award_type === "SCS Cup" ? (
                                    <Crown className="h-4 w-4" />
                                  ) : (
                                    <Award className="h-4 w-4" />
                                  )}
                                  {award.award_type === "SCS Cup" ? "Cup" : "Trophy"} {award.year}
                                </Badge>
                              ))}
                              {team.awards.length > 2 && (
                                <Badge variant="outline" className="text-hockey-silver-600 dark:text-hockey-silver-400 hover:bg-hockey-silver-100 dark:hover:bg-hockey-silver-800 transition-colors duration-200">
                                  +{team.awards.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Enhanced Team Statistics Grid */}
                          <div className="hockey-stats-grid mb-6">
                            <div className="hockey-stat-item group/stat hover:scale-105 transition-all duration-300">
                              <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2 group-hover/stat:text-ice-blue-800 dark:group-hover/stat:text-ice-blue-200 transition-colors duration-200">
                                {team.points}
                              </div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-medium uppercase tracking-wide">
                                Points
                              </div>
                              <div className="w-8 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-2 group-hover/stat:w-12 transition-all duration-300"></div>
                            </div>
                            
                            <div className="hockey-stat-item group/stat hover:scale-105 transition-all duration-300">
                              <div className="text-lg font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2 group-hover/stat:text-rink-blue-800 dark:group-hover/stat:text-rink-blue-200 transition-colors duration-200">
                                ${(team.total_salary / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-medium uppercase tracking-wide mb-3">
                                Salary
                              </div>
                              <div className="flex items-center justify-center text-xs text-hockey-silver-500 dark:text-hockey-silver-500 bg-gradient-to-r from-hockey-silver-100 to-ice-blue-100 dark:from-hockey-silver-800/50 dark:to-ice-blue-900/20 rounded-lg px-3 py-2 border border-hockey-silver-200/50 dark:border-hockey-silver-600/50">
                                <Users className="h-3 w-3 mr-2" />
                                <span className="font-medium">{team.player_count}/{MAX_ROSTER_SIZE}</span>
                              </div>
                            </div>
                            
                            <div className="hockey-stat-item group/stat hover:scale-105 transition-all duration-300">
                              <div className="text-lg font-bold text-assist-green-700 dark:text-assist-green-300 mb-2 group-hover/stat:text-assist-green-800 dark:group-hover/stat:text-assist-green-200 transition-colors duration-200">
                                ${(team.cap_space / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-medium uppercase tracking-wide">
                                Cap Space
                              </div>
                              <div className="w-8 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-2 group-hover/stat:w-12 transition-all duration-300"></div>
                            </div>
                          </div>

                          {/* Enhanced View Details Button */}
                          <div className="text-center">
                            <div className="inline-flex items-center gap-2 text-ice-blue-600 dark:text-ice-blue-400 font-semibold group-hover:text-ice-blue-700 dark:group-hover:text-ice-blue-300 transition-all duration-300 hover:scale-105">
                              <span className="relative">
                                View Details
                                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
                              </span>
                              <Zap className="h-5 w-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
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
                  className="col-span-full text-center py-20"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-r from-hockey-silver-200 to-ice-blue-200 dark:from-hockey-silver-700 dark:to-ice-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="h-10 w-10 text-hockey-silver-500 dark:text-hockey-silver-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-hockey-silver-700 dark:text-hockey-silver-300 mb-3">
                      No teams found
                    </h3>
                    <p className="text-hockey-silver-500 dark:text-hockey-silver-500 text-lg">
                      Try adjusting your search terms or browse all available teams.
                    </p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-4 inline-flex items-center gap-2 text-ice-blue-600 dark:text-ice-blue-400 hover:text-ice-blue-700 dark:hover:text-ice-blue-300 font-medium transition-colors duration-200"
                    >
                      <Shield className="h-4 w-4" />
                      Clear Search
                    </button>
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