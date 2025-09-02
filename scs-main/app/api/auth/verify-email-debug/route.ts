import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { token, email, type = "signup" } = await request.json()

    console.log("=== EMAIL VERIFICATION DEBUG START ===")
    console.log("Request data:", { token: token ? "provided" : "missing", email, type })

    if (!token && !email) {
      return NextResponse.json({ error: "Token or email is required" }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let result
    let userWasVerified = false

    if (token) {
      console.log("Attempting to verify token...")

      // If token is provided, use it directly
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: type === "recovery" ? "recovery" : "email",
      })

      if (error) {
        console.error("Token verification error:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      console.log("Token verification successful:", { userId: data?.user?.id, email: data?.user?.email })
      result = data
      userWasVerified = true
    } else if (email) {
      console.log("Resending verification email for:", email)

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
      console.log("Starting automatic user creation process...")

      try {
        const creationResult = await createUserProfile(result.user.id, result.user.email, supabaseAdmin)
        console.log("User creation result:", creationResult)

        return NextResponse.json({
          success: true,
          user: result?.user || null,
          session: result?.session || null,
          autoRefreshed: true,
          creationDetails: creationResult,
        })
      } catch (refreshError) {
        console.error("Error during automatic user creation:", refreshError)

        return NextResponse.json({
          success: true,
          user: result?.user || null,
          session: result?.session || null,
          autoRefreshed: false,
          error: "Verification successful but user creation failed: " + refreshError.message,
        })
      }
    }

    console.log("=== EMAIL VERIFICATION DEBUG END ===")
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
