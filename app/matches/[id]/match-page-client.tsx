"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MatchDetails } from "@/components/matches/match-details"
import { AlertCircle, Upload, Edit, RefreshCw, Trophy, Star, Medal, Crown, Target, Zap, Shield, Users, Clock, Calendar, Activity, TrendingUp, Award, BookOpen, FileText, Globe, Camera, Image, Play, Pause, SkipForward, SkipBack } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { EaMatchImportModal } from "@/components/matches/ea-match-import-modal"
import { EditScoreModal } from "@/components/matches/edit-score-modal"
import { MatchLineups } from "@/components/matches/match-lineups"
import { MatchHighlightsWrapper } from "@/components/matches/match-highlights-wrapper"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [openScoreModal, setOpenScoreModal] = useState(false)
  const [teamEaClubId, setTeamEaClubId] = useState<string | null>(null)
  const [statsSaved, setStatsSaved] = useState(false)
  const [forceRefreshing, setForceRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [matchStats, setMatchStats] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any[]>([])
  const [goalieStats, setGoalieStats] = useState<any[]>([])
  const [threeStars, setThreeStars] = useState<any[]>([])
  const [eaPlayerStats, setEaPlayerStats] = useState<any[]>([])
  const [eaTeamStats, setEaTeamStats] = useState<any>(null)
  const [periodScores, setPeriodScores] = useState<any[]>([])

  const fetchTeamEaClubId = async (teamId: string) => {
    try {
      const { data, error } = await supabase.from("teams").select("ea_club_id").eq("id", teamId).single()

      if (error) {
        console.error("Error fetching team EA club ID:", error)
        return
      }

      setTeamEaClubId(data?.ea_club_id || null)
    } catch (error) {
      console.error("Error fetching team EA club ID:", error)
    }
  }

  const fetchEaStatistics = async (matchData?: any) => {
    const currentMatch = matchData || match
    if (!currentMatch?.ea_match_id) return

    try {
      // Fetch EA player statistics
      const { data: playerStatsData, error: statsError } = await supabase
        .from("ea_player_stats")
        .select("*")
        .eq("match_id", matchId)

      if (statsError) {
        console.error("Error fetching EA player stats:", statsError)
        return
      }

      setEaPlayerStats(playerStatsData || [])

      // Calculate team statistics from player stats
      if (playerStatsData && playerStatsData.length > 0) {
        const homeStats = {
          team_id: currentMatch.home_team_id,
          team_name: currentMatch.home_team.name,
          goals: 0,
          shots: 0,
          hits: 0,
          pim: 0,
          blocks: 0,
          pp_goals: 0,
          pp_opportunities: 0,
          pp_pct: 0,
          shot_attempts: 0,
          shot_pct: 0,
          pass_attempts: 0,
          pass_complete: 0,
          passing_pct: 0,
          time_in_offensive_zone: 0,
          time_in_defensive_zone: 0,
          time_in_neutral_zone: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoff_pct: 0,
        }

        const awayStats = {
          team_id: currentMatch.away_team_id,
          team_name: currentMatch.away_team.name,
          goals: 0,
          shots: 0,
          hits: 0,
          pim: 0,
          blocks: 0,
          pp_goals: 0,
          pp_opportunities: 0,
          pp_pct: 0,
          shot_attempts: 0,
          shot_pct: 0,
          pass_attempts: 0,
          pass_complete: 0,
          passing_pct: 0,
          time_in_offensive_zone: 0,
          time_in_defensive_zone: 0,
          time_in_neutral_zone: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoff_pct: 0,
        }

        // Aggregate player stats by team
        playerStatsData.forEach((stat) => {
          const teamStat = stat.team_id === currentMatch.home_team_id ? homeStats : awayStats

          teamStat.goals += stat.goals || 0
          teamStat.shots += stat.shots || 0
          teamStat.hits += stat.hits || 0
          teamStat.pim += stat.pim || 0
          teamStat.blocks += stat.blocks || 0
          teamStat.takeaways += stat.takeaways || 0
          teamStat.giveaways += stat.giveaways || 0
          teamStat.shot_attempts += stat.shot_attempts || 0
          teamStat.pass_attempts += stat.pass_attempts || 0
          teamStat.pass_complete += stat.pass_complete || 0
          teamStat.faceoffs_won += stat.faceoffs_won || 0
          teamStat.faceoffs_taken += stat.faceoffs_taken || 0
          teamStat.pp_goals += stat.ppg || 0
          teamStat.time_in_offensive_zone += stat.offensive_zone_time || 0
          teamStat.time_in_defensive_zone += stat.defensive_zone_time || 0
          teamStat.time_in_neutral_zone += stat.neutral_zone_time || 0
        })

        // Calculate percentages
        homeStats.shot_pct = homeStats.shot_attempts > 0 ? (homeStats.shots / homeStats.shot_attempts) * 100 : 0
        homeStats.passing_pct = homeStats.pass_attempts > 0 ? (homeStats.pass_complete / homeStats.pass_attempts) * 100 : 0
        homeStats.faceoff_pct = homeStats.faceoffs_taken > 0 ? (homeStats.faceoffs_won / homeStats.faceoffs_taken) * 100 : 0

        awayStats.shot_pct = awayStats.shot_attempts > 0 ? (awayStats.shots / awayStats.shot_attempts) * 100 : 0
        awayStats.passing_pct = awayStats.pass_attempts > 0 ? (awayStats.pass_complete / awayStats.pass_attempts) * 100 : 0
        awayStats.faceoff_pct = awayStats.faceoffs_taken > 0 ? (awayStats.faceoffs_won / awayStats.faceoffs_taken) * 100 : 0

        setEaTeamStats({ home: homeStats, away: awayStats })
      }

      // Fetch period scores if available
      const { data: periodData, error: periodError } = await supabase
        .from("period_scores")
        .select("*")
        .eq("match_id", matchId)
        .order("period_number")

      if (!periodError && periodData) {
        setPeriodScores(periodData)
      }

    } catch (error) {
      console.error("Error fetching EA statistics:", error)
    }
  }

  const fetchMatchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      setStatsSaved(false)

      // Fetch the match details first
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(
          `
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          ea_match_id,
          overtime,
          match_date,
          status,
          season_name,
          period_scores,
          has_overtime,
          home_team:teams!home_team_id(id, name, logo_url, ea_club_id),
          away_team:teams!away_team_id(id, name, logo_url, ea_club_id)
        `,
        )
        .eq("id", matchId)
        .single()

      if (matchError) {
        console.error("Error fetching match:", matchError)
        throw new Error(`Error fetching match: ${matchError.message}`)
      }

      setMatch(matchData)

      // Fetch EA statistics if available
      await fetchEaStatistics(matchData)

      // Fetch additional match data
      await fetchMatchStats()
      await fetchPlayerStats()
      await fetchGoalieStats()
      await fetchThreeStars()

      // If forceRefresh is true, skip the database check and fetch directly from EA
      if (forceRefresh) {
        console.log("Force refresh requested, fetching directly from EA")
        // await fetchDirectlyFromEA(matchData);
        return
      }
    } catch (err) {
      console.error("Error in fetchMatchData:", err)
      setError(err.message || "Failed to load match data")
    } finally {
      setLoading(false)
      setForceRefreshing(false)
    }
  }

  const fetchMatchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("match_statistics")
        .select("*")
        .eq("match_id", matchId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching match stats:", error)
        return
      }

      setMatchStats(data)
    } catch (error) {
      console.error("Error fetching match stats:", error)
    }
  }

  const fetchPlayerStats = async () => {
    try {
      const { data, error } = await supabase
        .from("player_match_statistics")
        .select(`
          *,
          player:players(*),
          team:teams(*)
        `)
        .eq("match_id", matchId)
        .order("goals", { ascending: false })
        .order("assists", { ascending: false })

      if (error) {
        console.error("Error fetching player stats:", error)
        return
      }

      setPlayerStats(data || [])
    } catch (error) {
      console.error("Error fetching player stats:", error)
    }
  }

  const fetchGoalieStats = async () => {
    try {
      const { data, error } = await supabase
        .from("goalie_match_statistics")
        .select(`
          *,
          player:players(*),
          team:teams(*)
        `)
        .eq("match_id", matchId)

      if (error) {
        console.error("Error fetching goalie stats:", error)
        return
      }

      setGoalieStats(data || [])
    } catch (error) {
      console.error("Error fetching goalie stats:", error)
    }
  }

  const fetchThreeStars = async () => {
    try {
      const { data, error } = await supabase
        .from("match_three_stars")
        .select(`
          *,
          player:players(*),
          team:teams(*)
        `)
        .eq("match_id", matchId)
        .order("star_number", { ascending: true })

      if (error) {
        console.error("Error fetching three stars:", error)
        return
      }

      setThreeStars(data || [])
    } catch (error) {
      console.error("Error fetching three stars:", error)
    }
  }

  const handleImportSuccess = () => {
    toast({
      title: "Match data imported",
      description: "The match data has been successfully imported.",
    })
    fetchMatchData()
  }

  const handleScoreUpdate = (updatedMatch: any) => {
    // Update the match state with the new data
    setMatch((prevMatch: any) => {
      const newMatch = {
        ...prevMatch,
        home_score: updatedMatch.home_score,
        away_score: updatedMatch.away_score,
        period_scores: updatedMatch.period_scores,
        has_overtime: updatedMatch.has_overtime,
        overtime: updatedMatch.overtime, // Update both properties for consistency
        status: updatedMatch.status,
      }
      return newMatch
    })

    toast({
      title: "Score Updated",
      description: "The match score has been successfully updated.",
    })

    // Force a refresh of the component
    setRefreshKey((prev) => prev + 1)

    // Force a refresh of the page to ensure we have the latest data
    router.refresh()

    // Refresh the data from the server after a short delay
    setTimeout(() => {
      fetchMatchData(true)
    }, 500)
  }

  const handleManualRefresh = () => {
    setForceRefreshing(true)
    fetchMatchData(true)
    toast({
      title: "Refreshing",
      description: "Refreshing match data from the server...",
    })
  }

  useEffect(() => {
    if (matchId) {
      fetchMatchData()
    }
  }, [matchId, refreshKey])

  useEffect(() => {
    if (session && match) {
      // Use direct permission checking
      // This effect can be used for additional permission checks if needed
    }
  }, [session, match])

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {})

    return () => {
      subscription.unsubscribe()
    }
  }, [match])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-goal-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
            {error ? "Error Loading Match" : "Match Not Found"}
          </h1>
          <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
            {error || "The match you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.back()} className="hockey-button">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Format the date for display in the header
  const matchDate = match?.match_date;
  const formattedDate = matchDate
    ? `${new Date(matchDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })} at ${new Date(matchDate).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Date TBD";

  // Check both overtime fields
  const wentToOvertime = match?.overtime === true || match?.has_overtime === true;

  const matchInProgress = match?.status?.toLowerCase() === "in progress" || match?.status?.toLowerCase() === "inprogress";
  const canManageMatch = matchInProgress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Stunning Hockey Arena Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-ice-blue-600 via-rink-blue-700 to-hockey-silver-800 dark:from-ice-blue-900 dark:via-rink-blue-900 dark:to-hockey-silver-900 py-24 px-4">
        {/* Dynamic Hockey Arena Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,200,255,0.1),transparent_50%)]"></div>
        
        {/* Enhanced Floating Hockey Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-assist-green-200/20 to-goal-red-200/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 left-20 w-20 h-20 bg-gradient-to-br from-hockey-silver-200/25 to-ice-blue-200/25 rounded-full blur-lg animate-float" style={{ animationDelay: '0.5s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Premium Typography with Hockey Theme */}
            <div className="mb-12">
              <h1 className="hockey-title-enhanced mb-6 text-5xl md:text-6xl lg:text-7xl font-black tracking-tight">
                <span className="hockey-gradient-text-animated">
                  {match?.home_team?.name || "Home Team"}
                </span>
                <span className="mx-6 text-hockey-silver-300 dark:text-hockey-silver-400 text-4xl md:text-5xl lg:text-6xl font-bold">vs</span>
                <span className="hockey-gradient-text-animated">
                  {match?.away_team?.name || "Away Team"}
                </span>
                {wentToOvertime && (
                  <span className="ml-4 text-ice-blue-400 text-3xl md:text-4xl lg:text-5xl font-bold animate-pulse">
                    (OT)
                  </span>
                )}
              </h1>
              <p className="hockey-subtitle-enhanced text-xl md:text-2xl font-medium">{formattedDate}</p>
            </div>
            
            {/* Premium Match Status Cards - Championship Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
              {/* Final Score Card - Trophy Style */}
              <div className="group animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="hockey-stat-hover-enhanced relative overflow-hidden bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-ice-blue-500/10 to-rink-blue-600/10 rounded-3xl"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-ice-blue-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-5xl font-black text-white mb-3 tracking-tight">
                      {match?.home_score || 0} - {match?.away_score || 0}
                    </div>
                    <div className="text-sm font-bold text-hockey-silver-200 dark:text-hockey-silver-300 uppercase tracking-widest">
                      Final Score
                    </div>
                    <div className="w-20 h-1 bg-gradient-to-r from-ice-blue-400 to-rink-blue-500 rounded-full mx-auto mt-4 group-hover:w-24 transition-all duration-500"></div>
                  </div>
                </div>
              </div>
              
              {/* Match Status Card - Dynamic */}
              <div className="group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="hockey-stat-hover-enhanced relative overflow-hidden bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-assist-green-500/10 to-goal-red-600/10 rounded-3xl"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-assist-green-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <Activity className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-3">
                      {match?.status || "Status Unknown"}
                    </div>
                    <div className="text-sm font-bold text-hockey-silver-200 dark:text-hockey-silver-300 uppercase tracking-widest">
                      Match Status
                    </div>
                    <div className="w-20 h-1 bg-gradient-to-r from-assist-green-400 to-goal-red-500 rounded-full mx-auto mt-4 group-hover:w-24 transition-all duration-500"></div>
                  </div>
                </div>
              </div>
              
              {/* Game Type Card - Premium */}
              <div className="group animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="hockey-stat-hover-enhanced relative overflow-hidden bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-goal-red-500/10 to-assist-green-600/10 rounded-3xl"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-goal-red-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <Clock className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-3">
                      {wentToOvertime ? "Overtime" : "Regulation"}
                    </div>
                    <div className="text-sm font-bold text-hockey-silver-200 dark:text-hockey-silver-300 uppercase tracking-widest">
                      Game Type
                    </div>
                    <div className="w-20 h-1 bg-gradient-to-r from-goal-red-400 to-assist-green-500 rounded-full mx-auto mt-4 group-hover:w-24 transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Management Buttons */}
            {canManageMatch && (
              <div className="flex flex-wrap justify-center gap-6 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                <Button
                  onClick={() => setOpenScoreModal(true)}
                  className="hockey-button-hover-enhanced hockey-hover-lift px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-ice-blue-600 to-rink-blue-700 hover:from-ice-blue-700 hover:to-rink-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Edit className="h-5 w-5 mr-3" />
                  Edit Score
                </Button>
                <Button
                  onClick={() => setOpenModal(true)}
                  className="hockey-button-hover-enhanced hockey-hover-lift px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-assist-green-600 to-goal-red-700 hover:from-assist-green-700 hover:to-goal-red-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Upload className="h-5 w-5 mr-3" />
                  Import EA Data
                </Button>
                <Button
                  onClick={handleManualRefresh}
                  className="hockey-button-hover-enhanced hockey-hover-lift px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-hockey-silver-600 to-ice-blue-700 hover:from-hockey-silver-700 hover:to-ice-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={forceRefreshing}
                >
                  <RefreshCw className={`h-5 w-5 mr-3 ${forceRefreshing ? "animate-spin" : ""}`} />
                  {forceRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Main Content */}
      <div className="container mx-auto px-4 pb-20 -mt-8 relative z-10">
        {/* Stunning Premium Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <div className="relative mb-12">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 dark:bg-hockey-silver-900/80 backdrop-blur-xl border-2 border-white/20 dark:border-hockey-silver-700/50 rounded-2xl p-2 shadow-2xl">
              <TabsTrigger 
                value="details" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-ice-blue-100/50 dark:hover:bg-ice-blue-800/30 transition-all duration-500 flex items-center gap-3 px-6 py-4 rounded-xl font-semibold hockey-hover-lift"
              >
                <Trophy className="h-5 w-5" />
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="lineups" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rink-blue-500 data-[state=active]:to-ice-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-rink-blue-100/50 dark:hover:bg-rink-blue-800/30 transition-all duration-500 flex items-center gap-3 px-6 py-4 rounded-xl font-semibold hockey-hover-lift"
              >
                <Users className="h-5 w-5" />
                Lineups
              </TabsTrigger>
              <TabsTrigger 
                value="highlights" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-goal-red-100/50 dark:hover:bg-goal-red-800/30 transition-all duration-500 flex items-center gap-3 px-6 py-4 rounded-xl font-semibold hockey-hover-lift"
              >
                <Camera className="h-5 w-5" />
                Highlights
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="space-y-8">
            <MatchDetails match={match} />
            
            {/* Team Stats Comparison - Moved from Stats tab */}
            <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      Team Statistics Comparison
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      Goals, Shots, Hits, Faceoff%, Passing%
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Home Team Stats */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
                        {match?.home_team?.name || "Home Team"}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Goals</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {eaTeamStats?.home?.goals || match?.home_score || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Shots</span>
                        <span className="text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {eaTeamStats?.home?.shots || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Hits</span>
                        <span className="text-2xl font-bold text-assist-green-600 dark:text-assist-green-400">
                          {eaTeamStats?.home?.hits || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Faceoff%</span>
                        <span className="text-2xl font-bold text-goal-red-600 dark:text-goal-red-400">
                          {eaTeamStats?.home?.faceoff_pct ? `${eaTeamStats.home.faceoff_pct.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Passing%</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {eaTeamStats?.home?.passing_pct ? `${eaTeamStats.home.passing_pct.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Away Team Stats */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
                        {match?.away_team?.name || "Away Team"}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Goals</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {eaTeamStats?.away?.goals || match?.away_score || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Shots</span>
                        <span className="text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {eaTeamStats?.away?.shots || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Hits</span>
                        <span className="text-2xl font-bold text-assist-green-600 dark:text-assist-green-400">
                          {eaTeamStats?.away?.hits || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Faceoff%</span>
                        <span className="text-2xl font-bold text-goal-red-600 dark:text-goal-red-400">
                          {eaTeamStats?.away?.faceoff_pct ? `${eaTeamStats.away.faceoff_pct.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Passing%</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {eaTeamStats?.away?.passing_pct ? `${eaTeamStats.away.passing_pct.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Period by Period Scoring - Moved from Stats tab */}
            <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rink-blue-50 to-ice-blue-50 dark:from-rink-blue-900/30 dark:to-ice-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      Period by Period Scoring
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      Score breakdown by period
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Period</TableHead>
                        <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          {match?.home_team?.name || "Home"}
                        </TableHead>
                        <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          {match?.away_team?.name || "Away"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hockey-table-row-hover">
                        <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">1st Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {periodScores.find(p => p.period_number === 1)?.home_score || match?.period_scores?.[0]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {periodScores.find(p => p.period_number === 1)?.away_score || match?.period_scores?.[0]?.away || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hockey-table-row-hover">
                        <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">2nd Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {periodScores.find(p => p.period_number === 2)?.home_score || match?.period_scores?.[1]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {periodScores.find(p => p.period_number === 2)?.away_score || match?.period_scores?.[1]?.away || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hockey-table-row-hover">
                        <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">3rd Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {periodScores.find(p => p.period_number === 3)?.home_score || match?.period_scores?.[2]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {periodScores.find(p => p.period_number === 3)?.away_score || match?.period_scores?.[2]?.away || 0}
                        </TableCell>
                      </TableRow>
                      {wentToOvertime && (
                        <TableRow className="hockey-table-row-hover">
                          <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Overtime</TableCell>
                          <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                            {periodScores.find(p => p.period_number === 4)?.home_score || match?.period_scores?.[3]?.home || 0}
                          </TableCell>
                          <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                            {periodScores.find(p => p.period_number === 4)?.away_score || match?.period_scores?.[3]?.away || 0}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 font-bold">
                        <TableCell className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Total</TableCell>
                        <TableCell className="text-center text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                          {match?.home_score || 0}
                        </TableCell>
                        <TableCell className="text-center text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                          {match?.away_score || 0}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Three Stars of the Match - Moved from Stats tab */}
            <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-assist-green-50 to-goal-red-50 dark:from-assist-green-900/30 dark:to-goal-red-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      Three Stars of the Match
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      Top performers of the game
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {(() => {
                  // Calculate three stars from EA player stats
                  const calculateThreeStars = () => {
                    if (!eaPlayerStats || eaPlayerStats.length === 0 || !match) return []
                    
                    // Sort players by performance score (goals * 3 + assists * 2 + shots + hits + blocks)
                    const playersWithScore = eaPlayerStats.map(player => ({
                      ...player,
                      performanceScore: (player.goals || 0) * 3 + (player.assists || 0) * 2 + (player.shots || 0) + (player.hits || 0) + (player.blocks || 0)
                    }))
                    
                    return playersWithScore
                      .sort((a, b) => b.performanceScore - a.performanceScore)
                      .slice(0, 3)
                      .map((player, index) => ({
                        id: player.id,
                        star_number: index + 1,
                        player_name: player.player_name,
                        team_name: player.team_id === match?.home_team_id ? match?.home_team?.name : match?.away_team?.name,
                        position: player.position,
                        goals: player.goals || 0,
                        assists: player.assists || 0,
                        points: (player.goals || 0) + (player.assists || 0),
                        performanceScore: player.performanceScore
                      }))
                  }
                  
                  const topPerformers = calculateThreeStars()
                  
                  return topPerformers.length > 0 ? (
                    <div className="space-y-4">
                      {topPerformers.map((star, index) => (
                        <div key={star.id} className="flex items-center gap-4 p-4 hockey-alert hover:scale-105 transition-all duration-300">
                          <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {star.star_number}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                              {star.player_name || "Unknown Player"}
                            </h4>
                            <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                              {star.position || "N/A"} • {star.team_name || "Unknown Team"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500">
                              {star.points} points ({star.goals}G, {star.assists}A)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
                      <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
                        No EA statistics available to calculate three stars
                      </p>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Player Statistics - Moved from Stats tab */}
            <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-goal-red-50 to-assist-green-50 dark:from-goal-red-900/30 dark:to-assist-green-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      Player Statistics
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      Pos, G, A, P, +/-, S, H, BLK, PIM, TOI
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {eaPlayerStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Player</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Pos</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">G</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">A</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">P</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">+/-</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">S</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">H</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">BLK</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">PIM</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">TOI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eaPlayerStats
                          .filter(player => player.position !== 'G') // Filter out goalies
                          .sort((a, b) => ((b.goals || 0) + (b.assists || 0)) - ((a.goals || 0) + (a.assists || 0)))
                          .map((player, index) => (
                          <TableRow key={player.id} className="hockey-table-row-hover">
                            <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                              {player.player_name || "Unknown"}
                            </TableCell>
                            <TableCell className="text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.position || "N/A"}
                            </TableCell>
                            <TableCell className="text-center font-bold text-ice-blue-600 dark:text-ice-blue-400">
                              {player.goals || 0}
                            </TableCell>
                            <TableCell className="text-center font-bold text-rink-blue-600 dark:text-rink-blue-400">
                              {player.assists || 0}
                            </TableCell>
                            <TableCell className="text-center font-bold text-assist-green-600 dark:text-assist-green-400">
                              {(player.goals || 0) + (player.assists || 0)}
                            </TableCell>
                            <TableCell className="text-center font-bold text-goal-red-600 dark:text-goal-red-400">
                              {player.plus_minus || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.shots || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.hits || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.blocks || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.pim || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.time_on_ice ? `${Math.floor(player.time_on_ice / 60)}:${(player.time_on_ice % 60).toString().padStart(2, '0')}` : "0:00"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
                    <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
                      No EA player statistics available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goalie Statistics - Moved from Stats tab */}
            <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      Goalie Statistics
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      SA, S, GA, SV%, GAA, SO, W, L, TOI
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {eaPlayerStats.filter(player => player.position === 'G').length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Goalie</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">SA</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">S</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">GA</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">SV%</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">GAA</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">SO</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">W</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">L</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">TOI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eaPlayerStats
                          .filter(player => player.position === 'G')
                          .map((goalie, index) => (
                          <TableRow key={goalie.id} className="hockey-table-row-hover">
                            <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                              {goalie.player_name || "Unknown"}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {goalie.shots_against || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {goalie.saves || 0}
                            </TableCell>
                            <TableCell className="text-center font-bold text-goal-red-600 dark:text-goal-red-400">
                              {goalie.goals_against || 0}
                            </TableCell>
                            <TableCell className="text-center font-bold text-ice-blue-600 dark:text-ice-blue-400">
                              {goalie.save_percentage ? `${goalie.save_percentage.toFixed(1)}%` : "0.0%"}
                            </TableCell>
                            <TableCell className="text-center font-bold text-rink-blue-600 dark:text-rink-blue-400">
                              {goalie.goals_against_average ? goalie.goals_against_average.toFixed(2) : "0.00"}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {goalie.shutouts || 0}
                            </TableCell>
                            <TableCell className="text-center font-bold text-assist-green-600 dark:text-assist-green-400">
                              {goalie.wins || 0}
                            </TableCell>
                            <TableCell className="text-center font-bold text-goal-red-600 dark:text-goal-red-400">
                              {goalie.losses || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {goalie.time_on_ice ? `${Math.floor(goalie.time_on_ice / 60)}:${(goalie.time_on_ice % 60).toString().padStart(2, '0')}` : "0:00"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
                    <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
                      No EA goalie statistics available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineups" className="space-y-8">
            <MatchLineups 
              matchId={matchId} 
              homeTeam={match?.home_team} 
              awayTeam={match?.away_team} 
            />
          </TabsContent>


          <TabsContent value="highlights" className="space-y-8">
              <MatchHighlightsWrapper matchId={matchId} canEdit={canManageMatch} />
            </TabsContent>
          </Tabs>
      </div>

      {/* EA Match Import Modal */}
      <EaMatchImportModal
        open={openModal}
        onOpenChange={setOpenModal}
        match={match}
        homeTeamEaClubId={match?.home_team?.ea_club_id}
        awayTeamEaClubId={match?.away_team?.ea_club_id}
        onImportSuccess={handleImportSuccess}
      />

      {/* Edit Score Modal */}
      <EditScoreModal
        open={openScoreModal}
        onOpenChange={setOpenScoreModal}
        match={match}
        canEdit={canManageMatch}
        onUpdate={handleScoreUpdate}
      />
    </div>
  )
}