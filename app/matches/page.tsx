"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { 
  Clock, 
  Home, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Calendar,
  Trophy,
  Target,
  Zap,
  Star,
  GamepadIcon,
  Users,
  TrendingUp
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function MatchesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination and filtering state
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(1)
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [weekMatches, setWeekMatches] = useState<any[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Get initial filters from URL params
  useEffect(() => {
    const week = searchParams.get("week")
    const team = searchParams.get("team")
    const status = searchParams.get("status")

    if (week) setCurrentWeek(Number.parseInt(week))
    if (team) setSelectedTeam(team)
    if (status) setSelectedStatus(status)
  }, [searchParams])

  // Fetch teams for filter
  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data, error } = await supabase.from("teams").select("id, name").eq("is_active", true).order("name")

        if (error) throw error
        setTeams(data || [])
      } catch (error) {
        console.error("Error fetching teams:", error)
      }
    }

    fetchTeams()
  }, [supabase])

  // Fetch all matches
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from("matches")
          .select(
            `
            id,
            match_date,
            status,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            season_id,
            season_name,
            home_team:teams!home_team_id(id, name, logo_url),
            away_team:teams!away_team_id(id, name, logo_url)
          `,
          )
          .eq("season_name", "Season 1")

        // Apply team filter if selected
        if (selectedTeam !== "all") {
          query = query.or(`home_team_id.eq.${selectedTeam},away_team_id.eq.${selectedTeam}`)
        }

        // Apply status filter if selected
        if (selectedStatus !== "all") {
          query = query.eq("status", selectedStatus)
        }

        const { data, error } = await query.order("match_date", { ascending: true })

        if (error) throw error

        console.log(`Found ${data?.length || 0} matches for Season 1`)
        setMatches(data || [])

        // Calculate weeks based on matches
        if (data && data.length > 0) {
          const weeks = calculateWeeks(data)
          setTotalWeeks(weeks)
        }
      } catch (error: any) {
        console.error("Error fetching matches:", error)
        setError(error.message || "Failed to load matches")
        toast({
          title: "Error loading matches",
          description: error.message || "Failed to load matches data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [supabase, selectedTeam, selectedStatus, toast])

  // Calculate weeks from matches
  const calculateWeeks = (matchesData: any[]) => {
    if (!matchesData.length) return 1

    const sortedMatches = [...matchesData].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )

    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const lastMatchDate = new Date(sortedMatches[sortedMatches.length - 1].match_date)

    const timeDiff = lastMatchDate.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000))

    return Math.max(1, weeksDiff + 1)
  }

  // Filter matches for current week
  useEffect(() => {
    if (matches.length === 0) {
      setWeekMatches([])
      return
    }

    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const weekStartDate = new Date(firstMatchDate)
    weekStartDate.setDate(firstMatchDate.getDate() + (currentWeek - 1) * 7)

    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)

    const filteredMatches = matches.filter((match) => {
      const matchDate = new Date(match.match_date)
      return matchDate >= weekStartDate && matchDate <= weekEndDate
    })

    setWeekMatches(filteredMatches)
  }, [matches, currentWeek])

  // Get week date range for display
  const getWeekDateRange = (week: number) => {
    if (matches.length === 0) return ""

    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const weekStartDate = new Date(firstMatchDate)
    weekStartDate.setDate(firstMatchDate.getDate() + (week - 1) * 7)

    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)

    return `${weekStartDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekEndDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`
  }

  // Get match statistics
  const getMatchStats = () => {
    const totalMatches = matches.length
    const completedMatches = matches.filter(m => m.status === "Completed").length
    const scheduledMatches = matches.filter(m => m.status === "Scheduled").length
    const inProgressMatches = matches.filter(m => m.status === "In Progress").length

    return { totalMatches, completedMatches, scheduledMatches, inProgressMatches }
  }

  const matchStats = getMatchStats()

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Matches</h2>
              <p className="text-red-300 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              NHL 26 Matches
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Live competitive matches with real-time statistics and streaming
            </p>
          </motion.div>

          {/* Match Statistics Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-200 mb-2">{matchStats.totalMatches}</div>
              <div className="text-blue-300">Total Matches</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-200 mb-2">{matchStats.completedMatches}</div>
              <div className="text-green-300">Completed</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">{matchStats.scheduledMatches}</div>
              <div className="text-yellow-300">Scheduled</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-200 mb-2">{matchStats.inProgressMatches}</div>
              <div className="text-purple-300">In Progress</div>
            </div>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-purple-300" />
                    <span className="text-purple-300 font-medium">Filters:</span>
                  </div>
                  
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="w-full lg:w-48 bg-white/10 border-purple-400/30 text-white">
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-400/30">
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full lg:w-48 bg-white/10 border-purple-400/30 text-white">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-400/30">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Week Navigation */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                    disabled={currentWeek === 1}
                    className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">Week {currentWeek}</div>
                    <div className="text-purple-300">{getWeekDateRange(currentWeek)}</div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
                    disabled={currentWeek === totalWeeks}
                    className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Matches Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            {loading ? (
              // Loading skeletons
              [...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Skeleton className="h-64 w-full rounded-2xl bg-white/10" />
                </motion.div>
              ))
            ) : weekMatches.length > 0 ? (
              weekMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Link href={`/matches/${match.id}`}>
                    <Card className="overflow-hidden h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/25">
                      <CardContent className="p-6">
                        {/* Match Status Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <Badge 
                            className={`${
                              match.status === "Completed" 
                                ? "bg-green-500/20 border-green-400/50 text-green-200"
                                : match.status === "In Progress"
                                ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                                : "bg-yellow-500/20 border-yellow-400/50 text-yellow-200"
                            } backdrop-blur-sm`}
                          >
                            {match.status}
                          </Badge>
                          <div className="text-sm text-purple-300">
                            {new Date(match.match_date).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-center flex-1">
                            <div className="relative h-16 w-16 mx-auto mb-2">
                              {match.home_team.logo_url ? (
                                <Image
                                  src={match.home_team.logo_url}
                                  alt={match.home_team.name}
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
                                  <span className="text-blue-200 font-bold text-lg">
                                    {match.home_team.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                              {match.home_team.name}
                            </div>
                            <div className="text-2xl font-bold text-blue-200">
                              {match.home_score !== null ? match.home_score : "-"}
                            </div>
                          </div>

                          <div className="text-center mx-4">
                            <div className="text-purple-300 font-medium text-sm">VS</div>
                          </div>

                          <div className="text-center flex-1">
                            <div className="relative h-16 w-16 mx-auto mb-2">
                              {match.away_team.logo_url ? (
                                <Image
                                  src={match.away_team.logo_url}
                                  alt={match.away_team.name}
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center">
                                  <span className="text-red-200 font-bold text-lg">
                                    {match.away_team.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                              {match.away_team.name}
                            </div>
                            <div className="text-2xl font-bold text-red-200">
                              {match.away_score !== null ? match.away_score : "-"}
                            </div>
                          </div>
                        </div>

                        {/* Match Time */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 text-purple-300">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {new Date(match.match_date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="col-span-full text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-purple-300 text-lg mb-4">No matches found for this week.</div>
                <div className="text-purple-400">Try adjusting your filters or check back later.</div>
              </motion.div>
            )}
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
