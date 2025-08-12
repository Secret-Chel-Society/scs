import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "15")

    console.log("Fetching posts for category:", category)

    // Build the query
    let query = supabase
      .from("forum_posts")
      .select(`
        id,
        title,
        content,
        author_id,
        category_id,
        pinned,
        created_at,
        updated_at,
        view_count
      `)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)

    // Filter by category if not "all"
    if (category !== "all") {
      query = query.eq("category_id", category)
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error("Posts query error:", postsError)
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // Get unique author and category IDs
    const authorIds = [...new Set(posts.map((post) => post.author_id))]
    const categoryIds = [...new Set(posts.map((post) => post.category_id))]

    // Fetch users and categories separately
    const [usersResult, categoriesResult] = await Promise.allSettled([
      supabase.from("users").select("id, email, gamer_tag, avatar_url").in("id", authorIds),
      supabase.from("forum_categories").select("id, name, color").in("id", categoryIds),
    ])

    // Create lookup maps
    const userMap = new Map()
    const categoryMap = new Map()

    if (usersResult.status === "fulfilled" && usersResult.value.data) {
      usersResult.value.data.forEach((user) => userMap.set(user.id, user))
    }

    if (categoriesResult.status === "fulfilled" && categoriesResult.value.data) {
      categoriesResult.value.data.forEach((cat) => categoryMap.set(cat.id, cat))
    }

    // Get vote counts and comment counts for all posts
    const postIds = posts.map((post) => post.id)

    const [votesResult, commentsResult] = await Promise.allSettled([
      supabase.from("forum_votes").select("post_id, vote_type").in("post_id", postIds).is("comment_id", null),
      supabase.from("forum_comments").select("post_id").in("post_id", postIds),
    ])

    // Create vote and comment count maps
    const voteCountMap = new Map()
    const commentCountMap = new Map()

    if (votesResult.status === "fulfilled" && votesResult.value.data) {
      votesResult.value.data.forEach((vote) => {
        const postId = vote.post_id
        if (!voteCountMap.has(postId)) {
          voteCountMap.set(postId, { likes: 0, dislikes: 0 })
        }
        if (vote.vote_type === "like") {
          voteCountMap.get(postId).likes++
        } else if (vote.vote_type === "dislike") {
          voteCountMap.get(postId).dislikes++
        }
      })
    }

    if (commentsResult.status === "fulfilled" && commentsResult.value.data) {
      commentsResult.value.data.forEach((comment) => {
        const postId = comment.post_id
        commentCountMap.set(postId, (commentCountMap.get(postId) || 0) + 1)
      })
    }

    // Combine all data
    const postsWithData = posts.map((post) => {
      const author = userMap.get(post.author_id) || {
        id: post.author_id,
        email: "Unknown User",
        gamer_tag: "Unknown User",
        avatar_url: null,
      }

      const category = categoryMap.get(post.category_id) || {
        id: post.category_id,
        name: "General",
        color: "#6366f1",
      }

      const voteCounts = voteCountMap.get(post.id) || { likes: 0, dislikes: 0 }
      const commentCount = commentCountMap.get(post.id) || 0

      return {
        ...post,
        author,
        category,
        views: post.view_count || 0,
        like_count: voteCounts.likes,
        dislike_count: voteCounts.dislikes,
        comment_count: commentCount,
      }
    })

    return NextResponse.json({ posts: postsWithData })
  } catch (error) {
    console.error("Error in forum posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST request to /api/forum/posts received")
    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ error: "Authentication error: " + authError.message }, { status: 401 })
    }

    if (!user) {
      console.error("No authenticated user found")
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    console.log("Authenticated user:", user.id)

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { title, content, category_id } = requestBody

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!category_id) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    console.log("Creating post with data:", {
      title: title.trim(),
      contentLength: content.length,
      category_id,
    })

    // Get the category to check if it's restricted
    const { data: category, error: categoryError } = await supabase
      .from("forum_categories")
      .select("name, admin_only")
      .eq("id", category_id)
      .single()

    if (categoryError) {
      console.error("Error fetching category:", categoryError)
      return NextResponse.json({ error: "Invalid category: " + categoryError.message }, { status: 400 })
    }

    // Check if this is an admin-only category (like announcements)
    if (category?.admin_only) {
      // Check if user is admin
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      if (rolesError) {
        console.error("Error fetching user roles:", rolesError)
        return NextResponse.json({ error: "Error checking permissions: " + rolesError.message }, { status: 500 })
      }

      const isAdmin = userRoles?.some((ur) => ur.role === "Admin") || false

      if (!isAdmin) {
        return NextResponse.json(
          {
            error: "You don't have permission to post in this category",
          },
          { status: 403 },
        )
      }
    }

    // Create the post
    const { data: post, error: insertError } = await supabase
      .from("forum_posts")
      .insert({
        title: title.trim(),
        content,
        author_id: user.id,
        category_id,
        view_count: 0,
        pinned: false,
      })
      .select("*")
      .single()

    if (insertError) {
      console.error("Error creating post:", insertError)
      return NextResponse.json({ error: "Database error: " + insertError.message }, { status: 500 })
    }

    console.log("Post created successfully:", post.id)
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Error in forum posts API:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
