"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Edit } from "lucide-react"
import Image from "next/image"

interface ThreeStarsDisplayProps {
  matchId: string
  canEdit?: boolean
}

interface PlayerStat {
  id: string
  player_name: string
  team_name: string
  goals: number
  assists: number
  points: number
  plus_minus: number
  shots: number
  hits: number
  position?: string
  team_id: string
}

export function ThreeStarsDisplay({ matchId, canEdit = false }: ThreeStarsDisplayProps) {
  const { supabase } = useSupabase()
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [topPlayers, setTopPlayers] = useState<PlayerStat[]>([])

  useEffect(() => {
    fetchPlayerStats()
  }, [matchId])

  const fetchPlayerStats = async () => {
    try {
      setLoading(true)
      
      // Fetch EA match data for player stats
      const { data: eaData, error: eaError } = await supabase
        .from("ea_match_data")
        .select("*")
        .eq("match_id", matchId)

      if (eaError) {
        console.error("Error fetching EA match data:", eaError)
        return
      }

      if (eaData && eaData.length > 0) {
        // Process EA data to calculate points and rank players
        const processedStats = eaData.map(player => ({
          ...player,
          points: (player.goals || 0) + (player.assists || 0)
        }))

        // Sort by points, then by goals, then by plus_minus
        const sortedPlayers = processedStats.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goals !== a.goals) return b.goals - a.goals
          return (b.plus_minus || 0) - (a.plus_minus || 0)
        })

        setPlayerStats(processedStats)
        setTopPlayers(sortedPlayers.slice(0, 3))
      } else {
        // Fallback: try to get from player_statistics table
        const { data: statsData, error: statsError } = await supabase
          .from("player_statistics")
          .select(`
            *,
            players!inner(
              gamer_tag_id,
              team_id,
              teams(name)
            )
          `)
          .eq("match_id", matchId)

        if (!statsError && statsData) {
          const processedStats = statsData.map(stat => ({
            id: stat.id,
            player_name: stat.players?.gamer_tag_id || `Player ${stat.player_id}`,
            team_name: stat.players?.teams?.name || "Unknown Team",
            team_id: stat.players?.team_id || "",
            goals: stat.goals || 0,
            assists: stat.assists || 0,
            points: (stat.goals || 0) + (stat.assists || 0),
            plus_minus: stat.plus_minus || 0,
            shots: stat.shots || 0,
            hits: stat.hits || 0,
            position: stat.position
          }))

          const sortedPlayers = processedStats.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goals !== a.goals) return b.goals - a.goals
            return b.plus_minus - a.plus_minus
          })

          setPlayerStats(processedStats)
          setTopPlayers(sortedPlayers.slice(0, 3))
        }
      }
    } catch (error) {
      console.error("Error fetching player stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStarIcon = (index: number) => {
    switch (index) {
      case 0: return "🥇"
      case 1: return "🥈" 
      case 2: return "🥉"
      default: return "⭐"
    }
  }

  const getStarTitle = (index: number) => {
    switch (index) {
      case 0: return "First Star"
      case 1: return "Second Star"
      case 2: return "Third Star"
      default: return "Star"
    }
  }

  const getStarColors = (index: number) => {
    switch (index) {
      case 0: return {
        border: "border-yellow-400",
        text: "text-yellow-700",
        bg: "bg-yellow-50"
      }
      case 1: return {
        border: "border-gray-400", 
        text: "text-gray-600",
        bg: "bg-gray-50"
      }
      case 2: return {
        border: "border-amber-600",
        text: "text-amber-700", 
        bg: "bg-amber-50"
      }
      default: return {
        border: "border-gray-300",
        text: "text-gray-500",
        bg: "bg-gray-50"
      }
    }
  }

  const getImageSize = (index: number) => {
    switch (index) {
      case 0: return "w-28 h-28"
      case 1: return "w-24 h-24"
      case 2: return "w-20 h-20"
      default: return "w-16 h-16"
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50/50 to-orange-50/50 border-yellow-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            3 Stars of the Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (topPlayers.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50/50 to-orange-50/50 border-yellow-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            3 Stars of the Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No player statistics available for this match.</p>
            {canEdit && (
              <Button variant="outline" className="mt-4">
                <Edit className="h-4 w-4 mr-2" />
                Add Stars Manually
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
            {topPlayers.map((player, index) => {
              const colors = getStarColors(index)
              const imageSize = getImageSize(index)
              
              return (
                <div key={player.id || index} className="flex flex-col items-center text-center">
                  <div className={`relative ${imageSize} mb-4 rounded-full overflow-hidden border-4 ${colors.border} shadow-lg ${colors.bg}`}>
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                      {player.player_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">{getStarIcon(index)}</div>
                    <h3 className={`text-xl font-bold ${colors.text}`}>
                      {getStarTitle(index)}
                    </h3>
                    <p className="text-sm text-foreground font-medium">
                      {player.player_name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {player.team_name}
                    </Badge>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {player.goals}G, {player.assists}A, {player.points}P
                      </p>
                      {player.plus_minus !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {player.plus_minus >= 0 ? '+' : ''}{player.plus_minus}
                        </p>
                      )}
                      {(player.shots > 0 || player.hits > 0) && (
                        <p className="text-xs text-muted-foreground">
                          {player.shots} SOG, {player.hits} HIT
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {canEdit && (
            <div className="flex justify-center pt-4 border-t border-border/50">
              <Button variant="outline" className="hover:bg-yellow-50">
                <Edit className="h-4 w-4 mr-2" />
                Edit Stars of the Match
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
