import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, oldUserId, oldWhlUserId } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Step 1: Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const newUid = authData.user.id
    console.log(`Created auth user with UID: ${newUid}`)

    const results: any = {
      authCreated: true,
      newUid,
      usersUpdated: false,
      whlUsersUpdated: false,
      errors: [],
    }

    // Step 2: Update the users table if oldUserId exists
    if (oldUserId && oldUserId !== newUid) {
      console.log(`Updating users table from ${oldUserId} to ${newUid}`)

      // Use raw SQL to update all tables in the correct order
      // First, we need to update the users table ID directly
      // This requires handling FK constraints properly

      try {
        // Approach: Update the users.id directly - Supabase should handle this if RLS allows
        // But since we're using service role, we have full access

        // First check if the old user exists
        const { data: oldUser, error: checkError } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", oldUserId)
          .single()

        if (checkError || !oldUser) {
          console.log(`Old user ${oldUserId} not found, skipping users update`)
          results.errors.push(`Old user ${oldUserId} not found`)
        } else {
          // Update all related tables FIRST to point to new UID
          // We need to insert a temporary user record first so FK constraints are satisfied

          // Step 2a: Insert a new user record with the new UID (copying old data)
          const newUserData = { ...oldUser, id: newUid }
          delete newUserData.created_at // Let it auto-generate or keep original

          const { error: insertNewError } = await supabaseAdmin.from("users").insert(newUserData)

          if (insertNewError) {
            // If insert fails (maybe email unique constraint), try upsert
            console.log(`Insert new user failed: ${insertNewError.message}, trying direct approach`)

            // Alternative: Update the ID directly using RPC or raw query
            // Since direct ID update is complex, let's update related tables first
            // then swap the records

            results.errors.push(`Could not create new user record: ${insertNewError.message}`)
          } else {
            console.log(`Created new user record with ID ${newUid}`)

            // Step 2b: Update all related tables to point to new UID
            const relatedTables = [
              { table: "players", column: "user_id" },
              { table: "user_roles", column: "user_id" },
              { table: "discord_users", column: "user_id" },
              { table: "notifications", column: "user_id" },
              { table: "season_registrations", column: "user_id" },
              { table: "tokens", column: "user_id" },
              { table: "game_availability", column: "user_id" },
              { table: "forum_posts", column: "author_id" },
              { table: "forum_comments", column: "author_id" },
              { table: "forum_replies", column: "author_id" },
              { table: "ip_logs", column: "user_id" },
              { table: "ea_player_mappings", column: "user_id" },
              { table: "password_reset_tokens", column: "user_id" },
              { table: "verification_logs", column: "user_id" },
              { table: "admin_actions", column: "admin_user_id" },
              { table: "news", column: "author_id" },
            ]

            for (const { table, column } of relatedTables) {
              try {
                const { data, error } = await supabaseAdmin
                  .from(table)
                  .update({ [column]: newUid })
                  .eq(column, oldUserId)
                  .select()

                if (error) {
                  console.log(`Error updating ${table}.${column}: ${error.message}`)
                } else {
                  console.log(`Updated ${table}.${column}: ${oldUserId} -> ${newUid} (${data?.length || 0} rows)`)
                }
              } catch (e: any) {
                console.log(`Exception updating ${table}: ${e.message}`)
              }
            }

            // Step 2c: Delete the old user record (now safe since FKs point to new record)
            const { error: deleteOldError } = await supabaseAdmin.from("users").delete().eq("id", oldUserId)

            if (deleteOldError) {
              console.log(`Error deleting old user: ${deleteOldError.message}`)
              results.errors.push(`Could not delete old user: ${deleteOldError.message}`)
            } else {
              console.log(`Deleted old user record ${oldUserId}`)
              results.usersUpdated = true
            }
          }
        }
      } catch (e: any) {
        console.error(`Exception in users update:`, e)
        results.errors.push(`Users update exception: ${e.message}`)
      }
    }

    // Step 3: Update the whl_users table if oldWhlUserId exists
    if (oldWhlUserId && oldWhlUserId !== newUid) {
      console.log(`Updating whl_users table from ${oldWhlUserId} to ${newUid}`)

      try {
        const { data: oldWhlUser, error: checkError } = await supabaseAdmin
          .from("whl_users")
          .select("*")
          .eq("id", oldWhlUserId)
          .single()

        if (checkError || !oldWhlUser) {
          console.log(`Old whl_user ${oldWhlUserId} not found, skipping`)
          results.errors.push(`Old whl_user ${oldWhlUserId} not found`)
        } else {
          // Insert new whl_user record
          const newWhlUserData = { ...oldWhlUser, id: newUid }
          delete newWhlUserData.created_at

          const { error: insertNewError } = await supabaseAdmin.from("whl_users").insert(newWhlUserData)

          if (insertNewError) {
            console.log(`Insert new whl_user failed: ${insertNewError.message}`)
            results.errors.push(`Could not create new whl_user record: ${insertNewError.message}`)
          } else {
            console.log(`Created new whl_user record with ID ${newUid}`)

            // Update WHL related tables
            const whlTables = [
              { table: "whl_players", column: "user_id" },
              { table: "whl_notifications", column: "user_id" },
              { table: "whl_season_registrations", column: "user_id" },
              { table: "whl_game_availability", column: "user_id" },
            ]

            for (const { table, column } of whlTables) {
              try {
                const { data, error } = await supabaseAdmin
                  .from(table)
                  .update({ [column]: newUid })
                  .eq(column, oldWhlUserId)
                  .select()

                if (error) {
                  console.log(`Error updating ${table}.${column}: ${error.message}`)
                } else {
                  console.log(
                    `Updated ${table}.${column}: ${oldWhlUserId} -> ${newUid} (${data?.length || 0} rows)`,
                  )
                }
              } catch (e: any) {
                console.log(`Exception updating ${table}: ${e.message}`)
              }
            }

            // Delete old whl_user record
            const { error: deleteOldError } = await supabaseAdmin.from("whl_users").delete().eq("id", oldWhlUserId)

            if (deleteOldError) {
              console.log(`Error deleting old whl_user: ${deleteOldError.message}`)
              results.errors.push(`Could not delete old whl_user: ${deleteOldError.message}`)
            } else {
              console.log(`Deleted old whl_user record ${oldWhlUserId}`)
              results.whlUsersUpdated = true
            }
          }
        }
      } catch (e: any) {
        console.error(`Exception in whl_users update:`, e)
        results.errors.push(`WHL users update exception: ${e.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      message:
        results.errors.length > 0
          ? `Auth user created with some errors: ${results.errors.join(", ")}`
          : "Auth user created and database records updated successfully",
    })
  } catch (error: any) {
    console.error("Error in create-auth-user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
