import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Use Supabase's built-in password reset functionality
    // This avoids the rate limiting issue with generateLink
    const { error } = await supabase.auth.admin.resetUserPasswordByEmail(email, {
      redirectTo: "https://www.secretchelsociety.com/reset-password",
    })

    if (error) {
      // Check for rate limiting error
      if (error.message.includes("security purposes") || error.message.includes("only request this after")) {
        return NextResponse.json(
          {
            error: "Too many password reset requests. Please wait a moment before trying again.",
          },
          { status: 429 },
        )
      }

      console.error("Error sending password reset email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link sent successfully",
    })
  } catch (error) {
    console.error("Error in custom-reset-password route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
