"use client"

import React, { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trophy, Target, Zap, Star, Users, TrendingUp, Award, Medal, Crown } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

interface ComprehensiveMatchViewProps {
  match: any
  isAdmin?: boolean
}

interface PlayerStat {
  player_name: string
  player_id: string
  team_id: string
  goals: number
  assists: number
  shots: number
  hits: number
  pim: number
  plus_minus: number
  blocks: number
  position?: string
  toi?: string
  takeaways?: number
  giveaways?: number
  faceoffs_won?: number
  faceoffs_taken?: number
  faceoff_pct?: number
  pass_attempts?: number
  pass_complete?: number
  penalties_drawn?: number
  ppg?: number
  time_with_puck?: number
  interceptions?: number
}

interface TeamStats {
  goals: number
  shots: number
  hits: number
  pim: number
  blocks: number
  passing_pct?: number
  faceoff_pct?: number
  pp_goals?: number
  team_name: string
  team_id: string
  total_faceoffs_won?: number
  total_faceoffs_taken?: number
  total_pass_complete?: number
  total_pass_attempts?: number
}

interface TeamStanding {
  id: string
  name: string
  wins: number
  losses: number
  otl: number
  points: number
}

// Team color mappings
const getTeamColors = (teamName: string) => {
  const teamColorMap: { [key: string]: { primary: string; secondary: string; accent: string } } = {
    Firebirds: { primary: "bg-red-600", secondary: "bg-red-700", accent: "border-red-500" },
    Bruins: { primary: "bg-yellow-500", secondary: "bg-yellow-600", accent: "border-yellow-400" },
    Rangers: { primary: "bg-blue-600", secondary: "bg-blue-700", accent: "border-blue-500" },
    Penguins: { primary: "bg-yellow-400", secondary: "bg-black", accent: "border-yellow-300" },
    Capitals: { primary: "bg-red-600", secondary: "bg-red-700", accent: "border-red-500" },
    Lightning: { primary: "bg-blue-500", secondary: "bg-blue-600", accent: "border-blue-400" },
    Panthers: { primary: "bg-red-500", secondary: "bg-blue-800", accent: "border-red-400" },
    "Maple Leafs": { primary: "bg-blue-600", secondary: "bg-blue-700", accent: "border-blue-500" },
  }

  return teamColorMap[teamName] || { primary: "bg-slate-600", secondary: "bg-slate-700", accent: "border-slate-500" }
}

