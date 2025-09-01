import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    console.log("Registration request body:", JSON.stringify(body, null, 2))

    const { email, password, metadata, discordInfo } = body

    // Validate required fields
    if (!email || !password || !metadata) {
      console.error("Missing required top-level fields:", {
        email: !!email,
        password: !!password,
        metadata: !!metadata,
      })
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            email: !!email,
            password: !!password,
            metadata: !!metadata,
          },
        },
        { status: 400 },
      )
    }

    const {
      gamer_tag_id: gamerTag,
      primary_position: primaryPosition,
      secondary_position: secondaryPosition,
      console: playerConsole,
      discord_id: discordId,
      discord_username: discordUsername,
    } = metadata

    // Validate metadata fields
    if (!gamerTag || !playerConsole || !primaryPosition) {
      console.error("Missing required metadata fields:", {
        gamerTag: !!gamerTag,
        playerConsole: !!playerConsole,
        primaryPosition: !!primaryPosition,
      })
      return NextResponse.json(
        {
          error: "Missing required player information",
          details: {
            gamerTag: !!gamerTag,
            playerConsole: !!playerConsole,
            primaryPosition: !!primaryPosition,
          },
        },
        { status: 400 },
      )
    }

    console.log("Registration attempt for:", { email, gamerTag, discordId })

    // Check if email already exists
    const { data: existingUser, error: emailCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (emailCheckError && emailCheckError.code !== "PGRST116") {
      console.error("Error checking existing email:", emailCheckError)
      return NextResponse.json({ error: "Database error while checking email" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Check if gamertag already exists
    const { data: existingGamertag, error: gamertagCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("gamer_tag_id", gamerTag)
      .single()

    if (gamertagCheckError && gamertagCheckError.code !== "PGRST116") {
      console.error("Error checking existing gamertag:", gamertagCheckError)
      return NextResponse.json({ error: "Database error while checking gamertag" }, { status: 500 })
    }

    if (existingGamertag) {
      return NextResponse.json({ error: "Gamertag already taken" }, { status: 400 })
    }

    // If Discord info is provided, check if Discord ID is already in use
    if (discordId) {
      const { data: existingDiscordUser, error: discordCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("discord_id", discordId)
        .single()

      if (discordCheckError && discordCheckError.code !== "PGRST116") {
        console.error("Error checking existing Discord ID:", discordCheckError)
        return NextResponse.json({ error: "Database error while checking Discord ID" }, { status: 500 })
      }

      if (existingDiscordUser) {
        return NextResponse.json({ error: "Discord account already connected to another user" }, { status: 400 })
      }

      // Also check discord_users table
      const { data: existingDiscordConnection, error: discordConnectionError } = await supabase
        .from("discord_users")
        .select("user_id")
        .eq("discord_id", discordId)
        .single()

      if (discordConnectionError && discordConnectionError.code !== "PGRST116") {
        console.error("Error checking existing Discord connection:", discordConnectionError)
        return NextResponse.json({ error: "Database error while checking Discord connection" }, { status: 500 })
      }

      if (existingDiscordConnection) {
        return NextResponse.json({ error: "Discord account already connected to another user" }, { status: 400 })
      }
    }

    // Create auth user with email confirmation enabled since Discord handles verification
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since Discord handles verification
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json(
        {
          error: authError.message || "Failed to create authentication account",
          details: authError,
        },
        { status: 400 },
      )
    }

    console.log("Auth user created:", authData.user.id)

    // Create user record with Discord ID if provided
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        gamer_tag_id: gamerTag,
        primary_position: primaryPosition,
        secondary_position: secondaryPosition || null,
        console: playerConsole,
        discord_id: discordId || null, // Save Discord ID to users table
        discord_name: discordUsername || null,
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      console.error("User creation error:", userError)
      // Clean up auth user if user creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError)
      }
      return NextResponse.json(
        {
          error: "Failed to create user profile",
          details: userError,
        },
        { status: 500 },
      )
    }

    console.log("User record created:", userData.id)

    // If Discord info is provided, also create discord_users record
    if (discordInfo && discordId) {
      console.log("Creating Discord connection record...")

      const { error: discordUserError } = await supabase.from("discord_users").insert({
        user_id: authData.user.id,
        discord_id: discordId,
        discord_username: discordInfo.username || discordUsername || "Unknown",
        discord_discriminator: discordInfo.discriminator || "0000",
        discord_avatar: discordInfo.avatar || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (discordUserError) {
        console.error("Discord user creation error:", discordUserError)
        // Don't fail the whole registration for this, but log it
        console.warn("Failed to create discord_users record, but continuing with registration")
      } else {
        console.log("Discord connection record created successfully")
      }
    }

    // Get current season
    const { data: currentSeason, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_current", true)
      .single()

    if (seasonError) {
      console.error("Error getting current season:", seasonError)
    }

    const seasonId = currentSeason?.id || 1

    // Create player record
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .insert({
        user_id: authData.user.id,
        team_id: null,
        salary: 750000,
        role: "Player",
      })
      .select()
      .single()

    if (playerError) {
      console.error("Player creation error:", playerError)
      // Clean up user and auth records
      try {
        await supabase.from("users").delete().eq("id", authData.user.id)
        await supabase.auth.admin.deleteUser(authData.user.id)
        // Also clean up discord_users record if it was created
        if (discordId) {
          await supabase.from("discord_users").delete().eq("user_id", authData.user.id)
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup after player creation error:", cleanupError)
      }
      return NextResponse.json(
        {
          error: "Failed to create player profile",
          details: playerError,
        },
        { status: 500 },
      )
    }

    console.log("Player record created:", playerData.id)

    // Create season registration
    const { error: registrationError } = await supabase.from("season_registrations").insert({
      user_id: authData.user.id,
      season_id: seasonId,
      primary_position: primaryPosition,
      secondary_position: secondaryPosition || null,
      gamer_tag: gamerTag,
      console: playerConsole,
      status: "registered",
    })

    if (registrationError) {
      console.error("Registration creation error:", registrationError)
      // Don't fail the whole registration for this, just log it
    }

    // Create user role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authData.user.id,
      role: "Player",
    })

    if (roleError) {
      console.error("User role creation error:", roleError)
      // Don't fail the whole registration for this, just log it
    }

    // If Discord ID is provided, assign Discord roles
    if (discordId) {
      console.log("Assigning Discord roles for new user...")

      // Add a delay to ensure the user record is fully committed
      setTimeout(async () => {
        try {
          const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: authData.user.id }),
          })

          if (roleResponse.ok) {
            const roleData = await roleResponse.json()
            console.log("Discord roles assigned successfully:", roleData)
          } else {
            const errorText = await roleResponse.text()
            console.error("Failed to assign Discord roles:", errorText)
          }
        } catch (discordError) {
          console.error("Error assigning Discord roles:", discordError)
        }
      }, 2000) // 2 second delay
    }

    return NextResponse.json({
      success: true,
      message: discordId
        ? "Registration successful! Your Discord account has been verified and roles assigned."
        : "Registration successful! Please connect your Discord account to complete verification.",
      userId: authData.user.id,
      playerId: playerData.id,
      discordRoleAssignment: discordId ? "initiated" : "skipped",
      discordConnectionCreated: discordId ? true : false,
      requiresDiscordConnection: !discordId,
    })
  } catch (error: any) {
    console.error("Registration error:", error)

    // Always return JSON, never let it fall through to HTML error pages
    return NextResponse.json(
      {
        error: error.message || "Registration failed",
        details: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      },
      { status: 500 },
    )
  }
}

// Add OPTIONS handler for CORS if needed
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
