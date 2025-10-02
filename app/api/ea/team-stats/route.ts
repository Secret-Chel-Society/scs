import { type NextRequest, NextResponse } from "next/server"
import { fetchEAJson } from "@/lib/ea-api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clubId = searchParams.get("clubId")

    if (!clubId) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 })
    }

    const url = `https://proclubs.ea.com/api/nhl/members/stats?platform=common-gen5&clubId=${clubId}`
    const data = await fetchEAJson(url)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error getting EA team stats:", error)
    return NextResponse.json({ error: error.message || "Failed to get EA team stats" }, { status: 500 })
  }
}
