import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, adminKey } = await request.json()

    console.log("Search user request:", { email, hasAdminKey: !!adminKey })

    // Validate admin key
    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.log("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key" }, { status: 403 })
    }

    // Create Supabase admin client
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("Searching for user:", email)

    // Search for user in Auth
    let authUser = null
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) {
        console.error("Auth search error:", authError)
      } else {
        // Find user by email (case insensitive)
        authUser = authUsers.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
        console.log("Auth user found:", !!authUser)
      }
    } catch (error) {
      console.error("Error searching auth users:", error)
    }

    // Search for user in database
    let dbUser = null
    try {
      const { data: dbUsers, error: dbError } = await supabase.from("users").select("*").ilike("email", email).limit(1)

      if (dbError) {
        console.error("Database search error:", dbError)
      } else {
        dbUser = dbUsers && dbUsers.length > 0 ? dbUsers[0] : null
        console.log("Database user found:", !!dbUser)
      }
    } catch (error) {
      console.error("Error searching database users:", error)
    }

    // Get user roles if user exists
    let roles = null
    if (authUser) {
      try {
        const { data: userRoles } = await supabase.from("user_roles").select("*").eq("user_id", authUser.id)
        roles = userRoles
      } catch (error) {
        console.error("Error fetching user roles:", error)
      }
    }

    // Get verification tokens
    let verificationTokens = null
    try {
      const { data: tokens } = await supabase.from("email_verification_tokens").select("*").ilike("email", email)
      verificationTokens = tokens
    } catch (error) {
      console.error("Error fetching verification tokens:", error)
    }

    const results = {
      authUser,
      dbUser,
      roles,
      verificationTokens,
      searchEmail: email,
    }

    console.log("Search results:", {
      hasAuthUser: !!results.authUser,
      hasDbUser: !!results.dbUser,
      rolesCount: results.roles?.length || 0,
      tokensCount: results.verificationTokens?.length || 0,
    })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Error searching for user:", error)
    return NextResponse.json({ error: error.message || "Failed to search for user" }, { status: 500 })
  }
}
