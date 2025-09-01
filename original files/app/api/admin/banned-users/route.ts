import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()

    // Get banned users using admin client (no auth needed since we're using service role)
    const { data: bannedUsers, error } = await supabase
      .from("users")
      .select("id, email, gamer_tag, gamer_tag_id, discord_name, ban_reason, ban_expiration, created_at")
      .not("ban_reason", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching banned users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Found banned users:", bannedUsers?.length || 0) // Debug log
    return NextResponse.json({ users: bannedUsers || [] })
  } catch (error: any) {
    console.error("Error in banned-users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
