import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This endpoint should be called by a cron job every Saturday at 8 AM EST
export async function POST(request: Request) {
  try {
    // Verify the request is coming from a trusted source (Vercel cron job)
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Call the reset_waiver_priority function
    const { data: result, error } = await supabaseAdmin.rpc("reset_waiver_priority")

    if (error) {
      console.error("Error resetting waiver priority:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Waiver priority reset successfully",
      teamsUpdated: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
