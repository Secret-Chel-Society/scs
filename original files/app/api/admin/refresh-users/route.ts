import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Helper function to fix existing users with empty secondary positions
async function fixExistingSecondaryPositions(supabaseAdmin) {
  try {
    // Get users with empty string secondary positions - use a more reliable query
    const { data: usersToFix, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .filter("secondary_position", "eq", "")

    if (fetchError) {
      console.error("Error fetching users with empty secondary positions:", fetchError)
      return { fixed: 0, errors: [fetchError.message] }
    }

    console.log(`Found ${usersToFix?.length || 0} users with empty secondary positions`)

    const errors = []
    let fixedCount = 0

    // Fix each user
    for (const user of usersToFix || []) {
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ secondary_position: null })
        .eq("id", user.id)

      if (updateError) {
        console.error(`Error fixing secondary position for ${user.email}:`, updateError)
        errors.push(`Failed to fix ${user.email}: ${updateError.message}`)
      } else {
        fixedCount++
      }
    }

    // Also fix users with empty primary positions
    const { data: usersWithEmptyPrimary, error: primaryFetchError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .filter("primary_position", "eq", "")

    if (primaryFetchError) {
      console.error("Error fetching users with empty primary positions:", primaryFetchError)
      errors.push(`Failed to fetch users with empty primary positions: ${primaryFetchError.message}`)
    } else {
      console.log(`Found ${usersWithEmptyPrimary?.length || 0} users with empty primary positions`)

      // Fix each user with empty primary position
      for (const user of usersWithEmptyPrimary || []) {
        const { error: updateError } = await supabaseAdmin
          .from("users")
          .update({ primary_position: "Center" }) // Default to Center
          .eq("id", user.id)

        if (updateError) {
          console.error(`Error fixing primary position for ${user.email}:`, updateError)
          errors.push(`Failed to fix primary position for ${user.email}: ${updateError.message}`)
        } else {
          fixedCount++
        }
      }
    }

    return { fixed: fixedCount, errors }
  } catch (error) {
    console.error("Error in fixExistingSecondaryPositions:", error)
    return { fixed: 0, errors: [error.message] }
  }
}

