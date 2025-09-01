import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createTransporter } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create the Supabase admin client
    const supabase = createAdminClient()

    // Generate a password reset token
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    })

    if (error) {
      console.error("Error generating password reset token:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || !data.properties || !data.properties.action_link) {
      console.error("No action link generated")
      return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 })
    }

    // Extract the token from the action link
    const actionLink = data.properties.action_link
    console.log("Original action link:", actionLink)

    // Parse the URL to extract the hash (which contains the token)
    const url = new URL(actionLink)
    const hash = url.hash

    // Create our custom reset URL
    const customResetUrl = `https://www.secretchelsociety.com/reset-password${hash}`
    console.log("Custom reset URL:", customResetUrl)

    // Send a custom email with the reset link
    try {
      // Create a transporter
      const transporter = createTransporter()

      // Send the email
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"SCS Support" <noreply@secretchelsociety.com>',
        to: email,
        subject: "Reset your SCS password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested to reset your password for your Secret Chel Society account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${customResetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #666;">${customResetUrl}</p>
          </div>
        `,
      })

      return NextResponse.json({
        success: true,
        message: "Password reset link sent successfully",
      })
    } catch (emailError) {
      console.error("Error sending custom email:", emailError)

      // If we can't send a custom email, use Supabase's built-in email
      // but with our custom redirect URL
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://www.secretchelsociety.com/reset-password",
      })

      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Password reset link sent via Supabase",
        fallback: true,
      })
    }
  } catch (error) {
    console.error("Error in custom-password-reset route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
