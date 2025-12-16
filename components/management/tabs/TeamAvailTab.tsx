"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamAvailabilityTab } from "@/components/management/team-availability-tab"

type Props = { teamId?: string; teamName?: string }

export default function TeamAvailTab({ teamId, teamName }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Availability</CardTitle>
        <CardDescription>View your team's availability for upcoming games</CardDescription>
      </CardHeader>
      <CardContent>
        {teamId ? (
          <TeamAvailabilityTab teamId={teamId} teamName={teamName || ""} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">Loading team data...</div>
        )}
      </CardContent>
    </Card>
  )
}
