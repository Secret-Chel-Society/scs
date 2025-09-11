import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database"

export async function GET() {
  try {
    const supabase = createServerClient<Database>(
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

    // Test 1: Simple waiver count
    const { data: waivers, error: waiversError } = await supabase
      .from("waivers")
      .select("count")
      .limit(1)

    if (waiversError) {
      return NextResponse.json({ 
        step: "waivers_count",
        error: waiversError.message,
        code: waiversError.code,
        details: waiversError.details
      }, { status: 500 })
    }

    // Test 2: Check waiver_priority
    const { data: priority, error: priorityError } = await supabase
      .from("waiver_priority")
      .select("count")
      .limit(1)

    if (priorityError) {
      return NextResponse.json({ 
        step: "priority_count",
        error: priorityError.message,
        code: priorityError.code,
        details: priorityError.details
      }, { status: 500 })
    }

    // Test 3: Try to insert a test waiver (this will show the real error)
    const testData = {
      player_id: "00000000-0000-0000-0000-000000000000",
      waiving_team_id: "00000000-0000-0000-0000-000000000000", 
      claim_deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      status: "active"
    }

    const { data: insertTest, error: insertError } = await supabase
      .from("waivers")
      .insert(testData)
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
      message: "All waiver tests passed",
      waivers_accessible: true,
      priority_accessible: true,
      insert_works: true
    })

  } catch (error: any) {
    return NextResponse.json({ 
      step: "general_error",
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

