import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log("=== FRESH VERIFICATION START ===")
    console.log("Email:", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Step 1: Find the user in Supabase Auth by email
    console.log("Step 1: Looking up user in Supabase Auth...")
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error("Error listing users:", listError)
      return NextResponse.json({ error: "Failed to lookup user" }, { status: 500 })
    }

    const authUser = authUsers.users.find((user) => user.email === email)

    if (!authUser) {
      console.log("User not found in Supabase Auth")
      return NextResponse.json({ error: "User not found in authentication system" }, { status: 404 })
    }

    console.log("✅ User found in auth:", {
      id: authUser.id,
      email: authUser.email,
      confirmed: authUser.email_confirmed_at,
    })

    // Step 2: Check if user is already confirmed
    if (!authUser.email_confirmed_at) {
      console.log("❌ User email is not confirmed yet")

      // Try to manually confirm the user
      console.log("Attempting to manually confirm user...")
      const { data: confirmData, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
      })

      if (confirmError) {
        console.error("Failed to manually confirm user:", confirmError)
        return NextResponse.json(
          {
            error: "User email is not confirmed and manual confirmation failed",
            details: confirmError.message,
          },
          { status: 400 },
        )
      }

      console.log("✅ User manually confirmed")
    } else {
      console.log("✅ User email already confirmed")
    }

    // Step 3: Create user profile
    console.log("Step 3: Creating user profile...")
    const creationResult = await createUserProfile(authUser.id, authUser.email!, supabaseAdmin)

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        confirmed: true,
      },
      creationResult,
    })
  } catch (error) {
    console.error("Fresh verification error:", error)
    return NextResponse.json({ error: "An unexpected error occurred: " + error.message }, { status: 500 })
  }
}

// Enhanced user creation function with detailed logging
async function createUserProfile(userId: string, email: string, supabaseAdmin: any) {
  const steps = {
    authUserFetch: false,
    publicUserCheck: false,
    publicUserCreate: false,
    playerRecordCheck: false,
    playerRecordCreate: false,
    userRolesCheck: false,
    userRolesCreate: false,
  }

  try {
    console.log(`Starting user profile creation for ${email} (${userId})`)

    // Step 1: Get the user's auth data
    console.log("Step 1: Fetching auth user data...")
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser.user) {
      throw new Error(`Failed to get auth user: ${authError?.message}`)
    }
    steps.authUserFetch = true
    console.log("✅ Auth user data fetched successfully")

    // Step 2: Check if user exists in public.users table
    console.log("Step 2: Checking if user exists in public.users...")
    const { data: publicUser, error: publicUserError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    steps.publicUserCheck = true

    if (publicUserError && publicUserError.code !== "PGRST116") {
      throw new Error(`Failed to check public user: ${publicUserError.message}`)
    }

    // Step 3: Create user if doesn't exist
    if (!publicUser) {
      console.log("Step 3: Creating public user record...")

      const metadata = authUser.user.user_metadata || {}
      console.log("User metadata:", metadata)

      // Validate and fix console value
      let consoleValue = metadata.console || "Xbox"
      if (!["Xbox", "PS5"].includes(consoleValue)) {
        const originalConsole = consoleValue
        if (["XSX", "Xbox Series X", "XBOX", "xbox"].includes(consoleValue)) {
          consoleValue = "Xbox"
        } else if (["PlayStation 5", "PS", "PlayStation", "ps5"].includes(consoleValue)) {
          consoleValue = "PS5"
        } else {
          consoleValue = "Xbox"
        }
        console.log(`Console value fixed: ${originalConsole} → ${consoleValue}`)
      }

      const userRecord = {
        id: userId,
        email: authUser.user.email,
        gamer_tag_id: metadata.gamer_tag_id || authUser.user.email?.split("@")[0] || "Unknown",
        primary_position: metadata.primary_position || "Center",
        secondary_position: metadata.secondary_position || null,
        console: consoleValue,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Creating user with data:", userRecord)

      const { error: createUserError } = await supabaseAdmin.from("users").insert(userRecord)

      if (createUserError) {
        throw new Error(`Failed to create public user: ${createUserError.message}`)
      }

      steps.publicUserCreate = true
      console.log("✅ Public user record created successfully")
    } else {
      console.log("✅ Public user already exists, updating active status...")

      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        console.log(`⚠️ Warning: Failed to update user active status: ${updateError.message}`)
      } else {
        console.log("✅ User active status updated")
      }
    }

    // Step 4: Check if player record exists
    console.log("Step 4: Checking player record...")
    const { data: playerData, error: playerError } = await supabaseAdmin
      .from("players")
      .select("*")
      .eq("user_id", userId)

    steps.playerRecordCheck = true

    if (playerError && playerError.code !== "PGRST116") {
      throw new Error(`Failed to check player record: ${playerError.message}`)
    }

    // Step 5: Create player record if it doesn't exist
    if (!playerData || playerData.length === 0) {
      console.log("Step 5: Creating player record...")

      const { error: createPlayerError } = await supabaseAdmin.from("players").insert({
        user_id: userId,
        role: "Player",
        salary: 0,
      })

      if (createPlayerError) {
        throw new Error(`Failed to create player record: ${createPlayerError.message}`)
      }

      steps.playerRecordCreate = true
      console.log("✅ Player record created successfully")
    } else {
      console.log("✅ Player record already exists")
    }

    // Step 6: Check if user has roles in user_roles table
    console.log("Step 6: Checking user roles...")
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)

    steps.userRolesCheck = true

    if (rolesError) {
      throw new Error(`Failed to check user roles: ${rolesError.message}`)
    }

    // Step 7: Add default Player role if no roles exist
    if (!userRoles || userRoles.length === 0) {
      console.log("Step 7: Adding default Player role...")

      const { error: addRoleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "Player",
      })

      if (addRoleError) {
        throw new Error(`Failed to add default role: ${addRoleError.message}`)
      }

      steps.userRolesCreate = true
      console.log("✅ Default Player role added successfully")
    } else {
      console.log(
        "✅ User roles already exist:",
        userRoles.map((r) => r.role),
      )
    }

    console.log("🎉 User profile creation completed successfully!")
    return {
      success: true,
      steps,
      message: "User profile created successfully",
    }
  } catch (error) {
    console.error(`❌ Error creating user profile for ${email}:`, error)
    return {
      success: false,
      steps,
      error: error.message,
    }
  }
}
