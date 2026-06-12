import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()

    // Fetch all banned users by paginating through results (Supabase has 1000 row default limit)
    const PAGE_SIZE = 1000
    let allBannedUsers: any[] = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data: bannedUsers, error } = await supabase
        .from("users")
        .select("id, email, gamer_tag, gamer_tag_id, discord_name, ban_reason, ban_expiration, created_at")
        .not("ban_reason", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Error fetching banned users:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (bannedUsers && bannedUsers.length > 0) {
        allBannedUsers = [...allBannedUsers, ...bannedUsers]
        hasMore = bannedUsers.length === PAGE_SIZE
        page++
      } else {
        hasMore = false
      }
    }

    console.log("Found banned users:", allBannedUsers.length)
    return NextResponse.json({ users: allBannedUsers })
  } catch (error: any) {
    console.error("Error in banned-users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
