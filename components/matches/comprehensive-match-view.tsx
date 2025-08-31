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
      <div className="h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-3/4" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    )
  }

  const wentToOvertime = match.overtime || match.has_overtime

  return (
    <div className="h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="h-full grid grid-cols-12 gap-4">
        
        {/* Match Header - Top Row */}
        <div className="col-span-12">
          <Card className="bg-gradient-to-r from-blue-500 to-red-500 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                    {match.home_team.logo_url ? (
                      <Image
                        src={match.home_team.logo_url}
                        alt={match.home_team.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-800">{match.home_team.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{match.home_team.name}</h2>
                    <p className="text-blue-100">
                      {match.home_team.wins}-{match.home_team.losses}-{match.home_team.otl} • {match.home_team.points} PTS
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-5xl font-bold text-yellow-300 drop-shadow-lg">
                    {match.home_score} - {match.away_score}
                  </div>
                  {wentToOvertime && (
                    <Badge className="mt-2 bg-yellow-500 text-black font-bold">OT</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <h2 className="text-2xl font-bold">{match.away_team.name}</h2>
                    <p className="text-red-100">
                      {match.away_team.wins}-{match.away_team.losses}-{match.away_team.otl} • {match.away_team.points} PTS
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                    {match.away_team.logo_url ? (
                      <Image
                        src={match.away_team.logo_url}
                        alt={match.away_team.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-800">{match.away_team.name.substring(0, 2)}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period Stats - Left Column */}
        <div className="col-span-3">
          <Card className="h-full bg-gradient-to-b from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Period Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-green-600 rounded">
                  <span className="font-medium">1st Period</span>
                  <span className="font-bold">{match.period_scores?.home?.[0] || 0} - {match.period_scores?.away?.[0] || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-600 rounded">
                  <span className="font-medium">2nd Period</span>
                  <span className="font-bold">{match.period_scores?.home?.[1] || 0} - {match.period_scores?.away?.[1] || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-600 rounded">
                  <span className="font-medium">3rd Period</span>
                  <span className="font-bold">{match.period_scores?.home?.[2] || 0} - {match.period_scores?.away?.[2] || 0}</span>
                </div>
                {wentToOvertime && (
                  <div className="flex justify-between items-center p-2 bg-yellow-600 rounded">
                    <span className="font-medium">Overtime</span>
                    <span className="font-bold">{match.period_scores?.home?.[3] || 0} - {match.period_scores?.away?.[3] || 0}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 bg-blue-600 rounded font-bold text-lg">
                  <span>Total</span>
                  <span>{match.home_score} - {match.away_score}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Stats - Center Column */}
        <div className="col-span-3">
          <Card className="h-full bg-gradient-to-b from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Team Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-purple-600 rounded">
                  <span>Goals</span>
                  <span className="font-bold">{homeStats?.goals || 0} - {awayStats?.goals || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-600 rounded">
                  <span>Shots</span>
                  <span className="font-bold">{homeStats?.shots || 0} - {awayStats?.shots || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-600 rounded">
                  <span>Hits</span>
                  <span className="font-bold">{homeStats?.hits || 0} - {awayStats?.hits || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-600 rounded">
                  <span>Faceoff %</span>
                  <span className="font-bold">
                    {getFaceoffPercentage(homeStats?.faceoff_wins || 0, homeStats?.faceoff_attempts || 0)} - 
                    {getFaceoffPercentage(awayStats?.faceoff_wins || 0, awayStats?.faceoff_attempts || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-600 rounded">
                  <span>Pass %</span>
                  <span className="font-bold">
                    {getPassPercentage(homeStats?.pass_completed || 0, homeStats?.pass_attempted || 0)} - 
                    {getPassPercentage(awayStats?.pass_completed || 0, awayStats?.pass_attempted || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-600 rounded">
                  <span>PIM</span>
                  <span className="font-bold">{homeStats?.pim || 0} - {awayStats?.pim || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Three Stars - Right Column */}
        <div className="col-span-3">
          <Card className="h-full bg-gradient-to-b from-yellow-500 to-yellow-600 text-black border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5" />
                Three Stars
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {threeStars?.first_star && (
                  <div className="p-2 bg-yellow-400 rounded border-2 border-yellow-700">
                    <div className="font-bold text-yellow-800">⭐ 1st Star</div>
                    <div className="text-sm font-medium">{threeStars.first_star.gamer_tag_id}</div>
                    <div className="text-xs text-yellow-700">{threeStars.first_star.team_name}</div>
                  </div>
                )}
                {threeStars?.second_star && (
                  <div className="p-2 bg-gray-300 rounded border-2 border-gray-600">
                    <div className="font-bold text-gray-700">⭐ 2nd Star</div>
                    <div className="text-sm font-medium">{threeStars.second_star.gamer_tag_id}</div>
                    <div className="text-xs text-gray-600">{threeStars.second_star.team_name}</div>
                  </div>
                )}
                {threeStars?.third_star && (
                  <div className="p-2 bg-orange-300 rounded border-2 border-orange-600">
                    <div className="font-bold text-orange-700">⭐ 3rd Star</div>
                    <div className="text-sm font-medium">{threeStars.third_star.gamer_tag_id}</div>
                    <div className="text-xs text-orange-600">{threeStars.third_star.team_name}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lineups - Bottom Left */}
        <div className="col-span-6">
          <Card className="h-full bg-gradient-to-b from-blue-400 to-blue-500 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Lineups
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div>
                  <h4 className="font-bold text-blue-100 mb-2">{match.home_team.name}</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {homePlayerStats.slice(0, 8).map((player) => (
                      <div key={player.id} className="flex justify-between items-center p-1 bg-blue-600 rounded text-xs">
                        <span className="font-medium">{player.gamer_tag_id}</span>
                        <span>{player.time_on_ice}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-blue-100 mb-2">{match.away_team.name}</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {awayPlayerStats.slice(0, 8).map((player) => (
                      <div key={player.id} className="flex justify-between items-center p-1 bg-blue-600 rounded text-xs">
                        <span className="font-medium">{player.gamer_tag_id}</span>
                        <span>{player.time_on_ice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Player Stats - Bottom Right */}
        <div className="col-span-6">
          <Card className="h-full bg-gradient-to-b from-red-400 to-red-500 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Player Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div>
                  <h4 className="font-bold text-red-100 mb-2">{match.home_team.name}</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                    {homePlayerStats.slice(0, 6).map((player) => (
                      <div key={player.id} className="p-1 bg-red-600 rounded">
                        <div className="font-medium">{player.gamer_tag_id}</div>
                        <div className="text-red-200">
                          {player.goals}G {player.assists}A {player.points}P • {player.shots}SOG
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-red-100 mb-2">{match.away_team.name}</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                    {awayPlayerStats.slice(0, 6).map((player) => (
                      <div key={player.id} className="p-1 bg-red-600 rounded">
                        <div className="font-medium">{player.gamer_tag_id}</div>
                        <div className="text-red-200">
                          {player.goals}G {player.assists}A {player.points}P • {player.shots}SOG
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
