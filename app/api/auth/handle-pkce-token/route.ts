import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { token_hash } = await request.json()

    if (!token_hash) {
      return NextResponse.json({ error: "Token hash is required" }, { status: 400 })
    }

    console.log("Processing PKCE token:", token_hash)

    // Create admin client for direct database operations
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Extract the actual hash (remove pkce_ prefix if present)
    const actualHash = token_hash.startsWith("pkce_") ? token_hash.replace("pkce_", "") : token_hash

    // Look up the token in the auth.flow_state table
    const { data: flowStateData, error: flowStateError } = await supabaseAdmin
      .from("auth.flow_state")
      .select("*")
      .eq("auth_code", actualHash)
      .maybeSingle()

    if (flowStateError) {
      console.error("Error querying flow_state:", flowStateError)
      return NextResponse.json({ error: "Failed to verify token" }, { status: 500 })
    }

    if (!flowStateData) {
      // Try alternative lookup methods
      console.log("Token not found in flow_state, trying alternative lookups...")

      // Try to find the user by token in auth.users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from("auth.users")
        .select("id, email")
        .filter("confirmation_token", "eq", actualHash)
        .maybeSingle()

      if (userError) {
        console.error("Error querying users:", userError)
      }

      if (userData) {
        console.log("Found user by confirmation token:", userData.email)

        // Create a session for this user
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
          user_id: userData.id,
        })

        if (sessionError) {
          console.error("Error creating session:", sessionError)
          return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
        }

        // Set the session cookie
        const cookieStore = cookies()
        cookieStore.set("sb-access-token", sessionData.session.access_token, {
          path: "/",
          maxAge: sessionData.session.expires_in,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })

        cookieStore.set("sb-refresh-token", sessionData.session.refresh_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })

        return NextResponse.json({ success: true, email: userData.email })
      }

      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Extract user ID from flow state
    const userId = flowStateData.user_id

    if (!userId) {
      return NextResponse.json({ error: "No user associated with this token" }, { status: 400 })
    }

    // Get user email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("auth.users")
      .select("email")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error getting user:", userError)
      return NextResponse.json({ error: "Failed to get user information" }, { status: 500 })
    }

    // Create a session for this user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: userId,
    })

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Set the session cookie
    const cookieStore = cookies()
    cookieStore.set("sb-access-token", sessionData.session.access_token, {
      path: "/",
      maxAge: sessionData.session.expires_in,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    cookieStore.set("sb-refresh-token", sessionData.session.refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return NextResponse.json({ success: true, email: userData.email })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
