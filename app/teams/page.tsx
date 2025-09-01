"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Trophy, Award, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"

// Maximum roster size constant
const MAX_ROSTER_SIZE = 15

export default function TeamsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true)

        // Get all teams with basic info
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (teamsError) {
          throw teamsError
        }

        if (!teamsData || teamsData.length === 0) {
          setTeams([])
          return
        }

        // Get player counts for each team
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("team_id, salary")
          .not("team_id", "is", null)

        if (playerError) {
          console.error("Error fetching player data:", playerError)
        }

        // Calculate player counts and salaries by team
        const playerCountByTeam: Record<string, number> = {}
        const totalSalaryByTeam: Record<string, number> = {}

        playerData?.forEach((player) => {
          if (player.team_id) {
            playerCountByTeam[player.team_id] = (playerCountByTeam[player.team_id] || 0) + 1
            totalSalaryByTeam[player.team_id] = (totalSalaryByTeam[player.team_id] || 0) + (player.salary || 0)
          }
        })

        // Get team awards
        const { data: awardsData, error: awardsError } = await supabase
          .from("team_awards")
          .select("id, team_id, award_type, season_number, year")
          .order("year", { ascending: false })

        if (awardsError) {
          console.error("Error fetching team awards:", awardsError)
        }

        // Group awards by team
        const awardsByTeam: Record<string, any[]> = {}
        awardsData?.forEach((award) => {
          if (!awardsByTeam[award.team_id]) {
            awardsByTeam[award.team_id] = []
          }
          awardsByTeam[award.team_id].push(award)
        })

        // Combine all data
        const teamsWithData = teamsData.map((team) => ({
          ...team,
          player_count: playerCountByTeam[team.id] || 0,
          total_salary: totalSalaryByTeam[team.id] || 0,
          cap_space: 30000000 - (totalSalaryByTeam[team.id] || 0),
          awards: awardsByTeam[team.id] || [],
        }))

        setTeams(teamsWithData)
      } catch (error: any) {
        console.error("Error loading teams:", error)
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
  }, [supabase, toast])

  // Filter teams based on search query
  const filteredTeams = teams.filter((team) => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                  <Card className="overflow-hidden h-full hover:border-primary transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        <div className="relative h-32 w-32 mb-4">
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
                        <h2 className="text-xl font-bold text-center mb-2">{team.name}</h2>
                        <div className="text-sm text-muted-foreground text-center mb-4">
                          Record: {team.wins || 0}-{team.losses || 0}-{team.otl || 0}
                        </div>

                        {/* Team Awards */}
                        {team.awards && team.awards.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {team.awards.slice(0, 3).map((award: any) => (
                              <Badge
                                key={award.id}
                                variant="outline"
                                className={`flex items-center gap-1 ${
                                  award.award_type === "SCS Cup"
                                    ? "border-yellow-500 text-yellow-500"
                                    : "border-blue-500 text-blue-500"
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
                            {team.awards.length > 3 && <Badge variant="outline">+{team.awards.length - 3} more</Badge>}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 w-full text-center">
                          <div>
                            <div className="text-lg font-bold">{team.points || 0}</div>
                            <div className="text-xs text-muted-foreground">PTS</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">${((team.total_salary || 0) / 1000000).toFixed(1)}M</div>
                            <div className="text-xs text-muted-foreground">SALARY</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center mt-1">
                              <Users className="h-3 w-3 mr-1" />
                              <span>
                                {team.player_count || 0}/{MAX_ROSTER_SIZE} Players
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">${((team.cap_space || 0) / 1000000).toFixed(1)}M</div>
                            <div className="text-xs text-muted-foreground">CAP SPACE</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
            {filteredTeams.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No teams found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
