import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    // Create admin client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Starting sync of missing users...")

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error("Error fetching auth users:", authError)
      throw authError
    }

    console.log(`Found ${authUsers.users.length} users in auth`)

    // Get all users from public.users table
    const { data: publicUsers, error: publicError } = await supabaseAdmin.from("users").select("id, email")

    if (publicError) {
      console.error("Error fetching public users:", publicError)
      throw publicError
    }

    console.log(`Found ${publicUsers?.length || 0} users in public.users table`)

    // Find missing users
    const publicUserIds = new Set(publicUsers?.map((u) => u.id) || [])
    const missingUsers = authUsers.users.filter((authUser) => !publicUserIds.has(authUser.id))

    console.log(`Found ${missingUsers.length} missing users`)

    const results = {
      total: authUsers.users.length,
      existing: publicUsers?.length || 0,
      missing: missingUsers.length,
      created: 0,
      errors: [] as string[],
    }

    // Create missing user records
    for (const authUser of missingUsers) {
      try {
        console.log(`Creating user record for: ${authUser.email}`)

        // Extract metadata
        const metadata = authUser.user_metadata || {}

        // Create user record
        const userRecord = {
          id: authUser.id,
          email: authUser.email,
          gamer_tag_id: metadata.gamer_tag_id || null,
          primary_position: metadata.primary_position || null,
          secondary_position: metadata.secondary_position || null,
          console: metadata.console || null,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
          is_active: true,
        }

        // Insert user record
        const { error: insertUserError } = await supabaseAdmin.from("users").insert(userRecord)

        if (insertUserError) {
          console.error(`Error creating user ${authUser.email}:`, insertUserError)
          results.errors.push(`Failed to create user ${authUser.email}: ${insertUserError.message}`)
          continue
        }

        // Create player record
        const { error: insertPlayerError } = await supabaseAdmin.from("players").insert({
          user_id: authUser.id,
          role: "Player",
        })

        if (insertPlayerError) {
          console.error(`Error creating player for ${authUser.email}:`, insertPlayerError)
          results.errors.push(`Failed to create player for ${authUser.email}: ${insertPlayerError.message}`)
        }

        // Create user role
        const { error: insertRoleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: authUser.id,
          role: "Player",
        })

        if (insertRoleError) {
          console.error(`Error creating role for ${authUser.email}:`, insertRoleError)
          results.errors.push(`Failed to create role for ${authUser.email}: ${insertRoleError.message}`)
        }

        results.created++
        console.log(`Successfully created records for: ${authUser.email}`)
      } catch (error: any) {
        console.error(`Exception creating user ${authUser.email}:`, error)
        results.errors.push(`Exception creating user ${authUser.email}: ${error.message}`)
      }
    }

    console.log("Sync completed:", results)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error("Error in sync-missing-users:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
