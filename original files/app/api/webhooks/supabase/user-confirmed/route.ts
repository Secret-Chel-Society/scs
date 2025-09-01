import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("🔔 Supabase webhook triggered - User Confirmed")

    const payload = await request.json()
    console.log("Webhook payload:", JSON.stringify(payload, null, 2))

    // Verify webhook signature if needed (recommended for production)
    const signature = request.headers.get("x-supabase-signature")
    console.log("Webhook signature:", signature)

    // Check if this is a user confirmation event
    if (payload.type !== "INSERT" || payload.table !== "users" || !payload.record) {
      console.log("Not a user confirmation event, ignoring")
      return NextResponse.json({ message: "Event ignored" })
    }

    const authUser = payload.record
    if (!authUser.id || !authUser.email || !authUser.email_confirmed_at) {
      console.log("User not confirmed or missing data, ignoring")
      return NextResponse.json({ message: "User not confirmed" })
    }

    console.log(`📧 Processing confirmed user: ${authUser.email} (${authUser.id})`)

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user profile automatically
    await createUserProfileFromWebhook(authUser, supabaseAdmin)

    return NextResponse.json({ success: true, message: "User profile created" })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}

async function createUserProfileFromWebhook(authUser: any, supabaseAdmin: any) {
  try {
    const userId = authUser.id
    const email = authUser.email

    console.log(`🔄 Creating user profile for ${email}`)

    // Check if user already exists in public.users
    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("id", userId).single()

    if (existingUser) {
      console.log("✅ User already exists in database")
      return
    }

    // Get metadata from auth user
    const metadata = authUser.raw_user_meta_data || authUser.user_metadata || {}
    console.log("User metadata:", metadata)

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
    console.log("📝 Creating user record...")
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
    console.log("✅ User record created")

    // Create player record
    console.log("🏒 Creating player record...")
    const { error: playerError } = await supabaseAdmin.from("players").insert({
      user_id: userId,
      role: "Player",
      salary: 0,
    })

    if (playerError) {
      throw new Error(`Failed to create player: ${playerError.message}`)
    }
    console.log("✅ Player record created")

    // Create user role
    console.log("👤 Creating user role...")
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "Player",
    })

    if (roleError) {
      throw new Error(`Failed to create role: ${roleError.message}`)
    }
    console.log("✅ User role created")

    console.log(`🎉 User profile created successfully for ${email}`)
  } catch (error) {
    console.error(`❌ Failed to create user profile:`, error)
    throw error
  }
}
