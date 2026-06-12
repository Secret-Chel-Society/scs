"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  teamMatches: any[]
  teamId?: string
  teamName?: string
}

export default function TeamScheduleTab({ teamMatches, teamId, teamName }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Schedule</CardTitle>
        <CardDescription>Upcoming and recent matches for {teamName}</CardDescription>
      </CardHeader>
      <CardContent>
        {teamMatches.length > 0 ? (
          <div className="flex flex-col gap-3">
            {teamMatches.map((match) => {
              const isHomeTeam = match.home_team_id === teamId
              const opponent = isHomeTeam ? match.away_team : match.home_team
              const matchDate = new Date(match.match_date)
              const isCompleted = match.status === "Completed"
              const teamScore = isHomeTeam ? match.home_score : match.away_score
              const oppScore = isHomeTeam ? match.away_score : match.home_score
              const isWin = isCompleted && teamScore > oppScore

              return (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  {/* Left: date + matchup */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Date block */}
                    <div className="flex w-14 flex-col items-center justify-center rounded-md bg-muted px-2 py-1.5 text-center shrink-0">
                      <span className="text-sm font-semibold leading-tight">
                        {matchDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        {matchDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Matchup */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isHomeTeam ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0 font-semibold"
                        >
                          {isHomeTeam ? "HOME" : "AWAY"}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {isHomeTeam ? "vs" : "@"} {opponent?.name ?? "TBD"}
                        </span>
                      </div>
                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold tabular-nums">
                            {teamScore} - {oppScore}
                          </span>
                          <Badge variant={isWin ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                            {isWin ? "WIN" : "LOSS"}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0">
                          {match.status}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent" asChild>
                      <Link href={`/matches/${match.id}`}>View</Link>
                    </Button>
                    {match.status === "Scheduled" && (
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent" asChild>
                        <Link href={`/management/lineups/${match.id}`}>Set Lineup</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No matches scheduled.</div>
        )}
      </CardContent>
    </Card>
  )
}
