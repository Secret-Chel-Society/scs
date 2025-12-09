import { NextResponse } from "next/server"
import { calculateStandings, getCurrentSeasonId } from "@/lib/standings-calculator"

export async function GET(request: Request) {
  try {
    // Get season parameter from query params
    const url = new URL(request.url)
    const seasonParam = url.searchParams.get("season")

    let seasonIdNumber: number

    if (seasonParam) {
      // If season name is provided, try to extract season number
      const seasonMatch = seasonParam.match(/Season\s+(\d+)/i) || seasonParam.match(/(\d+)/)
      if (seasonMatch) {
        seasonIdNumber = Number.parseInt(seasonMatch[1], 10)
        if (isNaN(seasonIdNumber)) {
          return NextResponse.json({ error: "Invalid season number" }, { status: 400 })
        }
      } else {
        // Fallback to current season if we can't parse the season
        seasonIdNumber = await getCurrentSeasonId()
      }
    } else {
      // Get current season ID if no season specified
      seasonIdNumber = await getCurrentSeasonId()
    }

    console.log(`Fetching standings for season ${seasonIdNumber}`)

    // Calculate standings
    const standings = await calculateStandings(seasonIdNumber)

    console.log(`Returning ${standings.length} team standings`)

    return NextResponse.json({ standings, seasonId: seasonIdNumber })
  } catch (error: any) {
    console.error("Error in standings API:", error)
    return NextResponse.json({ error: `Error fetching standings: ${error.message}` }, { status: 500 })
  }
}
