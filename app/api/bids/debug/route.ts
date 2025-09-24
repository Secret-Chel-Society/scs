import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Test basic database connectivity
    const { data: testData, error: testError } = await supabase
      .from("player_bidding")
      .select("id, player_id, team_id, bid_amount, status")
      .limit(1)

    if (testError) {
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: testError.message,
        code: testError.code
      }, { status: 500 })
    }

    // Test system settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("key, value")
      .limit(1)

    return NextResponse.json({ 
      success: true,
      database: "Connected",
      player_bidding_sample: testData,
      system_settings_sample: settingsData,
      settings_error: settingsError?.message
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Debug endpoint failed",
      details: error.message
    }, { status: 500 })
  }
}
