"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Calendar, MapPin, Trophy, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { EaDirectMatchStats } from "@/components/matches/ea-direct-match-stats"
import { MatchStatsVisualization } from "@/components/matches/match-stats-visualization"
import { MatchHighlightsWrapper } from "@/components/matches/match-highlights-wrapper"
import { EditScoreModal } from "@/components/matches/edit-score-modal"
import { EaMatchImportModal } from "@/components/matches/ea-match-import-modal"
import { SyncMatchStatsButton } from "@/components/matches/sync-match-stats-button"
import { SyncPlayerStatsButton } from "@/components/matches/sync-player-stats-button"
import { UploadMatchButton } from "@/components/matches/upload-match-button"

interface MatchDetailsProps {
  matchId: string
}

export function MatchDetails({ matchId }: MatchDetailsProps) {
  const { supabase } = useSupabase()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeamManager, setIsTeamManager] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [seasonName, setSeasonName] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isEditScoreModalOpen, setIsEditScoreModalOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Separate function to check authentication and permissions
  const checkUserPermissions = async () => {
    try {
      // Reset permission states
      setIsAdmin(false)
      setIsTeamManager(false)
      setAuthChecked(false)

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.log("No authenticated user found")
        setAuthChecked(true)
        return
      }

      setUserId(user.id)

      // Check admin status
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      if (!rolesError && userRoles) {
        setIsAdmin(userRoles.some((role) => role.role === "admin" || role.role === "Admin"))
      }

      // Check if user is a team manager (only if we have match data)
      if (match) {
        const { data: teamManagers, error: managersError } = await supabase
          .from("team_managers")
          .select("*")
          .eq("user_id", user.id)
          .in("team_id", [match.home_team_id, match.away_team_id])
          .in("role", ["Owner", "GM", "AGM"])

        if (!managersError && teamManagers) {
          setIsTeamManager(teamManagers.length > 0)
        }
      }

      setAuthChecked(true)
    } catch (err) {
      console.error("Error checking permissions:", err)
      setAuthChecked(true)
    }
  }

  const fetchMatchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, fetch the match without trying to join the seasons table
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!home_team_id(id, name, logo_url, ea_club_id),
          away_team:teams!away_team_id(id, name, logo_url, ea_club_id)
        `)
        .eq("id", matchId)
        .single()

      if (matchError) {
        throw new Error(`Error fetching match: ${matchError.message}`)
      }

      // Debug information
      setDebugInfo({
        matchData,
        homeTeamEaClubId: matchData.home_team?.ea_club_id,
        awayTeamEaClubId: matchData.away_team?.ea_club_id,
      })

      // If the match has a season_id, try to fetch the season name separately
      if (matchData.season_id) {
        try {
          // Check if the seasons table exists first
          const { data: tablesData } = await supabase
            .from("information_schema.tables")
            .select("table_name")
            .eq("table_schema", "public")
            .eq("table_name", "seasons")

          if (tablesData && tablesData.length > 0) {
            const { data: seasonData, error: seasonError } = await supabase
              .from("seasons")
              .select("name")
              .eq("id", matchData.season_id)
              .single()

            if (!seasonError && seasonData) {
              setSeasonName(seasonData.name)
            }
          }
        } catch (seasonErr) {
          console.log("Season data not available:", seasonErr)
          // Don't throw an error here, just continue without the season data
        }
      }

      setMatch(matchData)
    } catch (err: any) {
      console.error("Error fetching match details:", err)
      setError(err.message || "Failed to load match details")
    } finally {
      setLoading(false)
      // Check permissions after match data is loaded
      await checkUserPermissions()
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUserPermissions()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Initial data fetch
  useEffect(() => {
    fetchMatchData()
  }, [matchId, supabase])

  // Re-check permissions when match data changes
  useEffect(() => {
    if (match) {
      checkUserPermissions()
    }
  }, [match])

  const handleImportSuccess = () => {
    // Refresh the match data
    fetchMatchData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-8">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Match not found"}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const matchDate = new Date(match.match_date)
  const formattedDate = isNaN(matchDate.getTime())
    ? "Date not available"
    : matchDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })

  const formattedTime = isNaN(matchDate.getTime())
    ? "Time not available"
    : matchDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })

  // Only show admin controls if auth check is complete AND user has permissions
  const canManageMatch = authChecked && (isAdmin || isTeamManager)
  const isCompleted = match.status === "Completed"

  // Check if both teams have EA club IDs
  const hasEaClubIds = !!(match.home_team?.ea_club_id && match.away_team?.ea_club_id)
  const eaClubIdMissingMessage = !hasEaClubIds
    ? `EA Club ID missing for ${!match.home_team?.ea_club_id ? "home team" : "away team"}`
    : null

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
      case "inprogress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "postponed":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 rounded-2xl p-8 border border-primary/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 rounded-2xl" />
        <div className="relative">
          {/* Match Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-medium text-muted-foreground">
                {formattedDate} at {formattedTime}
              </span>
              {seasonName && (
                <Badge variant="outline" className="px-3 py-1 bg-background/80">
                  {seasonName}
                </Badge>
              )}
            </div>

            {/* Admin Controls */}
            {canManageMatch && (
              <div className="flex justify-center gap-2 mb-6">
                <UploadMatchButton match={match} onMatchUploaded={fetchMatchData} />

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                    title={eaClubIdMissingMessage || "Import EA Match"}
                    className="bg-background/80 hover:bg-background"
                  >
                    {hasEaClubIds ? "Import EA Match" : eaClubIdMissingMessage}
                  </Button>
                )}

                {isCompleted && isAdmin && (
                  <>
                    <SyncMatchStatsButton
                      matchId={matchId}
                      homeTeamId={match.home_team_id}
                      awayTeamId={match.away_team_id}
                      seasonId={match.season_id}
                      onSuccess={fetchMatchData}
                    />
                    <SyncPlayerStatsButton
                      matchId={matchId}
                      homeTeamId={match.home_team_id}
                      awayTeamId={match.away_team_id}
                      seasonId={match.season_id}
                      onSuccess={fetchMatchData}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Teams and Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-4xl mx-auto">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center space-y-4">
              <Link 
                href={`/teams/${match.home_team?.id || "#"}`}
                className="group transition-transform hover:scale-105"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 mb-3">
                  <Image
                    src={match.home_team?.logo_url || "/placeholder.svg?height=128&width=128&query=team%20logo"}
                    alt={match.home_team?.name || "Home Team"}
                    fill
                    className="object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all"
                  />
                </div>
              </Link>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  {match.home_team?.name || "Home Team"}
                </h2>
                {match.home_team?.ea_club_id && (
                  <p className="text-sm text-muted-foreground">EA ID: {match.home_team.ea_club_id}</p>
                )}
              </div>
            </div>

            {/* Score Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-background/90 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-xl">
                <div className="flex items-center justify-center space-x-6">
                  <div className="text-4xl md:text-5xl font-bold text-primary">
                    {match.home_score !== null ? match.home_score : "-"}
                  </div>
                  <div className="text-2xl md:text-3xl text-muted-foreground font-medium">-</div>
                  <div className="text-4xl md:text-5xl font-bold text-primary">
                    {match.away_score !== null ? match.away_score : "-"}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-center space-y-2">
                <Badge 
                  className={`px-4 py-2 font-semibold border ${getStatusColor(match.status || "scheduled")}`}
                  variant="outline"
                >
                  {match.status?.charAt(0).toUpperCase() + match.status?.slice(1) || "Scheduled"}
                </Badge>
                {canManageMatch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditScoreModalOpen(true)}
                    className="text-sm hover:bg-background/80"
                  >
                    Edit Score
                  </Button>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center space-y-4">
              <Link 
                href={`/teams/${match.away_team?.id || "#"}`}
                className="group transition-transform hover:scale-105"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 mb-3">
                  <Image
                    src={match.away_team?.logo_url || "/placeholder.svg?height=128&width=128&query=team%20logo"}
                    alt={match.away_team?.name || "Away Team"}
                    fill
                    className="object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all"
                  />
                </div>
              </Link>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  {match.away_team?.name || "Away Team"}
                </h2>
                {match.away_team?.ea_club_id && (
                  <p className="text-sm text-muted-foreground">EA ID: {match.away_team.ea_club_id}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug information */}
      {debugInfo && canManageMatch && (
        <details className="text-xs border rounded-lg p-4 bg-muted/30">
          <summary className="font-medium cursor-pointer hover:text-primary">Debug Information</summary>
          <div className="mt-2 overflow-auto max-h-[200px] space-y-2">
            <p>
              <strong>Home Team EA Club ID:</strong> {debugInfo.homeTeamEaClubId || "Not found"}
            </p>
            <p>
              <strong>Away Team EA Club ID:</strong> {debugInfo.awayTeamEaClubId || "Not found"}
            </p>
            <pre className="text-xs bg-background p-2 rounded border overflow-auto">
              {JSON.stringify(debugInfo.matchData, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {/* EA Club ID Warning */}
      {canManageMatch && !hasEaClubIds && (
        <Alert variant="destructive" className="border-l-4 border-l-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {eaClubIdMissingMessage}. Please set it in the team settings to enable EA match imports.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Box Score
          </TabsTrigger>
          <TabsTrigger value="stars" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            3 Stars
          </TabsTrigger>
          <TabsTrigger value="highlights" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Highlights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="space-y-6">
            <MatchStatsVisualization
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              homeScore={match.home_score}
              awayScore={match.away_score}
              periodScores={match.period_scores}
            />

            <EaDirectMatchStats
              matchId={matchId}
              eaMatchId={match.ea_match_id}
              eaClubId={match.home_team?.ea_club_id}
              isAdmin={isAdmin}
              className="mb-6"
            />
          </div>
        </TabsContent>

        <TabsContent value="stars" className="mt-0">
          <Card className="bg-gradient-to-br from-yellow-50/50 to-orange-50/50 border-yellow-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                3 Stars of the Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                  {/* First Star */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
                      <Image src="/placeholder-user.jpg" alt="First Star" fill className="object-cover" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl">⭐</div>
                      <h3 className="text-xl font-bold text-yellow-700">First Star</h3>
                      <p className="text-sm text-muted-foreground font-medium">Player Name</p>
                      <p className="text-xs text-muted-foreground">2G, 1A, +2</p>
                    </div>
                  </div>

                  {/* Second Star */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-4 border-gray-400 shadow-lg">
                      <Image src="/placeholder-user.jpg" alt="Second Star" fill className="object-cover" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xl">⭐</div>
                      <h3 className="text-lg font-bold text-gray-600">Second Star</h3>
                      <p className="text-sm text-muted-foreground font-medium">Player Name</p>
                      <p className="text-xs text-muted-foreground">1G, 2A, +1</p>
                    </div>
                  </div>

                  {/* Third Star */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-20 h-20 mb-4 rounded-full overflow-hidden border-4 border-amber-600 shadow-lg">
                      <Image src="/placeholder-user.jpg" alt="Third Star" fill className="object-cover" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg">⭐</div>
                      <h3 className="text-base font-bold text-amber-700">Third Star</h3>
                      <p className="text-sm text-muted-foreground font-medium">Player Name</p>
                      <p className="text-xs text-muted-foreground">1G, 1A, +1</p>
                    </div>
                  </div>
                </div>

                {canManageMatch && (
                  <div className="flex justify-center pt-4 border-t border-border/50">
                    <Button variant="outline" className="hover:bg-yellow-50">
                      Edit Stars of the Match
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="mt-0">
          <MatchHighlightsWrapper matchId={matchId} canEdit={canManageMatch} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {isAdmin && (
        <EaMatchImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          match={match}
          teamId={match.home_team_id}
          eaClubId={match.home_team?.ea_club_id}
          homeTeamEaClubId={match.home_team?.ea_club_id}
          awayTeamEaClubId={match.away_team?.ea_club_id}
          onImportSuccess={handleImportSuccess}
          isAdmin={isAdmin}
        />
      )}

      {canManageMatch && (
        <EditScoreModal
          open={isEditScoreModalOpen}
          onOpenChange={setIsEditScoreModalOpen}
          match={match}
          canEdit={true}
          onUpdate={(updatedMatch) => {
            setMatch(updatedMatch)
            fetchMatchData()
          }}
        />
      )}
    </div>
  )
}
