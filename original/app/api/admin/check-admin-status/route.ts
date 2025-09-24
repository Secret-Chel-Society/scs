import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "No session found",
        },
        { status: 401 },
      )
    }

    // Check for Admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError) {
      return NextResponse.json(
        {
          authenticated: true,
          isAdmin: false,
          error: adminRoleError.message,
        },
        { status: 500 },
      )
    }

    const isAdmin = adminRoleData && adminRoleData.length > 0

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
      userId: session.user.id,
      email: userData?.email,
      adminRoles: adminRoleData,
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
