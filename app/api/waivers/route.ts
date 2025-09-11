import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No or invalid authorization header")
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "")
    
    if (!token) {
      console.error("No token found in authorization header")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Create Supabase client with the token
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {},
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Validate token
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user from token:", userError)
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 })
    }

    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 })
    }

    // Get the player and verify they exist
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select(`
        id,
        user_id,
        team_id,
        salary,
        role,
        status,
        teams:team_id (
          id,
          name
        )
      `)
      .eq("id", playerId)
      .single()

    if (playerError || !player) {
      console.error("Error fetching player:", playerError)
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Check if player is already on a team
    if (!player.team_id) {
      return NextResponse.json({ error: "Player is not on a team" }, { status: 400 })
    }

    // Verify the user has permission to waive this player
    // They must be a team manager (Owner, GM, or AGM) of the player's current team
    const { data: userPlayer, error: userPlayerError } = await supabase
      .from("players")
      .select("id, role, team_id")
      .eq("user_id", user.id)
      .eq("team_id", player.team_id)
      .in("role", ["Owner", "GM", "AGM"])
      .single()

    if (userPlayerError || !userPlayer) {
      console.error("User permission check failed:", userPlayerError)
      return NextResponse.json({ 
        error: "You don't have permission to waive this player. Only team managers can waive players." 
      }, { status: 403 })
    }

    // Check if player is already on waivers
    const { data: existingWaiver, error: waiverCheckError } = await supabase
      .from("waivers")
      .select("id, status")
      .eq("player_id", playerId)
      .eq("status", "active")
      .single()

    if (waiverCheckError && waiverCheckError.code !== "PGRST116") {
      console.error("Error checking existing waivers:", waiverCheckError)
      return NextResponse.json({ error: "Error checking existing waivers" }, { status: 500 })
    }

    if (existingWaiver) {
      return NextResponse.json({ error: "Player is already on waivers" }, { status: 400 })
    }

    // Calculate claim deadline (8 hours from now)
    const claimDeadline = new Date()
    claimDeadline.setHours(claimDeadline.getHours() + 8)

    // Create the waiver record
    const { data: waiver, error: waiverError } = await supabase
      .from("waivers")
      .insert({
        player_id: playerId,
        waiving_team_id: player.team_id,
        claim_deadline: claimDeadline.toISOString(),
        status: "active"
      })
      .select()
      .single()

    if (waiverError) {
      console.error("Error creating waiver:", waiverError)
      return NextResponse.json({ error: "Failed to create waiver" }, { status: 500 })
    }

    // Update player status to indicate they're on waivers
    const { error: updateError } = await supabase
      .from("players")
      .update({
        status: "on_waivers"
      })
      .eq("id", playerId)

    if (updateError) {
      console.error("Error updating player status:", updateError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      message: "Player successfully placed on waivers",
      waiver: {
        id: waiver.id,
        player_id: playerId,
        waiving_team: player.teams,
        claim_deadline: waiver.claim_deadline,
        status: waiver.status
      }
    })

  } catch (error: any) {
    console.error("Error in waivers POST:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // [Previous GET handler implementation...]
    return NextResponse.json({ waivers: [] })
  } catch (error: any) {
    console.error("Error in waivers GET:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}