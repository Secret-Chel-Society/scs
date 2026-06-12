import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const normalizedEmail = email.toLowerCase().trim()

    console.log("Checking auth user for email:", normalizedEmail)

    // Fetch from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, username, gamer_tag, console, created_at, discord_id")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    console.log("Users table result:", JSON.stringify({ userData, userError }))

    if (userError) {
      console.error("Error fetching user:", userError)
    }

    // Fetch from whl_users table
    const { data: whlUserData, error: whlUserError } = await supabaseAdmin
      .from("whl_users")
      .select("id, email, username, gamer_tag")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    console.log("WHL Users table result:", JSON.stringify({ whlUserData, whlUserError }))

    if (whlUserError) {
      console.error("Error fetching whl_user:", whlUserError)
    }

    let existingUser = null
    let page = 1
    const perPage = 1000

    while (true) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (authError) {
        console.error("Error listing auth users:", authError)
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }

      console.log("Auth users page", page, "count:", authData.users.length)

      existingUser = authData.users.find((user) => user.email?.toLowerCase() === normalizedEmail)

      if (existingUser) {
        console.log("Found auth user:", existingUser.id)
        break
      }

      if (authData.users.length < perPage) {
        console.log("No more auth pages, user not found in auth")
        break
      }

      page++
    }

    const response = {
      exists: !!existingUser,
      userId: existingUser?.id || null,
      userData: userData || null,
      whlUserData: whlUserData || null,
    }

    console.log("Final response:", response)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error checking auth user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
