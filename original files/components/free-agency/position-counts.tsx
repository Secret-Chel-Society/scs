import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"

// Cache the fetch operation to prevent multiple identical requests
const getPositionCounts = cache(async () => {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Use a more efficient count query with a single request
    const { data, error } = await supabase.rpc("get_position_counts")

    if (error) {
      console.error("Supabase RPC error:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getPositionCounts:", error)
    return null
  }
})

// Fallback function that doesn't use RPC in case the stored procedure doesn't exist
const getPositionCountsFallback = cache(async () => {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Use a more efficient query with fewer columns
    const { data, error } = await supabase.from("users").select("primary_position").eq("is_active", true)

    if (error) {
      console.error("Supabase query error:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getPositionCountsFallback:", error)
    return null
  }
})

export async function PositionCounts() {
  // Try the RPC method first, fall back to regular query if it fails
  let data = await getPositionCounts().catch(() => null)

  // If RPC failed, use the fallback method
  if (!data) {
    data = await getPositionCountsFallback().catch(() => null)
  }

  // If both methods failed, return empty state
  if (!data) {
    return <div className="text-xs text-gray-500 dark:text-gray-400 text-right">Position data unavailable</div>
  }

  // Initialize position counts
  const positionCounts: Record<string, number> = {
    Center: 0,
    "Right Wing": 0,
    "Left Wing": 0,
    "Left Defense": 0,
    "Right Defense": 0,
    Goalie: 0,
    Other: 0,
  }

  // Process the data based on its format
  if (Array.isArray(data) && data.length > 0 && "count" in data[0]) {
    // Data from RPC with count already calculated
    data.forEach((item: any) => {
      const position = item.position || "Other"
      const normalizedPosition = normalizePosition(position)
      positionCounts[normalizedPosition] = item.count
    })
  } else if (Array.isArray(data)) {
    // Data from fallback method, need to count manually
    data.forEach((user: any) => {
      if (user.primary_position) {
        const normalizedPosition = normalizePosition(user.primary_position)
        positionCounts[normalizedPosition]++
      } else {
        positionCounts["Other"]++
      }
    })
  }

  // Map of position abbreviations
  const positionAbbreviations: Record<string, string> = {
    Center: "C",
    "Right Wing": "RW",
    "Left Wing": "LW",
    "Left Defense": "LD",
    "Right Defense": "RD",
    Goalie: "G",
    Other: "",
  }

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-end gap-3">
      {Object.entries(positionCounts)
        .filter(([position, count]) => position !== "Other" || count > 0) // Only show "Other" if count > 0
        .map(([position, count]) => (
          <div key={position} className="whitespace-nowrap">
            {position} {positionAbbreviations[position] ? `(${positionAbbreviations[position]})` : ""}: {count}
          </div>
        ))}
    </div>
  )
}

// Helper function to normalize position names
function normalizePosition(pos: string): string {
  if (!pos) return "Other"

  const posLower = pos.toLowerCase().trim()

  if (posLower.includes("center") || posLower === "c") return "Center"
  if (posLower.includes("right wing") || posLower === "rw" || posLower === "right w") return "Right Wing"
  if (posLower.includes("left wing") || posLower === "lw" || posLower === "left w") return "Left Wing"
  if (posLower.includes("left defense") || posLower === "ld" || posLower === "left d") return "Left Defense"
  if (posLower.includes("right defense") || posLower === "rd" || posLower === "right d") return "Right Defense"
  if (posLower.includes("goalie") || posLower === "g" || posLower.includes("goal")) return "Goalie"

  return "Other"
}
