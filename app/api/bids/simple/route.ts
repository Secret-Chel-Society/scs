import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Just return the data we received
    return NextResponse.json({ 
      success: true, 
      message: "Simple endpoint working",
      received: body
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Simple endpoint error",
      message: error.message
    }, { status: 500 })
  }
}
