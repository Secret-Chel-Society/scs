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

    // Look up the user in auth system - simplified approach
    let user = null
    let listError = null

    console.log("Searching for user in auth system...")
    
    // Try direct email lookup first (most reliable)
    try {
      const { data: directUser, error: directError } = await supabaseAdmin.auth.admin.getUserByEmail(normalizedEmail)
      if (!directError && directUser?.user) {
        console.log(`Found user via direct email lookup: ${directUser.user.email} (ID: ${directUser.user.id})`)
        user = directUser.user
      } else {
        console.log(`Direct email lookup failed: ${directError?.message || 'No user found'}`)
      }
    } catch (directLookupError) {
      console.log(`Direct email lookup error: ${directLookupError}`)
    }

    // If direct lookup failed, try listing all users
    if (!user) {
      console.log("Direct lookup failed, trying to list all users...")
      const { data: allUsers, error: allUsersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (allUsersError) {
        console.error("Error listing all users:", allUsersError)
        listError = allUsersError
      } else {
        console.log(`Total users in auth system: ${allUsers?.users?.length || 0}`)
        user = allUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)
        console.log(`Manual search found user: ${user ? 'YES' : 'NO'}`)
        if (user) {
          console.log(`Found user via manual search: ${user.email} (ID: ${user.id})`)
        } else {
          // Log all emails for debugging
          console.log("All user emails in auth system:")
          allUsers?.users?.forEach((u, index) => {
            console.log(`${index + 1}. ${u.email} (ID: ${u.id})`)
          })
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
      
      // Double-check if user exists in auth.users (maybe the search missed them)
      console.log("Double-checking if user exists in auth.users...")
      const { data: doubleCheckUsers, error: doubleCheckError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (!doubleCheckError) {
        const existingUser = doubleCheckUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)
        if (existingUser) {
          console.log(`User actually exists in auth.users! ID: ${existingUser.id}`)
          // Use the existing user
          user = existingUser
        }
      }
      
      // If still no user found, create them
      if (!user) {
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
        console.error("Full error details:", JSON.stringify(createError, null, 2))
        return NextResponse.json({ 
          error: `Failed to create user in auth system: ${createError.message}`,
          details: {
            publicUserId: publicUser.id,
            email: publicUser.email,
            authError: createError.message,
            errorCode: createError.status,
            fullError: createError,
            suggestion: "Check if user already exists or if there are validation issues"
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
      } else {
        // User was found in double-check, just update their password
        console.log("User found in double-check, updating password...")
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
        
        if (updateError) {
          console.error("Error updating user password:", updateError)
          return NextResponse.json({ 
            error: `Failed to update password: ${updateError.message}`,
            details: {
              userId: user.id,
              email: user.email,
              authError: updateError.message
            }
          }, { status: 500 })
        }
        
        return NextResponse.json({
          success: true,
          message: "User password updated successfully",
          user: {
            id: user.id,
            email: user.email,
            action: "password_updated"
          },
        })
      }
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