export function ComprehensiveMatchView({ match, isAdmin = false }: ComprehensiveMatchViewProps) {
  const { supabase } = useSupabase()
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [teamStandings, setTeamStandings] = useState<{ [key: string]: TeamStanding }>({})
  const [loading, setLoading] = useState(true)
  const [standingsLoading, setStandingsLoading] = useState(true)
  const [seasonInfo, setSeasonInfo] = useState<{ week: number; season: string } | null>(null)

  useEffect(() => {
    fetchMatchStats()
    fetchTeamStandings()
    fetchSeasonInfo()
  }, [match.id])

  const fetchSeasonInfo = async () => {
    try {
      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("season_number, week")
        .eq("id", match.season_id)
        .single()

      if (!seasonError && seasonData) {
        setSeasonInfo({
          week: seasonData.week || 1,
          season: `Season ${seasonData.season_number || 1}`,
        })
      }
    } catch (error) {
      console.error("Error fetching season info:", error)
    }
  }

  const fetchMatchStats = async () => {
    try {
      setLoading(true)

      // Fetch player stats
      const { data: playerStatsData, error: playerStatsError } = await supabase
        .from("ea_match_player_stats")
        .select("*")
        .eq("match_id", match.id)

      if (playerStatsError) {
        console.error("Error fetching player stats:", playerStatsError)
      } else {
        setPlayerStats(playerStatsData || [])
      }

      // Fetch team stats
      const { data: teamStatsData, error: teamStatsError } = await supabase
        .from("ea_match_team_stats")
        .select("*")
        .eq("match_id", match.id)

      if (teamStatsError) {
        console.error("Error fetching team stats:", teamStatsError)
      } else {
        setTeamStats(teamStatsData || [])
      }
    } catch (error) {
      console.error("Error fetching match stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamStandings = async () => {
    try {
      setStandingsLoading(true)
      const response = await fetch("/api/standings")
      if (response.ok) {
        const data = await response.json()
        const standingsMap: { [key: string]: TeamStanding } = {}
        data.standings.forEach((team: TeamStanding) => {
          standingsMap[team.id] = team
        })
        setTeamStandings(standingsMap)
      }
    } catch (error) {
      console.error("Error fetching team standings:", error)
    } finally {
      setStandingsLoading(false)
    }
  }

  const getTopScorers = () => {
    return playerStats
      .filter((player) => player.goals > 0 || player.assists > 0)
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
      .slice(0, 5)
  }

  const getTopGoalScorers = () => {
    return playerStats
      .filter((player) => player.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 3)
  }

  const getTopAssistLeaders = () => {
    return playerStats
      .filter((player) => player.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 3)
  }

  const getHomeTeamStats = () => {
    return teamStats.find((stats) => stats.team_id === match.home_team_id)
  }

  const getAwayTeamStats = () => {
    return teamStats.find((stats) => stats.team_id === match.away_team_id)
  }

  const homeTeamStats = getHomeTeamStats()
  const awayTeamStats = getAwayTeamStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-64 w-full rounded-2xl bg-white/10" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Match Overview Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Match Overview</h3>
              <p className="text-purple-300">
                {seasonInfo?.season} • Week {seasonInfo?.week} • {match.status}
              </p>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">{match.home_score || 0}</div>
                <div className="text-sm text-purple-300">Home</div>
              </div>
              <div className="text-4xl font-bold text-purple-300">-</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-200">{match.away_score || 0}</div>
                <div className="text-sm text-purple-300">Away</div>
              </div>
            </div>

            {/* Match Date */}
            <div className="text-center text-purple-300">
              {new Date(match.match_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Statistics Comparison */}
      {(homeTeamStats || awayTeamStats) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Team Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Home Team Stats */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-200 text-center">{match.home_team.name}</h4>
                  {homeTeamStats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-200">{homeTeamStats.goals}</div>
                        <div className="text-sm text-blue-300">Goals</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-200">{homeTeamStats.shots}</div>
                        <div className="text-sm text-blue-300">Shots</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-200">{homeTeamStats.hits}</div>
                        <div className="text-sm text-blue-300">Hits</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-200">{homeTeamStats.blocks}</div>
                        <div className="text-sm text-blue-300">Blocks</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Away Team Stats */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-red-200 text-center">{match.away_team.name}</h4>
                  {awayTeamStats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-200">{awayTeamStats.goals}</div>
                        <div className="text-sm text-red-300">Goals</div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-200">{awayTeamStats.shots}</div>
                        <div className="text-sm text-red-300">Shots</div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-200">{awayTeamStats.hits}</div>
                        <div className="text-sm text-red-300">Hits</div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-200">{awayTeamStats.blocks}</div>
                        <div className="text-sm text-red-300">Blocks</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Player Performance Highlights */}
      {playerStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Player Highlights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Scorers */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-purple-200 text-center flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Top Scorers
                  </h4>
                  <div className="space-y-3">
                    {getTopScorers().map((player, index) => (
                      <div
                        key={player.player_id}
                        className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{player.player_name}</div>
                            <div className="text-sm text-purple-300">
                              {player.goals}G {player.assists}A ({player.goals + player.assists}P)
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-purple-200">#{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Goal Scorers */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-yellow-200 text-center flex items-center justify-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Leaders
                  </h4>
                  <div className="space-y-3">
                    {getTopGoalScorers().map((player, index) => (
                      <div
                        key={player.player_id}
                        className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{player.player_name}</div>
                            <div className="text-sm text-yellow-300">{player.goals} Goals</div>
                          </div>
                          <div className="text-2xl font-bold text-yellow-200">#{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Assist Leaders */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-green-200 text-center flex items-center justify-center gap-2">
                    <Zap className="h-5 w-5" />
                    Assist Leaders
                  </h4>
                  <div className="space-y-3">
                    {getTopAssistLeaders().map((player, index) => (
                      <div
                        key={player.player_id}
                        className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{player.player_name}</div>
                            <div className="text-sm text-green-300">{player.assists} Assists</div>
                          </div>
                          <div className="text-2xl font-bold text-green-200">#{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Team Standings Impact */}
      {!standingsLoading && Object.keys(teamStandings).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Standings Impact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Team Standing */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-200 text-center">{match.home_team.name}</h4>
                  {teamStandings[match.home_team_id] && (
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-200">{teamStandings[match.home_team_id].points}</div>
                          <div className="text-sm text-blue-300">Points</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-200">
                            {teamStandings[match.home_team_id].wins}-{teamStandings[match.home_team_id].losses}-{teamStandings[match.home_team_id].otl}
                          </div>
                          <div className="text-sm text-blue-300">Record</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Away Team Standing */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-red-200 text-center">{match.away_team.name}</h4>
                  {teamStandings[match.away_team_id] && (
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-red-200">{teamStandings[match.away_team_id].points}</div>
                          <div className="text-sm text-red-300">Points</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-200">
                            {teamStandings[match.away_team_id].wins}-{teamStandings[match.away_team_id].losses}-{teamStandings[match.away_team_id].otl}
                          </div>
                          <div className="text-sm text-red-300">Record</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No Stats Available */}
      {playerStats.length === 0 && teamStats.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-8 text-center">
              <div className="text-purple-300 mb-4">
                <Trophy className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Statistics Available</h3>
                <p className="text-purple-300">
                  Match statistics have not been uploaded yet. Check back after the match is completed.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
