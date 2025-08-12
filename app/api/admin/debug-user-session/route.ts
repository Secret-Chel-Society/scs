import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, adminKey } = await request.json()

    // Verify admin key
    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Failed to fetch auth users" }, { status: 500 })
    }

    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to fetch database users" }, { status: 500 })
    }

    // Find exact matches
    const exactAuthMatch = authUsers.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())

    const exactDbMatch = dbUsers?.find((user) => user.email?.toLowerCase() === email.toLowerCase())

    // Find similar emails (fuzzy matching)
    const similarAuthUsers = authUsers.users.filter(
      (user) =>
        user.email &&
        (user.email.toLowerCase().includes(email.toLowerCase()) ||
          email.toLowerCase().includes(user.email.toLowerCase()) ||
          user.email.toLowerCase().replace(/[^a-z0-9]/g, "") === email.toLowerCase().replace(/[^a-z0-9]/g, "")),
    )

    const similarDbUsers = dbUsers?.filter(
      (user) =>
        user.email &&
        (user.email.toLowerCase().includes(email.toLowerCase()) ||
          email.toLowerCase().includes(user.email.toLowerCase()) ||
          user.email.toLowerCase().replace(/[^a-z0-9]/g, "") === email.toLowerCase().replace(/[^a-z0-9]/g, "")),
    )

    // Get recent sign-ins (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recentAuthUsers = authUsers.users
      .filter((user) => user.last_sign_in_at && new Date(user.last_sign_in_at) > yesterday)
      .sort((a, b) => new Date(b.last_sign_in_at!).getTime() - new Date(a.last_sign_in_at!).getTime())

    // Get verification tokens for the email
    const { data: tokens, error: tokensError } = await supabase
      .from("email_verification_tokens")
      .select("*")
      .eq("email", email)

    return NextResponse.json({
      searchEmail: email,
      exactMatches: {
        auth: exactAuthMatch || null,
        database: exactDbMatch || null,
      },
      similarUsers: {
        auth: similarAuthUsers,
        database: similarDbUsers,
      },
      recentSignIns: recentAuthUsers,
      verificationTokens: tokens || [],
      totals: {
        authUsers: authUsers.users.length,
        dbUsers: dbUsers?.length || 0,
      },
      debug: {
        authUsersPreview: authUsers.users.slice(0, 5).map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
        })),
        dbUsersPreview:
          dbUsers?.slice(0, 5).map((u) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
          })) || [],
      },
    })
  } catch (error: any) {
    console.error("Debug user session error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
