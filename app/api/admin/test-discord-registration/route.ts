import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Verify user exists and has Discord ID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("discord_id, gamer_tag_id")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.discord_id) {
      return NextResponse.json({ error: "User has no Discord ID" }, { status: 400 })
    }

    console.log(`Testing Discord role assignment for user ${userId} (${user.gamer_tag_id})`)

    // Call the role assignment endpoint
    const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    const roleData = await roleResponse.json()

    return NextResponse.json({
      success: roleResponse.ok,
      status: roleResponse.status,
      user: {
        id: userId,
        gamertag: user.gamer_tag_id,
        discordId: user.discord_id,
      },
      roleAssignmentResult: roleData,
    })
  } catch (error: any) {
    console.error("Test Discord registration error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
