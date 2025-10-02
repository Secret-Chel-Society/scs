import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get("matchId")
    const homeClubId = searchParams.get("homeClubId") || ""
    const awayClubId = searchParams.get("awayClubId") || ""
    const platform = searchParams.get("platform") || "common-gen5"
    const matchType = searchParams.get("matchType") || "club_private"

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    console.log(`Fetching details for match ${matchId}`)
    console.log(`Home club ID: ${homeClubId}, Away club ID: ${awayClubId}`)

    // Check if this is a combined match ID (starts with "combined-")
    if (matchId.startsWith("combined-")) {
      console.log("This is a combined match ID, extracting individual match IDs")
      const individualMatchIds = matchId.replace("combined-", "").split("-")
      console.log(`Found ${individualMatchIds.length} individual match IDs:`, individualMatchIds)

      // Fetch each individual match from club matches
      const matchPromises = individualMatchIds.map(async (id) => {
        try {
          // Try to find the match in club matches
          const matchData = await fetchMatchFromClubMatches(id, homeClubId, awayClubId, platform, matchType)
          return matchData
        } catch (err) {
          console.error(`Error fetching match ${id}:`, err)
          return null
        }
      })

      // Wait for all matches to be fetched
      const matches = await Promise.all(matchPromises)
      const validMatches = matches.filter(Boolean)

      if (validMatches.length === 0) {
        return NextResponse.json(
          {
            error: "Failed to fetch any of the individual matches",
            message: "Could not find match data for any of the individual matches.",
            matchId,
            individualMatchIds,
          },
          { status: 404 },
        )
      }

      // Import the combiner function
      const { combineEaMatches } = await import("@/lib/ea-match-combiner")

      // Combine the matches
      const combinedMatch = combineEaMatches(validMatches)

      if (!combinedMatch) {
        return NextResponse.json(
          {
            error: "Failed to combine matches",
            message: "Could not combine the individual matches.",
            matchId,
            individualMatchIds,
          },
          { status: 500 },
        )
      }

      return NextResponse.json(combinedMatch)
    }

    // For single match, try to find it in club matches
    try {
      const matchData = await fetchMatchFromClubMatches(matchId, homeClubId, awayClubId, platform, matchType)
      return NextResponse.json(matchData)
    } catch (error: any) {
      console.error("Error fetching match from club matches:", error)
      return NextResponse.json(
        {
          error: error.message,
          message: `Match ID ${matchId} could not be found in the EA Sports database. Please verify the match ID is correct and try again.`,
          matchId,
          homeClubId,
          awayClubId,
        },
        { status: 404 },
      )
    }
  } catch (error: any) {
    console.error("Error in match-details route:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch match details",
        message: "There was an error connecting to the EA Sports API. Please try again later.",
      },
      { status: 500 },
    )
  }
}

// Helper function to fetch a match from club matches using ScraperAPI
async function fetchMatchFromClubMatches(
  matchId: string,
  homeClubId: string,
  awayClubId: string,
  platform: string,
  matchType: string,
): Promise<any> {
  // We need at least one club ID to fetch matches
  if (!homeClubId && !awayClubId) {
    throw new Error("At least one club ID is required to fetch matches")
  }

  const scraperApiKey = process.env.SCRAPER_API_KEY

  if (!scraperApiKey) {
    throw new Error("ScraperAPI key is not configured")
  }

  // Try home club first if available
  if (homeClubId) {
    try {
      console.log(`Fetching matches for home club ${homeClubId} via ScraperAPI`)
      const eaApiUrl = `https://proclubs.ea.com/api/nhl/clubs/matches?matchType=${matchType}&platform=${platform}&clubIds=${homeClubId}`
      const scraperApiUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(eaApiUrl)}`

      console.log(`[v0] Fetching from ScraperAPI: ${eaApiUrl}`)

      const response = await fetch(scraperApiUrl, {
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        console.log(`Failed to fetch home club matches via ScraperAPI: ${response.status}`)
        throw new Error(`Failed to fetch home club matches: ${response.statusText}`)
      }

      const matches = await response.json()
      console.log(`Found ${matches.length} matches for home club`)

      // Find the specific match by ID
      const match = matches.find((m: any) => m.matchId === matchId)
      if (match) {
        console.log(`Found match ${matchId} in home club matches`)
        return match
      }

      console.log(`Match ${matchId} not found in home club matches`)
    } catch (error) {
      console.error("Error fetching home club matches:", error)
    }
  }

  // Try away club if available and different from home club
  if (awayClubId && awayClubId !== homeClubId) {
    try {
      console.log(`Fetching matches for away club ${awayClubId} via ScraperAPI`)
      const eaApiUrl = `https://proclubs.ea.com/api/nhl/clubs/matches?matchType=${matchType}&platform=${platform}&clubIds=${awayClubId}`
      const scraperApiUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(eaApiUrl)}`

      console.log(`[v0] Fetching from ScraperAPI: ${eaApiUrl}`)

      const response = await fetch(scraperApiUrl, {
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        console.log(`Failed to fetch away club matches via ScraperAPI: ${response.status}`)
        throw new Error(`Failed to fetch away club matches: ${response.statusText}`)
      }

      const matches = await response.json()
      console.log(`Found ${matches.length} matches for away club`)

      // Find the specific match by ID
      const match = matches.find((m: any) => m.matchId === matchId)
      if (match) {
        console.log(`Found match ${matchId} in away club matches`)
        return match
      }

      console.log(`Match ${matchId} not found in away club matches`)
    } catch (error) {
      console.error("Error fetching away club matches:", error)
    }
  }

  // If we get here, we couldn't find the match in either club's matches
  throw new Error(`Match ID ${matchId} not found in club matches`)
}
