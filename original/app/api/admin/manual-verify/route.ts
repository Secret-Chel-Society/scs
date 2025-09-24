import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email, adminKey, forceVerify } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key provided" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Normalize the email
    const normalizedEmail = email.toLowerCase().trim()
    console.log(`Attempting to verify email: ${normalizedEmail}`)

    // Create a Supabase admin client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    let userId = null
    let userEmail = null
    let foundUser = null

    // Method 1: Try to find user using admin.listUsers with exact email match
    try {
      console.log("Searching for user using admin.listUsers...")
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

      if (listError) {
        console.error("Error listing users:", listError)
      } else if (users?.users) {
        // Find exact email match (case-insensitive)
        foundUser = users.users.find((u) => u.email?.toLowerCase().trim() === normalizedEmail)

        if (foundUser) {
          userId = foundUser.id
          userEmail = foundUser.email
          console.log(`Found user via listUsers: ${userId} with email ${userEmail}`)
        } else {
          console.log(`No user found with email ${normalizedEmail} in ${users.users.length} total users`)
          // Log all emails for debugging
          const allEmails = users.users.map((u) => u.email?.toLowerCase()).filter(Boolean)
          console.log("Available emails:", allEmails.slice(0, 10)) // Log first 10 for debugging
        }
      }
    } catch (e) {
      console.error("Exception in listUsers:", e)
    }

    // Method 2: If not found, try direct SQL query on auth.users
    if (!foundUser) {
      try {
        console.log("Searching for user using direct SQL query...")
        const { data: authUsers, error: authError } = await supabaseAdmin
          .from("auth.users")
          .select("id, email, email_confirmed_at")
          .ilike("email", normalizedEmail) // Use ilike for case-insensitive exact match
          .limit(1)

        if (authError) {
          console.error("Error querying auth.users:", authError)
        } else if (authUsers && authUsers.length > 0) {
          const authUser = authUsers[0]
          // Double-check the email matches exactly
          if (authUser.email?.toLowerCase().trim() === normalizedEmail) {
            userId = authUser.id
            userEmail = authUser.email
            console.log(`Found user in auth.users: ${userId} with email ${userEmail}`)
          } else {
            console.log(`Email mismatch: found ${authUser.email} but looking for ${normalizedEmail}`)
          }
        }
      } catch (e) {
        console.error("Exception in auth.users query:", e)
      }
    }

    // If still no user found, return error
    if (!userId || !userEmail) {
      console.log(`User not found for email: ${normalizedEmail}`)
      return NextResponse.json(
        {
          error: "User not found in auth system",
          searchedEmail: normalizedEmail,
          details: "No user account exists with this email address",
        },
        { status: 404 },
      )
    }

    // Validate that we found the correct user
    if (userEmail.toLowerCase().trim() !== normalizedEmail) {
      console.error(`Email mismatch: searched for ${normalizedEmail} but found ${userEmail}`)
      return NextResponse.json(
        {
          error: "Email mismatch detected",
          searchedEmail: normalizedEmail,
          foundEmail: userEmail,
          details: "The system found a different user than requested",
        },
        { status: 400 },
      )
    }

    console.log(`Verified correct user found: ${userEmail} (${userId})`)

    // If force verify is enabled, directly update the user's verification status
    if (forceVerify) {
      console.log(`Force verifying user ${userEmail} (${userId})`)

      // Try multiple approaches to verify the user
      let verificationSuccess = false

      // Approach 1: Use the admin_force_verify_user function if it exists
      try {
        console.log("Attempting to use admin_force_verify_user function")
        const { error: functionError } = await supabaseAdmin.rpc("admin_force_verify_user", {
          user_id_param: userId,
          email_param: userEmail,
        })

        if (!functionError) {
          console.log("Successfully verified user using admin_force_verify_user function")
          verificationSuccess = true
        } else {
          console.error("Error using admin_force_verify_user function:", functionError)
        }
      } catch (e) {
        console.error("Exception calling admin_force_verify_user function:", e)
      }

      // Approach 2: Use the updateUserById method with email_confirm parameter
      if (!verificationSuccess) {
        try {
          console.log("Attempting to use updateUserById with email_confirm parameter")
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email_confirm: true,
          })

          if (!updateError) {
            console.log("Successfully verified user using updateUserById with email_confirm")
            verificationSuccess = true
          } else {
            console.error("Error using updateUserById with email_confirm:", updateError)
          }
        } catch (e) {
          console.error("Exception using updateUserById with email_confirm:", e)
        }
      }

      // Approach 3: Use the updateUserById method with email_confirmed_at parameter
      if (!verificationSuccess) {
        try {
          console.log("Attempting to use updateUserById with email_confirmed_at parameter")
          const now = new Date().toISOString()
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email_confirmed_at: now,
            user_metadata: { email_verified: true },
            app_metadata: { email_verified: true },
          })

          if (!updateError) {
            console.log("Successfully verified user using updateUserById with email_confirmed_at")
            verificationSuccess = true
          } else {
            console.error("Error using updateUserById with email_confirmed_at:", updateError)
          }
        } catch (e) {
          console.error("Exception using updateUserById with email_confirmed_at:", e)
        }
      }

      // Check if any of our approaches succeeded
      if (!verificationSuccess) {
        return NextResponse.json(
          {
            error: "Failed to verify user after multiple attempts",
            details: "See server logs for more information",
            searchedEmail: normalizedEmail,
            foundEmail: userEmail,
          },
          { status: 500 },
        )
      }

      // Log the verification action
      try {
        await supabaseAdmin.from("verification_logs").insert({
          user_id: userId,
          email: userEmail,
          status: "admin_force_verified",
          details: `Admin force verified user. Searched: ${normalizedEmail}, Verified: ${userEmail}`,
          created_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error("Error logging verification:", logError)
        // Continue even if logging fails
      }

      return NextResponse.json({
        success: true,
        message: "User has been force verified successfully",
        searchedEmail: normalizedEmail,
        verifiedEmail: userEmail,
        userId: userId,
      })
    } else {
      // Send verification email logic (existing code)
      try {
        // Generate a verification token
        const token = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

        // Store the token in the database
        const { error: tokenError } = await supabaseAdmin.from("email_verification_tokens").insert({
          email: userEmail,
          token,
          user_id: userId,
          expires_at: expiresAt.toISOString(),
        })

        if (tokenError) {
          console.error("Error storing verification token:", tokenError)
          return NextResponse.json({ error: "Failed to create verification token" }, { status: 500 })
        }

        // Get the site URL
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"

        // Create the verification URL
        const verificationUrl = `${siteUrl}/verify/${token}`

        // Create the email content
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0070f3;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not request this verification, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="color: #666; font-size: 14px;">MGHL - Multiplayer Gaming Hockey League</p>
          </div>
        `

        // In development, just return the verification URL
        if (process.env.NODE_ENV === "development") {
          console.log(`Development mode: Skipping email send. Verification URL: ${verificationUrl}`)

          // Log the verification email sent
          try {
            await supabaseAdmin.from("verification_logs").insert({
              user_id: userId,
              email: userEmail,
              status: "admin_sent_verification",
              details: `Admin sent verification email (development mode). Searched: ${normalizedEmail}, Sent to: ${userEmail}`,
              created_at: new Date().toISOString(),
            })
          } catch (logError) {
            console.error("Error logging verification:", logError)
            // Continue even if logging fails
          }

          return NextResponse.json({
            success: true,
            message: "Development mode: Verification email would be sent",
            verificationUrl,
            searchedEmail: normalizedEmail,
            sentToEmail: userEmail,
          })
        }

        // Import the email module
        const { createTransporter } = await import("@/lib/email")

        // Create the transporter
        const transporter = createTransporter()

        // Send the email
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MGHL Support" <noreply@majorgaminghockeyleague.com>',
          to: userEmail,
          subject: "Verify your email address for MGHL",
          html: emailHtml,
        })

        // Log the verification email sent
        try {
          await supabaseAdmin.from("verification_logs").insert({
            user_id: userId,
            email: userEmail,
            status: "admin_sent_verification",
            details: `Admin sent verification email. Searched: ${normalizedEmail}, Sent to: ${userEmail}`,
            created_at: new Date().toISOString(),
          })
        } catch (logError) {
          console.error("Error logging verification:", logError)
          // Continue even if logging fails
        }

        return NextResponse.json({
          success: true,
          message: "Verification email has been sent",
          searchedEmail: normalizedEmail,
          sentToEmail: userEmail,
        })
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
        return NextResponse.json(
          {
            error: "Failed to send verification email",
            details: emailError instanceof Error ? emailError.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Error in manual-verify route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
