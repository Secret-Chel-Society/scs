import { NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Processing fallback password reset for:", email)

    // Create a Supabase client
    const supabase = createClientComponentClient()

    // Use Supabase's built-in password reset functionality
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.secretchelsociety.com/reset-password",
    })

    if (error) {
      console.error("Error sending reset email via fallback method:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Password reset email sent successfully via fallback method")

    return NextResponse.json({
      success: true,
      message: "Password reset link sent successfully",
    })
  } catch (error) {
    console.error("Error in fallback-reset route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
