import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, action, adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    if (!email || !action) {
      return NextResponse.json({ error: "Email and action are required" }, { status: 400 })
    }

    // Create admin client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`Fixing user: ${normalizedEmail}, action: ${action}`)

    let result = { success: false, message: "", details: {} }

    switch (action) {
      case "delete_auth_user":
        // Delete user from Supabase Auth
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        const authUser = authUsers.users.find((user) => user.email?.toLowerCase() === normalizedEmail)

        if (authUser) {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          if (deleteError) {
            throw deleteError
          }
          result = { success: true, message: "Auth user deleted successfully", details: { authUserId: authUser.id } }
        } else {
          result = { success: false, message: "Auth user not found", details: {} }
        }
        break

      case "create_custom_user":
        // Create user in custom users table
        const { data: authUsers2 } = await supabaseAdmin.auth.admin.listUsers()
        const authUser2 = authUsers2.users.find((user) => user.email?.toLowerCase() === normalizedEmail)

        if (authUser2) {
          const { data: newUser, error: createError } = await supabaseAdmin
            .from("users")
            .insert({
              id: authUser2.id,
              email: authUser2.email,
              gamer_tag_id: authUser2.user_metadata?.gamer_tag_id || null,
              primary_position: authUser2.user_metadata?.primary_position || null,
              secondary_position: authUser2.user_metadata?.secondary_position || null,
              console: authUser2.user_metadata?.console || null,
              created_at: authUser2.created_at,
              is_active: true,
            })
            .select()

          if (createError) {
            throw createError
          }

          // Also create player record
          await supabaseAdmin.from("players").insert({
            user_id: authUser2.id,
            role: "Player",
          })

          result = {
            success: true,
            message: "Custom user and player record created",
            details: { userId: authUser2.id },
          }
        } else {
          result = { success: false, message: "Auth user not found", details: {} }
        }
        break

      case "verify_email":
        // Manually verify the user's email
        const { data: authUsers3 } = await supabaseAdmin.auth.admin.listUsers()
        const authUser3 = authUsers3.users.find((user) => user.email?.toLowerCase() === normalizedEmail)

        if (authUser3) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser3.id, {
            email_confirm: true,
          })

          if (updateError) {
            throw updateError
          }

          result = { success: true, message: "Email verified successfully", details: { userId: authUser3.id } }
        } else {
          result = { success: false, message: "Auth user not found", details: {} }
        }
        break

      case "delete_verification_tokens":
        // Delete any pending verification tokens
        const { error: deleteTokenError } = await supabaseAdmin
          .from("email_verification_tokens")
          .delete()
          .eq("email", normalizedEmail)

        if (deleteTokenError) {
          throw deleteTokenError
        }

        result = { success: true, message: "Verification tokens deleted", details: {} }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in fix-orphaned-user:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
