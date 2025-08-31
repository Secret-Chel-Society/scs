"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Users, TrendingUp } from "lucide-react"
import Image from "next/image"

interface TeamStanding {
  id: string
  name: string
  logo_url?: string
  wins: number
  losses: number
  otl: number
  points: number
  goals_for: number
  goals_against: number
  goal_differential: number
  games_played: number
  playoff_status?: "clinched" | "eliminated" | "in_hunt"
}

interface PlayoffMatch {
  id: string
  home_team_id: string
  away_team_id: string
  home_score?: number
  away_score?: number
  status: string
  round: number
  series_id: string
  home_team?: TeamStanding
  away_team?: TeamStanding
}

export function PlayoffBracket({ seasonId }: { seasonId: number }) {
  const { supabase } = useSupabase()
  const [teams, setTeams] = useState<TeamStanding[]>([])
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayoffData()
  }, [seasonId])

  const fetchPlayoffData = async () => {
    try {
      setLoading(true)
      
      // Fetch teams for the season
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          logo_url,
          wins,
          losses,
          otl,
          points,
          goals_for,
          goals_against,
          games_played
        `)
        .eq("is_active", true)
        .order("points", { ascending: false })

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
        return
      }

      // Calculate goal differential and playoff status
      const processedTeams = teamsData.map((team: any) => ({
        ...team,
        goal_differential: team.goals_for - team.goals_against,
        playoff_status: getPlayoffStatus(team, teamsData)
      }))

      setTeams(processedTeams)

      // Fetch playoff matches if they exist
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          status,
          round,
          series_id
        `)
        .eq("season_id", seasonId)
        .eq("is_playoff", true)
        .order("round", { ascending: true })

      if (!matchesError && matchesData) {
        // Add team data to matches
        const matchesWithTeams = matchesData.map((match: any) => ({
          ...match,
          home_team: processedTeams.find(t => t.id === match.home_team_id),
          away_team: processedTeams.find(t => t.id === match.away_team_id)
        }))
        setPlayoffMatches(matchesWithTeams)
      }

    } catch (error) {
      console.error("Error fetching playoff data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayoffStatus = (team: any, allTeams: any[]): "clinched" | "eliminated" | "in_hunt" => {
    // Top 8 teams make playoffs
    const sortedTeams = [...allTeams].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.wins !== b.wins) return b.wins - a.wins
      return (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against)
    })

    const teamRank = sortedTeams.findIndex(t => t.id === team.id) + 1
    
    if (teamRank <= 8) return "clinched"
    if (teamRank > 12) return "eliminated"
    return "in_hunt"
  }

  const getPlayoffTeams = () => {
    return teams
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points
        if (a.wins !== b.wins) return b.wins - a.wins
        return b.goal_differential - a.goal_differential
      })
      .slice(0, 8)
  }

  const getBubbleTeams = () => {
    return teams
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points
        if (a.wins !== b.wins) return b.wins - a.wins
        return b.goal_differential - a.goal_differential
      })
      .slice(8, 12)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "clinched":
        return <Badge variant="default" className="bg-green-600">Clinched</Badge>
      case "eliminated":
        return <Badge variant="destructive">Eliminated</Badge>
      case "in_hunt":
        return <Badge variant="secondary" className="bg-orange-600">In Hunt</Badge>
      default:
        return null
    }
  }

  const getMatchResult = (match: PlayoffMatch) => {
    if (!match.home_score && !match.away_score) return null
    
    const homeWon = (match.home_score || 0) > (match.away_score || 0)
    return {
      winner: homeWon ? match.home_team : match.away_team,
      loser: homeWon ? match.away_team : match.home_team,
      homeScore: match.home_score || 0,
      awayScore: match.away_score || 0
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const playoffTeams = getPlayoffTeams()
  const bubbleTeams = getBubbleTeams()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Playoff Bracket
        </h2>
        <p className="text-muted-foreground">
          Current playoff seeding and bracket matchups
        </p>
      </div>

      {/* Playoff Seeding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Playoff Seeding
          </CardTitle>
          <CardDescription>
            Top 8 teams qualify for playoffs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {playoffTeams.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border bg-background">
                    {team.logo_url ? (
                      <Image
                        src={team.logo_url}
                        alt={team.name}
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">{team.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{team.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {team.points} PTS • {team.wins}-{team.losses}-{team.otl}
                    </div>
                  </div>
                </div>
                {getStatusBadge(team.playoff_status || "in_hunt")}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bubble Teams */}
      {bubbleTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bubble Teams
            </CardTitle>
            <CardDescription>
              Teams fighting for playoff spots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {bubbleTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white text-sm font-bold">
                    {playoffTeams.length + index + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border bg-background">
                      {team.logo_url ? (
                        <Image
                          src={team.logo_url}
                          alt={team.name}
                          width={24}
                          height={24}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">{team.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{team.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {team.points} PTS • {team.wins}-{team.losses}-{team.otl}
                      </div>
                      <div className="text-xs text-orange-600 font-medium">
                        {playoffTeams[playoffTeams.length - 1].points - team.points} pts back
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(team.playoff_status || "in_hunt")}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playoff Bracket Visualization */}
      {playoffMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Playoff Bracket</CardTitle>
            <CardDescription>
              Current playoff matchups and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Round 1 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Round 1</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {playoffMatches
                    .filter(match => match.round === 1)
                    .map((match) => {
                      const result = getMatchResult(match)
                      return (
                        <div key={match.id} className="border rounded-lg p-3">
                          <div className="space-y-2">
                            <div className={`flex items-center gap-2 p-2 rounded ${result?.winner?.id === match.home_team?.id ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border bg-background">
                                {match.home_team?.logo_url ? (
                                  <Image
                                    src={match.home_team.logo_url}
                                    alt={match.home_team.name}
                                    width={24}
                                    height={24}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold">{match.home_team?.name?.substring(0, 2)}</span>
                                )}
                              </div>
                              <span className="font-medium">{match.home_team?.name || 'TBD'}</span>
                              {result && <span className="ml-auto font-bold">{result.homeScore}</span>}
                            </div>
                            <div className={`flex items-center gap-2 p-2 rounded ${result?.winner?.id === match.away_team?.id ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border bg-background">
                                {match.away_team?.logo_url ? (
                                  <Image
                                    src={match.away_team.logo_url}
                                    alt={match.away_team.name}
                                    width={24}
                                    height={24}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold">{match.away_team?.name?.substring(0, 2)}</span>
                                )}
                              </div>
                              <span className="font-medium">{match.away_team?.name || 'TBD'}</span>
                              {result && <span className="ml-auto font-bold">{result.awayScore}</span>}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {match.status === 'completed' ? 'Final' : match.status}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Later rounds would go here */}
              {playoffMatches.some(match => match.round > 1) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Conference Finals</h3>
                  <p className="text-muted-foreground">Matchups will be determined after Round 1</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No playoff matches yet */}
      {playoffMatches.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-muted-foreground">Playoff Bracket</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Playoff matchups will be available once the regular season ends.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
