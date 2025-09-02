import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Discord integration is disabled - return success without doing anything
    return NextResponse.json({
      success: true,
      message: "Discord integration is disabled",
    })
  } catch (error: any) {
    console.error("Error in Discord test:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
