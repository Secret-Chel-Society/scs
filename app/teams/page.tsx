"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users, Search, Crown, Medal, Star, Target, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"
import { getAllTeamStats, getCurrentSeasonId } from "@/lib/team-utils"
import { Button } from "@/components/ui/button"

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

  const getTeamRankBadge = (rank: number) => {
    if (rank === 1) return "badge-champion"
    if (rank <= 8) return "badge-playoff"
    return "badge-regular"
  }

  const getTeamRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4" />
    if (rank <= 8) return <Medal className="h-4 w-4" />
    return <Star className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-blue/20 via-hockey-purple/20 to-hockey-blue/20 border-b border-hockey-blue/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-blue/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-blue/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-purple/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">SCS Teams</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover all the competing franchises in the Secret Chel Society. Each team brings unique talent, 
              strategy, and determination to the ice.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-blue to-transparent rounded-full mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Stats */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 hockey-gradient-text">League Franchises</h2>
              <p className="text-muted-foreground">All teams competing in the Secret Chel Society</p>
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/80 backdrop-blur-sm border-hockey-blue/20 focus:border-hockey-blue/50"
              />
            </div>
          </div>

          {/* League Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="enhanced-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-hockey-blue mb-1">{teams.length}</div>
                <div className="text-sm text-muted-foreground">Total Teams</div>
              </CardContent>
            </Card>
            <Card className="enhanced-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-hockey-green mb-1">
                  {teams.reduce((acc, team) => acc + (team.roster_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Active Players</div>
              </CardContent>
            </Card>
            <Card className="enhanced-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-hockey-purple mb-1">
                  {teams.reduce((acc, team) => acc + (team.awards?.length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Awards</div>
              </CardContent>
            </Card>
            <Card className="enhanced-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-hockey-gold mb-1">
                  {teams.filter(team => team.awards?.some((award: any) => award.type === 'championship')).length}
                </div>
                <div className="text-sm text-muted-foreground">Championships</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Teams Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Skeleton className="h-80 w-full rounded-2xl" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Link href={`/teams/${team.id}`}>
                  <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300">
                    {/* Team Header */}
                    <div className="relative p-6 border-b border-hockey-blue/10 bg-gradient-to-r from-hockey-blue/5 to-transparent">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <TeamLogo team={team} size={48} />
                            {team.rank && (
                              <div className={`absolute -top-2 -right-2 ${getTeamRankBadge(team.rank)}`}>
                                {getTeamRankIcon(team.rank)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-hockey-blue transition-colors">
                              {team.name}
                            </h3>
                            {team.rank && (
                              <p className="text-sm text-muted-foreground">Rank #{team.rank}</p>
                            )}
                          </div>
                        </div>
                        {team.awards && team.awards.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-5 w-5 text-hockey-gold" />
                            <span className="text-sm font-medium text-hockey-gold">
                              {team.awards.length}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Team Stats Overview */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-hockey-blue">{team.wins || 0}</div>
                          <div className="text-xs text-muted-foreground">Wins</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-hockey-purple">{team.losses || 0}</div>
                          <div className="text-xs text-muted-foreground">Losses</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-hockey-green">{team.points || 0}</div>
                          <div className="text-xs text-muted-foreground">Points</div>
                        </div>
                      </div>
                    </div>

                    {/* Team Content */}
                    <CardContent className="p-6">
                      {/* Roster Status */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Roster Status</span>
                          <span className="text-sm font-bold text-foreground">
                            {team.roster_count || 0}/{MAX_ROSTER_SIZE}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-hockey-blue to-hockey-purple h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((team.roster_count || 0) / MAX_ROSTER_SIZE * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Recent Awards */}
                      {team.awards && team.awards.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Awards</h4>
                          <div className="space-y-2">
                            {team.awards.slice(0, 3).map((award: any, awardIndex: number) => (
                              <div key={awardIndex} className="flex items-center gap-2 text-sm">
                                <Award className="h-4 w-4 text-hockey-gold" />
                                <span className="text-foreground">{award.name}</span>
                                <Badge variant="outline" className="text-xs border-hockey-gold/30 text-hockey-gold">
                                  {award.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Team Performance */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Goals For</span>
                          <span className="font-medium text-hockey-green">{team.goals_for || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Goals Against</span>
                          <span className="font-medium text-hockey-red">{team.goals_against || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Goal Differential</span>
                          <span className={`font-medium ${(team.goal_differential || 0) >= 0 ? 'text-hockey-green' : 'text-hockey-red'}`}>
                            {(team.goal_differential || 0) >= 0 ? '+' : ''}{team.goal_differential || 0}
                          </span>
                        </div>
                      </div>

                      {/* View Team Button */}
                      <div className="mt-6 pt-4 border-t border-hockey-blue/10">
                        <div className="flex items-center justify-center gap-2 text-hockey-blue group-hover:text-hockey-purple transition-colors">
                          <span className="text-sm font-medium">View Team Details</span>
                          <Target className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredTeams.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <Card className="enhanced-card max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Teams Found</h3>
                <p className="text-muted-foreground mb-4">
                  No teams match your search criteria. Try adjusting your search terms.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  className="btn-ice"
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
