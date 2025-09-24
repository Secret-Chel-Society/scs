import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { bidId } = await request.json()

    if (!bidId) {
      return NextResponse.json({ error: "Missing bid ID" }, { status: 400 })
    }

    // Get the bid to check if it belongs to the user's team
    const { data: player } = await supabase.from("players").select("team_id").eq("user_id", session.user.id).single()

    if (!player?.team_id) {
      return NextResponse.json({ error: "User is not on a team" }, { status: 403 })
    }

    const { data: bid, error: bidError } = await supabase
      .from("player_bidding")
      .select("team_id")
      .eq("id", bidId)
      .single()

    if (bidError) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    if (bid.team_id !== player.team_id) {
      return NextResponse.json({ error: "Cannot extend a bid from another team" }, { status: 403 })
    }

    // Set expiration time to 4 hours from now
    const expirationTime = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()

    // Extend the bid
    const { error } = await supabase
      .from("player_bidding")
      .update({
        bid_expires_at: expirationTime,
      })
      .eq("id", bidId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
