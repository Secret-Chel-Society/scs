import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey, email, password } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key provided" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
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

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })

    if (updateError) {
      console.error("Error updating user password:", updateError)
      return NextResponse.json({ error: `Failed to update password: ${updateError.message}` }, { status: 500 })
    }

    // Log the password reset
    try {
      await supabaseAdmin.from("verification_logs").insert({
        email: normalizedEmail,
        user_id: user.id,
        status: "admin_password_reset",
        details: "Password reset by admin",
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("Error logging password reset:", logError)
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      message: "User password has been reset successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Error in reset-user-password route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
