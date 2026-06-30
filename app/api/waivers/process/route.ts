import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { cancelPlayerBids } from "@/lib/bid-cleanup"
import { saveSalaryHistory } from "@/lib/salary-history"
import { calculateStandings } from "@/lib/standings-calculator"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const now = new Date()

    console.log("=== Processing expired waivers ===")

    // Get all expired waivers that haven't been processed (active or processing status)
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
      .in("status", ["active", "processing"])

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
          // No claims - player clears waivers and goes to TC on the same team
          console.log(`No claims for player ${playerId}, sending to TC`)

          // Get the player's current state from the players table.
          // Since we now move team_id -> tc_team_id immediately when waiving,
          // team_id will be null by the time this runs — use tc_team_id as the NHL holding team.
          const { data: playerData, error: playerError } = await supabase
            .from("players")
            .select("team_id, tc_team_id, team_id_ahl, tc_team_id_ahl, tc_team_id_ecl, called_up_ahl, called_up_ecl")
            .eq("id", playerId)
            .single()

          if (playerError) {
            console.error(`Failed to get player data for ${playerId}:`, playerError)
          }

          // team_id is null now (cleared on waive); tc_team_id holds the original NHL team.
          const playerTeamId = playerData?.tc_team_id || playerData?.team_id
          const playerTeamIdAhl = playerData?.team_id_ahl
          // If the player was called up from an AHL/ECL Training Camp, they should revert
          // back to being a TC on that original minor-league team when they clear waivers.
          const revertTcTeamIdAhl = playerData?.called_up_ahl ? playerData?.tc_team_id_ahl : null
          const revertTcTeamIdEcl = playerData?.called_up_ecl ? playerData?.tc_team_id_ecl : null

          console.log(`Player ${playerId} current team_id: ${playerTeamId}, team_id_ahl: ${playerTeamIdAhl}, revert AHL TC: ${revertTcTeamIdAhl}, revert ECL TC: ${revertTcTeamIdEcl}`)

          // Cancel any remaining bids for this player
          await cancelPlayerBids(playerId, "waiver_cleared")

          // Update waiver status FIRST
          await supabase
            .from("waivers")
            .update({
              status: "cleared",
              processed_at: now.toISOString(),
            })
            .eq("id", waiver.id)

          // Player clears waivers - mark them as TC on their current team
          // They stay on the same team but become a TC player
          if (revertTcTeamIdAhl || revertTcTeamIdEcl) {
            // Player was called up from an AHL/ECL Training Camp.
            // They cleared NHL waivers unclaimed — put them on NHL TC (tc_team_id)
            // AND restore their AHL/ECL TC assignment.
            const revertLeague = revertTcTeamIdAhl ? "AHL" : "ECL"
            console.log(`Reverting called-up player ${playerId} back to NHL TC + ${revertLeague} Training Camp`)
            const { error: updateError } = await supabase
              .from("players")
              .update({
                is_tc: true,
                team_id: null,
                tc_team_id: playerTeamId,   // keep on NHL TC
                tc_team_id_ahl: revertTcTeamIdAhl,
                tc_team_id_ecl: revertTcTeamIdEcl,
                called_up_at: null,
                called_up_ahl: false,
                called_up_ecl: false,
                salary: 0,
                role: "Player",
                status: "active",
              })
              .eq("id", playerId)

            if (updateError) {
              console.error(`Failed to revert player ${playerId} to minor-league TC:`, updateError)
            }
          } else if (playerTeamId) {
            // Player is on an NHL team - mark as TC on that team
            console.log(`Assigning player ${playerId} to Training Camp of their current team ${playerTeamId}`)
            const { data: updateResult, error: updateError } = await supabase
              .from("players")
              .update({
                is_tc: true,
                team_id: null,
                tc_team_id: playerTeamId,
                called_up_at: null,
                called_up_ahl: false,
                called_up_ecl: false,
                salary: 0,
                role: "Player",
                status: "active",
              })
              .eq("id", playerId)
              .select()
            
            console.log(`TC assignment result for player ${playerId}:`, JSON.stringify(updateResult), JSON.stringify(updateError))
            
            if (updateError) {
              console.error(`Failed to assign player ${playerId} to TC:`, updateError)
            }
          } else if (playerTeamIdAhl) {
            // Player is on an AHL team - mark as TC on that AHL team
            console.log(`Assigning player ${playerId} to AHL Training Camp of team ${playerTeamIdAhl}`)
            const { error: updateError } = await supabase
              .from("players")
              .update({
                is_tc: true,
                team_id_ahl: null,
                tc_team_id: null,
                tc_team_id_ahl: playerTeamIdAhl,
                called_up_at: null,
                called_up_ahl: false,
                called_up_ecl: false,
                salary: 0,
                role: "Player",
                status: "active",
              })
              .eq("id", playerId)
            
            if (updateError) {
              console.error(`Failed to assign player ${playerId} to AHL TC:`, updateError)
            }
          } else {
            // No team - this shouldn't happen, but fallback to free agent
            console.log(`Player ${playerId} has no team_id, becoming free agent`)
            await supabase
              .from("players")
              .update({
                is_tc: false,
                tc_team_id: null,
                tc_team_id_ahl: null,
                status: "free_agent",
              })
              .eq("id", playerId)
          }

          // Sync Discord roles AFTER player update
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

          clearedCount++
        } else {
          // Get current season standings to determine winning claim
          const { data: seasonSetting } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "current_season")
            .single()

          let winningClaim = claims[0]
          
          if (seasonSetting?.value) {
            try {
              // Calculate current standings
              const standings = await calculateStandings(seasonSetting.value)
              
              // Sort standings by points ascending (worst teams = highest priority)
              const sortedByPoints = [...standings].sort((a, b) => a.points - b.points)
              
              // Create a map of team_id to priority (1-based, lower = better)
              const priorityMap = new Map<string, number>()
              sortedByPoints.forEach((team, index) => {
                priorityMap.set(team.id, index + 1)
              })
              
              // Sort claims by standings priority (lower points = higher waiver priority)
              const sortedClaims = [...claims].sort((a, b) => {
                const priorityA = priorityMap.get(a.claiming_team_id) ?? 999
                const priorityB = priorityMap.get(b.claiming_team_id) ?? 999
                return priorityA - priorityB
              })
              
              winningClaim = sortedClaims[0]
              const winningPriority = priorityMap.get(winningClaim.claiming_team_id) ?? 999
              console.log(`Winning claim determined by standings: Team ${winningClaim.claiming_team_id} with priority ${winningPriority}`)
            } catch (standingsError) {
              console.error("Error calculating standings for waiver claim:", standingsError)
              // Fallback to stored priority
              const sortedClaims = claims.sort((a, b) => a.priority_at_claim - b.priority_at_claim)
              winningClaim = sortedClaims[0]
              console.log(`Fallback to stored priority: Team ${winningClaim.claiming_team_id}`)
            }
          } else {
            // No season setting, use stored priority
            const sortedClaims = claims.sort((a, b) => a.priority_at_claim - b.priority_at_claim)
            winningClaim = sortedClaims[0]
          }

          console.log(`Assigning player ${playerId} to team ${winningClaim.claiming_team_id}`)

          // Cancel any existing bids for this player
          await cancelPlayerBids(playerId, "waiver_claimed")

          // Assign player to claiming team, clear TC holding state and called_up flags
          const { error: assignError } = await supabase
            .from("players")
            .update({
              team_id: winningClaim.claiming_team_id,
              tc_team_id: null,
              is_tc: false,
              status: "active",
              called_up_at: null,
              called_up_ahl: false,
              called_up_ecl: false,
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

          // Move the winning team to bottom of waiver priority
          try {
            // Get all current waiver priorities
            const { data: allPriorities } = await supabase
              .from("waiver_priority")
              .select("id, team_id, priority")
              .order("priority", { ascending: true })

            if (allPriorities && allPriorities.length > 0) {
              const winningTeamPriority = allPriorities.find(p => p.team_id === winningClaim.claiming_team_id)
              
              if (winningTeamPriority) {
                // Get max priority (bottom of list)
                const maxPriority = Math.max(...allPriorities.map(p => p.priority))
                
                // Move all teams with higher priority up by 1
                const teamsToMove = allPriorities.filter(p => p.priority > winningTeamPriority.priority)
                
                for (const team of teamsToMove) {
                  await supabase
                    .from("waiver_priority")
                    .update({ priority: team.priority - 1 })
                    .eq("id", team.id)
                }
                
                // Move winning team to bottom
                await supabase
                  .from("waiver_priority")
                  .update({ 
                    priority: maxPriority,
                    last_used: new Date().toISOString()
                  })
                  .eq("team_id", winningClaim.claiming_team_id)
                
                console.log(`Moved team ${winningClaim.claiming_team_id} to bottom of waiver priority`)
              }
            }
          } catch (priorityError) {
            console.error("Error updating waiver priority:", priorityError)
            // Don't fail waiver processing for priority update errors
          }

          // Save salary history for the claimed player
          try {
            const { data: currentSeason } = await supabase
              .from("seasons")
              .select("id, season_number")
              .eq("is_active", true)
              .single()

            if (currentSeason && waiver.players.user_id) {
              await saveSalaryHistory(supabase, {
                player_id: playerId,
                user_id: waiver.players.user_id,
                season_number: currentSeason.season_number,
                season_id: currentSeason.id,
                team_id: winningClaim.claiming_team_id,
                team_name: winningClaim.teams?.name || null,
                salary: waiver.players.salary || 0,
                acquired_via: "waiver_claim",
                acquired_from_team_id: waiver.waiving_team_id,
                league: "NHL",
              })
              console.log(`Saved salary history for waiver claim - player ${playerId}`)
            }
          } catch (historyError) {
            console.error("Error saving waiver claim salary history:", historyError)
            // Don't fail waiver processing for history errors
          }

          // Move the claiming team to the bottom of waiver priority
          try {
            // Get all teams' current priorities
            const { data: allPriorities, error: priorityFetchError } = await supabase
              .from("waiver_priority")
              .select("*")
              .order("priority", { ascending: true })

            if (!priorityFetchError && allPriorities && allPriorities.length > 0) {
              const claimingTeamPriority = allPriorities.find((p) => p.team_id === winningClaim.claiming_team_id)
              if (claimingTeamPriority) {
                const maxPriority = Math.max(...allPriorities.map((p) => p.priority))

                // Move all teams with priority > claiming team's priority up by 1
                for (const p of allPriorities) {
                  if (p.priority > claimingTeamPriority.priority) {
                    await supabase
                      .from("waiver_priority")
                      .update({ priority: p.priority - 1, updated_at: now.toISOString() })
                      .eq("team_id", p.team_id)
                  }
                }

                // Move claiming team to the bottom
                await supabase
                  .from("waiver_priority")
                  .update({
                    priority: maxPriority,
                    last_used: now.toISOString(),
                    updated_at: now.toISOString(),
                  })
                  .eq("team_id", winningClaim.claiming_team_id)

                console.log(
                  `Moved team ${winningClaim.claiming_team_id} to bottom of waiver priority (priority: ${maxPriority})`,
                )
              }
            }
          } catch (priorityError) {
            console.error("Error updating waiver priority:", priorityError)
            // Don't fail the waiver processing for priority update issues
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
