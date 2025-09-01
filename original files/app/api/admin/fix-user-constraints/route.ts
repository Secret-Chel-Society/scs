import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const results = {
      authUsers: 0,
      consoleFixed: 0,
      gamerTagFixed: 0,
      usersCreated: 0,
      playersCreated: 0,
      rolesCreated: 0,
      errors: [] as string[],
    }

    // Get all auth users
    let allAuthUsers: any[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (authError) {
        console.error("Error fetching auth users:", authError)
        break
      }

      if (!authUsers.users || authUsers.users.length === 0) {
        break
      }

      allAuthUsers = allAuthUsers.concat(authUsers.users)
      page++

      if (authUsers.users.length < perPage) {
        break
      }
    }

    results.authUsers = allAuthUsers.length
    console.log(`Found ${allAuthUsers.length} auth users`)

    // Console mapping
    const consoleMapping: { [key: string]: string } = {
      "PlayStation 5": "PS5",
      PlayStation: "PS5",
      PS5: "PS5",
      "Xbox Series X": "XSX",
      "Xbox Series X/S": "XSX",
      Xbox: "XSX",
      XSX: "XSX",
      XBOX: "XSX",
      xbox: "XSX",
      playstation: "PS5",
    }

    // Track used gamer tags to handle duplicates
    const usedGamerTags = new Set<string>()

    // Get existing gamer tags from database
    const { data: existingUsers } = await supabaseAdmin
      .from("users")
      .select("gamer_tag_id")
      .not("gamer_tag_id", "is", null)

    if (existingUsers) {
      existingUsers.forEach((user) => {
        if (user.gamer_tag_id) {
          usedGamerTags.add(user.gamer_tag_id.toLowerCase())
        }
      })
    }

    for (const authUser of allAuthUsers) {
      try {
        const email = authUser.email
        if (!email) continue

        // Check if user already exists in database
        const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle()

        if (existingUser) {
          console.log(`User ${email} already exists in database`)
          continue
        }

        const metadata = authUser.user_metadata || {}

        // Fix console value
        let consoleValue = metadata.console || "PS5" // Default to PS5
        if (consoleMapping[consoleValue]) {
          consoleValue = consoleMapping[consoleValue]
          results.consoleFixed++
        }

        // Fix gamer tag duplicates
        let gamerTag = metadata.gamer_tag_id || metadata.gamerTag || email.split("@")[0]
        const originalGamerTag = gamerTag
        let counter = 1

        // Make gamer tag unique
        while (usedGamerTags.has(gamerTag.toLowerCase())) {
          gamerTag = `${originalGamerTag}${counter}`
          counter++
          results.gamerTagFixed++
        }

        usedGamerTags.add(gamerTag.toLowerCase())

        // Create user record
        const userObject = {
          id: authUser.id,
          email: email,
          gamer_tag_id: gamerTag,
          primary_position: metadata.primary_position || "Center",
          secondary_position: metadata.secondary_position || null,
          console: consoleValue,
          is_active: true,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
        }

        const { error: userError } = await supabaseAdmin.from("users").insert(userObject)

        if (userError) {
          results.errors.push(`Failed to create user ${email}: ${userError.message}`)
          continue
        }

        results.usersCreated++

        // Create player record
        const { error: playerError } = await supabaseAdmin.from("players").insert({
          user_id: authUser.id,
          role: "Player",
          salary: 0,
        })

        if (playerError) {
          results.errors.push(`Failed to create player for ${email}: ${playerError.message}`)
        } else {
          results.playersCreated++
        }

        // Create user role
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: authUser.id,
          role: "Player",
        })

        if (roleError) {
          results.errors.push(`Failed to create role for ${email}: ${roleError.message}`)
        } else {
          results.rolesCreated++
        }

        console.log(`Successfully synced user: ${email} (${gamerTag})`)
      } catch (error: any) {
        results.errors.push(`Error processing ${authUser.email}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error("Error in fix-user-constraints:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
