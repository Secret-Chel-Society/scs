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
  TrendingUpDown
} from "lucide-react"

interface EloPlayer {
  id: string
  name: string
  elo_rating: number
  previous_rating: number
  rank: number
  previous_rank: number
  wins: number
  losses: number
  draws: number
  total_matches: number
  win_percentage: number
  team_name?: string
  team_logo?: string
}

export default function EloRankingsPage() {
  const { supabase } = useSupabase()
  const [players, setPlayers] = useState<EloPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEloRankings() {
      try {
        setLoading(true)
        
        // Mock data for now - replace with actual ELO data from your database
        const mockPlayers: EloPlayer[] = [
          {
            id: "1",
            name: "LispDoge",
            elo_rating: 1850,
            previous_rating: 1820,
            rank: 1,
            previous_rank: 2,
            wins: 45,
            losses: 12,
            draws: 3,
            total_matches: 60,
            win_percentage: 75.0,
            team_name: "St Louis Skyhawks"
          },
          {
            id: "2",
            name: "HockeyPro99",
            elo_rating: 1820,
            previous_rating: 1850,
            rank: 2,
            previous_rank: 1,
            wins: 42,
            losses: 15,
            draws: 3,
            total_matches: 60,
            win_percentage: 70.0,
            team_name: "Toronto Maple Leafs"
          },
          {
            id: "3",
            name: "IceWarrior",
            elo_rating: 1780,
            previous_rating: 1750,
            rank: 3,
            previous_rank: 4,
            wins: 38,
            losses: 18,
            draws: 4,
            total_matches: 60,
            win_percentage: 63.3,
            team_name: "Boston Bruins"
          },
          {
            id: "4",
            name: "PuckMaster",
            elo_rating: 1750,
            previous_rating: 1780,
            rank: 4,
            previous_rank: 3,
            wins: 36,
            losses: 20,
            draws: 4,
            total_matches: 60,
            win_percentage: 60.0,
            team_name: "Montreal Canadiens"
          },
          {
            id: "5",
            name: "GoalScorer",
            elo_rating: 1720,
            previous_rating: 1700,
            rank: 5,
            previous_rank: 6,
            wins: 34,
            losses: 22,
            draws: 4,
            total_matches: 60,
            win_percentage: 56.7,
            team_name: "Chicago Blackhawks"
          }
        ]

        setPlayers(mockPlayers)
      } catch (error: any) {
        console.error("Error fetching ELO rankings:", error)
        setError(error.message || "Failed to load ELO rankings")
      } finally {
        setLoading(false)
      }
    }

    fetchEloRankings()
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

  const getRatingChange = (current: number, previous: number) => {
    const change = current - previous
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-400" />
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-400" />
    } else {
      return <TrendingUpDown className="h-4 w-4 text-gray-400" />
    }
  }

  const getRatingChangeText = (current: number, previous: number) => {
    const change = current - previous
    if (change > 0) {
      return `+${change}`
    } else if (change < 0) {
      return `${change}`
    } else {
      return "0"
    }
  }

  const getRatingChangeColor = (current: number, previous: number) => {
    const change = current - previous
    if (change > 0) {
      return "text-green-400"
    } else if (change < 0) {
      return "text-red-400"
    } else {
      return "text-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-red-200 to-orange-200 bg-clip-text text-transparent">
              ELO Rankings
            </h1>
            <p className="text-xl text-red-200 mb-8">
              Error loading ELO rankings: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-red-200 to-orange-200 bg-clip-text text-transparent">
              ELO Rankings
            </h1>
            <p className="text-xl text-red-200 mb-8">
              Competitive player rankings based on ELO rating system
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-red-200 mb-2">{players.length}</div>
              <div className="text-red-300 flex items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                Ranked Players
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-orange-200 mb-2">
                {Math.max(...players.map(p => p.elo_rating))}
              </div>
              <div className="text-orange-300 flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5" />
                Highest Rating
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">
                {Math.round(players.reduce((acc, p) => acc + p.elo_rating, 0) / players.length)}
              </div>
              <div className="text-yellow-300 flex items-center justify-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Average Rating
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 backdrop-blur-sm border border-amber-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-200 mb-2">
                {players.reduce((acc, p) => acc + p.total_matches, 0)}
              </div>
              <div className="text-amber-300 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                Total Matches
              </div>
            </div>
          </motion.div>

          {/* Rankings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-400" />
                  Player Rankings
                </CardTitle>
                <CardDescription className="text-red-200">
                  Current ELO ratings and performance statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-white/10 hover:bg-white/20 transition-colors">
                        <TableHead className="text-white">Rank</TableHead>
                        <TableHead className="text-white">Player</TableHead>
                        <TableHead className="text-white">Team</TableHead>
                        <TableHead className="text-right text-white">ELO Rating</TableHead>
                        <TableHead className="text-right text-white">Change</TableHead>
                        <TableHead className="text-right text-white">Record</TableHead>
                        <TableHead className="text-right text-white">Win %</TableHead>
                        <TableHead className="text-right text-white">Matches</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player, index) => (
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
                          <TableCell className="text-white font-medium">
                            {player.name}
                          </TableCell>
                          <TableCell className="text-white">
                            {player.team_name || "Free Agent"}
                          </TableCell>
                          <TableCell className="text-right text-white font-bold">
                            {player.elo_rating}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {getRatingChange(player.elo_rating, player.previous_rating)}
                              <span className={getRatingChangeColor(player.elo_rating, player.previous_rating)}>
                                {getRatingChangeText(player.elo_rating, player.previous_rating)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {player.wins}-{player.losses}-{player.draws}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {player.win_percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {player.total_matches}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
