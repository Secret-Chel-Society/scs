import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("EMERGENCY BYPASS: Reset All Bids API called - bypassing authentication")

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // TEMPORARY SOLUTION: Completely bypass authentication
    // WARNING: This is not secure and should be fixed properly
    console.log("⚠️ Authentication check bypassed - this is a temporary solution")

    // Call the reset_all_bid_timers function
    console.log("Calling reset_all_bid_timers function")
    const { error } = await supabase.rpc("reset_all_bid_timers", { hours_to_add: 10 })

    if (error) {
      console.error("Error calling reset_all_bid_timers:", error)

      // If the function call failed, try using RPC to execute raw SQL
      console.log("Attempting to use RPC to execute SQL directly")

      try {
        const expirationTime = new Date(Date.now() + 36000 * 1000).toISOString()
        const { data, error: rpcError } = await supabase.rpc("run_sql", {
          query: `UPDATE player_bidding SET bid_expires_at = '${expirationTime}' WHERE TRUE;`,
        })

        if (rpcError) {
          console.error("RPC error:", rpcError)
          throw rpcError
        }

        console.log("SQL execution result:", data)
      } catch (sqlError) {
        console.error("SQL execution error:", sqlError)
        throw sqlError
      }
    }

    console.log("Successfully reset all bid timers to 10 hours")

    return NextResponse.json({
      success: true,
      message: "All bid timers have been reset to 10 hours.",
    })
  } catch (error: any) {
    console.error("Error resetting all bids:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Error occurred while resetting bid timers",
      },
      { status: 500 },
    )
  }
}
