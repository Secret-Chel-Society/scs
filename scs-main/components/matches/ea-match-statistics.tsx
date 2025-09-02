"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ExternalLink, RefreshCw, Save, Check, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { PlayerClickableLink } from "./player-clickable-link"
import { TeamLogo } from "@/components/team-logo"

// Enhanced position mapping function that preserves specific defense positions
function mapEaPositionToStandard(positionCode: string): string {
  const positionMap: Record<string, string> = {
    "0": "G",
    "1": "RD",
    "2": "LD",
    "3": "RW",
    "4": "LW",
    "5": "C",
  }

  // Handle numeric codes first (most reliable)
  if (positionMap[positionCode]) {
    return positionMap[positionCode]
  }

  // Handle text position names with specific defense positions
  const positionLower = positionCode.toLowerCase()

  if (positionLower === "goalie" || positionLower === "g") {
    return "G"
  }

  // Specific defense positions
  if (positionLower === "right defense" || positionLower === "rd" || positionLower === "rightdefense") {
    return "RD"
  }

  if (positionLower === "left defense" || positionLower === "ld" || positionLower === "leftdefense") {
    return "LD"
  }

  // Wing positions
  if (positionLower === "right wing" || positionLower === "rw" || positionLower === "rightwing") {
    return "RW"
  }

  if (positionLower === "left wing" || positionLower === "lw" || positionLower === "leftwing") {
    return "LW"
  }

  // Center
  if (positionLower === "center" || positionLower === "c") {
    return "C"
  }

  // Generic defensemen - only use as last resort and return "D" to indicate unknown defense position
  if (positionLower === "defensemen" || positionLower === "defensemen" || positionLower === "defense") {
    return "D"
  }

  // Default to the original position if no mapping found
  return positionCode
}

// Helper function to determine if a player is a goalie
function isGoalie(position: string): boolean {
  return position === "G" || position === "Goalie" || position === "goalie" || position === "0"
}

// Helper function to format save percentage with 3 decimal places
function formatSavePercentage(savePercentage: number | string | undefined): string {
  if (savePercentage === undefined || savePercentage === null) return ".000"

  let numericValue: number
  if (typeof savePercentage === "string") {
    numericValue = Number.parseFloat(savePercentage)
  } else {
    numericValue = savePercentage
  }

  // If the value is already in decimal form (e.g., 0.923)
  if (numericValue < 1) {
    return `.${(numericValue * 1000).toFixed(0).padStart(3, "0")}`
  }
  // If the value is in percentage form (e.g., 92.3)
  else {
    return `.${(numericValue * 10).toFixed(0).padStart(3, "0")}`
  }
}

// Helper function to calculate GAA
function calculateGAA(goalsAgainst: number, timeOnIceMinutes: number): string {
  if (timeOnIceMinutes <= 0) return "0.00"
  const gaa = (goalsAgainst * 60) / timeOnIceMinutes
  return gaa.toFixed(2)
}

