import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clubId = searchParams.get("clubId")

    if (!clubId) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 })
    }

    // Call EA API to get team stats
    const response = await fetch(
      `https://proclubs.ea.com/api/nhl/members/stats?platform=common-gen5&clubId=${clubId}`,
      {
        headers: {
          "User-Agent": "MGHL-Website/1.0",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`EA API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error getting EA team stats:", error)
    return NextResponse.json({ error: error.message || "Failed to get EA team stats" }, { status: 500 })
  }
}
