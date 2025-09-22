import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    console.log("=== CODE EXCHANGE DEBUG ===")
    console.log("Code:", code)

    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: "Missing Supabase environment variables",
        details: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 })
    }

    // Create the Supabase admin client
    const supabase = createAdminClient()
    console.log("Supabase client created successfully")

    // Try to exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code:", error)
      return NextResponse.json({ 
        error: error.message,
        details: error,
        code: code
      }, { status: 500 })
    }

    console.log("Code exchanged successfully")
    return NextResponse.json({
      success: true,
      message: "Code exchanged successfully",
      session: data,
      code: code
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error
      },
      { status: 500 },
    )
  }
}
