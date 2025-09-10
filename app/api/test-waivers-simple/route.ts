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

    // Test 1: Check if waivers table exists and is accessible
    const { data: waivers, error: waiversError } = await supabase
      .from("waivers")
      .select("count")
      .limit(1)

    if (waiversError) {
      return NextResponse.json({ 
        step: "waivers_table_check",
        error: waiversError.message,
        code: waiversError.code,
        details: waiversError.details,
        hint: waiversError.hint
      }, { status: 500 })
    }

    // Test 2: Check if players table is accessible
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("count")
      .limit(1)

    if (playersError) {
      return NextResponse.json({ 
        step: "players_table_check",
        error: playersError.message,
        code: playersError.code,
        details: playersError.details,
        hint: playersError.hint
      }, { status: 500 })
    }

    // Test 3: Check if teams table is accessible
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("count")
      .limit(1)

    if (teamsError) {
      return NextResponse.json({ 
        step: "teams_table_check",
        error: teamsError.message,
        code: teamsError.code,
        details: teamsError.details,
        hint: teamsError.hint
      }, { status: 500 })
    }

    // Test 4: Check if users table is accessible
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("count")
      .limit(1)

    if (usersError) {
      return NextResponse.json({ 
        step: "users_table_check",
        error: usersError.message,
        code: usersError.code,
        details: usersError.details,
        hint: usersError.hint
      }, { status: 500 })
    }

    // Test 5: Try a simple waiver insert
    const testWaiver = {
      player_id: "00000000-0000-0000-0000-000000000000", // dummy UUID
      waiving_team_id: "00000000-0000-0000-0000-000000000000", // dummy UUID
      claim_deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      status: "active"
    }

    const { data: insertTest, error: insertError } = await supabase
      .from("waivers")
      .insert(testWaiver)
      .select()

    if (insertError) {
      return NextResponse.json({ 
        step: "waiver_insert_test",
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 })
    }

    // Clean up test data
    if (insertTest && insertTest[0]) {
      await supabase.from("waivers").delete().eq("id", insertTest[0].id)
    }

    return NextResponse.json({
      success: true,
      message: "All tests passed - waiver system is working",
      steps_completed: [
        "waivers_table_check",
        "players_table_check", 
        "teams_table_check",
        "users_table_check",
        "waiver_insert_test"
      ]
    })

  } catch (error: any) {
    console.error("Test error:", error)
    return NextResponse.json({ 
      step: "general_error",
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
