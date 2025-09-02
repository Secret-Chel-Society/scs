import nodemailer from "nodemailer"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

// Create a type for email options
type EmailOptions = {
  to: string
  subject: string
  html: string
}

// Create a type for verification token
type VerificationToken = {
  token: string
  email: string
  userId: string
  expiresAt: Date
}

// Function to send an email using SMTP
export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get SMTP configuration from environment variables
    const host = process.env.SMTP_HOST
    const port = Number.parseInt(process.env.SMTP_PORT || "587")
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASSWORD
    const from = process.env.SMTP_FROM || "noreply@example.com"
    const secure = process.env.SMTP_SECURE === "true"

    // Log SMTP configuration (without password)
    console.log(`SMTP Configuration: ${host}:${port}, user: ${user}, from: ${from}, secure: ${secure}`)

    // Validate SMTP configuration
    if (!host || !user || !pass) {
      throw new Error("SMTP configuration is incomplete")
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    })

    // Verify SMTP connection
    await transporter.verify()
    console.log("SMTP connection verified successfully")

    // Send the email
    const info = await transporter.sendMail({
      from,
      ...options,
    })

    console.log(`Email sent successfully to ${options.to}, messageId: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Function to generate and store a verification token
export async function createVerificationToken(email: string, userId: string): Promise<VerificationToken | null> {
  try {
    console.log(`Creating verification token for user: ${userId}, email: ${email}`)

    // Generate a random token
    const token = randomBytes(32).toString("hex")

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Create a Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or service role key")
      throw new Error("Supabase configuration is incomplete")
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Store the token in the database
    try {
      const { error } = await supabaseAdmin.from("email_verification_tokens").insert({
        email,
        token,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      })

      if (error) {
        console.error("Error storing verification token:", error)
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (insertError) {
      console.error("Exception storing verification token:", insertError)
      throw new Error(
        `Failed to store verification token: ${insertError instanceof Error ? insertError.message : "Unknown error"}`,
      )
    }

    console.log(`Verification token created successfully for ${email}`)
    return { token, email, userId, expiresAt }
  } catch (error) {
    console.error("Error creating verification token:", error)
    throw new Error(`Failed to create verification token: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Function to generate a verification email
export function generateVerificationEmail(email: string, token: string, siteUrl: string) {
  const verificationUrl = `${siteUrl}/verify/${token}`

  return {
    to: email,
    subject: "Verify your email address for SCS",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Thank you for registering with SCS. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #0070f3;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="color: #666; font-size: 14px;">SCS - Multiplayer Gaming Hockey League</p>
      </div>
    `,
  }
}

// Function to send a verification email
export async function sendVerificationEmail(
  email: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
    console.log(`Using site URL: ${siteUrl} for verification email`)

    // Create a verification token
    let tokenData: VerificationToken | null = null
    try {
      tokenData = await createVerificationToken(email, userId)
    } catch (tokenError) {
      console.error("Error creating verification token:", tokenError)

      // Create a fallback verification mechanism
      // Generate a direct verification link without storing a token
      const directToken = Buffer.from(`${email}:${userId}:${Date.now()}`).toString("base64")

      // Generate the verification email with direct token
      const emailOptions = {
        to: email,
        subject: "Verify your email address for SCS",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Thank you for registering with SCS. Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/direct-verify?token=${directToken}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0070f3;">${siteUrl}/direct-verify?token=${directToken}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="color: #666; font-size: 14px;">SCS - Multiplayer Gaming Hockey League</p>
          </div>
        `,
      }

      // Send the email with direct verification
      const result = await sendEmail(emailOptions)
      if (!result.success) {
        throw new Error(result.error || "Failed to send email")
      }

      console.log(`Sent fallback verification email to ${email} using direct verification`)
      return { success: true }
    }

    if (!tokenData) {
      throw new Error("Failed to create verification token")
    }

    // Generate the verification email
    const emailOptions = generateVerificationEmail(email, tokenData.token, siteUrl)

    // Send the email
    const result = await sendEmail(emailOptions)
    if (!result.success) {
      throw new Error(result.error || "Failed to send email")
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending verification email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
