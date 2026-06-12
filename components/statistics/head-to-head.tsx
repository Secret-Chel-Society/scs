"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Users, Trophy, Target, TrendingUp, TrendingDown, Minus, X } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface PlayerOption {
  id: string
  slug: string
  gamer_tag_id: string
  team_name: string | null
  team_logo: string | null
  avatar_url: string | null
}

interface HeadToHeadStats {
  player1: {
    name: string
    team: string | null
    teamLogo: string | null
    avatar: string | null
    wins: number
    losses: number
    otl: number
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
    games_played: number
  }
  player2: {
    name: string
    team: string | null
    teamLogo: string | null
    avatar: string | null
    wins: number
    losses: number
    otl: number
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
    games_played: number
  }
  matchups: number
}

interface HeadToHeadProps {
  league?: "nhl" | "ahl"
}

export function HeadToHead({ league = "nhl" }: HeadToHeadProps) {
  const { supabase } = useSupabase()
  
  // Table names based on league
  const statsTable = league === "ahl" ? "ea_player_stats_ahl" : "ea_player_stats"
  const matchesTable = league === "ahl" ? "matches_ahl" : "matches"
  const teamsTable = league === "ahl" ? "teams_ahl" : "teams"
  const teamIdColumn = league === "ahl" ? "team_id_ahl" : "team_id"
  
  // Player selection state
  const [player1Query, setPlayer1Query] = useState("")
  const [player2Query, setPlayer2Query] = useState("")
  const [player1Results, setPlayer1Results] = useState<PlayerOption[]>([])
  const [player2Results, setPlayer2Results] = useState<PlayerOption[]>([])
  const [selectedPlayer1, setSelectedPlayer1] = useState<PlayerOption | null>(null)
  const [selectedPlayer2, setSelectedPlayer2] = useState<PlayerOption | null>(null)
  const [showPlayer1Dropdown, setShowPlayer1Dropdown] = useState(false)
  const [showPlayer2Dropdown, setShowPlayer2Dropdown] = useState(false)
  
  // Stats state
  const [stats, setStats] = useState<HeadToHeadStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchingPlayer1, setSearchingPlayer1] = useState(false)
  const [searchingPlayer2, setSearchingPlayer2] = useState(false)

  // Search players
  const searchPlayers = useCallback(async (query: string, playerNum: 1 | 2) => {
    if (!supabase || query.length < 2) {
      if (playerNum === 1) setPlayer1Results([])
      else setPlayer2Results([])
      return
    }

    if (playerNum === 1) setSearchingPlayer1(true)
    else setSearchingPlayer2(true)

    try {
      // Build the select query based on league
      const selectQuery = league === "ahl" 
        ? `
          id,
          slug,
          gamer_tag_id,
          team_id_ahl,
          teams_ahl:team_id_ahl (
            name,
            logo_url
          ),
          users:user_id (
            avatar_url
          )
        `
        : `
          id,
          slug,
          gamer_tag_id,
          team_id,
          teams:team_id (
            name,
            logo_url
          ),
          users:user_id (
            avatar_url
          )
        `

      const { data: players, error } = await supabase
        .from("players")
        .select(selectQuery)
        .ilike("gamer_tag_id", `%${query}%`)
        .limit(6)

      if (error) {
        console.error("Error searching players:", error)
        return
      }

      const results: PlayerOption[] = (players || []).map((player: any) => {
        const teamData = league === "ahl" ? player.teams_ahl : player.teams
        return {
          id: player.id,
          slug: player.slug || player.id,
          gamer_tag_id: player.gamer_tag_id || "Unknown",
          team_name: teamData?.name || null,
          team_logo: teamData?.logo_url || null,
          avatar_url: player.users?.avatar_url || null,
        }
      })

      if (playerNum === 1) setPlayer1Results(results)
      else setPlayer2Results(results)
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      if (playerNum === 1) setSearchingPlayer1(false)
      else setSearchingPlayer2(false)
    }
  }, [supabase, league])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (player1Query && !selectedPlayer1) searchPlayers(player1Query, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [player1Query, selectedPlayer1, searchPlayers])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (player2Query && !selectedPlayer2) searchPlayers(player2Query, 2)
    }, 300)
    return () => clearTimeout(timer)
  }, [player2Query, selectedPlayer2, searchPlayers])

  // Fetch head-to-head stats when both players are selected
  const fetchHeadToHead = useCallback(async () => {
    if (!supabase || !selectedPlayer1 || !selectedPlayer2) return

    setLoading(true)
    try {
      const p1Name = selectedPlayer1.gamer_tag_id.toLowerCase()
      const p2Name = selectedPlayer2.gamer_tag_id.toLowerCase()

      // Find all matches where both players participated
      // First get player 1's matches
      const { data: p1Stats, error: p1Error } = await supabase
        .from(statsTable)
        .select(`
          match_id,
          goals,
          assists,
          plus_minus,
          pim,
          shots,
          hits,
          blocks,
          takeaways,
          giveaways,
          team_id
        `)
        .ilike("player_name", p1Name)

      if (p1Error) throw p1Error

      // Get player 2's matches
      const { data: p2Stats, error: p2Error } = await supabase
        .from(statsTable)
        .select(`
          match_id,
          goals,
          assists,
          plus_minus,
          pim,
          shots,
          hits,
          blocks,
          takeaways,
          giveaways,
          team_id
        `)
        .ilike("player_name", p2Name)

      if (p2Error) throw p2Error

      // Find common matches where players were on OPPOSITE teams (true head-to-head)
      const p1MatchMap = new Map((p1Stats || []).map(s => [s.match_id, s.team_id]))
      const p2MatchMap = new Map((p2Stats || []).map(s => [s.match_id, s.team_id]))
      
      // Only include matches where both players participated AND were on different teams
      const commonMatchIds = [...p1MatchMap.keys()].filter(matchId => {
        const p1TeamId = p1MatchMap.get(matchId)
        const p2TeamId = p2MatchMap.get(matchId)
        // Both must have played AND be on different teams
        return p2MatchMap.has(matchId) && p1TeamId && p2TeamId && p1TeamId !== p2TeamId
      })

      if (commonMatchIds.length === 0) {
        setStats({
          player1: {
            name: selectedPlayer1.gamer_tag_id,
            team: selectedPlayer1.team_name,
            teamLogo: selectedPlayer1.team_logo,
            avatar: selectedPlayer1.avatar_url,
            wins: 0, losses: 0, otl: 0,
            goals: 0, assists: 0, points: 0, plus_minus: 0,
            pim: 0, shots: 0, hits: 0, blocks: 0, takeaways: 0, giveaways: 0,
            games_played: 0
          },
          player2: {
            name: selectedPlayer2.gamer_tag_id,
            team: selectedPlayer2.team_name,
            teamLogo: selectedPlayer2.team_logo,
            avatar: selectedPlayer2.avatar_url,
            wins: 0, losses: 0, otl: 0,
            goals: 0, assists: 0, points: 0, plus_minus: 0,
            pim: 0, shots: 0, hits: 0, blocks: 0, takeaways: 0, giveaways: 0,
            games_played: 0
          },
          matchups: 0
        })
        setLoading(false)
        return
      }

      // Get match details for win/loss calculation
      const { data: matches, error: matchError } = await supabase
        .from(matchesTable)
        .select("id, home_team_id, away_team_id, home_score, away_score, overtime, has_overtime")
        .in("id", commonMatchIds)

      if (matchError) throw matchError

      // Aggregate stats for common matches only
      const p1CommonStats = p1Stats?.filter(s => commonMatchIds.includes(s.match_id)) || []
      const p2CommonStats = p2Stats?.filter(s => commonMatchIds.includes(s.match_id)) || []

      // Calculate wins/losses for each player
      let p1Wins = 0, p1Losses = 0, p1Otl = 0
      let p2Wins = 0, p2Losses = 0, p2Otl = 0

      matches?.forEach(match => {
        const p1Stat = p1CommonStats.find(s => s.match_id === match.id)
        const p2Stat = p2CommonStats.find(s => s.match_id === match.id)
        
        if (!p1Stat || !p2Stat) return

        const isOvertime = match.overtime || match.has_overtime

        // Determine if player won or lost based on their team
        const p1OnHome = p1Stat.team_id === match.home_team_id
        const p1Won = p1OnHome 
          ? match.home_score > match.away_score 
          : match.away_score > match.home_score

        const p2OnHome = p2Stat.team_id === match.home_team_id
        const p2Won = p2OnHome 
          ? match.home_score > match.away_score 
          : match.away_score > match.home_score

        if (p1Won) p1Wins++
        else if (isOvertime) p1Otl++
        else p1Losses++

        if (p2Won) p2Wins++
        else if (isOvertime) p2Otl++
        else p2Losses++
      })

      // Aggregate totals
      const aggregateStats = (statsList: any[]) => ({
        goals: statsList.reduce((sum, s) => sum + (s.goals || 0), 0),
        assists: statsList.reduce((sum, s) => sum + (s.assists || 0), 0),
        plus_minus: statsList.reduce((sum, s) => sum + (s.plus_minus || 0), 0),
        pim: statsList.reduce((sum, s) => sum + (s.pim || 0), 0),
        shots: statsList.reduce((sum, s) => sum + (s.shots || 0), 0),
        hits: statsList.reduce((sum, s) => sum + (s.hits || 0), 0),
        blocks: statsList.reduce((sum, s) => sum + (s.blocks || 0), 0),
        takeaways: statsList.reduce((sum, s) => sum + (s.takeaways || 0), 0),
        giveaways: statsList.reduce((sum, s) => sum + (s.giveaways || 0), 0),
      })

      const p1Agg = aggregateStats(p1CommonStats)
      const p2Agg = aggregateStats(p2CommonStats)

      setStats({
        player1: {
          name: selectedPlayer1.gamer_tag_id,
          team: selectedPlayer1.team_name,
          teamLogo: selectedPlayer1.team_logo,
          avatar: selectedPlayer1.avatar_url,
          wins: p1Wins,
          losses: p1Losses,
          otl: p1Otl,
          points: p1Agg.goals + p1Agg.assists,
          games_played: commonMatchIds.length,
          ...p1Agg
        },
        player2: {
          name: selectedPlayer2.gamer_tag_id,
          team: selectedPlayer2.team_name,
          teamLogo: selectedPlayer2.team_logo,
          avatar: selectedPlayer2.avatar_url,
          wins: p2Wins,
          losses: p2Losses,
          otl: p2Otl,
          points: p2Agg.goals + p2Agg.assists,
          games_played: commonMatchIds.length,
          ...p2Agg
        },
        matchups: commonMatchIds.length
      })

    } catch (err) {
      console.error("Error fetching head-to-head stats:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedPlayer1, selectedPlayer2, statsTable, matchesTable])

  useEffect(() => {
    if (selectedPlayer1 && selectedPlayer2) {
      fetchHeadToHead()
    } else {
      setStats(null)
    }
  }, [selectedPlayer1, selectedPlayer2, fetchHeadToHead])

  const selectPlayer = (player: PlayerOption, playerNum: 1 | 2) => {
    if (playerNum === 1) {
      setSelectedPlayer1(player)
      setPlayer1Query(player.gamer_tag_id)
      setShowPlayer1Dropdown(false)
    } else {
      setSelectedPlayer2(player)
      setPlayer2Query(player.gamer_tag_id)
      setShowPlayer2Dropdown(false)
    }
  }

  const clearPlayer = (playerNum: 1 | 2) => {
    if (playerNum === 1) {
      setSelectedPlayer1(null)
      setPlayer1Query("")
      setPlayer1Results([])
    } else {
      setSelectedPlayer2(null)
      setPlayer2Query("")
      setPlayer2Results([])
    }
  }

  // Stat comparison component
  const StatComparison = ({ label, p1Value, p2Value, higherIsBetter = true }: {
    label: string
    p1Value: number
    p2Value: number
    higherIsBetter?: boolean
  }) => {
    const p1Better = higherIsBetter ? p1Value > p2Value : p1Value < p2Value
    const p2Better = higherIsBetter ? p2Value > p1Value : p2Value < p1Value
    const tied = p1Value === p2Value

    return (
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50 last:border-0">
        <div className={cn(
          "text-right font-semibold",
          p1Better && "text-green-500",
          p2Better && "text-red-500"
        )}>
          {p1Value}
          {p1Better && <TrendingUp className="inline ml-1 h-3 w-3" />}
          {p2Better && <TrendingDown className="inline ml-1 h-3 w-3" />}
        </div>
        <div className="text-center text-muted-foreground text-sm">{label}</div>
        <div className={cn(
          "text-left font-semibold",
          p2Better && "text-green-500",
          p1Better && "text-red-500"
        )}>
          {p2Better && <TrendingUp className="inline mr-1 h-3 w-3" />}
          {p1Better && <TrendingDown className="inline mr-1 h-3 w-3" />}
          {p2Value}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Head-to-Head Comparison
          </CardTitle>
          <CardDescription>
            Select two players to compare their stats when they played against each other
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Selection */}
            <div className="space-y-2">
              <Label>Player 1</Label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search player..."
                      value={player1Query}
                      onChange={(e) => {
                        setPlayer1Query(e.target.value)
                        setSelectedPlayer1(null)
                        setShowPlayer1Dropdown(true)
                      }}
                      onFocus={() => setShowPlayer1Dropdown(true)}
                      className="pl-9"
                    />
                  </div>
                  {selectedPlayer1 && (
                    <Button variant="ghost" size="icon" onClick={() => clearPlayer(1)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Player 1 Dropdown */}
                {showPlayer1Dropdown && player1Query.length >= 2 && !selectedPlayer1 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchingPlayer1 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">Searching...</div>
                    ) : player1Results.length > 0 ? (
                      player1Results.map((player) => (
                        <button
                          key={player.id}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                          onClick={() => selectPlayer(player, 1)}
                        >
                          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
                            {player.avatar_url ? (
                              <Image src={player.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-bold">
                                {player.gamer_tag_id.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{player.gamer_tag_id}</div>
                            <div className="text-xs text-muted-foreground">{player.team_name || "Free Agent"}</div>
                          </div>
                          {player.team_logo && (
                            <Image src={player.team_logo} alt="" width={24} height={24} className="object-contain" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-sm text-muted-foreground">No players found</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Player 1 Display */}
              {selectedPlayer1 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                    {selectedPlayer1.avatar_url ? (
                      <Image src={selectedPlayer1.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-bold">
                        {selectedPlayer1.gamer_tag_id.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{selectedPlayer1.gamer_tag_id}</div>
                    <div className="text-xs text-muted-foreground">{selectedPlayer1.team_name || "Free Agent"}</div>
                  </div>
                  {selectedPlayer1.team_logo && (
                    <Image src={selectedPlayer1.team_logo} alt="" width={32} height={32} className="object-contain" />
                  )}
                </div>
              )}
            </div>

            {/* Player 2 Selection */}
            <div className="space-y-2">
              <Label>Player 2</Label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search player..."
                      value={player2Query}
                      onChange={(e) => {
                        setPlayer2Query(e.target.value)
                        setSelectedPlayer2(null)
                        setShowPlayer2Dropdown(true)
                      }}
                      onFocus={() => setShowPlayer2Dropdown(true)}
                      className="pl-9"
                    />
                  </div>
                  {selectedPlayer2 && (
                    <Button variant="ghost" size="icon" onClick={() => clearPlayer(2)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Player 2 Dropdown */}
                {showPlayer2Dropdown && player2Query.length >= 2 && !selectedPlayer2 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchingPlayer2 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">Searching...</div>
                    ) : player2Results.length > 0 ? (
                      player2Results.map((player) => (
                        <button
                          key={player.id}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                          onClick={() => selectPlayer(player, 2)}
                        >
                          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
                            {player.avatar_url ? (
                              <Image src={player.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-bold">
                                {player.gamer_tag_id.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{player.gamer_tag_id}</div>
                            <div className="text-xs text-muted-foreground">{player.team_name || "Free Agent"}</div>
                          </div>
                          {player.team_logo && (
                            <Image src={player.team_logo} alt="" width={24} height={24} className="object-contain" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-sm text-muted-foreground">No players found</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Player 2 Display */}
              {selectedPlayer2 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                    {selectedPlayer2.avatar_url ? (
                      <Image src={selectedPlayer2.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-bold">
                        {selectedPlayer2.gamer_tag_id.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{selectedPlayer2.gamer_tag_id}</div>
                    <div className="text-xs text-muted-foreground">{selectedPlayer2.team_name || "Free Agent"}</div>
                  </div>
                  {selectedPlayer2.team_logo && (
                    <Image src={selectedPlayer2.team_logo} alt="" width={32} height={32} className="object-contain" />
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Head-to-Head Results */}
      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {stats && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {stats.matchups} Games Played Against Each Other
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.matchups === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>These players have never played against each other</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Player headers */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center justify-end gap-2">
                    {stats.player1.teamLogo && (
                      <Image src={stats.player1.teamLogo} alt="" width={24} height={24} className="object-contain" />
                    )}
                    <span className="font-semibold truncate">{stats.player1.name}</span>
                  </div>
                  <div className="text-center text-muted-foreground text-sm">VS</div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{stats.player2.name}</span>
                    {stats.player2.teamLogo && (
                      <Image src={stats.player2.teamLogo} alt="" width={24} height={24} className="object-contain" />
                    )}
                  </div>
                </div>

                {/* W-L Record */}
                <div className="grid grid-cols-3 gap-2 py-3 bg-muted/50 rounded-lg">
                  <div className="text-right font-bold text-lg">
                    <span className="text-green-500">{stats.player1.wins}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-red-500">{stats.player1.losses}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-yellow-500">{stats.player1.otl}</span>
                  </div>
                  <div className="text-center text-muted-foreground text-sm">Record</div>
                  <div className="text-left font-bold text-lg">
                    <span className="text-green-500">{stats.player2.wins}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-red-500">{stats.player2.losses}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-yellow-500">{stats.player2.otl}</span>
                  </div>
                </div>

                {/* Stat comparisons */}
                <div className="space-y-1">
                  <StatComparison label="Points" p1Value={stats.player1.points} p2Value={stats.player2.points} />
                  <StatComparison label="Goals" p1Value={stats.player1.goals} p2Value={stats.player2.goals} />
                  <StatComparison label="Assists" p1Value={stats.player1.assists} p2Value={stats.player2.assists} />
                  <StatComparison label="+/-" p1Value={stats.player1.plus_minus} p2Value={stats.player2.plus_minus} />
                  <StatComparison label="Shots" p1Value={stats.player1.shots} p2Value={stats.player2.shots} />
                  <StatComparison label="Hits" p1Value={stats.player1.hits} p2Value={stats.player2.hits} />
                  <StatComparison label="Blocks" p1Value={stats.player1.blocks} p2Value={stats.player2.blocks} />
                  <StatComparison label="Takeaways" p1Value={stats.player1.takeaways} p2Value={stats.player2.takeaways} />
                  <StatComparison label="Giveaways" p1Value={stats.player1.giveaways} p2Value={stats.player2.giveaways} higherIsBetter={false} />
                  <StatComparison label="PIM" p1Value={stats.player1.pim} p2Value={stats.player2.pim} higherIsBetter={false} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