// Helper function to format time on ice
function formatTimeOnIce(seconds: number): string {
  if (!seconds) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

interface EaMatchStatisticsProps {
  matchId: string
  eaMatchId: string | null
  className?: string
  homeTeamEaClubId?: string | null
  awayTeamEaClubId?: string | null
  homeTeamName?: string | null
  awayTeamName?: string | null
  homeScore?: number | null
  awayScore?: number | null
  isAdmin?: boolean
}

interface PlayerStat {
  player_name: string
  player_id: string
  team_id: string
  goals: number
  assists: number
  shots: number
  hits: number
  pim: number
  plus_minus: number
  blocks: number
  faceoff_pct?: number
  toi?: string
  giveaways?: number
  takeaways?: number
  passing_pct?: number
  save_pct?: number
  saves?: number
  goals_against?: number
  position?: string
  shot_attempts?: number
  shot_pct?: number
  pass_attempts?: number
  pass_complete?: number
  defensive_zone_time?: number
  offensive_zone_time?: number
  neutral_zone_time?: number
  dekes?: number
  successful_dekes?: number
  faceoffs_won?: number
  faceoffs_taken?: number
  skinterceptions?: string
  skfow?: string
  skfol?: string
  skpenaltiesdrawn?: string
  skpasses?: string
  skpassattempts?: string
  skpossession?: string
  glgaa?: string
  skppg?: string
  glshots?: string
  toiseconds?: string
  glsaves?: string
  glga?: string
  glsavepct?: string
  interceptions?: number
  ppg?: number
  shg?: number
  time_with_puck?: number
  season_id?: string
  skshg?: string
  penalties_drawn?: number
}

interface TeamStats {
  goals: number
  shots: number
  hits: number
  pim: number
  blocks: number
  passing_pct?: number
  faceoff_pct?: number
  pp_goals?: number
  pp_opportunities?: number
  pp_pct?: number
  team_name: string
  team_id: string
  shot_attempts?: number
  shot_pct?: number
  pass_attempts?: number
  pass_complete?: number
  time_in_offensive_zone?: number
  time_in_defensive_zone?: number
  time_in_neutral_zone?: number
  takeaways?: number
  giveaways?: number
  faceoffs_won?: number
  faceoffs_taken?: number
}

export function EaMatchStatistics({
  matchId,
  eaMatchId,
  className,
  homeTeamEaClubId,
  awayTeamEaClubId,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  isAdmin = false,
}: EaMatchStatisticsProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [activeTab, setActiveTab] = useState("player-stats")
  const [activeTeamTab, setActiveTeamTab] = useState("home")
  const [activePlayerTab, setActivePlayerTab] = useState("skaters")
  const [fetchingDirectly, setFetchingDirectly] = useState(false)
  const [directFetchError, setDirectFetchError] = useState<string | null>(null)
  const [savingStats, setSavingStats] = useState(false)
  const [statsSaved, setStatsSaved] = useState(false)
  const [rawEaData, setRawEaData] = useState<any>(null)
  const [forceRefreshing, setForceRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    if (!eaMatchId) {
      setError("No EA match data available for this match")
      setLoading(false)
      return
    }

    console.log("Fetching match data for EA match ID:", eaMatchId, "and match ID:", matchId)
    fetchMatchData()
  }, [eaMatchId, matchId])

  const fetchMatchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      setStatsSaved(false)

      console.log("Fetching match data with IDs:", { matchId, eaMatchId, forceRefresh })

      // Fetch the match details first
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          ea_match_id,
          home_team:teams!home_team_id(id, name, logo_url, ea_club_id),
          away_team:teams!away_team_id(id, name, logo_url, ea_club_id)
        `)
        .eq("id", matchId)
        .single()

      if (matchError) {
        console.error("Error fetching match:", matchError)
        throw new Error(`Error fetching match: ${matchError.message}`)
      }

      console.log("Successfully fetched match data:", matchData)
      setMatch(matchData)

      // Add logging for the match data
      console.log("Match data:", matchData)
      console.log("EA match ID:", matchData.ea_match_id)

      // If the match has ea_match_data directly, log it
      if (matchData.ea_match_data) {
        console.log("Match has direct EA match data:", {
          matchId: matchData.ea_match_data.matchId,
          clubs: Object.keys(matchData.ea_match_data.clubs || {}).map((clubId) => ({
            clubId,
            ppg: matchData.ea_match_data.clubs[clubId]?.ppg,
            ppo: matchData.ea_match_data.clubs[clubId]?.ppo,
          })),
        })
      }

      // If forceRefresh is true, skip the database check and fetch directly from EA
      if (forceRefresh) {
        console.log("Force refresh requested, fetching directly from EA")
        await fetchDirectlyFromEA(matchData)
        return
      }

      // Now fetch EA player statistics for this match
      try {
        const { data: playerStatsData, error: statsError } = await supabase
          .from("ea_player_stats")
          .select("*")
          .eq("match_id", matchId)

        if (statsError) {
          // If the table doesn't exist, handle gracefully
          if (statsError.code === "42P01") {
            // PostgreSQL code for undefined_table
            setError("Player statistics table not found. This feature may not be set up yet.")
          } else {
            console.error("Error fetching player stats:", statsError)
            setError(`Error fetching player stats: ${statsError.message}`)
          }
        } else if (!playerStatsData || playerStatsData.length === 0) {
          // No player stats found, try to fetch directly from EA API
          await fetchDirectlyFromEA(matchData)
        } else {
          // Check if we have generic player names (Player One, Player Two, etc.)
          const hasGenericNames = playerStatsData.some(
            (player) => player.player_name.startsWith("Player ") && /Player \w+/.test(player.player_name),
          )

          if (hasGenericNames) {
            console.log("Found generic player names, showing a warning")
            toast({
              title: "Generic Player Names Detected",
              description:
                "The player statistics have generic names. Use the 'Refresh from EA' button to get actual player names.",
              variant: "warning",
            })
          }

          setPlayerStats(playerStatsData || [])
          setStatsSaved(true)

          // Calculate team stats from player stats
          if (playerStatsData && playerStatsData.length > 0) {
            const homeStats: TeamStats = {
              team_id: matchData.home_team_id,
              team_name: matchData.home_team.name,
              goals: 0,
              shots: 0,
              hits: 0,
              pim: 0,
              blocks: 0,
              pp_goals: 0,
              pp_opportunities: 0,
              pp_pct: 0,
              shot_attempts: 0,
              shot_pct: 0,
              pass_attempts: 0,
              pass_complete: 0,
              time_in_offensive_zone: 0,
              time_in_defensive_zone: 0,
              time_in_neutral_zone: 0,
              takeaways: 0,
              giveaways: 0,
              faceoffs_won: 0,
              faceoffs_taken: 0,
            }

            const awayStats: TeamStats = {
              team_id: matchData.away_team_id,
              team_name: matchData.away_team.name,
              goals: 0,
              shots: 0,
              hits: 0,
              pim: 0,
              blocks: 0,
              pp_goals: 0,
              pp_opportunities: 0,
              pp_pct: 0,
              shot_attempts: 0,
              shot_pct: 0,
              pass_attempts: 0,
              pass_complete: 0,
              time_in_offensive_zone: 0,
              time_in_defensive_zone: 0,
              time_in_neutral_zone: 0,
              takeaways: 0,
              giveaways: 0,
              faceoffs_won: 0,
              faceoffs_taken: 0,
            }

            playerStatsData.forEach((stat) => {
              const teamStat = stat.team_id === matchData.home_team_id ? homeStats : awayStats

              teamStat.goals += stat.goals || 0
              teamStat.shots += stat.shots || 0
              teamStat.hits += stat.hits || 0
              teamStat.pim += stat.pim || 0
              teamStat.blocks += stat.blocks || 0
              teamStat.takeaways += stat.takeaways || 0
              teamStat.giveaways += stat.giveaways || 0
              teamStat.shot_attempts += stat.shot_attempts || 0
              teamStat.pass_attempts += stat.pass_attempts || 0
              teamStat.pass_complete += stat.pass_complete || 0
              teamStat.faceoffs_won += stat.faceoffs_won || 0
              teamStat.faceoffs_taken += stat.faceoffs_taken || 0

              // Add power play goals from player stats
              teamStat.pp_goals += stat.ppg || 0

              // Add zone time
              teamStat.time_in_offensive_zone += stat.offensive_zone_time || 0
              teamStat.time_in_defensive_zone += stat.defensive_zone_time || 0
              teamStat.time_in_neutral_zone += stat.neutral_zone_time || 0
            })

            // Try to get power play opportunities from the raw EA match data if available
            if (matchData.ea_match_data && matchData.ea_match_data.clubs) {
              const homeClubId = matchData.home_team?.ea_club_id?.toString()
              const awayClubId = matchData.away_team?.ea_club_id?.toString()

              if (homeClubId && matchData.ea_match_data.clubs[homeClubId]) {
                homeStats.pp_opportunities = Number(matchData.ea_match_data.clubs[homeClubId].ppo || 0)
                console.log(`Home team PP opportunities from raw data: ${homeStats.pp_opportunities}`)
              }

              if (awayClubId && matchData.ea_match_data.clubs[awayClubId]) {
                awayStats.pp_opportunities = Number(matchData.ea_match_data.clubs[awayClubId].ppo || 0)
                console.log(`Away team PP opportunities from raw data: ${awayStats.pp_opportunities}`)
              }
            }

            // Calculate percentages
            homeStats.shot_pct = homeStats.shot_attempts > 0 ? (homeStats.shots / homeStats.shot_attempts) * 100 : 0

            homeStats.passing_pct =
              homeStats.pass_attempts > 0 ? (homeStats.pass_complete / homeStats.pass_attempts) * 100 : 0

            homeStats.faceoff_pct =
              homeStats.faceoffs_taken > 0 ? (homeStats.faceoffs_won / homeStats.faceoffs_taken) * 100 : 0

            awayStats.shot_pct = awayStats.shot_attempts > 0 ? (awayStats.shots / awayStats.shot_attempts) * 100 : 0

            awayStats.passing_pct =
              awayStats.pass_attempts > 0 ? (awayStats.pass_complete / awayStats.pass_attempts) * 100 : 0

            awayStats.faceoff_pct =
              awayStats.faceoffs_taken > 0 ? (awayStats.faceoffs_won / awayStats.faceoffs_taken) * 100 : 0

            homeStats.pp_pct =
              homeStats.pp_opportunities > 0 ? (homeStats.pp_goals / homeStats.pp_opportunities) * 100 : 0
            awayStats.pp_pct =
              awayStats.pp_opportunities > 0 ? (awayStats.pp_goals / awayStats.pp_opportunities) * 100 : 0

            console.log("Calculated team stats:", {
              home: {
                name: homeStats.team_name,
                pp_goals: homeStats.pp_goals,
                pp_opportunities: homeStats.pp_opportunities,
                pp_pct: homeStats.pp_pct,
              },
              away: {
                name: awayStats.team_name,
                pp_goals: awayStats.pp_goals,
                pp_opportunities: awayStats.pp_opportunities,
                pp_pct: awayStats.pp_pct,
              },
            })

            setTeamStats([homeStats, awayStats])
          }
        }
      } catch (err: any) {
        console.error("Error fetching EA match data:", err)
        setError(err.message || "Failed to load EA match statistics")
      } finally {
        setLoading(false)
        setForceRefreshing(false)
      }
    } catch (err: any) {
      console.error("Error fetching EA match data:", err)
      setError(err.message || "Failed to load EA match statistics")
    } finally {
      setLoading(false)
      setForceRefreshing(false)
    }
  }

  const fetchDirectlyFromEA = async (matchData: any) => {
    try {
      setFetchingDirectly(true)
      setDirectFetchError(null)
      setDebugInfo(null)

      // Get EA club IDs from the match data or from props
      const homeClubId = homeTeamEaClubId || matchData.home_team?.ea_club_id
      const awayClubId = awayTeamEaClubId || matchData.away_team?.ea_club_id

      if (!homeClubId && !awayClubId) {
        throw new Error("No EA club IDs available for either team")
      }

      // Try to fetch match details directly from EA API
      console.log(`Fetching EA match details directly for match ${eaMatchId}`)
      console.log(`Home club ID: ${homeClubId}, Away club ID: ${awayClubId}`)

      // Use the direct EA API endpoint format
      const eaApiUrl = `https://proclubs.ea.com/api/nhl/clubs/matches?matchType=club_private&platform=common-gen5&clubIds=${homeClubId || awayClubId}`

      // Use a proxy to avoid CORS issues
      const proxyUrl = `/api/ea/proxy?url=${encodeURIComponent(eaApiUrl)}`

      console.log(`Fetching from EA API via proxy: ${proxyUrl}`)

      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch EA match details: ${response.statusText}`)
      }

      // Log the raw response for debugging
      const rawResponse = await response.text()
      console.log("Raw EA API response:", rawResponse.substring(0, 500) + "...")

      // Set debug info for UI
      setDebugInfo(
        `API URL: ${eaApiUrl}\nResponse Status: ${response.status}\nResponse (first 500 chars): ${rawResponse.substring(0, 500)}...`,
      )

      // Try to parse the response as JSON
      let data
      try {
        data = JSON.parse(rawResponse)
      } catch (parseError) {
        console.error("Failed to parse EA API response as JSON:", parseError)
        throw new Error(`Invalid JSON response from EA API: ${parseError.message}`)
      }

      console.log("Parsed EA match data:", data)

      // Check if the data has the expected structure
      if (!data) {
        throw new Error("Empty response from EA API")
      }

      // Find the specific match by matchId if we have multiple matches
      let matchInfo
      if (Array.isArray(data)) {
        if (data.length === 0) {
          throw new Error("Empty array returned from EA API")
        }

        // Try to find the specific match by matchId
        if (eaMatchId) {
          matchInfo = data.find((match) => match.matchId === eaMatchId)
        }

        // If we couldn't find the specific match or don't have an eaMatchId, use the first match
        if (!matchInfo) {
          matchInfo = data[0]
        }
      } else {
        matchInfo = data
      }

      // Check if the matchInfo has clubs data
      if (!matchInfo || !matchInfo.clubs) {
        console.error("Invalid match data structure:", matchInfo)
        throw new Error("Invalid response format from EA API: missing clubs data")
      }

      setRawEaData(matchInfo)

      // After fetching the EA match data
      console.log("Raw EA match data for debugging:", {
        matchId: matchInfo.matchId,
        isCombined: matchInfo.isCombined,
        clubs: Object.keys(matchInfo.clubs).map((clubId) => ({
          clubId,
          ppg: matchInfo.clubs[clubId].ppg,
          ppo: matchInfo.clubs[clubId].ppo,
          goals: matchInfo.clubs[clubId].goals,
        })),
      })

      console.log("Processing EA match data:", matchInfo)
      console.log("Processing EA match data with player stats:", matchInfo)
      console.log(
        "Number of players found:",
        Object.keys(matchInfo.players || {}).flatMap((clubId) => Object.keys(matchInfo.players[clubId] || {})).length,
      )

      // Process the EA match data
      const processedStats: PlayerStat[] = []
      const processedTeamStats: TeamStats[] = []

      // Check if clubs data exists
      if (matchInfo.clubs) {
        // Process each club's data for team stats
        Object.keys(matchInfo.clubs).forEach((clubId) => {
          const club = matchInfo.clubs[clubId]
          // Determine if this is home or away team based on clubId
          const isHomeTeam = clubId === homeClubId.toString()
          const teamId = isHomeTeam ? matchData.home_team_id : matchData.away_team_id
          const teamName = isHomeTeam ? matchData.home_team.name : matchData.away_team.name

          console.log(`Processing club ${clubId} (${isHomeTeam ? "Home" : "Away"} team):`, club)
          console.log("Club power play stats:", { ppg: club.ppg, ppo: club.ppo })

          // Create team stats
          const teamStat: TeamStats = {
            team_id: teamId,
            team_name: club.details?.name || teamName,
            goals: Number.parseInt(club.goals || club.score || "0", 10),
            shots: Number.parseInt(club.shots || "0", 10),
            hits: 0, // We'll sum from player stats
            pim: 0, // We'll sum from player stats
            blocks: 0, // We'll sum from player stats
            passing_pct:
              Number.parseInt(club.passa || "0", 10) > 0
                ? (Number.parseInt(club.passc || "0", 10) / Number.parseInt(club.passa || "0", 10)) * 100
                : 0,
            faceoff_pct: 0, // We'll calculate from player stats
            pp_goals: Number.parseInt(club.ppg || "0", 10),
            pp_opportunities: Number.parseInt(club.ppo || "0", 10),
            pp_pct: 0, // Will calculate after summing
            takeaways: 0, // We'll sum from player stats
            giveaways: 0, // We'll sum from player stats
            shot_attempts: 0, // We'll sum from player stats
            shot_pct: 0, // Will calculate after summing
            pass_attempts: Number.parseInt(club.passa || "0", 10),
            pass_complete: Number.parseInt(club.passc || "0", 10),
            time_in_offensive_zone: Number.parseInt(club.toa || "0", 10),
            time_in_defensive_zone: 0, // Not available at team level
            time_in_neutral_zone: 0, // Not available at team level
            faceoffs_won: 0, // We'll sum from player stats
            faceoffs_taken: 0, // We'll sum from player stats
          }

          processedTeamStats.push(teamStat)
        })

        // Check if this is a combined match
        const isCombinedMatch = matchInfo.isCombined || matchInfo.matchId?.startsWith("combined-")
        console.log(`Is this a combined match? ${isCombinedMatch}`)

        if (isCombinedMatch) {
          console.log("Processing a combined match - treating as a single game")
          console.log("Combined from matches:", matchInfo.combinedFrom)
          console.log("Combined match count:", matchInfo.combinedCount)

          // For combined matches, make sure we're properly handling the combined data
          if (matchInfo.combinedFrom && Array.isArray(matchInfo.combinedFrom)) {
            console.log(`This match combines data from ${matchInfo.combinedFrom.length} individual matches`)
          }
        }

        // Process player data if available
        if (matchInfo.players) {
          // Loop through each club's players
          Object.keys(matchInfo.players).forEach((clubId) => {
            const clubPlayers = matchInfo.players[clubId]
            const isHomeTeam = clubId === homeClubId.toString()
            const teamId = isHomeTeam ? matchData.home_team_id : matchData.away_team_id

            console.log(
              `Processing players for club ${clubId} (${isHomeTeam ? "Home" : "Away"} team)`,
              Object.keys(clubPlayers).length > 0
                ? `Found ${Object.keys(clubPlayers).length} players`
                : "No players found",
            )

            // Loop through each player in the club
            Object.keys(clubPlayers).forEach((playerId) => {
              const player = clubPlayers[playerId]
              console.log(`Processing player ${player.persona || player.playername || "Unknown"}:`, player)

              // Enhanced position determination using multiple data sources
              let position = "Skater"

              // Priority 1: Use posSorted field if available (most accurate)
              if (player.posSorted) {
                if (player.posSorted === "leftDefense") position = "LD"
                else if (player.posSorted === "rightDefense") position = "RD"
                else if (player.posSorted === "leftWing") position = "LW"
                else if (player.posSorted === "rightWing") position = "RW"
                else if (player.posSorted === "center") position = "C"
                else if (player.posSorted === "goalie") position = "G"
                else position = mapEaPositionToStandard(player.posSorted)
              }
              // Priority 2: Use numeric position codes
              else if (player.position === "0") position = "G"
              else if (player.position === "1") position = "RD"
              else if (player.position === "2") position = "LD"
              else if (player.position === "3") position = "RW"
              else if (player.position === "4") position = "LW"
              else if (player.position === "5") position = "C"
              // Priority 3: Try to map other position values
              else if (player.position) {
                position = mapEaPositionToStandard(player.position)
              }

              const isPlayerGoalie = isGoalie(position) || isGoalie(player.position)

              // Use persona if available, otherwise use playername
              const playerName = player.persona || player.playername || "Unknown Player"

              processedStats.push({
                player_name: playerName,
                player_id: playerId,
                team_id: teamId,
                position: position,
                goals: Number.parseInt(player.skgoals || player.goals || "0", 10),
                assists: Number.parseInt(player.skassists || player.assists || "0", 10),
                shots: Number.parseInt(player.skshots || player.shots || "0", 10),
                hits: Number.parseInt(player.skhits || player.hits || "0", 10),
                pim: Number.parseInt(player.skpim || player.pim || "0", 10),
                plus_minus: Number.parseInt(player.skplusmin || player.plusMinus || "0", 10),
                blocks: Number.parseInt(player.skbs || player.blocks || "0", 10),
                takeaways: Number.parseInt(player.sktakeaways || player.takeaways || "0", 10),
                giveaways: Number.parseInt(player.skgiveaways || player.giveaways || "0", 10),
                passing_pct: Number.parseFloat(player.skpasspct || player.passingPct || "0"),
                toi: formatTimeOnIce(Number.parseInt(player.toiseconds || player.timeOnIce || "0", 10)),
                shot_attempts: Number.parseInt(player.skshotattempts || player.shotAttempts || "0", 10),
                shot_pct: Number.parseFloat(player.skshotpct || player.shotPct || "0"),
                pass_attempts: Number.parseInt(player.skpassattempts || player.passAttempts || "0", 10),
                pass_complete: Number.parseInt(player.skpasses || player.passCompletions || "0", 10),
                dekes: Number.parseInt(player.skdekes || "0", 10),
                successful_dekes: Number.parseInt(player.sksuccessfuldekes || "0", 10),
                faceoffs_won: Number.parseInt(player.skfow || player.faceoffWins || "0", 10),
                faceoffs_taken:
                  Number.parseInt(player.skfow || player.faceoffWins || "0", 10) +
                  Number.parseInt(player.skfol || player.faceoffLosses || "0", 10),
                faceoff_pct: Number.parseFloat(player.skfopct || player.faceoffPct || "0"),
                save_pct: isPlayerGoalie ? Number.parseFloat(player.glsavepct || player.savePct || "0") : 0,
                saves: isPlayerGoalie ? Number.parseInt(player.glsaves || player.saves || "0", 10) : 0,
                goals_against: isPlayerGoalie ? Number.parseInt(player.glga || player.goalsAgainst || "0", 10) : 0,
                // Zone times
                defensive_zone_time: Number.parseInt(player.skdefensivezonetime || player.defensiveZoneTime || "0", 10),
                offensive_zone_time: Number.parseInt(player.skoffensivezonetime || player.offensiveZoneTime || "0", 10),
                neutral_zone_time: Number.parseInt(player.skneutralzonetime || player.neutralZoneTime || "0", 10),
                // Store original EA fields for direct access
                skinterceptions: player.skinterceptions || player.interceptions,
                skfow: player.skfow || player.faceoffWins,
                skfol: player.skfol || player.faceoffLosses,
                skpenaltiesdrawn: player.skpenaltiesdrawn || player.penaltiesDrawn,
                skpasses: player.skpasses || player.passCompletions,
                skpassattempts: player.skpassattempts || player.passAttempts,
                skpossession: player.skpossession || player.possessionTime,
                glgaa: player.glgaa || player.gaa,
                skppg: player.skppg || player.powerPlayGoals,
                glshots: player.glshots || player.shotsAgainst,
                toiseconds: player.toiseconds || player.timeOnIce,
                glsaves: player.glsaves || player.saves,
                glga: player.glga || player.goalsAgainst,
                glsavepct: player.glsavepct || player.savePct,
                skshg: player.skshg || player.shorthandedGoals,
              })
            })
          })
        }

        // Also process players in club structure
        if (matchInfo.clubs) {
          Object.keys(matchInfo.clubs).forEach((clubId) => {
            const club = matchInfo.clubs[clubId]
            if (!club.players) return

            const isHomeTeam = clubId === homeClubId.toString()
            const teamId = isHomeTeam ? matchData.home_team_id : matchData.away_team_id

            // Process each player in this club
            Object.entries(club.players).forEach(([playerId, player]) => {
              if (!player) return

              // Create a unique key for this player
              const playerName = player.persona || player.playername || `Player ${playerId}`
              const playerKey = `${clubId}:${playerName.toLowerCase()}`

              // Check if we already processed this player from the top-level players structure
              const alreadyProcessed = processedStats.some(
                (stat) => stat.player_name === playerName && stat.team_id === teamId,
              )

              if (alreadyProcessed) {
                console.log(`Player ${playerName} already processed from top-level players structure`)
                return
              }

              // Enhanced position determination using multiple data sources
              let position = "Skater"

              // Priority 1: Use posSorted field if available (most accurate)
              if (player.posSorted) {
                if (player.posSorted === "leftDefense") position = "LD"
                else if (player.posSorted === "rightDefense") position = "RD"
                else if (player.posSorted === "leftWing") position = "LW"
                else if (player.posSorted === "rightWing") position = "RW"
                else if (player.posSorted === "center") position = "C"
                else if (player.posSorted === "goalie") position = "G"
                else position = mapEaPositionToStandard(player.posSorted)
              }
              // Priority 2: Use numeric position codes
              else if (player.position === "0") position = "G"
              else if (player.position === "1") position = "RD"
              else if (player.position === "2") position = "LD"
              else if (player.position === "3") position = "RW"
              else if (player.position === "4") position = "LW"
              else if (player.position === "5") position = "C"
              // Priority 3: Try to map other position values
              else if (player.position) {
                position = mapEaPositionToStandard(player.position)
              }

              const isPlayerGoalie = isGoalie(position) || isGoalie(player.position)

              processedStats.push({
                player_name: playerName,
                player_id: playerId,
                team_id: teamId,
                position: position,
                goals: Number.parseInt(player.skgoals || player.goals || "0", 10),
                assists: Number.parseInt(player.skassists || player.assists || "0", 10),
                shots: Number.parseInt(player.skshots || player.shots || "0", 10),
                hits: Number.parseInt(player.skhits || player.hits || "0", 10),
                pim: Number.parseInt(player.skpim || player.pim || "0", 10),
                plus_minus: Number.parseInt(player.skplusmin || player.plusMinus || "0", 10),
                blocks: Number.parseInt(player.skbs || player.blocks || "0", 10),
                takeaways: Number.parseInt(player.sktakeaways || player.takeaways || "0", 10),
                giveaways: Number.parseInt(player.skgiveaways || player.giveaways || "0", 10),
                passing_pct: Number.parseFloat(player.skpasspct || player.passingPct || "0"),
                toi: formatTimeOnIce(Number.parseInt(player.toiseconds || player.timeOnIce || "0", 10)),
                shot_attempts: Number.parseInt(player.skshotattempts || player.shotAttempts || "0", 10),
                shot_pct: Number.parseFloat(player.skshotpct || player.shotPct || "0"),
                pass_attempts: Number.parseInt(player.skpassattempts || player.passAttempts || "0", 10),
                pass_complete: Number.parseInt(player.skpasses || player.passCompletions || "0", 10),
                dekes: Number.parseInt(player.skdekes || "0", 10),
                successful_dekes: Number.parseInt(player.sksuccessfuldekes || "0", 10),
                faceoffs_won: Number.parseInt(player.skfow || player.faceoffWins || "0", 10),
                faceoffs_taken:
                  Number.parseInt(player.skfow || player.faceoffWins || "0", 10) +
                  Number.parseInt(player.skfol || player.faceoffLosses || "0", 10),
                faceoff_pct: Number.parseFloat(player.skfopct || player.faceoffPct || "0"),
                save_pct: isPlayerGoalie ? Number.parseFloat(player.glsavepct || player.savePct || "0") : 0,
                saves: isPlayerGoalie ? Number.parseInt(player.glsaves || player.saves || "0", 10) : 0,
                goals_against: isPlayerGoalie ? Number.parseInt(player.glga || player.goalsAgainst || "0", 10) : 0,
                // Zone times
                defensive_zone_time: Number.parseInt(player.skdefensivezonetime || player.defensiveZoneTime || "0", 10),
                offensive_zone_time: Number.parseInt(player.skoffensivezonetime || player.offensiveZoneTime || "0", 10),
                neutral_zone_time: Number.parseInt(player.skneutralzonetime || player.neutralZoneTime || "0", 10),
                // Store original EA fields for direct access
                skinterceptions: player.skinterceptions || player.interceptions,
                skfow: player.skfow || player.faceoffWins,
                skfol: player.skfol || player.faceoffLosses,
                skpenaltiesdrawn: player.skpenaltiesdrawn || player.penaltiesDrawn,
                skpasses: player.skpasses || player.passCompletions,
                skpassattempts: player.skpassattempts || player.passAttempts,
                skpossession: player.skpossession || player.possessionTime,
                glgaa: player.glgaa || player.gaa,
                skppg: player.skppg || player.powerPlayGoals,
                glshots: player.glshots || player.shotsAgainst,
                toiseconds: player.toiseconds || player.timeOnIce,
                glsaves: player.glsaves || player.saves,
                glga: player.glga || player.goalsAgainst,
                glsavepct: player.glsavepct || player.savePct,
                skshg: player.skshg || player.shorthandedGoals,
              })
            })
          })
        }

        // Sum up player stats to team stats
        processedStats.forEach((player) => {
          const teamStat = processedTeamStats.find((team) => team.team_id === player.team_id)
          if (teamStat) {
            teamStat.hits += player.hits || 0
            teamStat.pim += player.pim || 0
            teamStat.blocks += player.blocks || 0
            teamStat.takeaways += player.takeaways || 0
            teamStat.giveaways += player.giveaways || 0
            teamStat.shot_attempts += player.shot_attempts || 0
            teamStat.faceoffs_won += player.faceoffs_won || 0
            teamStat.faceoffs_taken += player.faceoffs_taken || 0
          }
        })

        // Calculate team percentages after summing all player stats
        processedTeamStats.forEach((team) => {
          team.shot_pct = team.shot_attempts > 0 ? (team.shots / team.shot_attempts) * 100 : 0
          team.faceoff_pct = team.faceoffs_taken > 0 ? (team.faceoffs_won / team.faceoffs_taken) * 100 : 0

          // Make sure pp_pct is calculated correctly
          team.pp_pct = team.pp_opportunities > 0 ? (team.pp_goals / team.pp_opportunities) * 100 : 0

          console.log(`Team ${team.team_name} power play stats:`, {
            pp_goals: team.pp_goals,
            pp_opportunities: team.pp_opportunities,
            pp_pct: team.pp_pct,
          })
        })
      }

      console.log("Processed player stats:", processedStats)
      // Log the first player's stats for debugging
      if (processedStats.length > 0) {
        console.log("Sample processed player stats:", processedStats[0])
      }
      console.log("Processed team stats:", processedTeamStats)

      // Update state with the processed data
      setPlayerStats(processedStats)
      setTeamStats(processedTeamStats)
    } catch (err: any) {
      console.error("Error fetching directly from EA:", err)
      setDirectFetchError(err.message || "Failed to fetch data directly from EA")
    } finally {
      setFetchingDirectly(false)
    }
  }

  // Helper function to safely prepare player stats for database insertion
  const preparePlayerStatsForDB = (stat: PlayerStat) => {
    // Define the known database columns for ea_player_stats
    const knownColumns = [
      "match_id",
      "ea_match_id",
      "player_name",
      "player_id",
      "team_id",
      "goals",
      "assists",
      "shots",
      "hits",
      "pim",
      "plus_minus",
      "blocks",
      "takeaways",
      "giveaways",
      "passing_pct",
      "shot_attempts",
      "shot_pct",
      "pass_attempts",
      "pass_complete",
      "faceoffs_won",
      "faceoffs_taken",
      "faceoff_pct",
      "save_pct",
      "saves",
      "goals_against",
      "position",
      "defensive_zone_time",
      "offensive_zone_time",
      "neutral_zone_time",
      "dekes",
      "successful_dekes",
      "toi",
      "created_at",
      "updated_at",
      "skinterceptions",
      "skfow",
      "skfol",
      "skpenaltiesdrawn",
      "skpasses",
      "skpassattempts",
      "skpossession",
      "glgaa",
      "skppg",
      "skshg",
      "glshots",
      "glsaves",
      "glga",
      "glsavepct",
      "toiseconds",
      "interceptions",
      "ppg",
      "shg",
      "time_with_puck",
      "season_id",
      "category",
    ]

    // Create a new object with only the known columns
    const safeData: Record<string, any> = {
      match_id: matchId,
      ea_match_id: eaMatchId,
    }

    // Add only the properties that exist in the known columns list
    Object.keys(stat).forEach((key) => {
      if (knownColumns.includes(key)) {
        safeData[key] = stat[key] ?? null // Use null for undefined values
      }
    })

    // Map EA-specific fields to database fields
    if (stat.skinterceptions) {
      safeData.interceptions = Number.parseInt(stat.skinterceptions.toString(), 10) || 0
    }

    if (stat.skpasses) {
      safeData.pass_complete = Number.parseInt(stat.skpasses.toString(), 10) || 0
    }

    if (stat.skpassattempts) {
      safeData.pass_attempts = Number.parseInt(stat.skpassattempts.toString(), 10) || 0
    }

    if (stat.skppg) {
      safeData.ppg = Number.parseInt(stat.skppg.toString(), 10) || 0
    }

    // Map skppg to ppg if not already set
    if (stat.skppg && !safeData.ppg) {
      safeData.ppg = Number.parseInt(stat.skppg.toString(), 10) || 0
    }

    if (stat.skpenaltiesdrawn) {
      // Store directly in skpenaltiesdrawn instead of penalties_drawn
      safeData.skpenaltiesdrawn = Number.parseInt(stat.skpenaltiesdrawn.toString(), 10) || 0
    }

    if (stat.skshg) {
      safeData.shg = Number.parseInt(stat.skshg.toString(), 10) || 0
    }

    if (stat.skfow) {
      safeData.faceoffs_won = Number.parseInt(stat.skfow.toString(), 10) || 0
    }

    if (stat.skpossession) {
      safeData.time_with_puck = Number.parseInt(stat.skpossession.toString(), 10) || 0
    }

    if (stat.glshots) {
      safeData.shots = Number.parseInt(stat.glshots.toString(), 10) || 0
    }

    if (stat.glsaves) {
      safeData.saves = Number.parseInt(stat.glsaves.toString(), 10) || 0
    }

    // Handle goals_against without relying on glga column
    if (stat.goals_against !== undefined) {
      safeData.goals_against = stat.goals_against
    } else if (stat.glga) {
      // Try to use glga if available, but don't rely on it being in the database
      try {
        safeData.goals_against = Number.parseInt(stat.glga.toString(), 10) || 0
      } catch (e) {
        console.warn("Could not parse glga value", e)
      }
    }

    if (stat.glsavepct) {
      safeData.save_pct = Number.parseFloat(stat.glsavepct.toString()) || 0
    }

    if (stat.toiseconds) {
      safeData.toi = formatTimeOnIce(Number.parseInt(stat.toiseconds.toString(), 10) || 0)
    }

    return safeData
  }

  const saveStatsToDatabase = async () => {
    try {
      setSavingStats(true)

      if (playerStats.length === 0) {
        toast({
          title: "No stats to save",
          description: "There are no player statistics available to save.",
          variant: "destructive",
        })
        return
      }

      // First delete any existing stats for this match
      const { error: deleteError } = await supabase.from("ea_player_stats").delete().eq("match_id", matchId)

      if (deleteError) {
        console.error("Error deleting existing stats:", deleteError)
        toast({
          title: "Error",
          description: `Failed to delete existing stats: ${deleteError.message}`,
          variant: "destructive",
        })
        return
      }

      // Then insert the new stats
      const statsToInsert = playerStats.map(preparePlayerStatsForDB)

      const { error: insertError } = await supabase.from("ea_player_stats").insert(statsToInsert)

      if (insertError) {
        console.error("Error saving player stats:", insertError)
        toast({
          title: "Error",
          description: `Failed to save player stats: ${insertError.message}`,
          variant: "destructive",
        })
        return
      }

      // Save raw EA data if available
      if (rawEaData && eaMatchId) {
        try {
          // First check if the record already exists
          const { data: existingData, error: checkError } = await supabase
            .from("ea_match_data")
            .select("id")
            .eq("match_id", eaMatchId)
            .maybeSingle()

          if (checkError) {
            console.error("Error checking existing EA match data:", checkError)
          } else {
            if (existingData) {
              // Record exists, update it
              const { error: updateError } = await supabase
                .from("ea_match_data")
                .update({
                  data: rawEaData,
                  updated_at: new Date().toISOString(),
                })
                .eq("match_id", eaMatchId)

              if (updateError) {
                console.error("Error updating raw EA data:", updateError)
              } else {
                console.log("Successfully updated raw EA match data")
              }
            } else {
              // Record doesn't exist, insert it
              const { error: insertError } = await supabase.from("ea_match_data").insert({
                match_id: eaMatchId,
                data: rawEaData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

              if (insertError) {
                console.error("Error inserting raw EA data:", insertError)
              } else {
                console.log("Successfully inserted raw EA match data")
              }
            }
          }
        } catch (rawDataError) {
          console.error("Error processing raw EA data:", rawDataError)
          // Continue anyway since the player stats were saved
        }
      }

      // After saving player stats, also save team stats if available
      if (teamStats.length > 0) {
        try {
          // Check if ea_team_stats table exists using a simpler approach
          let tableExists = false
          try {
            const { data, error } = await supabase.from("ea_team_stats").select("id").limit(1)

            tableExists = !error
          } catch (checkError) {
            console.error("Error checking ea_team_stats table:", checkError)
            tableExists = false
          }

          if (tableExists) {
            console.log("ea_team_stats table exists, saving team statistics...")

            // Delete any existing team stats for this match
            const { error: deleteTeamStatsError } = await supabase
              .from("ea_team_stats")
              .delete()
              .eq("match_id", matchId)

            if (deleteTeamStatsError) {
              console.error("Error deleting existing team stats:", deleteTeamStatsError)
            }

            // Insert the new team stats with all available fields
            const teamStatsToInsert = teamStats.map((team) => ({
              match_id: matchId,
              ea_match_id: eaMatchId,
              team_id: team.team_id,
              team_name: team.team_name,
              goals: team.goals || 0,
              shots: team.shots || 0,
              hits: team.hits || 0,
              blocks: team.blocks || 0,
              pim: team.pim || 0,
              pp_goals: team.pp_goals || 0,
              pp_opportunities: team.pp_opportunities || 0,
              pp_pct: team.pp_pct || 0,
              faceoff_wins: team.faceoffs_won || 0,
              faceoff_losses: (team.faceoffs_taken || 0) - (team.faceoffs_won || 0),
              faceoff_pct: team.faceoff_pct || 0,
              passing_pct: team.passing_pct || 0,
              shot_attempts: team.shot_attempts || 0,
              shot_pct: team.shot_pct || 0,
              pass_attempts: team.pass_attempts || 0,
              pass_complete: team.pass_complete || 0,
              time_in_offensive_zone: team.time_in_offensive_zone || 0,
              time_in_defensive_zone: team.time_in_defensive_zone || 0,
              time_in_neutral_zone: team.time_in_neutral_zone || 0,
              takeaways: team.takeaways || 0,
              giveaways: team.giveaways || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))

            console.log("Inserting team stats:", teamStatsToInsert)

            const { error: insertTeamStatsError } = await supabase.from("ea_team_stats").insert(teamStatsToInsert)

            if (insertTeamStatsError) {
              console.error("Error saving team stats:", insertTeamStatsError)
              // Don't throw error, just log it since player stats were saved successfully
            } else {
              console.log("Successfully saved team stats to database")
            }
          } else {
            console.log("ea_team_stats table does not exist, skipping team stats save")
          }
        } catch (teamStatsError) {
          console.error("Error processing team stats:", teamStatsError)
          // Continue anyway since the player stats were saved
        }
      }

      setStatsSaved(true)
      toast({
        title: "Success",
        description: "Player statistics saved successfully!",
        variant: "default",
      })

      // Also update the match with EA match ID if not already set
      if (match && !match.ea_match_id) {
        const { error: matchUpdateError } = await supabase
          .from("matches")
          .update({ ea_match_id: eaMatchId })
          .eq("id", matchId)

        if (matchUpdateError) {
          console.error("Error updating match with EA match ID:", matchUpdateError)
        }
      }
    } catch (error: any) {
      console.error("Error saving stats to database:", error)

      // Provide a more helpful error message based on the type of error
      let errorMessage = "Failed to save stats"

      if (error.message && error.message.includes("column")) {
        errorMessage = `Database schema mismatch: ${error.message}. Please run the Goalie Columns Migration from the admin panel.`
      } else if (error.code === "42P01") {
        errorMessage = "The ea_player_stats table doesn't exist. Please run the EA player stats migration."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSavingStats(false)
    }
  }

  const formatZoneTime = (seconds: number): string => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatTimeWithPuck = (seconds: number): string => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleRefresh = () => {
    toast({
      title: "Refreshing data",
      description: "Fetching the latest match statistics from EA Sports NHL...",
    })
    fetchMatchData()
  }

  const handleForceRefresh = () => {
    setForceRefreshing(true)
    toast({
      title: "Force refreshing data",
      description: "Fetching the latest player names and statistics directly from EA Sports NHL...",
    })
    fetchMatchData(true)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error && playerStats.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>EA Match Statistics</CardTitle>
          <CardDescription>Detailed player and team statistics from EA Sports NHL</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            {isAdmin && (
              <Button onClick={handleForceRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again with EA API
              </Button>
            )}
          </div>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-xs">
              <pre>{debugInfo}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (playerStats.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>EA Match Statistics</CardTitle>
          <CardDescription>Detailed player and team statistics from EA Sports NHL</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {fetchingDirectly ? (
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                  <span>Fetching statistics directly from EA Sports NHL...</span>
                </div>
              ) : directFetchError ? (
                <>
                  <p>Failed to fetch statistics from EA Sports NHL: {directFetchError}</p>
                  <div className="mt-4 flex space-x-2">
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={handleForceRefresh}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Try Again
                      </Button>
                    )}
                  </div>
                  {debugInfo && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-xs">
                      <pre>{debugInfo}</pre>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>No player statistics available for this match.</p>
                  {match?.home_team?.ea_club_id && (
                    <p className="mt-2">
                      <Link
                        href={`/admin/ea-stats/${match.home_team.ea_club_id}`}
                        className="text-primary flex items-center hover:underline"
                      >
                        View EA stats for {match.home_team.name} <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </p>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Get home and away team stats
  const homeTeamStats = teamStats.find((team) => team.team_id === match?.home_team_id) || teamStats[0]
  const awayTeamStats = teamStats.find((team) => team.team_id === match?.away_team_id) || teamStats[1]

  // Get skaters and goalies for each team - properly filter goalies
  const homeSkaters = playerStats.filter(
    (player) => player.team_id === match?.home_team_id && !isGoalie(player.position || ""),
  )

  const awaySkaters = playerStats.filter(
    (player) => player.team_id === match?.away_team_id && !isGoalie(player.position || ""),
  )

  const homeGoalies = playerStats.filter(
    (player) => player.team_id === match?.home_team_id && isGoalie(player.position || ""),
  )

  const awayGoalies = playerStats.filter(
    (player) => player.team_id === match?.away_team_id && isGoalie(player.position || ""),
  )

  // Check if we have generic player names (Player One, Player Two, etc.)
  const hasGenericNames = playerStats.some(
    (player) => player.player_name.startsWith("Player ") && /Player \w+/.test(player.player_name),
  )

  // Add a variable to track if it's a combined match
  const isCombinedMatch =
    (eaMatchId?.startsWith("combined-") &&
      rawEaData?.combinedFrom &&
      Array.isArray(rawEaData?.combinedFrom) &&
      rawEaData?.combinedFrom.length > 1) ||
    (Boolean(rawEaData?.isCombined) &&
      rawEaData?.combinedFrom &&
      Array.isArray(rawEaData?.combinedFrom) &&
      rawEaData?.combinedFrom.length > 1)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>EA Match Statistics</CardTitle>
            <CardDescription>Detailed player and team statistics from EA Sports NHL</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {hasGenericNames && (
              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
                Generic Names
              </Badge>
            )}
            {isAdmin && (
              <Button
                size="sm"
                onClick={handleForceRefresh}
                disabled={forceRefreshing}
                variant="outline"
                className="flex items-center bg-transparent"
              >
                {forceRefreshing ? (
                  <>
                    <Skeleton className="h-4 w-4 rounded-full animate-pulse mr-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Refresh from EA
                  </>
                )}
              </Button>
            )}
            {!statsSaved && isAdmin && (
              <Button
                size="sm"
                onClick={saveStatsToDatabase}
                disabled={savingStats || playerStats.length === 0}
                className="flex items-center"
              >
                {savingStats ? (
                  <>
                    <Skeleton className="h-4 w-4 rounded-full animate-pulse mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Stats
                  </>
                )}
              </Button>
            )}
            {statsSaved && (
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900 flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasGenericNames && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Generic Player Names Detected</AlertTitle>
            <AlertDescription className="text-yellow-700">
              The player statistics have generic names. Click the "Refresh from EA" button above to get actual player
              names.
            </AlertDescription>
          </Alert>
        )}

        {isCombinedMatch && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Combined Match Statistics</AlertTitle>
            <AlertDescription className="text-blue-700">
              These statistics are combined from multiple matches.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="player-stats">Player Stats</TabsTrigger>
            <TabsTrigger value="team-stats">Team Stats</TabsTrigger>
          </TabsList>

          {/* Player Stats Tab */}
          <TabsContent value="player-stats">
            {/* Team Selection Tabs */}
            <Tabs value={activeTeamTab} onValueChange={setActiveTeamTab} className="mb-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="home">{homeTeamStats.team_name}</TabsTrigger>
                <TabsTrigger value="away">{awayTeamStats.team_name}</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Player Type Tabs */}
            <Tabs value={activePlayerTab} onValueChange={setActivePlayerTab} className="mb-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="skaters">Skaters</TabsTrigger>
                <TabsTrigger value="goalies">Goalies</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Skaters Table */}
            {activePlayerTab === "skaters" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-1 sm:px-3 text-left text-xs sm:text-sm">Player</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">Pos</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">G</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">A</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">PTS</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">+/-</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">PIM</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">S</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">HIT</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">BLK</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">GVA</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">TKA</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">INT</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">FOW</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">FOL</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">FO%</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">PassCom</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">PassAtt</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">PDraws</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">PPG</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">TWP</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">TOI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTeamTab === "home" ? homeSkaters : awaySkaters)
                      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
                      .map((player, index) => (
                        <tr
                          key={`${activeTeamTab}-${player.player_id || index}`}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-2 px-1 sm:px-3 text-xs sm:text-sm">
                            <PlayerClickableLink playerName={player.player_name} />
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {mapEaPositionToStandard(player.position || "") || "-"}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.goals}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.assists}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {player.goals + player.assists}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            <span
                              className={
                                player.plus_minus > 0 ? "text-green-500" : player.plus_minus < 0 ? "text-red-500" : ""
                              }
                            >
                              {player.plus_minus > 0 ? `+${player.plus_minus}` : player.plus_minus}
                            </span>
                          </td>
                          {/* Continue with other cells using similar responsive classes */}
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.pim}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.shots}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.hits}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.blocks}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.giveaways}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">{player.takeaways}</td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {typeof player.skinterceptions === "string"
                              ? Number.parseInt(player.skinterceptions || "0", 10)
                              : player.skinterceptions || 0}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {typeof player.skfow === "string"
                              ? Number.parseInt(player.skfow || "0", 10)
                              : player.skfow || 0}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {typeof player.skfol === "string"
                              ? Number.parseInt(player.skfol || "0", 10)
                              : player.skfol || 0}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {player.faceoff_pct !== undefined
                              ? typeof player.faceoff_pct === "number"
                                ? player.faceoff_pct.toFixed(1)
                                : player.faceoff_pct
                              : player.skfow && player.skfol && Number(player.skfow) + Number(player.skfol) > 0
                                ? (
                                    (Number(player.skfow) / (Number(player.skfow) + Number(player.skfol))) *
                                    100
                                  ).toFixed(1)
                                : "0"}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {typeof player.skpasses === "string"
                              ? Number.parseInt(player.skpasses || "0", 10)
                              : player.pass_complete || 0}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {typeof player.skpassattempts === "string"
                              ? Number.parseInt(player.skpassattempts || "0", 10)
                              : player.pass_attempts || 0}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {typeof player.skpenaltiesdrawn === "string"
                              ? Number.parseInt(player.skpenaltiesdrawn || "0", 10)
                              : player.skpenaltiesdrawn || 0}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {player.ppg !== undefined
                              ? player.ppg
                              : typeof player.skppg === "string"
                                ? Number.parseInt(player.skppg || "0", 10)
                                : player.skppg || 0}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {formatTimeWithPuck(
                              typeof player.skpossession === "string"
                                ? Number.parseInt(player.skpossession || "0", 10)
                                : player.skpossession || 0,
                            )}
                          </td>
                          <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                            {player.toi ||
                              formatTimeOnIce(
                                typeof player.toiseconds === "string"
                                  ? Number.parseInt(player.toiseconds || "0", 10)
                                  : 0,
                              )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Goalies Table */}
            {activePlayerTab === "goalies" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-1 sm:px-3 text-left text-xs sm:text-sm">Goalie</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">Shots</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">Saves</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">GA</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">Save %</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">GAA</th>
                      <th className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">TOI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTeamTab === "home" ? homeGoalies : awayGoalies).map((player, index) => (
                      <tr
                        key={`${activeTeamTab}-goalie-${player.player_id || index}`}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-2 px-1 sm:px-3 text-xs sm:text-sm">
                          <PlayerClickableLink playerName={player.player_name} />
                        </td>
                        {/* Continue with responsive cell styling */}
                        <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                          {typeof player.glshots === "string"
                            ? Number.parseInt(player.glshots || "0", 10)
                            : player.shots_against || 0}
                        </td>
                        {/* ... rest of the goalie stats cells with similar responsive styling */}
                        <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                          {typeof player.glsaves === "string"
                            ? Number.parseInt(player.glsaves || "0", 10)
                            : player.saves || 0}
                        </td>
                        <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                          {typeof player.glga === "string"
                            ? Number.parseInt(player.glga || "0", 10)
                            : player.goals_against || 0}
                        </td>
                        <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                          {typeof player.glsavepct === "string"
                            ? `.${(Number.parseFloat(player.glsavepct || "0") * 1000).toFixed(0).padStart(3, "0")}`
                            : player.save_pct
                              ? `.${typeof "0"}`
                              : player.save_pct
                                ? `.${(typeof player.save_pct === "number" ? player.save_pct * 10 : Number.parseFloat(player.save_pct) * 1000).toFixed(0).padStart(3, "0")}`
                                : player.saves && player.shots_against
                                  ? `.${((player.saves / player.shots_against) * 1000).toFixed(0).padStart(3, "0")}`
                                  : ".000"}
                        </td>
                        <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                          {(() => {
                            // Extract TOI in minutes
                            let toiMinutes = 0
                            if (player.toi) {
                              const [minutes, seconds] = player.toi.split(":").map(Number)
                              toiMinutes = minutes + seconds / 60
                            } else if (typeof player.toiseconds === "string") {
                              toiMinutes = Number.parseInt(player.toiseconds || "0", 10) / 60
                            }

                            // Calculate GAA
                            const goalsAgainst =
                              typeof player.glga === "string"
                                ? Number.parseInt(player.glga || "0", 10)
                                : player.goals_against || 0

                            const gaa = toiMinutes > 0 ? (goalsAgainst * 60) / toiMinutes : 0

                            return gaa.toFixed(2)
                          })()}
                        </td>
                        <td className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm">
                          {player.toi ||
                            formatTimeOnIce(
                              typeof player.toiseconds === "string" ? Number.parseInt(player.toiseconds || "0", 10) : 0,
                            )}
                        </td>
                      </tr>
                    ))}
                    {(activeTeamTab === "home" ? homeGoalies : awayGoalies).length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-muted-foreground text-xs sm:text-sm">
                          No goalie data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Team Stats Tab */}
          <TabsContent value="team-stats">
            {/* Team Comparison with Logos */}
            <div className="space-y-4 sm:space-y-6">
              {/* Team Headers with Logos */}
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex items-center">
                  <TeamLogo teamName={homeTeamStats.team_name} size="md" className="mr-2" />
                  <span className="font-semibold text-sm sm:text-lg">{homeTeamStats.team_name}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-sm sm:text-lg">{awayTeamStats.team_name}</span>
                  <TeamLogo teamName={awayTeamStats.team_name} size="md" className="ml-2" />
                </div>
              </div>

              {/* Stats Comparison with responsive spacing */}
              <div className="space-y-3 sm:space-y-6">
                {/* Each stat comparison with mobile-friendly layout */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">{homeTeamStats.goals}</span>
                    <span className="text-xs sm:text-sm font-medium">Goals</span>
                    <span className="text-base sm:text-lg font-bold">{awayTeamStats.goals}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress value={50} className="h-2 sm:h-3 w-full" />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>

                {/* Continue with other stats using similar responsive patterns */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">{homeTeamStats.shots}</span>
                    <span className="text-xs sm:text-sm font-medium">Shots</span>
                    <span className="text-base sm:text-lg font-bold">{awayTeamStats.shots}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress
                        value={(homeTeamStats.shots / (homeTeamStats.shots + awayTeamStats.shots)) * 100 || 50}
                        className="h-2 sm:h-3 w-full"
                      />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">{homeTeamStats.hits}</span>
                    <span className="text-xs sm:text-sm font-medium">Hits</span>
                    <span className="text-base sm:text-lg font-bold">{awayTeamStats.hits}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress
                        value={(homeTeamStats.hits / (homeTeamStats.hits + awayTeamStats.hits)) * 100 || 50}
                        className="h-2 sm:h-3 w-full"
                      />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">{homeTeamStats.blocks}</span>
                    <span className="text-xs sm:text-sm font-medium">Blocks</span>
                    <span className="text-base sm:text-lg font-bold">{awayTeamStats.blocks}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress
                        value={(homeTeamStats.blocks / (homeTeamStats.blocks + awayTeamStats.blocks)) * 100 || 50}
                        className="h-2 sm:h-3 w-full"
                      />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">
                      {homeTeamStats.passing_pct?.toFixed(1) || 0}%
                    </span>
                    <span className="text-xs sm:text-sm font-medium">Passing %</span>
                    <span className="text-base sm:text-lg font-bold">
                      {awayTeamStats.passing_pct?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress
                        value={
                          ((homeTeamStats.passing_pct || 0) /
                            ((homeTeamStats.passing_pct || 0) + (awayTeamStats.passing_pct || 0))) *
                            100 || 50
                        }
                        className="h-2 sm:h-3 w-full"
                      />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">
                      {homeTeamStats.faceoff_pct?.toFixed(1) || 0}%
                    </span>
                    <span className="text-xs sm:text-sm font-medium">Faceoff %</span>
                    <span className="text-base sm:text-lg font-bold">
                      {awayTeamStats.faceoff_pct?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress
                        value={
                          ((homeTeamStats.faceoff_pct || 0) /
                            ((homeTeamStats.faceoff_pct || 0) + (awayTeamStats.faceoff_pct || 0))) *
                            100 || 50
                        }
                        className="h-2 sm:h-3 w-full"
                      />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">{homeTeamStats.pim}</span>
                    <span className="text-xs sm:text-sm font-medium">PIM</span>
                    <span className="text-base sm:text-lg font-bold">{awayTeamStats.pim}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress
                        value={(homeTeamStats.pim / (homeTeamStats.pim + awayTeamStats.pim)) * 100 || 50}
                        className="h-2 sm:h-3 w-full"
                      />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-base sm:text-lg font-bold">
                      {homeTeamStats.pp_goals || 0}/{homeTeamStats.pp_opportunities || 0}
                    </span>
                    <span className="text-xs sm:text-sm font-medium">Power Play</span>
                    <span className="text-base sm:text-lg font-bold">
                      {awayTeamStats.pp_goals || 0}/{awayTeamStats.pp_opportunities || 0}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[45%] text-right pr-2"></div>
                    <div className="w-[10%] flex justify-center">
                      <Progress
                        value={
                          ((homeTeamStats.pp_pct || 0) / ((homeTeamStats.pp_pct || 0) + (awayTeamStats.pp_pct || 0))) *
                            100 || 50
                        }
                        className="h-2 sm:h-3 w-full"
                      />
                    </div>
                    <div className="w-[45%] pl-2"></div>
                  </div>
                </div>
              </div>

              {/* Additional Team Stats - Mobile-friendly grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                {/* Home Team Stats */}
                <div className="bg-muted/10 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <TeamLogo teamName={homeTeamStats.team_name} size="sm" className="mr-2" />
                    <h3 className="font-semibold text-sm sm:text-lg">{homeTeamStats.team_name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Goals</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.goals}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Shots</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.shots}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Hits</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.hits}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Blocks</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.blocks}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Takeaways</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.takeaways}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Giveaways</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.giveaways}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">PP Goals</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.pp_goals || 0}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">PP Opportunities</div>
                      <div className="text-lg sm:text-2xl font-bold">{homeTeamStats.pp_opportunities || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Away Team Stats */}
                <div className="bg-muted/10 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <TeamLogo teamName={awayTeamStats.team_name} size="sm" className="mr-2" />
                    <h3 className="font-semibold text-sm sm:text-lg">{awayTeamStats.team_name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Goals</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.goals}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Shots</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.shots}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Hits</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.hits}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Blocks</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.blocks}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Takeaways</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.takeaways}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">Giveaways</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.giveaways}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">PP Goals</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.pp_goals || 0}</div>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <div className="text-xs sm:text-sm text-muted-foreground">PP Opportunities</div>
                      <div className="text-lg sm:text-2xl font-bold">{awayTeamStats.pp_opportunities || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
