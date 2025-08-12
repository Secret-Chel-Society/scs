import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Test IP debug endpoint called")

    return NextResponse.json({
      success: true,
      message: "IP debug test endpoint is working",
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    })
  } catch (error) {
    console.error("Test IP debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
