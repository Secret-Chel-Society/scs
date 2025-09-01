"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, Users, Trophy, Plus, FileUp, RefreshCw, Edit } from "lucide-react"
import { SyncStatsButton } from "@/components/admin/sync-stats-button"
import { SyncEaStatsButton } from "@/components/admin/sync-ea-stats-button"

interface PlayerStat {
  id: string
  player_id: string
  player_name: string
  team_id: string | null
  team_name: string | null
  position: string
  games_played: number
  goals: number
  assists: number
  points: number
  plus_minus: number
  pim: number
  shots: number
  shooting_pct: number
  ppg: number
  shg: number
  gwg: number
  hits: number
  giveaways: number
  takeaways: number
  interceptions: number
  pass_attempted: number
  pass_completed: number
  pk_clearzone: number
  pk_drawn: number
  faceoff_wins: number
  faceoff_losses: number
  time_with_puck: number
}

interface GoalieStat {
  id: string
  player_id: string
  player_name: string
  team_id: string | null
  team_name: string | null
  games_played: number
  wins: number
  losses: number
  otl: number
  save_pct: number
  gaa: number
  shutouts: number
  saves: number
  shots_against: number
  goals_against: number
}

interface Season {
  id: number
  name: string
  is_active: boolean
}

export default function AdminStatisticsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [goalieStats, setGoalieStats] = useState<GoalieStat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statFilter, setStatFilter] = useState("points")
  const [positionFilter, setPositionFilter] = useState("all")
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [loadingSeasons, setLoadingSeasons] = useState(true)

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session) {
        router.push("/login")
        return
      }

      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (userError) throw userError

        if (userData.role !== "admin") {
          router.push("/")
          return
        }

        setIsAdmin(true)
      } catch (error: any) {
        console.error("Error checking admin status:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [session, supabase, router])

  // Fetch seasons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("id", { ascending: false })

        if (seasonsError) throw seasonsError

        setSeasons(seasonsData || [])
        
        // Set the active season as default
        const activeSeason = seasonsData?.find((s) => s.is_active)
        if (activeSeason) {
          setSelectedSeason(activeSeason.id)
        }
      } catch (error: any) {
        console.error("Error fetching seasons:", error)
        toast({
          title: "Error loading seasons",
          description: error.message || "Failed to load seasons.",
          variant: "destructive",
        })
      } finally {
        setLoadingSeasons(false)
      }
    }

    if (isAdmin) {
      fetchSeasons()
    }
  }, [supabase, toast, isAdmin])

  // Fetch player statistics
  const fetchStats = async () => {
    if (!selectedSeason) return

    try {
      setLoading(true)

      const { data: playerStatsData, error: playerStatsError } = await supabase
        .from("player_season_stats")
        .select(`
          id,
          player_id,
          season_id,
          position,
          games_played,
          goals,
          assists,
          points,
          plus_minus,
          pim,
          shots,
          shooting_pct,
          ppg,
          shg,
          gwg,
          hits,
          giveaways,
          takeaways,
          interceptions,
          pass_attempted,
          pass_completed,
          pk_clearzone,
          pk_drawn,
          faceoff_wins,
          faceoff_losses,
          time_with_puck,
          players (
            id,
            user_id,
            team_id,
            users (
              id,
              gamer_tag
            ),
            teams (
              id,
              name
            )
          )
        `)
        .eq("season_id", selectedSeason)

      if (playerStatsError) throw playerStatsError

      const { data: goalieStatsData, error: goalieStatsError } = await supabase
        .from("goalie_season_stats")
        .select(`
          id,
          player_id,
          season_id,
          games_played,
          wins,
          losses,
          otl,
          saves,
          shots_against,
          goals_against,
          save_pct,
          gaa,
          shutouts,
          players (
            id,
            user_id,
            team_id,
            users (
              id,
              gamer_tag
            ),
            teams (
              id,
              name
            )
          )
        `)
        .eq("season_id", selectedSeason)

      if (goalieStatsError) throw goalieStatsError

      const formattedPlayerStats = playerStatsData?.map((stat) => ({
        id: stat.id,
        player_id: stat.player_id,
        player_name: stat.players?.users?.gamer_tag || "Unknown Player",
        team_id: stat.players?.team_id || null,
        team_name: stat.players?.teams?.name || null,
        position: stat.position,
        games_played: stat.games_played,
        goals: stat.goals,
        assists: stat.assists,
        points: stat.points,
        plus_minus: stat.plus_minus,
        pim: stat.pim,
        shots: stat.shots,
        shooting_pct: stat.shooting_pct,
        ppg: stat.ppg,
        shg: stat.shg,
        gwg: stat.gwg,
        hits: stat.hits,
        giveaways: stat.giveaways,
        takeaways: stat.takeaways,
        interceptions: stat.interceptions,
        pass_attempted: stat.pass_attempted,
        pass_completed: stat.pass_completed,
        pk_clearzone: stat.pk_clearzone,
        pk_drawn: stat.pk_drawn,
        faceoff_wins: stat.faceoff_wins,
        faceoff_losses: stat.faceoff_losses,
        time_with_puck: stat.time_with_puck,
      })) || []

      const formattedGoalieStats = goalieStatsData?.map((stat) => ({
        id: stat.id,
        player_id: stat.player_id,
        player_name: stat.players?.users?.gamer_tag || "Unknown Goalie",
        team_id: stat.players?.team_id || null,
        team_name: stat.players?.teams?.name || null,
        games_played: stat.games_played,
        wins: stat.wins,
        losses: stat.losses,
        otl: stat.otl,
        save_pct: stat.save_pct,
        gaa: stat.gaa,
        shutouts: stat.shutouts,
        saves: stat.saves,
        shots_against: stat.shots_against,
        goals_against: stat.goals_against,
      })) || []

      setPlayerStats(formattedPlayerStats)
      setGoalieStats(formattedGoalieStats)
    } catch (error: any) {
      console.error("Error fetching statistics:", error)
      toast({
        title: "Error loading statistics",
        description: error.message || "Failed to load statistics data.",
        variant: "destructive",
      })
      setPlayerStats([])
      setGoalieStats([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin && selectedSeason) {
      fetchStats()
    }
  }, [supabase, toast, selectedSeason, isAdmin])

  // Filter and sort player stats
  const filteredPlayerStats = playerStats
    .filter((player) => {
      const matchesSearch = player.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.team_name && player.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      if (positionFilter === "all") return matchesSearch
      if (positionFilter === "offense") return matchesSearch && ["C", "LW", "RW"].includes(player.position)
      if (positionFilter === "defense") return matchesSearch && ["LD", "RD"].includes(player.position)
      if (positionFilter === "goalie") return matchesSearch && player.position === "G"
      return matchesSearch && player.position === positionFilter
    })
    .sort((a, b) => {
      if (statFilter === "points") return b.points - a.points
      if (statFilter === "goals") return b.goals - a.goals
      if (statFilter === "assists") return b.assists - a.assists
      if (statFilter === "plusminus") return b.plus_minus - a.plus_minus
      return 0
    })

  // Filter and sort goalie stats
  const filteredGoalieStats = goalieStats
    .filter((goalie) =>
      goalie.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (goalie.team_name && goalie.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => b.save_pct - a.save_pct)

  // Get season name
  const getSeasonName = (seasonId: number | null) => {
    if (!seasonId) return "Current Season"
    const season = seasons.find((s) => s.id === seasonId)
    return season ? season.name : "Current Season"
  }

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            Statistics Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage player and goalie statistics for the league
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Season: {getSeasonName(selectedSeason)}</h2>
            <p className="text-white/70">Current season statistics and management</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={selectedSeason?.toString() || ""}
              onValueChange={(value) => setSelectedSeason(Number.parseInt(value))}
              disabled={loadingSeasons}
            >
              <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/20 text-white">
                <SelectValue placeholder={loadingSeasons ? "Loading..." : "Select Season"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()} className="text-white hover:bg-slate-700">
                    {season.name} {season.is_active ? "(Active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SyncStatsButton seasonId={selectedSeason || 0} onSuccess={fetchStats} />
            <SyncEaStatsButton />
          </div>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Search players or teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />

                <Select defaultValue={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Filter by position" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">All Positions</SelectItem>
                    <SelectItem value="offense" className="text-white hover:bg-slate-700">Offense (C, LW, RW)</SelectItem>
                    <SelectItem value="defense" className="text-white hover:bg-slate-700">Defense (LD, RD)</SelectItem>
                    <SelectItem value="goalie" className="text-white hover:bg-slate-700">Goalie (G)</SelectItem>
                    <SelectItem value="C" className="text-white hover:bg-slate-700">Center (C)</SelectItem>
                    <SelectItem value="LW" className="text-white hover:bg-slate-700">Left Wing (LW)</SelectItem>
                    <SelectItem value="RW" className="text-white hover:bg-slate-700">Right Wing (RW)</SelectItem>
                    <SelectItem value="LD" className="text-white hover:bg-slate-700">Left Defense (LD)</SelectItem>
                    <SelectItem value="RD" className="text-white hover:bg-slate-700">Right Defense (RD)</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue={statFilter} onValueChange={setStatFilter}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Sort by stat" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="points" className="text-white hover:bg-slate-700">Points</SelectItem>
                    <SelectItem value="goals" className="text-white hover:bg-slate-700">Goals</SelectItem>
                    <SelectItem value="assists" className="text-white hover:bg-slate-700">Assists</SelectItem>
                    <SelectItem value="plusminus" className="text-white hover:bg-slate-700">Plus/Minus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fetchStats()} className="border-white/20 text-white hover:bg-white/10">
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800/50 border border-white/20">
            <TabsTrigger value="players" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Player Stats
            </TabsTrigger>
            <TabsTrigger value="goalies" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Goalie Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Player Statistics
                </CardTitle>
                <CardDescription className="text-white/70">
                  {getSeasonName(selectedSeason)} - Sorted by {statFilter === "points" ? "total points" : statFilter}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-[500px] bg-slate-700" />
                ) : (
                  <div className="rounded-md border border-white/20 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="w-12 text-white">Rank</TableHead>
                          <TableHead className="text-white">Player</TableHead>
                          <TableHead className="text-white">Team</TableHead>
                          <TableHead className="text-center text-white">Pos</TableHead>
                          <TableHead className="text-center text-white">GP</TableHead>
                          <TableHead className="text-center text-white">G</TableHead>
                          <TableHead className="text-center text-white">A</TableHead>
                          <TableHead className="text-center text-white">PTS</TableHead>
                          <TableHead className="text-center text-white">+/-</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlayerStats.map((player, index) => (
                          <TableRow key={player.id} className="hover:bg-white/5 transition-colors border-white/20">
                            <TableCell className="font-medium text-white">{index + 1}</TableCell>
                            <TableCell className="text-white">{player.player_name}</TableCell>
                            <TableCell className="text-white">{player.team_name || "Free Agent"}</TableCell>
                            <TableCell className="text-center text-white">{player.position}</TableCell>
                            <TableCell className="text-center text-white">{player.games_played}</TableCell>
                            <TableCell className="text-center font-medium text-white">{player.goals}</TableCell>
                            <TableCell className="text-center font-medium text-white">{player.assists}</TableCell>
                            <TableCell className="text-center font-bold text-white">{player.points}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={
                                  player.plus_minus > 0 ? "text-green-400" : player.plus_minus < 0 ? "text-red-400" : "text-white"
                                }
                              >
                                {player.plus_minus > 0 ? `+${player.plus_minus}` : player.plus_minus}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredPlayerStats.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-white">
                              No player stats found matching your search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goalies">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-400" />
                  Goalie Statistics
                </CardTitle>
                <CardDescription className="text-white/70">
                  {getSeasonName(selectedSeason)} - Sorted by save percentage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-[500px] bg-slate-700" />
                ) : (
                  <div className="rounded-md border border-white/20 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="w-12 text-white">Rank</TableHead>
                          <TableHead className="text-white">Goalie</TableHead>
                          <TableHead className="text-white">Team</TableHead>
                          <TableHead className="text-center text-white">GP</TableHead>
                          <TableHead className="text-center text-white">W</TableHead>
                          <TableHead className="text-center text-white">L</TableHead>
                          <TableHead className="text-center text-white">OTL</TableHead>
                          <TableHead className="text-center text-white">SV%</TableHead>
                          <TableHead className="text-center text-white">GAA</TableHead>
                          <TableHead className="text-center text-white">SO</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGoalieStats.map((goalie, index) => (
                          <TableRow key={goalie.id} className="hover:bg-white/5 transition-colors border-white/20">
                            <TableCell className="font-medium text-white">{index + 1}</TableCell>
                            <TableCell className="text-white">{goalie.player_name}</TableCell>
                            <TableCell className="text-white">{goalie.team_name || "Free Agent"}</TableCell>
                            <TableCell className="text-center text-white">{goalie.games_played}</TableCell>
                            <TableCell className="text-center text-white">{goalie.wins}</TableCell>
                            <TableCell className="text-center text-white">{goalie.losses}</TableCell>
                            <TableCell className="text-center text-white">{goalie.otl}</TableCell>
                            <TableCell className="text-center text-white">{(goalie.save_pct * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-center text-white">{goalie.gaa.toFixed(2)}</TableCell>
                            <TableCell className="text-center text-white">{goalie.shutouts}</TableCell>
                          </TableRow>
                        ))}
                        {filteredGoalieStats.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-4 text-white">
                              No goalie stats found matching your search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
