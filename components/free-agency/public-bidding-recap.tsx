"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Users, Trophy, UserCheck, Target, Award, Medal, Crown, TrendingUp } from "lucide-react"
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2 bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-white/20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full bg-white/20" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30">
        <CardContent className="pt-6">
          <p className="text-red-200">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
        <CardContent className="pt-6">
          <p className="text-white/60">No bidding recap data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Team Statistics */}
      <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Team Bidding Statistics & Rosters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.teamStats.map((teamStat, index) => {
                const capSpaceRemaining = 30000000 - teamStat.currentSalary
                const totalRosterSize = teamStat.currentRoster.length

                return (
                  <div 
                    key={teamStat.team.id} 
                    className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 animate-slide-in"
                    style={{ animationDelay: `${200 + index * 100}ms` }}
                  >
                    {/* Team Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Badge
                            variant="outline"
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/50 text-yellow-200"
                          >
                            {index + 1}
                          </Badge>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1">
                              {index === 0 && <Crown className="h-4 w-4 text-yellow-400" />}
                              {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                              {index === 2 && <Award className="h-4 w-4 text-amber-600" />}
                            </div>
                          )}
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
                          <h3 className="text-xl font-bold text-white">{teamStat.team.name}</h3>
                          <p className="text-sm text-white/60">
                            {totalRosterSize} players • {formatCurrency(teamStat.currentSalary)} salary
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-300">{formatCurrency(capSpaceRemaining)}</p>
                        <p className="text-sm text-white/60">Cap Space Remaining</p>
                      </div>
                    </div>

                    {/* Bidding Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-400/20 rounded-lg">
                        <p className="text-lg font-semibold text-blue-200">{teamStat.totalBids}</p>
                        <p className="text-xs text-blue-300">Total Bids</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 rounded-lg">
                        <p className="text-lg font-semibold text-purple-200">{teamStat.uniquePlayersCount}</p>
                        <p className="text-xs text-purple-300">Players Bid On</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 rounded-lg">
                        <p className="text-lg font-semibold text-green-200">{teamStat.wonPlayers.length}</p>
                        <p className="text-xs text-green-300">Won Players</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-400/20 rounded-lg">
                        <p className="text-lg font-semibold text-cyan-200">{totalRosterSize}</p>
                        <p className="text-xs text-cyan-300">Current Roster</p>
                      </div>
                    </div>

                    {/* Won Players */}
                    {teamStat.wonPlayers.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <UserCheck className="h-4 w-4 text-green-400" />
                          <h4 className="font-medium text-white">Won Players ({teamStat.wonPlayers.length})</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {teamStat.wonPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 rounded-lg hover:border-green-400/40 transition-all duration-300"
                            >
                              <div>
                                <span className="font-medium text-white">{player.gamer_tag_id}</span>
                                <span className="text-green-300 ml-2">
                                  ({getPositionAbbreviation(player.primary_position)})
                                </span>
                              </div>
                              <span className="font-semibold text-green-300">{formatCurrency(player.winningBid)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Roster Preview */}
                    {teamStat.currentRoster.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-blue-400" />
                          <h4 className="font-medium text-white">Current Roster ({teamStat.currentRoster.length})</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                          {teamStat.currentRoster.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/20 rounded-lg hover:border-blue-400/40 transition-all duration-300"
                            >
                              <div>
                                <span className="font-medium text-white">{player.gamer_tag_id}</span>
                                <span className="text-blue-300 ml-2">
                                  ({getPositionAbbreviation(player.primary_position)})
                                </span>
                              </div>
                              <span className="font-semibold text-blue-300">{formatCurrency(player.salary)}</span>
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
      </div>

      {/* Player Bid History */}
      <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Player Bid History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.playerBids.map((playerBid, index) => (
                <div 
                  key={playerBid.player.id} 
                  className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 animate-slide-in"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold text-lg text-white">{playerBid.player.gamer_tag_id}</h3>
                        <p className="text-sm text-white/60">
                          {playerBid.player.primary_position}
                          {playerBid.player.secondary_position && ` / ${playerBid.player.secondary_position}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-300">{formatCurrency(playerBid.highestBid)}</p>
                      <p className="text-sm text-white/60">Highest Bid • {playerBid.totalBids} total bids</p>
                      {playerBid.winningTeam && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-4 h-4">
                            <TeamLogo
                              teamId={playerBid.winningTeam.id}
                              teamName={playerBid.winningTeam.name}
                              logoUrl={playerBid.winningTeam.logo_url}
                              size="xs"
                            />
                          </div>
                          <span className="text-xs text-green-300 font-medium">Won by {playerBid.winningTeam.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/20" />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-white/60 mb-3">Bid History</h4>
                    {playerBid.bids.map((bid, bidIndex) => (
                      <div 
                        key={bid.id} 
                        className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:border-white/30 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6">
                            <TeamLogo
                              teamId={bid.team.id}
                              teamName={bid.team.name}
                              logoUrl={bid.team.logo_url}
                              size="xs"
                            />
                          </div>
                          <span className="font-medium text-white">{bid.team.name}</span>
                          {bidIndex === 0 && (
                            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-200 text-xs">
                              Winner
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-white">{formatCurrency(bid.bid_amount)}</span>
                          <span className="text-xs text-white/60">{formatDate(bid.created_at)}</span>
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
    </div>
  )
}
