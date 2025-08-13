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

    // Use Supabase's built-in password reset functionality with a custom redirect URL
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.secretchelsociety.com/reset-password",
    })

    if (error) {
      console.error("Error sending password reset email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
    })
  } catch (error) {
    console.error("Error in direct-reset route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
