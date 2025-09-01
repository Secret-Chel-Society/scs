"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Target, Minus, Trophy, Crown, Star, Medal } from "lucide-react"

interface Team {
  id: string
  name: string
  conference_id?: string
  conference_name?: string
  points?: number
  wins?: number
  goal_differential?: number
  goals_for?: number
}

interface Conference {
  id: string
  name: string
  color?: string
}

interface PlayoffBracketProps {
  teams: Team[]
  conferences: Conference[]
}

export default function PlayoffBracket({ teams, conferences }: PlayoffBracketProps) {
  // Helper function to get team seeding within a conference based on standings
  function getConferenceSeeding(conferenceName: string, seed: number) {
    const conference = conferences.find(c => c.name === conferenceName)
    if (!conference) return null

    const teamsInConference = teams
      .filter(team => team.conference_id === conference.id)
      .sort((a, b) => {
        // Sort by points (descending)
        if ((b.points || 0) !== (a.points || 0)) {
          return (b.points || 0) - (a.points || 0)
        }
        // Tiebreaker: wins
        if ((b.wins || 0) !== (a.wins || 0)) {
          return (b.wins || 0) - (a.wins || 0)
        }
        // Tiebreaker: goal differential
        if ((b.goal_differential || 0) !== (a.goal_differential || 0)) {
          return (b.goal_differential || 0) - (a.goal_differential || 0)
        }
        // Final tiebreaker: goals for
        return (b.goals_for || 0) - (a.goals_for || 0)
      })

    return teamsInConference[seed - 1] || null
  }

  // Helper function to get eliminated teams (bottom 2) from a conference
  function getEliminatedTeams(conferenceName: string) {
    const conference = conferences.find(c => c.name === conferenceName)
    if (!conference) return []

    const teamsInConference = teams
      .filter(team => team.conference_id === conference.id)
      .sort((a, b) => {
        // Sort by points (descending)
        if ((b.points || 0) !== (a.points || 0)) {
          return (b.points || 0) - (a.points || 0)
        }
        // Tiebreaker: wins
        if ((b.wins || 0) !== (a.wins || 0)) {
          return (b.wins || 0) - (a.wins || 0)
        }
        // Tiebreaker: goal differential
        if ((b.goal_differential || 0) !== (a.goal_differential || 0)) {
          return (b.goal_differential || 0) - (a.goal_differential || 0)
        }
        // Final tiebreaker: goals for
        return (b.goals_for || 0) - (a.goals_for || 0)
      })

    // Return bottom 2 teams (eliminated)
    return teamsInConference.slice(-2)
  }

  // Helper function to get seed badge color
  function getSeedBadgeColor(seed: number) {
    switch (seed) {
      case 1:
        return "bg-yellow-500 text-white"
      case 2:
        return "bg-gray-400 text-white"
      case 3:
        return "bg-amber-600 text-white"
      case 4:
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-sm border border-orange-400/30">
      <CardHeader>
        <CardTitle className="text-orange-200 text-2xl flex items-center gap-2">
          <Target className="h-6 w-6" />
          Playoff Bracket
        </CardTitle>
        <CardDescription className="text-orange-300">
          Current playoff seeding based on conference standings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Eastern Conference Bracket */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-orange-200 font-semibold text-lg mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Eastern Conference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quarterfinal 1: 1v4 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg p-4 border border-orange-400/30"
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-orange-400/30 text-orange-200">
                    Quarterfinal 1
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded border border-orange-400/20">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeedBadgeColor(1)}>1</Badge>
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Eastern Elites", 1)?.name || "TBD"}
                      </span>
                    </div>
                    <span className="text-orange-300 text-sm font-semibold">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Eastern Elites", 4)?.name || "TBD"}
                      </span>
                      <Badge className={getSeedBadgeColor(4)}>4</Badge>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quarterfinal 2: 2v3 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg p-4 border border-orange-400/30"
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-orange-400/30 text-orange-200">
                    Quarterfinal 2
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded border border-orange-400/20">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeedBadgeColor(2)}>2</Badge>
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Eastern Elites", 2)?.name || "TBD"}
                      </span>
                    </div>
                    <span className="text-orange-300 text-sm font-semibold">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Eastern Elites", 3)?.name || "TBD"}
                      </span>
                      <Badge className={getSeedBadgeColor(3)}>3</Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Western Conference Bracket */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-orange-200 font-semibold text-lg mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              Western Conference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quarterfinal 1: 1v4 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg p-4 border border-orange-400/30"
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-orange-400/30 text-orange-200">
                    Quarterfinal 1
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded border border-orange-400/20">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeedBadgeColor(1)}>1</Badge>
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Western Warriors", 1)?.name || "TBD"}
                      </span>
                    </div>
                    <span className="text-orange-300 text-sm font-semibold">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Western Warriors", 4)?.name || "TBD"}
                      </span>
                      <Badge className={getSeedBadgeColor(4)}>4</Badge>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quarterfinal 2: 2v3 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg p-4 border border-orange-400/30"
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-orange-400/30 text-orange-200">
                    Quarterfinal 2
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded border border-orange-400/20">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeedBadgeColor(2)}>2</Badge>
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Western Warriors", 2)?.name || "TBD"}
                      </span>
                    </div>
                    <span className="text-orange-300 text-sm font-semibold">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {getConferenceSeeding("Western Warriors", 3)?.name || "TBD"}
                      </span>
                      <Badge className={getSeedBadgeColor(3)}>3</Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Eliminated Teams */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-red-200 font-semibold text-lg mb-4 flex items-center gap-2">
              <Minus className="h-5 w-5" />
              Eliminated Teams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Eastern Eliminated */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-4 border border-red-400/30"
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-red-400/30 text-red-200">
                    Eastern Conference
                  </Badge>
                </div>
                <div className="space-y-2">
                  {getEliminatedTeams("Eastern Elites").map((team, index) => (
                    <div key={team.id} className="flex items-center gap-2 p-2 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded border border-red-400/20">
                      <Badge className="bg-red-500 text-white">{5 + index}</Badge>
                      <span className="text-white font-medium">{team.name}</span>
                    </div>
                  ))}
                  {getEliminatedTeams("Eastern Elites").length === 0 && (
                    <div className="text-red-300 text-center py-2">No teams eliminated yet</div>
                  )}
                </div>
              </motion.div>

              {/* Western Eliminated */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-4 border border-red-400/30"
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-red-400/30 text-red-200">
                    Western Conference
                  </Badge>
                </div>
                <div className="space-y-2">
                  {getEliminatedTeams("Western Warriors").map((team, index) => (
                    <div key={team.id} className="flex items-center gap-2 p-2 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded border border-red-400/20">
                      <Badge className="bg-red-500 text-white">{5 + index}</Badge>
                      <span className="text-white font-medium">{team.name}</span>
                    </div>
                  ))}
                  {getEliminatedTeams("Western Warriors").length === 0 && (
                    <div className="text-red-300 text-center py-2">No teams eliminated yet</div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Seeding Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-lg p-4 border border-gray-400/20"
          >
            <h4 className="text-gray-200 font-semibold text-lg mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Seeding Legend
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500 text-white">1</Badge>
                <span className="text-gray-300 text-sm">1st Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-400 text-white">2</Badge>
                <span className="text-gray-300 text-sm">2nd Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-600 text-white">3</Badge>
                <span className="text-gray-300 text-sm">3rd Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500 text-white">4</Badge>
                <span className="text-gray-300 text-sm">4th Place</span>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
