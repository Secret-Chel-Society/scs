import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is an admin
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("role")
    .eq("user_id", session.user.id)
    .single()

  if (playerError || player.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { playerId, teamId, bidAmount } = await request.json()

    if (!playerId || !teamId || !bidAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Set expiration time to 300 seconds (5 minutes) from now
    const expirationTime = new Date(Date.now() + 300 * 1000).toISOString()

    // Create bid
    const { data, error } = await supabase
      .from("player_bidding")
      .insert({
        player_id: playerId,
        team_id: teamId,
        bid_amount: bidAmount,
        bid_expires_at: expirationTime,
      })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
