"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Users, Trophy, UserCheck, Target, TrendingUp, Award, Star, Zap, Clock, TrendingDown, BarChart3, Activity, Shield, Shield as GoalieMask, GamepadIcon } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import { Skeleton } from "@/components/ui/skeleton"

interface BidData {
  id: string
  bid_amount: number
  created_at: string
  team: {
    id: string
    name: string
    logo_url: string | null
  }
}

interface WonPlayer {
  id: string
  gamer_tag_id: string
  primary_position: string
  secondary_position: string | null
  winningBid: number
}

interface RosterPlayer {
  id: string
  gamer_tag_id: string
  primary_position: string
  secondary_position: string | null
  salary: number
}

interface PlayerBid {
  player: {
    id: string
    gamer_tag_id: string
    primary_position: string
    secondary_position: string | null
  }
  bids: BidData[]
  highestBid: number
  totalBids: number
  winningTeam: {
    id: string
    name: string
    logo_url: string | null
  } | null
}

interface TeamStat {
  team: {
    id: string
    name: string
    logo_url: string | null
  }
  totalBids: number
  uniquePlayersCount: number
  currentSalary: number
  currentRoster: RosterPlayer[]
  wonPlayers: WonPlayer[]
  bids: BidData[]
}

interface BiddingRecapData {
  teamStats: TeamStat[]
  playerBids: PlayerBid[]
  totalBids: number
  totalPlayers: number
  totalTeams: number
}

