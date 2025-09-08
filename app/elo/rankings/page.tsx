"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Medal, 
  Crown, 
  Star, 
  Target, 
  Users, 
  BarChart3,
  Award,
  Zap,
  Activity,
  Calendar,
  Clock
} from "lucide-react"

export default function EloRankingsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'rating' | 'wins' | 'winrate'>('rating')

  useEffect(() => {
    fetchEloPlayers()
  }, [sortBy])

  const fetchEloPlayers = async () => {
    try {
      setLoading(true)
      
      // For now, using placeholder data since we don't have real ELO data yet
      const placeholderPlayers = [
        {
          id: "1",
          discord_username: "PlayerOne",
          display_name: "Player One",
          position: "C",
          elo_rating: 1850,
          total_matches: 45,
          wins: 32,
          losses: 13,
          draws: 0,
          win_streak: 5,
          highest_rating: 1920,
          lowest_rating: 1200,
          last_match_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: "2", 
          discord_username: "PlayerTwo",
          display_name: "Player Two",
          position: "LW",
          elo_rating: 1780,
          total_matches: 38,
          wins: 28,
          losses: 10,
          draws: 0,
          win_streak: 3,
          highest_rating: 1850,
          lowest_rating: 1200,
          last_match_at: new Date(Date.now() - 86400000).toISOString(),
          is_active: true
        },
        {
          id: "3",
          discord_username: "PlayerThree", 
          display_name: "Player Three",
          position: "D",
          elo_rating: 1720,
          total_matches: 42,
          wins: 25,
          losses: 17,
          draws: 0,
          win_streak: 1,
          highest_rating: 1800,
          lowest_rating: 1200,
          last_match_at: new Date(Date.now() - 172800000).toISOString(),
          is_active: true
        },
        {
          id: "4",
          discord_username: "PlayerFour",
          display_name: "Player Four", 
          position: "G",
          elo_rating: 1680,
          total_matches: 35,
          wins: 22,
          losses: 13,
          draws: 0,
          win_streak: 2,
          highest_rating: 1750,
          lowest_rating: 1200,
          last_match_at: new Date(Date.now() - 259200000).toISOString(),
          is_active: true
        },
        {
          id: "5",
          discord_username: "PlayerFive",
          display_name: "Player Five",
          position: "RW", 
          elo_rating: 1650,
          total_matches: 40,
          wins: 24,
          losses: 16,
          draws: 0,
          win_streak: 0,
          highest_rating: 1700,
          lowest_rating: 1200,
          last_match_at: new Date(Date.now() - 345600000).toISOString(),
          is_active: true
        }
      ]

      // Sort players based on selected criteria
      const sortedPlayers = [...placeholderPlayers].sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return b.elo_rating - a.elo_rating
          case 'wins':
            return b.wins - a.wins
          case 'winrate':
            const aWinrate = a.total_matches > 0 ? (a.wins / a.total_matches) * 100 : 0
            const bWinrate = b.total_matches > 0 ? (b.wins / b.total_matches) * 100 : 0
            return bWinrate - aWinrate
          default:
            return b.elo_rating - a.elo_rating
        }
      })

      setPlayers(sortedPlayers)
    } catch (error) {
      console.error("Error fetching ELO players:", error)
      toast({
        title: "Error",
        description: "Failed to load ELO rankings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 2:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-slate-600 dark:text-slate-400">#{index + 1}</span>
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'C':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'LW':
      case 'RW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'D':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'G':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
            <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-800 dark:from-yellow-400 dark:to-orange-600 bg-clip-text text-transparent">
              ELO Rankings
            </h1>
          </div>
          <div className="h-1 w-32 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mx-auto mb-8" />
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            The premier competitive NHL 25 league for elite console players across North America
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {players.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Active Players</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg w-fit mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {players.length > 0 ? Math.max(...players.map(p => p.elo_rating)) : 0}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Highest Rating</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg w-fit mx-auto mb-4">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {players.reduce((sum, p) => sum + p.total_matches, 0)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Matches</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {players.length > 0 ? Math.max(...players.map(p => p.win_streak)) : 0}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Best Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Rankings Table */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-800 dark:text-slate-200">
                  Player Rankings
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Current ELO ratings and performance statistics
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('rating')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === 'rating'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Rating
                </button>
                <button
                  onClick={() => setSortBy('wins')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === 'wins'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Wins
                </button>
                <button
                  onClick={() => setSortBy('winrate')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === 'winrate'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Win Rate
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded" />
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-1/4 h-4" />
                      <Skeleton className="w-1/6 h-3" />
                    </div>
                    <Skeleton className="w-20 h-6 rounded" />
                    <Skeleton className="w-16 h-6 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {players.map((player, index) => {
                  const winRate = player.total_matches > 0 ? (player.wins / player.total_matches) * 100 : 0
                  const lastMatchDate = new Date(player.last_match_at)
                  const daysSinceLastMatch = Math.floor((Date.now() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div
                      key={player.id}
                      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-6">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12">
                          {getRankIcon(index)}
                        </div>

                        {/* Player Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-200">
                            <span className="text-white font-bold text-lg">
                              {player.display_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                {player.display_name}
                              </h3>
                              <Badge className={`${getPositionColor(player.position)} text-xs font-semibold`}>
                                {player.position}
                              </Badge>
                              {player.win_streak > 0 && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                  {player.win_streak} streak
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              @{player.discord_username} • Last match {daysSinceLastMatch === 0 ? 'today' : `${daysSinceLastMatch} days ago`}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getRatingColor(player.elo_rating)}`}>
                              {player.elo_rating}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">ELO Rating</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                              {player.wins}-{player.losses}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Record</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                              {winRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Win Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                              {player.total_matches}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Matches</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
