import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, action, adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    if (!userId || !action) {
      return NextResponse.json({ error: "User ID and action are required" }, { status: 400 })
    }

    // Create admin client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log(`Fixing orphaned user: ${userId}, action: ${action}`)

    let result = { success: false, message: "", details: {} }

    switch (action) {
      case "delete_auth_user":
        // Delete user from Supabase Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) {
          throw deleteError
        }
        result = { success: true, message: "Auth user deleted successfully", details: { userId } }
        break

      case "create_public_user":
        // Get auth user details first
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (authError || !authUser.user) {
          throw new Error("Auth user not found")
        }

        const user = authUser.user
        const metadata = user.user_metadata || {}

        // Normalize console value
        let consoleValue = metadata.console || "Xbox"
        if (!["Xbox", "PS5"].includes(consoleValue)) {
          if (["XSX", "Xbox Series X", "XBOX", "xbox"].includes(consoleValue)) {
            consoleValue = "Xbox"
          } else if (["PlayStation 5", "PS", "PlayStation", "ps5"].includes(consoleValue)) {
            consoleValue = "PS5"
          } else {
            consoleValue = "Xbox" // Default fallback
          }
        }

        // Create user record in public.users
        const { error: createUserError } = await supabaseAdmin.from("users").insert({
          id: user.id,
          email: user.email,
          gamer_tag_id: metadata.gamer_tag_id || user.email?.split("@")[0] || "Unknown",
          primary_position: metadata.primary_position || "Center",
          secondary_position: metadata.secondary_position || null,
          console: consoleValue,
          is_active: true,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        })

        if (createUserError) {
          throw createUserError
        }

        // Create player record
        const { error: playerError } = await supabaseAdmin.from("players").insert({
          user_id: user.id,
          role: "Player",
          salary: 0,
        })

        if (playerError) {
          console.error("Error creating player record:", playerError)
        }

        // Create user role
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: user.id,
          role: "Player",
        })

        if (roleError) {
          console.error("Error creating user role:", roleError)
        }

        // Update auth user to be verified
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
          user_metadata: {
            ...metadata,
            email_verified: true,
          },
        })

        if (updateError) {
          console.error("Error updating auth user:", updateError)
        }

        result = {
          success: true,
          message: "Public user record created successfully",
          details: { userId, email: user.email },
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error fixing orphaned auth user:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
