import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({
        authenticated: false,
        error: authError.message,
        details: "Failed to get user from Supabase auth"
      })
    }

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        error: "No user found in session",
        details: "User not authenticated"
      })
    }

    // Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email
        },
        error: "Failed to get user roles",
        details: rolesError.message
      })
    }

    const isAdmin = userRoles?.some((ur: any) => ur.role === "Admin") || false

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      roles: userRoles?.map((ur: any) => ur.role) || [],
      isAdmin,
      details: "User authenticated successfully"
    })
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message,
      details: "Unexpected error occurred"
    })
  }
}
