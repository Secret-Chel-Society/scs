import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("Getting info for token:", token)

    // Create admin client
    const supabaseAdmin = createAdminClient()

    // Check if it's a PKCE token
    const isPkce = token.startsWith("pkce_")
    const cleanToken = isPkce ? token.replace("pkce_", "") : token

    console.log("Clean token:", cleanToken, "isPkce:", isPkce)

    // Try to find the user associated with this token
    let userEmail = null

    // Try to find in auth.flow_state for PKCE tokens
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
    }

    return NextResponse.json({
      email: userEmail,
    })
  } catch (error) {
    console.error("Unexpected error in get-token-info:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
