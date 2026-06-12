import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, adminKey } = await request.json()

    console.log("Delete user request for email:", email)

    // Validate admin key
    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 403 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Checking auth system for user...")
    let authUser = null
    let page = 1
    const perPage = 1000 // Max per page

    // Search through all pages to find the user
    while (true) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (authError) {
        console.error("Error listing auth users:", authError)
        return NextResponse.json({ error: `Error checking auth user: ${authError.message}` }, { status: 500 })
      }

      // Find user by email (case-insensitive)
      const foundUser = authData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

      if (foundUser) {
        authUser = foundUser
        break
      }

      // If we got fewer users than perPage, we've reached the end
      if (!authData?.users || authData.users.length < perPage) {
        break
      }

      page++
    }

    const authUserFound = !!authUser
    const authUserId = authUser?.id

    console.log("Auth user found:", authUserFound, "ID:", authUserId)

    // Check if user exists in database
    console.log("Checking database for user...")
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle()

    if (dbError) {
      console.error("Error checking database user:", dbError)
      return NextResponse.json({ error: `Error checking database user: ${dbError.message}` }, { status: 500 })
    }

    const dbUserFound = !!dbUser
    const dbUserId = dbUser?.id

    console.log("Database user found:", dbUserFound, "ID:", dbUserId)

    // If user not found in either system
    if (!authUserFound && !dbUserFound) {
      return NextResponse.json(
        {
          message: "User not found in either system",
          authUserFound,
          dbUserFound,
        },
        { status: 404 },
      )
    }

    // IMPORTANT: Delete database records FIRST, before deleting auth user
    // This prevents foreign key constraint errors in the auth system
    if (dbUserFound && dbUserId) {
      console.log("Deleting user from database (must happen before auth deletion)...")
      // Delete related records first
      const tables = [
        "player_bidding",
        "player_statistics",
        "team_managers",
        "lineups",
        "verification_logs",
        "email_verification_tokens",
        "discord_users",
        "waiver_claims",
        "waiver_priority",
        "forum_posts",
        "forum_comments",
        "forum_votes",
        "forum_replies",
        "season_registrations",
        "user_roles",
        "notifications",
        "admin_actions",
        "release_requests",
        "trades",
        "trade_items",
        "players",
        "whl_players",
        "ip_logs",
        // Note: whl_users is handled separately below (uses 'id' column instead of 'user_id')
      ]

      // Delete from each related table
      for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).delete().eq("user_id", dbUserId)

        if (error && !error.message.includes("does not exist")) {
          console.warn(`Warning deleting from ${table}:`, error.message)
        }
      }

      // Also try deleting where the user is a target (for admin_actions)
      await supabaseAdmin.from("admin_actions").delete().eq("target_user_id", dbUserId)

      // Delete from whl_users separately (uses 'id' column, not 'user_id')
      console.log("Deleting from whl_users table...")
      const { error: whlError } = await supabaseAdmin.from("whl_users").delete().eq("id", dbUserId)
      if (whlError && !whlError.message.includes("does not exist")) {
        console.warn("Warning deleting from whl_users:", whlError.message)
      }

      // Delete the user record from the users table
      const { error: deleteError } = await supabaseAdmin.from("users").delete().eq("id", dbUserId)

      if (deleteError) {
        console.error("Error deleting database user:", deleteError)
        return NextResponse.json(
          {
            error: `Failed to delete database user: ${deleteError.message}`,
            details: deleteError,
          },
          { status: 500 },
        )
      }
      console.log("Successfully deleted user from database")
    }

    // NOW delete from auth system (after database records are cleaned up)
    if (authUserFound && authUserId) {
      console.log("Deleting user from auth system...")
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)

      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError)
        return NextResponse.json(
          {
            error: `Failed to delete auth user: ${deleteAuthError.message}`,
            details: deleteAuthError,
            note: "Database records were deleted but auth deletion failed",
          },
          { status: 500 },
        )
      }
      console.log("Successfully deleted user from auth system")
    }

    console.log("User deletion completed successfully")
    return NextResponse.json({
      message: "User successfully deleted from all systems",
      authUserFound,
      dbUserFound,
      authUserId,
      dbUserId,
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: `Unexpected error: ${error.message}` }, { status: 500 })
  }
}
