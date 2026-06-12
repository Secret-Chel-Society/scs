"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, Trophy, DollarSign } from "lucide-react"

type Props = {
  teamData?: any
  teamPlayersCount: number
  projectedRosterSize: number
  scheduledMatchesCount?: number
  scheduledCount?: number
  recordText?: string
  currentTeamSalary: number
  projectedSalary: number
  retainedSalary?: number
  salaryFines?: number
}

export default function TeamSummaryHeader({
  teamData,
  teamPlayersCount,
  projectedRosterSize,
  scheduledMatchesCount,
  scheduledCount,
  recordText,
  currentTeamSalary,
  projectedSalary,
  retainedSalary = 0,
  salaryFines = 0,
}: Props) {
  // Support both prop names
  const upcomingMatches = scheduledMatchesCount ?? scheduledCount ?? 0
  const record = recordText ?? (teamData ? `${teamData.wins ?? 0}-${teamData.losses ?? 0}-${teamData.otl ?? 0}` : "0-0-0")
  const totalCapImpact = retainedSalary + salaryFines
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Team Size</div>
            <div className="text-2xl font-bold">
              {teamPlayersCount}
              {projectedRosterSize !== teamPlayersCount && (
                <span className="text-sm text-muted-foreground ml-1">→ {projectedRosterSize}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Upcoming Matches</div>
            <div className="text-2xl font-bold">{upcomingMatches}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Record</div>
            <div className="text-2xl font-bold">{record}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              Salary Cap
              {retainedSalary > 0 && (
                <span className="text-amber-500 ml-1">
                  (+${(retainedSalary / 1_000_000).toFixed(1)}M retained)
                </span>
              )}
              {salaryFines > 0 && (
                <span className="text-red-500 ml-1">
                  (+${(salaryFines / 1_000_000).toFixed(1)}M fines)
                </span>
              )}
            </div>
            <div className="text-2xl font-bold">
              ${((currentTeamSalary + totalCapImpact) / 1_000_000).toFixed(1)}M
              {projectedSalary !== currentTeamSalary && (
                <span className="text-sm text-muted-foreground ml-1">
                  → ${((projectedSalary + totalCapImpact) / 1_000_000).toFixed(1)}M
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
