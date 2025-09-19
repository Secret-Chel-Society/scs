import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: "API is working",
      timestamp: new Date().toISOString(),
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to test API",
      },
      { status: 500 }
    )
  }
}
