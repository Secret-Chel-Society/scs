import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Generating password reset link for:", email)

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Generate the password reset link with token
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      },
    })

    if (error) {
      console.error("Error generating reset link via Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Password reset link generated successfully")
    console.log("Generated link:", data.action_link)

    return NextResponse.json({
      success: true,
      message: "Password reset link generated successfully",
      resetLink: data.action_link,
    })
  } catch (error) {
    console.error("Error in reset-password-link route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
