import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Processing password reset for:", email)

    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables for Supabase")
      return NextResponse.json({ 
        error: "Server configuration error. Please contact support." 
      }, { status: 500 })
    }

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Use Supabase's built-in password reset functionality with the correct redirect URL
    // Always use production URL for password resets to ensure links work correctly
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "https://www.secretchelsociety.com"
    const redirectUrl = `${siteUrl}/reset-password`
    
    console.log("Using redirect URL:", redirectUrl)
    console.log("Environment check:", {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
      finalSiteUrl: siteUrl
    })
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
      options: {
        emailRedirectTo: redirectUrl
      }
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
