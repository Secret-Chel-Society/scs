import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    console.log(`Proxying request to: ${url}`)

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    // Check for rate limiting
    if (response.status === 429) {
      console.error("Rate limited by EA API")
      return NextResponse.json(
        {
          error: "Rate limited by EA API",
          message: "Too many requests to EA API. Please try again later.",
        },
        { status: 429 },
      )
    }

    if (!response.ok) {
      console.error(`Proxy request failed: ${response.status} ${response.statusText}`)

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
      console.error(`Received non-JSON response: ${text.substring(0, 100)}...`)

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
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Proxy error:", error.message || error)
    return NextResponse.json(
      {
        error: error.message || "Proxy request failed",
        message: "There was an error connecting to the EA Sports API through the proxy.",
      },
      { status: 500 },
    )
  }
}
