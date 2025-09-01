import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      console.error("No token provided in verification request")
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log(`Attempting to verify token: ${token.substring(0, 8)}...`)

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Find the token in the verification_tokens table (correct schema)
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("verification_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle()

    if (tokenError) {
      console.error("Database error when looking up token:", tokenError)
      return NextResponse.json({ error: "Database error during verification" }, { status: 500 })
    }

    if (!tokenData) {
      console.error("Token not found in database:", token.substring(0, 8))

      // Check if this might be a direct verification token
      try {
        const decoded = Buffer.from(token, "base64").toString()
        if (decoded.includes(":")) {
          console.log("Token appears to be a direct verification token, redirecting...")
          return NextResponse.json(
            {
              error: "Please use the direct verification link",
              redirect: `/direct-verify?token=${token}`,
            },
            { status: 400 },
          )
        }
      } catch (decodeError) {
        console.log("Token is not a base64 encoded direct token")
      }

      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    console.log(`Found token for email: ${tokenData.email}`)

    // Check if token is already used (using used_at column)
    if (tokenData.used_at) {
      console.log("Token already used for:", tokenData.email)
      return NextResponse.json({ error: "Token has already been used" }, { status: 400 })
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    if (expiresAt < now) {
      console.log(`Token expired. Expires: ${expiresAt}, Now: ${now}`)
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    console.log(`Token is valid, proceeding with verification for email: ${tokenData.email}`)

    // Find the user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    if (userError) {
      console.error("Error finding users:", userError)
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 })
    }

    const user = users?.users?.find((u) => u.email?.toLowerCase() === tokenData.email.toLowerCase())

    if (!user) {
      console.error("User not found with email:", tokenData.email)
      return NextResponse.json({ error: "User not found" }, { status: 400 })
    }

    // Mark the token as used first
    try {
      const { error: updateError } = await supabaseAdmin
        .from("verification_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id)

      if (updateError) {
        console.error("Error marking token as used:", updateError)
        // Continue anyway, but log it
      } else {
        console.log("Successfully marked token as used")
      }
    } catch (updateError) {
      console.error("Exception marking token as used:", updateError)
      // Continue anyway
    }

    // Update the user's email verification status
    try {
      console.log(`Updating user verification status for user: ${user.id}`)
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      })

      if (updateUserError) {
        console.error("Error updating user verification status:", updateUserError)
        return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
      }

      console.log("Successfully updated user verification status")
    } catch (updateError) {
      console.error("Exception updating user verification status:", updateError)
      return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
    }

    // Check if player record already exists
    try {
      const { data: existingPlayer, error: playerCheckError } = await supabaseAdmin
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (playerCheckError) {
        console.error("Error checking existing player:", playerCheckError)
        // Continue anyway
      }

      // If player doesn't exist, create one
      if (!existingPlayer) {
        try {
          const { error: playerError } = await supabaseAdmin.from("players").insert({
            user_id: user.id,
            salary: 0, // Default salary
            role: "player", // Default role
          })

          if (playerError) {
            console.error("Error creating player record:", playerError)
            // Continue anyway
          } else {
            console.log(`Successfully created player record for user ${user.id}`)
          }
        } catch (insertError) {
          console.error("Exception creating player record:", insertError)
          // Continue anyway
        }
      }
    } catch (playerError) {
      console.error("Exception checking/creating player:", playerError)
      // Continue anyway
    }

    // Log the verification
    try {
      await supabaseAdmin.from("verification_logs").insert({
        email: tokenData.email,
        user_id: user.id,
        status: "verified",
        details: "Email verified successfully",
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("Error logging verification:", logError)
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      email: tokenData.email,
    })
  } catch (error) {
    console.error("Error in verify-token route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
