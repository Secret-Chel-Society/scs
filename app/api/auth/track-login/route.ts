// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { logIpFromRequest } from "@/lib/ip-tracking"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Log IP address for login
    const ipLogResult = await logIpFromRequest(request, user.id, 'login')
    
    if (ipLogResult.success) {
      console.log("✅ IP address logged for login:", user.id)
      return NextResponse.json({ 
        success: true, 
        message: "Login tracked successfully" 
      })
    } else {
      console.warn("⚠️ Failed to log IP address for login:", ipLogResult.error)
      return NextResponse.json({ 
        success: false, 
        error: ipLogResult.error 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("❌ Exception tracking login:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
