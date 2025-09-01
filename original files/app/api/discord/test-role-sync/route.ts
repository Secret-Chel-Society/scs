import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { playerId, newTeamId, oldTeamId } = await request.json()

    console.log("=== Testing Discord Role Sync ===")
    console.log({ playerId, newTeamId, oldTeamId })

    // Get player info
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select(`
        id,
        user_id,
        users(gamer_tag_id, email),
        team_id,
        teams(name)
      `)
      .eq("id", playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Get Discord connection
    const { data: discordUser, error: discordError } = await supabase
      .from("discord_users")
      .select("discord_id, discord_username")
      .eq("user_id", player.user_id)
      .single()

    if (discordError || !discordUser) {
      return NextResponse.json(
        {
          error: "Player has no Discord connection",
          player: {
            gamer_tag: player.users?.gamer_tag_id,
            current_team: player.teams?.name,
          },
        },
        { status: 404 },
      )
    }

    // Get team roles
    const oldTeamRole = oldTeamId
      ? await supabase.from("discord_team_roles").select("discord_role_id, role_name").eq("team_id", oldTeamId).single()
      : null

    const newTeamRole = newTeamId
      ? await supabase.from("discord_team_roles").select("discord_role_id, role_name").eq("team_id", newTeamId).single()
      : null

    return NextResponse.json({
      success: true,
      test_data: {
        player: {
          id: player.id,
          gamer_tag: player.users?.gamer_tag_id,
          current_team: player.teams?.name,
        },
        discord: {
          id: discordUser.discord_id,
          username: discordUser.discord_username,
        },
        roles: {
          old_role: oldTeamRole?.data
            ? {
                id: oldTeamRole.data.discord_role_id,
                name: oldTeamRole.data.role_name,
              }
            : null,
          new_role: newTeamRole?.data
            ? {
                id: newTeamRole.data.discord_role_id,
                name: newTeamRole.data.role_name,
              }
            : null,
        },
      },
    })
  } catch (error: any) {
    console.error("Error testing Discord role sync:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred",
      },
      { status: 500 },
    )
  }
}
