"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Users, BarChart3, Star, Clock, Target, Zap } from "lucide-react"
import Image from "next/image"

interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  match_date: string
  status: string
  period_scores?: any
  has_overtime: boolean
  overtime: boolean
  home_team: {
    id: string
    name: string
    logo_url?: string
    wins: number
    losses: number
    otl: number
    points: number
  }
  away_team: {
    id: string
    name: string
    logo_url?: string
    wins: number
    losses: number
    otl: number
    points: number
  }
}

interface TeamStats {
  goals: number
  shots: number
  hits: number
  faceoff_wins: number
  faceoff_attempts: number
  pass_attempted: number
  pass_completed: number
  pim: number
}

interface PlayerStats {
  id: string
  gamer_tag_id: string
  position: string
  goals: number
  assists: number
  points: number
  plus_minus: number
  pim: number
  shots: number
  hits: number
  blocks: number
  takeaways: number
  giveaways: number
  faceoffs_won: number
  faceoffs_taken: number
  pass_attempted: number
  pass_completed: number
  time_on_ice: string
  saves?: number
  goals_against?: number
  save_percentage?: number
}

interface ThreeStars {
  first_star?: {
    player_id: string
    gamer_tag_id: string
    team_id: string
    team_name: string
  }
  second_star?: {
    player_id: string
    gamer_tag_id: string
    team_id: string
    team_name: string
  }
  third_star?: {
    player_id: string
    gamer_tag_id: string
    team_id: string
    team_name: string
  }
}

