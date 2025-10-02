import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Checking EA API status")

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
        url: "https://proclubs.ea.com/api/nhl/match/details?matchType=club_private&platform=common-gen5&matchId=1",
      },
    ]

    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)

          const response = await fetch(endpoint.url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
              "Accept": "application/json, text/javascript, */*; q=0.01",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": "https://www.ea.com/",
              "Origin": "https://www.ea.com",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
              "Connection": "keep-alive",
              "Sec-Fetch-Dest": "empty",
              "Sec-Fetch-Mode": "cors",
              "Sec-Fetch-Site": "cross-site",
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          const contentType = response.headers.get("content-type") || ""
          let preview = ""
          if (!contentType.includes("application/json")) {
            preview = (await response.text()).substring(0, 200)
          }

          return {
            name: endpoint.name,
            status: response.status,
            ok: response.ok,
            available: true,
            contentType,
            preview,
          }
        } catch (error: any) {
          console.error(`Error checking endpoint ${endpoint.name}:`, error)
          return {
            name: endpoint.name,
            error: error.message,
            available: false,
          }
        }
      })
    )

    const endpointResults = results.map((result, index) =>
      result.status === "fulfilled"
        ? result.value
        : {
            name: endpoints[index].name,
            error: result.reason?.message || "Unknown error",
            available: false,
          }
    )

    const anyAvailable = endpointResults.some((r) => r.available)

    return NextResponse.json({
      available: anyAvailable,
      message: anyAvailable ? "EA API is responding" : "EA API is currently unreachable",
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

