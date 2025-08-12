import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting expired bids processing...")

    // Get all expired bids that haven't been processed
    const { data: expiredBids, error: bidsError } = await supabaseAdmin
      .from("player_bidding")
      .select(`
        *,
        users!player_bidding_user_id_fkey(id, gamer_tag_id, discord_id),
        teams!player_bidding_team_id_fkey(id, name, discord_role_id)
      `)
      .lt("bid_expires", new Date().toISOString())
      .eq("status", "active")
      .not("finalized", "eq", true)

    if (bidsError) {
      console.error("Error fetching expired bids:", bidsError)
      return NextResponse.json({ error: bidsError.message }, { status: 500 })
    }

    if (!expiredBids || expiredBids.length === 0) {
      console.log("No expired bids found")
      return NextResponse.json({
        success: true,
        message: "No expired bids to process",
        processed: 0,
      })
    }

    console.log(`Found ${expiredBids.length} expired bids to process`)

    let processed = 0
    const errors = []

    for (const bid of expiredBids) {
      try {
        console.log(`Processing bid for ${bid.users?.gamer_tag_id} to team ${bid.teams?.name}`)

        // Update bid status to completed
        const { error: updateError } = await supabaseAdmin
          .from("player_bidding")
          .update({
            status: "completed",
            finalized: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bid.id)

        if (updateError) {
          console.error(`Error updating bid ${bid.id}:`, updateError)
          errors.push(`Failed to update bid ${bid.id}: ${updateError.message}`)
          continue
        }

        // Check if player exists in players table
        const { data: existingPlayer, error: playerCheckError } = await supabaseAdmin
          .from("players")
          .select("id, team_id, status")
          .eq("user_id", bid.user_id)
          .single()

        if (playerCheckError && playerCheckError.code !== "PGRST116") {
          console.error(`Error checking player ${bid.user_id}:`, playerCheckError)
          errors.push(`Failed to check player ${bid.user_id}: ${playerCheckError.message}`)
          continue
        }

        // Update or insert player record
        if (existingPlayer) {
          // Update existing player
          const { error: playerUpdateError } = await supabaseAdmin
            .from("players")
            .update({
              team_id: bid.team_id,
              status: "active",
              salary: bid.bid_amount,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", bid.user_id)

          if (playerUpdateError) {
            console.error(`Error updating player ${bid.user_id}:`, playerUpdateError)
            errors.push(`Failed to update player ${bid.user_id}: ${playerUpdateError.message}`)
            continue
          }

          console.log(`Updated existing player ${bid.users?.gamer_tag_id} to team ${bid.teams?.name}`)
        } else {
          // Insert new player record
          const { error: playerInsertError } = await supabaseAdmin.from("players").insert({
            user_id: bid.user_id,
            team_id: bid.team_id,
            status: "active",
            salary: bid.bid_amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (playerInsertError) {
            console.error(`Error inserting player ${bid.user_id}:`, playerInsertError)
            errors.push(`Failed to insert player ${bid.user_id}: ${playerInsertError.message}`)
            continue
          }

          console.log(`Created new player record for ${bid.users?.gamer_tag_id} on team ${bid.teams?.name}`)
        }

        // Sync Discord roles if user has Discord connection
        if (bid.users?.discord_id) {
          try {
            console.log(`Syncing Discord roles for ${bid.users.gamer_tag_id}...`)

            const discordSyncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: bid.user_id,
              }),
            })

            if (!discordSyncResponse.ok) {
              const errorText = await discordSyncResponse.text()
              console.error(`Discord sync failed for ${bid.users.gamer_tag_id}:`, errorText)
              errors.push(`Discord sync failed for ${bid.users.gamer_tag_id}: ${errorText}`)
            } else {
              const syncResult = await discordSyncResponse.json()
              console.log(`Discord roles synced for ${bid.users.gamer_tag_id}:`, syncResult.message)
            }
          } catch (discordError) {
            console.error(`Discord sync error for ${bid.users.gamer_tag_id}:`, discordError)
            errors.push(`Discord sync error for ${bid.users.gamer_tag_id}: ${discordError.message}`)
          }
        } else {
          console.log(`No Discord connection found for ${bid.users?.gamer_tag_id}`)
        }

        processed++
        console.log(`Successfully processed bid for ${bid.users?.gamer_tag_id}`)
      } catch (error) {
        console.error(`Error processing bid ${bid.id}:`, error)
        errors.push(`Error processing bid ${bid.id}: ${error.message}`)
      }
    }

    console.log(`Expired bids processing completed. Processed: ${processed}, Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} expired bids`,
      processed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error in expired bids processing:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
