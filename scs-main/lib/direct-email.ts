import nodemailer from "nodemailer"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

// Check if we're in the preview environment
const isPreviewEnvironment =
  process.env.NEXT_PUBLIC_VERCEL_URL?.includes("v0.dev") ||
  !process.env.SMTP_HOST ||
  process.env.NODE_ENV === "development"

// Create a Supabase admin client
const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or service role key")
    throw new Error("Supabase configuration is incomplete")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Create a nodemailer transporter
const createTransporter = () => {
  // If we're in the preview environment, return a mock transporter
  if (isPreviewEnvironment) {
    console.log("Preview environment detected - creating mock transporter")
    return {
      verify: async () => true,
      sendMail: async (options: any) => ({
        messageId: `simulated-${Date.now()}@preview.example.com`,
        envelope: { from: options.from, to: options.to },
        accepted: [options.to],
        rejected: [],
        pending: [],
        response: "250 Simulated OK",
      }),
    }
  }

  const host = process.env.SMTP_HOST
  const port = Number.parseInt(process.env.SMTP_PORT || "465")
  const secure = process.env.SMTP_SECURE === "true"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    console.error("Missing SMTP configuration")
    throw new Error("SMTP configuration is incomplete")
  }

  console.log(`Creating SMTP transporter with: ${host}:${port}, secure: ${secure}, user: ${user}`)

  return nodemailer.createTransporter({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

// Verify the transporter connection
async function verifyTransporter() {
  try {
    const transporter = createTransporter()

    // If we're in the preview environment, skip verification
    if (isPreviewEnvironment) {
      console.log("Preview environment detected - skipping SMTP verification")
      return { success: true, transporter, simulated: true }
    }

    await transporter.verify()
    console.log("SMTP connection verified successfully")
    return { success: true, transporter }
  } catch (error) {
    console.error("SMTP connection verification failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify SMTP connection",
    }
  }
}

// Generate a verification token
async function generateVerificationToken(email: string, userId?: string) {
  try {
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    console.log(`=== GENERATING VERIFICATION TOKEN ===`)
    console.log(`Email: ${email}`)
    console.log(`Token: ${token.substring(0, 10)}...`)
    console.log(`Expires at: ${expiresAt.toISOString()}`)

    const supabaseAdmin = createSupabaseAdmin()

    // Test database connection first
    try {
      console.log("Testing database connection...")
      const { data: testData, error: testError } = await supabaseAdmin
        .from("verification_tokens")
        .select("count")
        .limit(1)

      if (testError) {
        console.error("Database connection test failed:", testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }

      console.log("Database connection successful")
    } catch (connectionError) {
      console.error("Database connection exception:", connectionError)
      console.log("Falling back to direct token method due to connection issues")
      const directToken = Buffer.from(`${email}:${userId || "unknown"}:${Date.now()}`).toString("base64")
      return { token: directToken, directToken: true }
    }

    // Store the token in the verification_tokens table using the correct schema
    try {
      console.log("=== ATTEMPTING DATABASE INSERT ===")

      const insertData = {
        token,
        email,
        expires_at: expiresAt.toISOString(),
      }

      console.log("Insert data:", JSON.stringify(insertData, null, 2))

      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from("verification_tokens")
        .insert(insertData)
        .select()

      if (insertError) {
        console.error("=== DATABASE INSERT ERROR ===")
        console.error("Error details:", JSON.stringify(insertError, null, 2))
        console.error("Error code:", insertError.code)
        console.error("Error message:", insertError.message)
        console.error("Error hint:", insertError.hint)
        console.log("Falling back to direct token method")

        // Return a direct token as fallback
        const directToken = Buffer.from(`${email}:${userId || "unknown"}:${Date.now()}`).toString("base64")
        return { token: directToken, directToken: true }
      }

      console.log("=== DATABASE INSERT SUCCESS ===")
      console.log("Insert result:", JSON.stringify(insertResult, null, 2))

      // Verify the token was actually inserted
      try {
        const { data: verifyData, error: verifyError } = await supabaseAdmin
          .from("verification_tokens")
          .select("*")
          .eq("token", token)
          .single()

        if (verifyError) {
          console.error("Token verification failed:", verifyError)
        } else {
          console.log("Token verified in database:", JSON.stringify(verifyData, null, 2))
        }
      } catch (verifyException) {
        console.error("Token verification exception:", verifyException)
      }

      console.log("Successfully stored verification token in database")
      return { token, directToken: false }
    } catch (insertException) {
      console.error("=== DATABASE INSERT EXCEPTION ===")
      console.error("Exception details:", insertException)
      console.log("Falling back to direct token method")

      // Return a direct token as fallback
      const directToken = Buffer.from(`${email}:${userId || "unknown"}:${Date.now()}`).toString("base64")
      return { token: directToken, directToken: true }
    }
  } catch (error) {
    console.error("=== TOKEN GENERATION EXCEPTION ===")
    console.error("Exception details:", error)

    // Return a direct token as fallback
    const fallbackToken = Buffer.from(`${email}:${userId || "unknown"}:${Date.now()}`).toString("base64")
    return { token: fallbackToken, directToken: true }
  }
}

// Send a verification email
export async function sendDirectVerificationEmail(email: string, userId?: string) {
  console.log(`=== SENDING VERIFICATION EMAIL ===`)
  console.log(`Email: ${email}`)
  console.log(`User ID: ${userId}`)

  try {
    // Verify SMTP connection
    const { success: smtpSuccess, transporter, error: smtpError, simulated } = await verifyTransporter()
    if (!smtpSuccess || !transporter) {
      console.error("SMTP connection failed:", smtpError)
      return { success: false, error: `SMTP connection failed: ${smtpError}` }
    }

    if (simulated) {
      console.log("Using simulated SMTP transporter for preview environment")
    }

    // Generate a verification token
    const { token, directToken } = await generateVerificationToken(email, userId)
    if (!token) {
      console.error("Failed to generate verification token")
      return { success: false, error: "Failed to generate verification token" }
    }

    console.log(`=== TOKEN GENERATION RESULT ===`)
    console.log(`Token type: ${directToken ? "Direct" : "Database"}`)
    console.log(`Token preview: ${token.substring(0, 10)}...`)

    // Get the site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"

    // Create the verification URL
    let verificationUrl
    if (directToken) {
      // Create a direct verification URL with encoded data
      console.log("Using direct verification method")
      verificationUrl = `${siteUrl}/direct-verify?token=${token}`
    } else {
      // Use the database token
      console.log("Using database token verification method")
      verificationUrl = `${siteUrl}/verify/${token}`
    }

    console.log(`Verification URL: ${verificationUrl}`)

    // Create the email content
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Thank you for registering. Please click the button below to verify your email address:</p>
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
    }

    try {
      // Send the email
      const info = await transporter.sendMail(mailOptions)
      console.log(`=== EMAIL SENT SUCCESSFULLY ===`)
      console.log(`Message ID: ${info.messageId}`)

      return {
        success: true,
        messageId: info.messageId,
        simulated: !!simulated,
        verificationUrl: simulated ? verificationUrl : undefined, // Only include URL in simulated mode
        tokenType: directToken ? "direct" : "database",
      }
    } catch (error) {
      console.error("=== EMAIL SENDING ERROR ===")
      console.error("Error details:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error sending email",
      }
    }
  } catch (error) {
    console.error("=== UNEXPECTED ERROR ===")
    console.error("Error details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error sending verification email",
    }
  }
}

// Verify a token
export async function verifyEmailToken(token: string) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    console.log(`=== VERIFYING TOKEN ===`)
    console.log(`Token preview: ${token.substring(0, 10)}...`)

    // First try to find the token in the verification_tokens table
    try {
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from("verification_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle()

      if (!tokenError && tokenData) {
        console.log(`Found token in verification_tokens table for email: ${tokenData.email}`)

        // Check if token is already used
        if (tokenData.used_at) {
          console.log("Token already used")
          return { success: false, error: "Token has already been used" }
        }

        // Check if token is expired
        const expiresAt = new Date(tokenData.expires_at)
        if (expiresAt < new Date()) {
          console.log("Token has expired")
          return { success: false, error: "Token has expired" }
        }

        // Find the user by email
        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()

        if (userError) {
          console.error("Error finding users:", userError)
          return { success: false, error: "Failed to find user" }
        }

        const user = users?.users?.find((u) => u.email?.toLowerCase() === tokenData.email.toLowerCase())

        if (!user) {
          console.error("User not found with email:", tokenData.email)
          return { success: false, error: "User not found" }
        }

        // Update the user's verification status
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        })

        if (updateError) {
          console.error("Error updating user verification status:", updateError)
          return { success: false, error: "Failed to verify email" }
        }

        // Mark the token as used
        try {
          await supabaseAdmin
            .from("verification_tokens")
            .update({ used_at: new Date().toISOString() })
            .eq("token", token)
        } catch (updateError) {
          console.error("Exception marking token as used:", updateError)
          // Continue anyway
        }

        console.log(`Successfully verified email for user: ${user.id}`)
        return { success: true, email: tokenData.email }
      }
    } catch (dbError) {
      console.error("Error checking verification_tokens table:", dbError)
    }

    // If not found in database, try direct token verification
    try {
      const decoded = Buffer.from(token, "base64").toString()
      const parts = decoded.split(":")

      if (parts.length >= 2) {
        const email = parts[0]
        const userId = parts[1] !== "unknown" ? parts[1] : null
        const timestamp = parts[2] ? Number.parseInt(parts[2]) : Date.now()

        // Check if token is expired (24 hours)
        const expirationTime = timestamp + 24 * 60 * 60 * 1000
        if (Date.now() > expirationTime) {
          console.error("Direct token has expired")
          return { success: false, error: "Token has expired" }
        }

        console.log(`Direct token verification for email: ${email}`)

        // Find the user by email
        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()

        if (userError) {
          console.error("Error finding users:", userError)
          return { success: false, error: "Failed to find user" }
        }

        const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

        if (!user) {
          console.error("User not found with email:", email)
          return { success: false, error: "User not found" }
        }

        // Update the user's verification status
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        })

        if (updateError) {
          console.error("Error updating user verification status:", updateError)
          return { success: false, error: "Failed to verify email" }
        }

        console.log(`Successfully verified email for user: ${user.id}`)
        return { success: true, email }
      }
    } catch (decodeError) {
      console.error("Error decoding direct token:", decodeError)
    }

    return { success: false, error: "Invalid or expired token" }
  } catch (error) {
    console.error("Exception verifying token:", error)
    return { success: false, error: "Failed to verify email" }
  }
}
