import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: "Missing Supabase environment variables",
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }, { status: 500 })
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
      },
    )

    // Test basic connection
    const { data, error } = await supabase
      .from("teams")
      .select("count")
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        error: "Supabase connection failed",
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection working",
      supabaseUrl: supabaseUrl.substring(0, 20) + "...",
      hasKey: !!supabaseKey
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
