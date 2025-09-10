import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
      },
    )

    // Test 1: Simple waivers query
    console.log("Testing simple waivers query...")
    const { data: waivers, error: waiversError } = await supabase
      .from("waivers")
      .select("*")
      .limit(5)

    if (waiversError) {
      return NextResponse.json({ 
        error: "Waivers query failed", 
        details: waiversError.message,
        code: waiversError.code 
      }, { status: 500 })
    }

    // Test 2: Players query
    console.log("Testing players query...")
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, user_id, team_id")
      .limit(5)

    if (playersError) {
      return NextResponse.json({ 
        error: "Players query failed", 
        details: playersError.message,
        code: playersError.code 
      }, { status: 500 })
    }

    // Test 3: Users query
    console.log("Testing users query...")
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, gamer_tag_id")
      .limit(5)

    if (usersError) {
      return NextResponse.json({ 
        error: "Users query failed", 
        details: usersError.message,
        code: usersError.code 
      }, { status: 500 })
    }

    // Test 4: Teams query
    console.log("Testing teams query...")
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .limit(5)

    if (teamsError) {
      return NextResponse.json({ 
        error: "Teams query failed", 
        details: teamsError.message,
        code: teamsError.code 
      }, { status: 500 })
    }

    // Test 5: Complex join query
    console.log("Testing complex join query...")
    const { data: complex, error: complexError } = await supabase
      .from("waivers")
      .select(`
        *,
        players:player_id (
          id,
          salary,
          users:user_id (
            id,
            gamer_tag_id
          )
        ),
        waiving_team:waiving_team_id (
          id,
          name
        )
      `)
      .limit(3)

    if (complexError) {
      return NextResponse.json({ 
        error: "Complex query failed", 
        details: complexError.message,
        code: complexError.code 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results: {
        waivers: waivers?.length || 0,
        players: players?.length || 0,
        users: users?.length || 0,
        teams: teams?.length || 0,
        complex: complex?.length || 0
      }
    })

  } catch (error: any) {
    console.error("Debug error:", error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
