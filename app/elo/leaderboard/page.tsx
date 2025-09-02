"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Flame,
  Target as TargetIcon
} from "lucide-react"

interface EloLeaderboardPlayer {
  id: string
  discord_id: string
  discord_username: string
  display_name: string
  position: string
  elo_rating: number
  total_matches: number
  wins: number
  losses: number
  draws: number
  win_streak: number
  highest_rating: number
  points_earned: number
  last_match_at: string
}

export default function EloLeaderboardPage() {
  const { supabase } = useSupabase()
  const [players, setPlayers] = useState<EloLeaderboardPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all") // all, position, streak

  useEffect(() => {
    async function fetchEloLeaderboard() {
      try {
        setLoading(true)
        
        // Fetch real data from the database
        const { data, error: fetchError } = await supabase
          .from('elo_players')
          .select('*')
          .order('elo_rating', { ascending: false })
          .limit(100)

        if (fetchError) {
          throw fetchError
        }

        if (data) {
          // Calculate win percentage and format data
          const formattedPlayers = data.map((player, index) => ({
            ...player,
            win_percentage: player.total_matches > 0 ? (player.wins / player.total_matches) * 100 : 0,
            rank: index + 1
          }))
          
          setPlayers(formattedPlayers)
        } else {
          setPlayers([])
        }
      } catch (error: any) {
        console.error("Error fetching ELO leaderboard:", error)
        setError(error.message || "Failed to load ELO leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchEloLeaderboard()
  }, [supabase])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <Star className="h-5 w-5 text-blue-400" />
    }
  }

  const getPositionBadge = (position: string) => {
    const colors = {
      'C': 'bg-blue-500',
      'LW': 'bg-green-500',
      'RW': 'bg-purple-500',
      'D': 'bg-orange-500',
      'G': 'bg-red-500'
    }
    return (
      <Badge className={`${colors[position as keyof typeof colors] || 'bg-gray-500'} text-white text-xs`}>
        {position}
      </Badge>
    )
  }

  const getWinStreakBadge = (streak: number) => {
    if (streak >= 5) {
      return <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
        <Flame className="h-3 w-3 mr-1" />
        {streak}
      </Badge>
    } else if (streak >= 3) {
      return <Badge className="bg-orange-500 text-white text-xs">
        {streak}
      </Badge>
    }
    return null
  }

  const filteredPlayers = players.filter(player => {
    if (filter === "all") return true
    if (filter === "position" && player.position !== "TBD") return true
    if (filter === "streak" && player.win_streak >= 3) return true
    return false
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent">
              ELO Leaderboard
            </h1>
            <p className="text-xl text-yellow-200 mb-8">
              Error loading ELO leaderboard: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent">
              ELO Leaderboard
            </h1>
            <p className="text-xl text-yellow-200 mb-8">
              Top players ranked by ELO rating and performance
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">{players.length}</div>
              <div className="text-yellow-300 flex items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                Ranked Players
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-orange-200 mb-2">
                {players.length > 0 ? Math.max(...players.map(p => p.elo_rating)) : 0}
              </div>
              <div className="text-orange-300 flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5" />
                Highest Rating
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-red-200 mb-2">
                {players.length > 0 ? Math.round(players.reduce((acc, p) => acc + p.elo_rating, 0) / players.length) : 0}
              </div>
              <div className="text-red-300 flex items-center justify-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Average Rating
              </div>
            </div>
            <div className="bg-gradient-to-r from-pink-500/20 to-yellow-500/20 backdrop-blur-sm border border-pink-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-pink-200 mb-2">
                {players.reduce((acc, p) => acc + p.total_matches, 0)}
              </div>
              <div className="text-pink-300 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                Total Matches
              </div>
            </div>
          </motion.div>

          {/* Filter Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-4 mb-6"
          >
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === "all" 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg" 
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              All Players
            </button>
            <button
              onClick={() => setFilter("position")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === "position" 
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" 
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              With Position
            </button>
            <button
              onClick={() => setFilter("streak")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === "streak" 
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg" 
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              Hot Streaks
            </button>
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TargetIcon className="h-5 w-5 text-yellow-400" />
                  ELO Leaderboard
                </CardTitle>
                <CardDescription className="text-yellow-200">
                  Top players ranked by ELO rating and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-white/10 hover:bg-white/20 transition-colors">
                        <TableHead className="text-white">Rank</TableHead>
                        <TableHead className="text-white">Player</TableHead>
                        <TableHead className="text-white">Position</TableHead>
                        <TableHead className="text-right text-white">ELO Rating</TableHead>
                        <TableHead className="text-right text-white">Record</TableHead>
                        <TableHead className="text-right text-white">Win %</TableHead>
                        <TableHead className="text-right text-white">Streak</TableHead>
                        <TableHead className="text-right text-white">Matches</TableHead>
                        <TableHead className="text-right text-white">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player, index) => (
                        <TableRow 
                          key={player.id} 
                          className="hover:bg-white/10 transition-colors border-b border-white/10"
                        >
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              {getRankIcon(player.rank)}
                              <span className="font-bold">{player.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div>
                              <div className="font-medium">{player.display_name}</div>
                              <div className="text-sm text-yellow-300">@{player.discord_username}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            {getPositionBadge(player.position)}
                          </TableCell>
                          <TableCell className="text-right text-white font-bold">
                            {player.elo_rating}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {player.wins}-{player.losses}-{player.draws}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {player.win_percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {getWinStreakBadge(player.win_streak)}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {player.total_matches}
                          </TableCell>
                          <TableCell className="text-right text-white font-bold text-green-400">
                            {player.points_earned}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    No players found matching the current filter.
                  </div>
                )}
              </CardContent>
            </Card>
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
