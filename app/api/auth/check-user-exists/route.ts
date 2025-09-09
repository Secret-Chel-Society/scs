import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Normalize the email to lowercase
    const normalizedEmail = email.toLowerCase().trim()

    console.log(`Checking if user exists: ${normalizedEmail}`)

    // Create a Supabase admin client with service role
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("Missing Supabase configuration")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Method 1: Check users table directly
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .ilike("email", normalizedEmail)
        .limit(1)

      if (usersError) {
        console.error("Error querying users:", usersError)
      } else if (users && users.length > 0) {
        console.log(`User found in users table: ${normalizedEmail}`)
        return NextResponse.json({ exists: true })
      }
    } catch (error) {
      console.error("Exception querying users:", error)
    }

    // Method 2: Check email_verification_tokens table
    try {
      const { data: tokens, error: tokensError } = await supabaseAdmin
        .from("email_verification_tokens")
        .select("id, email")
        .eq("email", normalizedEmail)
        .limit(1)

      if (tokensError) {
        console.error("Error querying email_verification_tokens:", tokensError)
      } else if (tokens && tokens.length > 0) {
        console.log(`User found in email_verification_tokens: ${normalizedEmail}`)
        return NextResponse.json({ exists: true })
      }
    } catch (error) {
      console.error("Exception querying email_verification_tokens:", error)
    }

    // Method 3: Try a direct auth check using signInWithOtp
    try {
      // This will send a magic link but we're just using it to check if the user exists
      const { error: signInError } = await supabaseAdmin.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          // Set shouldCreateUser to false to avoid creating a new user
          shouldCreateUser: false,
        },
      })

      // If there's no error or the error is not about user not found, the user likely exists
      if (!signInError || !signInError.message.toLowerCase().includes("user not found")) {
        console.log(`User likely exists based on signInWithOtp: ${normalizedEmail}`)
        return NextResponse.json({ exists: true })
      }
    } catch (error) {
      console.error("Exception with signInWithOtp:", error)
    }

    // If we've tried all methods and found nothing, the user probably doesn't exist
    console.log(`User not found: ${normalizedEmail}`)
    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error("Error in check-user-exists route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
