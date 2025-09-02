import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabase = createAdminClient()

    // Verify the user with the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error("User verification failed:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["Admin", "SuperAdmin"])

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Call the waiver processing endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/waivers/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to process waivers")
    }

    return NextResponse.json({
      success: true,
      message: "Waiver processing completed",
      ...result,
    })
  } catch (error: any) {
    console.error("Error processing waivers:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
