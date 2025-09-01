"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { motion } from "framer-motion"
import { Trophy, Award, Users } from "lucide-react"
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true)
        setError(null)

        // Get current season ID
        const seasonId = await getCurrentSeasonId()

        // Get team stats using original function
        const teamStats = await getAllTeamStats(seasonId)

        if (!teamStats || teamStats.length === 0) {
          setError("No teams found for the current season")
          setTeams([])
          return
        }

        // Get team awards
        try {
          const response = await fetch("/api/teams/awards")
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
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
        } catch (awardsError) {
          console.warn("Could not load team awards:", awardsError)
          // Continue without awards if they fail to load
          setTeams(teamStats.map((team) => ({ ...team, awards: [] })))
        }
      } catch (error: any) {
        console.error("Error loading teams:", error)
        setError(error.message || "Failed to load teams data")
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
  const filteredTeams = teams.filter((team) => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (error && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Teams</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teams</h1>
            <p className="text-muted-foreground">All teams competing in the Secret Chel Society</p>
          </div>

          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <TeamLogo team={team} size={48} />
                          <div>
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {team.player_count || 0}/{MAX_ROSTER_SIZE} Players
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{team.points || 0}</div>
                          <div className="text-xs text-muted-foreground">Points</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-green-600">{team.wins || 0}</div>
                          <div className="text-xs text-muted-foreground">Wins</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-red-600">{team.losses || 0}</div>
                          <div className="text-xs text-muted-foreground">Losses</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-orange-600">{team.otl || 0}</div>
                          <div className="text-xs text-muted-foreground">OTL</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Goals For:</span>
                          <span className="font-semibold">{team.goals_for || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Goals Against:</span>
                          <span className="font-semibold">{team.goals_against || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Goal Differential:</span>
                          <span className={`font-semibold ${(team.goal_differential || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(team.goal_differential || 0) >= 0 ? '+' : ''}{team.goal_differential || 0}
                          </span>
                        </div>
                      </div>

                      {team.awards && team.awards.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Awards</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {team.awards.slice(0, 3).map((award: any) => (
                              <Badge key={award.id} variant="outline" className="text-xs">
                                {award.award_type}
                              </Badge>
                            ))}
                            {team.awards.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{team.awards.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredTeams.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No teams found matching "{searchQuery}"</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
