import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    console.log("=== Starting bidding recap ===")

    // Get all bids
    const { data: bids, error: bidsError } = await supabase
      .from("player_bidding")
      .select(`
        id,
        player_id,
        team_id,
        bid_amount,
        created_at,
        status
      `)
      .order("bid_amount", { ascending: false })

    if (bidsError) {
      console.error("Error fetching bids:", bidsError)
      return NextResponse.json({ error: "Failed to fetch bids", details: bidsError.message }, { status: 500 })
    }

    console.log(`Fetched ${bids?.length || 0} bids`)

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

    // Get unique team and player IDs
    const teamIds = [...new Set(bids.map((bid) => bid.team_id).filter(Boolean))]
    const playerIds = [...new Set(bids.map((bid) => bid.player_id).filter(Boolean))]

    console.log(`Found ${teamIds.length} unique teams and ${playerIds.length} unique players`)

    // Get teams data
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, logo_url")
      .in("id", teamIds)

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams", details: teamsError.message }, { status: 500 })
    }

    // Get players with user info (this is the key relationship)
    const { data: biddingPlayers, error: biddingPlayersError } = await supabase
      .from("players")
      .select(`
        id,
        user_id,
        salary,
        team_id,
        users!inner (
          id,
          gamer_tag_id,
          primary_position,
          secondary_position
        )
      `)
      .in("id", playerIds)

    if (biddingPlayersError) {
      console.error("Error fetching bidding players:", biddingPlayersError)
      return NextResponse.json(
        { error: "Failed to fetch bidding players", details: biddingPlayersError.message },
        { status: 500 },
      )
    }

    console.log(`Fetched ${biddingPlayers?.length || 0} bidding players with user info`)

    // Get ALL current players for roster calculation
    const { data: allCurrentPlayers, error: allPlayersError } = await supabase
      .from("players")
      .select(`
        id,
        user_id,
        team_id,
        salary,
        users!inner (
          id,
          gamer_tag_id,
          primary_position,
          secondary_position
        )
      `)
      .not("team_id", "is", null)

    if (allPlayersError) {
      console.error("Error fetching all current players:", allPlayersError)
      return NextResponse.json(
        { error: "Failed to fetch all current players", details: allPlayersError.message },
        { status: 500 },
      )
    }

    console.log(`Fetched ${allCurrentPlayers?.length || 0} current players with user info`)

    // Create lookup maps
    const teamsMap = new Map()
    teams?.forEach((team) => {
      teamsMap.set(team.id, team)
    })

    // Create players map with user info
    const playersMap = new Map()
    biddingPlayers?.forEach((player) => {
      playersMap.set(player.id, {
        id: player.id,
        user_id: player.user_id,
        salary: player.salary || 0,
        current_team_id: player.team_id,
        gamer_tag_id: player.users.gamer_tag_id,
        primary_position: player.users.primary_position,
        secondary_position: player.users.secondary_position,
      })
    })

    console.log(`Created players map with ${playersMap.size} entries`)

    // Process bidding data
    const teamStatsMap = new Map()
    const playerBidsMap = new Map()

    bids.forEach((bid) => {
      const teamData = teamsMap.get(bid.team_id)
      const playerData = playersMap.get(bid.player_id)

      // Team stats
      if (!teamStatsMap.has(bid.team_id)) {
        teamStatsMap.set(bid.team_id, {
          team: {
            id: bid.team_id,
            name: teamData?.name || `Team_${bid.team_id}`,
            logo_url: teamData?.logo_url || null,
          },
          totalBids: 0,
          uniquePlayers: new Set(),
          wonPlayers: [],
        })
      }

      const teamStat = teamStatsMap.get(bid.team_id)
      teamStat.totalBids += 1
      teamStat.uniquePlayers.add(bid.player_id)

      // Player stats
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
        team: {
          id: bid.team_id,
          name: teamData?.name || `Team_${bid.team_id}`,
          logo_url: teamData?.logo_url || null,
        },
      })
      playerBid.totalBids += 1
      if (bid.bid_amount > playerBid.highestBid) {
        playerBid.highestBid = bid.bid_amount
        playerBid.winningTeam = {
          id: bid.team_id,
          name: teamData?.name || `Team_${bid.team_id}`,
          logo_url: teamData?.logo_url || null,
        }
      }
    })

    // Add won players to teams
    playerBidsMap.forEach((playerData) => {
      if (playerData.winningTeam) {
        const teamId = playerData.winningTeam.id
        if (teamStatsMap.has(teamId)) {
          teamStatsMap.get(teamId).wonPlayers.push({
            ...playerData.player,
            winningBid: playerData.highestBid,
          })
        }
      }
    })

    // Calculate current team rosters
    const teamRosterMap = new Map()
    allCurrentPlayers?.forEach((player) => {
      const teamId = player.team_id
      if (!teamRosterMap.has(teamId)) {
        teamRosterMap.set(teamId, {
          players: [],
          totalSalary: 0,
          positionCounts: {
            "Left Wing": 0,
            "Right Wing": 0,
            Center: 0,
            "Left Defense": 0,
            "Right Defense": 0,
            Goalie: 0,
          },
        })
      }

      const rosterData = teamRosterMap.get(teamId)
      const rosterPlayer = {
        id: player.id,
        user_id: player.user_id,
        gamer_tag_id: player.users.gamer_tag_id,
        primary_position: player.users.primary_position,
        secondary_position: player.users.secondary_position,
        salary: player.salary || 0,
      }

      rosterData.players.push(rosterPlayer)
      rosterData.totalSalary += player.salary || 0

      // Count positions
      const position = rosterPlayer.primary_position
      if (rosterData.positionCounts.hasOwnProperty(position)) {
        rosterData.positionCounts[position]++
      }
    })

    // Format final results
    const formattedTeamStats = Array.from(teamStatsMap.values())
      .map((stat) => {
        const rosterData = teamRosterMap.get(stat.team.id) || {
          players: [],
          totalSalary: 0,
          positionCounts: {
            "Left Wing": 0,
            "Right Wing": 0,
            Center: 0,
            "Left Defense": 0,
            "Right Defense": 0,
            Goalie: 0,
          },
        }

        return {
          ...stat,
          uniquePlayersCount: stat.uniquePlayers.size,
          currentSalary: rosterData.totalSalary,
          currentRoster: rosterData.players,
          positionCounts: rosterData.positionCounts,
          uniquePlayers: undefined, // Remove Set from response
        }
      })
      .sort((a, b) => b.totalBids - a.totalBids)

    const formattedPlayerBids = Array.from(playerBidsMap.values())
      .sort((a, b) => b.highestBid - a.highestBid)
      .map((player) => ({
        ...player,
        bids: player.bids.sort((a, b) => b.bid_amount - a.bid_amount),
      }))

    console.log(`=== Recap complete: ${formattedTeamStats.length} teams, ${formattedPlayerBids.length} players ===`)

    return NextResponse.json({
      teamStats: formattedTeamStats,
      playerBids: formattedPlayerBids,
      totalBids: bids.length,
      totalPlayers: playerBidsMap.size,
      totalTeams: teamStatsMap.size,
    })
  } catch (error) {
    console.error("=== ERROR in bidding recap ===", error)
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
