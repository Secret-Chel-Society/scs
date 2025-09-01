"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
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

  // Top 4 teams from each conference make playoffs
  const easternPlayoffTeams = sortedEastern.slice(0, 4)
  const westernPlayoffTeams = sortedWestern.slice(0, 4)

  // Bottom 2 teams from each conference are eliminated
  const easternEliminatedTeams = sortedEastern.slice(-2)
  const westernEliminatedTeams = sortedWestern.slice(-2)

  // Bubble teams (5th and 6th place in each conference)
  const easternBubbleTeams = sortedEastern.slice(4, 6)
  const westernBubbleTeams = sortedWestern.slice(4, 6)

  return (
    <div className="space-y-8">
      {/* Overall Playoff Teams */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-400/30">
            <CardTitle className="flex items-center gap-3 text-green-200">
              <div className="p-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-lg">
                <Crown className="h-6 w-6 text-green-300" />
              </div>
              <div>
                <div className="text-xl font-bold">Playoff Teams</div>
                <div className="text-sm font-normal text-green-300">Top 8 Teams - 4 from Each Conference</div>
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
                  className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 hover:border-green-400/40 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-400/50 text-green-200"
                      >
                        {index + 1}
                      </Badge>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1">
                          <Medal className={`h-4 w-4 ${
                            index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 'text-orange-400'
                          }`} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white text-lg">{team.name}</span>
                      <Badge
                        variant="default"
                        className="bg-green-600/80 text-white text-xs px-2 py-1"
                        title="Playoff Qualifier"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        PLAYOFF
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-blue-600/80 text-white text-xs px-2 py-1"
                        title="Conference"
                      >
                        {easternPlayoffTeams.includes(team) ? "Eastern Elites" : "Western Warriors"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-300">{team.points}</div>
                      <div className="text-green-400 text-xs">PTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">
                        {team.wins}-{team.losses}-{team.otl}
                      </div>
                      <div className="text-green-400 text-xs">RECORD</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bubble Teams Section */}
      {(easternBubbleTeams.length > 0 || westernBubbleTeams.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-sm border border-orange-400/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-b border-orange-400/30">
              <CardTitle className="flex items-center gap-3 text-orange-200">
                <div className="p-2 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-lg">
                  <Flame className="h-6 w-6 text-orange-300" />
                </div>
                <div>
                  <div className="text-xl font-bold">Bubble Teams</div>
                  <div className="text-sm font-normal text-orange-300">Fighting for Playoff Spots (5th & 6th Place in Each Conference)</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-3">
                {[...easternBubbleTeams, ...westernBubbleTeams].map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-400/50 text-orange-200"
                      >
                        {easternBubbleTeams.includes(team) ? 5 + easternBubbleTeams.indexOf(team) : 5 + westernBubbleTeams.indexOf(team)}
                      </Badge>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white text-lg">{team.name}</span>
                        <Badge
                          variant="secondary"
                          className="bg-orange-600/80 text-white text-xs px-2 py-1"
                          title="Bubble Team"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          BUBBLE
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-blue-600/80 text-white text-xs px-2 py-1"
                          title="Conference"
                        >
                          {easternBubbleTeams.includes(team) ? "Eastern Elites" : "Western Warriors"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-300">{team.points}</div>
                        <div className="text-orange-400 text-xs">PTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">
                          {team.wins}-{team.losses}-{team.otl}
                        </div>
                        <div className="text-orange-400 text-xs">RECORD</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-400">
                          {easternBubbleTeams.includes(team) 
                            ? easternPlayoffTeams[3]?.points - team.points
                            : westernPlayoffTeams[3]?.points - team.points
                          }
                        </div>
                        <div className="text-orange-500 text-xs">PTS BACK</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Playoff Bracket Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-400/30">
            <CardTitle className="flex items-center gap-3 text-purple-200">
              <div className="p-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg">
                <Target className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <div className="text-xl font-bold">Playoff Bracket</div>
                <div className="text-sm font-normal text-purple-300">Conference Quarterfinals - 1v4, 2v3</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Eastern Conference Bracket */}
              <div className="space-y-4">
                <h3 className="text-center text-lg font-semibold text-blue-200 mb-4">Eastern Elites</h3>
                <div className="space-y-3">
                  {/* 1v4 Matchup */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/20">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-400/50 text-yellow-200">
                        1
                      </Badge>
                      <span className="text-white font-medium">{easternPlayoffTeams[0]?.name || "TBD"}</span>
                    </div>
                    <div className="text-center text-sm text-blue-300">vs</div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{easternPlayoffTeams[3]?.name || "TBD"}</span>
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 text-blue-200">
                        4
                      </Badge>
                    </div>
                  </div>
                  
                  {/* 2v3 Matchup */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/20">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-gray-300/30 to-slate-400/30 border-gray-400/50 text-gray-200">
                        2
                      </Badge>
                      <span className="text-white font-medium">{easternPlayoffTeams[1]?.name || "TBD"}</span>
                    </div>
                    <div className="text-center text-sm text-blue-300">vs</div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{easternPlayoffTeams[2]?.name || "TBD"}</span>
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-400/50 text-orange-200">
                        3
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Western Conference Bracket */}
              <div className="space-y-4">
                <h3 className="text-center text-lg font-semibold text-purple-200 mb-4">Western Warriors</h3>
                <div className="space-y-3">
                  {/* 1v4 Matchup */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-400/50 text-yellow-200">
                        1
                      </Badge>
                      <span className="text-white font-medium">{westernPlayoffTeams[0]?.name || "TBD"}</span>
                    </div>
                    <div className="text-center text-sm text-purple-300">vs</div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{westernPlayoffTeams[3]?.name || "TBD"}</span>
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 text-blue-200">
                        4
                      </Badge>
                    </div>
                  </div>
                  
                  {/* 2v3 Matchup */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-gray-300/30 to-slate-400/30 border-gray-400/50 text-gray-200">
                        2
                      </Badge>
                      <span className="text-white font-medium">{westernPlayoffTeams[1]?.name || "TBD"}</span>
                    </div>
                    <div className="text-center text-sm text-purple-300">vs</div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{westernPlayoffTeams[2]?.name || "TBD"}</span>
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-400/50 text-orange-200">
                        3
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Eliminated Teams Section */}
      {(easternEliminatedTeams.length > 0 || westernEliminatedTeams.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-sm border border-red-400/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500/20 to-rose-500/20 border-b border-red-400/30">
              <CardTitle className="flex items-center gap-3 text-red-200">
                <div className="p-2 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-lg">
                  <Minus className="h-6 w-6 text-red-300" />
                </div>
                <div>
                  <div className="text-xl font-bold">Eliminated Teams</div>
                  <div className="text-sm font-normal text-red-300">Bottom 2 Teams from Each Conference</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-3">
                {[...easternEliminatedTeams, ...westernEliminatedTeams].map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-400/20 hover:border-red-400/40 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-red-500/30 to-rose-500/30 border-red-400/50 text-red-200"
                      >
                        {easternEliminatedTeams.includes(team) 
                          ? sortedEastern.length - 1 + easternEliminatedTeams.indexOf(team)
                          : sortedWestern.length - 1 + westernEliminatedTeams.indexOf(team)
                        }
                      </Badge>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white text-lg">{team.name}</span>
                        <Badge
                          variant="destructive"
                          className="bg-red-600/80 text-white text-xs px-2 py-1"
                          title="Eliminated from Playoffs"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          ELIMINATED
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-blue-600/80 text-white text-xs px-2 py-1"
                          title="Conference"
                        >
                          {easternEliminatedTeams.includes(team) ? "Eastern Elites" : "Western Warriors"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-300">{team.points}</div>
                        <div className="text-red-400 text-xs">PTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">
                          {team.wins}-{team.losses}-{team.otl}
                        </div>
                        <div className="text-red-400 text-xs">RECORD</div>
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
  // Group teams by conference using the new conference system
  const easternTeams = standings.filter((team) => team.conference === "Eastern Elites")
  const westernTeams = standings.filter((team) => team.conference === "Western Warriors")

  // Sort teams within each conference by points
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

  // If no conference data, fall back to splitting teams roughly in half
  const hasConferenceData = easternTeams.length > 0 || westernTeams.length > 0

  const conference1Teams = hasConferenceData ? sortedEastern : standings.slice(0, Math.ceil(standings.length / 2))
  const conference2Teams = hasConferenceData ? sortedWestern : standings.slice(Math.ceil(standings.length / 2))

  const conference1Name = hasConferenceData ? "Eastern Elites" : "Eastern Conference"
  const conference2Name = hasConferenceData ? "Western Warriors" : "Western Conference"

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-blue-400/30">
            <CardTitle className="flex items-center gap-3 text-blue-200">
              <div className="p-2 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <div className="text-xl font-bold">{conference1Name}</div>
                <div className="text-sm font-normal text-blue-300">{conference1Teams.length} teams</div>
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
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-400/30">
            <CardTitle className="flex items-center gap-3 text-purple-200">
              <div className="p-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg">
                <Star className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <div className="text-xl font-bold">{conference2Name}</div>
                <div className="text-sm font-normal text-purple-300">{conference2Teams.length} teams</div>
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

function StandingsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}

export default function StandingsPage({ searchParams }: StandingsPageProps) {
  const { supabase } = useSupabase()
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true)
        setError(null)

        // Get all teams with conference information
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select(`
            *,
            conferences!left(name)
          `)
          .eq("is_active", true)
          .order("name")

        if (teamsError) {
          throw teamsError
        }

        if (!teamsData || teamsData.length === 0) {
          setStandings([])
          return
        }

        // Get all matches for the current season
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .eq("season_name", "Season 1")
          .eq("status", "completed")

        if (matchesError) {
          console.error("Error fetching matches:", matchesError)
        }

        // Calculate standings manually
        const calculatedStandings: TeamStanding[] = teamsData.map((team, index) => {
          let wins = 0
          let losses = 0
          let otl = 0
          let goalsFor = 0
          let goalsAgainst = 0

          // Calculate stats from matches
          matchesData?.forEach((match) => {
            if (match.home_team_id === team.id) {
              goalsFor += match.home_score || 0
              goalsAgainst += match.away_score || 0

              if (match.home_score > match.away_score) {
                wins++
              } else if (match.home_score < match.away_score) {
                if (match.overtime || match.has_overtime) {
                  otl++
                } else {
                  losses++
                }
              } else {
                losses++ // Tie counts as loss
              }
            } else if (match.away_team_id === team.id) {
              goalsFor += match.away_score || 0
              goalsAgainst += match.home_score || 0

              if (match.away_score > match.home_score) {
                wins++
              } else if (match.away_score < match.home_score) {
                if (match.overtime || match.has_overtime) {
                  otl++
                } else {
                  losses++
                }
              } else {
                losses++ // Tie counts as loss
              }
            }
          })

          const points = wins * 2 + otl
          const gamesPlayed = wins + losses + otl
          const goalDifferential = goalsFor - goalsAgainst

          return {
            id: team.id,
            name: team.name,
            logo_url: team.logo_url,
            wins,
            losses,
            otl,
            games_played: gamesPlayed,
            points,
            goals_for: goalsFor,
            goals_against: goalsAgainst,
            goal_differential: goalDifferential,
            division: team.division || "Custom",
            conference: team.conferences?.name || (index < Math.ceil(teamsData.length / 2) ? "Eastern Elites" : "Western Warriors"),
            playoff_status: "active" as const,
          }
        })

        // Sort by points, wins, goal differential, goals for
        const sortedStandings = calculatedStandings.sort((a, b) => {
          if (a.points !== b.points) return b.points - a.points
          if (a.wins !== b.wins) return b.wins - a.wins
          if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
          return b.goals_for - a.goals_for
        })

        setStandings(sortedStandings)
      } catch (error: any) {
        console.error("Error fetching standings:", error)
        setError(error.message || "Failed to load standings")
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white">League Standings</h1>
                <p className="text-purple-200 text-lg">Current team standings, conference rankings, and playoff picture</p>
              </div>
              <StandingsLoadingSkeleton />
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <TargetIcon className="h-12 w-12 text-red-400" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-white">League Standings</h1>
              <p className="text-red-300 mb-6 text-lg">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-white">League Standings</h1>
              <p className="text-purple-300 text-lg">No standings data available.</p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="space-y-8">
            {/* Header Section */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-3 mb-6 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
                <Trophy className="h-8 w-8 text-purple-300" />
                <span className="text-purple-300 font-medium">Season 1</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                League Standings
              </h1>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Track your team's journey through the season with comprehensive statistics, rankings, and playoff projections
              </p>
            </motion.div>

            {/* Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Tabs defaultValue="overall" className="space-y-8">
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-1">
                  <TabsTrigger 
                    value="overall" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/30 data-[state=active]:text-white data-[state=active]:border-purple-400/50 transition-all duration-200"
                  >
                    Overall Standings
                  </TabsTrigger>
                  <TabsTrigger 
                    value="conference" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/30 data-[state=active]:to-cyan-500/30 data-[state=active]:text-white data-[state=active]:border-blue-400/50 transition-all duration-200"
                  >
                    Conference
                  </TabsTrigger>
                  <TabsTrigger 
                    value="playoffs" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/30 data-[state=active]:to-emerald-500/30 data-[state=active]:text-white data-[state=active]:border-green-400/50 transition-all duration-200"
                  >
                    Playoff Picture
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overall" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-white/20 to-white/10 border-b border-white/20">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="p-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg">
                            <ArrowUpDown className="h-6 w-6 text-purple-300" />
                          </div>
                          <div>
                            <div className="text-xl font-bold">League Standings</div>
                            <div className="text-sm font-normal text-purple-300">
                              Complete standings for all teams in the league
                            </div>
                          </div>
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          <div className="flex items-center gap-6 mt-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-green-600/80 text-white text-xs px-2 py-1">
                                <Trophy className="h-3 w-3 mr-1" />
                                CLINCHED
                              </Badge>
                              <span className="text-purple-300">Clinched Playoff Spot</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="bg-red-600/80 text-white text-xs px-2 py-1">
                                <Minus className="h-3 w-3 mr-1" />
                                ELIMINATED
                              </Badge>
                              <span className="text-purple-300">Eliminated from Playoffs</span>
                            </div>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <TeamStandings teams={standings} />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="conference" className="space-y-6">
                  <ConferenceStandings standings={standings} />
                </TabsContent>

                <TabsContent value="playoffs" className="space-y-6">
                  <PlayoffPicture standings={standings} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
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
