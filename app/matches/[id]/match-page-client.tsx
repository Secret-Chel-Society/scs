"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MatchDetails } from "@/components/matches/match-details"
import { AlertCircle, Upload, Edit, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { EaMatchImportModal } from "@/components/matches/ea-match-import-modal"
import { EditScoreModal } from "@/components/matches/edit-score-modal"
import { EaMatchStatistics } from "@/components/matches/ea-match-statistics"
import { MatchLineups } from "@/components/matches/match-lineups"
import { MatchHighlightsWrapper } from "@/components/matches/match-highlights-wrapper"

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
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        <Skeleton className="h-8 sm:h-12 w-3/4 mb-4 sm:mb-6" />
        <div className="grid gap-4 sm:gap-6">
          <Skeleton className="h-[300px] sm:h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        <PageHeader heading="Error" text={error || "Match not found"} />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/30">
      {/* Hero Header Section */}
      <div className="clean-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="clean-title mb-6">
              {match.home_team?.name || "Home Team"} vs {match.away_team?.name || "Away Team"}
              {wentToOvertime && <span className="text-blue-400 ml-2">(OT)</span>}
            </h1>
            <p className="clean-subtitle mb-8">{formattedDate}</p>
            
            {/* Match Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <div className="clean-stat-item">
                <div className="clean-icon-container mb-3">
                  <div className="text-2xl">🏆</div>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {match.home_score || 0} - {match.away_score || 0}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                  Final Score
                </div>
              </div>

              <div className="clean-stat-item">
                <div className="clean-icon-container-emerald mb-3">
                  <div className="text-2xl">📅</div>
                </div>
                <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {match.season_name || "Season TBD"}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
                  Season
                </div>
              </div>

              <div className="clean-stat-item">
                <div className="clean-icon-container-amber mb-3">
                  <div className="text-2xl">⚽</div>
                </div>
                <div className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                  {match.status || "Status Unknown"}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">
                  Match Status
                </div>
              </div>
            </div>

            {/* Management buttons - only visible if canManageMatch is true */}
            {canManageMatch && (
              <>
                <Button
                  onClick={() => setOpenScoreModal(true)}
                  variant="default"
                  size="sm"
                  className="clean-button mr-3"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Score
                </Button>
                <Button
                  onClick={() => setOpenModal(true)}
                  variant="outline"
                  size="sm"
                  className="clean-button-outline mr-3"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import EA Data
                </Button>
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  size="sm"
                  className="clean-button-outline"
                  disabled={forceRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${forceRefreshing ? "animate-spin" : ""}`} />
                  {forceRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lineups">Lineups</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="highlights">Highlights</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <MatchDetails match={match} />
          </TabsContent>

          <TabsContent value="lineups" className="mt-0">
            <MatchLineups matchId={matchId} />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            {match?.ea_match_id ? (
              <EaMatchStatistics
                matchId={matchId}
                homeTeamEaClubId={match.home_team?.ea_club_id}
                awayTeamEaClubId={match.away_team?.ea_club_id}
                isAdmin={canManageMatch}
              />
            ) : (
              <Card className="clean-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No EA statistics available for this match.</p>
                    {canManageMatch && (
                      <div className="mt-4">
                        <Button onClick={() => setOpenModal(true)} variant="outline" className="clean-button-outline">
                          Import EA Match Data
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="highlights" className="mt-0">
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