import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`Manual user creation requested for: ${email}`)

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Find the user in auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`)
    }

    const authUser = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (!authUser) {
      return NextResponse.json({ error: "User not found in auth" }, { status: 404 })
    }

    if (!authUser.email_confirmed_at) {
      return NextResponse.json({ error: "User email not confirmed" }, { status: 400 })
    }

    // Check if user already exists in database
    const { data: existingUser } = await supabaseAdmin.from("users").select("*").eq("id", authUser.id).single()

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "User already exists in database",
        user: existingUser,
      })
    }

    // Create the user profile
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
      id: authUser.id,
      email: authUser.email,
      gamer_tag_id: metadata.gamer_tag_id || authUser.email?.split("@")[0] || "Unknown",
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
      user_id: authUser.id,
      role: "Player",
      salary: 0,
    })

    if (playerError) {
      throw new Error(`Failed to create player: ${playerError.message}`)
    }

    // Create user role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authUser.id,
      role: "Player",
    })

    if (roleError) {
      throw new Error(`Failed to create role: ${roleError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "User profile created successfully",
      userId: authUser.id,
      email: authUser.email,
    })
  } catch (error) {
    console.error("Manual user creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
