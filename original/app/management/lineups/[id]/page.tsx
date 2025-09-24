"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { TeamLineupManager } from "@/components/management/team-lineup-manager"
import { RunTeamManagersMigration } from "@/components/management/run-team-managers-migration"
import Link from "next/link"

export default function ManageTeamLineupPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [match, setMatch] = useState<any>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const matchId = params.id as string

  useEffect(() => {
    async function checkAuth() {
      if (!session?.user) {
        console.log("No session found, redirecting to login")
        router.push("/login?redirect=/management")
        return
      }

      try {
        setLoading(true)
        console.log("Checking authorization for user:", session.user.id)

        // Fetch the match data first to have it available
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select(`
            *,
            home_team:home_team_id(id, name, logo_url),
            away_team:away_team_id(id, name, logo_url)
          `)
          .eq("id", matchId)
          .single()

        if (matchError) {
          console.error("Error fetching match:", matchError)
          throw new Error("Match not found")
        }

        console.log("Match data:", matchData)

        // Get the player data to check if they're a team player
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("team_id, role, id")
          .eq("user_id", session.user.id)

        if (playerError) {
          console.error("Error checking player data:", playerError)
          setDebugInfo({ playerError })
          throw new Error("Failed to verify player status")
        }

        console.log("Player data:", playerData)
        setDebugInfo({ playerData, matchData })

        // Direct check: Is the user a manager of either team in this match?
        const isHomeTeamPlayer = playerData?.some((p) => p.team_id === matchData.home_team_id)
        const isAwayTeamPlayer = playerData?.some((p) => p.team_id === matchData.away_team_id)

        if (!isHomeTeamPlayer && !isAwayTeamPlayer) {
          console.log("User is not a player on either team in this match")
          throw new Error("You can only manage lineups for your own team's matches")
        }

        // Check if the user is a manager (GM, AGM, Owner) on either team
        const isHomeTeamManager = playerData?.some(
          (p) => p.team_id === matchData.home_team_id && ["GM", "AGM", "Owner"].includes(p.role),
        )
        const isAwayTeamManager = playerData?.some(
          (p) => p.team_id === matchData.away_team_id && ["GM", "AGM", "Owner"].includes(p.role),
        )

        if (!isHomeTeamManager && !isAwayTeamManager) {
          console.log("User is not a manager of either team in this match")
          throw new Error("You must be a team manager (GM, AGM, or Owner) to manage lineups")
        }

        // Set the team ID based on which team the user manages
        const teamIdForMatch = isHomeTeamManager ? matchData.home_team_id : matchData.away_team_id

        setMatch(matchData)
        setTeamId(teamIdForMatch)
        setIsAuthorized(true)
        console.log("Authorization successful, team ID:", teamIdForMatch)
      } catch (error: any) {
        console.error("Error in authorization check:", error)
        setError(error.message || "You don't have permission to access this page")
        setIsAuthorized(false)

        // Only show toast for errors
        toast({
          title: "Access Denied",
          description: error.message || "You don't have permission to access this page",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, session, toast, router, matchId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/management">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Management
            </Link>
          </Button>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (needsMigration) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/management">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Management
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Setup Required</h1>
        </div>
        <RunTeamManagersMigration onComplete={() => window.location.reload()} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/management">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Management
            </Link>
          </Button>
        </div>
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/management">Return to Management</Link>
          </Button>
        </div>

        {/* Debug information - remove in production */}
        {debugInfo && (
          <div className="mt-8 p-4 border rounded bg-muted/20">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto p-2 bg-muted rounded">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }

  if (!isAuthorized || !match || !teamId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/management">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Management
            </Link>
          </Button>
        </div>
        <div className="bg-muted rounded-lg p-6 text-center">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/management">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Management
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Manage Team Lineup</h1>
      </div>

      <TeamLineupManager matchId={matchId} teamId={teamId} match={match} />
    </div>
  )
}
