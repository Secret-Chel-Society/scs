// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { checkRateLimit, checkSuspiciousActivity, isIPBlocked } from "@/lib/security-monitor"

export async function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Check if IP is blocked
  if (isIPBlocked(ip)) {
    console.warn('🚫 Blocked IP attempted access:', ip);
    return new NextResponse('Access Denied', { status: 403 });
  }
  
  // Rate limiting
  if (!checkRateLimit(ip, 100, 60000)) { // 100 requests per minute
    console.warn('🚫 Rate limit exceeded for IP:', ip);
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  
  // Check for suspicious activity
  if (checkSuspiciousActivity(ip, userAgent, {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  })) {
    console.warn('🚨 Suspicious activity detected from IP:', ip);
    // Don't block, but log for monitoring
  }
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
    // "/api/bids/:path*", // Temporarily disabled to test bidding system
    "/api/admin/ban-user/:path*",
    "/api/admin/unban-user/:path*",
  ],
}
