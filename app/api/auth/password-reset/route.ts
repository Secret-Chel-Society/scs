import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * This is the single, consolidated API route for password reset functionality.
 * It replaces all the previous password reset API routes.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Processing password reset for:", email)

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Use Supabase's built-in password reset functionality with a custom redirect URL
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.secretchelsociety.com/reset-password",
    })

    if (error) {
      console.error("Error sending password reset email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Password reset email sent successfully")

    return NextResponse.json({
      success: true,
      message: "Password reset link sent successfully",
    })
  } catch (error) {
    console.error("Error in password-reset route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
