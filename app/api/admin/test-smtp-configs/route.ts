import { NextResponse } from "next/server"
import { testSmtpConfigurations } from "@/lib/smtp-tester"

export async function POST(request: Request) {
  try {
    // Parse the request body
    let adminKey
    try {
      const body = await request.json()
      adminKey = body.adminKey
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: parseError instanceof Error ? parseError.message : "Failed to parse JSON body",
        },
        { status: 400 },
      )
    }

    // Verify admin key
    const expectedKey = process.env.ADMIN_VERIFICATION_KEY
    if (!expectedKey || adminKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get SMTP configuration
    const host = process.env.SMTP_HOST
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASSWORD

    // Validate SMTP configuration
    if (!host || !user || !pass) {
      return NextResponse.json(
        {
          error: "SMTP configuration is incomplete",
          config: {
            host: host || "Not set",
            user: user ? "✓" : "✗",
            pass: pass ? "✓" : "✗",
          },
        },
        { status: 500 },
      )
    }

    // Test different SMTP configurations
    const results = await testSmtpConfigurations(host, user, pass)

    // Return the results
    return NextResponse.json({
      success: true,
      results,
      currentConfig: {
        host,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true",
      },
    })
  } catch (error) {
    console.error("Error in test-smtp-configs route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
