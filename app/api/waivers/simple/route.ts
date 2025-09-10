import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Simple waivers fetch test")
    
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")

    // Create Supabase client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
        global: authHeader
          ? {
              headers: {
                Authorization: authHeader,
              },
            }
          : undefined,
      },
    )

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"

    console.log("Fetching waivers with status:", status)

    // Test 1: Simple waivers query
    console.log("Test 1: Basic waivers query")
    const { data: basicWaivers, error: basicError } = await supabase
      .from("waivers")
      .select("*")
      .eq("status", status)
      .order("claim_deadline", { ascending: true })

    if (basicError) {
      console.error("❌ Basic waivers error:", basicError)
      return NextResponse.json({ 
        error: "Basic waivers query failed", 
        details: basicError.message,
        code: basicError.code 
      }, { status: 500 })
    }

    console.log(`✅ Basic waivers query successful: ${basicWaivers?.length || 0} waivers`)

    // Test 2: Waivers with players
    console.log("Test 2: Waivers with players")
    const { data: waiversWithPlayers, error: playersError } = await supabase
      .from("waivers")
      .select(`
        *,
        players:player_id (
          id,
          salary,
          role
        )
      `)
      .eq("status", status)
      .order("claim_deadline", { ascending: true })

    if (playersError) {
      console.error("❌ Waivers with players error:", playersError)
      return NextResponse.json({ 
        error: "Waivers with players query failed", 
        details: playersError.message,
        code: playersError.code 
      }, { status: 500 })
    }

    console.log(`✅ Waivers with players query successful: ${waiversWithPlayers?.length || 0} waivers`)

    // Test 3: Waivers with players and users
    console.log("Test 3: Waivers with players and users")
    const { data: waiversWithUsers, error: usersError } = await supabase
      .from("waivers")
      .select(`
        *,
        players:player_id (
          id,
          salary,
          role,
          users:user_id (
            id,
            gamer_tag_id,
            primary_position,
            secondary_position,
            console,
            avatar_url
          )
        )
      `)
      .eq("status", status)
      .order("claim_deadline", { ascending: true })

    if (usersError) {
      console.error("❌ Waivers with users error:", usersError)
      return NextResponse.json({ 
        error: "Waivers with users query failed", 
        details: usersError.message,
        code: usersError.code 
      }, { status: 500 })
    }

    console.log(`✅ Waivers with users query successful: ${waiversWithUsers?.length || 0} waivers`)

    // Test 4: Full query
    console.log("Test 4: Full query with all joins")
    const { data: fullWaivers, error: fullError } = await supabase
      .from("waivers")
      .select(`
          *,
          players:player_id (
            id,
            salary,
            role,
            users:user_id (
              id,
              gamer_tag_id,
              primary_position,
              secondary_position,
              console,
              avatar_url
            )
          ),
          waiving_team:waiving_team_id (
            id,
            name,
            logo_url
          ),
          waiver_claims (
            id,
            claiming_team_id,
            priority_at_claim,
            status,
            teams:claiming_team_id (
              name,
              logo_url
            )
          )
        `)
      .eq("status", status)
      .order("claim_deadline", { ascending: true })

    if (fullError) {
      console.error("❌ Full waivers error:", fullError)
      return NextResponse.json({ 
        error: "Full waivers query failed", 
        details: fullError.message,
        code: fullError.code 
      }, { status: 500 })
    }

    console.log(`✅ Full waivers query successful: ${fullWaivers?.length || 0} waivers`)

    // Filter out any waivers with null players
    const validWaivers = fullWaivers?.filter((w) => w.players) || []

    return NextResponse.json({ 
      waivers: validWaivers,
      tests: {
        basic: basicWaivers?.length || 0,
        withPlayers: waiversWithPlayers?.length || 0,
        withUsers: waiversWithUsers?.length || 0,
        full: fullWaivers?.length || 0
      }
    })
  } catch (error: any) {
    console.error("❌ Error in simple waivers GET:", error)
    return NextResponse.json({ 
      error: error.message || "An error occurred",
      stack: error.stack 
    }, { status: 500 })
  }
}
