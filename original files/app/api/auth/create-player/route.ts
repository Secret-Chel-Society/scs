import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Create a Supabase client with the service role for admin operations
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get the current user from the request
    const cookieStore = cookies()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user:", userError)
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    // Add this after the line that gets the current user:

    console.log("Creating player record for user:", user.id)
    console.log("User metadata:", user.user_metadata)

    // Then, modify the player creation section to ensure we're handling the console field correctly:

    // Check if player record already exists
    const { data: existingPlayer, error: checkError } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing player:", checkError)
      return NextResponse.json({ error: "Failed to check existing player" }, { status: 500 })
    }

    // If player already exists, return success
    if (existingPlayer) {
      return NextResponse.json({ success: true, message: "Player record already exists" })
    }

    // Get user data to ensure we have the correct console value
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (userDataError) {
      console.error("Error fetching user data:", userDataError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Create player record
    const { data: player, error: playerError } = await supabaseAdmin
      .from("players")
      .insert({
        user_id: user.id,
        salary: 0, // Default salary
        role: "player", // Default role
      })
      .select()

    if (playerError) {
      console.error("Error creating player:", playerError)
      return NextResponse.json({ error: "Failed to create player record" }, { status: 500 })
    }

    // Check if user role record exists
    const { data: existingRole, error: checkRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "player")
      .maybeSingle()

    if (checkRoleError) {
      console.error("Error checking existing role:", checkRoleError)
      // Continue anyway, we've already created the player record
    }

    // Create user role record if it doesn't exist
    if (!existingRole) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: user.id,
        role: "player",
      })

      if (roleError) {
        console.error("Error creating user role:", roleError)
        // Continue anyway, we've already created the player record
      }
    }

    // Log the creation
    console.log(`Created player record for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: "Player record created successfully",
      player,
    })
  } catch (error) {
    console.error("Error in create-player route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
