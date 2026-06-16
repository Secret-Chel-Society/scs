import { createAdminClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/types/database"
import { logActivity } from "@/lib/activity-log"

export const dynamic = "force-dynamic"

// PATCH - Process a release request (approve/deny)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }
    
    // Extract the token
    const token = authHeader.replace("Bearer ", "")
    
    // Create Supabase client with the token
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    )
    const adminClient = createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 })
    }

    // Check user_roles table for Admin or Site Owner role
    const { data: userRoles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["Admin", "Site Owner"])

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
    }

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action, admin_notes, ban_player, ban_reason, league = "nhl" } = body

    if (!["approve", "deny"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // League-specific table/column configuration
    const leagueConfig = {
      nhl: { releasesTable: "player_releases", teamCol: "team_id", tcCol: "tc_team_id", waiversTable: "waivers", label: "NHL" },
      ahl: { releasesTable: "player_releases_ahl", teamCol: "team_id_ahl", tcCol: "tc_team_id_ahl", waiversTable: "waivers_ahl", label: "AHL" },
      ecl: { releasesTable: "player_releases_ecl", teamCol: "team_id_ecl", tcCol: "tc_team_id_ecl", waiversTable: "waivers_ecl", label: "ECL" },
    } as const

    const cfg = leagueConfig[league as keyof typeof leagueConfig] || leagueConfig.nhl

    // Get the release request from the league-specific table
    const { data: release, error: releaseError } = await adminClient
      .from(cfg.releasesTable)
      .select(`
        *,
        players (
          id,
          user_id,
          team_id,
          team_id_ahl,
          team_id_ecl,
          tc_team_id,
          tc_team_id_ahl,
          tc_team_id_ecl
        )
      `)
      .eq("id", id)
      .single()

    if (releaseError || !release) {
      return NextResponse.json({ error: "Release request not found" }, { status: 404 })
    }

    if (release.status !== "pending") {
      return NextResponse.json({ error: "Release request has already been processed" }, { status: 400 })
    }

    const now = new Date().toISOString()

    if (action === "approve") {
      
      // Remove player from the relevant team and mark as released.
      // Note: status column constraint only allows: active, free_agent, waived, retired
      // We use free_agent + is_released=true to mark the player as released.
      const isTcRelease = (release as any).is_tc_release === true
      const playerUpdate: Record<string, any> = {
        [cfg.teamCol]: null,
        status: "free_agent",
        is_released: true,
      }
      // For a Training Camp release, also clear the TC assignment for this league
      // (both the roster team_id and the tc_team_id are nulled).
      if (isTcRelease) {
        playerUpdate[cfg.tcCol] = null
        playerUpdate.is_tc = false
      }

      const { error: playerError } = await adminClient
        .from("players")
        .update(playerUpdate)
        .eq("id", release.player_id)

      if (playerError) {
        console.error("Error updating player:", playerError)
        return NextResponse.json({ error: "Failed to release player" }, { status: 500 })
      }

      // If banning the player, update users table
      if (ban_player && ban_reason?.trim()) {
        const { error: banError } = await adminClient
          .from("users")
          .update({
            ban_reason: ban_reason.trim(),
            ban_expiration: null, // Permanent ban
          })
          .eq("id", release.user_id)

        if (banError) {
          console.error("Error banning user:", banError)
          // Don't fail the release, just log the error
        }
      }

      // Update release request
      const { error: updateError } = await adminClient
        .from(cfg.releasesTable)
        .update({
          status: "approved",
          admin_notes: admin_notes?.trim() || null,
          was_banned: ban_player || false,
          ban_reason: ban_player ? ban_reason?.trim() : null,
          processed_by: user.id,
          processed_at: now,
          updated_at: now,
        })
        .eq("id", id)

      if (updateError) {
        console.error("Error updating release request:", updateError)
        return NextResponse.json({ error: "Failed to update release request" }, { status: 500 })
      }

      // Cancel any active bids for this player (player_bidding is shared across leagues)
      await adminClient
        .from("player_bidding")
        .update({ status: "cancelled" })
        .eq("player_id", release.player_id)
        .eq("status", "active")

      // Cancel any pending waivers for this player in the relevant league
      await adminClient
        .from(cfg.waiversTable)
        .update({ status: "cancelled", updated_at: now })
        .eq("player_id", release.player_id)
        .eq("status", "pending")

      // Log activity
      try {
        const { data: adminUser } = await adminClient
          .from("users")
          .select("gamer_tag_id")
          .eq("id", user.id)
          .single()
        
        const { data: playerUser } = await adminClient
          .from("users")
          .select("gamer_tag_id")
          .eq("id", release.user_id)
          .single()
        
        await logActivity(adminClient, {
          actorId: user.id,
          actorName: adminUser?.gamer_tag_id || "Admin",
          actorType: "Admin",
          actionType: "release_approved",
          actionDescription: `Approved ${cfg.label}${(release as any).is_tc_release ? " TC" : ""} release request for ${playerUser?.gamer_tag_id || "Unknown Player"}${ban_player ? " (with ban)" : ""}`,
          targetId: release.player_id,
          targetName: playerUser?.gamer_tag_id || "Unknown Player",
          category: "Release",
          league: cfg.label,
        })
      } catch (logError) {
        console.error("Error logging activity:", logError)
      }

      return NextResponse.json({ 
        success: true, 
        message: ban_player ? "Player released and banned" : "Player released successfully" 
      })
    } else {
      // Deny the release request
      const { error: updateError } = await adminClient
        .from(cfg.releasesTable)
        .update({
          status: "denied",
          admin_notes: admin_notes?.trim() || null,
          processed_by: user.id,
          processed_at: now,
          updated_at: now,
        })
        .eq("id", id)

      if (updateError) {
        console.error("Error updating release request:", updateError)
        return NextResponse.json({ error: "Failed to update release request" }, { status: 500 })
      }

      // Log activity
      try {
        const { data: adminUser } = await adminClient
          .from("users")
          .select("gamer_tag_id")
          .eq("id", user.id)
          .single()
        
        const { data: playerUser } = await adminClient
          .from("users")
          .select("gamer_tag_id")
          .eq("id", release.user_id)
          .single()
        
        await logActivity(adminClient, {
          actorId: user.id,
          actorName: adminUser?.gamer_tag_id || "Admin",
          actorType: "Admin",
          actionType: "release_denied",
          actionDescription: `Denied ${cfg.label}${(release as any).is_tc_release ? " TC" : ""} release request for ${playerUser?.gamer_tag_id || "Unknown Player"}`,
          targetId: release.player_id,
          targetName: playerUser?.gamer_tag_id || "Unknown Player",
          category: "Release",
          league: cfg.label,
        })
      } catch (logError) {
        console.error("Error logging activity:", logError)
      }

      return NextResponse.json({ success: true, message: "Release request denied" })
    }
  } catch (error: any) {
    console.error("Error in player-releases PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
