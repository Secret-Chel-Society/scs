import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    console.log("Processing direct password reset for token:", token)

    // Create admin client
    const supabaseAdmin = createAdminClient()

    // First, try to find the user associated with this token
    let userId = null
    let userEmail = null

    // Check if it's a PKCE token
    const isPkce = token.startsWith("pkce_")
    const cleanToken = isPkce ? token.replace("pkce_", "") : token

    console.log("Clean token:", cleanToken, "isPkce:", isPkce)

    // Try to find the token in our email_verification_tokens table first
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("user_id, email")
      .eq("token", token)
      .maybeSingle()

    if (tokenError) {
      console.error("Error querying email_verification_tokens:", tokenError)
    }

    if (tokenData) {
      console.log("Found token in email_verification_tokens:", tokenData)
      userId = tokenData.user_id
      userEmail = tokenData.email
    } else {
      console.log("Token not found in email_verification_tokens, checking Supabase tables...")

      // Try to find in auth.users by recovery_token
      const { data: userData, error: userError } = await supabaseAdmin
        .from("auth.users")
        .select("id, email, recovery_token")
        .or(`recovery_token.eq.${cleanToken},recovery_token.eq.${token}`)
        .maybeSingle()

      if (userError) {
        console.error("Error querying auth.users by recovery_token:", userError)
      }

      if (userData) {
        console.log("Found user by recovery_token:", userData)
        userId = userData.id
        userEmail = userData.email
      } else {
        // Try to find in auth.flow_state for PKCE tokens
        if (isPkce) {
          const { data: flowData, error: flowError } = await supabaseAdmin
            .from("auth.flow_state")
            .select("user_id, auth_code")
            .eq("auth_code", cleanToken)
            .maybeSingle()

          if (flowError) {
            console.error("Error querying auth.flow_state:", flowError)
          }

          if (flowData && flowData.user_id) {
            console.log("Found user in flow_state:", flowData)
            userId = flowData.user_id

            // Get the user's email
            const { data: userInfo, error: userInfoError } = await supabaseAdmin
              .from("auth.users")
              .select("email")
              .eq("id", flowData.user_id)
              .single()

            if (userInfoError) {
              console.error("Error getting user email:", userInfoError)
            } else if (userInfo) {
              userEmail = userInfo.email
            }
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    console.log("Resetting password for user:", userId)

    // Update the user's password directly
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: "Failed to update password: " + updateError.message }, { status: 500 })
    }

    // Delete the token from our table if it exists there
    if (tokenData) {
      await supabaseAdmin
        .from("email_verification_tokens")
        .delete()
        .eq("token", token)
        .then(({ error }) => {
          if (error) console.error("Error deleting token:", error)
        })
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      email: userEmail,
    })
  } catch (error) {
    console.error("Unexpected error in direct-reset-password:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
