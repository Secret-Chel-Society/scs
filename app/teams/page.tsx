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
    <div className="min-h-screen relative overflow-hidden bg-background pt-4">
      {/* Professional Hockey-Themed Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/8" />
        
        {/* Professional floating elements */}
        <motion.div
          className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-primary/25 to-secondary/25 rounded-full shadow-xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-br from-secondary/25 to-primary/25 rounded-xl shadow-xl"
          animate={{ y: [-20, 20, -20], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          {/* Enhanced Professional Header Section */}
          <div className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-6 mb-8"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative p-6 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
                <Target className="h-12 w-12 text-white relative z-10" />
                <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                SCS Team Roster
              </h1>
            </motion.div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-secondary rounded-full" />
              <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
              <div className="h-1 w-32 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full" />
            </div>
            
            <motion.p 
              className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Discover all <span className="font-bold text-primary">professional franchises</span> competing in the Secret Chel Society. 
              Each team brings <span className="font-semibold text-secondary">unique talent, strategy, and championship determination</span> to the ice.
            </motion.p>
          </div>

          {/* Enhanced Professional Search Section */}
          <motion.div 
            className="max-w-lg mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-primary group-focus-within:text-secondary transition-colors duration-300" />
              <Input
                placeholder="Search teams by franchise name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 py-5 text-lg bg-background/90 border-2 border-primary/30 focus:border-secondary/50 text-foreground placeholder:text-muted-foreground backdrop-blur-lg rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 hover:border-primary/40"
              />
            </div>
          </motion.div>

          {/* Professional Teams Count Display */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
              className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-primary/15 to-secondary/15 backdrop-blur-lg rounded-2xl border border-primary/30 shadow-xl"
            >
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-foreground font-bold text-xl">
                {loading ? "Loading franchises..." : `${filteredTeams.length} Professional Teams`}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.08, type: "spring", stiffness: 100 }}
              >
                <Skeleton className="h-96 w-full rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.08, type: "spring", stiffness: 100 }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <Link href={`/teams/${team.id}`}>
                  <Card className="overflow-hidden h-full border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 hover:border-primary/50 hover:shadow-3xl transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:via-secondary/5 group-hover:to-primary/10 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardContent className="p-8 relative">
                      <div className="flex flex-col items-center text-center">
                        {/* Enhanced Professional Team Logo Section */}
                        <div className="relative mb-8">
                          <motion.div 
                            className="relative h-40 w-40 mb-4 group-hover:scale-115 transition-all duration-500"
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.6 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                            {team.logo_url ? (
                              <Image
                                src={team.logo_url || "/placeholder.svg"}
                                alt={team.name}
                                fill
                                className="object-contain filter drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <TeamLogo teamName={team.name} size="xl" />
                            )}
                          </motion.div>
                          {/* Professional glow effects */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-500 -z-20" />
                        </div>

                        {/* Enhanced Professional Team Name */}
                        <motion.h2 
                          className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          {team.name}
                        </motion.h2>

                        {/* Enhanced Professional Record Display */}
                        <div className="mb-8">
                          <Badge 
                            variant="outline" 
                            className="border-2 border-primary/40 text-primary bg-gradient-to-r from-primary/15 to-secondary/15 px-6 py-3 text-base font-bold rounded-xl shadow-lg group-hover:shadow-xl group-hover:border-primary/60 transition-all duration-300"
                          >
                            Record: {team.wins}-{team.losses}-{team.otl}
                          </Badge>
                        </div>

                        {/* Enhanced Championship Awards Section */}
                        {team.awards && team.awards.length > 0 && (
                          <motion.div 
                            className="flex flex-wrap justify-center gap-3 mb-8"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                          >
                            {team.awards.slice(0, 3).map((award: any) => (
                              <Badge
                                key={award.id}
                                variant="outline"
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                                  award.award_type === "SCS Cup"
                                    ? "border-2 border-yellow-500/60 text-yellow-600 bg-gradient-to-r from-yellow-500/15 to-yellow-600/15"
                                    : "border-2 border-primary/60 text-primary bg-gradient-to-r from-primary/15 to-secondary/15"
                                }`}
                              >
                                {award.award_type === "SCS Cup" ? (
                                  <Trophy className="h-4 w-4" />
                                ) : (
                                  <Award className="h-4 w-4" />
                                )}
                                {award.award_type === "SCS Cup" ? "Championship" : "Trophy"} {award.year}
                              </Badge>
                            ))}
                            {team.awards.length > 3 && (
                              <Badge variant="outline" className="border-2 border-secondary/40 text-secondary bg-gradient-to-r from-secondary/15 to-primary/15 px-4 py-2 rounded-lg">
                                +{team.awards.length - 3} more
                              </Badge>
                            )}
                          </motion.div>
                        )}

                        {/* Enhanced Professional Stats Grid */}
                        <div className="grid grid-cols-3 gap-6 w-full mb-6">
                          {/* Points */}
                          <motion.div 
                            className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/15 to-primary/25 border-2 border-primary/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/stat"
                            whileHover={{ y: -2 }}
                          >
                            <div className="text-3xl font-bold text-primary mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                              {team.points}
                            </div>
                            <div className="text-xs text-primary/80 font-bold tracking-wider">POINTS</div>
                          </motion.div>

                          {/* Salary & Roster */}
                          <motion.div 
                            className="text-center p-4 rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/25 border-2 border-secondary/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/stat"
                            whileHover={{ y: -2 }}
                          >
                            <div className="text-xl font-bold text-secondary mb-1 group-hover/stat:scale-110 transition-transform duration-300">
                              ${(team.total_salary / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-secondary/80 font-bold tracking-wider mb-2">SALARY</div>
                            <div className="flex items-center justify-center gap-1 text-xs text-secondary/80 font-medium">
                              <Users className="h-3 w-3" />
                              <span>{team.player_count}/{MAX_ROSTER_SIZE}</span>
                            </div>
                          </motion.div>

                          {/* Cap Space */}
                          <motion.div 
                            className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 border-2 border-primary/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/stat"
                            whileHover={{ y: -2 }}
                          >
                            <div className="text-xl font-bold text-primary mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                              ${(team.cap_space / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-primary/80 font-bold tracking-wider">CAP SPACE</div>
                          </motion.div>
                        </div>

                        {/* Enhanced Professional Hover Indicator */}
                        <motion.div 
                          className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-500"
                          initial={{ y: 10 }}
                          whileInView={{ y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Badge className="bg-gradient-to-r from-primary/25 to-secondary/25 text-primary border-2 border-primary/40 px-6 py-2 text-sm font-bold rounded-lg shadow-lg hover:shadow-xl">
                            View Team Details →
                          </Badge>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}

            {/* Enhanced No Results Message */}
            {filteredTeams.length === 0 && !loading && (
              <motion.div 
                className="col-span-full text-center py-24"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="max-w-lg mx-auto">
                  <Card className="p-12 bg-gradient-to-br from-secondary/10 to-primary/10 border-2 border-dashed border-secondary/30 shadow-xl">
                    <CardContent className="text-center">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                        className="mb-8"
                      >
                        <Search className="h-20 w-20 mx-auto text-secondary" />
                      </motion.div>
                      <h3 className="text-3xl font-bold text-foreground mb-4">No Teams Found</h3>
                      <p className="text-muted-foreground text-lg">
                        No teams match your search criteria. Try adjusting your search terms to find the franchise you're looking for.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
