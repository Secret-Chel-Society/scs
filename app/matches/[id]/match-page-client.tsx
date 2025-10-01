"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ComprehensiveMatchView } from "@/components/matches/comprehensive-match-view"

export default function MatchDetailPage() {
  const params = useParams()
  const matchId = params.id as string
  const { supabase } = useSupabase()

  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch match with team details (without season relationship since it's causing issues)
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select(`
            *,
            home_team:teams!home_team_id(
              id,
              name,
              logo_url,
              ea_club_id
            ),
            away_team:teams!away_team_id(
              id,
              name,
              logo_url,
              ea_club_id
            )
          `)
          .eq("id", matchId)
          .single()

        if (matchError) {
          throw new Error(`Failed to fetch match: ${matchError.message}`)
        }

        // If we have a season_number, try to get season info separately
        if (matchData.season_number) {
          const { data: seasonData } = await supabase
            .from("seasons")
            .select("id, name, season_number")
            .eq("season_number", matchData.season_number)
            .single()

          if (seasonData) {
            matchData.season = seasonData
          }
        }

        setMatch(matchData)

        // Check if user is admin
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Check user roles table
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .in("role", ["Admin", "GM", "AGM", "Owner"])

          setIsAdmin(roleData && roleData.length > 0)
        }
      } catch (err: any) {
        console.error("Error fetching match:", err)
        setError(err.message || "Failed to load match")
      } finally {
        setLoading(false)
      }
    }

    if (matchId) {
      fetchMatch()
    }
  }, [matchId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-25 via-hockey-silver-50 to-rink-blue-50 dark:from-hockey-silver-950 dark:via-rink-blue-950 dark:to-ice-blue-950">
        <div className="container py-6">
          <Skeleton className="h-12 w-3/4 mb-6 bg-ice-blue-200/50 dark:bg-ice-blue-800/50" />
          <div className="grid gap-6">
            <Skeleton className="h-[400px] w-full bg-hockey-silver-200/50 dark:bg-hockey-silver-800/50" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-25 via-hockey-silver-50 to-rink-blue-50 dark:from-hockey-silver-950 dark:via-rink-blue-950 dark:to-ice-blue-950">
        <div className="container py-6">
          <Alert variant="destructive" className="border-goal-red-300/50 dark:border-goal-red-600/50 bg-goal-red-50/30 dark:bg-goal-red-900/20">
            <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
            <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">{error || "Match not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-25 via-hockey-silver-50 to-rink-blue-50 dark:from-hockey-silver-950 dark:via-rink-blue-950 dark:to-ice-blue-950">
      <ComprehensiveMatchView match={match} isAdmin={isAdmin} />
    </div>
  )
}
