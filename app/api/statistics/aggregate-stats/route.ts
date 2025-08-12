import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId")

    // Log the received season ID
    console.log("Received seasonId:", seasonId)

    if (!seasonId) {
      return NextResponse.json({ error: "Missing seasonId parameter" }, { status: 400 })
    }

    const seasonNumber = Number(seasonId)
    if (isNaN(seasonNumber)) {
      return NextResponse.json({ error: "Invalid seasonId parameter" }, { status: 400 })
    }

    const cookieStore = request.headers.get("cookie") as string
    const supabase = createClient(cookieStore)

    // Fetch skaters
    const { data: skaters, error: skatersError } = await supabase
      .from("ea_player_stats")
      .select("*")
      .eq("season_id", seasonNumber)

    if (skatersError) {
      console.error("Error fetching skaters:", skatersError)
      return NextResponse.json({ error: "Error fetching skaters" }, { status: 500 })
    }

    // Log the number of skaters fetched
    console.log("Fetched", skaters.length, "skaters")

    // Fetch goalies
    const { data: goalies, error: goaliesError } = await supabase
      .from("ea_player_stats")
      .select("*")
      .eq("season_id", seasonNumber)
      .like("position", "%G%")

    if (goaliesError) {
      console.error("Error fetching goalies:", goaliesError)
      return NextResponse.json({ error: "Error fetching goalies" }, { status: 500 })
    }

    // Log the number of goalies fetched
    console.log("Fetched", goalies.length, "goalies")

    return NextResponse.json({ skaters, goalies })
  } catch (error: any) {
    console.error("Error in /api/statistics/aggregate-stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
