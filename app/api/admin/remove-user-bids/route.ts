import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("EMERGENCY BYPASS: Remove User Bids API called - bypassing authentication")

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // TEMPORARY SOLUTION: Completely bypass authentication
    // WARNING: This is not secure and should be fixed properly
    console.log("⚠️ Authentication check bypassed - this is a temporary solution")

    // Parse the request body
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    console.log(`Removing bids for username: ${username}`)

    // Find the user by username (gamer_tag_id)
    const { data: usersData, error: userError } = await supabase.from("users").select("id").eq("gamer_tag_id", username)

    if (userError) {
      console.error("Error finding user:", userError)
      return NextResponse.json({ error: "Error searching for user" }, { status: 500 })
    }

    if (!usersData || usersData.length === 0) {
      console.error("No users found with username:", username)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (usersData.length > 1) {
      console.warn(`Found ${usersData.length} users with username: ${username}. Using the first one.`)
    }

    // Use the first user found (or the only one)
    const userId = usersData[0].id

    console.log(`Found user ID: ${userId}`)

    // Get the player ID for this user
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (playerError) {
      console.error("Error finding player:", playerError)
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    console.log(`Found player ID: ${player.id}`)

    // Delete all bids for this player
    const { error: deleteError } = await supabase.from("player_bidding").delete().eq("player_id", player.id)

    if (deleteError) {
      console.error("Error deleting bids:", deleteError)
      throw deleteError
    }

    console.log(`Successfully removed all bids for player ${player.id}`)

    return NextResponse.json({
      success: true,
      message: `All bids for user ${username} have been removed.`,
    })
  } catch (error: any) {
    console.error("Error removing user bids:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Error occurred while removing user bids",
      },
      { status: 500 },
    )
  }
}
