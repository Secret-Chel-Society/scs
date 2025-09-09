// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { processExpiredBids } from "@/lib/auto-bid-processor"

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🚀 Starting automatic expired bids processing...")

    // Use the new automatic bid processor
    const result = await processExpiredBids()

    if (result.success) {
      console.log(`✅ Automatic bid processing completed: ${result.message}`)
      return NextResponse.json({
        success: true,
        message: result.message,
        processed: result.processed,
        errors: result.errors.length > 0 ? result.errors : undefined,
        details: result.details
      })
    } else {
      console.error(`❌ Automatic bid processing failed: ${result.message}`)
      return NextResponse.json({
        success: false,
        message: result.message,
        processed: result.processed,
        errors: result.errors
      }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Error in automatic bid processing:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      message: "Failed to process expired bids"
    }, { status: 500 })
  }
}
