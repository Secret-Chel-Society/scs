import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verify admin status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get mapping data from request
    const { ea_player_id, player_id, player_name } = await request.json()

    if (!ea_player_id || !player_id) {
      return NextResponse.json({ error: "EA player ID and MGHL player ID are required" }, { status: 400 })
    }

    // Check if mapping already exists
    const { data: existingMapping } = await supabase
      .from("ea_player_mappings")
      .select("*")
      .eq("ea_player_id", ea_player_id)
      .single()

    if (existingMapping) {
      // Update existing mapping
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .update({ player_id, player_name })
        .eq("ea_player_id", ea_player_id)
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true, data, updated: true })
    } else {
      // Create new mapping
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .insert({ ea_player_id, player_id, player_name })
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true, data, created: true })
    }
  } catch (error: any) {
    console.error("Error managing player mapping:", error)
    return NextResponse.json({ error: error.message || "Failed to manage player mapping" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Allow filtering by ea_player_id or player_id
    const eaPlayerId = searchParams.get("ea_player_id")
    const playerId = searchParams.get("player_id")

    let query = supabase.from("ea_player_mappings").select("*")

    if (eaPlayerId) {
      query = query.eq("ea_player_id", eaPlayerId)
    }

    if (playerId) {
      query = query.eq("player_id", playerId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error fetching player mappings:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch player mappings" }, { status: 500 })
  }
}
