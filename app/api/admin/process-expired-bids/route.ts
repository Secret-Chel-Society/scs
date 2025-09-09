// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { processExpiredBids, getBiddingStats } from "@/lib/auto-bid-processor"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function POST(request: Request) {
  try {
    // Get the current user from the request
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "Admin")
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log(`🔧 Admin ${user.email} manually triggered bid processing`)

    // Process expired bids
    const result = await processExpiredBids()

    return NextResponse.json({
      success: result.success,
      message: result.message,
      processed: result.processed,
      errors: result.errors.length > 0 ? result.errors : undefined,
      details: result.details,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("❌ Error in manual bid processing:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      message: "Failed to process expired bids"
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Get the current user from the request
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "Admin")
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get bidding statistics
    const stats = await getBiddingStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("❌ Error fetching bidding stats:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      message: "Failed to fetch bidding statistics"
    }, { status: 500 })
  }
}
