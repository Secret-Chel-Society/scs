import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey, email, userData } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key provided" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!userData || !userData.gamer_tag_id || !userData.primary_position || !userData.console) {
      return NextResponse.json({ error: "User data is incomplete" }, { status: 400 })
    }

    // Normalize the email
    const normalizedEmail = email.toLowerCase().trim()

    // Create a Supabase admin client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Look up the user in auth system
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: normalizedEmail,
      },
    })

    if (listError) {
      console.error("Error listing users:", listError)
      return NextResponse.json({ error: `Auth error: ${listError.message}` }, { status: 500 })
    }

    // Find the user with the matching email
    const user = users?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)

    if (!user) {
      console.error(`User not found with email: ${normalizedEmail}`)
      return NextResponse.json({ error: "User not found in auth system" }, { status: 404 })
    }

    // Check if user already exists in public.users table
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: `Database error: ${checkError.message}` }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "User already exists in public.users table" }, { status: 400 })
    }

    // Validate console value - ensure it's either "Xbox", "PS5", or "XSX"
    let consoleValue = userData.console
    if (!["Xbox", "PS5", "XSX"].includes(consoleValue)) {
      console.log(`Invalid console value "${consoleValue}" for ${user.email}, defaulting to "Xbox"`)
      consoleValue = "Xbox"
    }

    // Create user in public.users table
    const { error: createError } = await supabaseAdmin.from("users").insert({
      id: user.id,
      email: user.email,
      gamer_tag_id: userData.gamer_tag_id,
      primary_position: userData.primary_position,
      secondary_position: userData.secondary_position || null,
      console: consoleValue,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (createError) {
      console.error("Error creating public user:", createError)
      return NextResponse.json({ error: `Failed to create user: ${createError.message}` }, { status: 500 })
    }

    // Create player record
    const { error: playerError } = await supabaseAdmin.from("players").insert({
      user_id: user.id,
      role: "Player",
      salary: 0,
    })

    if (playerError) {
      console.error("Error creating player record:", playerError)
      // Don't return an error, just log it and continue
    }

    // Add default Player role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: user.id,
      role: "Player",
    })

    if (roleError) {
      console.error("Error adding role:", roleError)
      // Don't return an error, just log it and continue
    }

    // Update user metadata in auth system
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        gamer_tag_id: userData.gamer_tag_id,
        primary_position: userData.primary_position,
        secondary_position: userData.secondary_position || null,
        console: consoleValue,
        is_active: true,
      },
    })

    if (updateError) {
      console.error("Error updating user metadata:", updateError)
      // Don't return an error, just log it and continue
    }

    return NextResponse.json({
      success: true,
      message: "User record created successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Error in create-missing-user route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
