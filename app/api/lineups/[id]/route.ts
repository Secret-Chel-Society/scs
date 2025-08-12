import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const lineupId = params.id

  if (!lineupId) {
    return NextResponse.json({ error: "Lineup ID is required" }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  // Verify user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the lineup to check team ownership
  const { data: lineup, error: lineupError } = await supabase
    .from("lineups")
    .select("team_id")
    .eq("id", lineupId)
    .single()

  if (lineupError || !lineup) {
    return NextResponse.json({ error: "Lineup not found" }, { status: 404 })
  }

  // Check if user is authorized to manage this team
  const { data: playerData, error: playerError } = await supabase
    .from("players")
    .select("id, role")
    .eq("team_id", lineup.team_id)
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

  // Delete the lineup entry
  const { error: deleteError } = await supabase.from("lineups").delete().eq("id", lineupId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
