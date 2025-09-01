import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { post_id, content } = await request.json()

    if (!post_id || !content) {
      return NextResponse.json({ error: "Post ID and content are required" }, { status: 400 })
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase.from("forum_posts").select("id").eq("id", post_id).single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from("forum_replies")
      .insert({
        post_id,
        content,
        author_id: user.id,
      })
      .select("*")
      .single()

    if (replyError) {
      console.error("Error creating reply:", replyError)
      return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
    }

    // Update reply count on post
    await supabase.rpc("increment_reply_count", { post_id_param: post_id })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Error in reply API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
