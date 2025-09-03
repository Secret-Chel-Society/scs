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
              <Badge variant="secondary" className="bg-yellow-600">
                Bubble Teams
              </Badge>
              <span className="text-sm font-normal text-muted-foreground">Teams in the Hunt</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {bubbleTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      {index + 9}
                    </Badge>
                    <span className="font-medium">{team.name}</span>
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
      )}
    </div>
  )
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { seasons, currentSeasonId } = await getSeasonsData()
  const selectedSeasonId = searchParams.season ? parseInt(searchParams.season) : currentSeasonId
  const standings = await getStandingsData(selectedSeasonId)

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Standings</h1>
          <p className="text-white/70">Current league standings and playoff picture</p>
        </div>

        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
            <TabsTrigger value="standings" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
              Standings
            </TabsTrigger>
            <TabsTrigger value="playoffs" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
              Playoff Picture
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="mt-6">
            <Suspense fallback={<Skeleton className="h-96 w-full bg-white/10" />}>
              <TeamStandings standings={standings} />
            </Suspense>
          </TabsContent>

          <TabsContent value="playoffs" className="mt-6">
            <PlayoffPicture standings={standings} />
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
