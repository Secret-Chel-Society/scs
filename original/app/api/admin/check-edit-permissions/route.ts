import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ isAdmin: false, canEdit: false }, { status: 200 })
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (userError) {
      console.error("Error checking user roles:", userError)
      return NextResponse.json({ isAdmin: false, canEdit: false, error: userError.message }, { status: 200 })
    }

    const isAdmin = userData?.some((role) => role.role === "admin" || role.role === "Admin") || false

    return NextResponse.json({ isAdmin, canEdit: isAdmin }, { status: 200 })
  } catch (error: any) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, canEdit: false, error: error.message }, { status: 200 })
  }
}
