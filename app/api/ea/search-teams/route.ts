import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clubName = searchParams.get("clubName")

    if (!clubName) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    // Call EA API to search for teams
    const response = await fetch(
      `https://proclubs.ea.com/api/nhl/clubs/search?platform=common-gen5&clubName=${clubName}`,
      {
        headers: {
          "User-Agent": "SCS-Website/1.0",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`EA API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error searching EA teams:", error)
    return NextResponse.json({ error: error.message || "Failed to search EA teams" }, { status: 500 })
  }
}
