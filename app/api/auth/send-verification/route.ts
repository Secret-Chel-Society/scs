import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { sendDirectVerificationEmail } from "@/lib/direct-email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Normalize the email
    const normalizedEmail = email.toLowerCase().trim()

    // Create a Supabase admin client with service role
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    // Log the attempt
    console.log(`Sending verification email to: ${normalizedEmail}`)

    // Check if user exists in the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    if (userError) {
      console.error("Error checking user:", userError)
      return NextResponse.json({ error: `Database error: ${userError.message}` }, { status: 500 })
    }

    let userId = userData?.id

    // If user not found in users table, check auth directly
    if (!userId) {
      console.log("User not found in users table, checking auth...")
      // Try to get user from auth
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          filter: {
            email: normalizedEmail,
          },
        })

        if (authError) {
          console.error("Error checking auth:", authError)
          return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 })
        }

        if (!authUser || authUser.users.length === 0) {
          console.error("User not found in auth")
          return NextResponse.json(
            {
              error: "User not found",
              status: "not_registered",
            },
            { status: 400 },
          )
        }

        userId = authUser.users[0].id
        console.log(`Found user in auth: ${userId}`)
      } catch (error) {
        console.error("Exception checking auth:", error)
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error checking user in auth system",
          },
          { status: 500 },
        )
      }
    } else {
      console.log(`Found user in users table: ${userId}`)
    }

    // Generate verification email using our direct email system with better error handling
    console.log(`Attempting to send verification email to ${normalizedEmail} with userId ${userId}`)

    try {
      const emailResult = await sendDirectVerificationEmail(normalizedEmail, userId)

      if (!emailResult.success) {
        console.error(`Failed to send verification email to ${normalizedEmail}: ${emailResult.error}`)

        // Log the failure with more details
        try {
          await supabaseAdmin.from("verification_logs").insert({
            email: normalizedEmail,
            user_id: userId,
            status: "email_failed",
            details: `Email send failed: ${emailResult.error}`,
            created_at: new Date().toISOString(),
          })
        } catch (logError) {
          console.error("Error logging verification failure:", logError)
        }

        return NextResponse.json(
          {
            error: emailResult.error || "Failed to send verification email",
            details: "Please try again or contact support if the issue persists",
          },
          { status: 500 },
        )
      }

      // Log success with more details
      console.log(`Verification email sent successfully to: ${normalizedEmail}`)
      if (emailResult.verificationUrl) {
        console.log(`Verification URL: ${emailResult.verificationUrl}`)
      }

      // Log the success
      try {
        await supabaseAdmin.from("verification_logs").insert({
          email: normalizedEmail,
          user_id: userId,
          status: "email_sent",
          details: `Verification email sent successfully${emailResult.simulated ? " (simulated)" : ""}`,
          created_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error("Error logging verification success:", logError)
        // Continue anyway
      }

      return NextResponse.json({
        success: true,
        message: "Verification email sent. Please check your inbox and spam folder.",
        simulated: emailResult.simulated || false,
        verificationUrl: emailResult.simulated ? emailResult.verificationUrl : undefined,
      })
    } catch (emailError) {
      console.error("Exception in email sending:", emailError)
      return NextResponse.json(
        {
          error: "Failed to send verification email",
          details: emailError instanceof Error ? emailError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in send-verification route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
