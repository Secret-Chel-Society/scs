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
  const matchDate = match.match_date
  const formattedDate = matchDate
    ? new Date(matchDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " at " +
      new Date(matchDate).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date TBD"

  // Check both overtime fields
  const wentToOvertime = match.overtime === true || match.has_overtime === true

  const matchInProgress = match.status?.toLowerCase() === "in progress" || match.status?.toLowerCase() === "inprogress"
  const canManageMatch = matchInProgress

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
      <PageHeader
        heading={`${match.home_team?.name || "Home Team"} vs ${match.away_team?.name || "Away Team"} ${
          wentToOvertime ? "(OT)" : ""
        }`}
        text={formattedDate}
      />

      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-sm text-muted-foreground">
            Match Status: <span className="font-medium capitalize">{match.status || "Scheduled"}</span>
            {wentToOvertime && <span className="ml-2 font-medium">(Overtime)</span>}
          </span>
          <div className="mt-1">
            <span className="text-sm text-muted-foreground">
              Score:{" "}
              <span className="font-medium">
                {match.home_score || 0} - {match.away_score || 0}
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={forceRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${forceRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Management buttons - only visible if canManageMatch is true */}
          {canManageMatch && (
            <>
              <Button
                onClick={() => setOpenScoreModal(true)}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Score</span>
              </Button>
              <Button
                onClick={() => {
                  setOpenModal(true)
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {match.ea_match_id ? "Update Match Data" : "Upload Match Data"}
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-6">
        {/* Match Details */}
        <MatchDetails match={match} onMatchUpdated={fetchMatchData} isAdmin={canManageMatch} />

        {/* Tabs for mobile-friendly navigation */}
        <Tabs defaultValue="lineups" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-3 sm:mb-4">
            <TabsTrigger value="lineups" className="text-xs sm:text-sm">
              Lineups
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              Statistics
            </TabsTrigger>
            <TabsTrigger value="highlights" className="text-xs sm:text-sm">
              Highlights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lineups" className="mt-0">
            <MatchLineups matchId={matchId} homeTeam={match?.home_team} awayTeam={match?.away_team} />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            {match?.ea_match_id ? (
              <EaMatchStatistics
                matchId={matchId}
                eaMatchId={match.ea_match_id}
                homeTeamEaClubId={match?.home_team?.ea_club_id}
                awayTeamEaClubId={match?.away_team?.ea_club_id}
                homeTeamName={match?.home_team?.name}
                awayTeamName={match?.away_team?.name}
                homeScore={match?.home_score}
                awayScore={match?.away_score}
                isAdmin={canManageMatch}
              />
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No EA statistics available for this match.</p>
                    {canManageMatch && (
                      <div className="mt-4">
                        <Button onClick={() => setOpenModal(true)} variant="outline">
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
        match={match}
        teamId={undefined}
        eaClubId={teamEaClubId}
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
