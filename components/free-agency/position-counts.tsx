import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"

// Cache the fetch operation to prevent multiple identical requests
const getPositionCounts = cache(async () => {
  try {
    const supabase = createServerComponentClient({ cookies })

    // First, get the active season
    const { data: activeSeason, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single()

    if (seasonError || !activeSeason) {
      console.error("Error fetching active season:", seasonError)
      return null
    }

    // Get approved season registrations for the active season
    const { data: registrations, error: regError } = await supabase
      .from("season_registrations")
      .select("id, user_id, primary_position")
      .eq("status", "Approved")
      .eq("season_id", activeSeason.id)

    if (regError) {
      console.error("Error fetching season registrations:", regError)
      return null
    }

    if (!registrations || registrations.length === 0) {
      return []
    }

    // Get user IDs from registrations
    const userIds = registrations.map((reg) => reg.user_id)

    // Get active users
    const { data: activeUsers, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      .in("id", userIds)

    if (userError) {
      console.error("Error fetching active users:", userError)
      return null
    }

    // Get users with teams (not free agents)
    const { data: playersWithTeams, error: playerError } = await supabase
      .from("players")
      .select("user_id")
      .not("team_id", "is", null)
      .in("user_id", userIds)

    if (playerError) {
      console.error("Error fetching players with teams:", playerError)
      return null
    }

    // Create sets for faster lookups
    const activeUserIds = new Set(activeUsers?.map((user) => user.id) || [])
    const userIdsWithTeams = new Set(playersWithTeams?.map((player) => player.user_id) || [])

    // Filter to only include active users who don't have a team (free agents)
    const freeAgents = registrations.filter(
      (reg) => activeUserIds.has(reg.user_id) && !userIdsWithTeams.has(reg.user_id),
    )

    return freeAgents
  } catch (error) {
    console.error("Error in getPositionCounts:", error)
    return null
  }
})

// Fallback function - now also uses season registrations
const getPositionCountsFallback = cache(async () => {
  try {
    // Use the same logic as the main function
    return await getPositionCounts()
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

  // Process the data - now it's always season registration data
  if (Array.isArray(data)) {
    // Data from season registrations, count by primary_position
    data.forEach((registration: any) => {
      if (registration.primary_position) {
        const normalizedPosition = normalizePosition(registration.primary_position)
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
