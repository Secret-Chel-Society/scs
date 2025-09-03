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
    <div className="space-y-10">
      {/* Championship Playoff Teams */}
      <Card className="border-2 border-green-500/40 bg-gradient-to-br from-background via-green-500/8 to-green-600/8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-50" />
        
        <CardHeader className="pb-8 pt-8 relative">
          <div className="flex items-center gap-6">
            <div className="relative p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-xl opacity-90" />
              <Crown className="h-8 w-8 text-white relative z-10" />
              <div className="absolute -inset-1 bg-gradient-to-br from-green-500 to-green-600 rounded-xl blur opacity-40" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Championship Playoff Teams
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground font-medium">
                Top 8 Teams - Elite Championship Contenders
              </CardDescription>
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

      {/* Championship Bubble Teams */}
      {bubbleTeams.length > 0 && (
        <Card className="border-2 border-orange-500/40 bg-gradient-to-br from-background via-orange-500/8 to-orange-600/8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 opacity-50" />
          
          <CardHeader className="pb-8 pt-8 relative">
            <div className="flex items-center gap-6">
              <div className="relative p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl opacity-90" />
                <Target className="h-8 w-8 text-white relative z-10" />
                <div className="absolute -inset-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl blur opacity-40" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Championship Bubble Teams
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground font-medium">
                  Fighting for Final Championship Positions
                </CardDescription>
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
    <div className="grid gap-10 lg:grid-cols-2">
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-30" />
        
        <CardHeader className="pb-8 pt-8 relative">
          <div className="flex items-center gap-6">
            <div className="relative p-4 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl opacity-90" />
              <Medal className="h-8 w-8 text-white relative z-10" />
              <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-xl blur opacity-40" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {conference1Name}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground font-medium">
                {conference1Teams.length} championship teams
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-8">
          <TeamStandings teams={conference1Teams} />
        </CardContent>
      </Card>

      <Card className="border-2 border-secondary/30 bg-gradient-to-br from-background via-secondary/5 to-primary/5 shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-30" />
        
        <CardHeader className="pb-8 pt-8 relative">
          <div className="flex items-center gap-6">
            <div className="relative p-4 bg-gradient-to-br from-secondary to-primary rounded-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-xl opacity-90" />
              <Award className="h-8 w-8 text-white relative z-10" />
              <div className="absolute -inset-1 bg-gradient-to-br from-secondary to-primary rounded-xl blur opacity-40" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                {conference2Name}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground font-medium">
                {conference2Teams.length} championship teams
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-8">
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
    <Tabs defaultValue="overall" className="space-y-12">
      <div className="bg-background/80 backdrop-blur-lg border-2 border-primary/20 p-4 rounded-2xl shadow-2xl">
        <TabsList className="grid w-full grid-cols-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-lg rounded-xl border border-primary/20">
          <TabsTrigger value="overall" className="py-4 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            Overall Standings
          </TabsTrigger>
          <TabsTrigger value="conference" className="py-4 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-3">
            <Users className="h-6 w-6" />
            Conference
          </TabsTrigger>
          <TabsTrigger value="playoffs" className="py-4 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-3">
            <Trophy className="h-6 w-6" />
            Playoff Picture
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overall" className="space-y-8">
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />
          
          <CardHeader className="pb-8 pt-8 relative">
            <div className="flex items-center gap-6">
              <div className="relative p-4 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl opacity-90" />
                <TrendingUp className="h-8 w-8 text-white relative z-10" />
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-xl blur opacity-40" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Championship League Standings
                </CardTitle>
                <CardDescription className="text-xl text-muted-foreground mt-2">
                  Complete standings for all professional franchises in the league
                </CardDescription>
                <div className="flex items-center gap-8 mt-6 text-base">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
                      <Trophy className="h-4 w-4 mr-2" />
                      CLINCHED
                    </Badge>
                    <span className="text-muted-foreground font-medium">Playoff Position</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
                      ELIMINATED
                    </Badge>
                    <span className="text-muted-foreground font-medium">From Championship</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative p-8">
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
    <div className="min-h-screen relative overflow-hidden bg-background pt-4">
      {/* Professional Hockey Championship Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/8" />
        
        {/* Championship floating elements */}
        <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-primary/25 to-secondary/25 rounded-full shadow-xl animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="space-y-12">
          {/* Enhanced Professional Championship Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-6 mb-8">
              <div className="relative p-6 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
                <Trophy className="h-12 w-12 text-white relative z-10" />
                <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Championship Standings
              </h1>
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-secondary rounded-full" />
              <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
              <div className="h-1 w-32 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full" />
            </div>
            
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Current <span className="font-bold text-primary">team standings</span>, conference rankings, and playoff picture for the <span className="font-semibold text-secondary">Secret Chel Society Championship</span>
            </p>
          </div>

          <Suspense fallback={<StandingsLoadingSkeleton />}>
            <StandingsContent seasonId={selectedSeasonId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
