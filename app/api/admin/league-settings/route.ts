import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    const league = request.nextUrl.searchParams.get("league") || "nhl"
    
    const table = league === "ahl" ? "system_settings_ahl" : "system_settings"
    
    const { data: settings, error } = await adminClient
      .from(table)
      .select("key, value")
    
    if (error) {
      throw error
    }
    
    // Convert array to object
    const settingsObj: Record<string, any> = {}
    settings?.forEach(s => {
      settingsObj[s.key] = s.value
    })
    
    return NextResponse.json({ settings: settingsObj })
  } catch (error: any) {
    console.error("Error getting league settings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Try to get userId from request body as fallback
      const body = await request.json()
      
      if (body.userId) {
        // Verify user is admin using the provided userId
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", body.userId)

        const isAdmin = roleData?.some(r => 
          r.role?.toLowerCase().includes("admin") || 
          r.role?.toLowerCase().includes("owner") ||
          r.role?.toLowerCase().includes("league manager") ||
          r.role?.toLowerCase().includes("gm") ||
          r.role?.toLowerCase() === "general manager"
        )

        if (!isAdmin) {
          return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
        }

        // Proceed with the update
        const { league, key, value } = body
        const table = league === "ahl" ? "system_settings_ahl" : "system_settings"

        const { error } = await adminClient
          .from(table)
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })

        if (error) {
          console.error("Database error:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }
      
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
      r.role?.toLowerCase().includes("league manager") ||
      r.role?.toLowerCase().includes("gm") ||
      r.role?.toLowerCase() === "general manager"
    )

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const { league, key, value } = await request.json()
    const table = league === "ahl" ? "system_settings_ahl" : "system_settings"

    const { error } = await adminClient
      .from(table)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating league settings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
