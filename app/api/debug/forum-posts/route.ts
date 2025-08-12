import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // First, let's check what's in the forum_posts table
    const { data: posts, error: postsError } = await supabase.from("forum_posts").select("*").limit(5)

    if (postsError) {
      return NextResponse.json({ error: "Posts error: " + postsError.message }, { status: 500 })
    }

    // Then check what's in the users table
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, gamer_tag, avatar_url")
      .limit(5)

    if (usersError) {
      return NextResponse.json({ error: "Users error: " + usersError.message }, { status: 500 })
    }

    // Check if we have any forum posts
    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: "No forum posts found",
        users: users || [],
      })
    }

    // Get the author IDs from posts
    const authorIds = posts.map((post) => post.author_id)

    // Fetch the specific users who are authors
    const { data: authors, error: authorsError } = await supabase
      .from("users")
      .select("id, email, gamer_tag, avatar_url")
      .in("id", authorIds)

    return NextResponse.json({
      posts: posts,
      all_users: users || [],
      post_authors: authors || [],
      author_ids: authorIds,
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
