"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  Target, 
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  Star,
  Medal,
  Crown,
  Play,
  Pause,
  CheckCircle,
  XCircle
} from "lucide-react"

export default function EloMatchesPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'recent' | 'completed' | 'in_progress'>('all')

  useEffect(() => {
    fetchEloMatches()
  }, [filter])

  const fetchEloMatches = async () => {
    try {
      setLoading(true)
      
      // Placeholder matches data
      const placeholderMatches = [
        {
          id: "1",
          match_date: new Date().toISOString(),
          lobby_id: "lobby-1",
          team1_score: 4,
          team2_score: 2,
          winner_team: 1,
          match_duration: 18,
          status: "completed",
          created_at: new Date().toISOString(),
          players: [
            { name: "PlayerOne", team: 1, position: "C", rating_before: 1850, rating_after: 1875, rating_change: 25 },
            { name: "PlayerTwo", team: 1, position: "LW", rating_before: 1780, rating_after: 1805, rating_change: 25 },
            { name: "PlayerThree", team: 1, position: "D", rating_before: 1720, rating_after: 1745, rating_change: 25 },
            { name: "PlayerFour", team: 2, position: "C", rating_before: 1680, rating_after: 1655, rating_change: -25 },
            { name: "PlayerFive", team: 2, position: "RW", rating_before: 1650, rating_after: 1625, rating_change: -25 },
            { name: "PlayerSix", team: 2, position: "G", rating_before: 1600, rating_after: 1575, rating_change: -25 }
          ]
        },
        {
          id: "2",
          match_date: new Date(Date.now() - 3600000).toISOString(),
          lobby_id: "lobby-2", 
          team1_score: 3,
          team2_score: 5,
          winner_team: 2,
          match_duration: 22,
          status: "completed",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          players: [
            { name: "PlayerSeven", team: 1, position: "C", rating_before: 1750, rating_after: 1725, rating_change: -25 },
            { name: "PlayerEight", team: 1, position: "D", rating_before: 1700, rating_after: 1675, rating_change: -25 },
            { name: "PlayerNine", team: 1, position: "G", rating_before: 1650, rating_after: 1625, rating_change: -25 },
            { name: "PlayerTen", team: 2, position: "LW", rating_before: 1800, rating_after: 1825, rating_change: 25 },
            { name: "PlayerEleven", team: 2, position: "RW", rating_before: 1750, rating_after: 1775, rating_change: 25 },
            { name: "PlayerTwelve", team: 2, position: "D", rating_before: 1700, rating_after: 1725, rating_change: 25 }
          ]
        },
        {
          id: "3",
          match_date: new Date(Date.now() - 7200000).toISOString(),
          lobby_id: "lobby-3",
          team1_score: 0,
          team2_score: 0,
          winner_team: null,
          match_duration: 0,
          status: "in_progress",
          created_at: new Date(Date.now() - 7200000).toISOString(),
          players: [
            { name: "PlayerThirteen", team: 1, position: "C", rating_before: 1600, rating_after: 1600, rating_change: 0 },
            { name: "PlayerFourteen", team: 1, position: "LW", rating_before: 1550, rating_after: 1550, rating_change: 0 },
            { name: "PlayerFifteen", team: 1, position: "D", rating_before: 1500, rating_after: 1500, rating_change: 0 },
            { name: "PlayerSixteen", team: 2, position: "RW", rating_before: 1650, rating_after: 1650, rating_change: 0 },
            { name: "PlayerSeventeen", team: 2, position: "D", rating_before: 1600, rating_after: 1600, rating_change: 0 },
            { name: "PlayerEighteen", team: 2, position: "G", rating_before: 1550, rating_after: 1550, rating_change: 0 }
          ]
        },
        {
          id: "4",
          match_date: new Date(Date.now() - 10800000).toISOString(),
          lobby_id: "lobby-4",
          team1_score: 2,
          team2_score: 1,
          winner_team: 1,
          match_duration: 16,
          status: "completed",
          created_at: new Date(Date.now() - 10800000).toISOString(),
          players: [
            { name: "PlayerNineteen", team: 1, position: "C", rating_before: 1400, rating_after: 1425, rating_change: 25 },
            { name: "PlayerTwenty", team: 1, position: "G", rating_before: 1350, rating_after: 1375, rating_change: 25 },
            { name: "PlayerTwentyOne", team: 2, position: "LW", rating_before: 1450, rating_after: 1425, rating_change: -25 },
            { name: "PlayerTwentyTwo", team: 2, position: "D", rating_before: 1400, rating_after: 1375, rating_change: -25 }
          ]
        }
      ]

      // Filter matches based on selected filter
      let filteredMatches = [...placeholderMatches]
      switch (filter) {
        case 'recent':
          filteredMatches = filteredMatches.filter(match => 
            new Date(match.match_date) > new Date(Date.now() - 86400000) // Last 24 hours
          )
          break
        case 'completed':
          filteredMatches = filteredMatches.filter(match => match.status === 'completed')
          break
        case 'in_progress':
          filteredMatches = filteredMatches.filter(match => match.status === 'in_progress')
          break
        default:
          // Show all matches
          break
      }

      setMatches(filteredMatches)
    } catch (error) {
      console.error("Error fetching ELO matches:", error)
      toast({
        title: "Error",
        description: "Failed to load ELO matches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Play className="h-4 w-4" />
      case 'waiting':
        return <Clock className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatMatchDuration = (duration: number) => {
    if (duration === 0) return "In Progress"
    return `${duration}m`
  }

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
              ELO Matches
            </h1>
          </div>
          <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-green-600 rounded-full mx-auto mb-8" />
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Track all competitive matches and player performance in the Major Gaming Hockey League
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
          {[
            { key: 'all', label: 'All Matches' },
            { key: 'recent', label: 'Recent' },
            { key: 'completed', label: 'Completed' },
            { key: 'in_progress', label: 'In Progress' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex-shrink-0 ${
                filter === key
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-1/4 h-4" />
                      <Skeleton className="w-1/6 h-3" />
                    </div>
                    <Skeleton className="w-20 h-6 rounded" />
                    <Skeleton className="w-16 h-6 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <Card key={match.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Calendar className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                          Match #{match.id.slice(-6)}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatMatchDate(match.match_date)} • Duration: {formatMatchDuration(match.match_duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(match.status)} flex items-center gap-1`}>
                        {getStatusIcon(match.status)}
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {match.team1_score}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Team 1</div>
                      </div>
                      <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">VS</div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {match.team2_score}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Team 2</div>
                      </div>
                    </div>
                  </div>

                  {/* Players */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team 1 */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Team 1 {match.winner_team === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      </h4>
                      <div className="space-y-2">
                        {match.players
                          .filter((player: any) => player.team === 1)
                          .map((player: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                  {player.position}
                                </Badge>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {player.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {player.rating_before}
                                </span>
                                <div className={`flex items-center gap-1 text-sm ${
                                  player.rating_change > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : player.rating_change < 0 
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {player.rating_change > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : player.rating_change < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {player.rating_change > 0 ? '+' : ''}{player.rating_change}
                                </div>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {player.rating_after}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Team 2 {match.winner_team === 2 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      </h4>
                      <div className="space-y-2">
                        {match.players
                          .filter((player: any) => player.team === 2)
                          .map((player: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                                  {player.position}
                                </Badge>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {player.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {player.rating_before}
                                </span>
                                <div className={`flex items-center gap-1 text-sm ${
                                  player.rating_change > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : player.rating_change < 0 
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {player.rating_change > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : player.rating_change < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {player.rating_change > 0 ? '+' : ''}{player.rating_change}
                                </div>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {player.rating_after}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  No Matches Found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                  No matches match your current filter criteria. Try adjusting your filter or check back later.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
