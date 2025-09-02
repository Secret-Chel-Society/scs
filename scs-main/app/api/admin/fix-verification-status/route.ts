import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Try to use the admin_force_verify_user function if it exists
    try {
      const { error: functionError } = await supabaseAdmin.rpc("admin_force_verify_user", {
        user_id_param: userId,
        email_param: email,
      })

      if (!functionError) {
        // Function executed successfully
        return NextResponse.json({
          success: true,
          message: "User verification status fixed successfully using admin_force_verify_user function",
        })
      }

      console.log("admin_force_verify_user function failed:", functionError)
    } catch (e) {
      console.log("Error calling admin_force_verify_user function:", e)
    }

    // If the function doesn't exist or fails, fall back to the API method
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: { email_verified: true },
      app_metadata: { email_verified: true },
    })

    if (updateError) {
      console.error("Error updating user verification status:", updateError)
      return NextResponse.json(
        { error: `Failed to update verification status: ${updateError.message}` },
        { status: 500 },
      )
    }

    // Insert a log entry
    try {
      await supabaseAdmin.from("verification_logs").insert({
        user_id: userId,
        email,
        action: "admin_fix_verification_status",
        success: true,
        details: "Admin fixed verification status via API",
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.log("Error inserting verification log:", logError)
      // Continue even if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "User verification status fixed successfully",
    })
  } catch (error) {
    console.error("Error in fix-verification-status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
