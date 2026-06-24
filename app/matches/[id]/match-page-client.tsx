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
          // Define role hierarchy (highest to lowest priority)
          const rolePriority: { [key: string]: number } = {
            Admin: 5,
            Owner: 4,
            GM: 3,
            AGM: 2,
            Player: 1,
          }

          // Normalize role labels coming from either table (e.g. "ECL Owner" -> "Owner")
          const normalizeRole = (raw: string | null | undefined): string => {
            if (!raw) return "Player"
            const r = raw.trim()
            if (r === "Admin") return "Admin"
            if (/owner/i.test(r)) return "Owner"
            if (/\bagm\b/i.test(r)) return "AGM"
            if (/\bgm\b/i.test(r)) return "GM"
            return r
          }

          let highestRole = "Player"
          let highestPriority = 0
          const considerRole = (raw: string | null | undefined) => {
            const role = normalizeRole(raw)
            const priority = rolePriority[role] || 0
            if (priority > highestPriority) {
              highestPriority = priority
              highestRole = role
            }
          }

          // 1) Global roles from user_roles (covers Admin and any league-wide roles)
          const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id)
          rolesData?.forEach((roleEntry) => considerRole(roleEntry.role))

          // 2) Team management roles from the players table, scoped to THIS match's teams.
          // Owner/GM/AGM are stored per-team here, so a user only manages a match if they
          // hold a management role on the home or away team.
          const matchTeamIds = [matchData.home_team_id, matchData.away_team_id].filter(Boolean)
          if (matchTeamIds.length > 0) {
            const { data: playerRows } = await supabase
              .from("players")
              .select("role, team_id, team_id_ahl, team_id_ecl")
              .eq("user_id", user.id)

            playerRows?.forEach((p: any) => {
              const onThisMatchTeam =
                matchTeamIds.includes(p.team_id) ||
                matchTeamIds.includes(p.team_id_ahl) ||
                matchTeamIds.includes(p.team_id_ecl)
              if (onThisMatchTeam) considerRole(p.role)
            })
          }

          console.log("[v0] Match permissions - resolved role:", highestRole, "for match teams:", matchTeamIds)
          setUserRole(highestRole)
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
