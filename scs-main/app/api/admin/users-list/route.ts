import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "25")
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    // Get total count
    const { count, error: countError } = await supabase.from("users").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error counting users:", countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Get users with pagination
    const { data: users, error } = await supabase
      .from("users")
      .select("id, gamer_tag_id, discord_name, ban_reason, ban_expiration")
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add is_banned flag based on ban_reason
    const usersWithBanStatus =
      users?.map((user) => ({
        ...user,
        is_banned: !!user.ban_reason,
      })) || []

    return NextResponse.json({
      users: usersWithBanStatus,
      total: count || 0,
      page,
      limit,
    })
  } catch (error: any) {
    console.error("Error in users-list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
