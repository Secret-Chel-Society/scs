import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

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

    console.log("Starting secondary position fix operation")

    // First, let's check what roles are allowed in the database
    const { data: roleConstraintData, error: roleConstraintError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: "SELECT consrc FROM pg_constraint WHERE conname = 'user_roles_role_check'",
    })

    if (!roleConstraintError && roleConstraintData && roleConstraintData.length > 0) {
      console.log("Role constraint found:", roleConstraintData[0])
    } else {
      console.log("Could not find role constraint, will proceed with position fix")
    }

    // Get users with empty string secondary positions - use a more reliable query
    const { data: usersToFix, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, secondary_position")
      .filter("secondary_position", "eq", "")

    if (fetchError) {
      console.error("Error fetching users with empty secondary positions:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch users with empty secondary positions",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    console.log(`Found ${usersToFix?.length || 0} users with empty secondary positions`)

    const errors = []
    let fixedCount = 0

    // Fix each user
    for (const user of usersToFix || []) {
      console.log(`Fixing secondary position for ${user.email}: "${user.secondary_position}"`)

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

    // Now let's also fix users with primary position issues
    const { data: usersWithEmptyPrimary, error: primaryFetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, primary_position")
      .filter("primary_position", "eq", "")

    if (primaryFetchError) {
      console.error("Error fetching users with empty primary positions:", primaryFetchError)
      errors.push(`Failed to fetch users with empty primary positions: ${primaryFetchError.message}`)
    } else {
      console.log(`Found ${usersWithEmptyPrimary?.length || 0} users with empty primary positions`)

      // Fix each user with empty primary position
      for (const user of usersWithEmptyPrimary || []) {
        console.log(`Fixing primary position for ${user.email}: "${user.primary_position}"`)

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

    return NextResponse.json({
      success: true,
      fixed: fixedCount,
      total: (usersToFix?.length || 0) + (usersWithEmptyPrimary?.length || 0),
      errors: errors.length > 0 ? errors : null,
    })
  } catch (error: any) {
    console.error("Error in fix-secondary-positions route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
