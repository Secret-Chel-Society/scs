"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users } from "lucide-react"
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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">Teams</h1>
              <p className="text-white/70">All teams competing in the Secret Chel Society</p>
            </div>

            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg bg-white/10" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className="h-64 w-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-6 h-full flex flex-col">
                        {/* Team Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <TeamLogo team={team} size={48} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-white truncate group-hover:text-blue-200 transition-colors">
                              {team.name}
                            </h3>
                            <p className="text-white/70 text-sm">
                              {team.division || "Division"} • {team.conference || "Conference"}
                            </p>
                          </div>
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                          <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-2xl font-bold text-white">{team.wins}</div>
                            <div className="text-white/70 text-sm">Wins</div>
                          </div>
                          <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-2xl font-bold text-white">{team.losses}</div>
                            <div className="text-white/70 text-sm">Losses</div>
                          </div>
                          <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-2xl font-bold text-white">{team.otl}</div>
                            <div className="text-white/70 text-sm">OTL</div>
                          </div>
                          <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-2xl font-bold text-white">{team.points}</div>
                            <div className="text-white/70 text-sm">Points</div>
                          </div>
                        </div>

                        {/* Team Info */}
                        <div className="flex items-center justify-between text-sm text-white/70">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{team.player_count || 0}/{MAX_ROSTER_SIZE}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            <span>{team.awards?.length || 0}</span>
                          </div>
                        </div>

                        {/* Awards Badges */}
                        {team.awards && team.awards.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {team.awards.slice(0, 3).map((award: any) => (
                              <Badge key={award.id} variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                                {award.award_type}
                              </Badge>
                            ))}
                            {team.awards.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white/70 border-white/30">
                                +{team.awards.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filteredTeams.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-12"
            >
              <div className="text-white/70 text-lg">
                {searchQuery ? `No teams found matching "${searchQuery}"` : "No teams found"}
              </div>
            </motion.div>
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
