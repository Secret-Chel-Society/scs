import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    // Create admin client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("Finding orphaned auth users...")

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error("Error fetching auth users:", authError)
      throw authError
    }

    console.log(`Found ${authUsers.users.length} auth users`)

    // Get all users from public.users table
    const { data: publicUsers, error: publicError } = await supabaseAdmin.from("users").select("id, email")

    if (publicError) {
      console.error("Error fetching public users:", publicError)
      throw publicError
    }

    console.log(`Found ${publicUsers?.length || 0} public users`)

    // Find orphaned users (exist in auth but not in public.users)
    const orphanedUsers = []
    const publicUserIds = new Set(publicUsers?.map((u) => u.id) || [])

    for (const authUser of authUsers.users) {
      if (!publicUserIds.has(authUser.id)) {
        orphanedUsers.push({
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          email_confirmed_at: authUser.email_confirmed_at,
          last_sign_in_at: authUser.last_sign_in_at,
          user_metadata: authUser.user_metadata,
          app_metadata: authUser.app_metadata,
        })
      }
    }

    console.log(`Found ${orphanedUsers.length} orphaned auth users`)

    return NextResponse.json({
      success: true,
      total_auth_users: authUsers.users.length,
      total_public_users: publicUsers?.length || 0,
      orphaned_users: orphanedUsers,
    })
  } catch (error: any) {
    console.error("Error finding orphaned auth users:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
