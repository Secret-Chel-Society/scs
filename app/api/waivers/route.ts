import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No or invalid authorization header")
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "")
    
    if (!token) {
      console.error("No token found in authorization header")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Create Supabase client with the token
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {},
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Validate token
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user from token:", userError)
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 })
    }

    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 })
    }

    // Rest of your existing POST handler code...
    return NextResponse.json({ error: "Not implemented" }, { status: 501 })

  } catch (error: any) {
    console.error("Error in waivers POST:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // [Previous GET handler implementation...]
    return NextResponse.json({ waivers: [] })
  } catch (error: any) {
    console.error("Error in waivers GET:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}