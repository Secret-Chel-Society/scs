import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("=== FORUM REPLIES API DEBUG ===")
    console.log("Forum replies POST request received")
    
    // Debug cookies
    const cookieHeader = request.headers.get('cookie')
    console.log("Cookie header:", cookieHeader ? "Present" : "Missing")
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Try multiple session retrieval methods
    console.log("Attempting to get session...")
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    console.log("Session error:", sessionError)
    console.log("Session check:", { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionExpiry: session?.expires_at
    })

    // Also try getUser method
    const {
      data: { user: directUser },
      error: userError
    } = await supabase.auth.getUser()
    
    console.log("Direct user check:", {
      hasUser: !!directUser,
      userId: directUser?.id,
      userEmail: directUser?.email,
      userError: userError
    })

    if (!session && !directUser) {
      console.log("No session or user found, returning 401")
      return NextResponse.json({ 
        error: "Unauthorized - No valid session found",
        debug: {
          sessionError,
          userError,
          hasCookie: !!cookieHeader
        }
      }, { status: 401 })
    }

    const user = session?.user || directUser

    if (!user) {
      console.log("No user found in session, returning 401")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
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
      .from("forum_comments")
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
    try {
      await supabase.rpc("increment_reply_count", { post_id_param: post_id })
    } catch (rpcError) {
      console.log("RPC function not available, skipping reply count update:", rpcError)
      // Manually update reply count
      const { data: replies } = await supabase
        .from("forum_comments")
        .select("id")
        .eq("post_id", post_id)
      
      await supabase
        .from("forum_posts")
        .update({ reply_count: replies?.length || 0 })
        .eq("id", post_id)
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Error in reply API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
