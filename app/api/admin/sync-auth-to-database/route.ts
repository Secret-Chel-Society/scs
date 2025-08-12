import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { email, adminKey } = await request.json()

    // Verify admin key
    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    console.log(`Starting sync process for email: ${email}`)

    // Step 1: Find user in Supabase Auth (improved with pagination and direct lookup)
    let authUser = null

    // Method 1: Try direct lookup by email
    try {
      const { data: directUserData, error: directError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
      if (!directError && directUserData?.user) {
        authUser = directUserData.user
        console.log(`Found user via direct lookup: ${authUser.id}`)
      }
    } catch (e) {
      console.log("Direct lookup failed, trying list method...")
    }

    // Method 2: If direct lookup failed, search through paginated list
    if (!authUser) {
      let allUsers: any[] = []
      let page = 1
      const perPage = 1000

      while (true) {
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        })

        if (authError) {
          console.error("Error fetching auth users:", authError)
          return NextResponse.json({ error: "Failed to fetch auth users" }, { status: 500 })
        }

        allUsers = [...allUsers, ...authUsers.users]

        if (authUsers.users.length < perPage) {
          break // No more pages
        }
        page++
      }

      console.log(`Searched through ${allUsers.length} total users`)
      authUser = allUsers.find((user) => user.email === email)
    }

    if (!authUser) {
      return NextResponse.json({ error: "User not found in auth system" }, { status: 404 })
    }

    console.log(`Found auth user: ${authUser.id}`)

    // Step 2: Check if user exists in public.users table
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    let publicUserId = null

    if (userCheckError && userCheckError.code !== "PGRST116") {
      console.error("Error checking existing user:", userCheckError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingUser) {
      console.log(`User already exists in public.users: ${existingUser.id}`)
      publicUserId = existingUser.id
    } else {
      // Step 3: Create user in public.users table
      console.log("Creating user in public.users table...")

      const userData = {
        id: authUser.id, // Use the same ID from auth
        email: authUser.email,
        gamer_tag_id: authUser.user_metadata?.gamer_tag_id || null,
        primary_position: authUser.user_metadata?.primary_position || null,
        secondary_position: authUser.user_metadata?.secondary_position || null,
        console: authUser.user_metadata?.console || null,
        is_active: true,
        created_at: authUser.created_at,
        updated_at: new Date().toISOString(),
      }

      const { data: newUser, error: createUserError } = await supabaseAdmin
        .from("users")
        .insert(userData)
        .select()
        .single()

      if (createUserError) {
        console.error("Error creating user:", createUserError)
        return NextResponse.json({ error: "Failed to create user record" }, { status: 500 })
      }

      console.log(`Created user in public.users: ${newUser.id}`)
      publicUserId = newUser.id
    }

    // Step 4: Check if player record exists
    const { data: existingPlayer, error: playerCheckError } = await supabaseAdmin
      .from("players")
      .select("*")
      .eq("user_id", publicUserId)
      .single()

    if (playerCheckError && playerCheckError.code !== "PGRST116") {
      console.error("Error checking existing player:", playerCheckError)
      return NextResponse.json({ error: "Database error checking player" }, { status: 500 })
    }

    if (!existingPlayer) {
      // Step 5: Create player record
      console.log("Creating player record...")

      const { data: newPlayer, error: createPlayerError } = await supabaseAdmin
        .from("players")
        .insert({
          user_id: publicUserId,
          role: "Player",
          salary: 0,
          team_id: null,
        })
        .select()
        .single()

      if (createPlayerError) {
        console.error("Error creating player:", createPlayerError)
        return NextResponse.json({ error: "Failed to create player record" }, { status: 500 })
      }

      console.log(`Created player record: ${newPlayer.id}`)
    } else {
      console.log(`Player record already exists: ${existingPlayer.id}`)
    }

    // Step 6: Check if user_roles record exists
    const { data: existingRoles, error: rolesCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", publicUserId)

    if (rolesCheckError) {
      console.error("Error checking existing roles:", rolesCheckError)
      return NextResponse.json({ error: "Database error checking roles" }, { status: 500 })
    }

    if (!existingRoles || existingRoles.length === 0) {
      // Step 7: Create user_roles record
      console.log("Creating user_roles record...")

      const { data: newRole, error: createRoleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: publicUserId,
          role: "Player",
        })
        .select()
        .single()

      if (createRoleError) {
        console.error("Error creating user role:", createRoleError)
        return NextResponse.json({ error: "Failed to create user role" }, { status: 500 })
      }

      console.log(`Created user_roles record: ${newRole.id}`)
    } else {
      console.log(`User roles already exist: ${existingRoles.length} roles`)
    }

    return NextResponse.json({
      success: true,
      message: "User successfully synced from auth to database",
      details: {
        authUserId: authUser.id,
        publicUserId: publicUserId,
        email: email,
        verified: authUser.email_confirmed_at ? true : false,
      },
    })
  } catch (error) {
    console.error("Unexpected error in sync-auth-to-database:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
