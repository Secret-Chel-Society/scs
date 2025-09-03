"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Users, 
  Target, 
  Search, 
  Filter, 
  Download, 
  Star, 
  Medal, 
  Crown, 
  Zap,
  Activity,
  Database,
  Award,
  Gamepad2,
  Shield,
  Coins
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PlayerStats {
  id: string
  name: string
  team: string
  position: string
  games_played: number
  goals: number
  assists: number
  points: number
  plus_minus: number
  penalty_minutes: number
  shots: number
  shooting_percentage: number
  time_on_ice: string
  faceoff_percentage: number
  hits: number
  blocks: number
  takeaways: number
  giveaways: number
}

interface TeamStats {
  id: string
  name: string
  games_played: number
  wins: number
  losses: number
  otl: number
  points: number
  goals_for: number
  goals_against: number
  goal_differential: number
  power_play_percentage: number
  penalty_kill_percentage: number
  faceoff_percentage: number
  shots_for: number
  shots_against: number
  hits: number
  blocks: number
  penalty_minutes: number
}

export default function StatsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("players")
  const [loading, setLoading] = useState(true)
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("points")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch player stats
      const playerResponse = await fetch("/api/statistics/players")
      if (playerResponse.ok) {
        const playerData = await playerResponse.json()
        setPlayerStats(playerData.players || [])
      }

      // Fetch team stats
      const teamResponse = await fetch("/api/statistics/teams")
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setTeamStats(teamData.teams || [])
      }
    } catch (error) {
      toast({
        title: "Error loading statistics",
        description: "Failed to load statistics data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayerStats = playerStats
    .filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy as keyof PlayerStats] as number
      const bValue = b[sortBy as keyof PlayerStats] as number
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    })

  const filteredTeamStats = teamStats
    .filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy as keyof TeamStats] as number
      const bValue = b[sortBy as keyof TeamStats] as number
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    })

  const getTopPerformers = (category: keyof PlayerStats, limit: number = 5) => {
    return [...playerStats]
      .sort((a, b) => (b[category] as number) - (a[category] as number))
      .slice(0, limit)
  }

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case "goals": return <Target className="h-4 w-4" />
      case "assists": return <Users className="h-4 w-4" />
      case "points": return <Star className="h-4 w-4" />
      case "plus_minus": return <TrendingUp className="h-4 w-4" />
      case "hits": return <Shield className="h-4 w-4" />
      case "blocks": return <Shield className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getStatColor = (statName: string) => {
    switch (statName) {
      case "goals": return "text-hockey-red"
      case "assists": return "text-hockey-blue"
      case "points": return "text-hockey-gold"
      case "plus_minus": return "text-hockey-green"
      case "hits": return "text-hockey-purple"
      case "blocks": return "text-hockey-orange"
      default: return "text-hockey-blue"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-purple/20 via-hockey-blue/20 to-hockey-purple/20 border-b border-hockey-purple/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-purple/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-purple/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-blue/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-purple to-hockey-blue rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">League Statistics</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Dive deep into the numbers that tell the story of the Secret Chel Society. 
              Track individual performances, team achievements, and league trends.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-purple to-transparent rounded-full mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Top Performers Overview */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-6 hockey-gradient-text">Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { category: "goals", label: "Goal Leaders", icon: Target, color: "hockey-red" },
              { category: "assists", label: "Assist Leaders", icon: Users, color: "hockey-blue" },
              { category: "points", label: "Point Leaders", icon: Star, color: "hockey-gold" },
              { category: "plus_minus", label: "Plus/Minus Leaders", icon: TrendingUp, color: "hockey-green" },
            ].map((stat, index) => (
              <Card key={stat.category} className="enhanced-card">
                <CardHeader className="enhanced-card-header">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <stat.icon className={`h-4 w-4 text-${stat.color}`} />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {getTopPerformers(stat.category as keyof PlayerStats, 3).map((player, playerIndex) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-${stat.color}/20 text-${stat.color}`}>
                            {playerIndex + 1}
                          </Badge>
                          <span className="text-sm font-medium truncate">{player.name}</span>
                        </div>
                        <span className={`text-sm font-bold text-${stat.color}`}>
                          {player[stat.category as keyof PlayerStats]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Main Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="enhanced-card mb-6">
            <CardHeader className="enhanced-card-header">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Detailed Statistics</CardTitle>
                    <p className="text-sm text-muted-foreground">Search, filter, and analyze player and team performance data</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players or teams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-background/80 backdrop-blur-sm border-hockey-blue/20 focus:border-hockey-blue/50"
                    />
                  </div>
                  <Button variant="outline" className="btn-ice">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger
                    value="players"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-blue data-[state=active]:to-hockey-purple data-[state=active]:text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Player Statistics
                  </TabsTrigger>
                  <TabsTrigger
                    value="teams"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-green data-[state=active]:to-hockey-blue data-[state=active]:text-white"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Team Statistics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="players">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-16 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Sort Controls */}
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                        <div className="flex gap-2">
                          {["points", "goals", "assists", "plus_minus", "hits", "blocks"].map((stat) => (
                            <Button
                              key={stat}
                              variant={sortBy === stat ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSortBy(stat)}
                              className={sortBy === stat ? "bg-hockey-blue text-white" : ""}
                            >
                              {getStatIcon(stat)}
                              <span className="ml-2 capitalize">{stat.replace("_", " ")}</span>
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        >
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </Button>
                      </div>

                      {/* Player Stats Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-hockey-blue/20">
                              <th className="text-left p-3 font-semibold">Player</th>
                              <th className="text-left p-3 font-semibold">Team</th>
                              <th className="text-left p-3 font-semibold">Pos</th>
                              <th className="text-center p-3 font-semibold">GP</th>
                              <th className="text-center p-3 font-semibold">G</th>
                              <th className="text-center p-3 font-semibold">A</th>
                              <th className="text-center p-3 font-semibold">P</th>
                              <th className="text-center p-3 font-semibold">+/-</th>
                              <th className="text-center p-3 font-semibold">PIM</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPlayerStats.map((player, index) => (
                              <motion.tr
                                key={player.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="border-b border-hockey-blue/10 hover:bg-hockey-blue/5 transition-colors"
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-3">
                                    <Badge className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                      index < 3 ? "badge-champion" : "badge-regular"
                                    }`}>
                                      {index + 1}
                                    </Badge>
                                    <span className="font-medium">{player.name}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-muted-foreground">{player.team}</td>
                                <td className="p-3">
                                  <Badge variant="outline" className="text-xs">
                                    {player.position}
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">{player.games_played}</td>
                                <td className="p-3 text-center font-semibold text-hockey-red">{player.goals}</td>
                                <td className="p-3 text-center font-semibold text-hockey-blue">{player.assists}</td>
                                <td className="p-3 text-center font-bold text-hockey-gold">{player.points}</td>
                                <td className={`p-3 text-center font-semibold ${player.plus_minus >= 0 ? 'text-hockey-green' : 'text-hockey-red'}`}>
                                  {player.plus_minus >= 0 ? '+' : ''}{player.plus_minus}
                                </td>
                                <td className="p-3 text-center">{player.penalty_minutes}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teams">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-16 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Team Stats Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-hockey-blue/20">
                              <th className="text-left p-3 font-semibold">Team</th>
                              <th className="text-center p-3 font-semibold">GP</th>
                              <th className="text-center p-3 font-semibold">W</th>
                              <th className="text-center p-3 font-semibold">L</th>
                              <th className="text-center p-3 font-semibold">OTL</th>
                              <th className="text-center p-3 font-semibold">PTS</th>
                              <th className="text-center p-3 font-semibold">GF</th>
                              <th className="text-center p-3 font-semibold">GA</th>
                              <th className="text-center p-3 font-semibold">+/-</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTeamStats.map((team, index) => (
                              <motion.tr
                                key={team.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="border-b border-hockey-blue/10 hover:bg-hockey-blue/5 transition-colors"
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-3">
                                    <Badge className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                      index < 8 ? "badge-playoff" : "badge-regular"
                                    }`}>
                                      {index + 1}
                                    </Badge>
                                    <span className="font-medium">{team.name}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">{team.games_played}</td>
                                <td className="p-3 text-center font-semibold text-hockey-green">{team.wins}</td>
                                <td className="p-3 text-center font-semibold text-hockey-red">{team.losses}</td>
                                <td className="p-3 text-center">{team.otl}</td>
                                <td className="p-3 text-center font-bold text-hockey-gold">{team.points}</td>
                                <td className="p-3 text-center font-semibold text-hockey-green">{team.goals_for}</td>
                                <td className="p-3 text-center font-semibold text-hockey-red">{team.goals_against}</td>
                                <td className={`p-3 text-center font-semibold ${team.goal_differential >= 0 ? 'text-hockey-green' : 'text-hockey-red'}`}>
                                  {team.goal_differential >= 0 ? '+' : ''}{team.goal_differential}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* League Insights */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold mb-6 hockey-gradient-text">League Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="enhanced-card">
              <CardHeader className="enhanced-card-header">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-hockey-green" />
                  Most Active Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTopPerformers("hits", 5).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-hockey-green/20 text-hockey-green">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{player.name}</span>
                      </div>
                      <span className="text-sm font-bold text-hockey-green">{player.hits}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader className="enhanced-card-header">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-hockey-blue" />
                  Defensive Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTopPerformers("blocks", 5).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-hockey-blue/20 text-hockey-blue">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{player.name}</span>
                      </div>
                      <span className="text-sm font-bold text-hockey-blue">{player.blocks}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader className="enhanced-card-header">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-hockey-gold" />
                  Efficiency Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playerStats
                    .filter(player => player.shooting_percentage > 0)
                    .sort((a, b) => b.shooting_percentage - a.shooting_percentage)
                    .slice(0, 5)
                    .map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-hockey-gold/20 text-hockey-gold">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium">{player.name}</span>
                        </div>
                        <span className="text-sm font-bold text-hockey-gold">
                          {player.shooting_percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
