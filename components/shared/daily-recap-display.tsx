"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trophy, TrendingDown, AlertTriangle, Shield, MessageSquare, Users, Zap, ArrowUp, Clock, Star, Target, TrendingUp, Activity, BarChart3, GamepadIcon, Shield as GoalieMask, Award } from "lucide-react"
import Image from "next/image"

interface PlayerStats {
  player_name: string
  position: string
  team_id: string
  goals: number
  assists: number
  shots: number
  hits: number
  pim: number
  plus_minus: number
  blocks: number
  giveaways: number
  takeaways: number
  saves?: number
  goals_against?: number
  glshots?: number
  games_played: number
}

interface TeamMatch {
  match_id: string
  opponent: string
  score: string
  result: "W" | "L" | "OTL"
  goal_differential: number
  overtime: boolean
}

interface TeamRecap {
  team_name: string
  team_id: string
  team_logo?: string
  record: { wins: number; losses: number; otl: number }
  matches: TeamMatch[]
  total_goal_differential: number
  top_players: {
    forward?: PlayerStats
    defense?: PlayerStats
    goalie?: PlayerStats
  }
  worst_players: {
    forward?: PlayerStats
    defense?: PlayerStats
    goalie?: PlayerStats
  }
  callouts: {
    high_turnovers: PlayerStats[]
    strong_defense: PlayerStats[]
    underwhelming: PlayerStats[]
    great_offense: PlayerStats[]
    fourth_forward: PlayerStats[]
  }
  all_players: PlayerStats[]
  summary?: string
  player_summaries?: { [playerName: string]: string }
}

interface RecapData {
  date: string
  team_recaps: TeamRecap[]
  best_team: TeamRecap | null
  worst_team: TeamRecap | null
  total_matches: number
  time_window_hours?: number
  generation_timestamp?: number
}

interface DailyRecapDisplayProps {
  recapData: RecapData
  showFullRoster?: boolean
}

function calculateSavePercentage(saves: number, goals_against: number): number {
  const totalShots = saves + goals_against
  if (totalShots === 0) return 0
  return saves / totalShots
}

function formatPlayerStats(player: PlayerStats): string {
  const ppg = ((player.goals + player.assists) / player.games_played).toFixed(1)
  const plusMinus = player.plus_minus >= 0 ? `+${player.plus_minus}` : `${player.plus_minus}`

  if (player.position === "G") {
    const savePct =
      player.saves && player.goals_against !== undefined
        ? calculateSavePercentage(player.saves, player.goals_against).toFixed(3)
        : "0.000"
    return `${player.saves || 0} saves, ${savePct} SV%, ${player.goals_against || 0} GA`
  }

  return `${player.goals}G ${player.assists}A (${ppg} PPG), ${plusMinus}, ${player.giveaways} giveaways, ${player.takeaways} takeaways`
}

function getResultBadgeVariant(result: string): "default" | "secondary" | "destructive" | "outline" {
  switch (result) {
    case "W":
      return "default"
    case "OTL":
      return "secondary"
    case "L":
      return "destructive"
    default:
      return "outline"
  }
}

