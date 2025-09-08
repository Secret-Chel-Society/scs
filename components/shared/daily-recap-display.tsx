"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trophy, TrendingDown, AlertTriangle, Shield, MessageSquare, Users, Zap, ArrowUp, Clock } from "lucide-react"
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
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No completed matches found in the specified time period.</p>
        </CardContent>
      </Card>
    )
  }

  const timeWindow = recapData.time_window_hours || 24
  const generationTime = recapData.generation_timestamp
    ? new Date(recapData.generation_timestamp).toLocaleString()
    : null

  return (
    <div className="space-y-6">
      {/* Time Window Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Daily Recap - Last {timeWindow} Hours
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>
              {recapData.total_matches} matches completed • {recapData.team_recaps.length} teams analyzed • AI-powered
              insights
            </span>
            {generationTime && <span className="text-xs">Generated: {generationTime}</span>}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Analysis of {recapData.total_matches} matches over the last {timeWindow} hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recapData.best_team && (
              <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <Trophy className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Best Team Performance</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {recapData.best_team.team_name} ({recapData.best_team.record.wins}-
                    {recapData.best_team.record.losses}-{recapData.best_team.record.otl})
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Goal differential: {recapData.best_team.total_goal_differential >= 0 ? "+" : ""}
                    {recapData.best_team.total_goal_differential}
                  </p>
                </div>
              </div>
            )}

            {recapData.worst_team && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200">Needs Improvement</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {recapData.worst_team.team_name} ({recapData.worst_team.record.wins}-
                    {recapData.worst_team.record.losses}-{recapData.worst_team.record.otl})
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
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
          const hasCallouts =
            (team.callouts?.great_offense?.length || 0) > 0 ||
            (team.callouts?.fourth_forward?.length || 0) > 0 ||
            (team.callouts?.high_turnovers?.length || 0) > 0 ||
            (team.callouts?.strong_defense?.length || 0) > 0 ||
            (team.callouts?.underwhelming?.length || 0) > 0

          return (
            <Card key={team.team_id} className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {team.team_logo && (
                      <Image
                        src={team.team_logo || "/placeholder.svg"}
                        alt={team.team_name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <CardTitle className="text-lg">{team.team_name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    {team.matches.map((match, idx) => (
                      <Badge key={idx} variant={getResultBadgeVariant(match.result)}>
                        {match.result}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardDescription>
                  Record: {team.record.wins}-{team.record.losses}-{team.record.otl} • Goal Diff:{" "}
                  {team.total_goal_differential >= 0 ? "+" : ""}
                  {team.total_goal_differential} • {team.all_players.length} players
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Match Results */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Match Results</h4>
                  <div className="space-y-1">
                    {team.matches.map((match, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>vs {match.opponent}</span>
                        <span
                          className={`font-mono ${
                            match.result === "W"
                              ? "text-green-600"
                              : match.result === "OTL"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {match.score} {match.overtime ? "(OT)" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Full Roster with Player Summaries */}
                {showFullRoster && (
                  <>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Full Roster Analysis ({team.all_players.length} players)
                      </h4>
                      <div className="space-y-3 text-xs">
                        {/* Forwards */}
                        {team.all_players
                          .filter((p) => ["C", "LW", "RW"].includes(p.position))
                          .sort((a, b) => {
                            const aPoints = (a.goals + a.assists) / a.games_played
                            const bPoints = (b.goals + b.assists) / b.games_played
                            return bPoints - aPoints
                          })
                          .map((player, idx) => (
                            <div key={idx} className="border-l-2 border-blue-200 pl-3">
                              <div className="flex justify-between items-start">
                                <span className="font-medium">
                                  {player.player_name} ({player.position})
                                </span>
                                <span className="text-muted-foreground text-right">{formatPlayerStats(player)}</span>
                              </div>
                              {team.player_summaries?.[player.player_name] && (
                                <p className="text-muted-foreground mt-1 leading-relaxed">
                                  {team.player_summaries[player.player_name]}
                                </p>
                              )}
                            </div>
                          ))}

                        {/* Defense */}
                        {team.all_players
                          .filter((p) => ["LD", "RD"].includes(p.position))
                          .sort((a, b) => {
                            const aPoints = (a.goals + a.assists) / a.games_played
                            const bPoints = (b.goals + b.assists) / b.games_played
                            return bPoints - aPoints
                          })
                          .map((player, idx) => (
                            <div key={idx} className="border-l-2 border-green-200 pl-3">
                              <div className="flex justify-between items-start">
                                <span className="font-medium">
                                  {player.player_name} ({player.position})
                                </span>
                                <span className="text-muted-foreground text-right">{formatPlayerStats(player)}</span>
                              </div>
                              {team.player_summaries?.[player.player_name] && (
                                <p className="text-muted-foreground mt-1 leading-relaxed">
                                  {team.player_summaries[player.player_name]}
                                </p>
                              )}
                            </div>
                          ))}

                        {/* Goalies */}
                        {team.all_players
                          .filter((p) => p.position === "G")
                          .map((player, idx) => (
                            <div key={idx} className="border-l-2 border-red-200 pl-3">
                              <div className="flex justify-between items-start">
                                <span className="font-medium">
                                  {player.player_name} ({player.position})
                                </span>
                                <span className="text-muted-foreground text-right">{formatPlayerStats(player)}</span>
                              </div>
                              {team.player_summaries?.[player.player_name] && (
                                <p className="text-muted-foreground mt-1 leading-relaxed">
                                  {team.player_summaries[player.player_name]}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Top Players */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    Top Performers
                  </h4>
                  <div className="space-y-2 text-xs">
                    {team.top_players.forward && (
                      <div>
                        <span className="font-medium">Forward:</span> {team.top_players.forward.player_name} (
                        {team.top_players.forward.position})
                        <div className="text-muted-foreground ml-2">{formatPlayerStats(team.top_players.forward)}</div>
                      </div>
                    )}
                    {team.top_players.defense && (
                      <div>
                        <span className="font-medium">Defense:</span> {team.top_players.defense.player_name} (
                        {team.top_players.defense.position})
                        <div className="text-muted-foreground ml-2">{formatPlayerStats(team.top_players.defense)}</div>
                      </div>
                    )}
                    {team.top_players.goalie && (
                      <div>
                        <span className="font-medium">Goalie:</span> {team.top_players.goalie.player_name}
                        <div className="text-muted-foreground ml-2">{formatPlayerStats(team.top_players.goalie)}</div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Worst Players */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    Needs Improvement
                  </h4>
                  <div className="space-y-2 text-xs">
                    {team.worst_players?.forward && (
                      <div>
                        <span className="font-medium">Forward:</span> {team.worst_players.forward.player_name} (
                        {team.worst_players.forward.position})
                        <div className="text-muted-foreground ml-2">
                          {formatPlayerStats(team.worst_players.forward)}
                        </div>
                      </div>
                    )}
                    {team.worst_players?.defense && (
                      <div>
                        <span className="font-medium">Defense:</span> {team.worst_players.defense.player_name} (
                        {team.worst_players.defense.position})
                        <div className="text-muted-foreground ml-2">
                          {formatPlayerStats(team.worst_players.defense)}
                        </div>
                      </div>
                    )}
                    {team.worst_players?.goalie && (
                      <div>
                        <span className="font-medium">Goalie:</span> {team.worst_players.goalie.player_name}
                        <div className="text-muted-foreground ml-2">{formatPlayerStats(team.worst_players.goalie)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Callouts */}
                {hasCallouts && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Notable Performances</h4>
                      <div className="space-y-1 text-xs">
                        {/* Great Offense - Show for forwards with high PPG */}
                        {team.callouts?.great_offense?.length > 0 && (
                          <div className="flex items-start space-x-1">
                            <Zap className="h-3 w-3 text-yellow-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-yellow-700 dark:text-yellow-400">Great Offense:</span>
                              <span className="ml-1">
                                {team.callouts.great_offense
                                  .map(
                                    (p) =>
                                      `${p.player_name} (${((p.goals + p.assists) / p.games_played).toFixed(1)} PPG)`,
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 4th Forward - Show for defense with high PPG */}
                        {team.callouts?.fourth_forward?.length > 0 && (
                          <div className="flex items-start space-x-1">
                            <ArrowUp className="h-3 w-3 text-blue-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-blue-700 dark:text-blue-400">4th Forward:</span>
                              <span className="ml-1">
                                {team.callouts.fourth_forward
                                  .map(
                                    (p) =>
                                      `${p.player_name} (${((p.goals + p.assists) / p.games_played).toFixed(1)} PPG)`,
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* High Turnovers */}
                        {team.callouts?.high_turnovers?.length > 0 && (
                          <div className="flex items-start space-x-1">
                            <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-orange-700 dark:text-orange-400">High Turnovers:</span>
                              <span className="ml-1">
                                {team.callouts.high_turnovers
                                  .map((p) => `${p.player_name} (${(p.giveaways / p.games_played).toFixed(1)}/game)`)
                                  .join(", ")}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Strong Defense */}
                        {team.callouts?.strong_defense?.length > 0 && (
                          <div className="flex items-start space-x-1">
                            <Shield className="h-3 w-3 text-green-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-green-700 dark:text-green-400">Strong Defense:</span>
                              <span className="ml-1">
                                {team.callouts.strong_defense
                                  .map(
                                    (p) =>
                                      `${p.player_name} (${(p.takeaways / p.games_played).toFixed(1)} takeaways/game)`,
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Underwhelming */}
                        {team.callouts?.underwhelming?.length > 0 && (
                          <div className="flex items-start space-x-1">
                            <TrendingDown className="h-3 w-3 text-red-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-red-700 dark:text-red-400">Underwhelming:</span>
                              <span className="ml-1">
                                {team.callouts.underwhelming.map((p) => p.player_name).join(", ")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Team Summary - AI Analysis */}
                {team.summary && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        AI Team Analysis
                      </h4>
                      <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                        {team.summary}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
