"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TeamStandings from "@/components/team-standings"
import PlayoffBracket from "@/components/playoff-bracket"
import { calculateAHLStandings, getAHLSeasons } from "@/lib/ahl-standings-calculator"
import type { AHLTeamStanding } from "@/lib/ahl-standings-calculator"
import { useSupabase } from "@/lib/supabase/client"

function AHLPlayoffPicture({ standings }: { standings: AHLTeamStanding[] }) {
  const sortedTeams = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
    return b.goals_for - a.goals_for
  })

  const playoffTeams = sortedTeams.slice(0, 8)
  const bubbleTeams = sortedTeams.slice(8, 12)

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base md:text-lg">
            <Badge variant="default" className="bg-green-600 w-fit">
              AHL Playoff Teams
            </Badge>
            <span className="text-xs md:text-sm font-normal text-muted-foreground">Top 8 Teams</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="grid gap-1.5 md:gap-2">
            {playoffTeams.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <Badge
                    variant="outline"
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex items-center gap-1 md:gap-2 min-w-0">
                    <span className="font-medium text-xs md:text-sm truncate">{team.name}</span>
                    {team.playoff_status === "clinched" && (
                      <Badge
                        variant="default"
                        className="bg-green-600 text-white text-xs flex-shrink-0"
                        title="Clinched Playoff Spot"
                      >
                        X
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm flex-shrink-0">
                  <span className="font-semibold">{team.points} PTS</span>
                  <span className="text-muted-foreground hidden sm:inline">
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
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base md:text-lg">
              <Badge variant="secondary" className="bg-orange-600 w-fit">
                Bubble Teams
              </Badge>
              <span className="text-xs md:text-sm font-normal text-muted-foreground">Fighting for Playoff Spots</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="grid gap-1.5 md:gap-2">
              {bubbleTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    >
                      {playoffTeams.length + index + 1}
                    </Badge>
                    <div className="flex items-center gap-1 md:gap-2 min-w-0">
                      <span className="font-medium text-xs md:text-sm truncate">{team.name}</span>
                      {team.playoff_status === "eliminated" && (
                        <Badge
                          variant="destructive"
                          className="bg-red-600 text-white text-xs flex-shrink-0"
                          title="Eliminated from Playoffs"
                        >
                          E
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 text-xs md:text-sm flex-shrink-0">
                    <span className="font-semibold">{team.points} PTS</span>
                    <span className="text-muted-foreground hidden md:inline">
                      {team.wins}-{team.losses}-{team.otl}
                    </span>
                    <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
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

function AHLDivisionStandings({ standings }: { standings: AHLTeamStanding[] }) {
  const divisions = standings.reduce(
    (acc, team) => {
      const division = team.division || "Unknown"
      if (!acc[division]) {
        acc[division] = []
      }
      acc[division].push(team)
      return acc
    },
    {} as Record<string, AHLTeamStanding[]>,
  )

  // Sort teams within each division by points
  const sortTeams = (teams: AHLTeamStanding[]) =>
    teams.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
      return b.goals_for - a.goals_for
    })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Object.entries(divisions).map(([divisionName, teams]) => (
        <Card key={divisionName}>
          <CardHeader>
            <CardTitle>{divisionName}</CardTitle>
            <CardDescription>{teams.length} teams</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={sortTeams(teams)} baseTeamPath="/ahl/teams" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AHLConferenceStandings({ standings }: { standings: AHLTeamStanding[] }) {
  const conferences = standings.reduce(
    (acc, team) => {
      const conference = team.conference || "Unknown"
      if (!acc[conference]) {
        acc[conference] = []
      }
      acc[conference].push(team)
      return acc
    },
    {} as Record<string, AHLTeamStanding[]>,
  )

  // Sort teams within each conference by points
  const sortTeams = (teams: AHLTeamStanding[]) =>
    teams.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
      return b.goals_for - a.goals_for
    })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Object.entries(conferences).map(([conferenceName, teams]) => (
        <Card key={conferenceName}>
          <CardHeader>
            <CardTitle>{conferenceName}</CardTitle>
            <CardDescription>{teams.length} teams</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamStandings teams={sortTeams(teams)} baseTeamPath="/ahl/teams" />
          </CardContent>
        </Card>
      ))}
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

function AHLSeasonStandings({
  season,
  standings,
}: {
  season: { id: string; name: string; is_active: boolean }
  standings: AHLTeamStanding[]
}) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "Admin")
          .single()

        setIsAdmin(!!roleData)
      } catch (error) {
        console.error("Error checking admin role:", error)
      }
    }

    checkAdminRole()
  }, [])

  if (!standings || standings.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {season.name}
              {season.is_active && (
                <Badge variant="default" className="bg-blue-600">
                  Current Season
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No Standings Available</h3>
            <p className="text-sm text-muted-foreground mt-2">No team data found for this season.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPlayoffSeason = season.name.includes("(Playoffs)")

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {season.name}
            {season.is_active && (
              <Badge variant="default" className="bg-blue-600">
                Current Season
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-4">
              <TabsTrigger value="overall" className="text-xs md:text-sm whitespace-nowrap">
                Overall Standings
              </TabsTrigger>
              <TabsTrigger value="conference" className="text-xs md:text-sm whitespace-nowrap">
                Conference
              </TabsTrigger>
              <TabsTrigger value="divisions" className="text-xs md:text-sm whitespace-nowrap">
                Divisions
              </TabsTrigger>
              <TabsTrigger value="playoffs" className="text-xs md:text-sm whitespace-nowrap">
                {isPlayoffSeason ? "Playoff Bracket" : "Playoff Picture"}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overall" className="space-y-4 md:space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3 md:mb-4 text-xs">
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
              <TeamStandings teams={standings} baseTeamPath="/ahl/teams" />
            </div>
          </TabsContent>

          <TabsContent value="conference" className="space-y-4 md:space-y-6">
            <AHLConferenceStandings standings={standings} />
          </TabsContent>

          <TabsContent value="divisions" className="space-y-4 md:space-y-6">
            <AHLDivisionStandings standings={standings} />
          </TabsContent>

          <TabsContent value="playoffs" className="space-y-4 md:space-y-6">
            {isPlayoffSeason ? (
              <PlayoffBracket standings={standings} seasonId={season.id} isAdmin={isAdmin} season={season} />
            ) : (
              <AHLPlayoffPicture standings={standings} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default function AHLStandingsPage() {
  const [seasons, setSeasons] = useState<{ id: string; name: string; is_active: boolean }[]>([])
  const [standingsData, setStandingsData] = useState<{ [seasonId: string]: AHLTeamStanding[] }>({})
  const [selectedSeason, setSelectedSeason] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const seasonsData = await getAHLSeasons()

        if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData)

          // Fetch standings for all seasons
          const standingsPromises = seasonsData.map(async (season) => {
            const standings = await calculateAHLStandings(season.id)
            return { seasonId: season.id, standings }
          })

          const allStandings = await Promise.all(standingsPromises)
          const standingsMap = allStandings.reduce(
            (acc, { seasonId, standings }) => {
              acc[seasonId] = standings
              return acc
            },
            {} as { [seasonId: string]: AHLTeamStanding[] },
          )

          setStandingsData(standingsMap)
        }
      } catch (error) {
        console.error("Error fetching AHL data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">AHL Standings</h1>
            <p className="text-muted-foreground">
              Development Hockey League standings, conference rankings, division rankings, and playoff picture for all
              seasons
            </p>
          </div>
          <StandingsLoadingSkeleton />
        </div>
      </div>
    )
  }

  if (!seasons || seasons.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">AHL Standings</h1>
            <p className="text-muted-foreground">
              Development Hockey League standings, conference rankings, division rankings, and playoff picture for all
              seasons
            </p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-muted-foreground">No Seasons Available</h3>
                <p className="text-sm text-muted-foreground mt-2">No AHL seasons found in the database.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const sortedSeasons = [...seasons].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1
    if (!a.is_active && b.is_active) return 1
    return a.name.localeCompare(b.name)
  })

  const filteredSeasons =
    selectedSeason === "all" ? sortedSeasons : sortedSeasons.filter((season) => season.id === selectedSeason)

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AHL Standings</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Development Hockey League standings, conference rankings, division rankings, and playoff picture for all
            seasons
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4">
          <label htmlFor="season-filter" className="text-xs md:text-sm font-medium whitespace-nowrap">
            Filter by Season:
          </label>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-full sm:w-64 text-xs md:text-sm">
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {sortedSeasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                  {season.is_active && " (Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6 md:space-y-8">
          {filteredSeasons.map((season) => (
            <AHLSeasonStandings key={season.id} season={season} standings={standingsData[season.id] || []} />
          ))}
        </div>
      </div>
    </div>
  )
}
