import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    const scraperApiKey = process.env.SCRAPER_API_KEY

    if (!scraperApiKey) {
      console.error("SCRAPER_API_KEY environment variable is not set")
      return NextResponse.json({ error: "ScraperAPI is not configured" }, { status: 500 })
    }

    // Build ScraperAPI URL with the target URL encoded
    const scraperApiUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`

    console.log(`[v0] Original EA API URL: ${url}`)
    console.log(`[v0] Encoded URL parameter: ${encodeURIComponent(url)}`)
    console.log(`[v0] Full ScraperAPI URL: ${scraperApiUrl.replace(scraperApiKey, "API_KEY_HIDDEN")}`)

    const response = await fetch(scraperApiUrl, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    console.log(`[v0] ScraperAPI response status: ${response.status} ${response.statusText}`)

    // Check for rate limiting
    if (response.status === 429) {
      console.error("[v0] Rate limited by ScraperAPI or EA API")
      return NextResponse.json(
        {
          error: "Rate limited",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 },
      )
    }

    if (!response.ok) {
      console.error(`[v0] Proxy request failed: ${response.status} ${response.statusText}`)

      // Try to get the response text for better error reporting
      let errorText
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = "Could not read error response"
      }

      return NextResponse.json(
        {
          error: `Proxy request failed: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 500),
        },
        { status: response.status },
      )
    }

    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      // Try to get the response text for better error reporting
      const text = await response.text()
      console.error(`[v0] Received non-JSON response: ${text.substring(0, 100)}...`)

      return NextResponse.json(
        {
          error: "Expected JSON response but got non-JSON content",
          contentType: contentType || "unknown",
          preview: text.substring(0, 500),
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log(`[v0] Successfully fetched data through ScraperAPI`)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Proxy error:", error.message || error)
    return NextResponse.json(
      {
        error: error.message || "Proxy request failed",
        message: "There was an error connecting to the EA Sports API through ScraperAPI.",
      },
      { status: 500 },
    )
  }
}
