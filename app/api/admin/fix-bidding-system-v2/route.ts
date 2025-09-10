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
    console.log("🔧 Starting comprehensive bidding system fix...")

    // Step 1: Add user_id column to player_bidding table
    console.log("Step 1: Adding user_id column to player_bidding table...")
    
    const { error: alterError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
        -- Add user_id column if it doesn't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'player_bidding' 
            AND column_name = 'user_id'
          ) THEN
            ALTER TABLE player_bidding ADD COLUMN user_id uuid;
          END IF;
        END $$;
      `,
    })

    if (alterError) {
      console.error("❌ Error adding user_id column:", alterError)
      return NextResponse.json({ error: "Failed to add user_id column" }, { status: 500 })
    }

    console.log("✅ user_id column added successfully")

    // Step 2: Populate user_id from players table
    console.log("Step 2: Populating user_id from players table...")
    
    const { error: updateError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
        UPDATE player_bidding 
        SET user_id = players.user_id
        FROM players 
        WHERE player_bidding.player_id = players.id
        AND player_bidding.user_id IS NULL;
      `,
    })

    if (updateError) {
      console.error("❌ Error populating user_id:", updateError)
      return NextResponse.json({ error: "Failed to populate user_id" }, { status: 500 })
    }

    console.log("✅ user_id populated successfully")

    // Step 3: Add foreign key constraint
    console.log("Step 3: Adding foreign key constraint...")
    
    const { error: constraintError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
        -- Add foreign key constraint if it doesn't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'player_bidding_user_id_fkey'
          ) THEN
            ALTER TABLE player_bidding 
            ADD CONSTRAINT player_bidding_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id);
          END IF;
        END $$;
      `,
    })

    if (constraintError) {
      console.error("❌ Error adding foreign key constraint:", constraintError)
      return NextResponse.json({ error: "Failed to add foreign key constraint" }, { status: 500 })
    }

    console.log("✅ Foreign key constraint added successfully")

    // Step 4: Create index for performance
    console.log("Step 4: Creating index...")
    
    const { error: indexError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_player_bidding_user_id 
        ON player_bidding(user_id);
      `,
    })

    if (indexError) {
      console.error("❌ Error creating index:", indexError)
      return NextResponse.json({ error: "Failed to create index" }, { status: 500 })
    }

    console.log("✅ Index created successfully")

    // Step 5: Process any unprocessed winning bids
    console.log("Step 5: Processing unprocessed winning bids...")
    
    const { data: unprocessedBids, error: bidsError } = await supabaseAdmin
      .from("player_bidding")
      .select(`
        *,
        users!player_bidding_user_id_fkey(id, gamer_tag_id, discord_id),
        teams!player_bidding_team_id_fkey(id, name)
      `)
      .eq("status", "won")
      .eq("finalized", false)

    if (bidsError) {
      console.error("❌ Error fetching unprocessed bids:", bidsError)
      return NextResponse.json({ error: "Failed to fetch unprocessed bids" }, { status: 500 })
    }

    let processedCount = 0
    const errors = []

    console.log(`Found ${unprocessedBids?.length || 0} unprocessed winning bids`)

    for (const bid of unprocessedBids || []) {
      try {
        console.log(`🔄 Processing winning bid for ${bid.users?.gamer_tag_id} to team ${bid.teams?.name}`)

        // Update player record
        const { error: playerUpdateError } = await supabaseAdmin
          .from("players")
          .update({
            team_id: bid.team_id,
            salary: bid.bid_amount,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", bid.user_id)

        if (playerUpdateError) {
          console.error(`❌ Error updating player ${bid.user_id}:`, playerUpdateError)
          errors.push(`Failed to update player ${bid.user_id}: ${playerUpdateError.message}`)
          continue
        }

        // Mark bid as finalized
        const { error: finalizeError } = await supabaseAdmin
          .from("player_bidding")
          .update({
            finalized: true,
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("id", bid.id)

        if (finalizeError) {
          console.error(`❌ Error finalizing bid ${bid.id}:`, finalizeError)
          errors.push(`Failed to finalize bid ${bid.id}: ${finalizeError.message}`)
          continue
        }

        // Send notification to the player
        await supabaseAdmin.from("notifications").insert({
          user_id: bid.user_id,
          title: "Bid Successful - You've Been Signed!",
          message: `Congratulations! ${bid.teams?.name} has successfully signed you for $${bid.bid_amount.toLocaleString()}.`,
          link: "/profile",
        })

        // Sync Discord roles if user has Discord connection
        if (bid.users?.discord_id) {
          try {
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
              console.error(`❌ Discord sync failed for ${bid.users.gamer_tag_id}:`, errorText)
              errors.push(`Discord sync failed for ${bid.users.gamer_tag_id}: ${errorText}`)
            } else {
              console.log(`✅ Discord roles synced for ${bid.users.gamer_tag_id}`)
            }
          } catch (discordError) {
            console.error(`❌ Discord sync error for ${bid.users.gamer_tag_id}:`, discordError)
            errors.push(`Discord sync error for ${bid.users.gamer_tag_id}: ${discordError.message}`)
          }
        }

        processedCount++
        console.log(`✅ Successfully processed bid for ${bid.users?.gamer_tag_id}`)
      } catch (error) {
        console.error(`❌ Error processing bid ${bid.id}:`, error)
        errors.push(`Error processing bid ${bid.id}: ${error.message}`)
      }
    }

    console.log(`🎉 Bidding system fix completed! Processed: ${processedCount}, Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Bidding system fixed successfully! Processed ${processedCount} winning bids.`,
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        user_id_column_added: true,
        foreign_key_constraint_added: true,
        index_created: true,
        unprocessed_bids_processed: processedCount,
        errors_encountered: errors.length,
      },
    })
  } catch (error) {
    console.error("💥 Error in bidding system fix:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

