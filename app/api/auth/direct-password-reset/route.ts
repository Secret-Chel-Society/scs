import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Processing direct password reset for:", email)

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Use the admin API to generate a recovery link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/reset-password`,
      },
    })

    if (error) {
      console.error("Error generating recovery link:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || !data.properties || !data.properties.action_link) {
      console.error("No action link generated")
      return NextResponse.json({ error: "Failed to generate recovery link" }, { status: 500 })
    }

    // Use Supabase's built-in email service
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/reset-password`,
    })

    if (resetError) {
      console.error("Error sending reset email:", resetError)
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    console.log("Password reset email sent successfully via Supabase")

    return NextResponse.json({
      success: true,
      message: "Password reset link sent successfully",
    })
  } catch (error) {
    console.error("Error in direct-password-reset route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
