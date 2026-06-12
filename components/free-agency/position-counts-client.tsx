"use client"

import { useEffect, useState } from "react"

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

  // Position colors for visual distinction
  const positionColors: Record<string, string> = {
    Center: "bg-red-500/20 text-red-300 border-red-500/30",
    "Right Wing": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Left Wing": "bg-green-500/20 text-green-300 border-green-500/30",
    "Left Defense": "bg-teal-500/20 text-teal-300 border-teal-500/30",
    "Right Defense": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Goalie: "bg-purple-500/20 text-purple-300 border-purple-500/30",
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
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 bg-slate-700/50 rounded-lg animate-pulse" />
        <div className="hidden md:flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-16 bg-slate-700/50 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !counts || total === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <span className="text-slate-400 text-sm">No free agents</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Total Count Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/50">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total</span>
        <span className="text-white font-bold text-sm">{total}</span>
      </div>

      {/* Position Breakdown */}
      <div className="hidden md:flex flex-wrap items-center gap-1.5">
        {Object.entries(counts)
          .filter(([position, count]) => position !== "Other" && count > 0)
          .map(([position, count]) => (
            <div
              key={position}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${positionColors[position] || 'bg-slate-700/50 text-slate-300 border-slate-600/50'}`}
            >
              <span>{positionAbbreviations[position] || "?"}</span>
              <span className="opacity-80">{count}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
