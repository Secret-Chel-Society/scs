import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    console.log("🔍 Testing basic waivers query")

    // Test 1: Simple waivers query
    const { data: waivers, error } = await supabase
      .from("waivers")
      .select("*")
      .limit(5)

    if (error) {
      console.error("❌ Basic waivers query failed:", error)
      return NextResponse.json({ 
        success: false,
        error: "Basic waivers query failed",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`✅ Basic waivers query successful: ${waivers?.length || 0} waivers`)

    return NextResponse.json({ 
      success: true,
      waivers: waivers || [],
      count: waivers?.length || 0
    })

  } catch (error: any) {
    console.error("❌ Error in waivers test:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message || "An error occurred",
      details: error.details || "No additional details"
    }, { status: 500 })
  }
}
