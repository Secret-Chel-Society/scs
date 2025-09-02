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
  Clock,
  Gamepad2,
  Sword,
  Shield,
  Eye
} from "lucide-react"

interface EloMatch {
  id: string
  date: string
  player1: {
    name: string
    rating_before: number
    rating_after: number
    rating_change: number
    team?: string
  }
  player2: {
    name: string
    rating_before: number
    rating_after: number
    rating_change: number
    team?: string
  }
  winner: string
  score: string
  expected_winner: string
  upset: boolean
  rating_difference: number
}

export default function EloMatchesPage() {
  const { supabase } = useSupabase()
  const [matches, setMatches] = useState<EloMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const matchesPerPage = 20

  useEffect(() => {
    async function fetchEloMatches() {
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

              // Group players by team
              const team1Players = matchPlayers?.filter(mp => mp.team_number === 1) || []
              const team2Players = matchPlayers?.filter(mp => mp.team_number === 2) || []

              // Find the first player from each team for display
              const player1 = team1Players[0]
              const player2 = team2Players[0]

              if (!player1 || !player2) return null

              return {
                id: match.id,
                date: match.created_at,
                player1: {
                  name: player1.elo_players?.display_name || player1.elo_players?.discord_username || 'Unknown',
                  rating_before: player1.rating_before,
                  rating_after: player1.rating_after,
                  rating_change: player1.rating_change,
                  team: "Team 1"
                },
                player2: {
                  name: player2.elo_players?.display_name || player2.elo_players?.discord_username || 'Unknown',
                  rating_before: player2.rating_before,
                  rating_after: player2.rating_after,
                  rating_change: player2.rating_change,
                  team: "Team 2"
                },
                winner: match.winner_team === 1 ? "Team 1" : "Team 2",
                score: `${match.team1_score}-${match.team2_score}`,
                expected_winner: "Team 1", // We can calculate this based on ratings later
                upset: false, // We can calculate this based on ratings later
                rating_difference: Math.abs((player1.rating_before || 0) - (player2.rating_before || 0))
              }
            })
          )

          const validMatches = matchesWithPlayers.filter(match => match !== null) as EloMatch[]
          setMatches(validMatches)
        } else {
          setMatches([])
        }
      } catch (error: any) {
        console.error("Error fetching ELO matches:", error)
        setError(error.message || "Failed to load ELO matches")
      } finally {
        setLoading(false)
      }
    }

    fetchEloMatches()
  }, [supabase])

  const getUpsetBadge = (upset: boolean) => {
    if (upset) {
      return <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">Upset</Badge>
    }
    return null
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

  const getExpectedWinner = (expected: string, actual: string) => {
    if (expected === actual) {
      return <span className="text-green-400">✓ Expected</span>
    } else {
      return <span className="text-red-400">✗ Upset</span>
    }
  }

  const totalPages = Math.ceil(matches.length / matchesPerPage)
  const startIndex = (currentPage - 1) * matchesPerPage
  const endIndex = startIndex + matchesPerPage
  const currentMatches = matches.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
              ELO Matches
            </h1>
            <p className="text-xl text-green-200 mb-8">
              Error loading ELO matches: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
              ELO Matches
            </h1>
            <p className="text-xl text-green-200 mb-8">
              Recent matches and ELO rating changes
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-200 mb-2">{matches.length}</div>
              <div className="text-green-300 flex items-center justify-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Total Matches
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-200 mb-2">
                {matches.filter(m => m.upset).length}
              </div>
              <div className="text-emerald-300 flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" />
                Upsets
              </div>
            </div>
            <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-teal-200 mb-2">
                {Math.round(matches.reduce((acc, m) => acc + Math.abs(m.rating_difference), 0) / matches.length)}
              </div>
              <div className="text-teal-300 flex items-center justify-center gap-2">
                <Target className="h-5 w-5" />
                Avg Rating Diff
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-500/20 to-green-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-cyan-200 mb-2">
                {new Date(matches[0]?.date || Date.now()).toLocaleDateString()}
              </div>
              <div className="text-cyan-300 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                Latest Match
              </div>
            </div>
          </motion.div>

          {/* Matches Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-green-400" />
                  Recent ELO Matches
                </CardTitle>
                <CardDescription className="text-green-200">
                  Match results and ELO rating changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-white/10 hover:bg-white/20 transition-colors">
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Player 1</TableHead>
                        <TableHead className="text-white">Player 2</TableHead>
                        <TableHead className="text-white">Score</TableHead>
                        <TableHead className="text-white">Winner</TableHead>
                        <TableHead className="text-white">Rating Changes</TableHead>
                        <TableHead className="text-white">Expected</TableHead>
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
                              <Clock className="h-4 w-4 text-green-400" />
                              <span>{new Date(match.date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div>
                              <div className="font-medium">{match.player1.name}</div>
                              <div className="text-sm text-green-300">{match.player1.team}</div>
                              <div className="text-xs text-white/60">{match.player1.rating_before} → {match.player1.rating_after}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div>
                              <div className="font-medium">{match.player2.name}</div>
                              <div className="text-sm text-green-300">{match.player2.team}</div>
                              <div className="text-xs text-white/60">{match.player2.rating_before} → {match.player2.rating_after}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-bold">
                            {match.score}
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{match.winner}</span>
                              {getUpsetBadge(match.upset)}
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="space-y-1">
                              <div className="text-sm">
                                {match.player1.name}: {getRatingChangeDisplay(match.player1.rating_change)}
                              </div>
                              <div className="text-sm">
                                {match.player2.name}: {getRatingChangeDisplay(match.player2.rating_change)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            {getExpectedWinner(match.expected_winner, match.winner)}
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
