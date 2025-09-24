import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { pinned } = await request.json()

    // Get the authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user

    // Check if user is admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Error checking permissions" }, { status: 500 })
    }

    const isAdmin = userRoles?.some((ur) => ur.role === "Admin") || false

    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can pin/unpin posts" }, { status: 403 })
    }

    // Update the post's pinned status
    const { data: post, error: updateError } = await supabase
      .from("forum_posts")
      .update({ pinned })
      .eq("id", params.id)
      .select("*")
      .single()

    if (updateError) {
      console.error("Error updating post pin status:", updateError)
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in pin post API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
