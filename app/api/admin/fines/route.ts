import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const FINE_REASONS = {
  stats_failure: { label: "Failure to Update Stats", amount: 250000 },
  transaction_leak: { label: "Illegal Transaction Leak", amount: 2000000 },
  player_tampering: { label: "Player Tampering", amount: 2000000 },
  forfeit: { label: "Forfeit (FF)", amount: 250000 },
  rule_violation: { label: "Rule Violation", amount: 0 }, // Custom amount
  other: { label: "Other", amount: 0 }, // Custom amount
}

const MAX_FINES_PER_SEASON = 3000000 // $3M cap

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const league = searchParams.get("league") || "nhl"
    const seasonId = searchParams.get("seasonId")

    const finesTable = league === "ahl" ? "team_fines_ahl" : "team_fines"
    const teamsTable = league === "ahl" ? "teams_ahl" : "teams"

    // First get the fines
    let finesQuery = adminClient
      .from(finesTable)
      .select("*")
      .order("created_at", { ascending: false })

    if (seasonId) {
      finesQuery = finesQuery.eq("season_id", seasonId)
    }

    const { data: finesData, error: finesError } = await finesQuery

    if (finesError) {
      console.error("Error fetching fines:", finesError)
      return NextResponse.json({ error: finesError.message }, { status: 500 })
    }

    // Get unique team IDs and issuer IDs
    const teamIds = [...new Set(finesData?.map(f => f.team_id).filter(Boolean) || [])]
    const issuerIds = [...new Set(finesData?.map(f => f.issued_by).filter(Boolean) || [])]

    // Fetch teams
    let teams: Record<string, any> = {}
    if (teamIds.length > 0) {
      const { data: teamsData } = await adminClient
        .from(teamsTable)
        .select("id, name, logo_url")
        .in("id", teamIds)
      
      teamsData?.forEach(t => { teams[t.id] = t })
    }

    // Fetch issuers
    let issuers: Record<string, any> = {}
    if (issuerIds.length > 0) {
      const { data: issuersData } = await adminClient
        .from("users")
        .select("id, gamer_tag_id")
        .in("id", issuerIds)
      
      issuersData?.forEach(u => { issuers[u.id] = u })
    }

    // Combine the data
    const fines = finesData?.map(fine => ({
      ...fine,
      team: teams[fine.team_id] || null,
      issuer: fine.issued_by ? issuers[fine.issued_by] || null : null,
    })) || []

    return NextResponse.json({ fines, fineReasons: FINE_REASONS, maxFinesPerSeason: MAX_FINES_PER_SEASON })
  } catch (error: any) {
    console.error("Error in fines GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { teamId, seasonId, fineAmount, reason, reasonCode, notes, league, userId } = body

    // Use userId from body as fallback
    const currentUserId = user?.id || userId

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)

    const isAdmin = roleData?.some(r => 
      r.role?.toLowerCase().includes("admin") || 
      r.role?.toLowerCase().includes("owner") ||
      r.role?.toLowerCase().includes("league manager")
    )

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const finesTable = league === "ahl" ? "team_fines_ahl" : "team_fines"
    const teamSeasonsTable = league === "ahl" ? "team_seasons_ahl" : "team_seasons"
    const teamsTable = league === "ahl" ? "teams_ahl" : "teams"
    const draftPicksTable = league === "ahl" ? "draft_picks_ahl" : "draft_picks"

    // Get current total fines for this team this season
    const { data: existingFines } = await adminClient
      .from(finesTable)
      .select("fine_amount")
      .eq("team_id", teamId)
      .eq("season_id", seasonId)

    const currentTotalFines = existingFines?.reduce((sum, f) => sum + (f.fine_amount || 0), 0) || 0
    const newTotalFines = currentTotalFines + fineAmount

    // Check if exceeding max and need to forfeit draft picks
    let draftPickForfeited = null
    if (newTotalFines > MAX_FINES_PER_SEASON) {
      // Find and forfeit a future draft pick
      const { data: availablePicks } = await adminClient
        .from(draftPicksTable)
        .select("*")
        .eq("current_team_id", teamId)
        .is("player_id", null) // Not yet used
        .order("year", { ascending: true })
        .order("round", { ascending: true })
        .limit(1)

      if (availablePicks && availablePicks.length > 0) {
        const pickToForfeit = availablePicks[0]
        
        // Mark as forfeited (set to league/null owner)
        await adminClient
          .from(draftPicksTable)
          .update({ 
            current_team_id: null,
            notes: `Forfeited due to exceeding $3M fine cap in ${seasonId}`
          })
          .eq("id", pickToForfeit.id)

        draftPickForfeited = pickToForfeit
      }
    }

    // Insert the fine
    const { data: fine, error: fineError } = await adminClient
      .from(finesTable)
      .insert({
        team_id: teamId,
        season_id: seasonId,
        fine_amount: fineAmount,
        reason,
        reason_code: reasonCode,
        notes,
        issued_by: currentUserId,
      })
      .select()
      .single()

    if (fineError) {
      console.error("Error creating fine:", fineError)
      return NextResponse.json({ error: fineError.message }, { status: 500 })
    }

    // Update team_seasons salary_fines
    const { data: teamSeason } = await adminClient
      .from(teamSeasonsTable)
      .select("id, salary_fines")
      .eq("team_id", teamId)
      .eq("season_id", seasonId)
      .single()

    if (teamSeason) {
      await adminClient
        .from(teamSeasonsTable)
        .update({ salary_fines: (teamSeason.salary_fines || 0) + fineAmount })
        .eq("id", teamSeason.id)
    } else {
      // Create team_seasons entry if doesn't exist
      await adminClient
        .from(teamSeasonsTable)
        .insert({
          team_id: teamId,
          season_id: seasonId,
          salary_fines: fineAmount,
        })
    }

    // Get team info for notifications
    const { data: team } = await adminClient
      .from(teamsTable)
      .select("id, name")
      .eq("id", teamId)
      .single()

    // Get team management (Owner, GM, AGM) from players table
    // Note: players table is used for both NHL and AHL - filter by team_id
    const { data: teamManagement } = await adminClient
      .from("players")
      .select("user_id, role")
      .eq("team_id", teamId)
      .in("role", ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"])

    // Send notifications to owner, GM, and AGM
    if (team) {
      const recipientIds = teamManagement?.map(m => m.user_id).filter(Boolean) || []
      const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(fineAmount)
      
      let notificationMessage = `Your team ${team.name} has been fined ${formattedAmount} for: ${reason}`
      if (draftPickForfeited) {
        notificationMessage += `. Additionally, a ${draftPickForfeited.year} Round ${draftPickForfeited.round} draft pick has been forfeited due to exceeding the $3M fine cap.`
      }

      const notifications = recipientIds.map(recipientId => ({
        user_id: recipientId,
        type: "team_fine",
        title: "Team Fine Issued",
        message: notificationMessage,
        data: {
          fineId: fine.id,
          teamId,
          amount: fineAmount,
          reason,
          reasonCode,
          draftPickForfeited: draftPickForfeited ? {
            year: draftPickForfeited.year,
            round: draftPickForfeited.round,
          } : null,
        },
        read: false,
      }))

      if (notifications.length > 0) {
        await adminClient.from("notifications").insert(notifications)
      }
    }

    return NextResponse.json({ 
      success: true, 
      fine, 
      newTotalFines,
      draftPickForfeited,
      exceededCap: newTotalFines > MAX_FINES_PER_SEASON,
    })
  } catch (error: any) {
    console.error("Error creating fine:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()
    const { fineId, league, userId } = body

    const currentUserId = user?.id || userId

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)

    const isAdmin = roleData?.some(r => 
      r.role?.toLowerCase().includes("admin") || 
      r.role?.toLowerCase().includes("owner") ||
      r.role?.toLowerCase().includes("league manager")
    )

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const finesTable = league === "ahl" ? "team_fines_ahl" : "team_fines"
    const teamSeasonsTable = league === "ahl" ? "team_seasons_ahl" : "team_seasons"

    // Get the fine first
    const { data: fine } = await adminClient
      .from(finesTable)
      .select("*")
      .eq("id", fineId)
      .single()

    if (!fine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 })
    }

    // Delete the fine
    const { error: deleteError } = await adminClient
      .from(finesTable)
      .delete()
      .eq("id", fineId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Update team_seasons salary_fines
    const { data: teamSeason } = await adminClient
      .from(teamSeasonsTable)
      .select("id, salary_fines")
      .eq("team_id", fine.team_id)
      .eq("season_id", fine.season_id)
      .single()

    if (teamSeason) {
      await adminClient
        .from(teamSeasonsTable)
        .update({ salary_fines: Math.max(0, (teamSeason.salary_fines || 0) - fine.fine_amount) })
        .eq("id", teamSeason.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting fine:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
