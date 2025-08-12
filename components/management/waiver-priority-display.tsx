"use client"

// Fix the waiver priority display component to properly show the team's waiver priority

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

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

        // Fetch standings data to determine waiver priority
        const { data: standings, error: standingsError } = await supabase
          .from("teams")
          .select("id, name, logo_url, wins, losses, otl, points, goals_for, goals_against")
          .eq("is_active", true)
          .order("points", { ascending: true }) // Lower points = higher priority
          .order("wins", { ascending: true }) // Fewer wins = higher priority
          .order("goals_for", { ascending: true }) // Fewer goals = higher priority

        if (standingsError) {
          throw standingsError
        }

        // Calculate goal differential and sort by priority
        const teamsWithPriority = standings
          .map((team) => ({
            ...team,
            goalDiff: (team.goals_for || 0) - (team.goals_against || 0),
            points: team.points || team.wins * 2 + team.otl,
          }))
          .sort((a, b) => {
            // Sort by points (ascending)
            if (a.points !== b.points) return a.points - b.points

            // If points are tied, sort by wins (ascending)
            if (a.wins !== b.wins) return a.wins - b.wins

            // If wins are tied, sort by goal differential (ascending)
            return a.goalDiff - b.goalDiff
          })

        setTeams(teamsWithPriority)

        // Find current team's rank
        const currentTeamIndex = teamsWithPriority.findIndex((team) => team.id === teamId)
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

  // Function to get team initials
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Waiver Priority</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : (
          <>
            <div className="text-sm mb-4">
              {currentTeamRank !== null ? (
                <p>
                  Your team has waiver priority <span className="font-bold">#{currentTeamRank}</span> of {teams.length}{" "}
                  teams
                </p>
              ) : (
                <p>Could not determine your team's waiver priority</p>
              )}
            </div>
            <div className="space-y-2">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className={`flex items-center p-2 rounded-md ${
                    team.id === teamId ? "bg-primary/10 border border-primary/20" : ""
                  }`}
                >
                  <div className="w-6 text-center font-medium text-sm mr-2">#{index + 1}</div>
                  {team.logo_url ? (
                    <div className="h-6 w-6 mr-2 relative">
                      <Image
                        src={team.logo_url || "/placeholder.svg"}
                        alt={team.name || "Team logo"}
                        fill
                        className="object-contain rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="h-6 w-6 mr-2 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                      {getTeamInitials(team.name)}
                    </div>
                  )}
                  <div className="flex-1 text-sm truncate">{team.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.wins}-{team.losses}-{team.otl}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
