"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import TeamStandings from "@/components/team-standings"
import type { TeamStanding } from "@/lib/standings-calculator"

interface StandingsPageProps {
  searchParams: { season?: string }
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
  // Group teams by conference/division - use original logic
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
      <Card>
        <CardHeader>
          <CardTitle>{conference1Name}</CardTitle>
          <CardDescription>{conference1Teams.length} teams</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamStandings teams={conference1Teams} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{conference2Name}</CardTitle>
          <CardDescription>{conference2Teams.length} teams</CardDescription>
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

export default function StandingsPage({ searchParams }: StandingsPageProps) {
  const { supabase } = useSupabase()
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true)
        setError(null)

        // Get all teams
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (teamsError) {
          throw teamsError
        }

        if (!teamsData || teamsData.length === 0) {
          setStandings([])
          return
        }

        // Get all matches for the current season
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .eq("season_name", "Season 1")
          .eq("status", "completed")

        if (matchesError) {
          console.error("Error fetching matches:", matchesError)
        }

        // Calculate standings manually
        const calculatedStandings: TeamStanding[] = teamsData.map((team) => {
          let wins = 0
          let losses = 0
          let otl = 0
          let goalsFor = 0
          let goalsAgainst = 0

          // Calculate stats from matches
          matchesData?.forEach((match) => {
            if (match.home_team_id === team.id) {
              goalsFor += match.home_score || 0
              goalsAgainst += match.away_score || 0

              if (match.home_score > match.away_score) {
                wins++
              } else if (match.home_score < match.away_score) {
                if (match.overtime || match.has_overtime) {
                  otl++
                } else {
                  losses++
                }
              } else {
                losses++ // Tie counts as loss
              }
            } else if (match.away_team_id === team.id) {
              goalsFor += match.away_score || 0
              goalsAgainst += match.home_score || 0

              if (match.away_score > match.home_score) {
                wins++
              } else if (match.away_score < match.home_score) {
                if (match.overtime || match.has_overtime) {
                  otl++
                } else {
                  losses++
                }
              } else {
                losses++ // Tie counts as loss
              }
            }
          })

          const points = wins * 2 + otl
          const gamesPlayed = wins + losses + otl
          const goalDifferential = goalsFor - goalsAgainst

          return {
            id: team.id,
            name: team.name,
            logo_url: team.logo_url,
            wins,
            losses,
            otl,
            games_played: gamesPlayed,
            points,
            goals_for: goalsFor,
            goals_against: goalsAgainst,
            goal_differential: goalDifferential,
            division: team.division || "Custom",
            conference: team.conference || "Custom",
            playoff_status: "active" as const,
          }
        })

        // Sort by points, wins, goal differential, goals for
        const sortedStandings = calculatedStandings.sort((a, b) => {
          if (a.points !== b.points) return b.points - a.points
          if (a.wins !== b.wins) return b.wins - a.wins
          if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
          return b.goals_for - a.goals_for
        })

        setStandings(sortedStandings)
      } catch (error: any) {
        console.error("Error fetching standings:", error)
        setError(error.message || "Failed to load standings")
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [supabase])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">League Standings</h1>
            <p className="text-muted-foreground">Current team standings, conference rankings, and playoff picture</p>
          </div>
          <StandingsLoadingSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">League Standings</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">League Standings</h1>
          <p className="text-muted-foreground">No standings data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">League Standings</h1>
          <p className="text-muted-foreground">Current team standings, conference rankings, and playoff picture</p>
        </div>

        <Tabs defaultValue="overall" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overall">Overall Standings</TabsTrigger>
            <TabsTrigger value="conference">Conference</TabsTrigger>
            <TabsTrigger value="playoffs">Playoff Picture</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  )
}
