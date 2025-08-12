import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (userError || user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Call the reset_waiver_priority function
    const { data: result, error } = await supabase.rpc("reset_waiver_priority")

    if (error) {
      console.error("Error resetting waiver priority:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Waiver priority reset successfully",
      teamsUpdated: result,
    })
  } catch (error: any) {
    console.error("Error resetting waiver priority:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
