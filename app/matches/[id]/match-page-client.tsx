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

        // Fetch match with team details
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
            ),
            season:seasons(
              id,
              name,
              season_number
            )
          `)
          .eq("id", matchId)
          .single()

        if (matchError) {
          throw new Error(`Failed to fetch match: ${matchError.message}`)
        }

        setMatch(matchData)

        // Check if user is admin
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

          setIsAdmin(userData?.role === "admin")
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
      <div className="container py-6">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Match not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <ComprehensiveMatchView match={match} isAdmin={isAdmin} />
    </div>
  )
}
