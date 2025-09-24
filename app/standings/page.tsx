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
      {/* Overall Playoff Teams - Only show if there are playoff teams */}
      {(easternPlayoffTeams.length > 0 || westernPlayoffTeams.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        <Card className="hockey-card hockey-card-hover border-2 border-assist-green-200/50 dark:border-assist-green-700/50 shadow-2xl shadow-assist-green-500/20 overflow-hidden">
          <CardHeader className="relative bg-gradient-to-r from-assist-green-500/20 to-assist-green-500/20 border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/30 dark:to-assist-green-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
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
                    <div className="relative">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-assist-green-500/30 to-assist-green-500/30 border-assist-green-400/50 text-assist-green-200"
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
                      <span className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 text-lg">{team.name}</span>
                      <Badge
                        variant="default"
                        className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-xs px-3 py-1 shadow-lg"
                        title="Playoff Qualifier"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        PLAYOFF
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white text-xs px-3 py-1 shadow-lg"
                        title="Conference"
                      >
                        {easternPlayoffTeams.includes(team) ? "Eastern Elites" : "Western Warriors"}
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

      {/* Bubble Teams Section */}
      {(easternBubbleTeams.length > 0 || westernBubbleTeams.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hockey-card hockey-card-hover border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 shadow-2xl shadow-hockey-silver-500/20 overflow-hidden">
            <CardHeader className="relative bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-hockey-silver-100 to-hockey-silver-100 dark:from-hockey-silver-900/30 dark:to-hockey-silver-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
              <CardTitle className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-xl flex items-center justify-center shadow-lg shadow-hockey-silver-500/25">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">Bubble Teams</div>
                  <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">Fighting for Playoff Spots (5th & 6th Place in Each Conference)</div>
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
                    className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-hockey-silver-500/10 to-hockey-silver-500/10 border border-hockey-silver-400/20 hover:border-hockey-silver-400/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-hockey-silver-500/30 to-hockey-silver-500/30 border-hockey-silver-400/50 text-hockey-silver-200"
                      >
                        {easternBubbleTeams.includes(team) ? 5 + easternBubbleTeams.indexOf(team) : 5 + westernBubbleTeams.indexOf(team)}
                        </Badge>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 text-lg">{team.name}</span>
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white text-xs px-3 py-1 shadow-lg"
                          title="Bubble Team"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          BUBBLE
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white text-xs px-3 py-1 shadow-lg"
                          title="Conference"
                        >
                          {easternBubbleTeams.includes(team) ? "Eastern Elites" : "Western Warriors"}
                          </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-hockey-silver-600 dark:text-hockey-silver-400">{team.points}</div>
                        <div className="text-hockey-silver-500 dark:text-hockey-silver-500 text-xs">PTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-ice-blue-800 dark:text-ice-blue-200">
                          {team.wins}-{team.losses}-{team.otl}
                        </div>
                        <div className="text-hockey-silver-500 dark:text-hockey-silver-500 text-xs">RECORD</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-hockey-silver-600 dark:text-hockey-silver-400">
                          {easternBubbleTeams.includes(team) 
                            ? easternPlayoffTeams[3]?.points - team.points
                            : westernPlayoffTeams[3]?.points - team.points
                          }
                        </div>
                        <div className="text-hockey-silver-500 dark:text-hockey-silver-500 text-xs">PTS BACK</div>
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
                <div className="text-xl font-bold">Complete Playoff Bracket</div>
                <div className="text-sm font-normal text-purple-300">From Quarterfinals to Finals</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-4 min-w-[800px]">
                {/* Quarterfinals Column */}
                <div className="space-y-4">
                  <h3 className="text-center text-sm font-semibold text-purple-300 mb-4">Quarterfinals</h3>
                  
                  {/* Eastern Quarterfinals */}
                  <div className="space-y-3">
                    <div className="text-xs text-blue-300 font-medium mb-2 text-center">Eastern Elites</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/20">
                        <div className="flex items-center gap-2">
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-400/50 text-yellow-200">
                            1
                          </Badge>
                          <span className="text-white text-sm font-medium truncate">{easternPlayoffTeams[0]?.name || "TBD"}</span>
                        </div>
                        <div className="text-center text-xs text-blue-300">vs</div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium truncate">{easternPlayoffTeams[3]?.name || "TBD"}</span>
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 text-blue-200">
                            4
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/20">
                        <div className="flex items-center gap-2">
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-gray-300/30 to-slate-400/30 border-gray-400/50 text-gray-200">
                            2
                          </Badge>
                          <span className="text-white text-sm font-medium truncate">{easternPlayoffTeams[1]?.name || "TBD"}</span>
                        </div>
                        <div className="text-center text-xs text-blue-300">vs</div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium truncate">{easternPlayoffTeams[2]?.name || "TBD"}</span>
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-400/50 text-orange-200">
                            3
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Western Quarterfinals */}
                  <div className="space-y-3 mt-4">
                    <div className="text-xs text-purple-300 font-medium mb-2 text-center">Western Warriors</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20">
                        <div className="flex items-center gap-2">
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-400/50 text-yellow-200">
                            1
                          </Badge>
                          <span className="text-white text-sm font-medium truncate">{westernPlayoffTeams[0]?.name || "TBD"}</span>
                        </div>
                        <div className="text-center text-xs text-purple-300">vs</div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium truncate">{westernPlayoffTeams[3]?.name || "TBD"}</span>
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 text-blue-200">
                            4
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20">
                        <div className="flex items-center gap-2">
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-gray-300/30 to-slate-400/30 border-gray-400/50 text-gray-200">
                            2
                          </Badge>
                          <span className="text-white text-sm font-medium truncate">{westernPlayoffTeams[1]?.name || "TBD"}</span>
                        </div>
                        <div className="text-center text-xs text-purple-300">vs</div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium truncate">{westernPlayoffTeams[2]?.name || "TBD"}</span>
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-400/50 text-orange-200">
                            3
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conference Semifinals Column */}
                <div className="space-y-4">
                  <h3 className="text-center text-sm font-semibold text-purple-300 mb-4">Conference Semifinals</h3>
                  
                  {/* Eastern Semifinal */}
                  <div className="space-y-3">
                    <div className="text-xs text-blue-300 font-medium mb-2 text-center">Eastern Elites</div>
                    <div className="h-20 flex items-center justify-center">
                      <div className="p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/20 min-w-[120px] text-center">
                        <span className="text-white text-sm font-medium">Winner 1v4</span>
                        <div className="text-xs text-blue-300 mt-1">vs</div>
                        <span className="text-white text-sm font-medium">Winner 2v3</span>
                      </div>
                    </div>
                  </div>

                  {/* Western Semifinal */}
                  <div className="space-y-3 mt-4">
                    <div className="text-xs text-purple-300 font-medium mb-2 text-center">Western Warriors</div>
                    <div className="h-20 flex items-center justify-center">
                      <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20 min-w-[120px] text-center">
                        <span className="text-white text-sm font-medium">Winner 1v4</span>
                        <div className="text-xs text-purple-300 mt-1">vs</div>
                        <span className="text-white text-sm font-medium">Winner 2v3</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conference Finals Column */}
                <div className="space-y-4">
                  <h3 className="text-center text-sm font-semibold text-purple-300 mb-4">Conference Finals</h3>
                  
                  {/* Eastern Final */}
                  <div className="space-y-3">
                    <div className="text-xs text-blue-300 font-medium mb-2 text-center">Eastern Elites</div>
                    <div className="h-20 flex items-center justify-center">
                      <div className="p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/20 min-w-[120px] text-center">
                        <span className="text-white text-sm font-medium">Eastern Champion</span>
                      </div>
                    </div>
                  </div>

                  {/* Western Final */}
                  <div className="space-y-3 mt-4">
                    <div className="text-xs text-purple-300 font-medium mb-2 text-center">Western Warriors</div>
                    <div className="h-20 flex items-center justify-center">
                      <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20 min-w-[120px] text-center">
                        <span className="text-white text-sm font-medium">Western Champion</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* League Semifinal Column */}
                <div className="space-y-4">
                  <h3 className="text-center text-sm font-semibold text-purple-300 mb-4">League Semifinal</h3>
                  <div className="h-20 flex items-center justify-center">
                    <div className="p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-400/20 min-w-[120px] text-center">
                      <span className="text-white text-sm font-medium">Eastern Champion</span>
                      <div className="text-xs text-green-300 mt-1">vs</div>
                      <span className="text-white text-sm font-medium">Western Champion</span>
                    </div>
                  </div>
                </div>

                {/* Finals Column */}
                <div className="space-y-4">
                  <h3 className="text-center text-sm font-semibold text-purple-300 mb-4">League Finals</h3>
                  <div className="h-20 flex items-center justify-center">
                    <div className="p-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg border border-yellow-400/20 min-w-[120px] text-center">
                      <span className="text-white text-sm font-medium">League Champion</span>
                      <div className="text-xs text-yellow-300 mt-1">🏆</div>
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
          <Card className="hockey-card hockey-card-hover border-2 border-goal-red-200/50 dark:border-goal-red-700/50 shadow-2xl shadow-goal-red-500/20 overflow-hidden">
            <CardHeader className="relative bg-gradient-to-r from-goal-red-500/20 to-goal-red-500/20 border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-goal-red-100 to-goal-red-100 dark:from-goal-red-900/30 dark:to-goal-red-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
              <CardTitle className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-goal-red-500/25">
                  <Minus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">Eliminated Teams</div>
                  <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">Bottom 2 Teams from Each Conference</div>
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
                    className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-goal-red-500/10 to-goal-red-500/10 border border-goal-red-400/20 hover:border-goal-red-400/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-goal-red-500/30 to-goal-red-500/30 border-goal-red-400/50 text-goal-red-200"
                      >
                        {easternEliminatedTeams.includes(team) 
                          ? sortedEastern.length - 1 + easternEliminatedTeams.indexOf(team)
                          : sortedWestern.length - 1 + westernEliminatedTeams.indexOf(team)
                        }
                      </Badge>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 text-lg">{team.name}</span>
                        <Badge
                          variant="destructive"
                          className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-xs px-3 py-1 shadow-lg"
                          title="Eliminated from Playoffs"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          ELIMINATED
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white text-xs px-3 py-1 shadow-lg"
                          title="Conference"
                        >
                          {easternEliminatedTeams.includes(team) ? "Eastern Elites" : "Western Warriors"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-goal-red-600 dark:text-goal-red-400">{team.points}</div>
                        <div className="text-goal-red-500 dark:text-goal-red-500 text-xs">PTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-ice-blue-800 dark:text-ice-blue-200">
                          {team.wins}-{team.losses}-{team.otl}
                        </div>
                        <div className="text-goal-red-500 dark:text-goal-red-500 text-xs">RECORD</div>
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
            <div 
              className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${conference1Color}20, ${conference1Color}40)`
              }}
            ></div>
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
        <Card className="hockey-card hockey-card-hover h-full group border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20 overflow-hidden">
          <CardHeader className="pb-4 relative">
            <div 
              className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${conference2Color}20, ${conference2Color}40)`
              }}
            ></div>
            <CardTitle className="flex items-center gap-2 sm:gap-3 relative z-10">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${conference2Color}, ${conference2Color}dd)`,
                  boxShadow: `0 10px 25px ${conference2Color}40`
                }}
              >
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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

        // Get current season first
        let currentSeasonName = "Season 1" // Default fallback
        
        try {
          const { data: activeSeason } = await supabase
            .from("seasons")
            .select("name")
            .eq("is_active", true)
            .single()
          
          if (activeSeason?.name) {
            currentSeasonName = activeSeason.name
          }
        } catch (seasonError) {
          console.log("Could not fetch active season, using default:", seasonError)
        }

        // Get all matches for the current season
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .eq("season_name", currentSeasonName)
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="relative container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-ice-blue-800 dark:text-ice-blue-200">League Standings</h1>
                <p className="text-ice-blue-600 dark:text-ice-blue-400 text-lg">Current team standings, conference rankings, and playoff picture</p>
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="relative container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="text-center">
              <div className="bg-gradient-to-r from-goal-red-500/20 to-goal-red-600/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <TargetIcon className="h-12 w-12 text-goal-red-400" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-ice-blue-800 dark:text-ice-blue-200">League Standings</h1>
              <p className="text-goal-red-600 dark:text-goal-red-400 mb-6 text-lg">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="relative container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="text-center">
              <div className="bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-ice-blue-400" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-ice-blue-800 dark:text-ice-blue-200">League Standings</h1>
              <p className="text-ice-blue-600 dark:text-ice-blue-400 text-lg">No standings data available.</p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-hockey-silver-200/20 to-ice-blue-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Season Badge */}
            <div className="inline-flex items-center gap-3 mb-8 p-4 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-2xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/20">
              <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
               <span className="text-ice-blue-800 dark:text-ice-blue-200 font-semibold text-lg">SCSHL Season 1</span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-ice-blue-600 via-rink-blue-600 to-hockey-silver-600 dark:from-ice-blue-400 dark:via-rink-blue-400 dark:to-hockey-silver-400 bg-clip-text text-transparent leading-tight">
              League Standings
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-ice-blue-700 dark:text-ice-blue-300 max-w-3xl mx-auto leading-relaxed">
              Track your team's journey through the season with comprehensive statistics, rankings, and playoff projections
            </p>
          </motion.div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="space-y-12">

            {/* Enhanced Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Tabs defaultValue="overall" className="space-y-8">
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-ice-blue-100/80 to-rink-blue-100/80 dark:from-hockey-silver-800/80 dark:to-rink-blue-800/80 backdrop-blur-sm border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 p-2 rounded-2xl shadow-lg shadow-ice-blue-500/20">
                  <TabsTrigger 
                    value="overall" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-ice-blue-500/30 transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Overall Standings
                  </TabsTrigger>
                  <TabsTrigger 
                    value="conference" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-silver-500 data-[state=active]:to-ice-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-hockey-silver-500/30 transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Conference
                  </TabsTrigger>
                  <TabsTrigger 
                    value="playoffs" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-goal-red-500/30 transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Playoff Picture
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overall" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20 overflow-hidden">
                      <CardHeader className="relative bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-assist-green-100 to-goal-red-100 dark:from-assist-green-900/30 dark:to-goal-red-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
                        <CardTitle className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                            <ArrowUpDown className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">League Standings</div>
                            <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">
                              Complete standings for all teams in the league
                    </div>
                  </div>
                        </CardTitle>
                        <CardDescription className="text-ice-blue-700 dark:text-ice-blue-300 relative z-10">
                          <div className="flex items-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-xs px-3 py-1 shadow-lg">
                                <Trophy className="h-3 w-3 mr-1" />
                                CLINCHED
                              </Badge>
                              <span className="text-ice-blue-600 dark:text-ice-blue-400">Clinched Playoff Spot</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-xs px-3 py-1 shadow-lg">
                                <Minus className="h-3 w-3 mr-1" />
                                ELIMINATED
                              </Badge>
                              <span className="text-ice-blue-600 dark:text-ice-blue-400">Eliminated from Playoffs</span>
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