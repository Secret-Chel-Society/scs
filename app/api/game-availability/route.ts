import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")
    const userId = searchParams.get("userId")
    const teamId = searchParams.get("teamId")

    if (!matchId || !userId || !teamId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get the player record first
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Get availability record
    const { data, error } = await supabase
      .from("game_availability")
      .select("*")
      .eq("match_id", matchId)
      .eq("player_id", player.id)

    if (error) {
      console.error("Error fetching game availability:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Game availability GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { match_id, player_id, user_id, team_id, status } = body

    if (!match_id || !player_id || !user_id || !team_id || !status) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: { match_id, player_id, user_id, team_id, status },
        },
        { status: 400 },
      )
    }

    if (!["available", "unavailable", "injury_reserve"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify the player exists and belongs to the team
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id")
      .eq("id", player_id)
      .eq("user_id", user_id)
      .eq("team_id", team_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player verification failed" }, { status: 403 })
    }

    // Upsert the availability record
    const { data, error } = await supabase
      .from("game_availability")
      .upsert(
        {
          match_id,
          player_id,
          user_id,
          team_id,
          status,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "match_id,player_id",
        },
      )
      .select()

    if (error) {
      console.error("Error saving game availability:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error("Game availability POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