export async function POST(request: Request) {
  try {
    const { adminKey, allowedRoles = [] } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key provided" }, { status: 401 })
    }

    // Create a Supabase admin client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // First, fix any existing users with empty secondary positions
    const fixResults = await fixExistingSecondaryPositions(supabaseAdmin)
    console.log(`Fixed ${fixResults.fixed} users with empty positions`)

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error("Error fetching auth users:", authError)
      return NextResponse.json({ error: "Failed to fetch auth users" }, { status: 500 })
    }

    // Get all users from public.users
    const { data: publicUsers, error: publicError } = await supabaseAdmin.from("users").select("*")

    if (publicError) {
      console.error("Error fetching public users:", publicError)
      return NextResponse.json({ error: "Failed to fetch public users" }, { status: 500 })
    }

    // Get all players
    const { data: players, error: playersError } = await supabaseAdmin.from("players").select("*")

    if (playersError) {
      console.error("Error fetching players:", playersError)
      return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabaseAdmin.from("user_roles").select("*")

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Failed to fetch user roles" }, { status: 500 })
    }

    // Process users
    const results = {
      total: authUsers.users.length,
      updated: 0,
      playersCreated: 0,
      rolesUpdated: 0,
      secondaryPositionsFixed: fixResults.fixed,
      errors: [] as string[],
    }

    // Add any errors from fixing secondary positions
    if (fixResults.errors.length > 0) {
      results.errors.push(...fixResults.errors.map((err) => `Error fixing position: ${err}`))
    }

    // Get valid roles from the database
    const { data: validRolesData, error: validRolesError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: "SELECT consrc FROM pg_constraint WHERE conname = 'user_roles_role_check'",
    })

    // Extract valid roles from constraint
    let validRoles = ["Player", "GM", "AGM", "Owner", "Admin"] // Default fallback
    if (!validRolesError && validRolesData && validRolesData.length > 0) {
      try {
        // Try to parse the constraint definition
        const constraintSrc = validRolesData[0]?.consrc || ""
        console.log("Role constraint source:", constraintSrc)

        const roleMatches = constraintSrc.match(/'([^']+)'/g)
        if (roleMatches && roleMatches.length > 0) {
          validRoles = roleMatches.map((role) => role.replace(/'/g, ""))
          console.log("Extracted valid roles from constraint:", validRoles)
        }
      } catch (e) {
        console.warn("Could not parse role constraint, using default roles")
      }
    } else {
      console.log("Could not fetch role constraint, using default roles")
    }

    console.log("Valid roles for user_roles table:", validRoles)

    for (const authUser of authUsers.users) {
      try {
        // Skip users without confirmed emails
        if (!authUser.email_confirmed_at) {
          console.log(`Skipping unconfirmed user: ${authUser.email}`)
          continue
        }

        // Find corresponding public user
        const publicUser = publicUsers.find((u) => u.id === authUser.id)

        if (!publicUser) {
          // User exists in auth but not in public.users
          // This is a new user that needs to be created in public.users
          console.log(`Creating missing public user for ${authUser.email}`)

          // Extract user metadata
          const metadata = authUser.user_metadata || {}

          // Validate console value - ensure it's either "Xbox" or "PS5"
          let consoleValue = metadata.console || "Xbox"
          if (!["Xbox", "PS5"].includes(consoleValue)) {
            console.log(`Invalid console value "${consoleValue}" for ${authUser.email}, defaulting to "Xbox"`)
            consoleValue = "Xbox"
          }

          const { data: userData, error: userError } = await supabaseAdmin.from("users").insert({
            id: authUser.id,
            email: authUser.email,
            gamer_tag_id: metadata.gamer_tag_id || authUser.email?.split("@")[0] || "Unknown",
            primary_position: metadata.primary_position || "Center",
            // Ensure secondary_position is null if it's an empty string or undefined
            secondary_position: metadata.secondary_position || null,
            console: consoleValue, // Use the validated console value
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (userError) {
            console.error(`Error creating user for ${authUser.id}:`, userError)
            results.errors.push(`Failed to create user for ${authUser.email}: ${userError.message}`)
            continue
          }

          results.updated++
        } else {
          // Check if secondary_position is an empty string and fix it
          if (publicUser.secondary_position === "") {
            console.log(`Fixing empty secondary position for existing user ${authUser.email}`)
            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({ secondary_position: null })
              .eq("id", authUser.id)

            if (updateError) {
              console.error(`Error fixing secondary position for ${authUser.email}:`, updateError)
              results.errors.push(`Failed to fix secondary position for ${authUser.email}: ${updateError.message}`)
            } else {
              results.secondaryPositionsFixed++
            }
          }

          // Check if primary_position is empty and fix it
          if (publicUser.primary_position === "") {
            console.log(`Fixing empty primary position for existing user ${authUser.email}`)
            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({ primary_position: "Center" })
              .eq("id", authUser.id)

            if (updateError) {
              console.error(`Error fixing primary position for ${authUser.email}:`, updateError)
              results.errors.push(`Failed to fix primary position for ${authUser.email}: ${updateError.message}`)
            } else {
              results.updated++
            }
          }

          // Ensure user is marked as active
          if (publicUser.is_active === false) {
            console.log(`Activating user ${authUser.email}`)
            await supabaseAdmin.from("users").update({ is_active: true }).eq("id", authUser.id)
            results.updated++
          }

          // Check if console value is valid and fix it if needed
          if (!["Xbox", "PS5"].includes(publicUser.console)) {
            console.log(`Fixing invalid console value "${publicUser.console}" for existing user ${authUser.email}`)
            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({ console: "Xbox" })
              .eq("id", authUser.id)

            if (updateError) {
              console.error(`Error fixing console for ${authUser.email}:`, updateError)
              results.errors.push(`Failed to fix console for ${authUser.email}: ${updateError.message}`)
            } else {
              results.updated++
            }
          }
        }

        // Check if player record exists
        const playerRecord = players.find((p) => p.user_id === authUser.id)

        if (!playerRecord) {
          // Create player record
          console.log(`Creating player record for ${authUser.email}`)
          const { error: playerError } = await supabaseAdmin.from("players").insert({
            user_id: authUser.id,
            role: "Player", // Default role
            salary: 0,
          })

          if (playerError) {
            console.error(`Error creating player record for ${authUser.id}:`, playerError)
            results.errors.push(`Failed to create player record for ${authUser.email}: ${playerError.message}`)
            continue
          }

          results.playersCreated++
        }

        // Check if user has any roles in user_roles table
        const userRolesForUser = userRoles.filter((r) => r.user_id === authUser.id)

        // If no roles, add default Player role
        if (userRolesForUser.length === 0) {
          console.log(`Adding default Player role for ${authUser.email}`)

          // Ensure the role is valid according to the constraint
          if (validRoles.includes("Player")) {
            const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
              user_id: authUser.id,
              role: "Player",
            })

            if (roleError) {
              console.error(`Error adding role for ${authUser.id}:`, roleError)
              results.errors.push(`Failed to add role for ${authUser.email}: ${roleError.message}`)
              continue
            }

            results.rolesUpdated++
          } else {
            results.errors.push(
              `Cannot add Player role for ${authUser.email}: not in valid roles list (${validRoles.join(", ")})`,
            )
          }
        }
      } catch (error: any) {
        console.error(`Error processing user ${authUser.email}:`, error)
        results.errors.push(`Error processing ${authUser.email}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `User refresh completed. Fixed ${results.secondaryPositionsFixed} secondary positions.`,
    })
  } catch (error: any) {
    console.error("Error in refresh-users route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
