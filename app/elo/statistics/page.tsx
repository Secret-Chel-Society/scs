"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { 
  Trophy, 
  Medal, 
  Crown, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Award,
  Users,
  BarChart3,
  Calendar,
  Zap,
  Activity,
  TrendingUpDown,
  LineChart,
  PieChart,
  BarChart
} from "lucide-react"

interface EloStats {
  total_players: number
  average_rating: number
  highest_rating: number
  lowest_rating: number
  total_matches: number
  rating_distribution: {
    range: string
    count: number
    percentage: number
  }[]
  top_performers: {
    name: string
    rating_gain: number
    matches_played: number
  }[]
  rating_changes: {
    date: string
    average_change: number
    total_matches: number
  }[]
}

export default function EloStatisticsPage() {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<EloStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEloStats() {
      try {
        setLoading(true)
        
        // Fetch real data from the database
        const { data: playersData, error: playersError } = await supabase
          .from('elo_players')
          .select('*')

        if (playersError) {
          throw playersError
        }

        if (playersData) {
          const totalPlayers = playersData.length
          const averageRating = totalPlayers > 0 ? Math.round(playersData.reduce((acc, p) => acc + p.elo_rating, 0) / totalPlayers) : 0
          const highestRating = totalPlayers > 0 ? Math.max(...playersData.map(p => p.elo_rating)) : 0
          const lowestRating = totalPlayers > 0 ? Math.min(...playersData.map(p => p.elo_rating)) : 0

          // Calculate rating distribution
          const ratingRanges = [
            { min: 1800, max: Infinity, label: "1800+" },
            { min: 1700, max: 1799, label: "1700-1799" },
            { min: 1600, max: 1699, label: "1600-1699" },
            { min: 1500, max: 1599, label: "1500-1599" },
            { min: 1400, max: 1499, label: "1400-1499" },
            { min: 1300, max: 1399, label: "1300-1399" },
            { min: 0, max: 1299, label: "1200-1299" }
          ]

          const ratingDistribution = ratingRanges.map(range => {
            const count = playersData.filter(p => p.elo_rating >= range.min && p.elo_rating <= range.max).length
            return {
              range: range.label,
              count,
              percentage: totalPlayers > 0 ? (count / totalPlayers) * 100 : 0
            }
          })

          // Calculate top performers (players with highest rating gains)
          const topPerformers = playersData
            .filter(p => p.total_matches > 0)
            .sort((a, b) => (b.elo_rating - 1200) - (a.elo_rating - 1200))
            .slice(0, 5)
            .map(player => ({
              name: player.display_name || player.discord_username,
              rating_gain: player.elo_rating - 1200, // Assuming 1200 is starting rating
              matches_played: player.total_matches
            }))

          // Get total matches from elo_matches table
          const { data: matchesData, error: matchesError } = await supabase
            .from('elo_matches')
            .select('id, created_at')

          const totalMatches = matchesData?.length || 0

          // Create mock rating changes data (we can enhance this later)
          const ratingChanges = [
            { date: new Date().toISOString().split('T')[0], average_change: 0, total_matches: 0 }
          ]

          const realStats: EloStats = {
            total_players: totalPlayers,
            average_rating: averageRating,
            highest_rating: highestRating,
            lowest_rating: lowestRating,
            total_matches: totalMatches,
            rating_distribution: ratingDistribution,
            top_performers: topPerformers,
            rating_changes: ratingChanges
          }

          setStats(realStats)
        } else {
          setStats(null)
        }
      } catch (error: any) {
        console.error("Error fetching ELO statistics:", error)
        setError(error.message || "Failed to load ELO statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchEloStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="relative z-10 space-y-6">
            <div className="text-center mb-12">
              <Skeleton className="h-12 w-64 mx-auto mb-4 bg-white/10" />
              <Skeleton className="h-6 w-96 mx-auto bg-white/10" />
            </div>
            <Skeleton className="h-96 w-full bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              ELO Statistics
            </h1>
            <p className="text-xl text-indigo-200 mb-8">
              Error loading ELO statistics: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10 space-y-6"
        >
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              ELO Statistics
            </h1>
            <p className="text-xl text-indigo-200 mb-8">
              Comprehensive analytics and insights from the ELO rating system
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-indigo-200 mb-2">{stats.total_players}</div>
              <div className="text-indigo-300 flex items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                Total Players
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-200 mb-2">{stats.average_rating}</div>
              <div className="text-purple-300 flex items-center justify-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Average Rating
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-200 mb-2">{stats.highest_rating}</div>
              <div className="text-blue-300 flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5" />
                Highest Rating
              </div>
            </div>
            <div className="bg-gradient-to-r from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-pink-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-pink-200 mb-2">{stats.total_matches}</div>
              <div className="text-pink-300 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                Total Matches
              </div>
            </div>
          </motion.div>

          {/* Statistics Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs defaultValue="distribution" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger value="distribution" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-indigo-200 data-[state=active]:border-indigo-400/50">
                  <PieChart className="h-4 w-4 mr-2" />
                  Distribution
                </TabsTrigger>
                <TabsTrigger value="performers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-200 data-[state=active]:border-purple-400/50">
                  <Trophy className="h-4 w-4 mr-2" />
                  Top Performers
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-blue-200 data-[state=active]:border-blue-400/50">
                  <LineChart className="h-4 w-4 mr-2" />
                  Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="distribution" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-indigo-400" />
                        Rating Distribution
                      </CardTitle>
                      <CardDescription className="text-indigo-200">
                        Distribution of players across different ELO rating ranges
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                          <TableHeader>
                            <TableRow className="bg-white/10 hover:bg-white/20 transition-colors">
                              <TableHead className="text-white">Rating Range</TableHead>
                              <TableHead className="text-white">Players</TableHead>
                              <TableHead className="text-white">Percentage</TableHead>
                              <TableHead className="text-white">Visual</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.rating_distribution.map((item, index) => (
                              <TableRow 
                                key={item.range} 
                                className="hover:bg-white/10 transition-colors border-b border-white/10"
                              >
                                <TableCell className="text-white font-medium">
                                  {item.range}
                                </TableCell>
                                <TableCell className="text-white">
                                  {item.count}
                                </TableCell>
                                <TableCell className="text-white">
                                  {item.percentage.toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-white">
                                  <div className="w-full bg-white/10 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${item.percentage}%` }}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="performers" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-purple-400" />
                        Top Performers
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Players with the highest rating gains this season
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                          <TableHeader>
                            <TableRow className="bg-white/10 hover:bg-white/20 transition-colors">
                              <TableHead className="text-white">Rank</TableHead>
                              <TableHead className="text-white">Player</TableHead>
                              <TableHead className="text-right text-white">Rating Gain</TableHead>
                              <TableHead className="text-right text-white">Matches</TableHead>
                              <TableHead className="text-right text-white">Avg Gain/Match</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.top_performers.map((player, index) => (
                              <TableRow 
                                key={player.name} 
                                className="hover:bg-white/10 transition-colors border-b border-white/10"
                              >
                                <TableCell className="text-white">
                                  <div className="flex items-center gap-2">
                                    {index === 0 && <Crown className="h-4 w-4 text-yellow-400" />}
                                    {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                                    {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                                    {index >= 3 && <Star className="h-4 w-4 text-blue-400" />}
                                    <span className="font-bold">{index + 1}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white font-medium">
                                  {player.name}
                                </TableCell>
                                <TableCell className="text-right text-white font-bold text-green-400">
                                  +{player.rating_gain}
                                </TableCell>
                                <TableCell className="text-right text-white">
                                  {player.matches_played}
                                </TableCell>
                                <TableCell className="text-right text-white">
                                  {(player.rating_gain / player.matches_played).toFixed(1)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-blue-400" />
                        Rating Trends
                      </CardTitle>
                      <CardDescription className="text-blue-200">
                        Daily average rating changes and match activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                          <TableHeader>
                            <TableRow className="bg-white/10 hover:bg-white/20 transition-colors">
                              <TableHead className="text-white">Date</TableHead>
                              <TableHead className="text-right text-white">Avg Change</TableHead>
                              <TableHead className="text-right text-white">Matches</TableHead>
                              <TableHead className="text-white">Trend</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.rating_changes.map((change, index) => (
                              <TableRow 
                                key={change.date} 
                                className="hover:bg-white/10 transition-colors border-b border-white/10"
                              >
                                <TableCell className="text-white">
                                  {new Date(change.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={change.average_change > 0 ? "text-green-400" : "text-red-400"}>
                                    {change.average_change > 0 ? "+" : ""}{change.average_change.toFixed(1)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-white">
                                  {change.total_matches}
                                </TableCell>
                                <TableCell className="text-white">
                                  <div className="flex items-center gap-2">
                                    {change.average_change > 0 ? (
                                      <TrendingUp className="h-4 w-4 text-green-400" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-400" />
                                    )}
                                    <span className={change.average_change > 0 ? "text-green-400" : "text-red-400"}>
                                      {change.average_change > 0 ? "Up" : "Down"}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
