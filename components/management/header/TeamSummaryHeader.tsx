"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, Trophy, DollarSign } from "lucide-react"

type Props = {
  teamPlayersCount: number
  projectedRosterSize: number
  scheduledCount: number
  recordText: string
  currentTeamSalary: number
  projectedSalary: number
}

export default function TeamSummaryHeader({
  teamPlayersCount,
  projectedRosterSize,
  scheduledCount,
  recordText,
  currentTeamSalary,
  projectedSalary,
}: Props) {
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
            <div className="text-2xl font-bold">{scheduledCount}</div>
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
            <div className="text-2xl font-bold">{recordText}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Salary Cap</div>
            <div className="text-2xl font-bold">
              ${(currentTeamSalary / 1_000_000).toFixed(1)}M
              {projectedSalary !== currentTeamSalary && (
                <span className="text-sm text-muted-foreground ml-1">
                  → ${(projectedSalary / 1_000_000).toFixed(1)}M
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
