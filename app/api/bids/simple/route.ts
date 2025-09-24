import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Simulate a successful bid without database
    return NextResponse.json({ 
      success: true, 
      message: "Bid placed successfully (simulated)",
      data: {
        id: "simulated-bid-" + Date.now(),
        player_id: body.playerId,
        team_id: body.teamId,
        bid_amount: body.bidAmount,
        bid_expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: "Active"
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Simple endpoint error",
      message: error.message
    }, { status: 500 })
  }
}
