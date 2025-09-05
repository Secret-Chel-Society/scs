"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MatchDetails } from "@/components/matches/match-details"
import { AlertCircle, Upload, Edit, RefreshCw, Trophy, Star, Medal, Crown, Target, Zap, Shield, Users, Clock, Calendar, Activity, TrendingUp, BarChart3, Award, BookOpen, FileText, Globe, Camera, Image, Play, Pause, SkipForward, SkipBack } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { EaMatchImportModal } from "@/components/matches/ea-match-import-modal"
import { EditScoreModal } from "@/components/matches/edit-score-modal"
import { EaMatchStatistics } from "@/components/matches/ea-match-statistics"
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
  const matchDate = match.match_date;
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
  const wentToOvertime = match.overtime === true || match.has_overtime === true;

  const matchInProgress = match.status?.toLowerCase() === "in progress" || match.status?.toLowerCase() === "inprogress";
  const canManageMatch = matchInProgress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-16 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title-enhanced mb-6">
              {match.home_team?.name || "Home Team"} vs {match.away_team?.name || "Away Team"}
              {wentToOvertime && <span className="text-ice-blue-400 ml-2">(OT)</span>}
            </h1>
            <p className="hockey-subtitle-enhanced mx-auto mb-8">{formattedDate}</p>
            
            {/* Enhanced Match Status Cards - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
              <div className="group animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="hockey-stat-hover-enhanced">
                  <div className="w-14 h-14 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-1">
                    {match.home_score || 0} - {match.away_score || 0}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Final Score
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-2 group-hover:w-16 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="hockey-stat-hover-enhanced">
                  <div className="w-14 h-14 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-lg font-bold text-assist-green-700 dark:text-assist-green-300 mb-1">
                    {match.status || "Status Unknown"}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Match Status
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-2 group-hover:w-16 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="hockey-stat-hover-enhanced">
                  <div className="w-14 h-14 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-xl group-hover:shadow-goal-red-500/25 transition-all duration-300">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-lg font-bold text-goal-red-700 dark:text-goal-red-300 mb-1">
                    {wentToOvertime ? "Overtime" : "Regulation"}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Game Type
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-full mx-auto mt-2 group-hover:w-16 transition-all duration-300"></div>
                </div>
              </div>
            </div>

            {/* Management buttons - only visible if canManageMatch is true */}
            {canManageMatch && (
              <div className="flex flex-wrap justify-center gap-4 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                <Button
                  onClick={() => setOpenScoreModal(true)}
                  className="hockey-button-hover-enhanced"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Score
                </Button>
                <Button
                  onClick={() => setOpenModal(true)}
                  variant="outline"
                  className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hockey-hover-lift"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import EA Data
                </Button>
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  className="border-rink-blue-300 dark:border-rink-blue-600 hover:bg-rink-blue-100 dark:hover:bg-rink-blue-900/30 hockey-hover-lift"
                  disabled={forceRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${forceRefreshing ? "animate-spin" : ""}`} />
                  {forceRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Enhanced Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-2 border-ice-blue-200 dark:border-ice-blue-700 p-2">
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-ice-blue-200/50 dark:hover:bg-ice-blue-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Details
            </TabsTrigger>
              <TabsTrigger 
                value="lineups" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rink-blue-500 data-[state=active]:to-ice-blue-600 data-[state=active]:text-white hover:bg-rink-blue-200/50 dark:hover:bg-rink-blue-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Lineups
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white hover:bg-assist-green-200/50 dark:hover:bg-assist-green-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              EA Statistics
              </TabsTrigger>
              <TabsTrigger 
                value="highlights" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white hover:bg-goal-red-200/50 dark:hover:bg-goal-red-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Highlights
              </TabsTrigger>
            </TabsList>

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
                        {match.home_team?.name || "Home Team"}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Goals</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {matchStats?.home_goals || match.home_score || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Shots</span>
                        <span className="text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {matchStats?.home_shots || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Hits</span>
                        <span className="text-2xl font-bold text-assist-green-600 dark:text-assist-green-400">
                          {matchStats?.home_hits || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Faceoff%</span>
                        <span className="text-2xl font-bold text-goal-red-600 dark:text-goal-red-400">
                          {matchStats?.home_faceoff_percentage ? `${matchStats.home_faceoff_percentage.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Passing%</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {matchStats?.home_passing_percentage ? `${matchStats.home_passing_percentage.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Away Team Stats */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
                        {match.away_team?.name || "Away Team"}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Goals</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {matchStats?.away_goals || match.away_score || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Shots</span>
                        <span className="text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {matchStats?.away_shots || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Hits</span>
                        <span className="text-2xl font-bold text-assist-green-600 dark:text-assist-green-400">
                          {matchStats?.away_hits || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Faceoff%</span>
                        <span className="text-2xl font-bold text-goal-red-600 dark:text-goal-red-400">
                          {matchStats?.away_faceoff_percentage ? `${matchStats.away_faceoff_percentage.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 hockey-alert">
                        <span className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Passing%</span>
                        <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {matchStats?.away_passing_percentage ? `${matchStats.away_passing_percentage.toFixed(1)}%` : "0.0%"}
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
                          {match.home_team?.name || "Home"}
                        </TableHead>
                        <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          {match.away_team?.name || "Away"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hockey-table-row-hover">
                        <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">1st Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {match.period_scores?.[0]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {match.period_scores?.[0]?.away || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hockey-table-row-hover">
                        <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">2nd Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {match.period_scores?.[1]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {match.period_scores?.[1]?.away || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hockey-table-row-hover">
                        <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">3rd Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                          {match.period_scores?.[2]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                          {match.period_scores?.[2]?.away || 0}
                        </TableCell>
                      </TableRow>
                      {wentToOvertime && (
                        <TableRow className="hockey-table-row-hover">
                          <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Overtime</TableCell>
                          <TableCell className="text-center text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                            {match.period_scores?.[3]?.home || 0}
                          </TableCell>
                          <TableCell className="text-center text-2xl font-bold text-rink-blue-600 dark:text-rink-blue-400">
                            {match.period_scores?.[3]?.away || 0}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 font-bold">
                        <TableCell className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Total</TableCell>
                        <TableCell className="text-center text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                          {match.home_score || 0}
                        </TableCell>
                        <TableCell className="text-center text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                          {match.away_score || 0}
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
                {threeStars.length > 0 ? (
                  <div className="space-y-4">
                    {threeStars.map((star, index) => (
                      <div key={star.id} className="flex items-center gap-4 p-4 hockey-alert hover:scale-105 transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {star.star_number}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                            {star.player?.gamer_tag_id || "Unknown Player"}
                          </h4>
                          <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                            {star.player?.position || "N/A"} • {star.team?.name || "Unknown Team"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500">
                            {star.reason || "Outstanding Performance"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
                    <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
                      Three stars have not been selected yet
                    </p>
                  </div>
                )}
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
                {playerStats.length > 0 ? (
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
                        {playerStats.map((player, index) => (
                          <TableRow key={player.id} className="hockey-table-row-hover">
                            <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                              {player.player?.gamer_tag_id || "Unknown"}
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
                              {player.blocked_shots || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.penalty_minutes || 0}
                            </TableCell>
                            <TableCell className="text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                              {player.time_on_ice || "0:00"}
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
                      Player statistics are not available yet
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
                {goalieStats.length > 0 ? (
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
                        {goalieStats.map((goalie, index) => (
                          <TableRow key={goalie.id} className="hockey-table-row-hover">
                            <TableCell className="font-medium text-hockey-silver-700 dark:text-hockey-silver-300">
                              {goalie.player?.gamer_tag_id || "Unknown"}
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
                              {goalie.time_on_ice || "0:00"}
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
                      Goalie statistics are not available yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineups" className="space-y-8">
            <MatchLineups 
              matchId={matchId} 
              homeTeam={match.home_team} 
              awayTeam={match.away_team} 
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            {/* EA Match Statistics (if available) */}
            {match?.ea_match_id && (
              <EaMatchStatistics
                matchId={matchId}
                eaMatchId={match.ea_match_id}
                homeTeamEaClubId={match.home_team?.ea_club_id}
                awayTeamEaClubId={match.away_team?.ea_club_id}
                isAdmin={canManageMatch}
              />
            )}

            {/* No EA Statistics Message */}
            {!match?.ea_match_id && (
              <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-16 w-16 text-hockey-silver-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-2">
                    No EA Statistics Available
                  </h3>
                  <p className="text-hockey-silver-500 dark:text-hockey-silver-500 mb-4">
                    This match doesn't have EA statistics imported yet.
                  </p>
                  {canManageMatch && (
                    <Button 
                      onClick={() => setOpenModal(true)} 
                      className="hockey-button-enhanced hover:scale-105 transition-all duration-200"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import EA Match Data
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
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
        homeTeamEaClubId={match.home_team?.ea_club_id}
        awayTeamEaClubId={match.away_team?.ea_club_id}
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