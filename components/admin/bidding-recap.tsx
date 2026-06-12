"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCw, DollarSign, Users, Trophy, Download, UserCheck, Target } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const LEAGUES = [
  { value: "nhl", label: "MGHL (NHL)", seasonsTable: "seasons" },
  { value: "ahl", label: "MGAHL (AHL)", seasonsTable: "seasons_ahl" },
  { value: "ecl", label: "MGECL (ECL)", seasonsTable: "seasons_ecl" },
]

interface Season {
  id: string
  name: string
  season_number: number
  is_active: boolean
}

interface BidData {
  id: string
  bid_amount: number
  created_at: string
  team: { id: string; name: string; logo_url: string | null }
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
  winningTeam: { id: string; name: string; logo_url: string | null } | null
}

interface TeamStat {
  team: { id: string; name: string; logo_url: string | null }
  totalBids: number
  uniquePlayersCount: number
  currentSalary: number
  currentRoster: RosterPlayer[]
  wonPlayers: WonPlayer[]
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
  const [league, setLeague] = useState("nhl")
  const [seasonId, setSeasonId] = useState<string>("all")
  const [seasons, setSeasons] = useState<Season[]>([])
  const { toast } = useToast()

  // Load seasons when league changes
  useEffect(() => {
    const leagueConfig = LEAGUES.find((l) => l.value === league)
    if (!leagueConfig) return

    setSeasons([])
    setSeasonId("all")

    supabase
      .from(leagueConfig.seasonsTable)
      .select("id, name, season_number, is_active")
      .order("season_number", { ascending: false })
      .then(({ data: rows }) => {
        if (rows) setSeasons(rows)
      })
  }, [league])

  const fetchBiddingRecap = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ league })
      if (seasonId && seasonId !== "all") params.set("season_id", seasonId)

      const response = await fetch(`/api/admin/bidding-recap?${params}`)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.details || errData.error || "Failed to fetch bidding recap")
      }

      const recapData = await response.json()
      setData(recapData)

      // Save the recap
      try {
        const saveResponse = await fetch("/api/bidding-recap/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: recapData,
            league,
            season_id: seasonId !== "all" ? seasonId : undefined,
          }),
        })

        if (saveResponse.ok) {
          toast({ title: "Success", description: "Bidding recap generated and saved for public viewing!" })
        } else {
          const errData = await saveResponse.json()
          toast({
            title: "Partial Success",
            description: `Recap generated but save failed: ${errData.details || errData.error || "Unknown error"}`,
            variant: "destructive",
          })
        }
      } catch (saveError) {
        toast({
          title: "Partial Success",
          description: `Recap generated but save failed: ${saveError instanceof Error ? saveError.message : "Network error"}`,
          variant: "destructive",
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  const getPositionAbbreviation = (position: string) => {
    const abbrevs: Record<string, string> = {
      "Left Wing": "LW", "Right Wing": "RW", Center: "C",
      "Left Defense": "LD", "Right Defense": "RD", Goalie: "G",
    }
    return abbrevs[position] || position
  }

  const downloadCSV = () => {
    if (!data) return
    const leagueLabel = LEAGUES.find((l) => l.value === league)?.label || league.toUpperCase()
    let csvContent = `${leagueLabel} Bidding Recap\n\n`
    csvContent += "SUMMARY\n"
    csvContent += `Total Bids,${data.totalBids}\nPlayers Bid On,${data.totalPlayers}\nTeams Participating,${data.totalTeams}\n\n`
    csvContent += "TEAM STATISTICS\nRank,Team,Total Bids,Players Bid On,Won Players,Current Salary\n"
    data.teamStats.forEach((team, i) => {
      csvContent += `${i + 1},${team.team.name},${team.totalBids},${team.uniquePlayersCount},${team.wonPlayers.length},${formatCurrency(team.currentSalary)}\n`
    })
    csvContent += "\nWON PLAYERS BY TEAM\n"
    data.teamStats.forEach((team) => {
      if (team.wonPlayers.length > 0) {
        csvContent += `\n${team.team.name} Won Players:\nPlayer,Position,Winning Bid\n`
        team.wonPlayers.forEach((p) => {
          csvContent += `${p.gamer_tag_id},${p.primary_position},${formatCurrency(p.winningBid)}\n`
        })
      }
    })
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.setAttribute("href", URL.createObjectURL(blob))
    link.setAttribute("download", `${league.toUpperCase()}_Bidding_Recap_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bidding Recap</h2>
          <p className="text-muted-foreground">Comprehensive overview of all bidding activity</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* League selector */}
          <Select value={league} onValueChange={setLeague}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select league" />
            </SelectTrigger>
            <SelectContent>
              {LEAGUES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Season selector */}
          <Select value={seasonId} onValueChange={setSeasonId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All seasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}{s.is_active ? " (Active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(data.teamStats.reduce((sum, t) => sum + t.currentSalary, 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Total League Salary</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {data.totalBids === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No bidding data found for the selected league and season.
              </CardContent>
            </Card>
          )}

          {/* Team Statistics */}
          {data.teamStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Bidding Statistics & Rosters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data.teamStats.map((teamStat, index) => (
                    <div key={teamStat.team.id} className="border rounded-lg p-6">
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
                              {teamStat.currentRoster.length} players &bull; {formatCurrency(teamStat.currentSalary)} salary
                            </p>
                          </div>
                        </div>
                      </div>

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
                          <p className="text-lg font-semibold text-blue-600">{teamStat.currentRoster.length}</p>
                          <p className="text-xs text-muted-foreground">Current Roster</p>
                        </div>
                      </div>

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
                                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                              >
                                <div>
                                  <span className="font-medium">{player.gamer_tag_id}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ({getPositionAbbreviation(player.primary_position)})
                                  </span>
                                </div>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(player.winningBid)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
                                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                              >
                                <div>
                                  <span className="font-medium">{player.gamer_tag_id}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ({getPositionAbbreviation(player.primary_position)})
                                  </span>
                                </div>
                                <span className="font-semibold text-blue-600">{formatCurrency(player.salary)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player Bid History */}
          {data.playerBids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Player Bid History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data.playerBids.map((playerBid) => (
                    <div key={playerBid.player.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{playerBid.player.gamer_tag_id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {playerBid.player.primary_position}
                            {playerBid.player.secondary_position && ` / ${playerBid.player.secondary_position}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(playerBid.highestBid)}</p>
                          <p className="text-sm text-muted-foreground">
                            Highest Bid &bull; {playerBid.totalBids} total bids
                          </p>
                          {playerBid.winningTeam && (
                            <div className="flex items-center gap-1 mt-1 justify-end">
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
                              {bidIndex === 0 && <Badge variant="default" className="text-xs">Winner</Badge>}
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
          )}
        </div>
      )}
    </div>
  )
}
