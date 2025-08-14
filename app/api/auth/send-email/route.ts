import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { email, subject, html, resetPassword = false } = await request.json()

    if (!email || !subject || !html) {
      return NextResponse.json({ error: "Email, subject, and html content are required" }, { status: 400 })
    }

    // Get the site URL from environment variables or use a default
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"

    // Try to use Supabase's email functionality with admin privileges
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      )

      if (resetPassword) {
        // Handle password reset specifically
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo: `${siteUrl}/reset-password`,
          },
        })

        if (error) {
          console.error("Error generating password reset link:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Log the generated link for debugging
        console.log("Generated password reset link:", data.properties.action_link)

        // Send the email with the reset link
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        })

        const mailOptions = {
          from: process.env.SMTP_FROM || "noreply@example.com",
          to: email,
          subject: "Reset Your Password",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Reset Your Password</h2>
              <p>You requested to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.properties.action_link}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0070f3;">${data.properties.action_link}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you did not request a password reset, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
              <p style="color: #666; font-size: 14px;">SCS - Multiplayer Gaming Hockey League</p>
            </div>
          `,
        }

        await transporter.sendMail(mailOptions)
        return NextResponse.json({ success: true })
      } else {
        // Use Supabase's built-in email functionality for other emails
        const { error } = await adminClient.auth.admin.sendRawMagicLink({
          email,
          create_user: false,
          email_subject: subject,
          email_html: html,
        })

        if (error) {
          console.error("Error sending email via Supabase:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }
    }

    // Fallback to a simple email logging if we can't send
    console.log("Would send email to:", email)
    console.log("Subject:", subject)
    console.log("HTML:", html)

    // In production, you would integrate with a service like SendGrid, Mailjet, etc.
    // For now, we'll just return success and rely on the logging
    return NextResponse.json({
      success: true,
      message: "Email logged (would be sent in production)",
    })
  } catch (error) {
    console.error("Error in send-email route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
