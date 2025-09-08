"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MatchDetails } from "@/components/matches/match-details"
import { AlertCircle, Upload, Edit, RefreshCw, Trophy, Star, Medal, Crown, Target, Zap, Shield, Users, Clock, Calendar, Activity, TrendingUp, Award, BookOpen, FileText, Globe, Camera, Image, Play, Pause, SkipForward, SkipBack, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { EaMatchImportModal } from "@/components/matches/ea-match-import-modal"
import { EditScoreModal } from "@/components/matches/edit-score-modal"
import { MatchLineups } from "@/components/matches/match-lineups"
import { MatchHighlightsWrapper } from "@/components/matches/match-highlights-wrapper"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TeamLogo } from "@/components/team-logo"

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
        playerStatsData.forEach((stat: any) => {
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
      setError(err instanceof Error ? err.message : "Failed to load match data")
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
    setRefreshKey((prev: number) => prev + 1)

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
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
        <div className="container mx-auto px-6 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-8"></div>
            <div className="max-w-4xl mx-auto">
              <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-8"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
        <div className="container mx-auto px-6 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {error ? "Error Loading Match" : "Match Not Found"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {error || "The match you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700 text-white">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      {/* Clean Professional Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Matches
            </Button>
              </div>
              
          {/* Main Match Card */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="p-8">
                {/* Match Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Match Details</h1>
              </div>
              
                  {/* Management Buttons */}
            {canManageMatch && (
                    <div className="flex gap-3">
                <Button
                  onClick={() => setOpenScoreModal(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-all duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Score
                </Button>
                <Button
                  onClick={() => setOpenModal(true)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-all duration-200"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import EA Data
                </Button>
                <Button
                  onClick={handleManualRefresh}
                        size="sm"
                  variant="outline"
                        className="hover:scale-105 transition-all duration-200"
                  disabled={forceRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${forceRefreshing ? "animate-spin" : ""}`} />
                  {forceRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            )}
          </div>

                {/* Team vs Team Layout */}
                <div className="flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-20 h-20 mb-4 hover:scale-105 transition-all duration-300">
                      <TeamLogo 
                        teamName={match?.home_team?.name || "Home Team"}
                        logoUrl={match?.home_team?.logo_url}
                        size="lg"
                      />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {match?.home_team?.name || "Home Team"}
                    </h2>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {match?.home_score || 0}
        </div>
          </div>

                  {/* VS Section */}
                  <div className="flex flex-col items-center mx-8">
                    <div className="text-2xl font-bold text-slate-400 dark:text-slate-500 mb-2">VS</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
                      <div>{formattedDate}</div>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-20 h-20 mb-4 hover:scale-105 transition-all duration-300">
                      <TeamLogo 
                        teamName={match?.away_team?.name || "Away Team"}
                        logoUrl={match?.away_team?.logo_url}
                        size="lg"
                      />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {match?.away_team?.name || "Away Team"}
                    </h2>
                    <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                      {match?.away_score || 0}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mt-6">
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    match?.status === 'Completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : match?.status === 'Scheduled'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {match?.status || "Status Unknown"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Clean Main Content */}
      <div className="container mx-auto px-6 py-8">

        {/* Clean Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 gap-2 p-2">
            <TabsTrigger 
              value="details" 
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
            >
              <Trophy className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Details</span>
            </TabsTrigger>
              <TabsTrigger 
                value="lineups" 
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Lineups</span>
              </TabsTrigger>
              <TabsTrigger 
                value="highlights" 
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
              >
                <Camera className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Highlights</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="space-y-8">
            <MatchDetails match={match} />

            {/* Team Stats Comparison */}
            <Card className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <CardHeader className="bg-slate-700 border-b border-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">
                      Team Statistics Comparison
                    </CardTitle>
                    <CardDescription className="text-slate-300">
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
                      <TableRow className="bg-slate-700">
                        <TableHead className="text-slate-300 font-semibold">Period</TableHead>
                        <TableHead className="text-center text-blue-300 font-semibold">
                          {match?.home_team?.name || "Home"}
                        </TableHead>
                        <TableHead className="text-center text-red-300 font-semibold">
                          {match?.away_team?.name || "Away"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-slate-700/50 transition-colors duration-200">
                        <TableCell className="font-medium text-white">1st Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-blue-400">
                          {periodScores.find((p: any) => p.period_number === 1)?.home_score || match?.period_scores?.[0]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-red-400">
                          {periodScores.find((p: any) => p.period_number === 1)?.away_score || match?.period_scores?.[0]?.away || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-slate-700/50 transition-colors duration-200">
                        <TableCell className="font-medium text-white">2nd Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-blue-400">
                          {periodScores.find((p: any) => p.period_number === 2)?.home_score || match?.period_scores?.[1]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-red-400">
                          {periodScores.find((p: any) => p.period_number === 2)?.away_score || match?.period_scores?.[1]?.away || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-slate-700/50 transition-colors duration-200">
                        <TableCell className="font-medium text-white">3rd Period</TableCell>
                        <TableCell className="text-center text-2xl font-bold text-blue-400">
                          {periodScores.find((p: any) => p.period_number === 3)?.home_score || match?.period_scores?.[2]?.home || 0}
                        </TableCell>
                        <TableCell className="text-center text-2xl font-bold text-red-400">
                          {periodScores.find((p: any) => p.period_number === 3)?.away_score || match?.period_scores?.[2]?.away || 0}
                        </TableCell>
                      </TableRow>
                      {wentToOvertime && (
                        <TableRow className="hover:bg-slate-700/50 transition-colors duration-200">
                          <TableCell className="font-medium text-white">Overtime</TableCell>
                          <TableCell className="text-center text-2xl font-bold text-blue-400">
                            {periodScores.find((p: any) => p.period_number === 4)?.home_score || match?.period_scores?.[3]?.home || 0}
                          </TableCell>
                          <TableCell className="text-center text-2xl font-bold text-red-400">
                            {periodScores.find((p: any) => p.period_number === 4)?.away_score || match?.period_scores?.[3]?.away || 0}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-slate-700 font-bold">
                        <TableCell className="font-bold text-white">Total</TableCell>
                        <TableCell className="text-center text-3xl font-black text-blue-400">
                          {match?.home_score || 0}
                        </TableCell>
                        <TableCell className="text-center text-3xl font-black text-red-400">
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
                    const playersWithScore = eaPlayerStats.map((player: any) => ({
                      ...player,
                      performanceScore: (player.goals || 0) * 3 + (player.assists || 0) * 2 + (player.shots || 0) + (player.hits || 0) + (player.blocks || 0)
                    }))
                    
                    return playersWithScore
                      .sort((a: any, b: any) => b.performanceScore - a.performanceScore)
                      .slice(0, 3)
                      .map((player: any, index: number) => ({
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
                      {topPerformers.map((star: any, index: number) => (
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
                  <Tabs defaultValue="home" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger 
                        value="home" 
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {match?.home_team?.name?.charAt(0) || "H"}
                            </span>
                          </div>
                          {match?.home_team?.name || "Home Team"}
                        </div>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="away"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6">
                            <TeamLogo 
                              teamName={match?.away_team?.name || "Away Team"}
                              logoUrl={match?.away_team?.logo_url}
                              size="xs"
                            />
                          </div>
                          {match?.away_team?.name || "Away Team"}
                        </div>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="home" className="space-y-4">
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
                              .filter(player => player.position !== 'G' && player.team_id === match?.home_team_id)
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
                    </TabsContent>
                    
                    <TabsContent value="away" className="space-y-4">
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
                              .filter(player => player.position !== 'G' && player.team_id === match?.away_team_id)
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
                    </TabsContent>
                  </Tabs>
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
                  <Tabs defaultValue="home" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger 
                        value="home" 
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {match?.home_team?.name?.charAt(0) || "H"}
                            </span>
                          </div>
                          {match?.home_team?.name || "Home Team"}
                        </div>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="away"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6">
                            <TeamLogo 
                              teamName={match?.away_team?.name || "Away Team"}
                              logoUrl={match?.away_team?.logo_url}
                              size="xs"
                            />
                          </div>
                          {match?.away_team?.name || "Away Team"}
                        </div>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="home" className="space-y-4">
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
                              .filter(player => player.position === 'G' && player.team_id === match?.home_team_id)
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
                    </TabsContent>
                    
                    <TabsContent value="away" className="space-y-4">
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
                              .filter(player => player.position === 'G' && player.team_id === match?.away_team_id)
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
                    </TabsContent>
                  </Tabs>
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