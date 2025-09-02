"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
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
  History,
  Clock,
  Gamepad2,
  Eye,
  Filter
} from "lucide-react"

interface EloMatchHistory {
  id: string
  created_at: string
  team1_score: number
  team2_score: number
  winner_team: number
  match_duration: number
  players: {
    player_id: string
    discord_username: string
    display_name: string
    team_number: number
    position: string
    rating_before: number
    rating_after: number
    rating_change: number
    points_earned: number
  }[]
}

export default function EloHistoryPage() {
  const { supabase } = useSupabase()
  const [matches, setMatches] = useState<EloMatchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState<string>("all") // all, recent, high-impact
  const matchesPerPage = 20

  useEffect(() => {
    async function fetchEloHistory() {
      try {
        setLoading(true)
        
        // Fetch real data from the database
        const { data: matchesData, error: matchesError } = await supabase
          .from('elo_matches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (matchesError) {
          throw matchesError
        }

        if (matchesData) {
          // Fetch player details for each match
          const matchesWithPlayers = await Promise.all(
            matchesData.map(async (match) => {
              const { data: matchPlayers, error: playersError } = await supabase
                .from('elo_match_players')
                .select(`
                  *,
                  elo_players!inner(
                    discord_username,
                    display_name
                  )
                `)
                .eq('match_id', match.id)

              if (playersError) {
                console.error('Error fetching match players:', playersError)
                return null
              }

              return {
                ...match,
                players: matchPlayers?.map(mp => ({
                  player_id: mp.player_id,
                  discord_username: mp.elo_players?.discord_username || 'Unknown',
                  display_name: mp.elo_players?.display_name || 'Unknown',
                  team_number: mp.team_number,
                  position: mp.position,
                  rating_before: mp.rating_before,
                  rating_after: mp.rating_after,
                  rating_change: mp.rating_change,
                  points_earned: mp.points_earned
                })) || []
              }
            })
          )

          const validMatches = matchesWithPlayers.filter(match => match !== null) as EloMatchHistory[]
          setMatches(validMatches)
        } else {
          setMatches([])
        }
      } catch (error: any) {
        console.error("Error fetching ELO history:", error)
        setError(error.message || "Failed to load ELO history")
      } finally {
        setLoading(false)
      }
    }

    fetchEloHistory()
  }, [supabase])

  const getFilteredMatches = () => {
    let filtered = matches
    
    if (filter === "recent") {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      filtered = matches.filter(match => new Date(match.created_at) > oneWeekAgo)
    } else if (filter === "high-impact") {
      filtered = matches.filter(match => 
        match.players.some(player => Math.abs(player.rating_change) >= 20)
      )
    }
    
    return filtered
  }

  const getRatingChangeDisplay = (change: number) => {
    const isPositive = change > 0
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-400" />
        )}
        <span className={isPositive ? "text-green-400" : "text-red-400"}>
          {isPositive ? "+" : ""}{change}
        </span>
      </div>
    )
  }

  const getTeamScore = (teamNumber: number, match: EloMatchHistory) => {
    return teamNumber === 1 ? match.team1_score : match.team2_score
  }

  const getWinnerBadge = (teamNumber: number, match: EloMatchHistory) => {
    if (teamNumber === match.winner_team) {
      return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">Winner</Badge>
    }
    return <Badge className="bg-red-500 text-white text-xs">Loser</Badge>
  }

  const filteredMatches = getFilteredMatches()
  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage)
  const startIndex = (currentPage - 1) * matchesPerPage
  const endIndex = startIndex + matchesPerPage
  const currentMatches = filteredMatches.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              ELO History
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Error loading ELO history: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              ELO History
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Complete match history and ELO rating evolution
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-200 mb-2">{matches.length}</div>
              <div className="text-blue-300 flex items-center justify-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Total Matches
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-cyan-200 mb-2">
                {matches.reduce((acc, m) => acc + m.players.length, 0)}
              </div>
              <div className="text-cyan-300 flex items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                Players Involved
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-indigo-200 mb-2">
                {Math.round(matches.reduce((acc, m) => acc + m.match_duration, 0) / Math.max(matches.length, 1))}
              </div>
              <div className="text-indigo-300 flex items-center justify-center gap-2">
                <Clock className="h-5 w-5" />
                Avg Duration (s)
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-200 mb-2">
                {new Date(matches[0]?.created_at || Date.now()).toLocaleDateString()}
              </div>
              <div className="text-purple-300 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                Latest Match
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
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg" 
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilter("recent")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === "recent" 
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg" 
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              Recent (7 days)
            </button>
            <button
              onClick={() => setFilter("high-impact")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === "high-impact" 
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              High Impact
            </button>
          </motion.div>

          {/* History Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-400" />
                  Match History
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Complete history of ELO matches and rating changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-white/10 hover:bg-white/20 transition-colors">
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Score</TableHead>
                        <TableHead className="text-white">Players</TableHead>
                        <TableHead className="text-white">Rating Changes</TableHead>
                        <TableHead className="text-white">Duration</TableHead>
                        <TableHead className="text-white">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentMatches.map((match) => (
                        <TableRow 
                          key={match.id} 
                          className="hover:bg-white/10 transition-colors border-b border-white/10"
                        >
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-400" />
                              <span>{new Date(match.created_at).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="text-center">
                              <div className="font-bold text-lg">
                                {match.team1_score} - {match.team2_score}
                              </div>
                              <div className="text-sm text-blue-300">
                                Team {match.winner_team} wins
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="space-y-2">
                              {match.players.map((player, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    {getWinnerBadge(player.team_number, match)}
                                    <span className="font-medium">{player.display_name}</span>
                                    <Badge className="bg-gray-500 text-white text-xs">
                                      {player.position}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="space-y-1">
                              {match.players.map((player, index) => (
                                <div key={index} className="text-sm">
                                  <span className="text-blue-300">{player.display_name}:</span>
                                  <div className="ml-2">
                                    {getRatingChangeDisplay(player.rating_change)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-white text-center">
                            {Math.round(match.match_duration / 60)}m {match.match_duration % 60}s
                          </TableCell>
                          <TableCell className="text-white">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(currentPage - 1)} 
                      disabled={currentPage === 1}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Previous
                    </Button>
                    <span className="text-white">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Next
                    </Button>
                  </div>
                )}

                {filteredMatches.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    No matches found matching the current filter.
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
