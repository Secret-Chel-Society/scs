import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    console.log("Direct teams API called - checking database directly...")
    
    // Get all teams with basic info
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, logo_url, division, conference, is_active")
      .order("name")

    if (teamsError) {
      console.error("Error fetching teams directly:", teamsError)
      throw new Error(`Error fetching teams: ${teamsError.message}`)
    }

    console.log(`Direct query found ${teams?.length || 0} teams`)

    if (!teams || teams.length === 0) {
      return NextResponse.json({ teams: [], message: "No teams found in database" })
    }

    // Get player counts for each team
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("team_id, salary")
      .not("team_id", "is", null)

    if (playerError) {
      console.error("Error fetching player data:", playerError)
    }

    // Calculate player counts and salaries by team
    const playerCountByTeam: Record<string, number> = {}
    const totalSalaryByTeam: Record<string, number> = {}

    playerData?.forEach((player) => {
      if (player.team_id) {
        playerCountByTeam[player.team_id] = (playerCountByTeam[player.team_id] || 0) + 1
        totalSalaryByTeam[player.team_id] = (totalSalaryByTeam[player.team_id] || 0) + (player.salary || 0)
      }
    })

    // Get basic match stats for each team
    const { data: matchesData, error: matchesError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id, home_score, away_score, status")
      .eq("status", "completed")
      .not("home_score", "is", null)
      .not("away_score", "is", null)

    if (matchesError) {
      console.error("Error fetching matches data:", matchesError)
    }

    // Calculate basic stats for each team
    const teamsWithStats = teams.map((team) => {
      let wins = 0
      let losses = 0
      let otl = 0
      let goalsFor = 0
      let goalsAgainst = 0

      matchesData?.forEach((match) => {
        if (match.home_team_id === team.id) {
          goalsFor += match.home_score || 0
          goalsAgainst += match.away_score || 0
          if ((match.home_score || 0) > (match.away_score || 0)) {
            wins++
          } else {
            losses++
          }
        } else if (match.away_team_id === team.id) {
          goalsFor += match.away_score || 0
          goalsAgainst += match.home_score || 0
          if ((match.away_score || 0) > (match.home_score || 0)) {
            wins++
          } else {
            losses++
          }
        }
      })

      const points = wins * 2 + otl
      const goalDifferential = goalsFor - goalsAgainst

      return {
        ...team,
        wins,
        losses,
        otl,
        points,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        goal_differential: goalDifferential,
        player_count: playerCountByTeam[team.id] || 0,
        total_salary: totalSalaryByTeam[team.id] || 0,
        cap_space: 30000000 - (totalSalaryByTeam[team.id] || 0),
        awards: [], // No awards for direct query
      }
    })

    console.log(`Returning ${teamsWithStats.length} teams with stats`)
    return NextResponse.json({ teams: teamsWithStats })
  } catch (error: any) {
    console.error("Error in direct teams API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
