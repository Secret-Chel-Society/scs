import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import TeamStandings from "@/components/team-standings"
import { calculateStandings, getCurrentSeasonId, getSeasons } from "@/lib/standings-calculator"
import type { TeamStanding } from "@/lib/standings-calculator"

import { Trophy, Crown, Medal, Star, Target, TrendingUp, Users, Award, Zap, Shield, BarChart3 } from "lucide-react"

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
      <Card className="enhanced-card">
        <CardHeader className="enhanced-card-header">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">Playoff Teams</span>
              <p className="text-sm font-normal text-muted-foreground">Top 8 Teams - Clinched</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {playoffTeams.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-hockey-green/10 to-hockey-blue/10 border border-hockey-green/20 hover:border-hockey-green/40 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-hockey-green"
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{team.name}</span>
                    {team.playoff_status === "clinched" && (
                      <Badge className="badge-champion">
                        <Trophy className="h-3 w-3 mr-1" />
                        Clinched
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-hockey-green">{team.points} PTS</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{team.wins}-{team.losses}-{team.otl}</div>
                    <div className="text-xs text-muted-foreground">Record</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {bubbleTeams.length > 0 && (
        <Card className="enhanced-card">
          <CardHeader className="enhanced-card-header">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-hockey-orange to-hockey-gold rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Bubble Teams</span>
                <p className="text-sm font-normal text-muted-foreground">Next 4 Teams - In the Hunt</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {bubbleTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-hockey-orange/10 to-hockey-gold/10 border border-hockey-orange/20 hover:border-hockey-orange/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-hockey-orange"
                    >
                      {index + 9}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{team.name}</span>
                      <Badge className="badge-regular">
                        <Target className="h-3 w-3 mr-1" />
                        Bubble
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-hockey-orange">{team.points} PTS</div>
                      <div className="text-xs text-muted-foreground">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{team.wins}-{team.losses}-{team.otl}</div>
                      <div className="text-xs text-muted-foreground">Record</div>
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

function SeasonSelector({ seasons, currentSeasonId, selectedSeason, onSeasonChange }: {
  seasons: any[]
  currentSeasonId: number
  selectedSeason: number
  onSeasonChange: (seasonId: number) => void
}) {
  return (
    <Card className="enhanced-card mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Season Selection</h3>
              <p className="text-sm text-muted-foreground">Choose which season to view standings for</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => onSeasonChange(season.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedSeason === season.id
                    ? "bg-gradient-to-r from-hockey-blue to-hockey-purple text-white shadow-hockey-lg"
                    : "bg-muted text-muted-foreground hover:bg-hockey-blue/10 hover:text-foreground"
                }`}
              >
                {season.name}
                {season.id === currentSeasonId && (
                  <Badge className="ml-2 bg-white/20 text-white text-xs">Current</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { seasons, currentSeasonId } = await getSeasonsData()
  const selectedSeason = searchParams.season ? parseInt(searchParams.season) : currentSeasonId
  const standings = await getStandingsData(selectedSeason)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-gold/20 via-hockey-blue/20 to-hockey-gold/20 border-b border-hockey-gold/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-gold/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-gold/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-blue/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div 
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-gold to-hockey-blue rounded-xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">League Standings</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Track the race for the playoffs and championship. Every point matters in the competitive 
              Secret Chel Society league.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-gold to-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<StandingsSkeleton />}>
          <SeasonSelector
            seasons={seasons}
            currentSeasonId={currentSeasonId}
            selectedSeason={selectedSeason}
            onSeasonChange={(seasonId) => {
              // This would be handled by the client component
              console.log("Season changed to:", seasonId)
            }}
          />

          <Tabs defaultValue="standings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="standings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-blue data-[state=active]:to-hockey-purple data-[state=active]:text-white"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Full Standings
              </TabsTrigger>
              <TabsTrigger
                value="playoffs"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-green data-[state=active]:to-hockey-blue data-[state=active]:text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Playoff Picture
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standings">
              <div>
                <Card className="enhanced-card">
                  <CardHeader className="enhanced-card-header">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <span>Complete League Standings</span>
                    </CardTitle>
                    <CardDescription>
                      Current standings for Season {selectedSeason}. Teams are ranked by points, with tiebreakers applied.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TeamStandings teams={standings} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="playoffs">
              <div>
                <PlayoffPicture standings={standings} />
              </div>
            </TabsContent>
          </Tabs>

          {/* Season Stats Summary */}
          <div
            className="mt-12"
          >
            <Card className="enhanced-card">
              <CardHeader className="enhanced-card-header">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-hockey-purple to-hockey-blue rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <span>Season {selectedSeason} Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-hockey-blue mb-2">{standings.length}</div>
                    <div className="text-sm text-muted-foreground">Total Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-hockey-green mb-2">
                      {standings.reduce((acc, team) => acc + team.points, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-hockey-purple mb-2">
                      {standings.reduce((acc, team) => acc + team.wins, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-hockey-gold mb-2">
                      {standings.reduce((acc, team) => acc + team.goals_for, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Goals</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Suspense>
      </div>
    </div>
  )
}

function StandingsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="w-full h-24 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="w-full h-96 rounded-2xl" />
        <Skeleton className="w-full h-96 rounded-2xl" />
      </div>
    </div>
  )
}

