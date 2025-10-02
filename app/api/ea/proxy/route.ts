import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const rawUrl = request.nextUrl.searchParams.get("url")

    if (!rawUrl || !rawUrl.startsWith("https://proclubs.ea.com")) {
      return NextResponse.json({ error: "Invalid or missing EA API URL" }, { status: 400 })
    }

    const decodedUrl = decodeURIComponent(rawUrl)
    console.log("Proxying to EA URL:", decodedUrl)

    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(30000),
    })

    if (response.status === 429) {
      console.error("Rate limited by EA API")
      return NextResponse.json(
        { error: "Rate limited by EA API", message: "Too many requests. Please try again later." },
        { status: 429 },
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Proxy fetch failed [${response.status}]:`, errorText.substring(0, 150))
      return NextResponse.json(
        {
          error: `Proxy request failed: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 500),
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get("content-type") ?? "application/json"

    if (!contentType.includes("application/json")) {
      const text = await response.text()
      console.error("Unexpected content-type:", contentType, "Preview:", text.substring(0, 100))
      return NextResponse.json(
        {
          error: "Expected JSON but received different content",
          contentType,
          preview: text.substring(0, 500),
        },
        { status: 500 },
      )
    }

    const json = await response.json()
    return NextResponse.json(json)
  } catch (error: any) {
    console.error("Proxy error:", error.message || error)
    return NextResponse.json(
      {
        error: "Proxy request failed",
        message: error.message || "Failed to connect to EA API.",
      },
      { status: 500 },
    )
  }
}
