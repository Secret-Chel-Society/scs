import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Find the user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email.toLowerCase().trim(),
      },
    })

    if (userError) {
      console.error("Error finding user:", userError)
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 })
    }

    if (!userData || userData.users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userData.users[0]

    // Generate a direct verification link
    const token = Buffer.from(`${email}:${user.id}:${Date.now()}`).toString("base64")
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
    const verificationUrl = `${siteUrl}/direct-verify?token=${token}`

    // Create a transporter
    const nodemailer = require("nodemailer")
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Send the email
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not request this verification, please ignore this email.</p>
          </div>
        `,
      })

      // Log the verification attempt
      try {
        await supabaseAdmin.from("verification_logs").insert({
          email: email,
          user_id: user.id,
          status: "fallback_email_sent",
          details: "Fallback verification email sent",
          created_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error("Error logging verification attempt:", logError)
        // Continue anyway
      }

      return NextResponse.json({
        success: true,
        message: "Verification email sent. Please check your inbox and spam folder.",
      })
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in fallback verification:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
