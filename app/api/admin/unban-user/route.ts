import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }

    console.log("Unban API called") // Debug log

    const body = await request.json()
    console.log("Request body:", body) // Debug log

    const { userId } = body

    if (!userId) {
      console.log("Missing userId in request")
      return NextResponse.json({ error: "Missing required field: userId" }, { status: 400 })
    }

    console.log("Unbanning user:", userId)

    // First check if user exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id, is_banned, ban_reason")
      .eq("id", userId)
      .single()

    if (checkError) {
      console.error("Error checking user:", checkError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("Found user:", existingUser)

    // Update user ban status
    const { data: updateData, error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({
        is_banned: false,
        ban_reason: null,
        ban_expiration: null,
      })
      .eq("id", userId)
      .select()

    if (userUpdateError) {
      console.error("Error updating user ban status:", userUpdateError)
      return NextResponse.json({ error: userUpdateError.message }, { status: 500 })
    }

    console.log("User unbanned successfully:", updateData)

    return NextResponse.json({
      message: "User unbanned successfully",
      user: updateData?.[0],
    })
  } catch (error: any) {
    console.error("Unexpected error during unban:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
