import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("post_id")

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // First, get comments without user joins
    const { data: comments, error: commentsError } = await supabase
      .from("forum_comments")
      .select(`
        *,
        votes:forum_votes(vote_type, user_id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error("Error fetching comments:", commentsError)
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({ comments: [] })
    }

    // Get unique author IDs
    const authorIds = [...new Set(comments.map((comment) => comment.author_id))]

    // Fetch user data separately
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, gamer_tag, avatar_url")
      .in("id", authorIds)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      // Continue without user data rather than failing
    }

    // Create a map of users for quick lookup
    const userMap = new Map()
    if (users) {
      users.forEach((user) => {
        userMap.set(user.id, user)
      })
    }

    // Calculate vote counts for each comment and attach user data
    const commentsWithStats = comments.map((comment) => {
      const likes = comment.votes?.filter((v: any) => v.vote_type === "like").length || 0
      const dislikes = comment.votes?.filter((v: any) => v.vote_type === "dislike").length || 0

      // Get user data from our map
      const author = userMap.get(comment.author_id) || {
        id: comment.author_id,
        email: "Unknown User",
        gamer_tag: "Unknown User",
        avatar_url: null,
      }

      return {
        ...comment,
        author,
        like_count: likes,
        dislike_count: dislikes,
        user_votes: comment.votes || [],
      }
    })

    return NextResponse.json({ comments: commentsWithStats })
  } catch (error) {
    console.error("Error in forum comments API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, post_id, parent_id } = await request.json()

    if (!content || !post_id) {
      return NextResponse.json({ error: "Content and post ID are required" }, { status: 400 })
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from("forum_comments")
      .insert({
        content,
        author_id: user.id,
        post_id,
        parent_id,
      })
      .select("*")
      .single()

    if (commentError) {
      console.error("Error creating comment:", commentError)
      return NextResponse.json({ error: commentError.message }, { status: 500 })
    }

    // Fetch user data separately
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, gamer_tag, avatar_url")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      // Use fallback user data
    }

    const author = userData || {
      id: user.id,
      email: user.email || "Unknown User",
      gamer_tag: user.user_metadata?.gamer_tag || "Unknown User",
      avatar_url: user.user_metadata?.avatar_url || null,
    }

    const commentWithAuthor = {
      ...comment,
      author,
      like_count: 0,
      dislike_count: 0,
      user_votes: [],
    }

    return NextResponse.json({ comment: commentWithAuthor })
  } catch (error) {
    console.error("Error in forum comments API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