export function ComprehensiveMatchView({ matchId }: { matchId: string }) {
  const { supabase } = useSupabase()
  const [match, setMatch] = useState<Match | null>(null)
  const [homeStats, setHomeStats] = useState<TeamStats | null>(null)
  const [awayStats, setAwayStats] = useState<TeamStats | null>(null)
  const [homePlayerStats, setHomePlayerStats] = useState<PlayerStats[]>([])
  const [awayPlayerStats, setAwayPlayerStats] = useState<PlayerStats[]>([])
  const [threeStars, setThreeStars] = useState<ThreeStars | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatchData()
  }, [matchId])

  const fetchMatchData = async () => {
    try {
      setLoading(true)
      
      // Fetch match details with team records
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!home_team_id (
            id,
            name,
            logo_url,
            wins,
            losses,
            otl,
            points
          ),
          away_team:teams!away_team_id (
            id,
            name,
            logo_url,
            wins,
            losses,
            otl,
            points
          )
        `)
        .eq("id", matchId)
        .single()

      if (matchError) {
        console.error("Error fetching match:", matchError)
        return
      }

      setMatch(matchData)

      // Fetch team statistics
      await Promise.all([
        fetchTeamStats(matchData.home_team_id, setHomeStats),
        fetchTeamStats(matchData.away_team_id, setAwayStats),
        fetchPlayerStats(matchData.home_team_id, setHomePlayerStats),
        fetchPlayerStats(matchData.away_team_id, setAwayPlayerStats),
        fetchThreeStars(matchId)
      ])

    } catch (error) {
      console.error("Error fetching match data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamStats = async (teamId: string, setStats: (stats: TeamStats) => void) => {
    try {
      const { data, error } = await supabase
        .from("match_team_stats")
        .select("*")
        .eq("match_id", matchId)
        .eq("team_id", teamId)
        .single()

      if (!error && data) {
        setStats({
          goals: data.goals || 0,
          shots: data.shots || 0,
          hits: data.hits || 0,
          faceoff_wins: data.faceoff_wins || 0,
          faceoff_attempts: data.faceoff_attempts || 0,
          pass_attempted: data.pass_attempted || 0,
          pass_completed: data.pass_completed || 0,
          pim: data.pim || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching team stats:", error)
    }
  }

  const fetchPlayerStats = async (teamId: string, setPlayerStats: (stats: PlayerStats[]) => void) => {
    try {
      const { data, error } = await supabase
        .from("match_player_stats")
        .select(`
          *,
          players!inner (
            users!inner (
              gamer_tag_id,
              primary_position
            )
          )
        `)
        .eq("match_id", matchId)
        .eq("team_id", teamId)

      if (!error && data) {
        const formattedStats = data.map((stat: any) => ({
          id: stat.player_id,
          gamer_tag_id: stat.players?.users?.gamer_tag_id || "Unknown",
          position: stat.players?.users?.primary_position || "Unknown",
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          points: stat.points || 0,
          plus_minus: stat.plus_minus || 0,
          pim: stat.pim || 0,
          shots: stat.shots || 0,
          hits: stat.hits || 0,
          blocks: stat.blocks || 0,
          takeaways: stat.takeaways || 0,
          giveaways: stat.giveaways || 0,
          faceoffs_won: stat.faceoffs_won || 0,
          faceoffs_taken: stat.faceoffs_taken || 0,
          pass_attempted: stat.pass_attempted || 0,
          pass_completed: stat.pass_completed || 0,
          time_on_ice: stat.time_on_ice || "0:00",
          saves: stat.saves,
          goals_against: stat.goals_against,
          save_percentage: stat.save_percentage,
        }))
        setPlayerStats(formattedStats)
      }
    } catch (error) {
      console.error("Error fetching player stats:", error)
    }
  }

  const fetchThreeStars = async (matchId: string) => {
    try {
      const { data, error } = await supabase
        .from("match_three_stars")
        .select(`
          *,
          first_star_player:players!first_star_player_id (
            users!inner (gamer_tag_id),
            teams!inner (name)
          ),
          second_star_player:players!second_star_player_id (
            users!inner (gamer_tag_id),
            teams!inner (name)
          ),
          third_star_player:players!third_star_player_id (
            users!inner (gamer_tag_id),
            teams!inner (name)
          )
        `)
        .eq("match_id", matchId)
        .single()

      if (!error && data) {
        setThreeStars({
          first_star: data.first_star_player ? {
            player_id: data.first_star_player.id,
            gamer_tag_id: data.first_star_player.users?.gamer_tag_id,
            team_id: data.first_star_player.team_id,
            team_name: data.first_star_player.teams?.name,
          } : undefined,
          second_star: data.second_star_player ? {
            player_id: data.second_star_player.id,
            gamer_tag_id: data.second_star_player.users?.gamer_tag_id,
            team_id: data.second_star_player.team_id,
            team_name: data.second_star_player.teams?.name,
          } : undefined,
          third_star: data.third_star_player ? {
            player_id: data.third_star_player.id,
            gamer_tag_id: data.third_star_player.users?.gamer_tag_id,
            team_id: data.third_star_player.team_id,
            team_name: data.third_star_player.teams?.name,
          } : undefined,
        })
      }
    } catch (error) {
      console.error("Error fetching three stars:", error)
    }
  }

  const getFaceoffPercentage = (wins: number, attempts: number) => {
    if (attempts === 0) return "0.0%"
    return `${((wins / attempts) * 100).toFixed(1)}%`
  }

  const getPassPercentage = (completed: number, attempted: number) => {
    if (attempted === 0) return "0.0%"
    return `${((completed / attempted) * 100).toFixed(1)}%`
  }

  const formatTimeOnIce = (time: string) => {
    if (!time) return "0:00"
    return time
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    )
  }

  const wentToOvertime = match.overtime || match.has_overtime

  return (
    <div className="space-y-6">
      {/* Match Header with Team Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-background">
                  {match.home_team.logo_url ? (
                    <Image
                      src={match.home_team.logo_url}
                      alt={match.home_team.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold">{match.home_team.name.substring(0, 2)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{match.home_team.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {match.home_team.wins}-{match.home_team.losses}-{match.home_team.otl} • {match.home_team.points} PTS
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {match.home_score} - {match.away_score}
                </div>
                {wentToOvertime && (
                  <Badge variant="secondary" className="mt-1">OT</Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-right">{match.away_team.name}</h2>
                  <p className="text-sm text-muted-foreground text-right">
                    {match.away_team.wins}-{match.away_team.losses}-{match.away_team.otl} • {match.away_team.points} PTS
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-background">
                  {match.away_team.logo_url ? (
                    <Image
                      src={match.away_team.logo_url}
                      alt={match.away_team.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold">{match.away_team.name.substring(0, 2)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Period Stats Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Period Scoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-center">{match.home_team.name}</TableHead>
                <TableHead className="text-center">{match.away_team.name}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">1st Period</TableCell>
                <TableCell className="text-center">
                  {match.period_scores?.home?.[0] || 0}
                </TableCell>
                <TableCell className="text-center">
                  {match.period_scores?.away?.[0] || 0}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">2nd Period</TableCell>
                <TableCell className="text-center">
                  {match.period_scores?.home?.[1] || 0}
                </TableCell>
                <TableCell className="text-center">
                  {match.period_scores?.away?.[1] || 0}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">3rd Period</TableCell>
                <TableCell className="text-center">
                  {match.period_scores?.home?.[2] || 0}
                </TableCell>
                <TableCell className="text-center">
                  {match.period_scores?.away?.[2] || 0}
                </TableCell>
              </TableRow>
              {wentToOvertime && (
                <TableRow>
                  <TableCell className="font-medium">Overtime</TableCell>
                  <TableCell className="text-center">
                    {match.period_scores?.home?.[3] || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {match.period_scores?.away?.[3] || 0}
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{match.home_score}</TableCell>
                <TableCell className="text-center">{match.away_score}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Team Stats Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Team Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stat</TableHead>
                <TableHead className="text-center">{match.home_team.name}</TableHead>
                <TableHead className="text-center">{match.away_team.name}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Goals</TableCell>
                <TableCell className="text-center">{homeStats?.goals || 0}</TableCell>
                <TableCell className="text-center">{awayStats?.goals || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Shots</TableCell>
                <TableCell className="text-center">{homeStats?.shots || 0}</TableCell>
                <TableCell className="text-center">{awayStats?.shots || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Hits</TableCell>
                <TableCell className="text-center">{homeStats?.hits || 0}</TableCell>
                <TableCell className="text-center">{awayStats?.hits || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Faceoff %</TableCell>
                <TableCell className="text-center">
                  {getFaceoffPercentage(homeStats?.faceoff_wins || 0, homeStats?.faceoff_attempts || 0)}
                </TableCell>
                <TableCell className="text-center">
                  {getFaceoffPercentage(awayStats?.faceoff_wins || 0, awayStats?.faceoff_attempts || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Pass %</TableCell>
                <TableCell className="text-center">
                  {getPassPercentage(homeStats?.pass_completed || 0, homeStats?.pass_attempted || 0)}
                </TableCell>
                <TableCell className="text-center">
                  {getPassPercentage(awayStats?.pass_completed || 0, awayStats?.pass_attempted || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">PIM</TableCell>
                <TableCell className="text-center">{homeStats?.pim || 0}</TableCell>
                <TableCell className="text-center">{awayStats?.pim || 0}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lineups Panel */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {match.home_team.name} Lineup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {homePlayerStats.length > 0 ? (
                homePlayerStats.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium">{player.gamer_tag_id}</div>
                      <div className="text-sm text-muted-foreground">{player.position}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{player.time_on_ice}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.goals}G {player.assists}A {player.points}P
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No lineup data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {match.away_team.name} Lineup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {awayPlayerStats.length > 0 ? (
                awayPlayerStats.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium">{player.gamer_tag_id}</div>
                      <div className="text-sm text-muted-foreground">{player.position}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{player.time_on_ice}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.goals}G {player.assists}A {player.points}P
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No lineup data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Three Stars Panel */}
      {threeStars && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Three Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {threeStars.first_star && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <Badge variant="default" className="bg-yellow-600">⭐ 1st Star</Badge>
                  <div>
                    <div className="font-medium">{threeStars.first_star.gamer_tag_id}</div>
                    <div className="text-sm text-muted-foreground">{threeStars.first_star.team_name}</div>
                  </div>
                </div>
              )}
              {threeStars.second_star && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
                  <Badge variant="secondary">⭐ 2nd Star</Badge>
                  <div>
                    <div className="font-medium">{threeStars.second_star.gamer_tag_id}</div>
                    <div className="text-sm text-muted-foreground">{threeStars.second_star.team_name}</div>
                  </div>
                </div>
              )}
              {threeStars.third_star && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                  <Badge variant="outline">⭐ 3rd Star</Badge>
                  <div>
                    <div className="font-medium">{threeStars.third_star.gamer_tag_id}</div>
                    <div className="text-sm text-muted-foreground">{threeStars.third_star.team_name}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Statistics Panels */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{match.home_team.name} Player Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">G</TableHead>
                    <TableHead className="text-center">A</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">+/-</TableHead>
                    <TableHead className="text-center">PIM</TableHead>
                    <TableHead className="text-center">SOG</TableHead>
                    <TableHead className="text-center">Hits</TableHead>
                    <TableHead className="text-center">TOI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {homePlayerStats.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.gamer_tag_id}</TableCell>
                      <TableCell className="text-center">{player.goals}</TableCell>
                      <TableCell className="text-center">{player.assists}</TableCell>
                      <TableCell className="text-center">{player.points}</TableCell>
                      <TableCell className="text-center">{player.plus_minus}</TableCell>
                      <TableCell className="text-center">{player.pim}</TableCell>
                      <TableCell className="text-center">{player.shots}</TableCell>
                      <TableCell className="text-center">{player.hits}</TableCell>
                      <TableCell className="text-center">{formatTimeOnIce(player.time_on_ice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{match.away_team.name} Player Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">G</TableHead>
                    <TableHead className="text-center">A</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">+/-</TableHead>
                    <TableHead className="text-center">PIM</TableHead>
                    <TableHead className="text-center">SOG</TableHead>
                    <TableHead className="text-center">Hits</TableHead>
                    <TableHead className="text-center">TOI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awayPlayerStats.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.gamer_tag_id}</TableCell>
                      <TableCell className="text-center">{player.goals}</TableCell>
                      <TableCell className="text-center">{player.assists}</TableCell>
                      <TableCell className="text-center">{player.points}</TableCell>
                      <TableCell className="text-center">{player.plus_minus}</TableCell>
                      <TableCell className="text-center">{player.pim}</TableCell>
                      <TableCell className="text-center">{player.shots}</TableCell>
                      <TableCell className="text-center">{player.hits}</TableCell>
                      <TableCell className="text-center">{formatTimeOnIce(player.time_on_ice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
