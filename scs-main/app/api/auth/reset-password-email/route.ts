import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Processing password reset for:", email)

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Use Supabase's built-in password reset functionality with the correct redirect URL
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) {
      console.error("Error sending password reset email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Password reset email sent successfully")

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
    })
  } catch (error) {
    console.error("Error in reset-password-email route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
