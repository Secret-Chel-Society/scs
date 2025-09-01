import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { email, adminKey } = await request.json()

    // Verify admin key
    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    console.log(`Debugging auth users for email: ${email}`)

    // Method 1: List all users (with pagination)
    let allUsers: any[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (authError) {
        console.error("Error fetching auth users:", authError)
        return NextResponse.json({ error: "Failed to fetch auth users" }, { status: 500 })
      }

      allUsers = [...allUsers, ...authUsers.users]

      if (authUsers.users.length < perPage) {
        break // No more pages
      }
      page++
    }

    console.log(`Total auth users found: ${allUsers.length}`)

    // Find the specific user
    const targetUser = allUsers.find((user) => user.email === email)

    // Method 2: Try to get user by email directly
    let directUser = null
    try {
      const { data: directUserData, error: directError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
      if (!directError && directUserData) {
        directUser = directUserData.user
      }
    } catch (e) {
      console.log("Direct user lookup failed:", e)
    }

    // Method 3: Search through all users for similar emails
    const similarEmails = allUsers
      .filter((user) => user.email?.toLowerCase().includes(email.toLowerCase().split("@")[0]))
      .map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
      }))

    return NextResponse.json({
      success: true,
      debug: {
        totalUsers: allUsers.length,
        searchEmail: email,
        foundByList: targetUser ? true : false,
        foundByDirect: directUser ? true : false,
        targetUser: targetUser || null,
        directUser: directUser || null,
        similarEmails,
        firstFewUsers: allUsers.slice(0, 5).map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
        })),
      },
    })
  } catch (error) {
    console.error("Unexpected error in debug-auth-users:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
