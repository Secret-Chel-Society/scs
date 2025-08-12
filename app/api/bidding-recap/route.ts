import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get the saved bidding recap data
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "bidding_recap_data")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "No recap data available" }, { status: 404 })
    }

    return NextResponse.json(data.value)
  } catch (error) {
    console.error("Error fetching bidding recap:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
