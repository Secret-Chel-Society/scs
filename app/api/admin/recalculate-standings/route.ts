import { NextResponse } from "next/server"
import { recalculateAndUpdateTeamStats } from "@/lib/standings-calculator"

export async function POST(request: Request) {
  try {
    const { seasonId } = await request.json()

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID is required" }, { status: 400 })
    }

    // Recalculate standings for the specified season
    await recalculateAndUpdateTeamStats(Number(seasonId))

    return NextResponse.json({ success: true, message: "Standings recalculated successfully" })
  } catch (error: any) {
    console.error("Error recalculating standings:", error)
    return NextResponse.json({ error: `Failed to recalculate standings: ${error.message}` }, { status: 500 })
  }
}
