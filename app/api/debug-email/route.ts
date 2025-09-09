import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Create a Supabase client with admin privileges for this API route
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if the user exists in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email,
      },
    })

    if (authError) {
      console.error("Error checking auth user:", authError)
      return NextResponse.json({ error: "Failed to check auth user" }, { status: 500 })
    }

    // Get SMTP configuration status (without exposing sensitive details)
    const smtpConfigured = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_FROM,
    )

    // Try to manually trigger a password reset email as a test
    // This is a good way to test if emails are working at all
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth-callback`,
      },
    })

    return NextResponse.json({
      message: "Email diagnostics completed",
      userExists: authUser && authUser.users && authUser.users.length > 0,
      userDetails:
        authUser && authUser.users && authUser.users.length > 0
          ? {
              id: authUser.users[0].id,
              email: authUser.users[0].email,
              emailConfirmed: authUser.users[0].email_confirmed_at !== null,
              createdAt: authUser.users[0].created_at,
            }
          : null,
      smtpConfigured: smtpConfigured,
      testEmailSent: !resetError,
      testEmailError: resetError ? resetError.message : null,
    })
  } catch (error) {
    console.error("Unexpected error in debug-email API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
