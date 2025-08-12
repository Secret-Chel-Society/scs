import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: "Authentication error", details: sessionError }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: "Not authenticated", authenticated: false }, { status: 401 })
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (rolesError) {
      return NextResponse.json(
        {
          error: "Failed to check permissions",
          details: rolesError,
          authenticated: true,
          userId: session.user.id,
          email: session.user.email,
        },
        { status: 500 },
      )
    }

    // Check if user has any admin-related role
    const roles = userRoles?.map((r) => r.role) || []
    const isAdmin =
      userRoles?.some(
        (r) =>
          r.role &&
          (r.role.toLowerCase().includes("admin") ||
            r.role.toLowerCase().includes("owner") ||
            r.role.toLowerCase().includes("league manager")),
      ) || false

    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      roles: roles,
      isAdmin: isAdmin,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
