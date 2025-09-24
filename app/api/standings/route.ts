import { NextResponse } from "next/server"
import { calculateStandings, getCurrentSeasonId } from "@/lib/standings-calculator"

export async function GET(request: Request) {
  try {
    console.log("=== STANDINGS API CALLED ===")
    
    // Get season ID from query params or use current season
    const url = new URL(request.url)
    const seasonId = url.searchParams.get("seasonId")

    let seasonIdNumber: number

    if (seasonId) {
      seasonIdNumber = Number.parseInt(seasonId, 10)
      if (isNaN(seasonIdNumber)) {
        console.log("Invalid season ID provided:", seasonId)
        return NextResponse.json({ error: "Invalid season ID" }, { status: 400 })
      }
    } else {
      // Get current season ID
      console.log("Getting current season ID...")
      seasonIdNumber = await getCurrentSeasonId()
      console.log("Current season ID:", seasonIdNumber)
    }

    console.log(`Fetching standings for season ${seasonIdNumber}`)

    // Calculate standings
    const standings = await calculateStandings(seasonIdNumber)

    console.log(`Returning ${standings.length} team standings`)
    console.log("Standings data:", standings)
    console.log("=== END STANDINGS API ===")

    return NextResponse.json({ standings, seasonId: seasonIdNumber })
  } catch (error: any) {
    console.error("Error in standings API:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ error: `Error fetching standings: ${error.message}` }, { status: 500 })
  }
}
