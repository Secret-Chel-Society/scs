import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Get current bidding status
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "bidding_enabled")
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is fine
      console.log("No bidding_enabled setting found, defaulting to false")
      return NextResponse.json({ enabled: false })
    }

    const enabled = settings?.value === true || settings?.value === "true"

    return NextResponse.json({ enabled })
  } catch (error: any) {
    console.error("Error getting bidding status:", error)
    return NextResponse.json({ enabled: false }) // Default to disabled on error
  }
}
