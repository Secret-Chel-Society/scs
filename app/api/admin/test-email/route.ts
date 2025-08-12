import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Simplified SMTP configurations that don't rely on DNS lookup
const smtpConfigurations = [
  // Primary configuration from environment variables
  {
    name: "Primary Config",
    port: Number.parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true",
  },
  // Hostinger alternative STARTTLS
  { name: "STARTTLS", port: 587, secure: false },
  // Hostinger SSL/TLS
  { name: "SSL/TLS", port: 465, secure: true },
]

export async function POST(request: Request) {
  try {
    // Parse the request body
    let email, adminKey
    try {
      const body = await request.json()
      email = body.email
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

    // Validate inputs
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
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
    const from = process.env.SMTP_FROM || user

    // Validate SMTP configuration
    if (!host || !user || !pass) {
      return NextResponse.json(
        {
          error: "SMTP configuration is incomplete",
          suggestion: "Please check your environment variables for SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.",
          config: {
            host: host || "Not set",
            port: process.env.SMTP_PORT || "Not set",
            user: user ? "✓" : "✗",
            pass: pass ? "✓" : "✗",
            from: from || "Not set",
            secure: process.env.SMTP_SECURE || "Not set",
          },
        },
        { status: 500 },
      )
    }

    // Try a single configuration to avoid DNS lookup issues
    try {
      console.log(
        `Using SMTP configuration: Port: ${smtpConfigurations[0].port}, Secure: ${smtpConfigurations[0].secure}`,
      )

      // Create a transporter with this configuration
      const transporter = nodemailer.createTransport({
        host,
        port: smtpConfigurations[0].port,
        secure: smtpConfigurations[0].secure,
        auth: {
          user,
          pass,
        },
        // Simplified options to avoid DNS lookup
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      })

      // Send a test email
      const info = await transporter.sendMail({
        from,
        to: email,
        subject: `MGHL Email Test`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Test Successful</h2>
            <p>This is a test email from MGHL to verify that the email system is working correctly.</p>
            <p>If you received this email, it means the email system is configured correctly.</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="color: #666; font-size: 14px;">MGHL - Multiplayer Gaming Hockey League</p>
          </div>
        `,
      })

      console.log(`Test email sent successfully to ${email}, messageId: ${info.messageId}`)

      // Return success
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        config: {
          host,
          port: smtpConfigurations[0].port,
          user: "✓",
          pass: "✓",
          from,
          secure: smtpConfigurations[0].secure,
        },
      })
    } catch (error) {
      console.error("Error sending email:", error)

      // Provide helpful error message and suggestions
      let errorMessage = error instanceof Error ? error.message : "Unknown error"
      let suggestion = ""

      if (errorMessage.includes("dns.lookup")) {
        errorMessage = "DNS lookup failed. This may be due to preview environment limitations."
        suggestion = "Try using an IP address instead of a hostname for SMTP_HOST, or test in a deployed environment."
      } else if (errorMessage.includes("ECONNREFUSED")) {
        suggestion = "The SMTP server refused the connection. Check your host and port settings."
      } else if (errorMessage.includes("ETIMEDOUT")) {
        suggestion = "Connection timed out. The SMTP server may be unreachable or blocked."
      } else if (errorMessage.includes("authentication")) {
        suggestion = "Authentication failed. Check your username and password."
      }

      return NextResponse.json(
        {
          error: "Failed to send email",
          details: errorMessage,
          suggestion,
          config: {
            host,
            port: smtpConfigurations[0].port,
            user: "✓",
            pass: "✓",
            from,
            secure: smtpConfigurations[0].secure,
          },
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in test-email route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        suggestion: "This may be due to preview environment limitations. Try testing in a deployed environment.",
      },
      { status: 500 },
    )
  }
}
