import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("=== EMAIL SEND TEST ===")
    console.log("Email:", email)
    console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL || "NOT SET")
    console.log("NEXT_PUBLIC_VERCEL_URL:", process.env.NEXT_PUBLIC_VERCEL_URL || "NOT SET")

    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: "Missing Supabase environment variables",
        details: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 })
    }

    // Create the Supabase admin client
    const supabase = createAdminClient()
    console.log("Supabase client created successfully")

    // Get the site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
    const redirectUrl = `${siteUrl}/reset-password`
    
    console.log("Using redirect URL:", redirectUrl)

    // Try to send the password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ 
        error: error.message,
        details: error,
        redirectUrl
      }, { status: 500 })
    }

    console.log("Password reset email sent successfully")
    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
      redirectUrl,
      email
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error
      },
      { status: 500 },
    )
  }
}
