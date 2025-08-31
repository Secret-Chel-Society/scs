import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import TeamStandings from "@/components/team-standings"
import { PlayoffBracket } from "@/components/standings/playoff-bracket"
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
      <Card className="bg-gradient-to-br from-slate-800/90 via-green-900/20 to-slate-800/90 border-gradient-to-r from-green-500/30 to-emerald-500/30 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600">
              Playoff Teams
            </Badge>
            <span className="text-sm font-normal text-slate-300">Top 8 Teams</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid gap-2">
            {playoffTeams.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/50 text-green-300"
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{team.name}</span>
                    {team.playoff_status === "clinched" && (
                      <Badge
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs"
                        title="Clinched Playoff Spot"
                      >
                        X
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-green-300">{team.points} PTS</span>
                  <span className="text-slate-300">
                    <span className="text-green-400">{team.wins}</span>-
                    <span className="text-red-400">{team.losses}</span>-
                    <span className="text-yellow-400">{team.otl}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {bubbleTeams.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-800/90 via-orange-900/20 to-slate-800/90 border-gradient-to-r from-orange-500/30 to-red-500/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-orange-600 to-red-600">
                Bubble Teams
              </Badge>
              <span className="text-sm font-normal text-slate-300">Fighting for Playoff Spots</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-2">
              {bubbleTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/50 text-orange-300"
                    >
                      {playoffTeams.length + index + 1}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{team.name}</span>
                      {team.playoff_status === "eliminated" && (
                        <Badge
                          className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs"
                          title="Eliminated from Playoffs"
                        >
                          E
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-orange-300">{team.points} PTS</span>
                    <span className="text-slate-300">
                      <span className="text-green-400">{team.wins}</span>-
                      <span className="text-red-400">{team.losses}</span>-
                      <span className="text-yellow-400">{team.otl}</span>
                    </span>
                    <span className="text-xs text-orange-400 font-medium">
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
  // Group teams by conference/division
  const nhlTeams = standings.filter((team) => team.division === "NHL" || team.conference === "NHL")
  const customTeams = standings.filter((team) => team.division === "Custom" || team.conference === "Custom")

  // If no division data, split teams roughly in half
  const hasConferenceData = nhlTeams.length > 0 || customTeams.length > 0

  const conference1Teams = hasConferenceData ? nhlTeams : standings.slice(0, Math.ceil(standings.length / 2))
  const conference2Teams = hasConferenceData ? customTeams : standings.slice(Math.ceil(standings.length / 2))

  const conference1Name = hasConferenceData ? "NHL Conference" : "Eastern Conference"
  const conference2Name = hasConferenceData ? "Custom Conference" : "Western Conference"

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-gradient-to-br from-slate-800/90 via-blue-900/20 to-slate-800/90 border-gradient-to-r from-blue-500/30 to-cyan-500/30 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
        <CardHeader className="relative">
          <CardTitle className="text-blue-300">{conference1Name}</CardTitle>
          <CardDescription className="text-slate-300">{conference1Teams.length} teams</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <TeamStandings teams={conference1Teams} />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800/90 via-purple-900/20 to-slate-800/90 border-gradient-to-r from-purple-500/30 to-pink-500/30 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
        <CardHeader className="relative">
          <CardTitle className="text-purple-300">{conference2Name}</CardTitle>
          <CardDescription className="text-slate-300">{conference2Teams.length} teams</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <TeamStandings teams={conference2Teams} />
        </CardContent>
      </Card>
    </div>
  )
}

function StandingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-background/30" />
        <Skeleton className="h-4 w-96 bg-background/30" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full bg-background/30" />
        <Skeleton className="h-64 w-full bg-background/30" />
      </div>
    </div>
  )
}

async function StandingsContent({ seasonId }: { seasonId: number }) {
  const standings = await getStandingsData(seasonId)

  if (!standings || standings.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/50 to-purple-900/20 border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-300">No Standings Available</h3>
            <p className="text-sm text-slate-400 mt-2">No team data found for this season.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="overall" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-800/50 to-purple-900/20 border-primary/20">
        <TabsTrigger value="overall" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20">Overall Standings</TabsTrigger>
        <TabsTrigger value="conference" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20">Conference</TabsTrigger>
        <TabsTrigger value="playoffs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20">Playoff Picture</TabsTrigger>
        <TabsTrigger value="bracket" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20">Playoff Bracket</TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-800/90 via-blue-900/20 to-slate-800/90 border-gradient-to-r from-blue-500/30 to-cyan-500/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
          <CardHeader className="relative">
            <CardTitle className="text-blue-300">League Standings</CardTitle>
            <CardDescription className="text-slate-300">
              Complete standings for all teams in the league
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs">
                    X
                  </Badge>
                  <span className="text-slate-300">Clinched Playoff Spot</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs">
                    E
                  </Badge>
                  <span className="text-slate-300">Eliminated from Playoffs</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
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

      <TabsContent value="bracket" className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-800/90 via-orange-900/20 to-slate-800/90 border-gradient-to-r from-orange-500/30 to-red-500/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10" />
          <CardContent className="relative">
            <PlayoffBracket seasonId={seasonId} />
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              League Standings
            </h1>
            <p className="text-slate-300 text-lg">Current team standings, conference rankings, and playoff picture</p>
          </div>

          <Suspense fallback={<StandingsLoadingSkeleton />}>
            <StandingsContent seasonId={selectedSeasonId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
