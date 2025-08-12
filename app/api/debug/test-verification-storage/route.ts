import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("=== Starting verification token storage test ===")

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Testing with email:", email)

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("=== Testing database connection ===")

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("verification_tokens")
      .select("count")
      .limit(1)

    if (connectionError) {
      console.error("Connection test failed:", connectionError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: connectionError,
        },
        { status: 500 },
      )
    }

    console.log("Database connection successful")

    // Generate test token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log("=== Attempting to insert token ===")
    console.log("Token:", token)
    console.log("Email:", email)
    console.log("Expires at:", expiresAt)

    // Try to insert token
    const { data: insertData, error: insertError } = await supabase
      .from("verification_tokens")
      .insert({
        email: email,
        token: token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error("Insert failed:", insertError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to insert token",
          details: insertError,
        },
        { status: 500 },
      )
    }

    console.log("Insert successful:", insertData)

    // Verify the token was saved
    console.log("=== Verifying token was saved ===")
    const { data: verifyData, error: verifyError } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("token", token)
      .single()

    if (verifyError) {
      console.error("Verification failed:", verifyError)
      return NextResponse.json(
        {
          success: false,
          error: "Token was inserted but could not be verified",
          details: verifyError,
        },
        { status: 500 },
      )
    }

    console.log("Token verified successfully:", verifyData)

    // Clean up test token
    console.log("=== Cleaning up test token ===")
    const { error: deleteError } = await supabase.from("verification_tokens").delete().eq("token", token)

    if (deleteError) {
      console.warn("Failed to clean up test token:", deleteError)
    } else {
      console.log("Test token cleaned up successfully")
    }

    return NextResponse.json({
      success: true,
      message: "Token storage test completed successfully",
      tokenData: {
        token: token,
        email: email,
        expires_at: expiresAt.toISOString(),
        verified: true,
      },
    })
  } catch (error: any) {
    console.error("=== Test verification storage error ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
