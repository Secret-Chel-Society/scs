import { createAdminClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/types/database"

export const dynamic = "force-dynamic"

// GET - Fetch release requests (for admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

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

    // Check if user is admin
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

    // Fetch release requests from all three leagues. Each league has its own
    // release table and team table, but parallel player/user FK structures.
    const leagueConfigs = [
      { league: "nhl", table: "player_releases", teamsTable: "teams" },
      { league: "ahl", table: "player_releases_ahl", teamsTable: "teams_ahl" },
      { league: "ecl", table: "player_releases_ecl", teamsTable: "teams_ecl" },
    ] as const

    const results = await Promise.all(
      leagueConfigs.map(async ({ league, table, teamsTable }) => {
        let query = adminClient
          .from(table)
          .select(`
            *,
            players (
              id,
              salary,
              users (
                id,
                gamer_tag_id,
                discord_name,
                email
              )
            ),
            ${teamsTable} (
              id,
              name,
              logo_url
            ),
            requesting_user:requesting_user_id (
              id,
              gamer_tag_id,
              discord_name
            ),
            processed_by_user:processed_by (
              id,
              gamer_tag_id,
              discord_name
            )
          `)
          .order("created_at", { ascending: false })

        if (status !== "all") {
          query = query.eq("status", status)
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error fetching ${league} release requests:`, error)
          return [] as any[]
        }

        // Normalize the league-specific team relation to a `teams` field and tag the league
        return (data || []).map((row: any) => ({
          ...row,
          league,
          teams: row[teamsTable] ?? row.teams ?? null,
        }))
      }),
    )

    const releases = results
      .flat()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ releases })
  } catch (error: any) {
    console.error("Error in player-releases GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Submit a release request (for team managers)
export async function POST(request: Request) {
  try {
    // Get the authorization header (same pattern as waivers API)
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

    const body = await request.json()
    const { player_id, reason, league = "nhl", is_tc = false } = body

    if (!player_id || !reason?.trim()) {
      return NextResponse.json({ error: "Player ID and reason are required" }, { status: 400 })
    }

    // League-specific table/column/role selection
    const releasesTable =
      league === "ahl" ? "player_releases_ahl" : league === "ecl" ? "player_releases_ecl" : "player_releases"
    // Regular roster releases use the team column; TC releases use the training-camp team column
    const rosterTeamColumn = league === "ahl" ? "team_id_ahl" : league === "ecl" ? "team_id_ecl" : "team_id"
    const tcTeamColumn = league === "ahl" ? "tc_team_id_ahl" : league === "ecl" ? "tc_team_id_ecl" : "tc_team_id"
    // The team that "owns" this player for release purposes (and whose managers may release them)
    const teamColumn = is_tc ? tcTeamColumn : rosterTeamColumn

    // Get player info
    const { data: player, error: playerError } = await adminClient
      .from("players")
      .select("id, user_id, team_id, team_id_ahl, team_id_ecl, tc_team_id, tc_team_id_ahl, tc_team_id_ecl")
      .eq("id", player_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    const teamId = (player as any)[teamColumn]
    if (!teamId) {
      return NextResponse.json(
        { error: is_tc ? "Player is not in this team's training camp" : "Player is not on a team" },
        { status: 400 },
      )
    }

    // Check if user is a manager of the team (check players table for role).
    // Managers always sit on the main roster, so validate against the roster team column
    // even for a TC release (the TC team id is the same team the manager rosters for).
    const { data: userPlayer } = await adminClient
      .from("players")
      .select("id, role")
      .eq("user_id", user.id)
      .eq(rosterTeamColumn, teamId)
      .single()

    const managerRoles =
      league === "ecl" ? ["ecl owner", "ecl gm", "ecl agm"] : ["owner", "gm", "agm"]
    const isManager = userPlayer?.role && managerRoles.includes(userPlayer.role.toLowerCase())

    // Also check user_roles table for Admin or Site Owner role
    const { data: userRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["Admin", "Site Owner"])

    const isAdmin = userRoles && userRoles.length > 0

    if (!isManager && !isAdmin) {
      return NextResponse.json({ error: "You must be a team manager to release players" }, { status: 403 })
    }

    // Check if there's already a pending release for this player
    const { data: existingRelease } = await adminClient
      .from(releasesTable)
      .select("id")
      .eq("player_id", player_id)
      .eq("status", "pending")
      .single()

    if (existingRelease) {
      return NextResponse.json({ error: "A release request is already pending for this player" }, { status: 400 })
    }

    // Create release request
    const { data: release, error: releaseError } = await adminClient
      .from(releasesTable)
      .insert({
        player_id,
        user_id: player.user_id,
        team_id: teamId,
        requesting_user_id: user.id,
        reason: reason.trim(),
        status: "pending",
        is_tc_release: is_tc,
      })
      .select()
      .single()

    if (releaseError) {
      console.error("Error creating release request:", releaseError)
      return NextResponse.json({ error: releaseError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, release })
  } catch (error: any) {
    console.error("Error in player-releases POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
