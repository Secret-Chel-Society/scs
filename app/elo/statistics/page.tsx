"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trophy, 
  Target, 
  Activity,
  Calendar,
  Clock,
  Zap,
  Award,
  Star,
  Medal,
  Crown,
  PieChart,
  LineChart
} from "lucide-react"

export default function EloStatisticsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchEloStatistics()
  }, [])

  const fetchEloStatistics = async () => {
    try {
      setLoading(true)
      
      // Placeholder statistics data
      const placeholderStats = {
        totalPlayers: 127,
        totalMatches: 2847,
        averageRating: 1347,
        highestRating: 1920,
        lowestRating: 856,
        totalWins: 1424,
        totalLosses: 1423,
        averageWinRate: 50.1,
        longestWinStreak: 12,
        longestLossStreak: 8,
        mostActivePlayer: {
          name: "PlayerOne",
          matches: 89
        },
        topPerformer: {
          name: "PlayerTwo", 
          rating: 1920
        },
        positionStats: {
          C: { count: 32, avgRating: 1356, winRate: 52.3 },
          LW: { count: 28, avgRating: 1334, winRate: 49.8 },
          RW: { count: 26, avgRating: 1341, winRate: 50.2 },
          D: { count: 31, avgRating: 1358, winRate: 51.7 },
          G: { count: 10, avgRating: 1367, winRate: 53.1 }
        },
        ratingDistribution: {
          "1800+": 8,
          "1600-1799": 23,
          "1400-1599": 45,
          "1200-1399": 38,
          "Below 1200": 13
        },
        recentActivity: {
          matchesToday: 12,
          matchesThisWeek: 89,
          newPlayersThisWeek: 3,
          averageMatchDuration: 18.5
        }
      }

      setStats(placeholderStats)
    } catch (error) {
      console.error("Error fetching ELO statistics:", error)
      toast({
        title: "Error",
        description: "Failed to load ELO statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'C':
        return 'from-blue-500 to-blue-600'
      case 'LW':
        return 'from-green-500 to-green-600'
      case 'RW':
        return 'from-emerald-500 to-emerald-600'
      case 'D':
        return 'from-purple-500 to-purple-600'
      case 'G':
        return 'from-red-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return 'text-yellow-600 dark:text-yellow-400'
    if (rating >= 1600) return 'text-green-600 dark:text-green-400'
    if (rating >= 1400) return 'text-blue-600 dark:text-blue-400'
    if (rating >= 1200) return 'text-slate-600 dark:text-slate-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              ELO Statistics
            </h1>
          </div>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-8" />
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Comprehensive analytics and insights from the Major Gaming Hockey League
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                  <Skeleton className="w-3/4 h-6 mb-2" />
                  <Skeleton className="w-1/2 h-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg w-fit mx-auto mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {stats?.totalPlayers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Players</div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg w-fit mx-auto mb-4">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {stats?.totalMatches}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Matches</div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg w-fit mx-auto mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {stats?.averageRating}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Average Rating</div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg w-fit mx-auto mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {stats?.longestWinStreak}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Best Streak</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Position Statistics */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Position Statistics
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Performance breakdown by player position
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Object.entries(stats?.positionStats || {}).map(([position, data]: [string, any]) => (
                      <div key={position} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 bg-gradient-to-r ${getPositionColor(position)} rounded-lg flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{position}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {position} ({data.count} players)
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Avg Rating: {data.avgRating} • Win Rate: {data.winRate}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                            {data.avgRating}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Avg Rating</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rating Distribution */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Rating Distribution
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    How players are distributed across rating tiers
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Object.entries(stats?.ratingDistribution || {}).map(([tier, count]: [string, any]) => (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${
                            tier === '1800+' ? 'bg-yellow-500' :
                            tier === '1600-1799' ? 'bg-green-500' :
                            tier === '1400-1599' ? 'bg-blue-500' :
                            tier === '1200-1399' ? 'bg-slate-500' :
                            'bg-red-500'
                          }`} />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{tier}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                tier === '1800+' ? 'bg-yellow-500' :
                                tier === '1600-1799' ? 'bg-green-500' :
                                tier === '1400-1599' ? 'bg-blue-500' :
                                tier === '1200-1399' ? 'bg-slate-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${(count / stats?.totalPlayers) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    League activity over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {stats?.recentActivity?.matchesToday}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Matches Today</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {stats?.recentActivity?.matchesThisWeek}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">This Week</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {stats?.recentActivity?.newPlayersThisWeek}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">New Players</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {stats?.recentActivity?.averageMatchDuration}m
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Avg Duration</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    League leaders and standout players
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        <Crown className="h-6 w-6 text-yellow-500" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Highest Rating
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {stats?.topPerformer?.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {stats?.topPerformer?.rating}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="h-6 w-6 text-blue-500" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Most Active
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {stats?.mostActivePlayer?.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats?.mostActivePlayer?.matches}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-green-500" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Longest Win Streak
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Current record
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats?.longestWinStreak}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
