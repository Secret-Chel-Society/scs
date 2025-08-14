"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, RefreshCw, DollarSign, Users, Trophy, Download, UserCheck, Target } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import { useToast } from "@/hooks/use-toast"

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

interface PositionCounts {
  "Left Wing": number
  "Right Wing": number
  Center: number
  "Left Defense": number
  "Right Defense": number
  Goalie: number
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
  positionCounts: PositionCounts
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

export function BiddingRecap() {
  const [data, setData] = useState<BiddingRecapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBiddingRecap = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/bidding-recap")
      if (!response.ok) {
        throw new Error("Failed to fetch bidding recap")
      }

      const recapData = await response.json()
      setData(recapData)

      // Save the recap data for public viewing
      try {
        const saveResponse = await fetch("/api/bidding-recap/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recapData),
        })

        if (saveResponse.ok) {
          toast({
            title: "Success",
            description: "Bidding recap generated and saved for public viewing!",
          })
        } else {
          const errorData = await saveResponse.json()
          console.error("Save error details:", errorData)
          toast({
            title: "Partial Success",
            description: `Recap generated but save failed: ${errorData.details || errorData.error || "Unknown error"}`,
            variant: "destructive",
          })
        }
      } catch (saveError) {
        console.error("Failed to save public recap:", saveError)
        toast({
          title: "Partial Success",
          description: `Recap generated but save failed: ${saveError instanceof Error ? saveError.message : "Network error"}`,
          variant: "destructive",
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Error",
        description: "Failed to generate bidding recap.",
        variant: "destructive",
      })
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

  const downloadCSV = () => {
    if (!data) return

    let csvContent = "MGHL Bidding Recap\n\n"

    // Summary
    csvContent += "SUMMARY\n"
    csvContent += `Total Bids,${data.totalBids}\n`
    csvContent += `Players Bid On,${data.totalPlayers}\n`
    csvContent += `Teams Participating,${data.totalTeams}\n`
    csvContent += `Total League Salary,${formatCurrency(data.teamStats.reduce((sum, team) => sum + team.currentSalary, 0))}\n\n`

    // Team Statistics with Won Players
    csvContent += "TEAM STATISTICS\n"
    csvContent += "Rank,Team,Total Bids,Players Bid On,Won Players,Current Salary,Cap Space Remaining\n"
    data.teamStats.forEach((team, index) => {
      const capSpaceRemaining = 30000000 - team.currentSalary
      csvContent += `${index + 1},${team.team.name},${team.totalBids},${team.uniquePlayersCount},${team.wonPlayers.length},${formatCurrency(team.currentSalary)},${formatCurrency(capSpaceRemaining)}\n`
    })

    // Won Players by Team
    csvContent += "\nWON PLAYERS BY TEAM\n"
    data.teamStats.forEach((team) => {
      if (team.wonPlayers.length > 0) {
        csvContent += `\n${team.team.name} Won Players:\n`
        csvContent += "Player,Position,Winning Bid\n"
        team.wonPlayers.forEach((player) => {
          csvContent += `${player.gamer_tag_id},${player.primary_position},${formatCurrency(player.winningBid)}\n`
        })
      }
    })

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `MGHL_Bidding_Recap_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bidding Recap</h2>
          <p className="text-muted-foreground">Comprehensive overview of all bidding activity</p>
        </div>
        <div className="flex gap-2">
          {data && (
            <Button onClick={downloadCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          )}
          <Button onClick={fetchBiddingRecap} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Generate Recap
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.totalBids}</p>
                    <p className="text-sm text-muted-foreground">Total Bids</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.totalPlayers}</p>
                    <p className="text-sm text-muted-foreground">Players Bid On</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.totalTeams}</p>
                    <p className="text-sm text-muted-foreground">Teams Participating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(data.teamStats.reduce((sum, team) => sum + team.currentSalary, 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Total League Salary</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Statistics with Won Players and Roster */}
          <Card>
            <CardHeader>
              <CardTitle>Team Bidding Statistics & Rosters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.teamStats.map((teamStat, index) => {
                  const capSpaceRemaining = 30000000 - teamStat.currentSalary
                  const totalRosterSize = teamStat.currentRoster.length

                  return (
                    <div key={teamStat.team.id} className="border rounded-lg p-6">
                      {/* Team Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-medium text-muted-foreground">#{index + 1}</span>
                          <div className="w-10 h-10">
                            <TeamLogo
                              teamId={teamStat.team.id}
                              teamName={teamStat.team.name}
                              logoUrl={teamStat.team.logo_url}
                              size="md"
                            />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{teamStat.team.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {totalRosterSize} players • {formatCurrency(teamStat.currentSalary)} salary
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(capSpaceRemaining)}</p>
                          <p className="text-sm text-muted-foreground">Cap Space Remaining</p>
                        </div>
                      </div>

                      {/* Bidding Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted/50 rounded">
                          <p className="text-lg font-semibold">{teamStat.totalBids}</p>
                          <p className="text-xs text-muted-foreground">Total Bids</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded">
                          <p className="text-lg font-semibold">{teamStat.uniquePlayersCount}</p>
                          <p className="text-xs text-muted-foreground">Players Bid On</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <p className="text-lg font-semibold text-green-600">{teamStat.wonPlayers.length}</p>
                          <p className="text-xs text-muted-foreground">Won Players</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="text-lg font-semibold text-blue-600">{totalRosterSize}</p>
                          <p className="text-xs text-muted-foreground">Current Roster</p>
                        </div>
                      </div>

                      {/* Won Players */}
                      {teamStat.wonPlayers.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <h4 className="font-medium">Won Players ({teamStat.wonPlayers.length})</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {teamStat.wonPlayers.map((player) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 bg-gray-800 border border-gray-700 rounded text-sm"
                              >
                                <div>
                                  <span className="font-medium text-white">{player.gamer_tag_id}</span>
                                  <span className="text-gray-300 ml-2">
                                    ({getPositionAbbreviation(player.primary_position)})
                                  </span>
                                </div>
                                <span className="font-semibold text-green-400">
                                  {formatCurrency(player.winningBid)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Roster Preview */}
                      {teamStat.currentRoster.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            <h4 className="font-medium">Current Roster ({teamStat.currentRoster.length})</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                            {teamStat.currentRoster.map((player) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 bg-gray-800 border border-gray-700 rounded text-sm"
                              >
                                <div>
                                  <span className="font-medium text-white">{player.gamer_tag_id}</span>
                                  <span className="text-gray-300 ml-2">
                                    ({getPositionAbbreviation(player.primary_position)})
                                  </span>
                                </div>
                                <span className="font-semibold text-blue-400">{formatCurrency(player.salary)}</span>
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
          <Card>
            <CardHeader>
              <CardTitle>Player Bid History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.playerBids.map((playerBid) => (
                  <div key={playerBid.player.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-lg">{playerBid.player.gamer_tag_id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {playerBid.player.primary_position}
                            {playerBid.player.secondary_position && ` / ${playerBid.player.secondary_position}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(playerBid.highestBid)}</p>
                        <p className="text-sm text-muted-foreground">Highest Bid • {playerBid.totalBids} total bids</p>
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
                            <span className="text-xs text-green-600 font-medium">
                              Won by {playerBid.winningTeam.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Bid History</h4>
                      {playerBid.bids.map((bid, bidIndex) => (
                        <div key={bid.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6">
                              <TeamLogo
                                teamId={bid.team.id}
                                teamName={bid.team.name}
                                logoUrl={bid.team.logo_url}
                                size="xs"
                              />
                            </div>
                            <span className="font-medium">{bid.team.name}</span>
                            {bidIndex === 0 && (
                              <Badge variant="default" className="text-xs">
                                Winner
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold">{formatCurrency(bid.bid_amount)}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(bid.created_at)}</span>
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
      )}
    </div>
  )
}
