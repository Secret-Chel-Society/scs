import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TeamLogo } from "@/components/team-logo"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import type { TeamStanding } from "@/lib/standings-calculator"

interface TeamStandingsProps {
  teams: TeamStanding[]
}

function getStreakColor(streak: string): string {
  if (streak.startsWith("W")) return "bg-gradient-to-r from-assist-green-500 to-assist-green-600"
  if (streak.startsWith("L")) return "bg-gradient-to-r from-goal-red-500 to-goal-red-600"
  if (streak.startsWith("OTL")) return "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600"
  return "bg-gradient-to-r from-hockey-silver-400 to-hockey-silver-500"
}

function getPlayoffStatusIndicator(status?: "clinched" | "eliminated" | "active"): JSX.Element | null {
  if (status === "clinched") {
    return (
      <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white text-xs ml-2 px-2 py-1 rounded-full shadow-md" title="Clinched Playoff Spot">
        <span className="font-bold">X</span>
      </Badge>
    )
  }
  if (status === "eliminated") {
    return (
      <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white text-xs ml-2 px-2 py-1 rounded-full shadow-md" title="Eliminated from Playoffs">
        <span className="font-bold">E</span>
      </Badge>
    )
  }
  return null
}

export default function TeamStandings({ teams }: TeamStandingsProps) {
  if (!teams || teams.length === 0) {
    return <div className="text-center py-8 text-hockey-silver-500 dark:text-hockey-silver-400">No teams found for this season.</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table className="hockey-standings-table">
        <TableHeader>
          <TableRow className="border-hockey-silver-200 dark:border-hockey-silver-700">
            <TableHead className="w-12 text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">#</TableHead>
            <TableHead className="min-w-[220px] text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Team</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">GP</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">W</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">L</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">OTL</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">PTS</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">L10</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">STRK</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">GF</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">GA</TableHead>
            <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">DIFF</TableHead>
            <TableHead className="text-center hidden md:table-cell text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">SPG</TableHead>
            <TableHead className="text-center hidden lg:table-cell text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">PP%</TableHead>
            <TableHead className="text-center hidden lg:table-cell text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">PK%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, index) => (
            <TableRow 
              key={team.id} 
              className="hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20 border-hockey-silver-200 dark:border-hockey-silver-700 transition-all duration-200"
            >
              <TableCell className="font-bold text-center text-hockey-silver-800 dark:text-hockey-silver-200">
                {index + 1}
              </TableCell>
              <TableCell>
                <Link href={`/teams/${team.id}`} className="flex items-center gap-3 hover:underline group">
                  <div className="flex-shrink-0">
                    {team.logo_url ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border border-ice-blue-200 dark:border-rink-blue-700 shadow-md">
                        <Image
                          src={team.logo_url || "/placeholder.svg"}
                          alt={team.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <TeamLogo teamName={team.name} logoUrl={team.logo_url} size="sm" />
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold truncate text-hockey-silver-800 dark:text-hockey-silver-200 group-hover:text-ice-blue-600 dark:group-hover:text-ice-blue-400 transition-colors duration-200">
                      {team.name}
                    </span>
                    {getPlayoffStatusIndicator(team.playoff_status)}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">
                {team.games_played}
              </TableCell>
              <TableCell className="text-center font-bold text-assist-green-700 dark:text-assist-green-300">
                {team.wins}
              </TableCell>
              <TableCell className="text-center font-bold text-goal-red-700 dark:text-goal-red-300">
                {team.losses}
              </TableCell>
              <TableCell className="text-center font-bold text-hockey-silver-700 dark:text-hockey-silver-300">
                {team.otl}
              </TableCell>
              <TableCell className="text-center font-bold text-2xl text-ice-blue-700 dark:text-ice-blue-300">
                {team.points}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                <span className="bg-gradient-to-r from-hockey-silver-100 to-ice-blue-100 dark:from-hockey-silver-800/50 dark:to-ice-blue-900/30 px-3 py-1 rounded-lg text-xs font-medium text-hockey-silver-700 dark:text-hockey-silver-300 border border-hockey-silver-200 dark:border-hockey-silver-600">
                  {team.last_10 || "0-0-0"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {team.current_streak && team.current_streak !== "-" ? (
                  <Badge className={`text-white text-xs px-2 py-1 rounded-full shadow-md font-bold ${getStreakColor(team.current_streak)}`}>
                    {team.current_streak}
                  </Badge>
                ) : (
                  <span className="text-hockey-silver-400 dark:text-hockey-silver-500">-</span>
                )}
              </TableCell>
              <TableCell className="text-center font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                {team.goals_for}
              </TableCell>
              <TableCell className="text-center font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                {team.goals_against}
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-bold text-lg ${team.goal_differential >= 0 ? "text-assist-green-600 dark:text-assist-green-400" : "text-goal-red-600 dark:text-goal-red-400"}`}>
                  {team.goal_differential >= 0 ? "+" : ""}
                  {team.goal_differential}
                </span>
              </TableCell>
              <TableCell className="text-center hidden md:table-cell font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                {team.shots_per_game?.toFixed(1) || "0.0"}
              </TableCell>
              <TableCell className="text-center hidden lg:table-cell font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                {team.powerplay_percentage ? `${team.powerplay_percentage.toFixed(1)}%` : "0.0%"}
              </TableCell>
              <TableCell className="text-center hidden lg:table-cell font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                {team.penalty_kill_percentage ? `${team.penalty_kill_percentage.toFixed(1)}%` : "0.0%"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
