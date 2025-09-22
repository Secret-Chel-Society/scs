import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey, email, password } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key provided" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Normalize the email
    const normalizedEmail = email.toLowerCase().trim()
    
    console.log("=== ADMIN PASSWORD RESET DEBUG ===")
    console.log("Original email:", email)
    console.log("Normalized email:", normalizedEmail)
    console.log("Admin key provided:", !!adminKey)
    console.log("Password length:", password.length)

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

    // Look up the user in auth system - try both filtered and unfiltered approaches
    let user = null
    let listError = null

    // First try with email filter
    const { data: filteredUsers, error: filterError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: normalizedEmail,
      },
    })

    if (filterError) {
      console.error("Error with filtered user lookup:", filterError)
      listError = filterError
    } else {
      user = filteredUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)
    }

    // If not found with filter, try getting all users and search manually
    if (!user && !listError) {
      console.log("User not found with filter, trying manual search...")
      const { data: allUsers, error: allUsersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (allUsersError) {
        console.error("Error listing all users:", allUsersError)
        listError = allUsersError
      } else {
        user = allUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)
        console.log(`Manual search found user: ${user ? 'YES' : 'NO'}`)
        if (user) {
          console.log(`Found user: ${user.email} (ID: ${user.id})`)
        }
      }
    }

    if (listError) {
      console.error("Error listing users:", listError)
      return NextResponse.json({ error: `Auth error: ${listError.message}` }, { status: 500 })
    }

    if (!user) {
      console.log(`User not found in auth system, checking public.users table...`)
      
      // Check if user exists in public.users table
      const { data: publicUser, error: publicUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .single()

      if (publicUserError || !publicUser) {
        console.error(`User not found in either auth or public.users: ${normalizedEmail}`)
        return NextResponse.json({ 
          error: "User not found in auth system or public users table",
          details: {
            authSearch: "No user found",
            publicSearch: publicUserError?.message || "No user found"
          }
        }, { status: 404 })
      }

      console.log(`Found user in public.users, but not in auth.users. User ID: ${publicUser.id}`)
      
      // Try to create the user in auth.users
      console.log("Attempting to create user in auth system...")
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password, // Use the provided password
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          public_user_id: publicUser.id,
          gamer_tag: publicUser.gamer_tag,
          primary_position: publicUser.primary_position,
          console: publicUser.console
        }
      })

      if (createError) {
        console.error("Error creating user in auth system:", createError)
        return NextResponse.json({ 
          error: "Failed to create user in auth system",
          details: {
            publicUserId: publicUser.id,
            email: publicUser.email,
            authError: createError.message,
            suggestion: "User should register through /register or /login page first"
          }
        }, { status: 400 })
      }

      console.log(`Successfully created user in auth system: ${newAuthUser.user?.id}`)
      
      // Update the public.users table to link to the auth user
      const { error: updatePublicError } = await supabaseAdmin
        .from('users')
        .update({ 
          id: newAuthUser.user?.id, // Update the ID to match auth.users
          updated_at: new Date().toISOString()
        })
        .eq('id', publicUser.id)

      if (updatePublicError) {
        console.error("Error updating public.users with auth user ID:", updatePublicError)
        // Continue anyway since the auth user was created
      }

      return NextResponse.json({
        success: true,
        message: "User created in auth system and password set successfully",
        user: {
          id: newAuthUser.user?.id,
          email: newAuthUser.user?.email,
          publicUserId: publicUser.id,
          action: "created_and_password_set"
        },
      })
    }

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })

    if (updateError) {
      console.error("Error updating user password:", updateError)
      return NextResponse.json({ error: `Failed to update password: ${updateError.message}` }, { status: 500 })
    }

    // Log the password reset
    try {
      await supabaseAdmin.from("verification_logs").insert({
        email: normalizedEmail,
        user_id: user.id,
        status: "admin_password_reset",
        details: "Password reset by admin",
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("Error logging password reset:", logError)
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      message: "User password has been reset successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Error in reset-user-password route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
