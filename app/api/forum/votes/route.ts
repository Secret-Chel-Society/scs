import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user

    const { post_id, reply_id, vote_type } = await request.json()

    if ((!post_id && !reply_id) || !vote_type) {
      return NextResponse.json({ error: "Post ID or Reply ID and vote type are required" }, { status: 400 })
    }

    if (vote_type !== "like" && vote_type !== "dislike") {
      return NextResponse.json({ error: "Vote type must be 'like' or 'dislike'" }, { status: 400 })
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("forum_votes")
      .select("*")
      .eq("user_id", user.id)
      .eq(post_id ? "post_id" : "reply_id", post_id || reply_id)
      .is(post_id ? "reply_id" : "post_id", null)
      .single()

    if (existingVote) {
      // If same vote type, remove the vote (toggle)
      if (existingVote.vote_type === vote_type) {
        const { error: deleteError } = await supabase.from("forum_votes").delete().eq("id", existingVote.id)

        if (deleteError) {
          return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 })
        }

        return NextResponse.json({ message: "Vote removed" })
      }

      // If different vote type, update the vote
      const { error: updateError } = await supabase.from("forum_votes").update({ vote_type }).eq("id", existingVote.id)

      if (updateError) {
        return NextResponse.json({ error: "Failed to update vote" }, { status: 500 })
      }

      return NextResponse.json({ message: "Vote updated" })
    }

    // Create new vote
    const { error: insertError } = await supabase.from("forum_votes").insert({
      user_id: user.id,
      post_id: post_id || null,
      reply_id: reply_id || null,
      vote_type,
    })

    if (insertError) {
      console.error("Error inserting vote:", insertError)
      return NextResponse.json({ error: "Failed to create vote" }, { status: 500 })
    }

    return NextResponse.json({ message: "Vote created" })
  } catch (error) {
    console.error("Error in vote API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
