"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TeamLogo } from "@/components/team-logo"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Trophy, TrendingUp, TrendingDown, Minus, Target, Medal, Crown, Star } from "lucide-react"
import type { TeamStanding } from "@/lib/standings-calculator"

interface TeamStandingsProps {
  teams: TeamStanding[]
}

function getStreakColor(streak: string): string {
  if (streak.startsWith("W")) return "bg-green-500/20 text-green-300 border-green-500/30"
  if (streak.startsWith("L")) return "bg-red-500/20 text-red-300 border-red-500/30"
  if (streak.startsWith("OTL")) return "bg-orange-500/20 text-orange-300 border-orange-500/30"
  return "bg-gray-500/20 text-gray-300 border-gray-500/30"
}

function getPlayoffStatusIndicator(status?: "clinched" | "eliminated" | "active"): JSX.Element | null {
  if (status === "clinched") {
    return (
      <Badge variant="default" className="bg-green-600/20 text-green-300 border-green-500/30 text-xs ml-2 flex items-center gap-1">
        <Trophy className="h-3 w-3" />
        CLINCHED
      </Badge>
    )
  }
  if (status === "eliminated") {
    return (
      <Badge variant="destructive" className="bg-red-600/20 text-red-300 border-red-500/30 text-xs ml-2 flex items-center gap-1">
        <Minus className="h-3 w-3" />
        ELIMINATED
      </Badge>
    )
  }
  return null
}

function getPositionBadge(position: number): JSX.Element {
  if (position <= 3) {
    const colors = {
      1: "bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 border-yellow-500/50",
      2: "bg-gradient-to-r from-gray-400/30 to-slate-400/30 text-gray-300 border-gray-400/50", 
      3: "bg-gradient-to-r from-orange-600/30 to-red-600/30 text-orange-300 border-orange-600/50"
    }
    return (
      <Badge className={`${colors[position as keyof typeof colors]} text-xs font-bold flex items-center gap-1`}>
        <Medal className="h-3 w-3" />
        {position}
      </Badge>
    )
  }
  return (
    <Badge className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-slate-300 border-slate-600/50 text-xs font-bold">
      {position}
    </Badge>
  )
}

export default function TeamStandings({ teams }: TeamStandingsProps) {
  if (!teams || teams.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-white/20">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full">
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-white/70">No teams found for this season.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5 transition-colors duration-200">
                <TableHead className="w-12 text-center text-white/70 font-semibold">#</TableHead>
                <TableHead className="min-w-[250px] text-white/70 font-semibold">Team</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">GP</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">W</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">L</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">OTL</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">PTS</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">L10</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">STRK</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">GF</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">GA</TableHead>
                <TableHead className="text-center text-white/70 font-semibold">DIFF</TableHead>
                <TableHead className="text-center hidden md:table-cell text-white/70 font-semibold">SPG</TableHead>
                <TableHead className="text-center hidden lg:table-cell text-white/70 font-semibold">PP%</TableHead>
                <TableHead className="text-center hidden lg:table-cell text-white/70 font-semibold">PK%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, index) => (
                <motion.tr 
                  key={team.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="border-white/10 hover:bg-white/10 transition-all duration-200 group"
                >
                  <TableCell className="text-center">
                    {getPositionBadge(index + 1)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/teams/${team.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="flex-shrink-0">
                        {team.logo_url ? (
                          <div className="relative h-10 w-10 group-hover:scale-110 transition-transform duration-200">
                            <Image
                              src={team.logo_url || "/placeholder.svg"}
                              alt={team.name}
                              fill
                              className="object-contain drop-shadow-lg"
                            />
                          </div>
                        ) : (
                          <div className="group-hover:scale-110 transition-transform duration-200">
                            <TeamLogo teamName={team.name} size="md" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-white truncate group-hover:text-purple-200 transition-colors">{team.name}</span>
                        {getPlayoffStatusIndicator(team.playoff_status)}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center text-white font-medium">{team.games_played}</TableCell>
                  <TableCell className="text-center text-green-400 font-semibold">{team.wins}</TableCell>
                  <TableCell className="text-center text-red-400 font-semibold">{team.losses}</TableCell>
                  <TableCell className="text-center text-orange-400 font-semibold">{team.otl}</TableCell>
                  <TableCell className="text-center font-bold text-2xl text-blue-400 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg px-2 py-1">
                    {team.points}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-slate-300 border-slate-600/50 text-xs font-mono">
                      {team.last_10 || "0-0-0"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {team.current_streak && team.current_streak !== "-" ? (
                      <Badge className={`text-xs font-bold ${getStreakColor(team.current_streak)} flex items-center gap-1`}>
                        {team.current_streak.startsWith("W") && <TrendingUp className="h-3 w-3" />}
                        {team.current_streak.startsWith("L") && <TrendingDown className="h-3 w-3" />}
                        {team.current_streak}
                      </Badge>
                    ) : (
                      <span className="text-white/50">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-green-400 font-semibold">{team.goals_for}</TableCell>
                  <TableCell className="text-center text-red-400 font-semibold">{team.goals_against}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold px-2 py-1 rounded-lg ${
                      team.goal_differential >= 0 
                        ? "text-green-400 bg-green-500/10 border border-green-400/20" 
                        : "text-red-400 bg-red-500/10 border border-red-400/20"
                    }`}>
                      {team.goal_differential >= 0 ? "+" : ""}
                      {team.goal_differential}
                    </span>
                  </TableCell>
                  <TableCell className="text-center hidden md:table-cell text-white/80">
                    {team.shots_per_game?.toFixed(1) || "0.0"}
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell text-white/80">
                    {team.powerplay_percentage ? `${team.powerplay_percentage.toFixed(1)}%` : "0.0%"}
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell text-white/80">
                    {team.penalty_kill_percentage ? `${team.penalty_kill_percentage.toFixed(1)}%` : "0.0%"}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
