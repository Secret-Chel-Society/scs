"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { calculateStandings } from "@/lib/standings-calculator"
import { getCurrentSeasonId } from "@/lib/utils"

interface WaiverPriorityDisplayProps {
  teamId: string
}

export function WaiverPriorityDisplay({ teamId }: WaiverPriorityDisplayProps) {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [currentTeamRank, setCurrentTeamRank] = useState<number | null>(null)

  useEffect(() => {
    async function fetchWaiverPriority() {
      try {
        setLoading(true)
        setError(null)

        const seasonId = await getCurrentSeasonId(supabase)

        if (!seasonId) {
          throw new Error("Could not determine current season")
        }

        // Calculate from standings (worst team gets first priority)
        const standings = await calculateStandings(seasonId)

        // Sort by points ascending, then wins ascending, then goal diff ascending (worst first)
        const waiverPriorityOrder = [...standings].sort((a, b) => {
          if (a.points !== b.points) return a.points - b.points
          if (a.wins !== b.wins) return a.wins - b.wins
          return (a.goal_differential || 0) - (b.goal_differential || 0)
        })

        setTeams(waiverPriorityOrder)

        const currentTeamIndex = waiverPriorityOrder.findIndex((team) => team.id === teamId)
        if (currentTeamIndex !== -1) {
          setCurrentTeamRank(currentTeamIndex + 1)
        }
      } catch (error) {
        console.error("Error fetching waiver priority:", error)
        setError("Failed to load waiver priority")
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchWaiverPriority()
    }
  }, [supabase, teamId])

  const getTeamInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Priority List</span>
          {currentTeamRank !== null && (
            <span className="text-sm font-normal text-muted-foreground">Your pick: #{currentTeamRank}</span>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on current standings (worst record = highest priority)
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : (
          <div className="space-y-1">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  team.id === teamId
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50"
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      : index === 1
                      ? "bg-gray-400/20 text-gray-600 dark:text-gray-400"
                      : index === 2
                      ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                {team.logo_url ? (
                  <div className="h-10 w-10 relative flex-shrink-0">
                    <Image
                      src={team.logo_url || "/placeholder.svg"}
                      alt={team.name || "Team logo"}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {getTeamInitials(team.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${team.id === teamId ? "text-primary" : ""}`}>
                    {team.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {team.wins}-{team.losses}-{team.otl}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
