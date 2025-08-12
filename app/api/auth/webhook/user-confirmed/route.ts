import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("=== USER CONFIRMATION WEBHOOK TRIGGERED ===")

    const payload = await request.json()
    console.log("Webhook payload:", JSON.stringify(payload, null, 2))

    // Verify this is a user confirmation event
    if (payload.type !== "user.confirmed") {
      console.log("Not a user confirmation event, ignoring")
      return NextResponse.json({ message: "Event ignored" })
    }

    const user = payload.record
    if (!user || !user.id || !user.email) {
      console.log("Invalid user data in webhook")
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
    }

    console.log(`Processing user confirmation for: ${user.email} (${user.id})`)

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user profile automatically
    const result = await createUserProfileFromWebhook(user.id, user.email, user, supabaseAdmin)

    console.log("Webhook processing result:", result)
    console.log("=== USER CONFIRMATION WEBHOOK COMPLETED ===")

    return NextResponse.json({
      success: true,
      message: "User profile created",
      details: result,
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function createUserProfileFromWebhook(userId: string, email: string, authUser: any, supabaseAdmin: any) {
  try {
    console.log(`Creating user profile from webhook for ${email}`)

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("id", userId).single()

    if (existingUser) {
      console.log("User already exists in database")
      return { success: true, message: "User already exists" }
    }

    // Get metadata from auth user
    const metadata = authUser.user_metadata || {}

    // Validate console value
    let consoleValue = metadata.console || "Xbox"
    if (!["Xbox", "PS5"].includes(consoleValue)) {
      if (["XSX", "Xbox Series X", "XBOX", "xbox"].includes(consoleValue)) {
        consoleValue = "Xbox"
      } else if (["PlayStation 5", "PS", "PlayStation", "ps5"].includes(consoleValue)) {
        consoleValue = "PS5"
      } else {
        consoleValue = "Xbox"
      }
    }

    // Create user record
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: email,
      gamer_tag_id: metadata.gamer_tag_id || email.split("@")[0] || "Unknown",
      primary_position: metadata.primary_position || "Center",
      secondary_position: metadata.secondary_position || null,
      console: consoleValue,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`)
    }

    // Create player record
    const { error: playerError } = await supabaseAdmin.from("players").insert({
      user_id: userId,
      role: "Player",
      salary: 0,
    })

    if (playerError) {
      throw new Error(`Failed to create player: ${playerError.message}`)
    }

    // Create user role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "Player",
    })

    if (roleError) {
      throw new Error(`Failed to create role: ${roleError.message}`)
    }

    console.log(`✅ User profile created successfully for ${email}`)
    return { success: true, message: "User profile created successfully" }
  } catch (error) {
    console.error(`❌ Failed to create user profile for ${email}:`, error)
    return { success: false, error: error.message }
  }
}
