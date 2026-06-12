import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    const isAdmin = roleData?.some(r => 
      r.role?.toLowerCase().includes("admin") || 
      r.role?.toLowerCase().includes("owner") ||
      r.role?.toLowerCase().includes("league manager")
    )

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const { enabled } = await request.json()

    // Update the bidding_enabled setting for AHL
    const { error } = await adminClient
      .from("system_settings_ahl")
      .upsert({ key: "bidding_enabled", value: enabled }, { onConflict: "key" })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, enabled })
  } catch (error: any) {
    console.error("Error in AHL bidding API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: settings, error } = await adminClient
      .from("system_settings_ahl")
      .select("value")
      .eq("key", "bidding_enabled")
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({ enabled: settings?.value || false })
  } catch (error: any) {
    console.error("Error getting AHL bidding status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
