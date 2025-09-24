import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization token provided" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabase = createAdminClient()

    // Verify the user with the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error("User verification error:", userError)
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userDataError || userData?.role !== "admin") {
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
      message: "Manual waiver processing completed",
      ...result,
    })
  } catch (error: any) {
    console.error("Manual waiver processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
