import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import TeamStandings from "@/components/team-standings"
import { calculateStandings, getCurrentSeasonId, getSeasons } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"
import { Trophy, Target, TrendingUp, Medal, Crown, Award, Users, BarChart3 } from "lucide-react"

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
    <div className="space-y-8">
      {/* Playoff Teams */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-600/5">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Crown className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-2xl text-green-600">Playoff Teams</CardTitle>
              <CardDescription className="text-green-500/70">Top 8 Teams - Championship Contenders</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {playoffTeams.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 hover:bg-green-500/15 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-green-500/50 text-green-600 bg-green-500/10"
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg text-green-700 dark:text-green-300">{team.name}</span>
                    {team.playoff_status === "clinched" && (
                      <Badge
                        variant="default"
                        className="bg-green-600 text-white text-xs px-2 py-1"
                        title="Clinched Playoff Spot"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        CLINCHED
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">{team.points}</div>
                    <div className="text-xs text-green-600/70">POINTS</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-700 dark:text-green-300">
                      {team.wins}-{team.losses}-{team.otl}
                    </div>
                    <div className="text-xs text-green-600/70">RECORD</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bubble Teams */}
      {bubbleTeams.length > 0 && (
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-600/5">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-orange-600">Bubble Teams</CardTitle>
                <CardDescription className="text-orange-500/70">Fighting for Final Playoff Spots</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {bubbleTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 hover:bg-orange-500/15 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-orange-500/50 text-orange-600 bg-orange-500/10"
                    >
                      {playoffTeams.length + index + 1}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg text-orange-700 dark:text-orange-300">{team.name}</span>
                      {team.playoff_status === "eliminated" && (
                        <Badge
                          variant="destructive"
                          className="bg-red-600 text-white text-xs px-2 py-1"
                          title="Eliminated from Playoffs"
                        >
                          ELIMINATED
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-700 dark:text-orange-300">{team.points}</div>
                      <div className="text-xs text-orange-600/70">POINTS</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-700 dark:text-orange-300">
                        {team.wins}-{team.losses}-{team.otl}
                      </div>
                      <div className="text-xs text-orange-600/70">RECORD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-orange-600 font-medium">
                        {playoffTeams[playoffTeams.length - 1].points - team.points} pts back
                      </div>
                      <div className="text-xs text-orange-600/70">FROM 8TH</div>
                    </div>
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
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Medal className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-2xl text-blue-600">{conference1Name}</CardTitle>
              <CardDescription className="text-blue-500/70">{conference1Teams.length} teams</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamStandings teams={conference1Teams} />
        </CardContent>
      </Card>

      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-600/5">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Award className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-2xl text-purple-600">{conference2Name}</CardTitle>
              <CardDescription className="text-purple-500/70">{conference2Teams.length} teams</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamStandings teams={conference2Teams} />
        </CardContent>
      </Card>
    </div>
  )
}

function StandingsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  )
}

async function StandingsContent({ seasonId }: { seasonId: number }) {
  const standings = await getStandingsData(seasonId)

  if (!standings || standings.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Standings Available</h3>
            <p className="text-muted-foreground">No team data found for this season.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="overall" className="space-y-8">
      <TabsList className="grid w-full grid-cols-3 p-2 bg-muted/50 backdrop-blur-sm rounded-xl">
        <TabsTrigger value="overall" className="py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg">
          <BarChart3 className="h-5 w-5 mr-2" />
          Overall Standings
        </TabsTrigger>
        <TabsTrigger value="conference" className="py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg">
          <Users className="h-5 w-5 mr-2" />
          Conference
        </TabsTrigger>
        <TabsTrigger value="playoffs" className="py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg">
          <Trophy className="h-5 w-5 mr-2" />
          Playoff Picture
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">League Standings</CardTitle>
                <CardDescription className="text-lg">
                  Complete standings for all teams in the league
                </CardDescription>
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600 text-white text-xs px-2 py-1">
                      <Trophy className="h-3 w-3 mr-1" />
                      CLINCHED
                    </Badge>
                    <span className="text-muted-foreground">Playoff Spot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="bg-red-600 text-white text-xs px-2 py-1">
                      ELIMINATED
                    </Badge>
                    <span className="text-muted-foreground">From Playoffs</span>
                  </div>
                </div>
              </div>
            </div>
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
    </Tabs>
  )
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { seasons, currentSeasonId } = await getSeasonsData()
  const selectedSeasonId = searchParams.season ? Number.parseInt(searchParams.season) : currentSeasonId

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                League Standings
              </h1>
            </div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Current team standings, conference rankings, and playoff picture for the Secret Chel Society
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mt-6" />
          </div>

          <Suspense fallback={<StandingsLoadingSkeleton />}>
            <StandingsContent seasonId={selectedSeasonId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
