import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Map league param to the correct DB columns and tables
const LEAGUE_CONFIG = {
  nhl: {
    teamCol: "team_id",
    seasonCol: "season_id",
    teamsTable: "teams",
    settingsTable: "system_settings",
    currentSalaryCol: "salary",
    currentTeamCol: "team_id",
  },
  ahl: {
    teamCol: "team_id_ahl",
    seasonCol: "season_id_ahl",
    teamsTable: "teams_ahl",
    settingsTable: "system_settings_ahl",
    currentSalaryCol: "salary_ahl",
    currentTeamCol: "team_id_ahl",
  },
  ecl: {
    teamCol: "team_id_ecl",
    seasonCol: "season_id_ecl",
    teamsTable: "teams_ecl",
    settingsTable: "system_settings_ecl",
    currentSalaryCol: "salary_ecl",
    currentTeamCol: "team_id_ecl",
  },
} as const

type League = keyof typeof LEAGUE_CONFIG

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const league = (searchParams.get("league") || "nhl").toLowerCase() as League
    const seasonId = searchParams.get("season_id") || null

    const config = LEAGUE_CONFIG[league] || LEAGUE_CONFIG.nhl

    // Build bids query — filter by league's team column being non-null
    let bidsQuery = supabase
      .from("player_bidding")
      .select(`id, player_id, ${config.teamCol}, ${config.seasonCol}, bid_amount, created_at, status`)
      .not(config.teamCol, "is", null)
      .order("bid_amount", { ascending: false })

    if (seasonId) {
      bidsQuery = bidsQuery.eq(config.seasonCol, seasonId)
    }

    const { data: bids, error: bidsError } = await bidsQuery

    if (bidsError) {
      return NextResponse.json({ error: "Failed to fetch bids", details: bidsError.message }, { status: 500 })
    }

    if (!bids || bids.length === 0) {
      return NextResponse.json({
        teamStats: [],
        playerBids: [],
        totalBids: 0,
        totalPlayers: 0,
        totalTeams: 0,
        message: "No bidding data found",
      })
    }

    const teamIds = [...new Set(bids.map((b: any) => b[config.teamCol]).filter(Boolean))]
    const playerIds = [...new Set(bids.map((b: any) => b.player_id).filter(Boolean))]

    // Fetch teams from the correct league table
    const { data: teams, error: teamsError } = await supabase
      .from(config.teamsTable)
      .select("id, name, logo_url")
      .in("id", teamIds)

    if (teamsError) {
      return NextResponse.json({ error: "Failed to fetch teams", details: teamsError.message }, { status: 500 })
    }

    // Fetch players (no season_registrations embed — join via user_id instead)
    const { data: biddingPlayers, error: biddingPlayersError } = await supabase
      .from("players")
      .select(`id, user_id, ${config.currentSalaryCol}, ${config.currentTeamCol}, users!inner(id, gamer_tag_id)`)
      .in("id", playerIds)

    if (biddingPlayersError) {
      return NextResponse.json({ error: "Failed to fetch players", details: biddingPlayersError.message }, { status: 500 })
    }

    // Fetch positions from season_registrations via user_id (no FK from players)
    const userIds = [...new Set((biddingPlayers || []).map((p: any) => p.user_id).filter(Boolean))]
    let positionsMap = new Map<string, { primary: string; secondary: string | null }>()

    if (userIds.length > 0) {
      let posQuery = supabase
        .from("season_registrations")
        .select("user_id, primary_position, secondary_position")
        .in("user_id", userIds)

      if (seasonId) {
        posQuery = posQuery.eq("season_id", seasonId)
      }

      const { data: positions } = await posQuery
      positions?.forEach((reg: any) => {
        if (!positionsMap.has(reg.user_id)) {
          positionsMap.set(reg.user_id, {
            primary: reg.primary_position || "Unknown",
            secondary: reg.secondary_position || null,
          })
        }
      })
    }

    // Fetch all current rostered players for this league
    const { data: allCurrentPlayers, error: allPlayersError } = await supabase
      .from("players")
      .select(`id, user_id, ${config.currentTeamCol}, ${config.currentSalaryCol}, users!inner(id, gamer_tag_id)`)
      .not(config.currentTeamCol, "is", null)

    if (allPlayersError) {
      return NextResponse.json({ error: "Failed to fetch roster", details: allPlayersError.message }, { status: 500 })
    }

    // Build lookup maps
    const teamsMap = new Map<string, any>()
    teams?.forEach((t: any) => teamsMap.set(t.id, t))

    const playersMap = new Map<string, any>()
    biddingPlayers?.forEach((p: any) => {
      const pos = positionsMap.get(p.user_id)
      playersMap.set(p.id, {
        id: p.id,
        user_id: p.user_id,
        salary: p[config.currentSalaryCol] || 0,
        current_team_id: p[config.currentTeamCol],
        gamer_tag_id: p.users.gamer_tag_id,
        primary_position: pos?.primary || "Unknown",
        secondary_position: pos?.secondary || null,
      })
    })

    // Process bids
    const teamStatsMap = new Map<string, any>()
    const playerBidsMap = new Map<string, any>()

    bids.forEach((bid: any) => {
      const teamId = bid[config.teamCol]
      const teamData = teamsMap.get(teamId)
      const playerData = playersMap.get(bid.player_id)

      if (!teamStatsMap.has(teamId)) {
        teamStatsMap.set(teamId, {
          team: { id: teamId, name: teamData?.name || `Team_${teamId}`, logo_url: teamData?.logo_url || null },
          totalBids: 0,
          uniquePlayers: new Set<string>(),
          wonPlayers: [],
        })
      }

      const teamStat = teamStatsMap.get(teamId)
      teamStat.totalBids += 1
      teamStat.uniquePlayers.add(bid.player_id)

      if (!playerBidsMap.has(bid.player_id)) {
        playerBidsMap.set(bid.player_id, {
          player: {
            id: bid.player_id,
            gamer_tag_id: playerData?.gamer_tag_id || `Player_${bid.player_id}`,
            primary_position: playerData?.primary_position || "Unknown",
            secondary_position: playerData?.secondary_position || null,
            current_team_id: playerData?.current_team_id || null,
            salary: playerData?.salary || 0,
          },
          bids: [],
          highestBid: 0,
          totalBids: 0,
          winningTeam: null,
        })
      }

      const playerBid = playerBidsMap.get(bid.player_id)
      playerBid.bids.push({
        id: bid.id,
        bid_amount: bid.bid_amount,
        created_at: bid.created_at,
        team: { id: teamId, name: teamData?.name || `Team_${teamId}`, logo_url: teamData?.logo_url || null },
      })
      playerBid.totalBids += 1
      if (bid.bid_amount > playerBid.highestBid) {
        playerBid.highestBid = bid.bid_amount
        playerBid.winningTeam = { id: teamId, name: teamData?.name || `Team_${teamId}`, logo_url: teamData?.logo_url || null }
      }
    })

    // Attach won players to teams
    playerBidsMap.forEach((playerData) => {
      if (playerData.winningTeam) {
        const ts = teamStatsMap.get(playerData.winningTeam.id)
        if (ts) {
          ts.wonPlayers.push({ ...playerData.player, winningBid: playerData.highestBid })
        }
      }
    })

    // Build roster per team
    const teamRosterMap = new Map<string, any>()
    allCurrentPlayers?.forEach((p: any) => {
      const teamId = p[config.currentTeamCol]
      if (!teamRosterMap.has(teamId)) {
        teamRosterMap.set(teamId, { players: [], totalSalary: 0 })
      }
      const roster = teamRosterMap.get(teamId)
      const pos = positionsMap.get(p.user_id)
      roster.players.push({
        id: p.id,
        gamer_tag_id: p.users.gamer_tag_id,
        primary_position: pos?.primary || "Unknown",
        secondary_position: pos?.secondary || null,
        salary: p[config.currentSalaryCol] || 0,
      })
      roster.totalSalary += p[config.currentSalaryCol] || 0
    })

    const formattedTeamStats = Array.from(teamStatsMap.values())
      .map((stat) => {
        const rosterData = teamRosterMap.get(stat.team.id) || { players: [], totalSalary: 0 }
        return {
          ...stat,
          uniquePlayersCount: stat.uniquePlayers.size,
          currentSalary: rosterData.totalSalary,
          currentRoster: rosterData.players,
          uniquePlayers: undefined,
        }
      })
      .sort((a, b) => b.totalBids - a.totalBids)

    const formattedPlayerBids = Array.from(playerBidsMap.values())
      .sort((a, b) => b.highestBid - a.highestBid)
      .map((p) => ({ ...p, bids: p.bids.sort((a: any, b: any) => b.bid_amount - a.bid_amount) }))

    return NextResponse.json({
      teamStats: formattedTeamStats,
      playerBids: formattedPlayerBids,
      totalBids: bids.length,
      totalPlayers: playerBidsMap.size,
      totalTeams: teamStatsMap.size,
    })
  } catch (error) {
    console.error("Error in bidding recap:", error)
    return NextResponse.json(
      { error: "Server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
