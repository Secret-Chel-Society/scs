"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Trophy, Crown, Star, Medal, Target, Zap } from "lucide-react"

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

  // Helper function to get seed badge color
  function getSeedBadgeColor(seed: number) {
    switch (seed) {
      case 1:
        return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg"
      case 2:
        return "bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg"
      case 3:
        return "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg"
      case 4:
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg"
    }
  }

  // Helper function to render a team slot
  function renderTeamSlot(team: Team | null, seed: number, conference: string) {
    return (
      <motion.div
        className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg border border-slate-500/30 hover:border-slate-400/50 transition-all duration-300 hover:bg-slate-600/30"
        whileHover={{ scale: 1.02, x: conference === "Eastern Elites" ? -2 : 2 }}
      >
        <div className="flex items-center gap-3">
          <Badge className={`${getSeedBadgeColor(seed)} text-xs font-bold`}>
            {seed}
          </Badge>
          <span className="text-white font-medium text-sm">
            {team?.name || "TBD"}
          </span>
        </div>
        {conference === "Eastern Elites" && (
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        )}
        {conference === "Western Warriors" && (
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
        )}
      </motion.div>
    )
  }

  // Helper function to render a matchup
  function renderMatchup(team1: Team | null, team2: Team | null, seed1: number, seed2: number, conference: string, round: string) {
    return (
      <motion.div
        className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 rounded-xl p-4 border border-slate-600/40 shadow-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-3">
          <Badge variant="outline" className="border-slate-400/40 text-slate-300 bg-slate-700/40">
            {round}
          </Badge>
        </div>
        <div className="space-y-3">
          {renderTeamSlot(team1, seed1, conference)}
          <div className="flex justify-center">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
          </div>
          {renderTeamSlot(team2, seed2, conference)}
        </div>
      </motion.div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-slate-600/40 shadow-2xl">
      <CardHeader className="text-center">
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mb-4 shadow-2xl"
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            rotate: { duration: 4, repeat: Number.POSITIVE_INFINITY },
            scale: { duration: 2, repeat: Number.POSITIVE_INFINITY }
          }}
        >
          <Trophy className="h-8 w-8 text-white" />
        </motion.div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
          Stanley Cup Playoffs
        </CardTitle>
        <CardDescription className="text-slate-300 text-lg">
          Complete tournament bracket - Road to the Cup
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="relative">
          {/* Stanley Cup in the Center */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                <Crown className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold px-3 py-1">
                  CUP
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Tournament Bracket Layout */}
          <div className="grid grid-cols-7 gap-4 items-center min-h-[600px]">
            
            {/* Eastern Conference - Left Side */}
            <div className="col-span-3 space-y-6">
              <motion.h3 
                className="text-center text-blue-300 font-bold text-lg mb-6 flex items-center justify-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Eastern Conference
              </motion.h3>

              {/* Eastern Quarterfinals */}
              <div className="space-y-4">
                {renderMatchup(
                  getConferenceSeeding("Eastern Elites", 1),
                  getConferenceSeeding("Eastern Elites", 4),
                  1, 4, "Eastern Elites", "Quarterfinal"
                )}
                {renderMatchup(
                  getConferenceSeeding("Eastern Elites", 2),
                  getConferenceSeeding("Eastern Elites", 3),
                  2, 3, "Eastern Elites", "Quarterfinal"
                )}
              </div>

              {/* Eastern Semifinal Placeholder */}
              <motion.div
                className="bg-gradient-to-br from-blue-800/40 to-blue-700/40 rounded-xl p-4 border border-blue-600/40 shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-blue-400/40 text-blue-300 bg-blue-700/40">
                    Conference Final
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-700/50 to-blue-600/50 rounded-lg border border-blue-500/30">
                    <span className="text-blue-200 text-sm font-medium">Winner QF1</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-700/50 to-blue-600/50 rounded-lg border border-blue-500/30">
                    <span className="text-blue-200 text-sm font-medium">Winner QF2</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Center Spacer for Cup */}
            <div className="col-span-1"></div>

            {/* Western Conference - Right Side */}
            <div className="col-span-3 space-y-6">
              <motion.h3 
                className="text-center text-purple-300 font-bold text-lg mb-6 flex items-center justify-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                Western Conference
              </motion.h3>

              {/* Western Quarterfinals */}
              <div className="space-y-4">
                {renderMatchup(
                  getConferenceSeeding("Western Warriors", 1),
                  getConferenceSeeding("Western Warriors", 4),
                  1, 4, "Western Warriors", "Quarterfinal"
                )}
                {renderMatchup(
                  getConferenceSeeding("Western Warriors", 2),
                  getConferenceSeeding("Western Warriors", 3),
                  2, 3, "Western Warriors", "Quarterfinal"
                )}
              </div>

              {/* Western Semifinal Placeholder */}
              <motion.div
                className="bg-gradient-to-br from-purple-800/40 to-purple-700/40 rounded-xl p-4 border border-purple-600/40 shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
              >
                <div className="text-center mb-3">
                  <Badge variant="outline" className="border-purple-400/40 text-purple-300 bg-purple-700/40">
                    Conference Final
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-purple-700/50 to-purple-600/50 rounded-lg border border-purple-500/30">
                    <span className="text-purple-200 text-sm font-medium">Winner QF1</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-700/50 to-purple-600/50 rounded-lg border border-purple-500/30">
                    <span className="text-purple-200 text-sm font-medium">Winner QF2</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stanley Cup Final Placeholder */}
          <motion.div
            className="mt-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="bg-gradient-to-br from-yellow-800/40 to-amber-700/40 rounded-xl p-4 border border-yellow-600/40 shadow-lg">
              <div className="text-center mb-3">
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold">
                  Stanley Cup Final
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-yellow-700/50 to-amber-600/50 rounded-lg border border-yellow-500/30">
                  <span className="text-yellow-200 text-sm font-medium">Eastern Champion</span>
                </div>
                <div className="flex justify-center">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
                </div>
                <div className="p-3 bg-gradient-to-r from-yellow-700/50 to-amber-600/50 rounded-lg border border-yellow-500/30">
                  <span className="text-yellow-200 text-sm font-medium">Western Champion</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Seeding Legend */}
          <motion.div
            className="mt-8 bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded-xl p-4 border border-slate-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <h4 className="text-slate-200 font-semibold text-lg mb-4 text-center flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Seeding Legend
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs">1</Badge>
                <span className="text-slate-300 text-sm">1st Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-gray-400 to-slate-500 text-white text-xs">2</Badge>
                <span className="text-slate-300 text-sm">2nd Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs">3</Badge>
                <span className="text-slate-300 text-sm">3rd Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">4</Badge>
                <span className="text-slate-300 text-sm">4th Place</span>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
