import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create admin client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`Searching for user: ${normalizedEmail}`)

    // 1. Check Supabase Auth users
    let authUser = null
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        console.error("Error listing auth users:", authError)
      } else {
        authUser = authUsers.users.find((user) => user.email?.toLowerCase() === normalizedEmail)
      }
    } catch (error) {
      console.error("Exception checking auth users:", error)
    }

    // 2. Check custom users table
    let customUser = null
    try {
      const { data: customUsers, error: customError } = await supabaseAdmin
        .from("users")
        .select("*")
        .ilike("email", normalizedEmail)

      if (customError) {
        console.error("Error checking custom users:", customError)
      } else {
        customUser = customUsers?.[0] || null
      }
    } catch (error) {
      console.error("Exception checking custom users:", error)
    }

    // 3. Check email verification tokens
    let verificationToken = null
    try {
      const { data: tokens, error: tokenError } = await supabaseAdmin
        .from("email_verification_tokens")
        .select("*")
        .eq("email", normalizedEmail)

      if (tokenError) {
        console.error("Error checking verification tokens:", tokenError)
      } else {
        verificationToken = tokens?.[0] || null
      }
    } catch (error) {
      console.error("Exception checking verification tokens:", error)
    }

    // 4. Check players table
    let playerRecord = null
    if (customUser) {
      try {
        const { data: players, error: playerError } = await supabaseAdmin
          .from("players")
          .select("*")
          .eq("user_id", customUser.id)

        if (playerError) {
          console.error("Error checking players:", playerError)
        } else {
          playerRecord = players?.[0] || null
        }
      } catch (error) {
        console.error("Exception checking players:", error)
      }
    }

    const result = {
      email: normalizedEmail,
      authUser: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            email_confirmed_at: authUser.email_confirmed_at,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            user_metadata: authUser.user_metadata,
          }
        : null,
      customUser: customUser
        ? {
            id: customUser.id,
            email: customUser.email,
            gamer_tag_id: customUser.gamer_tag_id,
            created_at: customUser.created_at,
            is_active: customUser.is_active,
          }
        : null,
      playerRecord: playerRecord
        ? {
            id: playerRecord.id,
            role: playerRecord.role,
            team_id: playerRecord.team_id,
            salary: playerRecord.salary,
          }
        : null,
      verificationToken: verificationToken
        ? {
            id: verificationToken.id,
            created_at: verificationToken.created_at,
            expires_at: verificationToken.expires_at,
          }
        : null,
      issues: [],
    }

    // Identify issues
    if (authUser && !customUser) {
      result.issues.push("User exists in Auth but not in custom users table")
    }
    if (customUser && !authUser) {
      result.issues.push("User exists in custom table but not in Auth")
    }
    if (authUser && !authUser.email_confirmed_at) {
      result.issues.push("Auth user email is not confirmed")
    }
    if (customUser && !playerRecord) {
      result.issues.push("User exists but has no player record")
    }
    if (verificationToken) {
      result.issues.push("Pending verification token exists")
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error("Error in find-orphaned-users:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
