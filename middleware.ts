import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  // Create a response object that we'll manipulate
  const response = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
      // Also check for Authorization header
      global: {
        headers: {
          Authorization: request.headers.get("Authorization") || "",
        },
      },
    },
  )

  return response
}

// Only run middleware on API routes that need authentication
export const config = {
  matcher: [
    "/api/waivers/:path*",
    "/api/waivers/claim/:path*",
    "/api/trades/:path*",
    "/api/lineups/:path*",
    "/api/management/:path*",
    "/api/bids/:path*",
    "/api/admin/ban-user/:path*",
    "/api/admin/unban-user/:path*",
  ],
}
