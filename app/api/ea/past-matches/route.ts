import { type NextRequest, NextResponse } from "next/server"
import { fetchEAJson } from "@/lib/ea-api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const homeClubId = searchParams.get("homeClubId")
    const awayClubId = searchParams.get("awayClubId")
    const clubId = searchParams.get("clubId") // For backward compatibility
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10) // Default limit
    const platform = searchParams.get("platform") || "common-gen5"
    const matchType = searchParams.get("matchType") || "club_private"

    // Validate that we have at least one club ID
    if (!homeClubId && !awayClubId && !clubId) {
      return NextResponse.json({ error: "At least one club ID is required" }, { status: 400 })
    }

    // Use the provided club IDs or fall back to the single clubId
    const homeId = homeClubId || clubId || ""
    const awayId = awayClubId || ""

    console.log(`Fetching matches for home club ID: ${homeId}, away club ID: ${awayId}`)

    // Calculate date for two weeks ago (increased from one week)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksAgoTimestamp = Math.floor(twoWeeksAgo.getTime() / 1000)

    // Create a set to track processed match IDs to avoid duplicates
    const processedMatchIds = new Set<string>()
    const allMatches: any[] = []

    // Helper function to safely check club IDs
    const matchInvolvesClub = (match: any, targetClubId: string) => {
      if (!match || !match.clubs) return false

      // Convert the target ID to string for consistent comparison
      const targetId = String(targetClubId)

      // Check in the clubs object directly (keys are club IDs)
      if (Object.keys(match.clubs).includes(targetId)) {
        return true
      }

      // Also check clubId property of each club object as a fallback
      return Object.values(match.clubs).some((club: any) => {
        return (
          String(club.clubId) === targetId ||
          String(club.id) === targetId ||
          (club.details && String(club.details.clubId) === targetId)
        )
      })
    }

    // Function to fetch matches with retry and proxy fallback
    const fetchMatchesWithRetry = async (clubId: string, isHome: boolean) => {
      let matches: any[] = []
      let retryCount = 0
      const maxRetries = 3
      let lastError: Error | null = null

      while (retryCount < maxRetries && matches.length === 0) {
        try {
          console.log(`Fetching matches for ${isHome ? "home" : "away"} club ID ${clubId} (attempt ${retryCount + 1})`)

          const endpoint = `https://proclubs.ea.com/api/nhl/clubs/matches?matchType=${matchType}&platform=${platform}&clubIds=${clubId}`
          const data = await fetchEAJson(endpoint)

          console.log(
            `Got ${Array.isArray(data) ? data.length : "unknown"} matches for ${isHome ? "home" : "away"} club ID ${clubId}`,
          )

          if (Array.isArray(data) && data.length > 0) {
            matches = data
            console.log(`First match for debugging:`, JSON.stringify(data[0].clubs).substring(0, 500))

            // Process matches based on whether we're looking for matches against another club
            const otherClubId = isHome ? awayId : homeId

            if (otherClubId) {
              // Filter for matches against the other club
              for (const match of matches) {
                if (
                  match.timestamp >= twoWeeksAgoTimestamp &&
                  matchInvolvesClub(match, otherClubId) &&
                  !processedMatchIds.has(match.matchId)
                ) {
                  console.log(`Found match ${match.matchId} involving both clubs`)
                  processedMatchIds.add(match.matchId)
                  allMatches.push(match)
                }
              }
            } else {
              // Include all recent matches for this club
              for (const match of matches) {
                if (match.timestamp >= twoWeeksAgoTimestamp && !processedMatchIds.has(match.matchId)) {
                  processedMatchIds.add(match.matchId)
                  allMatches.push(match)
                }
              }
            }
          }
          break // Exit the retry loop if successful
        } catch (error: any) {
          lastError = error
          console.error(
            `Error fetching matches for ${isHome ? "home" : "away"} club ID ${clubId} (attempt ${retryCount + 1}):`,
            error.message || error,
          )
          retryCount++

          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            const backoffTime = 1000 * Math.pow(2, retryCount)
            console.log(`Waiting ${backoffTime}ms before retry ${retryCount + 1}`)
            await new Promise((resolve) => setTimeout(resolve, backoffTime))
          }
        }
      }

      // If we've exhausted all retries and still have an error, throw it
      if (matches.length === 0 && lastError) {
        throw lastError
      }

      return matches
    }

    // Fetch matches for the home club
    if (homeId) {
      try {
        await fetchMatchesWithRetry(homeId, true)
      } catch (error: any) {
        console.error(`Failed to fetch matches for home club ${homeId}:`, error.message || error)
        // Continue to try the away club even if home club fails
      }
    }

    // Fetch matches for the away club if different from home club
    if (awayId && awayId !== homeId) {
      try {
        await fetchMatchesWithRetry(awayId, false)
      } catch (error: any) {
        console.error(`Failed to fetch matches for away club ${awayId}:`, error.message || error)
        // Continue with any matches we might have from the home club
      }
    }

    // If we couldn't fetch any matches, try the fallback endpoint
    if (allMatches.length === 0) {
      try {
        console.log("Using fallback endpoint to fetch matches")
        const fallbackEndpoint = `https://proclubs.ea.com/api/nhl/clubs/matches?platform=${platform}&matchType=${matchType}`

        // Add club IDs if available
        const clubParams = []
        if (homeId) clubParams.push(`clubIds=${homeId}`)
        if (awayId && awayId !== homeId) clubParams.push(`clubIds=${awayId}`)

        const fullFallbackUrl = `${fallbackEndpoint}${clubParams.length ? "&" + clubParams.join("&") : ""}`
        console.log(`Fallback URL: ${fullFallbackUrl}`)

        const matches = await fetchEAJson(fullFallbackUrl)
        console.log(`Fallback endpoint returned ${Array.isArray(matches) ? matches.length : "unknown"} matches`)

        if (Array.isArray(matches) && matches.length > 0) {
          // Process matches based on the available club IDs
          for (const match of matches) {
            if (match.timestamp >= twoWeeksAgoTimestamp && !processedMatchIds.has(match.matchId)) {
              // If we have both home and away IDs, check if the match involves both
              if (homeId && awayId) {
                if (matchInvolvesClub(match, homeId) && matchInvolvesClub(match, awayId)) {
                  processedMatchIds.add(match.matchId)
                  allMatches.push(match)
                }
              }
              // If we only have one ID, check if the match involves that club
              else if (homeId || awayId) {
                const targetId = homeId || awayId
                if (matchInvolvesClub(match, targetId!)) {
                  processedMatchIds.add(match.matchId)
                  allMatches.push(match)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error using fallback endpoint:", error)
      }
    }

    // Sort matches by timestamp (most recent first) and limit the results
    const sortedMatches = allMatches.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)

    console.log(`Returning ${sortedMatches.length} matches after filtering and sorting`)

    // If we still have no matches, return a more helpful empty array with a message
    if (sortedMatches.length === 0) {
      return NextResponse.json({
        matches: [],
        message: "No matches found for the specified club IDs in the last two weeks.",
        clubIds: { home: homeId, away: awayId },
        status: "no_matches",
      })
    }

    return NextResponse.json(sortedMatches)
  } catch (error: any) {
    console.error("Error fetching past matches:", error.message || error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch past matches",
        message: "There was an error connecting to the EA Sports API. Please try again later.",
        status: "api_error",
      },
      { status: 500 },
    )
  }
}
