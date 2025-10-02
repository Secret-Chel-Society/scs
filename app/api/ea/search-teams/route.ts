import { type NextRequest, NextResponse } from "next/server"
import { fetchEAJson } from "@/lib/ea-api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clubName = searchParams.get("clubName")

    if (!clubName) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    const url = `https://proclubs.ea.com/api/nhl/clubs/search?platform=common-gen5&clubName=${clubName}`
    const data = await fetchEAJson(url)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error searching EA teams:", error)
    return NextResponse.json({ error: error.message || "Failed to search EA teams" }, { status: 500 })
  }
}
