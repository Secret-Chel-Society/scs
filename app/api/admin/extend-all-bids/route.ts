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
    // Set expiration time to 300 seconds (5 minutes) from now
    const expirationTime = new Date(Date.now() + 300 * 1000).toISOString()

    // Extend all active bids
    const { error } = await supabase
      .from("player_bidding")
      .update({
        bid_expires_at: expirationTime,
      })
      .gt("bid_expires_at", new Date().toISOString())

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
