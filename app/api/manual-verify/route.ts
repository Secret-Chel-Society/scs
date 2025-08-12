import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, adminKey } = await request.json()

    // Validate inputs
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!adminKey) {
      return NextResponse.json({ error: "Admin key is required" }, { status: 400 })
    }

    // Verify admin key
    const expectedKey = process.env.ADMIN_VERIFICATION_KEY
    if (!expectedKey || adminKey !== expectedKey) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Attempting to verify user with email: ${email}`)

    // Create a Supabase admin client with the service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("Missing Supabase configuration")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // First, try to find the user in the auth.users table using the admin API
    console.log("Looking up user in auth system...")

    // Method 1: Try to get user by email directly
    const {
      data: { users } = { users: [] },
      error: getUserError,
    } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email,
      },
    })

    if (getUserError) {
      console.error("Error listing users:", getUserError)
      return NextResponse.json({ error: `Error listing users: ${getUserError.message}` }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.log("User not found in auth.users, trying alternative lookup methods...")

      // Method 2: Try to find the user in the public users table
      const { data: publicUsers, error: publicUserError } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("email", email)
        .limit(1)

      if (publicUserError) {
        console.error("Error querying public users table:", publicUserError)
      } else if (publicUsers && publicUsers.length > 0) {
        console.log(`Found user in public users table: ${publicUsers[0].id}`)

        // Try to get the auth user by ID
        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(publicUsers[0].id)

        if (authUserError) {
          console.error("Error getting auth user by ID:", authUserError)
        } else if (authUser && authUser.user) {
          console.log("Successfully found user via public users table")
          users.push(authUser.user)
        }
      }
    }

    // If we still haven't found the user, return an error
    if (!users || users.length === 0) {
      console.error(`User not found with email: ${email}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]
    console.log(`Found user: ${user.id}, email: ${user.email}`)

    // Check if the user is already confirmed
    if (user.email_confirmed_at) {
      console.log(`User ${user.id} is already verified`)
      return NextResponse.json({
        message: "User is already verified",
        alreadyVerified: true,
      })
    }

    // Manually update the user to confirm their email
    console.log(`Updating user ${user.id} to confirm email`)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirmed_at: new Date().toISOString(),
    })

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: `Failed to verify user: ${updateError.message}` }, { status: 500 })
    }

    // Also ensure the user is active in the users table
    console.log(`Updating user ${user.id} to active in users table`)
    const { error: dbError } = await supabaseAdmin.from("users").update({ is_active: true }).eq("id", user.id)

    if (dbError) {
      console.error("Error updating user active status:", dbError)
      // Continue anyway since the auth verification is more important
    }

    // Log the verification for audit purposes
    try {
      await supabaseAdmin.from("verification_logs").insert({
        user_id: user.id,
        email: user.email,
        method: "admin_manual",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      })
    } catch (logError) {
      console.error("Error logging verification:", logError)
      // Non-critical, continue
    }

    console.log(`Successfully verified user ${user.id}`)
    return NextResponse.json({
      message: "User verified successfully",
      success: true,
      email: user.email,
    })
  } catch (error: any) {
    console.error("Unexpected error in manual-verify API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
