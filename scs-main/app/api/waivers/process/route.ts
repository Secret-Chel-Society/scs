import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { cancelPlayerBids } from "@/lib/bid-cleanup"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const now = new Date()

    console.log("=== Processing expired waivers ===")

    // Get all expired waivers that haven't been processed
    const { data: expiredWaivers, error: waiversError } = await supabase
      .from("waivers")
      .select(`
        *,
        players!inner (
          id,
          user_id,
          salary,
          users (
            id,
            gamer_tag_id
          )
        ),
        waiver_claims (
          id,
          claiming_team_id,
          priority_at_claim,
          teams:claiming_team_id (
            id,
            name
          )
        )
      `)
      .lt("claim_deadline", now.toISOString())
      .eq("status", "active")

    if (waiversError) {
      console.error("Error fetching expired waivers:", waiversError)
      throw waiversError
    }

    console.log(`Found ${expiredWaivers?.length || 0} expired waivers`)

    if (!expiredWaivers || expiredWaivers.length === 0) {
      return NextResponse.json({
        message: "No expired waivers to process",
        processedCount: 0,
      })
    }

    let processedCount = 0
    let assignedCount = 0
    let clearedCount = 0

    for (const waiver of expiredWaivers) {
      try {
        const playerId = waiver.player_id
        const claims = waiver.waiver_claims || []

        console.log(`Processing waiver for player ${playerId}: ${claims.length} claims`)

        if (claims.length === 0) {
          // No claims - player becomes free agent, clear to waivers
          console.log(`No claims for player ${playerId}, clearing to free agency`)

          // Cancel any remaining bids for this player
          await cancelPlayerBids(playerId, "waiver_cleared")

          // Sync Discord roles for cleared player (remove team role)
          if (waiver.players.user_id) {
            try {
              console.log("Syncing Discord roles for waiver clear...")

              const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: waiver.players.user_id }),
              })

              if (roleResponse.ok) {
                const roleData = await roleResponse.json()
                console.log("Discord role sync completed for waiver clear:", roleData)
              } else {
                const errorText = await roleResponse.text()
                console.error("Failed to sync Discord roles for waiver clear:", errorText)
              }
            } catch (discordError) {
              console.error("Error syncing Discord roles for waiver clear:", discordError)
              // Don't fail the waiver processing for Discord sync issues
            }
          }

          // Update waiver status
          await supabase
            .from("waivers")
            .update({
              status: "cleared",
              processed_at: now.toISOString(),
            })
            .eq("id", waiver.id)

          // Ensure player is free agent
          await supabase
            .from("players")
            .update({
              team_id: null,
              status: "free_agent",
            })
            .eq("id", playerId)

          clearedCount++
        } else {
          // Sort claims by priority (lower number = higher priority)
          const sortedClaims = claims.sort((a, b) => a.priority_at_claim - b.priority_at_claim)
          const winningClaim = sortedClaims[0]

          console.log(`Assigning player ${playerId} to team ${winningClaim.claiming_team_id}`)

          // Cancel any existing bids for this player
          await cancelPlayerBids(playerId, "waiver_claimed")

          // Assign player to claiming team
          const { error: assignError } = await supabase
            .from("players")
            .update({
              team_id: winningClaim.claiming_team_id,
              status: "active",
            })
            .eq("id", playerId)

          if (assignError) {
            console.error(`Error assigning player ${playerId}:`, assignError)
            continue
          }

          // Update waiver status
          await supabase
            .from("waivers")
            .update({
              status: "claimed",
              processed_at: now.toISOString(),
            })
            .eq("id", waiver.id)

          // Sync Discord roles for the claimed player
          if (waiver.players.user_id) {
            try {
              console.log("Syncing Discord roles for waiver claim...")

              const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: waiver.players.user_id }),
              })

              if (roleResponse.ok) {
                const roleData = await roleResponse.json()
                console.log("Discord role sync completed for waiver claim:", roleData)
              } else {
                const errorText = await roleResponse.text()
                console.error("Failed to sync Discord roles for waiver claim:", errorText)
              }
            } catch (discordError) {
              console.error("Error syncing Discord roles for waiver claim:", discordError)
              // Don't fail the waiver processing for Discord sync issues
            }
          }

          // Send notifications
          try {
            // Notify the player
            await supabase.from("notifications").insert({
              user_id: waiver.players.user_id,
              title: "Claimed from Waivers",
              message: `You have been claimed by ${winningClaim.teams?.name || "a team"} from waivers.`,
              link: "/profile",
            })

            // Notify the claiming team managers
            const { data: managers } = await supabase
              .from("players")
              .select("user_id")
              .eq("team_id", winningClaim.claiming_team_id)
              .in("role", ["GM", "AGM", "Owner"])

            if (managers && managers.length > 0) {
              const notifications = managers.map((manager) => ({
                user_id: manager.user_id,
                title: "Waiver Claim Successful",
                message: `Your team has successfully claimed ${waiver.players.users?.gamer_tag_id || "a player"} from waivers.`,
                link: "/management",
              }))

              await supabase.from("notifications").insert(notifications)
            }
          } catch (notificationError) {
            console.error("Error sending notifications:", notificationError)
          }

          assignedCount++
        }

        processedCount++
      } catch (error) {
        console.error(`Error processing waiver for player ${waiver.player_id}:`, error)
      }
    }

    console.log(`=== Waiver processing completed ===`)
    console.log(`Total processed: ${processedCount}`)
    console.log(`Players assigned: ${assignedCount}`)
    console.log(`Players cleared: ${clearedCount}`)

    return NextResponse.json({
      message: "Expired waivers processed successfully",
      processedCount,
      assignedCount,
      clearedCount,
    })
  } catch (error: any) {
    console.error("Error in waiver processing:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
