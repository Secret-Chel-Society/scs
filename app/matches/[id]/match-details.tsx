"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
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
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !match) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Match not found"}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Match Details</CardTitle>
              <CardDescription>
                {formattedDate} at {formattedTime}
                {seasonName && (
                  <Badge variant="outline" className="ml-2">
                    {seasonName}
                  </Badge>
                )}
              </CardDescription>
            </div>
            {canManageMatch && (
              <div className="flex gap-2">
                <UploadMatchButton match={match} onMatchUploaded={fetchMatchData} />

                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setIsImportModalOpen(true)}
                    title={eaClubIdMissingMessage || "Import EA Match"}
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
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 mb-2">
                <Link href={`/teams/${match.home_team?.id || "#"}`}>
                  <Image
                    src={match.home_team?.logo_url || "/placeholder.svg?height=80&width=80&query=team%20logo"}
                    alt={match.home_team?.name || "Home Team"}
                    fill
                    className="object-contain"
                  />
                </Link>
              </div>
              <h3 className="text-lg font-semibold">{match.home_team?.name || "Home Team"}</h3>
              {match.home_team?.ea_club_id && (
                <p className="text-xs text-muted-foreground">EA ID: {match.home_team.ea_club_id}</p>
              )}
            </div>

            <div className="flex items-center">
              <div className="text-4xl font-bold">{match.home_score !== null ? match.home_score : "-"}</div>
              <div className="mx-4 text-2xl">-</div>
              <div className="text-4xl font-bold">{match.away_score !== null ? match.away_score : "-"}</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 mb-2">
                <Link href={`/teams/${match.away_team?.id || "#"}`}>
                  <Image
                    src={match.away_team?.logo_url || "/placeholder.svg?height=80&width=80&query=team%20logo"}
                    alt={match.away_team?.name || "Away Team"}
                    fill
                    className="object-contain"
                  />
                </Link>
              </div>
              <h3 className="text-lg font-semibold">{match.away_team?.name || "Away Team"}</h3>
              {match.away_team?.ea_club_id && (
                <p className="text-xs text-muted-foreground">EA ID: {match.away_team.ea_club_id}</p>
              )}
            </div>
          </div>

          {match.status && (
            <div className="flex justify-center mt-2">
              <Badge variant={match.status === "Completed" ? "success" : "secondary"}>
                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug information */}
      {debugInfo && canManageMatch && (
        <details className="text-xs border p-2 rounded">
          <summary className="font-medium cursor-pointer">Debug Information</summary>
          <div className="mt-2 overflow-auto max-h-[200px]">
            <p>
              <strong>Home Team EA Club ID:</strong> {debugInfo.homeTeamEaClubId || "Not found"}
            </p>
            <p>
              <strong>Away Team EA Club ID:</strong> {debugInfo.awayTeamEaClubId || "Not found"}
            </p>
            <pre>{JSON.stringify(debugInfo.matchData, null, 2)}</pre>
          </div>
        </details>
      )}

      {canManageMatch && !hasEaClubIds && (
        <Alert variant="warning" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {eaClubIdMissingMessage}. Please set it in the team settings to enable EA match imports.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Box Score</TabsTrigger>
          <TabsTrigger value="stars">3 Stars of the Match</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {canManageMatch && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsEditScoreModalOpen(true)} className="mb-2">
                  Edit Box Score
                </Button>
              </div>
            )}

            <MatchStatsVisualization
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              homeScore={match.home_score}
              awayScore={match.away_score}
              periodScores={match.period_scores}
            />

            {/* Team Stats moved from Match Stats tab to here */}
            <EaDirectMatchStats
              matchId={matchId}
              eaMatchId={match.ea_match_id}
              eaClubId={match.home_team?.ea_club_id}
              isAdmin={isAdmin}
              className="mb-6"
            />
          </div>
        </TabsContent>

        <TabsContent value="stars">
          {/* 3 Stars of the Match content */}
          <Card>
            <CardHeader>
              <CardTitle>3 Stars of the Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-2 rounded-full overflow-hidden border-4 border-yellow-400">
                      <Image src="/hockey-player.png" alt="First Star" fill className="object-cover" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">⭐ First Star</h3>
                      <p className="text-sm text-muted-foreground">Player Name</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="relative w-20 h-20 mb-2 rounded-full overflow-hidden border-2 border-gray-300">
                      <Image src="/hockey-player.png" alt="Second Star" fill className="object-cover" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-md font-medium">⭐ Second Star</h3>
                      <p className="text-sm text-muted-foreground">Player Name</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16 mb-2 rounded-full overflow-hidden border border-amber-700">
                      <Image src="/hockey-player.png" alt="Third Star" fill className="object-cover" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-medium">⭐ Third Star</h3>
                      <p className="text-sm text-muted-foreground">Player Name</p>
                    </div>
                  </div>
                </div>

                {canManageMatch && (
                  <div className="flex justify-center">
                    <Button variant="outline">Edit Stars of the Match</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights">
          <MatchHighlightsWrapper matchId={matchId} canEdit={canManageMatch} />
        </TabsContent>
      </Tabs>

      {/* EA Match Import Modal - Only render if user has permissions */}
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
            fetchMatchData() // Refresh data after update
          }}
        />
      )}
    </div>
  )
}
