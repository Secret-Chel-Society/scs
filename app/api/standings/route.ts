import { NextResponse } from "next/server"
import { calculateStandings, getCurrentSeasonId } from "@/lib/standings-calculator"

export async function GET(request: Request) {
  try {
    // Get season ID from query params or use current season
    const url = new URL(request.url)
    const seasonId = url.searchParams.get("seasonId")

    let seasonIdNumber: number

    if (seasonId) {
      seasonIdNumber = Number.parseInt(seasonId, 10)
      if (isNaN(seasonIdNumber)) {
        return NextResponse.json({ error: "Invalid season ID" }, { status: 400 })
      }
    } else {
      // Get current season ID
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
