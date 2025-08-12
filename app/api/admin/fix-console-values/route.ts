import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    const failedEmails = [
      "dakotajwaardenburg@gmail.com",
      "xzmax69@live.com",
      "iofreeze123@outlook.com",
      "sethmcgettigan@gmail.com",
      "christian_flett97@hotmail.com",
      "ethaneira9@gmail.com",
      "porterhopson@icloid.com",
      "calebmayorga1994@gmail.com",
    ]

    const results = {
      checked: 0,
      fixed: 0,
      created: 0,
      errors: [] as string[],
    }

    for (const email of failedEmails) {
      try {
        results.checked++

        // Check if user exists in auth
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
          results.errors.push(`Error listing users: ${listError.message}`)
          continue
        }

        const authUser = authUsers.users.find((u) => u.email === email)

        if (!authUser) {
          results.errors.push(`Auth user not found: ${email}`)
          continue
        }

        console.log(`Found auth user ${email} with metadata:`, authUser.user_metadata)

        // Check current console value
        const currentConsole = authUser.user_metadata?.console
        console.log(`Current console for ${email}: ${currentConsole}`)

        // Map invalid console values to valid ones
        let validConsole = currentConsole
        if (currentConsole === "XSX" || currentConsole === "Xbox Series X" || currentConsole === "XBOX") {
          validConsole = "Xbox"
        } else if (currentConsole === "PlayStation 5" || currentConsole === "PS" || currentConsole === "PlayStation") {
          validConsole = "PS5"
        } else if (!currentConsole || !["Xbox", "PS5"].includes(currentConsole)) {
          // Default to Xbox if no valid console
          validConsole = "Xbox"
        }

        // Update auth user metadata if needed
        if (validConsole !== currentConsole) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            user_metadata: {
              ...authUser.user_metadata,
              console: validConsole,
            },
          })

          if (updateError) {
            results.errors.push(`Error updating auth metadata for ${email}: ${updateError.message}`)
            continue
          }

          console.log(`Updated console for ${email} from ${currentConsole} to ${validConsole}`)
          results.fixed++
        }

        // Check if user exists in database
        const { data: dbUser } = await supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle()

        if (!dbUser) {
          // Create database user with valid console
          const userObject = {
            id: authUser.id,
            email: authUser.email,
            gamer_tag_id:
              authUser.user_metadata?.gamer_tag_id || authUser.user_metadata?.gamerTag || email.split("@")[0],
            primary_position:
              authUser.user_metadata?.primary_position || authUser.user_metadata?.primaryPosition || "Center",
            secondary_position:
              authUser.user_metadata?.secondary_position || authUser.user_metadata?.secondaryPosition || null,
            console: validConsole,
            is_active: true,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          }

          const { error: insertError } = await supabaseAdmin.from("users").insert(userObject)

          if (insertError) {
            results.errors.push(`Error creating database user for ${email}: ${insertError.message}`)
            continue
          }

          // Create player record
          await supabaseAdmin.from("players").insert({
            user_id: authUser.id,
            role: "Player",
          })

          // Create user role
          await supabaseAdmin.from("user_roles").insert({
            user_id: authUser.id,
            role: "Player",
          })

          console.log(`Created database user for ${email}`)
          results.created++
        }
      } catch (error: any) {
        results.errors.push(`Error processing ${email}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error("Error in fix console values:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
