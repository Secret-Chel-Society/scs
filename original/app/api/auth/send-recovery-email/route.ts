import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { email, recoveryLink } = await request.json()

    if (!email || !recoveryLink) {
      return NextResponse.json({ error: "Email and recovery link are required" }, { status: 400 })
    }

    console.log("Sending recovery email to:", email)
    console.log("Recovery link:", recoveryLink)

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Send the email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MGHL Support" <support@majorgaminghockeyleague.com>',
      to: email,
      subject: "Reset Your MGHL Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>You requested to reset your password for your Major Gaming Hockey League account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${recoveryLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #666;">${recoveryLink}</p>
        </div>
      `,
    })

    console.log("Recovery email sent:", info.messageId)

    return NextResponse.json({
      success: true,
      message: "Recovery email sent successfully",
    })
  } catch (error) {
    console.error("Error sending recovery email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send recovery email" },
      { status: 500 },
    )
  }
}
