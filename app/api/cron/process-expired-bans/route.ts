import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Processing expired bans...")

    const now = new Date().toISOString()

    // Find users with expired bans
    const { data: expiredBans, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, ban_expiration")
      .eq("is_banned", true)
      .not("ban_expiration", "is", null)
      .lt("ban_expiration", now)

    if (fetchError) {
      console.error("Error fetching expired bans:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!expiredBans || expiredBans.length === 0) {
      console.log("No expired bans found")
      return NextResponse.json({ message: "No expired bans found", processed: 0 })
    }

    console.log(`Found ${expiredBans.length} expired bans to process`)

    // Unban expired users
    const userIds = expiredBans.map((user) => user.id)

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        is_banned: false,
        ban_reason: null,
        ban_expiration: null,
      })
      .in("id", userIds)

    if (updateError) {
      console.error("Error unbanning expired users:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`Successfully processed ${expiredBans.length} expired bans`)

    return NextResponse.json({
      message: "Expired bans processed successfully",
      processed: expiredBans.length,
      unbannedUsers: expiredBans.map((user) => ({ id: user.id, email: user.email })),
    })
  } catch (error: any) {
    console.error("Unexpected error processing expired bans:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
