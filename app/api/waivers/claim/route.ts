import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { logActivity, getUserActorType } from "@/lib/activity-log"
import { calculateStandings } from "@/lib/standings-calculator"

export async function POST(request: Request) {
  try {
    // Create admin client for server operations
    const supabase = createAdminClient()

    const { waiverId, teamId } = await request.json()

    if (!waiverId || !teamId) {
      return NextResponse.json({ error: "Missing waiverId or teamId" }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify the user with the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error("User verification failed:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Authenticated user:", user.id)

    // Verify user is a manager of the team
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("role, team_id")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .single()

    if (playerError || !playerData) {
      console.error("Team verification error:", playerError)
      return NextResponse.json({ error: "You must be on a team to claim players" }, { status: 403 })
    }

    // Check if user has permission to claim players
    const managerRoles = ["Owner", "GM", "AGM", "Coach", "Assistant Coach"]
    if (!managerRoles.includes(playerData.role)) {
      // Also check user_roles table as backup
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      if (rolesError || !userRoles) {
        console.error("User does not have manager permissions. Player role:", playerData.role)
        return NextResponse.json(
          {
            error: "You must be a team manager (GM, AGM, Owner, Coach) to claim players",
          },
          { status: 403 },
        )
      }

      const hasManagerRole = userRoles.some((ur) =>
        ["Owner", "GM", "AGM", "Coach", "Assistant Coach", "Admin", "SuperAdmin"].includes(ur.role),
      )

      if (!hasManagerRole) {
        console.error("User does not have manager permissions. Player role:", playerData.role)
        return NextResponse.json(
          {
            error: "You must be a team manager (GM, AGM, Owner, Coach) to claim players",
          },
          { status: 403 },
        )
      }
    }

    // Check if waiver exists and is active
    const { data: waiver, error: waiverError } = await supabase
      .from("waivers")
      .select(`
        id,
        player_id,
        claim_deadline,
        status,
        waiving_team_id
      `)
      .eq("id", waiverId)
      .eq("status", "active")
      .single()

    if (waiverError || !waiver) {
      console.error("Waiver verification error:", waiverError)
      return NextResponse.json({ error: "Waiver not found or not active" }, { status: 404 })
    }

    // Check if waiver deadline has passed
    const claimDeadline = new Date(waiver.claim_deadline)
    const now = new Date()
    if (now > claimDeadline) {
      return NextResponse.json({ error: "Waiver claim deadline has passed" }, { status: 400 })
    }

    // Check if team is trying to claim their own waived player
    if (waiver.waiving_team_id === teamId) {
      return NextResponse.json({ error: "Cannot claim your own waived player" }, { status: 400 })
    }

    // Check if team has already claimed this waiver
    const { data: existingClaim, error: existingClaimError } = await supabase
      .from("waiver_claims")
      .select("id")
      .eq("waiver_id", waiverId)
      .eq("claiming_team_id", teamId)
      .eq("status", "pending")
      .maybeSingle()

    if (existingClaimError) {
      console.error("Error checking existing claim:", existingClaimError)
      return NextResponse.json({ error: "Database error checking existing claims" }, { status: 500 })
    }

    if (existingClaim) {
      return NextResponse.json({ error: "Team has already claimed this waiver" }, { status: 400 })
    }

    // Get team's current waiver priority based on standings (lower points = higher priority)
    let priorityValue = 999 // Default to low priority
    
    // Get current season ID
    const { data: seasonSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "current_season")
      .single()
    
    if (seasonSetting?.value) {
      try {
        // Use standings calculator to get team's position
        const standings = await calculateStandings(seasonSetting.value)
        
        // Find this team's standing - lower points = higher waiver priority (lower number)
        // Sort by points ascending so worst teams have lowest priority numbers
        const sortedByPoints = [...standings].sort((a, b) => a.points - b.points)
        const teamIndex = sortedByPoints.findIndex(s => s.id === teamId)
        
        if (teamIndex !== -1) {
          // Priority is 1-based index (team with lowest points gets priority 1)
          priorityValue = teamIndex + 1
          console.log(`Team ${teamId} has waiver priority ${priorityValue} based on standings (${sortedByPoints[teamIndex].points} points)`)
        } else {
          console.log(`Team ${teamId} not found in standings, using default priority`)
        }
      } catch (standingsError) {
        console.error("Error calculating standings for waiver priority:", standingsError)
      }
    }

    // Create the waiver claim
    const { data: claimData, error: claimError } = await supabase
      .from("waiver_claims")
      .insert({
        waiver_id: waiverId,
        claiming_team_id: teamId,
        priority_at_claim: priorityValue,
        claimed_at: new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single()

    if (claimError) {
      console.error("Error creating waiver claim:", claimError)
      return NextResponse.json({ error: "Failed to create waiver claim" }, { status: 500 })
    }

    // Get team name for response
    const { data: team } = await supabase.from("teams").select("name").eq("id", teamId).single()

    // Log activity
    try {
      const { data: actorUser } = await supabase
        .from("users")
        .select("gamer_tag_id")
        .eq("id", user.id)
        .single()
      
      // Get player name being claimed
      const { data: claimedPlayer } = await supabase
        .from("players")
        .select("users:user_id(gamer_tag_id)")
        .eq("id", waiver.player_id)
        .single()
      
      const playerName = (claimedPlayer?.users as any)?.gamer_tag_id || "Unknown Player"
      const actorType = await getUserActorType(supabase, user.id)
      
      await logActivity(supabase, {
        actorId: user.id,
        actorName: actorUser?.gamer_tag_id || "Manager",
        actorType,
        actionType: "waiver_claimed",
        actionDescription: `${team?.name || "Team"} submitted waiver claim for ${playerName}`,
        targetId: waiver.player_id,
        targetName: playerName,
        category: "Waiver",
        league: "NHL",
      })
    } catch (logError) {
      console.error("Error logging waiver claim activity:", logError)
    }

    return NextResponse.json({
      success: true,
      message: "Waiver claim submitted successfully",
      claim: claimData,
      team_name: team?.name,
    })
  } catch (error: any) {
    console.error("Error claiming waiver:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
