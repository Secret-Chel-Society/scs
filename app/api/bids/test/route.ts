import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("=== TEST API START ===")
    
    // Just return success without any database operations
    const body = await request.json()
    console.log("Request body:", body)
    
    console.log("=== TEST API SUCCESS ===")
    return NextResponse.json({ 
      success: true, 
      message: "Test endpoint working",
      received: body
    })
  } catch (error: any) {
    console.error("=== TEST API ERROR ===")
    console.error("Error:", error)
    
    return NextResponse.json({ 
      error: "Test endpoint error",
      message: error.message
    }, { status: 500 })
  }
}
