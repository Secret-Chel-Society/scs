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
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true)
        setError(null)

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

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id)

          if (rolesData && rolesData.length > 0) {
            // Define role hierarchy (highest to lowest priority)
            const rolePriority: { [key: string]: number } = {
              Admin: 5,
              Owner: 4,
              GM: 3,
              AGM: 2,
              Player: 1,
            }

            // Find the highest priority role
            let highestRole = "Player"
            let highestPriority = 0

            rolesData.forEach((roleEntry) => {
              const priority = rolePriority[roleEntry.role] || 0
              if (priority > highestPriority) {
                highestPriority = priority
                highestRole = roleEntry.role
              }
            })

            console.log(
              "[v0] User roles:",
              rolesData.map((r) => r.role),
            )
            console.log("[v0] Highest priority role:", highestRole)
            setUserRole(highestRole)
          }
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
      <ComprehensiveMatchView match={match} userRole={userRole} />
    </div>
  )
}
