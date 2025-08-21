import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { userId, discordInfo } = await request.json()

    if (!userId || !discordInfo) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    console.log("Connecting Discord for registered user:", userId, discordInfo)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if Discord ID is already in use
    const { data: existingDiscordUser } = await supabase
      .from("discord_users")
      .select("user_id")
      .eq("discord_id", discordInfo.id)
      .single()

    if (existingDiscordUser && existingDiscordUser.user_id !== userId) {
      return NextResponse.json({ error: "Discord account already connected to another user" }, { status: 400 })
    }

    // Save Discord connection
    const { error: discordError } = await supabase.from("discord_users").upsert(
      {
        user_id: userId,
        discord_id: discordInfo.id,
        discord_username: discordInfo.username,
        discord_discriminator: discordInfo.discriminator || "0000",
        discord_avatar: discordInfo.avatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (discordError) {
      console.error("Error saving Discord connection:", discordError)
      return NextResponse.json({ error: "Failed to save Discord connection" }, { status: 500 })
    }

    console.log("Discord connection saved, now assigning roles...")

    // Assign Discord roles
    try {
      const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (roleResponse.ok) {
        const roleData = await roleResponse.json()
        console.log("Discord roles assigned successfully:", roleData)

        return NextResponse.json({
          success: true,
          message: "Discord connected and roles assigned",
          rolesAssigned: roleData.assignedRoles || [],
        })
      } else {
        console.error("Failed to assign Discord roles:", await roleResponse.text())
        return NextResponse.json({
          success: true,
          message: "Discord connected but role assignment failed",
          warning: "Roles may need to be assigned manually",
        })
      }
    } catch (roleError) {
      console.error("Error assigning Discord roles:", roleError)
      return NextResponse.json({
        success: true,
        message: "Discord connected but role assignment failed",
        warning: "Roles may need to be assigned manually",
      })
    }
  } catch (error: any) {
    console.error("Error connecting Discord during registration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

