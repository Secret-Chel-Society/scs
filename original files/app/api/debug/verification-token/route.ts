import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")
    const email = url.searchParams.get("email")

    if (!token && !email) {
      return NextResponse.json({ error: "Token or email is required" }, { status: 400 })
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    let query = supabaseAdmin.from("email_verification_tokens").select("*")

    if (token) {
      query = query.eq("token", token)
    } else if (email) {
      query = query.eq("email", email.toLowerCase().trim())
    }

    const { data: tokens, error } = await query.order("created_at", { ascending: false }).limit(5)

    if (error) {
      console.error("Error fetching verification tokens:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Don't return the actual tokens in production, just metadata
    const tokenInfo = tokens?.map((t) => ({
      id: t.id,
      email: t.email,
      user_id: t.user_id,
      used: t.used,
      expires_at: t.expires_at,
      created_at: t.created_at,
      token_preview: t.token ? `${t.token.substring(0, 8)}...` : null,
      expired: new Date(t.expires_at) < new Date(),
    }))

    return NextResponse.json({
      tokens: tokenInfo,
      count: tokens?.length || 0,
    })
  } catch (error) {
    console.error("Error in debug verification token route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
