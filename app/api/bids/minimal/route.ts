import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("=== MINIMAL BID API START ===")
    
    const supabase = createRouteHandlerClient({ cookies })
    console.log("Supabase client created")

    const { playerId, teamId, bidAmount } = await request.json()
    console.log("Request parsed:", { playerId, teamId, bidAmount })

    // Basic validation
    if (!playerId || !teamId || !bidAmount) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (bidAmount <= 0) {
      console.log("Invalid bid amount")
      return NextResponse.json({ error: "Bid amount must be positive" }, { status: 400 })
    }

    // Test database connection first
    console.log("Testing database connection...")
    const { data: testData, error: testError } = await supabase
      .from("player_bidding")
      .select("id")
      .limit(1)

    if (testError) {
      console.error("Database test failed:", testError)
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: testError.message 
      }, { status: 500 })
    }

    console.log("Database connection successful")

    // Simple bid insertion
    console.log("Attempting bid insertion...")
    const { data, error } = await supabase
      .from("player_bidding")
      .insert({
        player_id: playerId,
        team_id: teamId,
        bid_amount: bidAmount,
        bid_expires_at: new Date(Date.now() + 14400 * 1000).toISOString(),
        status: "Active",
      })
      .select()

    if (error) {
      console.error("Bid insertion failed:", error)
      return NextResponse.json({ 
        error: "Failed to create bid", 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log("Bid created successfully:", data)
    console.log("=== MINIMAL BID API SUCCESS ===")

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("=== MINIMAL BID API ERROR ===")
    console.error("Error:", error)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
