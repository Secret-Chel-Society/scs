"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ComprehensiveMatchView } from "@/components/matches/comprehensive-match-view"

export default function AHLMatchDetailPage() {
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

        // 1) Fetch just the match row to avoid the "coerce to single json" error
        const { data: matchRow, error: matchError } = await supabase
          .from("matches_ahl")
          .select("*")
          .eq("id", matchId)
          .maybeSingle()

        if (matchError) throw new Error(`Failed to fetch match: ${matchError.message}`)
        if (!matchRow) throw new Error("Match not found")

        // 2) Fetch teams explicitly (also use maybeSingle to avoid coercion issues)
        const [{ data: homeTeam }, { data: awayTeam }] = await Promise.all([
          supabase
            .from("teams_ahl")
            .select("id,name,logo_url,ea_club_id")
            .eq("id", matchRow.home_team_id)
            .maybeSingle(),
          supabase
            .from("teams_ahl")
            .select("id,name,logo_url,ea_club_id")
            .eq("id", matchRow.away_team_id)
            .maybeSingle(),
        ])

        const matchData: any = {
          ...matchRow,
          home_team: homeTeam || null,
          away_team: awayTeam || null,
        }

        // 3) Attach season by season_number (fallback to season_id if present)
        if (matchRow.season_number) {
          const { data: seasonData } = await supabase
            .from("seasons_ahl")
            .select("id, name, season_number")
            .eq("season_number", matchRow.season_number)
            .maybeSingle()
          if (seasonData) matchData.season = seasonData
        } else if (matchRow.season_id) {
          const { data: seasonData } = await supabase
            .from("seasons_ahl")
            .select("id, name, season_number")
            .eq("id", matchRow.season_id)
            .maybeSingle()
          if (seasonData) matchData.season = seasonData
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

    if (matchId) fetchMatch()
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
      <ComprehensiveMatchView match={match} userRole={userRole} league="AHL" />
    </div>
  )
}
