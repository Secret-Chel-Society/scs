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
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              {match.home_team?.name || "Home Team"} vs {match.away_team?.name || "Away Team"}
              {wentToOvertime && <span className="text-ice-blue-400 ml-2">(OT)</span>}
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">{formattedDate}</p>
            
            {/* Enhanced Match Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    {match.home_score || 0} - {match.away_score || 0}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Final Score
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-rink-blue-500/25 transition-all duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-lg font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                    {match.season_name || "Season TBD"}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Season
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-lg font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    {match.status || "Status Unknown"}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Match Status
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-goal-red-500/25 transition-all duration-300">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-lg font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    {wentToOvertime ? "Overtime" : "Regulation"}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Game Type
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
            </div>

            {/* Management buttons - only visible if canManageMatch is true */}
            {canManageMatch && (
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => setOpenScoreModal(true)}
                  className="hockey-button hover:scale-105 transition-all duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Score
                </Button>
                <Button
                  onClick={() => setOpenModal(true)}
                  variant="outline"
                  className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-105 transition-all duration-200"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import EA Data
                </Button>
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  className="border-rink-blue-300 dark:border-rink-blue-600 hover:bg-rink-blue-100 dark:hover:bg-rink-blue-900/30 hover:scale-105 transition-all duration-200"
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
              Statistics
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
          </TabsContent>

          <TabsContent value="lineups" className="space-y-8">
            <MatchLineups matchId={matchId} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            {match?.ea_match_id ? (
              <EaMatchStatistics
                matchId={matchId}
                homeTeamEaClubId={match.home_team?.ea_club_id}
                awayTeamEaClubId={match.away_team?.ea_club_id}
                isAdmin={canManageMatch}
              />
            ) : (
              <Card className="hockey-card">
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
                      className="hockey-button hover:scale-105 transition-all duration-200"
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
            <MatchHighlightsWrapper matchId={matchId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* EA Match Import Modal */}
      <EaMatchImportModal
        open={openModal}
        onOpenChange={setOpenModal}
        matchId={matchId}
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