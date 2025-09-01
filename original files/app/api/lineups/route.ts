import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get("matchId")
  const teamId = searchParams.get("teamId")

  if (!matchId || !teamId) {
    return NextResponse.json({ error: "Match ID and Team ID are required" }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  // Get the lineup for this match and team
  const { data: lineupData, error: lineupError } = await supabase
    .from("lineups")
    .select(`
      id,
      position,
      line_number,
      is_starter,
      player_id,
      players (
        id,
        users (
          id,
          gamer_tag_id,
          primary_position,
          secondary_position,
          avatar_url
        )
      )
    `)
    .eq("match_id", matchId)
    .eq("team_id", teamId)
    .order("position")

  if (lineupError) {
    return NextResponse.json({ error: lineupError.message }, { status: 500 })
  }

  return NextResponse.json({ lineups: lineupData })
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Verify user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { matchId, teamId, playerId, position, lineNumber = 1, isStarter = true } = body

    if (!matchId || !teamId || !playerId || !position) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user is authorized to manage this team
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, role")
      .eq("team_id", teamId)
      .eq("user_id", session.user.id)
      .single()

    if (playerError || !playerData) {
      return NextResponse.json({ error: "You are not authorized to manage this team" }, { status: 403 })
    }

    // Check if the player's role allows lineup management
    const managerRoles = ["Owner", "GM", "AGM", "Coach"]
    if (!managerRoles.includes(playerData.role)) {
      return NextResponse.json({ error: "You do not have permission to manage lineups" }, { status: 403 })
    }

    // Check if this position is already filled
    const { data: existingPosition, error: positionError } = await supabase
      .from("lineups")
      .select("id")
      .eq("match_id", matchId)
      .eq("team_id", teamId)
      .eq("position", position)
      .eq("line_number", lineNumber)
      .maybeSingle()

    if (existingPosition) {
      return NextResponse.json({ error: `Position ${position} is already filled` }, { status: 400 })
    }

    // Add player to lineup
    const { data, error } = await supabase
      .from("lineups")
      .insert({
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        position,
        line_number: lineNumber,
        is_starter: isStarter,
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, lineup: data[0] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
