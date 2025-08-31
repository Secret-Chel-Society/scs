"use client"

import React, { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trophy, Target, Zap, Star, Users, TrendingUp, Award, Medal, Crown, Clock, Home, ExternalLink } from "lucide-react"
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
      if (match.season_name) {
        const seasonMatch = match.season_name.match(/Season (\d+)/)
        const seasonNumber = seasonMatch ? seasonMatch[1] : "1"
        const matchDate = new Date(match.match_date || match.date)
        const seasonStart = new Date(matchDate.getFullYear(), 8, 1)
        const weeksDiff = Math.floor((matchDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const week = Math.max(1, Math.min(weeksDiff + 1, 20))

        setSeasonInfo({
          week: week,
          season: `Season ${seasonNumber}`,
        })
      } else {
        setSeasonInfo({
          week: 8,
          season: "Season 1",
        })
      }
    } catch (error) {
      console.error("Error calculating season info:", error)
      setSeasonInfo({
        week: 8,
        season: "Season 1",
      })
    }
  }

  const fetchMatchStats = async () => {
    try {
      setLoading(true)
      const { data: statsData } = await supabase.from("ea_player_stats").select("*").eq("match_id", match.id)

      if (statsData && statsData.length > 0) {
        setPlayerStats(statsData)

        const homeStats: TeamStats = {
          team_id: match.home_team_id,
          team_name: match.home_team.name,
          goals: 0,
          shots: 0,
          hits: 0,
          pim: 0,
          blocks: 0,
          pp_goals: 0,
          total_faceoffs_won: 0,
          total_faceoffs_taken: 0,
          total_pass_complete: 0,
          total_pass_attempts: 0,
        }

        const awayStats: TeamStats = {
          team_id: match.away_team_id,
          team_name: match.away_team.name,
          goals: 0,
          shots: 0,
          hits: 0,
          pim: 0,
          blocks: 0,
          pp_goals: 0,
          total_faceoffs_won: 0,
          total_faceoffs_taken: 0,
          total_pass_complete: 0,
          total_pass_attempts: 0,
        }

        statsData.forEach((stat: any) => {
          const teamStat = stat.team_id === match.home_team_id ? homeStats : awayStats
          teamStat.goals += stat.goals || 0
          teamStat.shots += stat.shots || 0
          teamStat.hits += stat.hits || 0
          teamStat.pim += stat.pim || 0
          teamStat.blocks += stat.blocks || 0
          teamStat.pp_goals += stat.ppg || 0
          teamStat.total_faceoffs_won += stat.faceoffs_won || 0
          teamStat.total_faceoffs_taken += stat.faceoffs_taken || 0
          teamStat.total_pass_complete += stat.pass_complete || 0
          teamStat.total_pass_attempts += stat.pass_attempts || 0
        })

        // Calculate percentages
        homeStats.faceoff_pct = (homeStats.total_faceoffs_taken || 0) > 0 ? ((homeStats.total_faceoffs_won || 0) / (homeStats.total_faceoffs_taken || 0)) * 100 : 0
        awayStats.faceoff_pct = (awayStats.total_faceoffs_taken || 0) > 0 ? ((awayStats.total_faceoffs_won || 0) / (awayStats.total_faceoffs_taken || 0)) * 100 : 0
        homeStats.passing_pct = (homeStats.total_pass_attempts || 0) > 0 ? ((homeStats.total_pass_complete || 0) / (homeStats.total_pass_attempts || 0)) * 100 : 0
        awayStats.passing_pct = (awayStats.total_pass_attempts || 0) > 0 ? ((awayStats.total_pass_complete || 0) / (awayStats.total_pass_attempts || 0)) * 100 : 0

        setTeamStats([homeStats, awayStats])
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
      const url = "/api/standings"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const standings = Array.isArray(data) ? data : data.standings || []
        const standingsMap: { [key: string]: TeamStanding } = {}
        standings.forEach((team: TeamStanding) => {
          standingsMap[team.id] = team
        })
        setTeamStandings(standingsMap)
      } else {
        setTeamStandings({})
      }
    } catch (error) {
      console.error("Error fetching team standings:", error)
      setTeamStandings({})
    } finally {
      setStandingsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }

  const getTopPlayers = (teamId: string, limit = 3) => {
    return playerStats
      .filter((p) => p.team_id === teamId && p.position !== "G")
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
      .slice(0, limit)
  }

  const getSkaters = (teamId: string) => {
    return playerStats.filter((p) => p.team_id === teamId && p.position !== "G")
  }

  const homeTeamStats = teamStats.find((t) => t.team_id === match.home_team_id)
  const awayTeamStats = teamStats.find((t) => t.team_id === match.away_team_id)
  const homeColors = getTeamColors(match.home_team.name)
  const awayColors = getTeamColors(match.away_team.name)

  const homeStanding = teamStandings[match.home_team_id]
  const awayStanding = teamStandings[match.away_team_id]
  const matchDate = match.match_date || match.date

  const getPeriodScores = () => {
    if (!match.period_scores) return []

    try {
      const scores = typeof match.period_scores === "string" ? JSON.parse(match.period_scores) : match.period_scores

      return [
        { period: 1, home: scores.period1?.home || 0, away: scores.period1?.away || 0 },
        { period: 2, home: scores.period2?.home || 0, away: scores.period2?.away || 0 },
        { period: 3, home: scores.period3?.home || 0, away: scores.period3?.away || 0 },
        ...(match.overtime || match.has_overtime
          ? [{ period: "OT", home: scores.overtime?.home || 0, away: scores.overtime?.away || 0 }]
          : []),
      ]
    } catch {
      return []
    }
  }

  const periodScores = getPeriodScores()

  // Component for stat comparison bars
  const StatComparisonBar = ({
    label,
    homeValue,
    awayValue,
    homeTeam,
    awayTeam,
    isPercentage = false,
  }: {
    label: string
    homeValue: number
    awayValue: number
    homeTeam: string
    awayTeam: string
    isPercentage?: boolean
  }) => {
    const total = homeValue + awayValue
    const homePercentage = total > 0 ? (homeValue / total) * 100 : 50
    const awayPercentage = total > 0 ? (awayValue / total) * 100 : 50

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-purple-300">{label}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-white font-semibold w-12 text-right">
            {isPercentage ? `${homeValue.toFixed(1)}%` : homeValue}
          </span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${homeColors.primary} transition-all duration-300`}
              style={{ width: `${homePercentage}%` }}
            />
          </div>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${awayColors.primary} transition-all duration-300 ml-auto`}
              style={{ width: `${awayPercentage}%` }}
            />
          </div>
          <span className="text-white font-semibold w-12 text-left">
            {isPercentage ? `${awayValue.toFixed(1)}%` : awayValue}
          </span>
        </div>
        <div className="flex justify-between text-xs text-purple-400">
          <span>{homeTeam}</span>
          <span>{awayTeam}</span>
        </div>
      </div>
    )
  }

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
              {matchDate ? formatDate(matchDate) : "Date TBD"}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Period-by-Period Scoring */}
      {periodScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Clock className="h-5 w-5" />
                Period-by-Period Scoring
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2 text-sm font-semibold text-purple-300 border-b border-purple-600/30 pb-2">
                  <span>Team</span>
                  <span className="text-center">1st</span>
                  <span className="text-center">2nd</span>
                  <span className="text-center">3rd</span>
                  <span className="text-center">Total</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2 text-sm items-center">
                  <div className="flex items-center space-x-2">
                    <TeamLogo teamName={match.home_team.name} logoUrl={match.home_team.logo_url} size="xs" />
                    <span className="text-white font-medium">{match.home_team.name}</span>
                  </div>
                  {periodScores.slice(0, 3).map((period) => (
                    <span key={period.period} className="text-center text-white font-semibold">
                      {period.home}
                    </span>
                  ))}
                  <span className="text-center text-white font-bold text-lg">
                    {match.home_score !== null ? match.home_score : "-"}
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-2 text-sm items-center">
                  <div className="flex items-center space-x-2">
                    <TeamLogo teamName={match.away_team.name} logoUrl={match.away_team.logo_url} size="xs" />
                    <span className="text-white font-medium">{match.away_team.name}</span>
                  </div>
                  {periodScores.slice(0, 3).map((period) => (
                    <span key={period.period} className="text-center text-white font-semibold">
                      {period.away}
                    </span>
                  ))}
                  <span className="text-center text-white font-bold text-lg">
                    {match.away_score !== null ? match.away_score : "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Team Statistics Comparison */}
      {homeTeamStats && awayTeamStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5" />
                Team Statistics Comparison
              </h3>
              
              <div className="space-y-6">
                <StatComparisonBar
                  label="Goals"
                  homeValue={homeTeamStats.goals}
                  awayValue={awayTeamStats.goals}
                  homeTeam={match.home_team.name}
                  awayTeam={match.away_team.name}
                />
                <StatComparisonBar
                  label="Shots"
                  homeValue={homeTeamStats.shots}
                  awayValue={awayTeamStats.shots}
                  homeTeam={match.home_team.name}
                  awayTeam={match.away_team.name}
                />
                <StatComparisonBar
                  label="Hits"
                  homeValue={homeTeamStats.hits}
                  awayValue={awayTeamStats.hits}
                  homeTeam={match.home_team.name}
                  awayTeam={match.away_team.name}
                />
                <StatComparisonBar
                  label="Faceoff %"
                  homeValue={homeTeamStats.faceoff_pct || 0}
                  awayValue={awayTeamStats.faceoff_pct || 0}
                  homeTeam={match.home_team.name}
                  awayTeam={match.away_team.name}
                  isPercentage={true}
                />
                <StatComparisonBar
                  label="Passing %"
                  homeValue={homeTeamStats.passing_pct || 0}
                  awayValue={awayTeamStats.passing_pct || 0}
                  homeTeam={match.home_team.name}
                  awayTeam={match.away_team.name}
                  isPercentage={true}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Three Stars of the Match */}
      {playerStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Star className="h-5 w-5" />
                Three Stars of the Match
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(() => {
                  const allPlayers = [
                    ...getTopPlayers(match.home_team_id, 10),
                    ...getTopPlayers(match.away_team_id, 10),
                  ].sort((a, b) => b.goals + b.assists - (a.goals + a.assists))

                  return allPlayers.slice(0, 3).map((player, index) => {
                    const isHomeTeam = player.team_id === match.home_team_id
                    const teamData = isHomeTeam ? match.home_team : match.away_team
                    const starNumber = index + 1
                    const starColors = [
                      "bg-yellow-500 text-black",
                      "bg-gray-400 text-black", 
                      "bg-amber-600 text-white"
                    ]

                    return (
                      <motion.div
                        key={player.player_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="relative overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"
                      >
                        <div className="absolute top-4 left-4">
                          <div className={`${starColors[index]} rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl shadow-lg`}>
                            {starNumber}
                          </div>
                        </div>

                        <div className="p-6 text-center">
                          <div className="flex justify-center mb-4">
                            <TeamLogo teamName={teamData.name} logoUrl={teamData.logo_url} size="lg" />
                          </div>

                          <div className="text-2xl font-bold text-white mb-4 drop-shadow-lg">{player.player_name}</div>
                          <div className="text-purple-300 text-sm mb-4">{player.position || "Unknown Position"}</div>

                          <div className="grid grid-cols-3 gap-4 text-center text-white">
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="font-bold text-2xl text-blue-400">{player.goals}</div>
                              <div className="text-xs opacity-80">Goals</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="font-bold text-2xl text-green-400">{player.assists}</div>
                              <div className="text-xs opacity-80">Assists</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="font-bold text-2xl text-yellow-400">{player.goals + player.assists}</div>
                              <div className="text-xs opacity-80">Points</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                            <div className="text-purple-300">
                              <span className="opacity-70">+/-:</span> 
                              <span className={`ml-1 font-semibold ${player.plus_minus > 0 ? "text-green-400" : player.plus_minus < 0 ? "text-red-400" : "text-purple-300"}`}>
                                {player.plus_minus > 0 ? "+" : ""}{player.plus_minus}
                              </span>
                            </div>
                            <div className="text-purple-300">
                              <span className="opacity-70">Shots:</span> 
                              <span className="ml-1 font-semibold">{player.shots}</span>
                            </div>
                            <div className="text-purple-300">
                              <span className="opacity-70">Hits:</span> 
                              <span className="ml-1 font-semibold">{player.hits}</span>
                            </div>
                            <div className="text-purple-300">
                              <span className="opacity-70">TOI:</span> 
                              <span className="ml-1 font-semibold">{player.toi || "0:00"}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Player Statistics Tables */}
      {playerStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                Player Statistics
              </h3>
              
              <div className="space-y-8">
                {/* Home Team */}
                <div>
                  <div className={`${homeColors.primary} py-2 px-4 rounded-t-md`}>
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <TeamLogo
                        teamName={match.home_team.name}
                        logoUrl={match.home_team.logo_url}
                        size="sm"
                        className="mr-2"
                      />
                      {match.home_team.name}
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-purple-600/30 text-purple-300 bg-white/5">
                          <th className="text-left py-2 px-2">Player</th>
                          <th className="text-center py-2 px-1">Pos</th>
                          <th className="text-center py-2 px-1">G</th>
                          <th className="text-center py-2 px-1">A</th>
                          <th className="text-center py-2 px-1">P</th>
                          <th className="text-center py-2 px-1">+/-</th>
                          <th className="text-center py-2 px-1">S</th>
                          <th className="text-center py-2 px-1">H</th>
                          <th className="text-center py-2 px-1">BLK</th>
                          <th className="text-center py-2 px-1">PIM</th>
                          <th className="text-center py-2 px-1">TOI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSkaters(match.home_team_id)
                          .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
                          .map((player) => (
                            <tr
                              key={player.player_id}
                              className="border-b border-purple-600/20 hover:bg-white/5"
                            >
                              <td className="py-2 px-2 text-white font-medium">
                                <div className="flex items-center">
                                  <TeamLogo
                                    teamName={match.home_team.name}
                                    logoUrl={match.home_team.logo_url}
                                    size="xs"
                                    className="mr-2"
                                  />
                                  {player.player_name}
                                </div>
                              </td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.position || "-"}</td>
                              <td className="py-2 px-1 text-center text-white">{player.goals}</td>
                              <td className="py-2 px-1 text-center text-white">{player.assists}</td>
                              <td className="py-2 px-1 text-center text-white font-semibold">
                                {player.goals + player.assists}
                              </td>
                              <td
                                className={`py-2 px-1 text-center ${player.plus_minus > 0 ? "text-green-400" : player.plus_minus < 0 ? "text-red-400" : "text-purple-300"}`}
                              >
                                {player.plus_minus > 0 ? "+" : ""}
                                {player.plus_minus}
                              </td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.shots}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.hits}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.blocks}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.pim}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.toi || "0:00"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Away Team */}
                <div>
                  <div className={`${awayColors.primary} py-2 px-4 rounded-t-md`}>
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <TeamLogo
                        teamName={match.away_team.name}
                        logoUrl={match.away_team.logo_url}
                        size="sm"
                        className="mr-2"
                      />
                      {match.away_team.name}
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-purple-600/30 text-purple-300 bg-white/5">
                          <th className="text-left py-2 px-2">Player</th>
                          <th className="text-center py-2 px-1">Pos</th>
                          <th className="text-center py-2 px-1">G</th>
                          <th className="text-center py-2 px-1">A</th>
                          <th className="text-center py-2 px-1">P</th>
                          <th className="text-center py-2 px-1">+/-</th>
                          <th className="text-center py-2 px-1">S</th>
                          <th className="text-center py-2 px-1">H</th>
                          <th className="text-center py-2 px-1">BLK</th>
                          <th className="text-center py-2 px-1">PIM</th>
                          <th className="text-center py-2 px-1">TOI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSkaters(match.away_team_id)
                          .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
                          .map((player) => (
                            <tr
                              key={player.player_id}
                              className="border-b border-purple-600/20 hover:bg-white/5"
                            >
                              <td className="py-2 px-2 text-white font-medium">
                                <div className="flex items-center">
                                  <TeamLogo
                                    teamName={match.away_team.name}
                                    logoUrl={match.away_team.logo_url}
                                    size="xs"
                                    className="mr-2"
                                  />
                                  {player.player_name}
                                </div>
                              </td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.position || "-"}</td>
                              <td className="py-2 px-1 text-center text-white">{player.goals}</td>
                              <td className="py-2 px-1 text-center text-white">{player.assists}</td>
                              <td className="py-2 px-1 text-center text-white font-semibold">
                                {player.goals + player.assists}
                              </td>
                              <td
                                className={`py-2 px-1 text-center ${player.plus_minus > 0 ? "text-green-400" : player.plus_minus < 0 ? "text-red-400" : "text-purple-300"}`}
                              >
                                {player.plus_minus > 0 ? "+" : ""}
                                {player.plus_minus}
                              </td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.shots}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.hits}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.blocks}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.pim}</td>
                              <td className="py-2 px-1 text-center text-purple-300">{player.toi || "0:00"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
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
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Standings Impact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Team Standing */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-200 text-center">{match.home_team.name}</h4>
                  {homeStanding && (
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-200">{homeStanding.points}</div>
                          <div className="text-sm text-blue-300">Points</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-200">
                            {homeStanding.wins}-{homeStanding.losses}-{homeStanding.otl}
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
                  {awayStanding && (
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-red-200">{awayStanding.points}</div>
                          <div className="text-sm text-red-300">Points</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-200">
                            {awayStanding.wins}-{awayStanding.losses}-{awayStanding.otl}
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
