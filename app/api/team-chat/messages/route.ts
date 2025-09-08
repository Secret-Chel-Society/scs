import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Create admin client for database operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Create auth client for session handling
async function createAuthClient() {
  const cookieStore = await cookies()

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    console.log("=== TEAM CHAT GET DEBUG ===")
    console.log("Team ID:", teamId)

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Get auth token from Authorization header
    const authHeader = request.headers.get("Authorization")
    let userId: string | null = null

    console.log("Auth header present:", !!authHeader)

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const {
          data: { user },
          error,
        } = await supabaseAdmin.auth.getUser(token)
        if (user && !error) {
          userId = user.id
          console.log("User from token:", userId)
        }
      } catch (e) {
        console.error("Error verifying token:", e)
      }
    }

    // Fallback to cookie-based auth
    if (!userId) {
      const authClient = await createAuthClient()
      const {
        data: { user },
        error: userError,
      } = await authClient.auth.getUser()

      if (userError || !user) {
        console.error("Authentication error:", userError)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      userId = user.id
      console.log("User from cookies:", userId)
    }

    // Verify user is on the team
    const { data: playerData, error: playerError } = await supabaseAdmin
      .from("players")
      .select("team_id")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .maybeSingle()

    console.log("Player verification:", { playerData, playerError })

    if (playerError) {
      console.error("Error verifying team membership:", playerError)
      return NextResponse.json({ error: "Error verifying team membership" }, { status: 403 })
    }

    if (!playerData) {
      console.warn(`User ${userId} is not authorized for team ${teamId}`)
      return NextResponse.json({ error: "Not authorized for this team" }, { status: 403 })
    }

    // Get chat messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("team_chat_messages")
      .select(`
        id,
        message,
        created_at,
        user_id
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })
      .limit(100)

    console.log("Messages query result:", { messagesCount: messages?.length, messagesError })

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    // Get user info separately
    const userIds = [...new Set(messages?.map((m) => m.user_id) || [])]
    console.log("User IDs to fetch:", userIds)

    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, gamer_tag_id, avatar_url")
      .in("id", userIds)

    console.log("Users query result:", { usersCount: users?.length, usersError })

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Combine messages with user data
    const messagesWithUsers =
      messages?.map((message) => ({
        ...message,
        users: users?.find((u) => u.id === message.user_id) || {
          id: message.user_id,
          gamer_tag_id: "Unknown User",
          avatar_url: null,
        },
      })) || []

    console.log("Final messages with users:", messagesWithUsers.length)

    return NextResponse.json({ messages: messagesWithUsers })
  } catch (error) {
    console.error("Error in team chat messages GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { teamId, message } = await request.json()

    console.log("=== TEAM CHAT POST DEBUG ===")
    console.log("Team ID:", teamId)
    console.log("Message:", message)

    if (!teamId || !message?.trim()) {
      return NextResponse.json({ error: "Team ID and message are required" }, { status: 400 })
    }

    // Get auth token from Authorization header
    const authHeader = request.headers.get("Authorization")
    let userId: string | null = null

    console.log("Auth header present:", !!authHeader)

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const {
          data: { user },
          error,
        } = await supabaseAdmin.auth.getUser(token)
        if (user && !error) {
          userId = user.id
          console.log("User from token:", userId)
        }
      } catch (e) {
        console.error("Error verifying token:", e)
      }
    }

    // Fallback to cookie-based auth
    if (!userId) {
      const authClient = await createAuthClient()
      const {
        data: { user },
        error: userError,
      } = await authClient.auth.getUser()

      if (userError || !user) {
        console.error("Authentication error:", userError)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      userId = user.id
      console.log("User from cookies:", userId)
    }

    // Verify user is on the team
    const { data: playerData, error: playerError } = await supabaseAdmin
      .from("players")
      .select("team_id")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .maybeSingle()

    console.log("Player verification:", { playerData, playerError })

    if (playerError) {
      console.error("Error verifying team membership:", playerError)
      return NextResponse.json({ error: "Error verifying team membership" }, { status: 403 })
    }

    if (!playerData) {
      console.warn(`User ${userId} is not authorized for team ${teamId}`)
      return NextResponse.json({ error: "Not authorized for this team" }, { status: 403 })
    }

    // Insert the message
    const messageData = {
      team_id: teamId,
      user_id: userId,
      message: message.trim(),
    }

    console.log("Inserting message:", messageData)

    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from("team_chat_messages")
      .insert(messageData)
      .select("id, message, created_at, user_id")
      .single()

    console.log("Insert result:", { newMessage, insertError })

    if (insertError) {
      console.error("Error sending message:", insertError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    // Get user info separately
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from("users")
      .select("id, gamer_tag_id, avatar_url")
      .eq("id", userId)
      .single()

    console.log("User data result:", { userData, userDataError })

    if (userDataError) {
      console.error("Error fetching user data:", userDataError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Combine message with user data
    const messageWithUser = {
      ...newMessage,
      users: userData,
    }

    console.log("Final message with user:", messageWithUser)

    return NextResponse.json({ message: messageWithUser })
  } catch (error) {
    console.error("Error in team chat messages POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
