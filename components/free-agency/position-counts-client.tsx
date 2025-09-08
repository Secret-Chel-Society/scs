"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Target, TrendingUp, Clock, Zap, Star } from "lucide-react"

export function PositionCountsClient() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Map of position abbreviations
  const positionAbbreviations: Record<string, string> = {
    Center: "C",
    "Right Wing": "RW",
    "Left Wing": "LW",
    "Left Defense": "LD",
    "Right Defense": "RD",
    Goalie: "G",
  }

  // Position-specific icons and colors
  const positionConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
    Center: { icon: Target, color: "text-ice-blue-600 dark:text-ice-blue-400", bgColor: "bg-ice-blue-100 dark:bg-ice-blue-900/30" },
    "Right Wing": { icon: TrendingUp, color: "text-assist-green-600 dark:text-assist-green-400", bgColor: "bg-assist-green-100 dark:bg-assist-green-900/30" },
    "Left Wing": { icon: TrendingUp, color: "text-assist-green-600 dark:text-assist-green-400", bgColor: "bg-assist-green-100 dark:bg-assist-green-900/30" },
    "Left Defense": { icon: Target, color: "text-rink-blue-600 dark:text-rink-blue-400", bgColor: "bg-rink-blue-100 dark:bg-rink-blue-900/30" },
    "Right Defense": { icon: Target, color: "text-rink-blue-600 dark:text-rink-blue-400", bgColor: "bg-rink-blue-100 dark:bg-rink-blue-900/30" },
    Goalie: { icon: Clock, color: "text-goal-red-600 dark:text-goal-red-400", bgColor: "bg-goal-red-100 dark:bg-goal-red-900/30" },
  }

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/position-counts")

        if (!response.ok) {
          console.error(`Error response: ${response.status}`)
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()

        if (data && data.positionCounts) {
          setCounts(data.positionCounts)

          // Calculate total
          const sum = Object.values(data.positionCounts).reduce(
            (acc: number, val: any) => acc + (typeof val === "number" ? val : 0),
            0,
          )
          setTotal(sum)
        } else {
          console.error("Invalid data format:", data)
          throw new Error("Invalid data format received")
        }
      } catch (err) {
        console.error("Error fetching position counts:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        // Set empty counts to avoid UI issues
        setCounts({
          Center: 0,
          "Right Wing": 0,
          "Left Wing": 0,
          "Left Defense": 0,
          "Right Defense": 0,
          Goalie: 0,
          Other: 0,
        })
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-blue-600 mx-auto mb-4"></div>
        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Loading free agent position counts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-gradient-to-r from-goal-red-500/20 to-goal-red-500/20 rounded-full w-fit mx-auto mb-4">
          <Clock className="h-8 w-8 text-goal-red-600 dark:text-goal-red-400" />
        </div>
        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Unable to load free agent counts</p>
      </div>
    )
  }

  if (!counts || total === 0) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 rounded-full w-fit mx-auto mb-4">
          <Users className="h-8 w-8 text-hockey-silver-600 dark:text-hockey-silver-400" />
        </div>
        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">No free agents available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Count Card */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-xl border border-ice-blue-200/50 dark:border-rink-blue-700/50">
          <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
            {total}
          </div>
          <div className="text-sm text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
            Total Free Agents
          </div>
        </div>
      </div>

      {/* Position Breakdown Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {counts &&
          Object.entries(counts)
            .filter(([position, count]) => position !== "Other" || counts["Other"] > 0)
            .filter(([_, count]) => count > 0) // Only show positions with players
            .map(([position, count]) => {
              const config = positionConfig[position] || { icon: Star, color: "text-hockey-silver-600 dark:text-hockey-silver-400", bgColor: "bg-hockey-silver-100 dark:bg-hockey-silver-900/30" }
              const IconComponent = config.icon
              
              return (
                <Card key={position} className={`hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 ${config.bgColor} hover:scale-105 transition-transform duration-200`}>
                  <CardContent className="p-4 text-center">
                    <div className="p-2 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-lg mb-3 mx-auto w-fit">
                      <IconComponent className={`h-6 w-6 ${config.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-1">
                      {count}
                    </div>
                    <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-medium uppercase tracking-wide mb-2">
                      {position}
                    </div>
                    <Badge variant="outline" className="text-xs border-ice-blue-200 dark:border-ice-blue-700 text-ice-blue-700 dark:text-ice-blue-300">
                      {positionAbbreviations[position] || "?"}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
      </div>
    </div>
  )
}
