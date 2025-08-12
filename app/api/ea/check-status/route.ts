import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Checking EA API status")

    // Define endpoints to check
    const endpoints = [
      {
        name: "Club Search",
        url: "https://proclubs.ea.com/api/nhl/clubs/search?platform=common-gen5&clubName=test",
      },
      {
        name: "Recent Matches",
        url: "https://proclubs.ea.com/api/nhl/clubs/matches?matchType=club_private&platform=common-gen5",
      },
      {
        name: "Match Details",
        url: "https://proclubs.ea.com/api/nhl/match/details?matchType=club_private&platform=common-gen5&matchId=1", // This will likely fail but we just want to check if the endpoint responds
      },
    ]

    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        try {
          console.log(`Checking endpoint: ${endpoint.name}`)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          const response = await fetch(endpoint.url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              Accept: "application/json",
              "Cache-Control": "no-cache",
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          // We consider any response (even an error response) as the API being available
          // because we're just checking if the API is responding at all
          return {
            name: endpoint.name,
            status: response.status,
            available: true,
          }
        } catch (error: any) {
          console.error(`Error checking endpoint ${endpoint.name}:`, error)
          return {
            name: endpoint.name,
            error: error.message,
            available: false,
          }
        }
      }),
    )

    // Process results
    const endpointResults = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        return {
          name: endpoints[index].name,
          error: result.reason?.message || "Unknown error",
          available: false,
        }
      }
    })

    // Determine overall availability
    const anyAvailable = endpointResults.some((result) => result.available)

    return NextResponse.json({
      available: anyAvailable,
      message: anyAvailable ? "EA API is available" : "EA API is currently unavailable",
      endpoints: endpointResults,
      timestamp: new Date().toISOString(),
    })
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
