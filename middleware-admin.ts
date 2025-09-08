// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  // Only apply to admin routes
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Create a response object that we'll manipulate
  const response = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          // This is used for setting cookies in the response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // This is used for removing cookies in the response
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  try {
    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session, redirect to login
    if (!session) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("message", "You must be logged in to access admin pages")
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has admin role
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (rolesError) {
      console.error("Error checking admin role:", rolesError)
      return NextResponse.redirect(new URL("/?error=Failed to verify admin status", request.url))
    }

    const isAdmin = roles?.some((role) => role.role === "Admin") || false

    // If not admin, redirect to home
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/?message=You do not have permission to access admin pages", request.url))
    }

    // User is admin, allow access
    return response
  } catch (error) {
    console.error("Admin middleware error:", error)
    return NextResponse.redirect(new URL("/?error=An error occurred while checking permissions", request.url))
  }
}

// Apply this middleware only to admin routes
export const config = {
  matcher: ["/admin/:path*"],
}
// This file already protects all /admin/* routes, so /admin/user-diagnostics is already protected.
// No changes needed here as it's already configured to check for admin role.
