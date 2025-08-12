import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("Update Bid Expiration API called")

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Instead of trying to create/update the function and trigger,
    // let's directly update all the bids to expire in 10 hours
    console.log("Updating all active bids to expire in 10 hours")

    // Calculate the new expiration time (10 hours from now)
    const tenHoursFromNow = new Date()
    tenHoursFromNow.setHours(tenHoursFromNow.getHours() + 10)

    // Update all active bids
    const { data, error } = await supabase
      .from("player_bidding")
      .update({
        bid_expires_at: tenHoursFromNow.toISOString(),
      })
      .gt("bid_expires_at", new Date().toISOString())
      .select()

    if (error) {
      console.error("Error updating bids:", error)
      throw error
    }

    console.log(`Updated ${data?.length || 0} bids to expire in 10 hours`)

    return NextResponse.json({
      success: true,
      message: `Updated ${data?.length || 0} bids to expire in 10 hours`,
      updatedBids: data?.length || 0,
    })
  } catch (error: any) {
    console.error("Error updating bid expiration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
