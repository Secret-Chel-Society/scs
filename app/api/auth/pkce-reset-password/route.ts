import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    console.log("Processing PKCE password reset for token:", token)

    // Create admin client
    const supabaseAdmin = createAdminClient()

    // First, try to find the user associated with this token
    let userId = null
    let userEmail = null

    // Check if it's a PKCE token
    const isPkce = token.startsWith("pkce_")
    const cleanToken = isPkce ? token.replace("pkce_", "") : token

    console.log("Clean token:", cleanToken, "isPkce:", isPkce)

    // For PKCE tokens, we need to look in the flow_state table
    if (isPkce) {
      try {
        // First try to find in flow_state
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
      } catch (error) {
        console.error("Error processing flow_state query:", error)
      }

      // If not found in flow_state, try other tables
      if (!userId) {
        try {
          // Try to find in auth.users by recovery_token
          const { data: userData, error: userError } = await supabaseAdmin
            .from("auth.users")
            .select("id, email")
            .or(`recovery_token.eq.${cleanToken},recovery_token.eq.${token}`)
            .maybeSingle()

          if (userError) {
            console.error("Error querying auth.users by recovery_token:", userError)
          }

          if (userData) {
            console.log("Found user by recovery_token:", userData)
            userId = userData.id
            userEmail = userData.email
          }
        } catch (error) {
          console.error("Error processing users query:", error)
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

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      email: userEmail,
    })
  } catch (error) {
    console.error("Unexpected error in pkce-reset-password:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
