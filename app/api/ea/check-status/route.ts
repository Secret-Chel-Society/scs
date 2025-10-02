import { NextResponse } from "next/server"
import { fetchFromEA } from "@/lib/ea-api"

export async function GET() {
  try {
    console.log("Checking EA API status")

    // and doesn't require specific IDs or premium features
    try {
      console.log("Checking Club Search endpoint")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetchFromEA(
        "https://proclubs.ea.com/api/nhl/clubs/search?platform=common-gen5&clubName=test",
        {
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      // If we get here, the EA API is available
      return NextResponse.json({
        available: true,
        message: "EA API is available",
        endpoints: [
          {
            name: "Club Search",
            status: response.status,
            available: true,
          },
        ],
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error checking Club Search endpoint:", error)

      // If the Club Search endpoint fails, the EA API is likely unavailable
      return NextResponse.json({
        available: false,
        message: "EA API is currently unavailable",
        endpoints: [
          {
            name: "Club Search",
            error: error.message,
            available: false,
          },
        ],
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error: any) {
    console.error("Error checking EA API status:", error)
    return NextResponse.json({
      available: false,
      message: "Error checking EA API status",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
