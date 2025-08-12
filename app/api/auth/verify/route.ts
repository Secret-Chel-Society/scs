import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { token, email, type = "signup" } = await request.json()

    if (!token && !email) {
      return NextResponse.json({ error: "Token or email is required" }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log(
      `Verification attempt: ${type} for ${email || "unknown email"} with token: ${token ? "provided" : "not provided"}`,
    )

    let result
    let userWasVerified = false

    if (token) {
      // If token is provided, use it directly
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: type === "recovery" ? "recovery" : "email",
      })

      if (error) {
        console.error("Token verification error:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      result = data
      userWasVerified = true
    } else if (email) {
      // If only email is provided, try to resend the verification email
      const { error } = await supabaseAdmin.auth.resend({
        type: type === "recovery" ? "recovery" : "signup",
        email,
      })

      if (error) {
        console.error("Email resend error:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: "Verification email sent",
      })
    }

    // If user was successfully verified, automatically refresh their data
    if (userWasVerified && result?.user) {
      try {
        console.log(`User ${result.user.email} verified successfully, triggering automatic refresh...`)

        // Call the refresh users function for this specific user
        await refreshSingleUser(result.user.id, result.user.email, supabaseAdmin)

        console.log(`Automatic refresh completed for user ${result.user.email}`)
      } catch (refreshError) {
        console.error("Error during automatic user refresh:", refreshError)
        // Don't fail the verification if refresh fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      user: result?.user || null,
      session: result?.session || null,
      autoRefreshed: userWasVerified,
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Helper function to refresh a single user's data
async function refreshSingleUser(userId: string, email: string, supabaseAdmin: any) {
  try {
    console.log(`Starting automatic refresh for user ${email} (${userId})`)

    // Get the user's auth data
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser.user) {
      throw new Error(`Failed to get auth user: ${authError?.message}`)
    }

    // Check if user exists in public.users table
    const { data: publicUser, error: publicUserError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (publicUserError && publicUserError.code !== "PGRST116") {
      throw new Error(`Failed to check public user: ${publicUserError.message}`)
    }

    // If user doesn't exist in public.users, create them
    if (!publicUser) {
      console.log(`Creating public user record for ${email}`)

      const metadata = authUser.user.user_metadata || {}

      // Validate and fix console value
      let consoleValue = metadata.console || "Xbox"
      if (!["Xbox", "PS5"].includes(consoleValue)) {
        // Map common variations to valid values
        if (["XSX", "Xbox Series X", "XBOX", "xbox"].includes(consoleValue)) {
          consoleValue = "Xbox"
        } else if (["PlayStation 5", "PS", "PlayStation", "ps5"].includes(consoleValue)) {
          consoleValue = "PS5"
        } else {
          consoleValue = "Xbox" // Default fallback
        }
      }

      const { error: createUserError } = await supabaseAdmin.from("users").insert({
        id: userId,
        email: authUser.user.email,
        gamer_tag_id: metadata.gamer_tag_id || authUser.user.email?.split("@")[0] || "Unknown",
        primary_position: metadata.primary_position || "Center",
        secondary_position: metadata.secondary_position || null,
        console: consoleValue,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createUserError) {
        throw new Error(`Failed to create public user: ${createUserError.message}`)
      }

      console.log(`Created public user record for ${email}`)
    } else {
      // Update existing user to ensure they're active
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        console.log(`Warning: Failed to update user active status: ${updateError.message}`)
      }
    }

    // Check if player record exists
    const { data: playerData, error: playerError } = await supabaseAdmin
      .from("players")
      .select("*")
      .eq("user_id", userId)

    if (playerError && playerError.code !== "PGRST116") {
      throw new Error(`Failed to check player record: ${playerError.message}`)
    }

    // Create player record if it doesn't exist
    if (!playerData || playerData.length === 0) {
      console.log(`Creating player record for ${email}`)

      const { error: createPlayerError } = await supabaseAdmin.from("players").insert({
        user_id: userId,
        role: "Player",
        salary: 0,
      })

      if (createPlayerError) {
        throw new Error(`Failed to create player record: ${createPlayerError.message}`)
      }

      console.log(`Created player record for ${email}`)
    }

    // Check if user has roles in user_roles table
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)

    if (rolesError) {
      throw new Error(`Failed to check user roles: ${rolesError.message}`)
    }

    // Add default Player role if no roles exist
    if (!userRoles || userRoles.length === 0) {
      console.log(`Adding default Player role for ${email}`)

      const { error: addRoleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "Player",
      })

      if (addRoleError) {
        throw new Error(`Failed to add default role: ${addRoleError.message}`)
      }

      console.log(`Added default Player role for ${email}`)
    }

    console.log(`Automatic refresh completed successfully for ${email}`)
    return true
  } catch (error) {
    console.error(`Error refreshing user ${email}:`, error)
    throw error
  }
}
