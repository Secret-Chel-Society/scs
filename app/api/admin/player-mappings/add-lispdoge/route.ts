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

    // Create the specific mapping for DarkWolf
    const { data: existingMapping } = await supabase
      .from("ea_player_mappings")
      .select("*")
      .eq("ea_player_id", "1005699228134")
      .single()

    if (existingMapping) {
      // Update existing mapping
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .update({
          player_id: "657dbb12-0db5-4a8b-94da-7dea7eba7409",
          player_name: "DarkWolf",
        })
        .eq("ea_player_id", "1005699228134")
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true, data, updated: true })
    } else {
      // Create new mapping
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .insert({
          ea_player_id: "1005699228134",
          player_id: "657dbb12-0db5-4a8b-94da-7dea7eba7409",
          player_name: "DarkWolf",
        })
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true, data, created: true })
    }
  } catch (error: any) {
    console.error("Error setting up DarkWolf mapping:", error)
    return NextResponse.json({ error: error.message || "Failed to set up DarkWolf mapping" }, { status: 500 })
  }
}
