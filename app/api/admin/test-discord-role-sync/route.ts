import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`=== Testing Discord role sync for user: ${userId} ===`)

    const supabase = createAdminClient()

    // Get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("gamer_tag_id, email")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get Discord connection
    const { data: discordUser, error: discordError } = await supabase
      .from("discord_users")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (discordError || !discordUser) {
      return NextResponse.json({
        error: "No Discord connection found",
        user: {
          gamer_tag: user.gamer_tag_id,
          email: user.email,
        },
      })
    }

    // Get player info
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select(`
        team_id,
        teams (
          id,
          name,
          discord_role_id
        )
      `)
      .eq("user_id", userId)
      .single()

    // Test the Discord role sync
    const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    const roleResult = await roleResponse.json()

    return NextResponse.json({
      success: true,
      test_results: {
        user: {
          id: userId,
          gamer_tag: user.gamer_tag_id,
          email: user.email,
        },
        discord: {
          id: discordUser.discord_id,
          username: discordUser.discord_username,
          discriminator: discordUser.discord_discriminator,
        },
        player: {
          team_id: player?.team_id,
          team_name: player?.teams?.name,
          team_discord_role_id: player?.teams?.discord_role_id,
        },
        role_sync_result: roleResult,
      },
    })
  } catch (error: any) {
    console.error("Error testing Discord role sync:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