export function PublicBiddingRecap() {
  const [data, setData] = useState<BiddingRecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBiddingRecap()
  }, [])

  const fetchBiddingRecap = async () => {
    try {
      const response = await fetch("/api/bidding-recap")
      if (!response.ok) {
        throw new Error("Failed to fetch bidding recap")
      }

      const recapData = await response.json()
      setData(recapData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPositionAbbreviation = (position: string) => {
    const abbrevs: { [key: string]: string } = {
      "Left Wing": "LW",
      "Right Wing": "RW",
      Center: "C",
      "Left Defense": "LD",
      "Right Defense": "RD",
      Goalie: "G",
    }
    return abbrevs[position] || position
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading Header */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-blue-600 mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">Loading Bidding Recap</h1>
          <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Gathering all bidding activity data...</p>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
                <Skeleton className="h-4 w-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Content Cards */}
        <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="p-6 bg-gradient-to-r from-goal-red-500/20 to-goal-red-500/20 rounded-full w-fit mx-auto mb-6">
          <Shield className="h-16 w-16 text-goal-red-600 dark:text-goal-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">Error Loading Data</h1>
        <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6">Unable to load bidding recap data. Please try again later.</p>
        <Card className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 max-w-md mx-auto">
          <CardContent className="p-4">
            <p className="text-goal-red-800 dark:text-goal-red-200 text-sm">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <div className="p-6 bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 rounded-full w-fit mx-auto mb-6">
          <BarChart3 className="h-16 w-16 text-hockey-silver-600 dark:text-hockey-silver-400" />
        </div>
        <h1 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">No Data Available</h1>
        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">No bidding recap data is currently available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="text-center py-8">
        <h1 className="hockey-title mb-4">Bidding Recap</h1>
        <p className="hockey-subtitle">Complete overview of all free agency bidding activity and team acquisitions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 hover:scale-105 transition-transform duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">{data.totalBids}</p>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Total Bids</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 hover:scale-105 transition-transform duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">{data.totalPlayers}</p>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Players Bid On</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 hover:scale-105 transition-transform duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">{data.totalTeams}</p>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Teams Participating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 hover:scale-105 transition-transform duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  {formatCurrency(data.teamStats.reduce((sum, team) => sum + team.currentSalary, 0))}
                </p>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Total League Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Statistics */}
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                Team Bidding Statistics & Rosters
              </div>
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                Detailed breakdown of each team's bidding activity and current roster
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.teamStats.map((teamStat, index) => {
              const capSpaceRemaining = 30000000 - teamStat.currentSalary
              const totalRosterSize = teamStat.currentRoster.length

              return (
                <div key={teamStat.team.id} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                  {/* Team Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg text-white font-bold text-lg min-w-[3rem] text-center">
                        #{index + 1}
                      </div>
                      <div className="w-12 h-12">
                        <TeamLogo
                          teamId={teamStat.team.id}
                          teamName={teamStat.team.name}
                          logoUrl={teamStat.team.logo_url}
                          size="md"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{teamStat.team.name}</h3>
                        <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                          {totalRosterSize} players • {formatCurrency(teamStat.currentSalary)} salary
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-assist-green-600 dark:text-assist-green-400">{formatCurrency(capSpaceRemaining)}</p>
                      <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Cap Space Remaining</p>
                    </div>
                  </div>

                  {/* Bidding Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20 rounded-lg border border-ice-blue-200/50 dark:border-ice-blue-700/50">
                      <p className="text-lg font-semibold text-ice-blue-700 dark:text-ice-blue-300">{teamStat.totalBids}</p>
                      <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Total Bids</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20 rounded-lg border border-rink-blue-200/50 dark:border-rink-blue-700/50">
                      <p className="text-lg font-semibold text-rink-blue-700 dark:text-rink-blue-300">{teamStat.uniquePlayersCount}</p>
                      <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Players Bid On</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20 rounded-lg border border-assist-green-200/50 dark:border-assist-green-700/50">
                      <p className="text-lg font-semibold text-assist-green-600 dark:text-assist-green-400">{teamStat.wonPlayers.length}</p>
                      <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Won Players</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20 rounded-lg border border-goal-red-200/50 dark:border-goal-red-700/50">
                      <p className="text-lg font-semibold text-goal-red-600 dark:text-goal-red-400">{totalRosterSize}</p>
                      <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Current Roster</p>
                    </div>
                  </div>

                  {/* Won Players */}
                  {teamStat.wonPlayers.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                          <UserCheck className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Won Players ({teamStat.wonPlayers.length})</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teamStat.wonPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-3 bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border border-assist-green-200/50 dark:border-assist-green-700/50 rounded-lg text-sm hover:scale-105 transition-transform duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-gradient-to-r from-assist-green-500/20 to-assist-green-500/20 rounded">
                                <GamepadIcon className="h-3 w-3 text-assist-green-600 dark:text-assist-green-400" />
                              </div>
                              <span className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{player.gamer_tag_id}</span>
                              <Badge variant="outline" className="text-xs border-assist-green-300 dark:border-assist-green-600 text-assist-green-700 dark:text-assist-green-300">
                                {getPositionAbbreviation(player.primary_position)}
                              </Badge>
                            </div>
                            <span className="font-semibold text-assist-green-600 dark:text-assist-green-400">{formatCurrency(player.winningBid)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Roster Preview */}
                  {teamStat.currentRoster.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Current Roster ({teamStat.currentRoster.length})</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                        {teamStat.currentRoster.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-3 bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 border border-rink-blue-200/50 dark:border-rink-blue-700/50 rounded-lg text-sm hover:scale-105 transition-transform duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-gradient-to-r from-rink-blue-500/20 to-rink-blue-500/20 rounded">
                                <GoalieMask className="h-3 w-3 text-rink-blue-600 dark:text-rink-blue-400" />
                              </div>
                              <span className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{player.gamer_tag_id}</span>
                              <Badge variant="outline" className="text-xs border-rink-blue-300 dark:border-rink-blue-600 text-rink-blue-700 dark:text-rink-blue-300">
                                {getPositionAbbreviation(player.primary_position)}
                              </Badge>
                            </div>
                            <span className="font-semibold text-rink-blue-600 dark:text-rink-blue-400">{formatCurrency(player.salary)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Player Bid History */}
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                Player Bid History
              </div>
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                Complete bidding history for each player in free agency
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.playerBids.map((playerBid) => (
              <div key={playerBid.player.id} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-lg">
                      <GamepadIcon className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-hockey-silver-800 dark:text-hockey-silver-200">{playerBid.player.gamer_tag_id}</h3>
                      <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                        {playerBid.player.primary_position}
                        {playerBid.player.secondary_position && ` / ${playerBid.player.secondary_position}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-assist-green-600 dark:text-assist-green-400">{formatCurrency(playerBid.highestBid)}</p>
                    <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Highest Bid • {playerBid.totalBids} total bids</p>
                    {playerBid.winningTeam && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5">
                          <TeamLogo
                            teamId={playerBid.winningTeam.id}
                            teamName={playerBid.winningTeam.name}
                            logoUrl={playerBid.winningTeam.logo_url}
                            size="xs"
                          />
                        </div>
                        <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 text-xs">
                          Won by {playerBid.winningTeam.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4 bg-ice-blue-200/50 dark:bg-rink-blue-700/50" />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-hockey-silver-600 dark:text-hockey-silver-400 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Bid History
                  </h4>
                  {playerBid.bids.map((bid, bidIndex) => (
                    <div key={bid.id} className="flex items-center justify-between py-3 px-4 bg-gradient-to-br from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-900/30 dark:to-hockey-silver-800/20 rounded-lg border border-hockey-silver-200/50 dark:border-hockey-silver-700/50 hover:scale-105 transition-transform duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6">
                          <TeamLogo
                            teamId={bid.team.id}
                            teamName={bid.team.name}
                            logoUrl={bid.team.logo_url}
                            size="xs"
                          />
                        </div>
                        <span className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{bid.team.name}</span>
                        {bidIndex === 0 && (
                          <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">{formatCurrency(bid.bid_amount)}</span>
                        <span className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(bid.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