export default function DailyRecapDisplay({ recapData, showFullRoster = false }: DailyRecapDisplayProps) {
  if (!recapData?.team_recaps?.length) {
    return (
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
        <CardContent className="text-center py-12">
          <div className="p-6 bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 rounded-full w-fit mx-auto mb-6">
            <Target className="h-16 w-16 text-hockey-silver-600 dark:text-hockey-silver-400" />
          </div>
          <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">No Completed Matches</h2>
          <p className="text-hockey-silver-600 dark:text-hockey-silver-400">No completed matches found in the specified time period.</p>
        </CardContent>
      </Card>
    )
  }

  const timeWindow = recapData.time_window_hours || 24
  const generationTime = recapData.generation_timestamp
    ? new Date(recapData.generation_timestamp).toLocaleString()
    : null

  return (
    <div className="space-y-8">
      {/* Time Window Header */}
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-ice-blue-800 dark:text-ice-blue-200">
            <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            Daily Recap - Last {timeWindow} Hours
          </CardTitle>
          <CardDescription className="flex items-center justify-between text-ice-blue-700 dark:text-ice-blue-300">
            <span>
              {recapData.total_matches} matches completed • {recapData.team_recaps.length} teams analyzed • AI-powered
              insights
            </span>
            {generationTime && <span className="text-xs">Generated: {generationTime}</span>}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary */}
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                Performance Summary
              </div>
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                Analysis of {recapData.total_matches} matches over the last {timeWindow} hours
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recapData.best_team && (
              <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20 rounded-xl border border-assist-green-200/50 dark:border-assist-green-700/50">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-assist-green-800 dark:text-assist-green-200">Best Team Performance</h4>
                  <p className="text-sm text-assist-green-700 dark:text-assist-green-300">
                    {recapData.best_team.team_name} ({recapData.best_team.record.wins}-
                    {recapData.best_team.record.losses}-{recapData.best_team.record.otl})
                  </p>
                  <p className="text-xs text-assist-green-600 dark:text-assist-green-400">
                    Goal differential: {recapData.best_team.total_goal_differential >= 0 ? "+" : ""}
                    {recapData.best_team.total_goal_differential}
                  </p>
                </div>
              </div>
            )}

            {recapData.worst_team && (
              <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20 rounded-xl border border-goal-red-200/50 dark:border-goal-red-700/50">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-goal-red-800 dark:text-goal-red-200">Needs Improvement</h4>
                  <p className="text-sm text-goal-red-700 dark:text-goal-red-300">
                    {recapData.worst_team.team_name} ({recapData.worst_team.record.wins}-
                    {recapData.worst_team.record.losses}-{recapData.worst_team.record.otl})
                  </p>
                  <p className="text-xs text-goal-red-600 dark:text-goal-red-400">
                    Goal differential: {recapData.worst_team.total_goal_differential >= 0 ? "+" : ""}
                    {recapData.worst_team.total_goal_differential}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Recaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recapData.team_recaps.map((team) => {
          // Check if any callouts exist
          const hasCallouts = Object.values(team.callouts).some((callout) => callout.length > 0)

          return (
            <Card key={team.team_id} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                      {team.team_name}
                    </div>
                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                      {team.record.wins}-{team.record.losses}-{team.record.otl} • {team.matches.length} matches
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Matches */}
                {team.matches.length > 0 && (
                  <div>
                    <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200 mb-2 flex items-center gap-2">
                      <GamepadIcon className="h-4 w-4" />
                      Recent Matches
                    </h4>
                    <div className="space-y-2">
                      {team.matches.map((match) => (
                        <div
                          key={match.match_id}
                          className="flex items-center justify-between p-2 bg-gradient-to-br from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-900/30 dark:to-hockey-silver-800/20 rounded-lg border border-hockey-silver-200/50 dark:border-hockey-silver-700/50"
                        >
                          <span className="text-sm text-hockey-silver-800 dark:text-hockey-silver-200">
                            vs {match.opponent}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                              {match.score}
                            </span>
                            <Badge
                              variant={getResultBadgeVariant(match.result)}
                              className={
                                match.result === "W"
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0"
                                  : match.result === "OTL"
                                  ? "bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 text-white border-0"
                                  : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0"
                              }
                            >
                              {match.result}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Players */}
                {Object.values(team.top_players).some((player) => player) && (
                  <div>
                    <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200 mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-assist-green-600" />
                      Top Performers
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(team.top_players).map(([position, player]) => {
                        if (!player) return null
                        return (
                          <div
                            key={position}
                            className="p-2 bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/20 dark:to-assist-green-800/20 rounded-lg border border-assist-green-200/50 dark:border-assist-green-700/50"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                                {player.player_name} ({position})
                              </span>
                              <Badge variant="outline" className="border-assist-green-300 dark:border-assist-green-600 text-assist-green-700 dark:text-assist-green-300 text-xs">
                                {player.position === "G" ? "G" : player.position === "D" ? "D" : "F"}
                              </Badge>
                            </div>
                            <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 mt-1">
                              {formatPlayerStats(player)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Callouts */}
                {hasCallouts && (
                  <div>
                    <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-goal-red-600" />
                      Key Insights
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(team.callouts).map(([type, players]) => {
                        if (players.length === 0) return null
                        return (
                          <div key={type} className="p-2 bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/20 dark:to-goal-red-800/20 rounded-lg border border-goal-red-200/50 dark:border-goal-red-700/50">
                            <h5 className="text-xs font-medium text-goal-red-800 dark:text-goal-red-200 mb-1 capitalize">
                              {type.replace(/_/g, " ")}
                            </h5>
                            <div className="space-y-1">
                              {players.map((player) => (
                                <div key={player.player_name} className="text-xs text-goal-red-700 dark:text-goal-red-300">
                                  {player.player_name} ({player.position})
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {team.summary && (
                  <div>
                    <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-rink-blue-600" />
                      AI Analysis
                    </h4>
                    <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-3 rounded-lg border border-rink-blue-200/50 dark:border-rink-blue-700/50">
                      {team.summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
