import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey, email } = await request.json()

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

    // Check user in auth system
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: normalizedEmail,
      },
    })

    if (listError) {
      console.error("Error listing users:", listError)
      return NextResponse.json({ error: `Auth error: ${listError.message}` }, { status: 500 })
    }

    // Find the user with the matching email
    const user = users?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)

    if (!user) {
      return NextResponse.json({ error: "User not found in auth system" }, { status: 404 })
    }

    // Check verification status in auth system
    const authVerified = !!user.email_confirmed_at
    const metadataVerified = user.user_metadata?.email_verified === true

    // Check if user exists in public.users table
    const { data: publicUser, error: publicError } = await supabaseAdmin
      .from("users")
      .select("id, is_active")
      .eq("id", user.id)
      .maybeSingle()

    if (publicError) {
      console.error("Error checking public user:", publicError)
      // Don't return an error, just log it and continue
    }

    // Check verification logs
    const { data: verificationLogs, error: logsError } = await supabaseAdmin
      .from("verification_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (logsError) {
      console.error("Error checking verification logs:", logsError)
      // Don't return an error, just log it and continue
    }

    // Check email verification tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (tokensError) {
      console.error("Error checking verification tokens:", tokensError)
      // Don't return an error, just log it and continue
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        auth_verified: authVerified,
        metadata_verified: metadataVerified,
        public_user_exists: !!publicUser,
        public_user_active: publicUser?.is_active || false,
      },
      verification_logs: verificationLogs || [],
      verification_tokens: tokens || [],
      status: {
        auth_system: authVerified ? "verified" : "not_verified",
        user_metadata: metadataVerified ? "verified" : "not_verified",
        public_user: publicUser ? "exists" : "missing",
      },
      synchronized: authVerified === metadataVerified && !!publicUser,
    })
  } catch (error: any) {
    console.error("Error in check-verification-status route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
