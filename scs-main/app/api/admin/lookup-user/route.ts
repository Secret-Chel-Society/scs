import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey, email } = await request.json()

    // Add more detailed logging
    console.log(`Admin lookup requested for email: ${email}`)

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

    // After creating the supabaseAdmin client, add:
    console.log("Supabase admin client created successfully")

    // Initialize results object
    const results = {
      status: {
        inAuthSystem: false,
        isEmailConfirmed: false,
        isMetadataVerified: false,
        inPublicUsers: false,
        hasVerificationLogs: false,
        hasVerificationTokens: false,
      },
      authUser: null,
      publicUser: null,
      verificationLogs: [],
      verificationTokens: [],
    }

    // Look up the user in auth system using the admin API
    try {
      // In the auth user lookup section, add more detailed logging:
      console.log("Looking up user in auth system...")
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: normalizedEmail,
        },
      })

      if (listError) {
        console.error("Error listing users:", listError)
        // Continue with other lookups
      } else {
        console.log(`Found ${users?.users?.length || 0} users in auth system`)

        // Find the user with the matching email
        const user = users?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)

        if (user) {
          console.log(`Found auth user with ID: ${user.id}`)
          results.status.inAuthSystem = true
          results.authUser = user
          results.status.isEmailConfirmed = !!user.email_confirmed_at
          results.status.isMetadataVerified = user.user_metadata?.email_verified === true
        } else {
          console.log("No matching user found in auth system")
        }
      }
    } catch (authError) {
      console.error("Error looking up auth user:", authError)
      // Continue with other lookups
    }

    // Look up the user in public.users table
    if (results.authUser) {
      try {
        const { data: publicUser, error: publicError } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", results.authUser.id)
          .maybeSingle()

        if (publicError) {
          console.error("Error looking up public user:", publicError)
          // Continue with other lookups
        } else if (publicUser) {
          results.status.inPublicUsers = true
          results.publicUser = publicUser
        }
      } catch (publicError) {
        console.error("Error looking up public user:", publicError)
        // Continue with other lookups
      }
    }

    // Look up verification logs
    if (results.authUser) {
      try {
        const { data: verificationLogs, error: logsError } = await supabaseAdmin
          .from("verification_logs")
          .select("*")
          .eq("email", normalizedEmail)
          .order("created_at", { ascending: false })

        if (logsError) {
          console.error("Error looking up verification logs:", logsError)
          // Continue with other lookups
        } else if (verificationLogs && verificationLogs.length > 0) {
          results.status.hasVerificationLogs = true
          results.verificationLogs = verificationLogs
        }
      } catch (logsError) {
        console.error("Error looking up verification logs:", logsError)
        // Continue with other lookups
      }
    }

    // Look up verification tokens - using email instead of user_id
    if (results.authUser) {
      try {
        const { data: verificationTokens, error: tokensError } = await supabaseAdmin
          .from("email_verification_tokens")
          .select("*")
          .eq("email", normalizedEmail)
          .order("created_at", { ascending: false })

        if (tokensError) {
          console.error("Error looking up verification tokens:", tokensError)
          // Continue with other lookups
        } else if (verificationTokens && verificationTokens.length > 0) {
          results.status.hasVerificationTokens = true
          results.verificationTokens = verificationTokens
        }
      } catch (tokensError) {
        console.error("Error looking up verification tokens:", tokensError)
        // Continue with other lookups
      }
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error("Error in lookup-user route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
