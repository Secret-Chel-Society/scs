import { createAdminClient } from "./supabase/server"

export interface WaiverStatus {
  id: string
  player_id: string
  waiving_team_id: string
  waived_at: string
  claim_deadline: string
  status: "active" | "claimed" | "expired"
  winning_team_id?: string
  time_remaining: string
  players: {
    id: string
    salary: number
    users: {
      id: string
      gamer_tag_id: string
      primary_position: string
      secondary_position?: string
      console: string
      avatar_url?: string
    }
  }
  waiving_team: {
    id: string
    name: string
    logo_url?: string
  }
  waiver_claims?: Array<{
    id: string
    claiming_team_id: string
    priority_at_claim: number
    status: string
    teams: {
      name: string
      logo_url?: string
    }
  }>
}

/**
 * Creates a new waiver for a player
 * @param playerId - The ID of the player being waived
 * @param teamId - The ID of the team waiving the player
 * @returns Promise with waiver creation result
 */
export async function createWaiver(playerId: string, teamId: string): Promise<{ success: boolean; waiver?: WaiverStatus; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // Check if player is already on waivers
    const { data: existingWaiver } = await supabase
      .from("waivers")
      .select("id")
      .eq("player_id", playerId)
      .eq("status", "active")
      .maybeSingle()

    if (existingWaiver) {
      return { success: false, error: "Player is already on waivers" }
    }

    // Calculate waiver expiry (8 hours from now)
    const claimDeadline = new Date()
    claimDeadline.setHours(claimDeadline.getHours() + 8)

    // Create the waiver
    const { data: waiver, error: waiverError } = await supabase
      .from("waivers")
      .insert({
        player_id: playerId,
        waiving_team_id: teamId,
        status: "active",
        claim_deadline: claimDeadline.toISOString(),
        waived_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (waiverError) {
      console.error("Error creating waiver:", waiverError)
      return { success: false, error: `Failed to create waiver: ${waiverError.message}` }
    }

    // Remove player from team temporarily
    const { error: updatePlayerError } = await supabase
      .from("players")
      .update({ team_id: null })
      .eq("id", playerId)

    if (updatePlayerError) {
      console.error("Error updating player team:", updatePlayerError)
      // If we fail to update the player, delete the waiver to maintain consistency
      await supabase.from("waivers").delete().eq("id", waiver.id)
      return { success: false, error: "Failed to update player status" }
    }

    return { success: true, waiver }
  } catch (error: any) {
    console.error("Error creating waiver:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Claims a player from waivers
 * @param waiverId - The ID of the waiver to claim
 * @param claimingTeamId - The ID of the team claiming the player
 * @returns Promise with claim result
 */
export async function claimPlayerFromWaivers(waiverId: string, claimingTeamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get waiver details
    const { data: waiver, error: waiverError } = await supabase
      .from("waivers")
      .select("*")
      .eq("id", waiverId)
      .eq("status", "active")
      .single()

    if (waiverError || !waiver) {
      return { success: false, error: "Waiver not found or already processed" }
    }

    // Check if waiver has expired
    if (new Date() > new Date(waiver.claim_deadline)) {
      return { success: false, error: "Waiver has expired" }
    }

    // Get team's waiver priority
    const { data: priority, error: priorityError } = await supabase
      .from("waiver_priority")
      .select("priority")
      .eq("team_id", claimingTeamId)
      .single()

    if (priorityError || !priority) {
      return { success: false, error: "Team priority not found" }
    }

    // Create waiver claim
    const { error: claimError } = await supabase
      .from("waiver_claims")
      .insert({
        waiver_id: waiverId,
        claiming_team_id: claimingTeamId,
        priority_at_claim: priority.priority,
        status: "pending",
      })

    if (claimError) {
      console.error("Error creating waiver claim:", claimError)
      return { success: false, error: "Failed to create waiver claim" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error claiming player from waivers:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Processes expired waivers and assigns players to winning teams
 * @returns Promise with processing result
 */
export async function processExpiredWaivers(): Promise<{ success: boolean; processedCount: number; error?: string }> {
  try {
    const supabase = createAdminClient()
    const now = new Date()

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
      return { success: false, processedCount: 0, error: "Failed to fetch expired waivers" }
    }

    if (!expiredWaivers || expiredWaivers.length === 0) {
      return { success: true, processedCount: 0 }
    }

    let processedCount = 0
    let assignedCount = 0
    let clearedCount = 0

    for (const waiver of expiredWaivers) {
      try {
        // Get all claims for this waiver
        const claims = waiver.waiver_claims || []
        
        if (claims.length > 0) {
          // Find the claim with the highest priority (lowest number)
          const winningClaim = claims.reduce((highest, current) => 
            current.priority_at_claim < highest.priority_at_claim ? current : highest
          )

          // Assign player to winning team
          const { error: assignError } = await supabase
            .from("players")
            .update({ 
              team_id: winningClaim.claiming_team_id,
              updated_at: now.toISOString()
            })
            .eq("id", waiver.player_id)

          if (assignError) {
            console.error(`Error assigning player ${waiver.player_id} to team:`, assignError)
            continue
          }

          // Update waiver status to claimed
          const { error: waiverUpdateError } = await supabase
            .from("waivers")
            .update({ 
              status: "claimed",
              winning_team_id: winningClaim.claiming_team_id,
              processed_at: now.toISOString()
            })
            .eq("id", waiver.id)

          if (waiverUpdateError) {
            console.error(`Error updating waiver status:`, waiverUpdateError)
          }

          // Update winning team's priority to the lowest
          const { data: maxPriority } = await supabase
            .from("waiver_priority")
            .select("priority")
            .order("priority", { ascending: false })
            .limit(1)
            .single()

          if (maxPriority) {
            await supabase
              .from("waiver_priority")
              .update({ 
                priority: maxPriority.priority + 1,
                last_claim_date: now.toISOString()
              })
              .eq("team_id", winningClaim.claiming_team_id)
          }

          assignedCount++
        } else {
          // No claims, player becomes a free agent
          const { error: waiverUpdateError } = await supabase
            .from("waivers")
            .update({ 
              status: "expired",
              processed_at: now.toISOString()
            })
            .eq("id", waiver.id)

          if (waiverUpdateError) {
            console.error(`Error updating waiver status:`, waiverUpdateError)
          }

          clearedCount++
        }

        processedCount++
      } catch (error) {
        console.error(`Error processing waiver ${waiver.id}:`, error)
      }
    }

    console.log(`Processed ${processedCount} waivers: ${assignedCount} assigned, ${clearedCount} cleared`)
    return { success: true, processedCount }
  } catch (error: any) {
    console.error("Error processing expired waivers:", error)
    return { success: false, processedCount: 0, error: error.message || "An error occurred" }
  }
}

/**
 * Gets all active waivers with player and team information
 * @returns Promise with waiver data
 */
export async function getActiveWaivers(): Promise<{ success: boolean; waivers?: WaiverStatus[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: waivers, error } = await supabase
      .from("waivers")
      .select(`
        *,
        players:player_id (
          id,
          salary,
          role,
          users:user_id (
            id,
            gamer_tag_id,
            primary_position,
            secondary_position,
            console,
            avatar_url
          )
        ),
        waiving_team:waiving_team_id (
          id,
          name,
          logo_url
        ),
        waiver_claims (
          id,
          claiming_team_id,
          priority_at_claim,
          status,
          teams:claiming_team_id (
            name,
            logo_url
          )
        )
      `)
      .eq("status", "active")
      .order("claim_deadline", { ascending: true })

    if (error) {
      console.error("Error fetching waivers:", error)
      return { success: false, error: "Failed to fetch waivers" }
    }

    // Add time remaining to each waiver
    const waiversWithTimeRemaining = waivers?.map(waiver => ({
      ...waiver,
      time_remaining: formatTimeRemaining(waiver.claim_deadline)
    })) || []

    return { success: true, waivers: waiversWithTimeRemaining }
  } catch (error: any) {
    console.error("Error in getActiveWaivers:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Formats time remaining until deadline
 * @param deadline - ISO string of the deadline
 * @returns Formatted time string
 */
function formatTimeRemaining(deadline: string): string {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate.getTime() - now.getTime()

  if (diff <= 0) {
    return "Expired"
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Resets waiver priority based on current standings
 * @returns Promise with reset result
 */
export async function resetWaiverPriority(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get teams ordered by standings (worst to best)
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, points, wins, losses, goals_for, goals_against")
      .eq("is_active", true)
      .order("points", { ascending: true })
      .order("wins", { ascending: true })
      .order("goals_for", { ascending: true })

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return { success: false, error: "Failed to fetch teams" }
    }

    // Update priority for each team
    for (let i = 0; i < teams.length; i++) {
      const { error: updateError } = await supabase
        .from("waiver_priority")
        .upsert({
          team_id: teams[i].id,
          priority: i + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: "team_id" })

      if (updateError) {
        console.error(`Error updating priority for team ${teams[i].id}:`, updateError)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error resetting waiver priority:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}
