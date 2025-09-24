import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("Admin check request received")
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("Admin check session:", { hasSession: !!session, userId: session?.user?.id })

    if (!session) {
      console.log("No session found in admin check, returning 401")
      return NextResponse.json(
        {
          authenticated: false,
          error: "No session found",
        },
        { status: 401 },
      )
    }

    // Check for all user roles
    const { data: userRolesData, error: userRolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (userRolesError) {
      return NextResponse.json(
        {
          authenticated: true,
          isAdmin: false,
          role: null,
          error: userRolesError.message,
        },
        { status: 500 },
      )
    }

    const roles = userRolesData?.map(r => r.role) || []
    const isAdmin = roles.includes("Admin")
    const primaryRole = roles.length > 0 ? roles[0] : null

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      return NextResponse.json(
        {
          authenticated: true,
          isAdmin,
          error: userError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      role: primaryRole,
      roles: roles,
      userId: session.user.id,
      email: userData?.email,
    })
  } catch (error: any) {
    console.error("Error checking admin status:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred while checking admin status",
      },
      { status: 500 },
    )
  }
}
