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
          <div className="space-y-4">
            {teamMatches.map((match) => {
              const isHomeTeam = match.home_team_id === teamId
              const opponent = isHomeTeam ? match.away_team : match.home_team
              const matchDate = new Date(match.match_date)

              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">{matchDate.toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {matchDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {isHomeTeam ? "HOME" : "AWAY"}
                      </Badge>
                      <span>vs {opponent?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {match.status === "Completed" ? (
                      <div className="text-right">
                        <div className="font-bold">
                          {isHomeTeam
                            ? `${match.home_score} - ${match.away_score}`
                            : `${match.away_score} - ${match.home_score}`}
                        </div>
                        <Badge
                          variant={
                            (isHomeTeam && match.home_score > match.away_score) ||
                            (!isHomeTeam && match.away_score > match.home_score)
                              ? "default"
                              : "destructive"
                          }
                        >
                          {(isHomeTeam && match.home_score > match.away_score) ||
                          (!isHomeTeam && match.away_score > match.home_score)
                            ? "WIN"
                            : "LOSS"}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline">{match.status}</Badge>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/matches/${match.id}`}>View</Link>
                    </Button>
                    {match.status === "Scheduled" && (
                      <Button variant="outline" size="sm" asChild>
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
