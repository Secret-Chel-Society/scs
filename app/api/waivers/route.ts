import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
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
          get() {
            return undefined
          },
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

    // Get the user from the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user from token:", userError)
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 })
    }

    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 })
    }

    // Get user's team and role
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("team_id, role")
      .eq("user_id", user.id)
      .single()

    if (playerError || !playerData?.team_id) {
      console.error("Team verification error:", playerError)
      return NextResponse.json({ error: "You must be on a team to waive players" }, { status: 403 })
    }

    const teamId = playerData.team_id

    // Check if user has permission to waive players - check multiple sources
    let isManager = false

    // First check the players table role
    if (["Owner", "GM", "AGM", "Coach", "Assistant Coach"].includes(playerData.role)) {
      isManager = true
    }

    // Also check user_roles table as backup
    if (!isManager) {
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      if (!rolesError && userRoles) {
        const hasManagerRole = userRoles.some((ur) =>
          ["Owner", "GM", "AGM", "Coach", "Assistant Coach", "Admin", "SuperAdmin"].includes(ur.role),
        )
        if (hasManagerRole) {
          isManager = true
        }
      }
    }

    // Also check if user is admin (can waive any player)
    if (!isManager) {
      const { data: adminCheck, error: adminError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["Admin", "SuperAdmin"])

      if (!adminError && adminCheck && adminCheck.length > 0) {
        isManager = true
      }
    }

    if (!isManager) {
      console.error("User does not have manager permissions. Player role:", playerData.role)
      return NextResponse.json(
        {
          error: "You must be a team manager (GM, AGM, Owner, Coach) to waive players",
        },
        { status: 403 },
      )
    }

    // Verify the player belongs to this team (unless user is admin)
    const { data: targetPlayer, error: targetPlayerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .single()

    if (targetPlayerError || !targetPlayer) {
      console.error("Player verification error:", targetPlayerError)
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Check if admin or if player belongs to user's team
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["Admin", "SuperAdmin"])

    const isAdmin = adminRoles && adminRoles.length > 0

    if (!isAdmin && targetPlayer.team_id !== teamId) {
      console.error("Player does not belong to user's team. Player team:", targetPlayer.team_id, "User team:", teamId)
      return NextResponse.json({ error: "Player not found on your team" }, { status: 404 })
    }

    // Check if player is already on waivers
    const { data: existingWaiver } = await supabase
      .from("waivers")
      .select("id")
      .eq("player_id", playerId)
      .eq("status", "active")
      .maybeSingle()

    if (existingWaiver) {
      return NextResponse.json({ error: "Player is already on waivers" }, { status: 400 })
    }

    // Calculate waiver expiry (8 hours from now)
    const claimDeadline = new Date()
    claimDeadline.setHours(claimDeadline.getHours() + 8)

    // Create the waiver
    const { data: waiver, error: waiverError } = await supabase
      .from("waivers")
      .insert({
        player_id: playerId,
        waiving_team_id: targetPlayer.team_id,
        status: "active",
        claim_deadline: claimDeadline.toISOString(),
        waived_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (waiverError) {
      console.error("Error creating waiver:", waiverError)
      return NextResponse.json({ error: "Failed to create waiver: " + waiverError.message }, { status: 500 })
    }

    // Cancel and finalize all existing bids for this player to prevent cron job conflicts
    const { error: cancelBidsError } = await supabase
      .from("player_bidding")
      .update({
        status: "cancelled_waiver",
        processed: true,
        finalized: true,
        processed_at: new Date().toISOString(),
      })
      .eq("player_id", playerId)
      .eq("finalized", false)

    if (cancelBidsError) {
      console.error("Error cancelling existing bids:", cancelBidsError)
      // Continue anyway - waiver is more important than bid cleanup
    }

    // Remove player from team temporarily
    const { error: updatePlayerError } = await supabase.from("players").update({ team_id: null }).eq("id", playerId)

    if (updatePlayerError) {
      console.error("Error updating player team:", updatePlayerError)
      // If we fail to update the player, delete the waiver to maintain consistency
      await supabase.from("waivers").delete().eq("id", waiver.id)
      return NextResponse.json({ error: "Failed to update player status" }, { status: 500 })
    }

    // Send notification to the player
    const { data: playerUser } = await supabase
      .from("users")
      .select("id, gamer_tag_id")
      .eq("id", targetPlayer.user_id)
      .single()

    if (playerUser) {
      await supabase.from("notifications").insert({
        user_id: playerUser.id,
        title: "You've been placed on waivers",
        message: `You have been placed on waivers by your team. Other teams can claim you for the next 8 hours.`,
        read: false,
      })
    }

    // Get team name for response
    const { data: team } = await supabase.from("teams").select("name").eq("id", targetPlayer.team_id).single()

    return NextResponse.json({
      success: true,
      message: "Player successfully placed on waivers",
      waiver,
      team_name: team?.name,
    })
  } catch (error: any) {
    console.error("Error creating waiver:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")

    // Create Supabase client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
        global: authHeader
          ? {
              headers: {
                Authorization: authHeader,
              },
            }
          : undefined,
      },
    )

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"

    console.log("Fetching waivers with status:", status)

    // Process expired waivers first to ensure they don't show up in the results
    if (status === "active") {
      const now = new Date().toISOString()

      // Find expired waivers
      const { data: expiredWaivers, error: expiredError } = await supabase
        .from("waivers")
        .select("id")
        .eq("status", "active")
        .lt("claim_deadline", now)

      if (!expiredError && expiredWaivers && expiredWaivers.length > 0) {
        console.log(`Found ${expiredWaivers.length} expired waivers, marking as processing`)

        // Mark them as processing to prevent them from showing up in future queries
        const expiredIds = expiredWaivers.map((w) => w.id)
        await supabase.from("waivers").update({ status: "processing" }).in("id", expiredIds)

        // Trigger processing in the background
        try {
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/waivers/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }).catch((err) => console.error("Background processing error:", err))
        } catch (err) {
          console.error("Failed to trigger background processing:", err)
        }
      }
    }

    // Get all waivers with player and team information
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
      .eq("status", status)
      .order("claim_deadline", { ascending: true })

    if (error) {
      console.error("Error fetching waivers:", error)
      return NextResponse.json({ error: "Failed to fetch waivers" }, { status: 500 })
    }

    console.log(`Found ${waivers?.length || 0} waivers with status ${status}`)

    // Filter out any waivers with null players (shouldn't happen, but just in case)
    const validWaivers = waivers?.filter((w) => w.players) || []

    return NextResponse.json({ waivers: validWaivers })
  } catch (error: any) {
    console.error("Error in waivers GET:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
