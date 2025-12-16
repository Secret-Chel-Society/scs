import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

async function waitForAuthUserInUsersTable(supabase: any, userId: string, maxAttempts = 10): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Checking for auth user in users table, attempt ${attempt}/${maxAttempts}`)

    const { data, error } = await supabase.from("users").select("id").eq("id", userId).single()

    if (data && !error) {
      console.log("Auth user found in users table")
      return true
    }

    if (error && error.code !== "PGRST116") {
      console.error("Error checking users table:", error)
    }

    // Wait before next attempt (increasing delay)
    await new Promise((resolve) => setTimeout(resolve, attempt * 500))
  }

  console.error("Auth user not found in users table after maximum attempts")
  return false
}

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
      console: playerConsole,
      discord_id: discordId,
      discord_username: discordUsername,
    } = metadata

    // Validate metadata fields (removed position validation)
    if (!gamerTag || !playerConsole) {
      console.error("Missing required metadata fields:", {
        gamerTag: !!gamerTag,
        playerConsole: !!playerConsole,
      })
      return NextResponse.json(
        {
          error: "Missing required player information",
          details: {
            gamerTag: !!gamerTag,
            playerConsole: !!playerConsole,
          },
        },
        { status: 400 },
      )
    }

    console.log("Registration attempt for:", { email, gamerTag, discordId })

    // Check if email already exists in users table
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

    // Check if gamertag already exists in users table
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
      console.log("Checking Discord ID:", discordId)

      try {
        const { data: existingDiscordUser, error: discordCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("discord_id", discordId)
          .single()

        if (discordCheckError) {
          console.log("Discord check error details:", {
            code: discordCheckError.code,
            message: discordCheckError.message,
            details: discordCheckError.details,
            hint: discordCheckError.hint,
          })

          // Only return error for non-"no rows found" errors
          if (discordCheckError.code !== "PGRST116") {
            console.error("Database error checking Discord ID in users table:", discordCheckError)
            return NextResponse.json(
              {
                error: "Database error while checking Discord ID",
                details: discordCheckError.message,
              },
              { status: 500 },
            )
          }
        }

        if (existingDiscordUser) {
          return NextResponse.json({ error: "Discord account already connected to another user" }, { status: 400 })
        }

        // Also check discord_users table
        console.log("Checking discord_users table for Discord ID:", discordId)

        const { data: existingDiscordConnection, error: discordConnectionError } = await supabase
          .from("discord_users")
          .select("user_id")
          .eq("discord_id", discordId)
          .single()

        if (discordConnectionError) {
          console.log("Discord connection check error details:", {
            code: discordConnectionError.code,
            message: discordConnectionError.message,
            details: discordConnectionError.details,
            hint: discordConnectionError.hint,
          })

          // Only return error for non-"no rows found" errors
          if (discordConnectionError.code !== "PGRST116") {
            console.error("Database error checking Discord connection:", discordConnectionError)
            return NextResponse.json(
              {
                error: "Database error while checking Discord connection",
                details: discordConnectionError.message,
              },
              { status: 500 },
            )
          }
        }

        if (existingDiscordConnection) {
          return NextResponse.json({ error: "Discord account already connected to another user" }, { status: 400 })
        }

        console.log("Discord ID checks passed successfully")
      } catch (discordError: any) {
        console.error("Unexpected error during Discord ID checks:", discordError)
        return NextResponse.json(
          {
            error: "Unexpected database error while checking Discord ID",
            details: discordError.message,
          },
          { status: 500 },
        )
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

    const { error: publicUserError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: email,
      gamer_tag_id: gamerTag,
      console: playerConsole,
      discord_id: discordId || null,
      discord_name: discordUsername || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (publicUserError) {
      console.error("Public users table creation error:", publicUserError)
      // Clean up auth user if public users creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError)
      }
      return NextResponse.json(
        {
          error: "Failed to create user record in public users table",
          details: publicUserError,
        },
        { status: 500 },
      )
    }

    console.log("Public users record created:", authData.user.id)

    // Add a brief delay to ensure record creation is fully processed
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Wait for auth user to appear in users table
    const userExists = await waitForAuthUserInUsersTable(supabase, authData.user.id)
    if (!userExists) {
      // Clean up auth user if verification fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError)
      }
      return NextResponse.json(
        {
          error: "Failed to create user account - timing issue with user creation",
          details: "User record was not found in users table",
        },
        { status: 500 },
      )
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        gamer_tag_id: gamerTag,
        console: playerConsole,
        discord_id: discordId || null,
        discord_name: discordUsername || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)

    if (updateUserError) {
      console.error("User update error:", updateUserError)
      // Clean up auth user if update fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError)
      }
      return NextResponse.json(
        {
          error: "Failed to update user profile",
          details: updateUserError,
        },
        { status: 500 },
      )
    }

    console.log("User record updated:", authData.user.id)

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
      if (playerError.code === "23503" && playerError.message?.includes("players_user_id_fkey")) {
        console.error("Foreign key constraint violation - user_id not found in users table")
      }

      try {
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

    // Create season registration (removed position fields)
    const { error: registrationError } = await supabase.from("season_registrations").insert({
      user_id: authData.user.id,
      season_id: seasonId,
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
