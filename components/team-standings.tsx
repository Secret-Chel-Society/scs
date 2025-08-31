import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TeamLogo } from "@/components/team-logo"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
// import { motion } from "framer-motion"
import { Trophy, TrendingUp, TrendingDown, Minus, Target, Medal } from "lucide-react"
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
      <Badge variant="default" className="bg-green-600/20 text-green-300 border-green-500/30 text-xs ml-2">
        <Trophy className="h-3 w-3 mr-1" />
        CLINCHED
      </Badge>
    )
  }
  if (status === "eliminated") {
    return (
      <Badge variant="destructive" className="bg-red-600/20 text-red-300 border-red-500/30 text-xs ml-2">
        <Minus className="h-3 w-3 mr-1" />
        ELIMINATED
      </Badge>
    )
  }
  return null
}

function getPositionBadge(position: number): JSX.Element {
  if (position <= 3) {
    const colors = {
      1: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      2: "bg-gray-400/20 text-gray-300 border-gray-400/30", 
      3: "bg-orange-600/20 text-orange-300 border-orange-600/30"
    }
    return (
      <Badge className={`${colors[position as keyof typeof colors]} text-xs font-bold`}>
        <Medal className="h-3 w-3 mr-1" />
        {position}
      </Badge>
    )
  }
  return (
    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs font-bold">
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
              <TableRow className="border-white/10 hover:bg-white/5">
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
                <tr 
                  key={team.id} 
                  className="border-white/10 hover:bg-white/10 transition-colors duration-200"
                >
                  <TableCell className="text-center">
                    {getPositionBadge(index + 1)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/teams/${team.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="flex-shrink-0">
                        {team.logo_url ? (
                          <div className="relative h-10 w-10">
                            <Image
                              src={team.logo_url || "/placeholder.svg"}
                              alt={team.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <TeamLogo teamName={team.name} size="md" />
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-white truncate">{team.name}</span>
                        {getPlayoffStatusIndicator(team.playoff_status)}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center text-white font-medium">{team.games_played}</TableCell>
                  <TableCell className="text-center text-green-400 font-semibold">{team.wins}</TableCell>
                  <TableCell className="text-center text-red-400 font-semibold">{team.losses}</TableCell>
                  <TableCell className="text-center text-orange-400 font-semibold">{team.otl}</TableCell>
                  <TableCell className="text-center font-bold text-2xl text-blue-400">{team.points}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs font-mono">
                      {team.last_10 || "0-0-0"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {team.current_streak && team.current_streak !== "-" ? (
                      <Badge className={`text-xs font-bold ${getStreakColor(team.current_streak)}`}>
                        {team.current_streak.startsWith("W") && <TrendingUp className="h-3 w-3 mr-1" />}
                        {team.current_streak.startsWith("L") && <TrendingDown className="h-3 w-3 mr-1" />}
                        {team.current_streak}
                      </Badge>
                    ) : (
                      <span className="text-white/50">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-green-400 font-semibold">{team.goals_for}</TableCell>
                  <TableCell className="text-center text-red-400 font-semibold">{team.goals_against}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${team.goal_differential >= 0 ? "text-green-400" : "text-red-400"}`}>
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
                </tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
