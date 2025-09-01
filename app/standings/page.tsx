import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import TeamStandings from "@/components/team-standings"
import { calculateStandings, getCurrentSeasonId, getSeasons } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"

interface StandingsPageProps {
  searchParams: { season?: string }
}

async function getStandingsData(seasonId: number) {
  try {
    const standings = await calculateStandings(seasonId)
    return standings
  } catch (error) {
    console.error("Error fetching standings:", error)
    return []
  }
}

async function getSeasonsData() {
  try {
    const seasons = await getSeasons()
    const currentSeasonId = await getCurrentSeasonId()
    return { seasons, currentSeasonId }
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return { seasons: [], currentSeasonId: 1 }
  }
}

function PlayoffPicture({ standings }: { standings: TeamStanding[] }) {
  // Sort teams by points for playoff seeding
  const sortedTeams = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
    return b.goals_for - a.goals_for
  })

  const playoffTeams = sortedTeams.slice(0, 8) // Top 8 teams make playoffs
  const bubbleTeams = sortedTeams.slice(8, 12) // Next 4 teams in the hunt

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              Playoff Teams
            </Badge>
            <span className="text-sm font-normal text-muted-foreground">Top 8 Teams</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {playoffTeams.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{team.name}</span>
                    {team.playoff_status === "clinched" && (
                      <Badge
                        variant="default"
                        className="bg-green-600 text-white text-xs"
                        title="Clinched Playoff Spot"
                      >
                        X
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold">{team.points} PTS</span>
                  <span className="text-muted-foreground">
                    {team.wins}-{team.losses}-{team.otl}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {bubbleTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-orange-600">
                Bubble Teams
              </Badge>
              <span className="text-sm font-normal text-muted-foreground">Fighting for Playoff Spots</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {bubbleTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      {playoffTeams.length + index + 1}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{team.name}</span>
                      {team.playoff_status === "eliminated" && (
                        <Badge
                          variant="destructive"
                          className="bg-red-600 text-white text-xs"
                          title="Eliminated from Playoffs"
                        >
                          E
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">{team.points} PTS</span>
                    <span className="text-muted-foreground">
                      {team.wins}-{team.losses}-{team.otl}
                    </span>
                    <span className="text-xs text-orange-600 font-medium">
                      {playoffTeams[playoffTeams.length - 1].points - team.points} pts back
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ConferenceStandings({ standings }: { standings: TeamStanding[] }) {
  // Group teams by conference
  const easternTeams = standings.filter((team) => team.conference === "Eastern Elites")
  const westernTeams = standings.filter((team) => team.conference === "Western Warriors")
  const unassignedTeams = standings.filter((team) => !team.conference || team.conference === "Unassigned")

  return (
    <div className="space-y-6">
      {easternTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eastern Elites Conference</CardTitle>
            <CardDescription>{easternTeams.length} teams</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={easternTeams} />
          </CardContent>
        </Card>
      )}

      {westernTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Western Warriors Conference</CardTitle>
            <CardDescription>{westernTeams.length} teams</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={westernTeams} />
          </CardContent>
        </Card>
      )}

      {unassignedTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Teams</CardTitle>
            <CardDescription>{unassignedTeams.length} teams need conference assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={unassignedTeams} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StandingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

async function StandingsContent({ seasonId }: { seasonId: number }) {
  const standings = await getStandingsData(seasonId)

  if (!standings || standings.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No Standings Available</h3>
            <p className="text-sm text-muted-foreground mt-2">No team data found for this season.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="overall" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overall">Overall Standings</TabsTrigger>
        <TabsTrigger value="conference">Conference</TabsTrigger>
        <TabsTrigger value="playoffs">Playoff Picture</TabsTrigger>
        <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>League Standings</CardTitle>
            <CardDescription>
              Complete standings for all teams in the league
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <Badge variant="default" className="bg-green-600 text-white text-xs">
                    X
                  </Badge>
                  <span>Clinched Playoff Spot</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="destructive" className="bg-red-600 text-white text-xs">
                    E
                  </Badge>
                  <span>Eliminated from Playoffs</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={standings} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="conference" className="space-y-6">
        <ConferenceStandings standings={standings} />
      </TabsContent>

      <TabsContent value="playoffs" className="space-y-6">
        <PlayoffPicture standings={standings} />
      </TabsContent>

      <TabsContent value="unassigned" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Teams</CardTitle>
            <CardDescription>Teams that need to be assigned to a conference</CardDescription>
          </CardHeader>
          <CardContent>
            {standings.filter(team => !team.conference || team.conference === "Unassigned").length > 0 ? (
              <TeamStandings teams={standings.filter(team => !team.conference || team.conference === "Unassigned")} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">All teams have been assigned to conferences.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { seasons, currentSeasonId } = await getSeasonsData()
  const selectedSeasonId = searchParams.season ? Number.parseInt(searchParams.season) : currentSeasonId

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">League Standings</h1>
          <p className="text-muted-foreground">Current team standings, conference rankings, and playoff picture</p>
        </div>

        <Suspense fallback={<StandingsLoadingSkeleton />}>
          <StandingsContent seasonId={selectedSeasonId} />
        </Suspense>
      </div>
    </div>
  )
}
