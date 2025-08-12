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
      <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-end gap-3">
        <div className="whitespace-nowrap animate-pulse">Loading free agent position counts...</div>
      </div>
    )
  }

  if (error) {
    return <div className="text-xs text-gray-500 dark:text-gray-400 text-right">Unable to load free agent counts</div>
  }

  if (!counts || total === 0) {
    return <div className="text-xs text-gray-500 dark:text-gray-400 text-right">No free agents available</div>
  }

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-end gap-3">
      <div className="whitespace-nowrap font-medium">Total Free Agents: {total}</div>
      {counts &&
        Object.entries(counts)
          .filter(([position, count]) => position !== "Other" || counts["Other"] > 0)
          .filter(([_, count]) => count > 0) // Only show positions with players
          .map(([position, count]) => (
            <div key={position} className="whitespace-nowrap">
              {position} ({positionAbbreviations[position] || "?"}): {count}
            </div>
          ))}
    </div>
  )
}
