"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { 
  Trophy, 
  Award, 
  Users, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Medal, 
  Star, 
  Zap, 
  Crown, 
  Flame, 
  Shield, 
  Rocket,
  BarChart3,
  Activity,
  Calendar,
  RefreshCw
} from "lucide-react"
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
  const [currentSeason, setCurrentSeason] = useState<number | null>(null)

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true)

        // Get current season ID
        const seasonId = await getCurrentSeasonId()
        setCurrentSeason(seasonId)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-ice-blue-600 to-rink-blue-700 dark:from-ice-blue-400 dark:to-rink-blue-500 bg-clip-text text-transparent">
                  Elite Team Directory
                </h1>
                {currentSeason && (
                  <div className="mt-2">
                     <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white px-4 py-2 text-lg font-semibold">
                       SCSHL Season 1
                     </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mb-8" />
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Discover the powerhouse teams competing in the most competitive hockey league. Each team brings unique talent, strategy, and determination to the ice.
            </p>
          </div>
        </div>
      </div>

      {/* League Statistics */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg w-fit mx-auto mb-4">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {totalTeams}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Teams
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {totalPlayers}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Players
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg w-fit mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                ${totalSalary.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Salary
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Search Section */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="text-lg sm:text-xl text-slate-800 dark:text-slate-200 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                Team Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  <Input
                    placeholder="Search teams by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 sm:pl-12 pr-4 sm:pr-6 py-2 sm:py-3 text-base sm:text-lg border-slate-300 dark:border-slate-600 focus:border-ice-blue-500 dark:focus:border-ice-blue-500 focus:ring-2 focus:ring-ice-blue-500/20 transition-all duration-300"
                  />
                </div>
                {searchQuery && (
                  <div className="text-center mt-4">
                    <span className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                      Found <span className="font-semibold text-ice-blue-600 dark:text-ice-blue-400">{filteredTeams.length}</span> team{filteredTeams.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Teams Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-80 sm:h-96 w-full rounded-xl bg-gradient-to-br from-slate-100 to-ice-blue-100 dark:from-slate-800 dark:to-ice-blue-900/20"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredTeams.map((team, index) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-full overflow-hidden">
                    <CardContent className="p-0">
                      {/* Team Logo Section */}
                      <div className="relative h-40 sm:h-48 bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 flex items-center justify-center p-4 sm:p-6">
                        {/* Logo Container */}
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 group-hover:scale-110 transition-transform duration-300">
                          {team.logo_url ? (
                            <Image
                              src={team.logo_url || "/placeholder.svg"}
                              alt={team.name}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                          ) : (
                            <TeamLogo teamName={team.name} size="xl" />
                          )}
                        </div>
                        
                        {/* Achievement Badge */}
                        {team.awards && team.awards.length > 0 && (
                          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                            <div className="bg-gradient-to-r from-goal-red-500 to-assist-green-500 text-white p-2 rounded-full shadow-lg">
                              <Medal className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Team Info Section */}
                      <div className="p-4 sm:p-6">
                        {/* Team Name */}
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 text-center mb-3 sm:mb-4">
                          {team.name}
                        </h3>
                        
                        {/* Record */}
                        <div className="flex justify-center mb-3 sm:mb-4">
                          <Badge className="bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 text-ice-blue-800 border-ice-blue-300 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 dark:text-ice-blue-200 dark:border-ice-blue-600 text-sm sm:text-base">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {team.wins}-{team.losses}-{team.otl}
                          </Badge>
                        </div>

                        {/* Team Awards */}
                        {team.awards && team.awards.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                            {team.awards.slice(0, 2).map((award: any) => (
                              <Badge
                                key={award.id}
                                className={`flex items-center gap-1 px-2 py-1 text-xs ${
                                  award.award_type === "SCS Cup"
                                    ? "bg-gradient-to-r from-goal-red-100 to-goal-red-200 text-goal-red-800 border-goal-red-300 dark:from-goal-red-900/30 dark:to-goal-red-800/30 dark:text-goal-red-200 dark:border-goal-red-600"
                                    : "bg-gradient-to-r from-assist-green-100 to-assist-green-200 text-assist-green-800 border-assist-green-300 dark:from-assist-green-900/30 dark:to-assist-green-800/30 dark:text-assist-green-200 dark:border-assist-green-600"
                                }`}
                              >
                                {award.award_type === "SCS Cup" ? (
                                  <Crown className="h-3 w-3" />
                                ) : (
                                  <Award className="h-3 w-3" />
                                )}
                                {award.award_type === "SCS Cup" ? "Cup" : "Trophy"} {award.year}
                              </Badge>
                            ))}
                            {team.awards.length > 2 && (
                              <Badge variant="outline" className="text-slate-600 dark:text-slate-400 text-xs">
                                +{team.awards.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Team Statistics */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">
                              {team.points}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Points
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200">
                              ${(team.total_salary / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Salary
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 mt-3 sm:mt-4">
                          <Users className="h-3 w-3 mr-2" />
                          <span className="font-medium">{team.player_count || 0}/{MAX_ROSTER_SIZE}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {filteredTeams.length === 0 && (
                <div className="col-span-full text-center py-12 sm:py-20">
                  <div className="max-w-md mx-auto px-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-200 to-ice-blue-200 dark:from-slate-700 dark:to-ice-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Search className="h-8 w-8 sm:h-10 sm:w-10 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                      No teams found
                    </h3>
                    <p className="text-slate-500 dark:text-slate-500 text-base sm:text-lg mb-4 sm:mb-6">
                      Try adjusting your search terms or browse all available teams.
                    </p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="inline-flex items-center gap-2 text-ice-blue-600 dark:text-ice-blue-400 hover:text-ice-blue-700 dark:hover:text-ice-blue-300 font-medium transition-colors duration-200 text-sm sm:text-base"
                    >
                      <Shield className="h-4 w-4" />
                      Clear Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}