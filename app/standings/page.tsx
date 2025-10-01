"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import TeamStandings from "@/components/team-standings"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Medal, 
  Crown,
  Award,
  BarChart3,
  Users,
  Star,
  Zap,
  TargetIcon,
  Flame,
  ArrowUpDown
} from "lucide-react"
import type { TeamStanding } from "@/lib/standings-calculator"

interface StandingsPageProps {
  searchParams: { season?: string }
}

function PlayoffPicture({ standings }: { standings: TeamStanding[] }) {
  // Sort teams by points for playoff seeding
  const sortedTeams = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
    return b.goals_for - a.goals_for
  })

  // Get teams by conference
  const easternTeams = standings.filter(team => team.conference === "Eastern Elites")
  const westernTeams = standings.filter(team => team.conference === "Western Warriors")

  // Sort teams within each conference
  const sortConferenceTeams = (teams: TeamStanding[]) => {
    return teams.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
      return b.goals_for - a.goals_for
    })
  }

  const sortedEastern = sortConferenceTeams(easternTeams)
  const sortedWestern = sortConferenceTeams(westernTeams)

  // Top 4 teams from each conference make playoffs (only if there are enough teams)
  const easternPlayoffTeams = sortedEastern.length >= 4 ? sortedEastern.slice(0, 4) : []
  const westernPlayoffTeams = sortedWestern.length >= 4 ? sortedWestern.slice(0, 4) : []

  // Bottom 2 teams from each conference are eliminated (only if there are enough teams)
  const easternEliminatedTeams = sortedEastern.length >= 6 ? sortedEastern.slice(-2) : []
  const westernEliminatedTeams = sortedWestern.length >= 6 ? sortedWestern.slice(-2) : []

  // Bubble teams (5th and 6th place in each conference) (only if there are enough teams)
  const easternBubbleTeams = sortedEastern.length >= 6 ? sortedEastern.slice(4, 6) : []
  const westernBubbleTeams = sortedWestern.length >= 6 ? sortedWestern.slice(4, 6) : []

  return (
    <div className="space-y-8">
      {/* Playoff Teams Section */}
      {(easternPlayoffTeams.length > 0 || westernPlayoffTeams.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        <Card className="hockey-card hockey-card-hover border-2 border-assist-green-200/50 dark:border-assist-green-700/50 shadow-2xl shadow-assist-green-500/20 overflow-hidden">
          <CardHeader className="relative bg-gradient-to-r from-assist-green-500/20 to-assist-green-500/20 border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50">
            <CardTitle className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-assist-green-500/25">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">Playoff Teams</div>
                <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">Top 8 Teams - 4 from Each Conference</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-3">
              {[...easternPlayoffTeams, ...westernPlayoffTeams].map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-assist-green-500/10 to-assist-green-500/10 border border-assist-green-400/20 hover:border-assist-green-400/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-assist-green-500/30 to-assist-green-500/30 border-assist-green-400/50 text-assist-green-200"
                    >
                      {index + 1}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 text-lg">{team.name}</span>
                      <Badge
                        variant="default"
                        className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-xs px-3 py-1 shadow-lg"
                        title="Playoff Qualifier"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        PLAYOFF
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-assist-green-600 dark:text-assist-green-400">{team.points}</div>
                      <div className="text-assist-green-500 dark:text-assist-green-500 text-xs">PTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-ice-blue-800 dark:text-ice-blue-200">
                        {team.wins}-{team.losses}-{team.otl}
                      </div>
                      <div className="text-assist-green-500 dark:text-assist-green-500 text-xs">RECORD</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
    </div>
  )
}

function ConferenceStandings({ standings }: { standings: TeamStanding[] }) {
  // Group teams by conference using database conference data
  const conferences = new Map<string, { teams: TeamStanding[], name: string, color: string }>()
  
  standings.forEach(team => {
    if (team.conference_data) {
      const conferenceId = team.conference_data.id
      if (!conferences.has(conferenceId)) {
        conferences.set(conferenceId, {
          teams: [],
          name: team.conference_data.name,
          color: team.conference_data.color
        })
      }
      conferences.get(conferenceId)!.teams.push(team)
    } else if (team.conference) {
      // Fallback to string-based conference grouping
      const conferenceKey = team.conference
      if (!conferences.has(conferenceKey)) {
        conferences.set(conferenceKey, {
          teams: [],
          name: team.conference,
          color: '#6366f1' // Default color
        })
      }
      conferences.get(conferenceKey)!.teams.push(team)
    }
  })

  // If no conference data, split teams roughly in half
  const conferenceArray = Array.from(conferences.values())
  const hasConferenceData = conferenceArray.length > 0

  const conference1Teams = hasConferenceData ? conferenceArray[0]?.teams || [] : standings.slice(0, Math.ceil(standings.length / 2))
  const conference2Teams = hasConferenceData ? conferenceArray[1]?.teams || [] : standings.slice(Math.ceil(standings.length / 2))

  const conference1Name = hasConferenceData ? conferenceArray[0]?.name || "Conference 1" : "Eastern Conference"
  const conference2Name = hasConferenceData ? conferenceArray[1]?.name || "Conference 2" : "Western Conference"
  const conference1Color = hasConferenceData ? conferenceArray[0]?.color || '#6366f1' : '#3b82f6'
  const conference2Color = hasConferenceData ? conferenceArray[1]?.color || '#6366f1' : '#ef4444'

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="hockey-card hockey-card-hover h-full group border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20 overflow-hidden">
          <CardHeader className="pb-4 relative">
            <CardTitle className="flex items-center gap-2 sm:gap-3 relative z-10">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${conference1Color}, ${conference1Color}dd)`,
                  boxShadow: `0 10px 25px ${conference1Color}40`
                }}
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">{conference1Name}</div>
                <div className="text-sm sm:text-lg text-ice-blue-600 dark:text-ice-blue-400">{conference1Teams.length} teams</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TeamStandings teams={conference1Teams} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="hockey-card hockey-card-hover h-full group border-2 border-goal-red-200/50 dark:border-goal-red-700/50 shadow-2xl shadow-goal-red-500/20 overflow-hidden">
          <CardHeader className="pb-4 relative">
            <CardTitle className="flex items-center gap-2 sm:gap-3 relative z-10">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${conference2Color}, ${conference2Color}dd)`,
                  boxShadow: `0 10px 25px ${conference2Color}40`
                }}
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">{conference2Name}</div>
                <div className="text-sm sm:text-lg text-ice-blue-600 dark:text-ice-blue-400">{conference2Teams.length} teams</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TeamStandings teams={conference2Teams} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function StandingsPage({ searchParams }: StandingsPageProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true)
        setError(null)

        // Use the standings API instead of manual calculation
        // Use the correct season number for SCSHL Season 1
        const seasonParam = '?seasonId=2' // SCSHL Season 1 has season_number: 2
        
        const response = await fetch(`/api/standings${seasonParam}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch standings: ${response.status}`)
        }

        const data = await response.json()
        
        // Log what season was used
        console.log('Standings API response:', { seasonId: data.seasonId, standingsCount: data.standings?.length })
        
        if (data.standings && Array.isArray(data.standings)) {
          setStandings(data.standings)
        } else {
          throw new Error('Invalid standings data format')
        }
      } catch (error: any) {
        console.error("Error fetching standings:", error)
        setError(error.message || "Failed to load standings")
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="relative container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="text-center mb-8">
              <Skeleton className="h-12 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="relative container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Standings</h1>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-ice-blue-600 via-rink-blue-500 to-assist-green-500 bg-clip-text text-transparent mb-4"
            >
              League Standings
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg text-ice-blue-600 dark:text-ice-blue-400 max-w-2xl mx-auto"
            >
              Current season standings with complete stats including L10, SPG, PP%, and PK%
            </motion.p>
          </div>

          <Tabs defaultValue="overall" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overall" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overall Standings
              </TabsTrigger>
              <TabsTrigger value="conferences" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                By Conference
              </TabsTrigger>
              <TabsTrigger value="playoffs" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Playoff Picture
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20 overflow-hidden">
                  <CardHeader className="relative bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                    <CardTitle className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">Overall League Standings</div>
                        <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">Complete stats with L10, SPG, PP%, PK%</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TeamStandings teams={standings} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="conferences" className="space-y-6">
              <ConferenceStandings standings={standings} />
            </TabsContent>

            <TabsContent value="playoffs" className="space-y-6">
              <PlayoffPicture standings={standings} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
