import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const postId = params.id

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Get the post with error handling
    const { data: post, error: postError } = await supabase
      .from("forum_posts")
      .select(`
        id,
        title,
        content,
        author_id,
        category_id,
        created_at,
        updated_at,
        view_count,
        pinned
      `)
      .eq("id", postId)
      .single()

    if (postError || !post) {
      console.error("Post fetch error:", postError)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Fetch author with fallback
    const { data: author } = await supabase
      .from("users")
      .select("id, email, gamer_tag, avatar_url")
      .eq("id", post.author_id)
      .single()

    // Fetch category with fallback
    const { data: category } = await supabase
      .from("forum_categories")
      .select("id, name, color")
      .eq("id", post.category_id)
      .single()

    // Fetch votes with error handling
    const { data: votes } = await supabase
      .from("forum_votes")
      .select("vote_type, user_id")
      .eq("post_id", postId)
      .is("reply_id", null)

    // Try to fetch replies, but handle if table doesn't exist
    let replies = []
    try {
      const { data: repliesData } = await supabase
        .from("forum_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (repliesData) {
        // Get reply authors and votes
        const replyAuthorIds = [...new Set(repliesData.map((reply) => reply.author_id))]

        let replyAuthors = []
        if (replyAuthorIds.length > 0) {
          const { data: authorsData } = await supabase
            .from("users")
            .select("id, email, gamer_tag, avatar_url")
            .in("id", replyAuthorIds)
          replyAuthors = authorsData || []
        }

        // Create author map
        const authorMap = new Map()
        replyAuthors.forEach((author) => authorMap.set(author.id, author))

        // Process replies
        replies = repliesData.map((reply) => {
          const replyAuthor = authorMap.get(reply.author_id) || {
            id: reply.author_id,
            email: "Unknown User",
            gamer_tag: "Unknown User",
            avatar_url: null,
          }

          return {
            ...reply,
            author: replyAuthor,
            like_count: 0,
            dislike_count: 0,
            user_votes: [],
          }
        })
      }
    } catch (replyError) {
      console.log("Replies table not available yet:", replyError)
      replies = []
    }

    // Calculate post vote counts
    const postVotes = votes || []
    const likes = postVotes.filter((v) => v.vote_type === "like").length
    const dislikes = postVotes.filter((v) => v.vote_type === "dislike").length

    // Update view count asynchronously
    supabase
      .from("forum_posts")
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq("id", postId)
      .then(() => console.log("View count updated"))
      .catch(() => console.warn("Could not update view count"))

    const postWithData = {
      ...post,
      author: author || {
        id: post.author_id,
        email: "Unknown User",
        gamer_tag: "Unknown User",
        avatar_url: null,
      },
      category: category || {
        id: post.category_id,
        name: "General",
        color: "#6366f1",
      },
      like_count: likes,
      dislike_count: dislikes,
      user_votes: postVotes,
      views: (post.view_count || 0) + 1,
      reply_count: replies.length,
    }

    return NextResponse.json({
      post: postWithData,
      replies,
    })
  } catch (error) {
    console.error("Error in forum post API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user

    const postId = params.id
    const { title, content } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check if user owns the post or is admin
    const { data: post } = await supabase.from("forum_posts").select("author_id").eq("id", postId).single()

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check user role
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    const isAdmin = userData?.role === "admin"
    const isOwner = post.author_id === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the post
    const { data: updatedPost, error } = await supabase
      .from("forum_posts")
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("DELETE request received for post:", params.id)

    if (!session) {
      console.log("No session found in request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user
    console.log("User:", user?.id)

    const postId = params.id

    // Check if user owns the post or is admin
    const { data: post, error: postFetchError } = await supabase
      .from("forum_posts")
      .select("author_id")
      .eq("id", postId)
      .single()

    if (postFetchError || !post) {
      console.log("Post not found:", postFetchError)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check user role
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError) {
      console.log("Error fetching user data:", userError)
      return NextResponse.json({ error: "Error checking permissions" }, { status: 500 })
    }

    const isAdmin = userData?.role === "admin"
    const isOwner = post.author_id === user.id

    console.log("Permission check:", {
      isAdmin,
      isOwner,
      userRole: userData?.role,
      postAuthor: post.author_id,
      userId: user.id,
    })

    if (!isOwner && !isAdmin) {
      console.log("User does not have permission to delete")
      return NextResponse.json({ error: "Forbidden - You don't have permission to delete this post" }, { status: 403 })
    }

    // Delete related data first (votes, replies)
    try {
      // Delete votes
      await supabase.from("forum_votes").delete().eq("post_id", postId)

      // Delete replies
      await supabase.from("forum_comments").delete().eq("post_id", postId)
    } catch (cleanupError) {
      console.log("Error cleaning up related data:", cleanupError)
      // Continue with post deletion even if cleanup fails
    }

    // Delete the post
    const { error: deleteError } = await supabase.from("forum_posts").delete().eq("id", postId)

    if (deleteError) {
      console.log("Error deleting post:", deleteError)
      return NextResponse.json({ error: `Failed to delete post: ${deleteError.message}` }, { status: 500 })
    }

    console.log("Post deleted successfully")
    return NextResponse.json({ success: true, message: "Post deleted successfully" })
  } catch (error) {
    console.error("Unexpected error deleting post:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
