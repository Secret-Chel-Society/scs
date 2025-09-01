import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Generating recovery link for:", email)

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Generate a recovery link with the admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        // Make sure the redirect URL is your actual domain
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

    const recoveryLink = data.properties.action_link
    console.log("Generated recovery link:", recoveryLink)

    // Return the recovery link - we'll handle the email sending on the client
    return NextResponse.json({
      success: true,
      recoveryLink,
    })
  } catch (error) {
    console.error("Error in generate-recovery route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
