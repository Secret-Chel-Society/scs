import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, adminKey } = await request.json()

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

    // Check if user exists in auth system - using listUsers instead of getUserByEmail
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email,
      },
    })

    let authUserFound = false
    let authUserId = null

    if (authError) {
      console.error("Error checking auth user:", authError)
      return NextResponse.json({ error: `Error checking auth user: ${authError.message}` }, { status: 500 })
    }

    if (authUsers?.users && authUsers.users.length > 0) {
      authUserFound = true
      authUserId = authUsers.users[0].id
    }

    // Check if user exists in database
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

    // Delete from database if found
    if (dbUserFound && dbUserId) {
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
        "players",
      ]

      // Delete from each related table
      for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).delete().eq("user_id", dbUserId)

        if (error && !error.message.includes("does not exist")) {
          console.warn(`Error deleting from ${table}:`, error)
        }
      }

      // Finally delete the user
      const { error: deleteError } = await supabaseAdmin.from("users").delete().eq("id", dbUserId)

      if (deleteError) {
        console.error("Error deleting database user:", deleteError)
        return NextResponse.json({ error: `Error deleting database user: ${deleteError.message}` }, { status: 500 })
      }
    }

    // Delete from auth system if found
    if (authUserFound && authUserId) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)

      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError)
        return NextResponse.json({ error: `Error deleting auth user: ${deleteAuthError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: "User successfully deleted from all systems",
      authUserFound,
      dbUserFound,
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: `Unexpected error: ${error.message}` }, { status: 500 })
  }
}
