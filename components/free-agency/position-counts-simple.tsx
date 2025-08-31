import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function PositionCounts() {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Define the positions we want to display
    const positions = ["Center", "Right Wing", "Left Wing", "Left Defense", "Right Defense", "Goalie"]

    // Map of position abbreviations
    const positionAbbreviations: Record<string, string> = {
      Center: "C",
      "Right Wing": "RW",
      "Left Wing": "LW",
      "Left Defense": "LD",
      "Right Defense": "RD",
      Goalie: "G",
    }

    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-end gap-3">
        {positions.map((position) => (
          <div key={position} className="whitespace-nowrap">
            {position} ({positionAbbreviations[position]}): -
          </div>
        ))}
      </div>
    )
  } catch (error) {
    console.error("Error rendering position counts:", error)
    return null
  }
}
