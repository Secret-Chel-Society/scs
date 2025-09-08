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
  if (streak.startsWith("W")) return "bg-green-500"
  if (streak.startsWith("L")) return "bg-red-500"
  if (streak.startsWith("OTL")) return "bg-orange-500"
  return "bg-gray-400"
}

function getPlayoffStatusIndicator(status?: "clinched" | "eliminated" | "active"): JSX.Element | null {
  if (status === "clinched") {
    return (
      <Badge variant="default" className="bg-green-600 text-white text-xs ml-2" title="Clinched Playoff Spot">
        X
      </Badge>
    )
  }
  if (status === "eliminated") {
    return (
      <Badge variant="destructive" className="bg-red-600 text-white text-xs ml-2" title="Eliminated from Playoffs">
        E
      </Badge>
    )
  }
  return null
}

export default function TeamStandings({ teams }: TeamStandingsProps) {
  if (!teams || teams.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No teams found for this season.</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">#</TableHead>
            <TableHead className="min-w-[200px]">Team</TableHead>
            <TableHead className="text-center">GP</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">OTL</TableHead>
            <TableHead className="text-center">PTS</TableHead>
            <TableHead className="text-center">L10</TableHead>
            <TableHead className="text-center">STRK</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">DIFF</TableHead>
            <TableHead className="text-center hidden md:table-cell">SPG</TableHead>
            <TableHead className="text-center hidden lg:table-cell">PP%</TableHead>
            <TableHead className="text-center hidden lg:table-cell">PK%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, index) => (
            <TableRow key={team.id} className="hover:bg-muted/50">
              <TableCell className="font-medium text-center">{index + 1}</TableCell>
              <TableCell>
                <Link href={`/teams/${team.id}`} className="flex items-center gap-3 hover:underline">
                  <div className="flex-shrink-0">
                    {team.logo_url ? (
                      <div className="relative h-8 w-8">
                        <Image
                          src={team.logo_url || "/placeholder.svg"}
                          alt={team.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <TeamLogo teamName={team.name} size="sm" />
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium truncate">{team.name}</span>
                    {getPlayoffStatusIndicator(team.playoff_status)}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-center">{team.games_played}</TableCell>
              <TableCell className="text-center font-medium">{team.wins}</TableCell>
              <TableCell className="text-center">{team.losses}</TableCell>
              <TableCell className="text-center">{team.otl}</TableCell>
              <TableCell className="text-center font-bold">{team.points}</TableCell>
              <TableCell className="text-center font-mono text-sm">
                <span className="bg-muted/50 px-2 py-1 rounded text-xs">{team.last_10 || "0-0-0"}</span>
              </TableCell>
              <TableCell className="text-center">
                {team.current_streak && team.current_streak !== "-" ? (
                  <Badge variant="secondary" className={`text-white text-xs ${getStreakColor(team.current_streak)}`}>
                    {team.current_streak}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">{team.goals_for}</TableCell>
              <TableCell className="text-center">{team.goals_against}</TableCell>
              <TableCell className="text-center">
                <span className={team.goal_differential >= 0 ? "text-green-600" : "text-red-600"}>
                  {team.goal_differential >= 0 ? "+" : ""}
                  {team.goal_differential}
                </span>
              </TableCell>
              <TableCell className="text-center hidden md:table-cell">
                {team.shots_per_game?.toFixed(1) || "0.0"}
              </TableCell>
              <TableCell className="text-center hidden lg:table-cell">
                {team.powerplay_percentage ? `${team.powerplay_percentage.toFixed(1)}%` : "0.0%"}
              </TableCell>
              <TableCell className="text-center hidden lg:table-cell">
                {team.penalty_kill_percentage ? `${team.penalty_kill_percentage.toFixed(1)}%` : "0.0%"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
