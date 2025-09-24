import { type NextRequest, NextResponse } from "next/server"
import { createCustomClient } from "@/lib/supabase/custom-client"

export async function GET(request: NextRequest) {
  try {
    console.log("=== TOKEN REDEEMABLES API START ===")

    // Create Supabase client
    const supabase = createCustomClient()

    // Get all active redeemables (no auth required for viewing)
    const { data: redeemables, error: redeemablesError } = await supabase
      .from("token_redeemables")
      .select("id, name, description, cost, requires_approval, category, max_per_season, is_active")
      .eq("is_active", true)
      .order("cost", { ascending: true })

    if (redeemablesError) {
      console.error("❌ Error fetching redeemables:", redeemablesError)
      return NextResponse.json({ error: "Failed to fetch redeemables" }, { status: 500 })
    }

    console.log("✅ Found", redeemables?.length || 0, "redeemables")

    return NextResponse.json({ redeemables: redeemables || [] })
  } catch (error: any) {
    console.error("❌ Token redeemables API error:", error.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
