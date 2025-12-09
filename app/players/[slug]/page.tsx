"use client"

import { CardDescription } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy } from "lucide-react"
import { PlayerAwards } from "@/components/players/player-awards"
import { PlayerAwardsDebug } from "@/components/players/player-awards-debug"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface PlayerProfileProps {
  params: {
    slug: string // Changed from id to slug
  }
}

export default function PlayerProfile({ params }: { params: { slug: string } }) {
  // Renamed from PlayerDetailPage to PlayerProfile and accepted params
  const router = useRouter()
  const playerSlug = params.slug as string // Changed from playerId to playerSlug
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [player, setPlayer] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [matchesAHL, setMatchesAHL] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aggregatedStats, setAggregatedStats] = useState<any>(null)
  const [currentSeason, setCurrentSeason] = useState<any>(null)
  const [careerStats, setCareerStats] = useState<any>(null)
  const [seasonStats, setSeasonStats] = useState<any[]>([])
  const [seasonRegistration, setSeasonRegistration] = useState<any>(null)
  const [aggregatedStatsAHL, setAggregatedStatsAHL] = useState<any>(null)
  const [seasonStatsAHL, setSeasonStatsAHL] = useState<any[]>([])
  const [careerStatsAHL, setCareerStatsAHL] = useState<any>(null)
  const [currentSeasonAHL, setCurrentSeasonAHL] = useState<any>(null)
  const [statsLeague, setStatsLeague] = useState<"nhl" | "ahl">("nhl")
  const [gameLogLeague, setGameLogLeague] = useState<"nhl" | "ahl">("nhl")

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .single()

          setIsAdmin(!!data)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }

    checkAdminStatus()
  }, [supabase])

  // Fetch current season
  useEffect(() => {
    async function fetchCurrentSeason() {
      try {
        console.log("Fetching current season...")
        // First try to get seasons from the seasons table
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false })

        if (!seasonsError && seasonsData && seasonsData.length > 0) {
          // Find active season
          const activeSeason = seasonsData.find((s) => s.is_active === true)
          if (activeSeason) {
            console.log("Found active season:", activeSeason)
            setCurrentSeason(activeSeason)
          } else {
            // Default to first season
            console.log("No active season, using first season:", seasonsData[0])
            setCurrentSeason(seasonsData[0])
          }
        } else {
          // Try to get current season from system_settings
          const { data, error } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "current_season")
            .single()

          if (!error && data && data.value) {
            const seasonNumber = Number.parseInt(data.value.toString(), 10)
            if (!isNaN(seasonNumber)) {
              const season = {
                id: seasonNumber.toString(),
                number: seasonNumber,
                name: `Season ${seasonNumber}`,
                is_active: true,
              }
              console.log("Using season from system_settings:", season)
              setCurrentSeason(season)
            }
          } else {
            // Default to season 1
            const defaultSeason = {
              id: "1",
              number: 1,
              name: "Season 1",
              is_active: true,
            }
            console.log("Using default season:", defaultSeason)
            setCurrentSeason(defaultSeason)
          }
        }
      } catch (error) {
        console.error("Error fetching current season:", error)
        const defaultSeason = {
          id: "1",
          number: 1,
          name: "Season 1",
          is_active: true,
        }
        console.log("Error fallback to default season:", defaultSeason)
        setCurrentSeason(defaultSeason)
      }
    }

    fetchCurrentSeason()
  }, [supabase])

  useEffect(() => {
    async function fetchCurrentSeasonAHL() {
      try {
        console.log("[v0] Fetching current AHL season...")

        // First try to get current season from system_settings_ahl
        const { data: settingsData, error: settingsError } = await supabase
          .from("system_settings_ahl")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (!settingsError && settingsData && settingsData.value) {
          const seasonNumber = Number.parseInt(settingsData.value.toString(), 10)
          console.log("[v0] Found current AHL season number from system_settings_ahl:", seasonNumber)

          if (!isNaN(seasonNumber)) {
            // Get the full season record from seasons_ahl
            const { data: seasonRecord, error: seasonError } = await supabase
              .from("seasons_ahl")
              .select("*")
              .eq("number", seasonNumber)
              .single()

            if (!seasonError && seasonRecord) {
              console.log("[v0] Found AHL season record:", seasonRecord)
              setCurrentSeasonAHL(seasonRecord)
              return
            }
          }
        }

        // Fallback: try to get active season from seasons_ahl
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons_ahl")
          .select("*")
          .order("number", { ascending: false })

        if (!seasonsError && seasonsData && seasonsData.length > 0) {
          const activeSeason = seasonsData.find((s) => s.is_active === true)
          if (activeSeason) {
            console.log("[v0] Found active AHL season:", activeSeason)
            setCurrentSeasonAHL(activeSeason)
          } else {
            console.log("[v0] No active AHL season, using most recent:", seasonsData[0])
            setCurrentSeasonAHL(seasonsData[0])
          }
        } else {
          // Default to season 1
          const defaultSeason = {
            id: "1",
            number: 1,
            name: "Season 1",
            is_active: true,
          }
          console.log("[v0] Using default AHL season:", defaultSeason)
          setCurrentSeasonAHL(defaultSeason)
        }
      } catch (error) {
        console.error("[v0] Error fetching current AHL season:", error)
        const defaultSeason = {
          id: "1",
          number: 1,
          name: "Season 1",
          is_active: true,
        }
        setCurrentSeasonAHL(defaultSeason)
      }
    }

    fetchCurrentSeasonAHL()
  }, [])

  // Main data fetching effect
  useEffect(() => {
    async function fetchPlayerData() {
      try {
        console.log("Starting fetchPlayerData for playerSlug:", playerSlug) // Updated log message
        setLoading(true)
        setError(null)

        const isLegacyId = playerSlug.includes("-") || (!isNaN(Number(playerSlug)) && playerSlug.length > 10)

        if (isLegacyId) {
          console.log("Detected legacy ID format, handling as ID...")

          // Check if this is an EA player ID (numeric) rather than a UUID
          const isEaPlayerId = !playerSlug.includes("-") && !isNaN(Number(playerSlug))

          if (isEaPlayerId) {
            console.log("Detected EA player ID, checking for mapping...")
            // Check if there's a mapping for this EA player ID
            const { data: mappingData, error: mappingError } = await supabase
              .from("ea_player_mappings")
              .select("player_id")
              .eq("ea_player_id", playerSlug)
              .single()

            if (!mappingError && mappingData && mappingData.player_id) {
              // If we have a mapping, redirect to the player page with the correct slug
              console.log("Found mapping, need to get player slug...")
              const { data: playerData } = await supabase
                .from("players")
                .select("users:user_id (gamer_tag_id)")
                .eq("id", mappingData.player_id)
                .single()

              if (playerData?.users?.gamer_tag_id) {
                const slug = playerData.users.gamer_tag_id.toLowerCase().replace(/[^a-z0-9]/g, "-")
                router.push(`/players/${slug}`)
                return
              }
            } else {
              // If no mapping exists, redirect to the EA player page
              console.log("No mapping found, redirecting to EA player page")
              router.push(`/ea-player/${playerSlug}`)
              return
            }
          }

          // Handle legacy UUID-based URLs by converting to slug
          const { data: legacyPlayerData, error: legacyError } = await supabase
            .from("players")
            .select(`
              users:user_id (gamer_tag_id)
            `)
            .or(`id.eq.${playerSlug},user_id.eq.${playerSlug}`)
            .single()

          if (!legacyError && legacyPlayerData?.users?.gamer_tag_id) {
            const slug = legacyPlayerData.users.gamer_tag_id.toLowerCase().replace(/[^a-z0-9]/g, "-")
            console.log("Redirecting legacy ID to slug:", slug)
            router.push(`/players/${slug}`)
            return
          }
        }

        console.log("Fetching player data by slug from database...")

        let userData = null
        let userError = null

        // Convert slug back to potential gamer_tag_id variations
        const possibleGamerTags = [
          playerSlug,
          playerSlug.replace(/-/g, ""),
          playerSlug.replace(/-/g, "_"),
          playerSlug.replace(/-/g, " "),
        ]

        // Try to find user first, then get player data
        for (const gamerTag of possibleGamerTags) {
          console.log("Trying gamer tag variation:", gamerTag)

          // First, find the user by gamer_tag_id
          const { data: userResult, error: userError } = await supabase
            .from("users")
            .select("id, gamer_tag_id, discord_name, console, avatar_url, created_at")
            .eq("gamer_tag_id", gamerTag)
            .single()

          if (!userError && userResult) {
            console.log("Found user:", userResult)

            // Now get player data for this user
            const { data: playerResult, error: playerError } = await supabase
              .from("players")
              .select(`
                id,
                role,
                salary,
                team_id,
                user_id,
                teams:team_id (
                  id, 
                  name, 
                  logo_url
                )
              `)
              .eq("user_id", userResult.id)
              .single()

            if (!playerError && playerResult) {
              // User has a player record
              userData = {
                ...playerResult,
                users: userResult,
              }
              console.log("Found player with user data:", userData)
            } else {
              // User exists but no player record - create mock player object
              userData = {
                id: null,
                role: "Free Agent",
                salary: 0,
                team_id: null,
                user_id: userResult.id,
                teams: null,
                users: userResult,
              }
              console.log("Found user without player record, created mock player:", userData)
            }
            break
          }
        }

        // If not found by exact match, try case-insensitive search
        if (!userData) {
          console.log("Trying case-insensitive search...")
          const searchPattern = playerSlug.replace(/-/g, "%")

          const { data: userResults, error: userSearchError } = await supabase
            .from("users")
            .select("id, gamer_tag_id, discord_name, console, avatar_url, created_at")
            .ilike("gamer_tag_id", `%${searchPattern}%`)
            .limit(1)
            .single()

          if (!userSearchError && userResults) {
            console.log("Found user by case-insensitive search:", userResults)

            // Get player data for this user
            const { data: playerResult, error: playerError } = await supabase
              .from("players")
              .select(`
                id,
                role,
                salary,
                team_id,
                user_id,
                teams:team_id (
                  id, 
                  name, 
                  logo_url
                )
              `)
              .eq("user_id", userResults.id)
              .single()

            if (!playerError && playerResult) {
              userData = {
                ...playerResult,
                users: userResults,
              }
            } else {
              userData = {
                id: null,
                role: "Free Agent",
                salary: 0,
                team_id: null,
                user_id: userResults.id,
                teams: null,
                users: userResults,
              }
            }
          } else {
            userError = { message: "Player not found" }
          }
        }

        let seasonRegistrationData = null
        if (userData?.user_id) {
          const { data: currentSeasonData } = await supabase.from("seasons").select("id").eq("is_active", true).single()

          if (currentSeasonData) {
            const { data: regData } = await supabase
              .from("season_registrations")
              .select("primary_position, secondary_position")
              .eq("user_id", userData.user_id)
              .eq("season_id", currentSeasonData.id)
              .single()

            seasonRegistrationData = regData
            setSeasonRegistration(regData)
          }
        }

        if (userError || !userData) {
          console.error("User error:", userError)
          if (userError?.code === "PGRST116") {
            setError("Player not found. The slug may be invalid.")
          } else {
            setError(`Error loading player: ${userError?.message || "Player not found"}`)
          }
          setLoading(false)
          return
        }

        console.log("Player data fetched:", userData)

        // Check if user data exists
        if (!userData.users) {
          console.error("No user profile data found")
          setError("Player user data not found. This player may have incomplete profile information.")
          setLoading(false)
          return
        }

        setPlayer(userData)

        let matchesData = []

        const playerGamerTag = userData.users?.gamer_tag_id?.toLowerCase()

        if (playerGamerTag) {
          console.log(`Searching for NHL matches where ${playerGamerTag} played...`)

          // First, get all ea_player_stats records for this player
          const { data: playerStatsRecords, error: playerStatsError } = await supabase
            .from("ea_player_stats")
            .select("match_id, goals, assists, plus_minus, shots, hits, pim, saves, goals_against, position, team_id")
            .ilike("player_name", playerGamerTag)
            .order("created_at", { ascending: false })

          if (playerStatsError) {
            console.error("Error fetching player stats:", playerStatsError)
          } else if (playerStatsRecords && playerStatsRecords.length > 0) {
            console.log(`Found ${playerStatsRecords.length} NHL stat records for player`)

            // Get unique match IDs
            const matchIds = [...new Set(playerStatsRecords.map((stat) => stat.match_id))]
            console.log(`Player participated in ${matchIds.length} unique NHL matches`)

            // Fetch the actual match details
            const { data: matchDetails, error: matchDetailsError } = await supabase
              .from("matches")
              .select(`
                id,
                match_date,
                status,
                home_team_id,
                away_team_id,
                home_score,
                away_score,
                season_name,
                overtime,
                has_overtime,
                home_team:home_team_id (id, name, logo_url),
                away_team:away_team_id (id, name, logo_url)
              `)
              .in("id", matchIds)
              .order("match_date", { ascending: false })
              .limit(20)

            if (matchDetailsError) {
              console.error("Error fetching match details:", matchDetailsError)
            } else if (matchDetails && matchDetails.length > 0) {
              console.log(`Found ${matchDetails.length} NHL match details`)

              // Create a map of match_id to aggregated player stats
              const statsMap = new Map()

              playerStatsRecords.forEach((stat) => {
                if (!statsMap.has(stat.match_id)) {
                  statsMap.set(stat.match_id, {
                    goals: 0,
                    assists: 0,
                    plus_minus: 0,
                    shots: 0,
                    hits: 0,
                    pim: 0,
                    saves: 0,
                    goals_against: 0,
                    position: stat.position,
                    team_id: stat.team_id,
                  })
                }

                const existing = statsMap.get(stat.match_id)
                existing.goals += stat.goals || 0
                existing.assists += stat.assists || 0
                existing.plus_minus += stat.plus_minus || 0
                existing.shots += stat.shots || 0
                existing.hits += stat.hits || 0
                existing.pim += stat.pim || 0
                existing.saves += stat.saves || 0
                existing.goals_against += stat.goals_against || 0
                // Keep the first position found (in case player played multiple positions)
                if (!existing.position && stat.position) {
                  existing.position = stat.position
                }
                // Keep the team_id
                if (!existing.team_id && stat.team_id) {
                  existing.team_id = stat.team_id
                }
              })

              // Combine match details with player stats
              matchesData = matchDetails.map((match) => {
                const playerStats = statsMap.get(match.id) || {
                  goals: 0,
                  assists: 0,
                  plus_minus: 0,
                  shots: 0,
                  hits: 0,
                  pim: 0,
                  saves: 0,
                  goals_against: 0,
                  position: null,
                  team_id: null,
                }

                return {
                  ...match,
                  player_stats: {
                    ...playerStats,
                    points: (playerStats.goals || 0) + (playerStats.assists || 0),
                  },
                }
              })

              console.log(`Successfully processed ${matchesData.length} NHL matches with player stats`)
            }
          } else {
            console.log("No NHL player stats found for this player")
          }
        } else {
          console.log("No gamer tag found for player")
        }

        console.log("Final NHL matches data:", matchesData.length)
        setMatches(matchesData || [])

        let matchesDataAHL = []

        if (playerGamerTag) {
          console.log(`Searching for AHL matches where ${playerGamerTag} played...`)

          // Get all ea_player_stats_ahl records for this player
          const { data: playerStatsRecordsAHL, error: playerStatsErrorAHL } = await supabase
            .from("ea_player_stats_ahl")
            .select("match_id, goals, assists, plus_minus, shots, hits, pim, saves, goals_against, position, team_id")
            .ilike("player_name", playerGamerTag)
            .order("created_at", { ascending: false })

          if (playerStatsErrorAHL) {
            console.error("Error fetching AHL player stats:", playerStatsErrorAHL)
          } else if (playerStatsRecordsAHL && playerStatsRecordsAHL.length > 0) {
            console.log(`Found ${playerStatsRecordsAHL.length} AHL stat records for player`)

            // Get unique match IDs
            const matchIdsAHL = [...new Set(playerStatsRecordsAHL.map((stat) => stat.match_id))]
            console.log(`Player participated in ${matchIdsAHL.length} unique AHL matches`)

            // Fetch the actual match details
            const { data: matchDetailsAHL, error: matchDetailsErrorAHL } = await supabase
              .from("matches_ahl")
              .select(`
                id,
                match_date,
                status,
                home_team_id,
                away_team_id,
                home_score,
                away_score,
                season_name,
                overtime,
                has_overtime,
                home_team:home_team_id (id, name, logo_url),
                away_team:away_team_id (id, name, logo_url)
              `)
              .in("id", matchIdsAHL)
              .order("match_date", { ascending: false })
              .limit(20)

            if (matchDetailsErrorAHL) {
              console.error("Error fetching AHL match details:", matchDetailsErrorAHL)
            } else if (matchDetailsAHL && matchDetailsAHL.length > 0) {
              console.log(`Found ${matchDetailsAHL.length} AHL match details`)

              // Create a map of match_id to aggregated player stats
              const statsMapAHL = new Map()

              playerStatsRecordsAHL.forEach((stat) => {
                if (!statsMapAHL.has(stat.match_id)) {
                  statsMapAHL.set(stat.match_id, {
                    goals: 0,
                    assists: 0,
                    plus_minus: 0,
                    shots: 0,
                    hits: 0,
                    pim: 0,
                    saves: 0,
                    goals_against: 0,
                    position: stat.position,
                    team_id: stat.team_id,
                  })
                }

                const existing = statsMapAHL.get(stat.match_id)
                existing.goals += stat.goals || 0
                existing.assists += stat.assists || 0
                existing.plus_minus += stat.plus_minus || 0
                existing.shots += stat.shots || 0
                existing.hits += stat.hits || 0
                existing.pim += stat.pim || 0
                existing.saves += stat.saves || 0
                existing.goals_against += stat.goals_against || 0
                if (!existing.position && stat.position) {
                  existing.position = stat.position
                }
                if (!existing.team_id && stat.team_id) {
                  existing.team_id = stat.team_id
                }
              })

              // Combine match details with player stats
              matchesDataAHL = matchDetailsAHL.map((match) => {
                const playerStats = statsMapAHL.get(match.id) || {
                  goals: 0,
                  assists: 0,
                  plus_minus: 0,
                  shots: 0,
                  hits: 0,
                  pim: 0,
                  saves: 0,
                  goals_against: 0,
                  position: null,
                  team_id: null,
                }

                return {
                  ...match,
                  player_stats: {
                    ...playerStats,
                    points: (playerStats.goals || 0) + (playerStats.assists || 0),
                  },
                }
              })

              console.log(`Successfully processed ${matchesDataAHL.length} AHL matches with player stats`)
            }
          } else {
            console.log("No AHL player stats found for this player")
          }
        }

        console.log("Final AHL matches data:", matchesDataAHL.length)
        setMatchesAHL(matchesDataAHL || [])

        if (currentSeason && currentSeasonAHL) {
          console.log(
            "[v0] Fetching aggregated stats with NHL season:",
            currentSeason,
            "and AHL season:",
            currentSeasonAHL,
          )
          await Promise.all([
            fetchAggregatedStats(userData, currentSeason),
            fetchCareerStats(userData),
            fetchAHLStats(userData, currentSeasonAHL), // Pass AHL season instead of NHL season
            fetchCareerStatsAHL(userData),
          ])
        } else if (currentSeason) {
          // If only NHL season is available
          console.log("[v0] Fetching NHL stats only with season:", currentSeason)
          await Promise.all([fetchAggregatedStats(userData, currentSeason), fetchCareerStats(userData)])
        } else if (currentSeasonAHL) {
          // If only AHL season is available
          console.log("[v0] Fetching AHL stats only with season:", currentSeasonAHL)
          await Promise.all([fetchAHLStats(userData, currentSeasonAHL), fetchCareerStatsAHL(userData)])
        } else {
          console.log("No current season available, setting empty stats")
          setAggregatedStats({
            games_played: 0,
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffs_won: 0,
            faceoffs_taken: 0,
            faceoffs_lost: 0,
            pass_attempted: 0,
            pass_completed: 0,
            interceptions: 0,
            saves: 0,
            goals_against: 0,
            glshots: 0,
            save_pct: 0,
            total_shots_faced: 0,
            wins: 0,
            losses: 0,
            otl: 0,
            shooting_pct: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            pass_pct: 0,
            faceoff_pct: 0,
          })
          setAggregatedStatsAHL({
            games_played: 0,
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffs_won: 0,
            faceoffs_taken: 0,
            faceoffs_lost: 0,
            pass_attempted: 0,
            pass_completed: 0,
            interceptions: 0,
            saves: 0,
            goals_against: 0,
            glshots: 0,
            save_pct: 0,
            total_shots_faced: 0,
            wins: 0,
            losses: 0,
            otl: 0,
            shooting_pct: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            pass_pct: 0,
            faceoff_pct: 0,
          })
        }

        // Fetch career stats
        await fetchCareerStats(userData)
        await fetchCareerStatsAHL(userData)

        console.log("Player data fetch completed successfully")
      } catch (error: any) {
        console.error("Error fetching player data:", error)
        setError(`Error loading player data: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have playerSlug and currentSeason is loaded (or we've tried to load it)
    if (playerSlug && currentSeason !== null && currentSeasonAHL !== null) {
      fetchPlayerData()
    }
  }, [supabase, playerSlug, router, currentSeason, currentSeasonAHL]) // Updated dependency

  async function fetchAggregatedStats(playerData: any, season: any) {
    try {
      console.log("fetchAggregatedStats called with:", { playerData: playerData.id, season: season.name })

      let seasonNumber = 1
      const seasonId = season.id

      if (season.number && !isNaN(Number(season.number))) {
        seasonNumber = Number(season.number)
      } else if (season.name && /Season\s+(\d+)/i.test(season.name)) {
        const match = /Season\s+(\d+)/i.exec(season.name)
        seasonNumber = Number(match![1])
      }

      const playerGamerTag = playerData.users?.gamer_tag_id?.toLowerCase()

      if (!playerGamerTag) {
        console.log("No gamer tag found for player, setting empty stats")
        setAggregatedStats({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      console.log(`Fetching aggregated stats for player ${playerGamerTag} in season ${seasonNumber}`)

      // First, try to get the actual season record from the database to get the proper UUID
      const { data: seasonRecord, error: seasonError } = await supabase
        .from("seasons")
        .select("id, number, name")
        .eq("number", seasonNumber)
        .single()

      let actualSeasonId = seasonId
      if (!seasonError && seasonRecord) {
        actualSeasonId = seasonRecord.id
        console.log(`Found season record with UUID: ${actualSeasonId}`)
      }

      // Build the query conditions for matches
      let matchQuery = supabase
        .from("matches")
        .select(
          "id, home_team_id, away_team_id, home_score, away_score, status, season_id, season_name, overtime, has_overtime",
        )
        .or("status.ilike.%completed%,status.ilike.%Completed%")

      // Try different approaches to find matches for this season
      if (actualSeasonId && actualSeasonId !== seasonNumber.toString()) {
        // If we have a proper UUID, use it
        matchQuery = matchQuery.eq("season_id", actualSeasonId)
      } else {
        // Fall back to season name matching
        matchQuery = matchQuery.eq("season_name", `Season ${seasonNumber}`)
      }

      const { data: completedMatches, error: matchesError } = await matchQuery

      if (matchesError) {
        console.error("Error fetching completed matches:", matchesError)

        // Try a fallback approach with just season name
        const { data: fallbackMatches, error: fallbackError } = await supabase
          .from("matches")
          .select(
            "id, home_team_id, away_team_id, home_score, away_score, status, season_id, season_name, overtime, has_overtime",
          )
          .or("status.ilike.%completed%,status.ilike.%Completed%")
          .eq("season_name", `Season ${seasonNumber}`)

        if (fallbackError) {
          console.error("Fallback query also failed:", fallbackError)
          return
        }

        console.log(`Fallback found ${fallbackMatches?.length || 0} matches`)
        await processPlayerStats(fallbackMatches || [], playerData)
        return
      }

      console.log(`Found ${completedMatches?.length || 0} completed matches for season ${seasonNumber}`)
      await processPlayerStats(completedMatches || [], playerData)
    } catch (error) {
      console.error("Error fetching aggregated stats:", error)
    }
  }

  async function processPlayerStats(completedMatches: any[], playerData: any) {
    try {
      console.log("processPlayerStats called with", completedMatches.length, "matches")

      // Build a map of match results
      const matchResultsMap = new Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>()

      completedMatches.forEach((match) => {
        if (match.home_score !== null && match.away_score !== null) {
          const isOvertime =
            match.overtime === true ||
            match.has_overtime === true ||
            (match.status && match.status.toLowerCase().includes("overtime")) ||
            (match.status && match.status.includes("(OT)"))

          let homeResult: "W" | "L" | "OTL"
          let awayResult: "W" | "L" | "OTL"

          if (match.home_score > match.away_score) {
            homeResult = "W"
            awayResult = isOvertime ? "OTL" : "L"
          } else if (match.away_score > match.home_score) {
            awayResult = "W"
            homeResult = isOvertime ? "OTL" : "L"
          } else {
            homeResult = "OTL"
            awayResult = "OTL"
          }

          matchResultsMap.set(match.id, { home_result: homeResult, away_result: awayResult })
        }
      })

      // Get match IDs
      const matchIds = completedMatches.map((m) => m.id)

      if (matchIds.length === 0) {
        console.log("No completed matches found for player stats")
        setAggregatedStats({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      // Fetch player stats for these matches, filtering by player name
      const playerGamerTag = playerData.users?.gamer_tag_id?.toLowerCase()

      if (!playerGamerTag) {
        console.log("No gamer tag found for player in processPlayerStats")
        return
      }

      console.log(`Querying ea_player_stats for ${playerGamerTag} in ${matchIds.length} matches`)

      const { data: playerStatsData, error: playerStatsError } = await supabase
        .from("ea_player_stats")
        .select("*")
        .in("match_id", matchIds)
        .ilike("player_name", playerGamerTag)

      if (playerStatsError) {
        console.error("Error fetching player stats:", playerStatsError)
        // Set empty stats on error
        setAggregatedStats({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      console.log(`Found ${playerStatsData?.length || 0} stat records for player ${playerGamerTag}`)

      if (!playerStatsData || playerStatsData.length === 0) {
        // Set empty stats
        setAggregatedStats({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      // Create a map of match_id to match data for quick lookup
      const matchDataMap = new Map()
      completedMatches.forEach((match) => {
        matchDataMap.set(match.id, match)
      })

      // Aggregate all stats for this player (combining offense/defense positions)
      const aggregated = {
        games_played: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plus_minus: 0,
        pim: 0,
        shots: 0,
        hits: 0,
        blocks: 0,
        takeaways: 0,
        giveaways: 0,
        faceoffs_won: 0,
        faceoffs_taken: 0,
        faceoffs_lost: 0,
        pass_attempted: 0,
        pass_completed: 0,
        interceptions: 0,
        saves: 0,
        goals_against: 0,
        glshots: 0,
        save_pct: 0,
        total_shots_faced: 0,
        wins: 0,
        losses: 0,
        otl: 0,
        shooting_pct: 0,
        ppg: 0,
        shg: 0,
        gwg: 0,
        pass_pct: 0,
        faceoff_pct: 0,
        positions_played: new Set<string>(),
      }

      // Track unique matches to avoid double counting games
      const uniqueMatches = new Set<string>()

      playerStatsData.forEach((stat) => {
        // Track positions played
        if (stat.position) {
          aggregated.positions_played.add(stat.position)
        }

        // Only count games once per match
        if (!uniqueMatches.has(stat.match_id)) {
          aggregated.games_played += 1
          uniqueMatches.add(stat.match_id)

          // Calculate W/L/OTL based on match results
          const matchResult = matchResultsMap.get(stat.match_id)
          const matchData = matchDataMap.get(stat.match_id)

          if (matchResult && matchData && stat.team_id) {
            let playerResult: "W" | "L" | "OTL" | null = null

            // Determine if player was on home or away team
            if (stat.team_id === matchData.home_team_id) {
              playerResult = matchResult.home_result
            } else if (stat.team_id === matchData.away_team_id) {
              playerResult = matchResult.away_result
            }

            // Update player's record based on result
            if (playerResult === "W") {
              aggregated.wins += 1
            } else if (playerResult === "OTL") {
              aggregated.otl += 1
            } else if (playerResult === "L") {
              aggregated.losses += 1
            }
          }
        }

        // Aggregate all other stats (these can be summed across positions)
        aggregated.goals += stat.goals || 0
        aggregated.assists += stat.assists || 0
        aggregated.plus_minus += stat.plus_minus || 0
        aggregated.pim += stat.pim || 0
        aggregated.shots += stat.shots || 0
        aggregated.hits += stat.hits || 0
        aggregated.blocks += stat.blocks || 0
        aggregated.takeaways += stat.takeaways || 0
        aggregated.giveaways += stat.giveaways || 0
        aggregated.faceoffs_won += stat.faceoffs_won || 0
        aggregated.faceoffs_taken += stat.faceoffs_taken || 0
        aggregated.pass_attempted += stat.pass_attempts || stat.pass_attempted || 0
        aggregated.pass_completed += stat.pass_complete || stat.pass_completed || 0
        aggregated.interceptions += stat.interceptions || 0

        // Power play and special stats
        aggregated.ppg += stat.ppg || 0
        aggregated.shg += stat.shg || 0
        aggregated.gwg += stat.gwg || 0

        // Goalie stats
        if (stat.position === "G" || stat.position === "0") {
          aggregated.saves += stat.saves || 0
          aggregated.goals_against += stat.goals_against || 0
          aggregated.glshots += stat.glshots || 0
          aggregated.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
        }
      })

      // Calculate derived stats
      aggregated.points = aggregated.goals + aggregated.assists
      aggregated.faceoffs_lost = aggregated.faceoffs_taken - aggregated.faceoffs_won
      aggregated.shooting_pct = aggregated.shots > 0 ? (aggregated.goals / aggregated.shots) * 100 : 0
      aggregated.pass_pct =
        aggregated.pass_attempted > 0 ? (aggregated.pass_completed / aggregated.pass_attempted) * 100 : 0
      aggregated.faceoff_pct =
        aggregated.faceoffs_taken > 0 ? (aggregated.faceoffs_won / aggregated.faceoffs_taken) * 100 : 0

      // Calculate goalie save percentage
      if (aggregated.total_shots_faced > 0) {
        aggregated.save_pct = (aggregated.saves / aggregated.total_shots_faced) * 100
      }

      // Convert positions set to array for display
      const positionsArray = Array.from(aggregated.positions_played)

      console.log(`Player ${playerGamerTag} aggregated stats:`, {
        games: aggregated.games_played,
        goals: aggregated.goals,
        assists: aggregated.assists,
        points: aggregated.points,
        positions: positionsArray,
      })

      setAggregatedStats({
        ...aggregated,
        positions_played: positionsArray,
      })
    } catch (error) {
      console.error("Error processing player stats:", error)
      // Set empty stats on error
      setAggregatedStats({
        games_played: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plus_minus: 0,
        pim: 0,
        shots: 0,
        hits: 0,
        blocks: 0,
        takeaways: 0,
        giveaways: 0,
        faceoffs_won: 0,
        faceoffs_taken: 0,
        faceoffs_lost: 0,
        pass_attempted: 0,
        pass_completed: 0,
        interceptions: 0,
        saves: 0,
        goals_against: 0,
        glshots: 0,
        save_pct: 0,
        total_shots_faced: 0,
        wins: 0,
        losses: 0,
        otl: 0,
        shooting_pct: 0,
        ppg: 0,
        shg: 0,
        gwg: 0,
        pass_pct: 0,
        faceoff_pct: 0,
      })
    }
  }

  async function fetchCareerStats(playerData: any) {
    try {
      console.log("Fetching career stats for player:", playerData.users?.gamer_tag_id)

      const playerGamerTag = playerData.users?.gamer_tag_id?.toLowerCase()

      if (!playerGamerTag) {
        console.log("No gamer tag found for career stats")
        return
      }

      // Get all seasons
      const { data: allSeasons, error: seasonsError } = await supabase
        .from("seasons")
        .select("*")
        .order("number", { ascending: true })

      if (seasonsError) {
        console.error("Error fetching seasons:", seasonsError)
        return
      }

      // Get all player stats for this player
      const { data: allPlayerStats, error: playerStatsError } = await supabase
        .from("ea_player_stats")
        .select("*")
        .ilike("player_name", playerGamerTag)

      if (playerStatsError) {
        console.error("Error fetching all player stats:", playerStatsError)
        return
      }

      if (!allPlayerStats || allPlayerStats.length === 0) {
        console.log("No career stats found for player")
        return
      }

      // Get all matches to determine season and results
      const matchIds = [...new Set(allPlayerStats.map((stat) => stat.match_id))]
      const { data: allMatches, error: matchesError } = await supabase
        .from("matches")
        .select(
          "id, season_name, season_id, home_team_id, away_team_id, home_score, away_score, overtime, has_overtime, status",
        )
        .in("id", matchIds)

      if (matchesError) {
        console.error("Error fetching matches for career stats:", matchesError)
        return
      }

      // Create match lookup map
      const matchMap = new Map()
      allMatches?.forEach((match) => {
        matchMap.set(match.id, match)
      })

      // Group stats by season
      const seasonStatsMap = new Map()
      const positionStatsMap = new Map()

      allPlayerStats.forEach((stat) => {
        const match = matchMap.get(stat.match_id)
        if (!match) return

        const seasonKey = match.season_name || "Season 1"
        const seasonName = seasonKey

        // Extract season number for sorting purposes
        let seasonNumber = 1
        if (match.season_name) {
          const seasonMatch = /Season\s+(\d+)/i.exec(match.season_name)
          if (seasonMatch) {
            seasonNumber = Number(seasonMatch[1])
          }
        }

        // Initialize season stats if not exists
        if (!seasonStatsMap.has(seasonKey)) {
          seasonStatsMap.set(seasonKey, {
            season_number: seasonNumber,
            season_name: seasonName,
            season_key: seasonKey, // Add season key for unique identification
            games_played: new Set(),
            positions_played: new Set(),
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffs_won: 0,
            faceoffs_taken: 0,
            pass_attempted: 0,
            pass_completed: 0,
            interceptions: 0,
            saves: 0,
            goals_against: 0,
            total_shots_faced: 0,
            wins: 0,
            losses: 0,
            otl: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
          })
        }

        const seasonStats = seasonStatsMap.get(seasonKey)

        // Track unique games and positions
        seasonStats.games_played.add(stat.match_id)
        if (stat.position) {
          seasonStats.positions_played.add(stat.position)
        }

        // Aggregate stats
        seasonStats.goals += stat.goals || 0
        seasonStats.assists += stat.assists || 0
        seasonStats.plus_minus += stat.plus_minus || 0
        seasonStats.pim += stat.pim || 0
        seasonStats.shots += stat.shots || 0
        seasonStats.hits += stat.hits || 0
        seasonStats.blocks += stat.blocks || 0
        seasonStats.takeaways += stat.takeaways || 0
        seasonStats.giveaways += stat.giveaways || 0
        seasonStats.faceoffs_won += stat.faceoffs_won || 0
        seasonStats.faceoffs_taken += stat.faceoffs_taken || 0
        seasonStats.pass_attempted += stat.pass_attempts || 0
        seasonStats.pass_completed += stat.pass_complete || 0
        seasonStats.interceptions += stat.interceptions || 0
        seasonStats.ppg += stat.ppg || 0
        seasonStats.shg += stat.shg || 0
        seasonStats.gwg += stat.gwg || 0

        // Goalie stats
        if (stat.position === "G" || stat.position === "0") {
          seasonStats.saves += stat.saves || 0
          seasonStats.goals_against += stat.goals_against || 0
          seasonStats.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
        }

        // Calculate W/L/OTL for this game
        if (match.home_score !== null && match.away_score !== null && stat.team_id) {
          const isOvertime =
            match.overtime ||
            match.has_overtime ||
            (match.status && (match.status.toLowerCase().includes("overtime") || match.status.includes("(OT)")))

          let playerResult = null
          if (stat.team_id === match.home_team_id) {
            if (match.home_score > match.away_score) {
              playerResult = "W"
            } else if (match.home_score < match.away_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          } else if (stat.team_id === match.away_team_id) {
            if (match.away_score > match.home_score) {
              playerResult = "W"
            } else if (match.away_score < match.home_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          }

          if (playerResult === "W") seasonStats.wins += 1
          else if (playerResult === "L") seasonStats.losses += 1
          else if (playerResult === "OTL") seasonStats.otl += 1
        }

        // Group by position for all-time stats
        const position = stat.position || "Unknown"
        if (!positionStatsMap.has(position)) {
          positionStatsMap.set(position, {
            position,
            games_played: new Set(),
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffs_won: 0,
            faceoffs_taken: 0,
            pass_attempted: 0,
            pass_completed: 0,
            interceptions: 0,
            saves: 0,
            goals_against: 0,
            total_shots_faced: 0,
            wins: 0,
            losses: 0,
            otl: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            shutouts: 0,
          })
        }

        const posStats = positionStatsMap.get(position)
        posStats.games_played.add(stat.match_id)
        posStats.goals += stat.goals || 0
        posStats.assists += stat.assists || 0
        posStats.plus_minus += stat.plus_minus || 0
        posStats.pim += stat.pim || 0
        posStats.shots += stat.shots || 0
        posStats.hits += stat.hits || 0
        posStats.blocks += stat.blocks || 0
        posStats.takeaways += stat.takeaways || 0
        posStats.giveaways += stat.giveaways || 0
        posStats.faceoffs_won += stat.faceoffs_won || 0
        posStats.faceoffs_taken += stat.faceoffs_taken || 0
        posStats.pass_attempted += stat.pass_attempts || 0
        posStats.pass_completed += stat.pass_complete || 0
        posStats.interceptions += stat.interceptions || 0
        posStats.ppg += stat.ppg || 0
        posStats.shg += stat.shg || 0
        posStats.gwg += stat.gwg || 0

        // Goalie stats
        if (position === "G" || position === "0") {
          posStats.saves += stat.saves || 0
          posStats.goals_against += stat.goals_against || 0
          posStats.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
          if ((stat.goals_against || 0) === 0) {
            posStats.shutouts += 1
          }
        }

        // W/L/OTL for position
        if (match.home_score !== null && match.away_score !== null && stat.team_id) {
          const isOvertime =
            match.overtime ||
            match.has_overtime ||
            (match.status && (match.status.toLowerCase().includes("overtime") || match.status.includes("(OT)")))

          let playerResult = null
          if (stat.team_id === match.home_team_id) {
            if (match.home_score > match.away_score) {
              playerResult = "W"
            } else if (match.home_score < match.away_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          } else if (stat.team_id === match.away_team_id) {
            if (match.away_score > match.home_score) {
              playerResult = "W"
            } else if (match.away_score < match.home_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          }

          if (playerResult === "W") posStats.wins += 1
          else if (playerResult === "L") posStats.losses += 1
          else if (playerResult === "OTL") posStats.otl += 1
        }
      })

      // Convert sets to counts and calculate derived stats
      const seasonStatsArray = Array.from(seasonStatsMap.values()).map((stats) => ({
        ...stats,
        games_played: stats.games_played.size,
        points: stats.goals + stats.assists,
        shooting_pct: stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0,
        pass_pct: stats.pass_attempted > 0 ? (stats.pass_completed / stats.pass_attempted) * 100 : 0,
        faceoff_pct: stats.faceoffs_taken > 0 ? (stats.faceoffs_won / stats.faceoffs_taken) * 100 : 0,
        save_pct: stats.total_shots_faced > 0 ? (stats.saves / stats.total_shots_faced) * 100 : 0,
        gaa: stats.games_played > 0 ? stats.goals_against / stats.games_played : 0,
        positions_played: Array.from(stats.positions_played),
      }))

      const positionStatsArray = Array.from(positionStatsMap.values()).map((stats) => ({
        ...stats,
        games_played: stats.games_played.size,
        points: stats.goals + stats.assists,
        shooting_pct: stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0,
        pass_pct: stats.pass_attempted > 0 ? (stats.pass_completed / stats.pass_attempted) * 100 : 0,
        faceoff_pct: stats.faceoffs_taken > 0 ? (stats.faceoffs_won / stats.faceoffs_taken) * 100 : 0,
        save_pct: stats.total_shots_faced > 0 ? (stats.saves / stats.total_shots_faced) * 100 : 0,
        gaa: stats.games_played > 0 ? stats.goals_against / stats.games_played : 0,
      }))

      setSeasonStats(
        seasonStatsArray.sort((a, b) => {
          if (a.season_number !== b.season_number) {
            return a.season_number - b.season_number
          }
          // If same season number, sort regular season before playoffs
          if (a.season_name.includes("(Playoffs)") && !b.season_name.includes("(Playoffs)")) {
            return 1
          }
          if (!a.season_name.includes("(Playoffs)") && b.season_name.includes("(Playoffs)")) {
            return -1
          }
          return a.season_name.localeCompare(b.season_name)
        }),
      )

      setSeasonStats(seasonStatsArray.sort((a, b) => a.season_number - b.season_number))
      setCareerStats(positionStatsArray)

      console.log("Career stats processed:", { seasonStatsArray, positionStatsArray })
    } catch (error) {
      console.error("Error fetching career stats:", error)
    }
  }

  async function fetchAHLStats(playerData: any, season: any) {
    try {
      console.log("[v0] fetchAHLStats called with:", { playerData: playerData.id, season: season.name })

      let seasonNumber = 1
      const seasonId = season.id

      if (season.number && !isNaN(Number(season.number))) {
        seasonNumber = Number(season.number)
      } else if (season.name && /Season\s+(\d+)/i.test(season.name)) {
        const match = /Season\s+(\d+)/i.exec(season.name)
        seasonNumber = Number(match![1])
      }

      const playerGamerTag = playerData.users?.gamer_tag_id?.toLowerCase()

      if (!playerGamerTag) {
        console.log("[v0] No gamer tag found for AHL stats")
        setAggregatedStatsAHL({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      console.log(`[v0] Fetching AHL stats for player ${playerGamerTag} in season ${seasonNumber}`)

      // Get season from seasons_ahl table
      const { data: seasonRecord, error: seasonError } = await supabase
        .from("seasons_ahl")
        .select("id, number, name")
        .eq("number", seasonNumber)
        .single()

      let actualSeasonId = seasonId
      if (!seasonError && seasonRecord) {
        actualSeasonId = seasonRecord.id
        console.log(`[v0] Found AHL season record with UUID: ${actualSeasonId}`)
      }

      // Build the query for AHL matches
      let matchQuery = supabase
        .from("matches_ahl")
        .select(
          "id, home_team_id, away_team_id, home_score, away_score, status, season_id, season_name, overtime, has_overtime",
        )
        .or("status.ilike.%completed%,status.ilike.%Completed%")

      if (actualSeasonId && actualSeasonId !== seasonNumber.toString()) {
        matchQuery = matchQuery.eq("season_id", actualSeasonId)
      } else {
        matchQuery = matchQuery.eq("season_name", `Season ${seasonNumber}`)
      }

      const { data: completedMatches, error: matchesError } = await matchQuery

      if (matchesError) {
        console.error("[v0] Error fetching AHL completed matches:", matchesError)
        return
      }

      console.log(`[v0] Found ${completedMatches?.length || 0} completed AHL matches for season ${seasonNumber}`)
      await processPlayerStatsAHL(completedMatches || [], playerData)
    } catch (error) {
      console.error("[v0] Error fetching AHL aggregated stats:", error)
    }
  }

  async function processPlayerStatsAHL(completedMatches: any[], playerData: any) {
    try {
      console.log("[v0] processPlayerStatsAHL called with", completedMatches.length, "matches")

      // Build a map of match results
      const matchResultsMap = new Map<string, { home_result: "W" | "L" | "OTL"; away_result: "W" | "L" | "OTL" }>()

      completedMatches.forEach((match) => {
        if (match.home_score !== null && match.away_score !== null) {
          const isOvertime =
            match.overtime === true ||
            match.has_overtime === true ||
            (match.status && match.status.toLowerCase().includes("overtime")) ||
            (match.status && match.status.includes("(OT)"))

          let homeResult: "W" | "L" | "OTL"
          let awayResult: "W" | "L" | "OTL"

          if (match.home_score > match.away_score) {
            homeResult = "W"
            awayResult = isOvertime ? "OTL" : "L"
          } else if (match.away_score > match.home_score) {
            awayResult = "W"
            homeResult = isOvertime ? "OTL" : "L"
          } else {
            homeResult = "OTL"
            awayResult = "OTL"
          }

          matchResultsMap.set(match.id, { home_result: homeResult, away_result: awayResult })
        }
      })

      const matchIds = completedMatches.map((m) => m.id)

      if (matchIds.length === 0) {
        console.log("[v0] No completed AHL matches found for player stats")
        setAggregatedStatsAHL({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      const playerGamerTag = playerData.users?.gamer_tag_id?.toLowerCase()

      if (!playerGamerTag) {
        console.log("[v0] No gamer tag found for player in processPlayerStatsAHL")
        return
      }

      console.log(`[v0] Querying ea_player_stats_ahl for ${playerGamerTag} in ${matchIds.length} matches`)

      const { data: playerStatsData, error: playerStatsError } = await supabase
        .from("ea_player_stats_ahl")
        .select("*")
        .in("match_id", matchIds)
        .ilike("player_name", playerGamerTag)

      if (playerStatsError) {
        console.error("[v0] Error fetching AHL player stats:", playerStatsError)
        setAggregatedStatsAHL({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      console.log(`[v0] Found ${playerStatsData?.length || 0} AHL stat records for player ${playerGamerTag}`)

      if (!playerStatsData || playerStatsData.length === 0) {
        setAggregatedStatsAHL({
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plus_minus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          blocks: 0,
          takeaways: 0,
          giveaways: 0,
          faceoffs_won: 0,
          faceoffs_taken: 0,
          faceoffs_lost: 0,
          pass_attempted: 0,
          pass_completed: 0,
          interceptions: 0,
          saves: 0,
          goals_against: 0,
          glshots: 0,
          save_pct: 0,
          total_shots_faced: 0,
          wins: 0,
          losses: 0,
          otl: 0,
          shooting_pct: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          pass_pct: 0,
          faceoff_pct: 0,
        })
        return
      }

      const matchDataMap = new Map()
      completedMatches.forEach((match) => {
        matchDataMap.set(match.id, match)
      })

      // Aggregate all stats for this player
      const aggregated = {
        games_played: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plus_minus: 0,
        pim: 0,
        shots: 0,
        hits: 0,
        blocks: 0,
        takeaways: 0,
        giveaways: 0,
        faceoffs_won: 0,
        faceoffs_taken: 0,
        faceoffs_lost: 0,
        pass_attempted: 0,
        pass_completed: 0,
        interceptions: 0,
        saves: 0,
        goals_against: 0,
        glshots: 0,
        save_pct: 0,
        total_shots_faced: 0,
        wins: 0,
        losses: 0,
        otl: 0,
        shooting_pct: 0,
        ppg: 0,
        shg: 0,
        gwg: 0,
        pass_pct: 0,
        faceoff_pct: 0,
        positions_played: new Set<string>(),
      }

      const uniqueMatches = new Set<string>()

      playerStatsData.forEach((stat) => {
        if (stat.position) {
          aggregated.positions_played.add(stat.position)
        }

        if (!uniqueMatches.has(stat.match_id)) {
          aggregated.games_played += 1
          uniqueMatches.add(stat.match_id)

          const matchResult = matchResultsMap.get(stat.match_id)
          const matchData = matchDataMap.get(stat.match_id)

          if (matchResult && matchData && stat.team_id) {
            let playerResult: "W" | "L" | "OTL" | null = null

            if (stat.team_id === matchData.home_team_id) {
              playerResult = matchResult.home_result
            } else if (stat.team_id === matchData.away_team_id) {
              playerResult = matchResult.away_result
            }

            if (playerResult === "W") {
              aggregated.wins += 1
            } else if (playerResult === "OTL") {
              aggregated.otl += 1
            } else if (playerResult === "L") {
              aggregated.losses += 1
            }
          }
        }

        aggregated.goals += stat.goals || 0
        aggregated.assists += stat.assists || 0
        aggregated.plus_minus += stat.plus_minus || 0
        aggregated.pim += stat.pim || 0
        aggregated.shots += stat.shots || 0
        aggregated.hits += stat.hits || 0
        aggregated.blocks += stat.blocks || 0
        aggregated.takeaways += stat.takeaways || 0
        aggregated.giveaways += stat.giveaways || 0
        aggregated.faceoffs_won += stat.faceoffs_won || 0
        aggregated.faceoffs_taken += stat.faceoffs_taken || 0
        aggregated.pass_attempted += stat.pass_attempts || stat.pass_attempted || 0
        aggregated.pass_completed += stat.pass_complete || stat.pass_completed || 0
        aggregated.interceptions += stat.interceptions || 0
        aggregated.ppg += stat.ppg || 0
        aggregated.shg += stat.shg || 0
        aggregated.gwg += stat.gwg || 0

        if (stat.position === "G" || stat.position === "0") {
          aggregated.saves += stat.saves || 0
          aggregated.goals_against += stat.goals_against || 0
          aggregated.glshots += stat.glshots || 0
          aggregated.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
        }
      })

      aggregated.points = aggregated.goals + aggregated.assists
      aggregated.faceoffs_lost = aggregated.faceoffs_taken - aggregated.faceoffs_won
      aggregated.shooting_pct = aggregated.shots > 0 ? (aggregated.goals / aggregated.shots) * 100 : 0
      aggregated.pass_pct =
        aggregated.pass_attempted > 0 ? (aggregated.pass_completed / aggregated.pass_attempted) * 100 : 0
      aggregated.faceoff_pct =
        aggregated.faceoffs_taken > 0 ? (aggregated.faceoffs_won / aggregated.faceoffs_taken) * 100 : 0

      if (aggregated.total_shots_faced > 0) {
        aggregated.save_pct = (aggregated.saves / aggregated.total_shots_faced) * 100
      }

      const positionsArray = Array.from(aggregated.positions_played)

      console.log(`[v0] Player ${playerGamerTag} AHL aggregated stats:`, {
        games: aggregated.games_played,
        goals: aggregated.goals,
        assists: aggregated.assists,
        points: aggregated.points,
        positions: positionsArray,
      })

      setAggregatedStatsAHL({
        ...aggregated,
        positions_played: positionsArray,
      })
    } catch (error) {
      console.error("[v0] Error processing AHL player stats:", error)
      setAggregatedStatsAHL({
        games_played: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plus_minus: 0,
        pim: 0,
        shots: 0,
        hits: 0,
        blocks: 0,
        takeaways: 0,
        giveaways: 0,
        faceoffs_won: 0,
        faceoffs_taken: 0,
        faceoffs_lost: 0,
        pass_attempted: 0,
        pass_completed: 0,
        interceptions: 0,
        saves: 0,
        goals_against: 0,
        glshots: 0,
        save_pct: 0,
        total_shots_faced: 0,
        wins: 0,
        losses: 0,
        otl: 0,
        shooting_pct: 0,
        ppg: 0,
        shg: 0,
        gwg: 0,
        pass_pct: 0,
        faceoff_pct: 0,
      })
    }
  }

  async function fetchCareerStatsAHL(playerData: any) {
    try {
      console.log("[v0] Fetching AHL career stats for player:", playerData.users?.gamer_tag_id)

      const playerGamerTag = playerData.users?.gamer_tag_id?.toLowerCase()

      if (!playerGamerTag) {
        console.log("[v0] No gamer tag found for AHL career stats")
        return
      }

      // Get all AHL seasons
      const { data: allSeasons, error: seasonsError } = await supabase
        .from("seasons_ahl")
        .select("*")
        .order("number", { ascending: true })

      if (seasonsError) {
        console.error("[v0] Error fetching AHL seasons:", seasonsError)
        return
      }

      // Get all AHL player stats for this player
      const { data: allPlayerStats, error: playerStatsError } = await supabase
        .from("ea_player_stats_ahl")
        .select("*")
        .ilike("player_name", playerGamerTag)

      if (playerStatsError) {
        console.error("[v0] Error fetching all AHL player stats:", playerStatsError)
        return
      }

      if (!allPlayerStats || allPlayerStats.length === 0) {
        console.log("[v0] No AHL career stats found for player")
        return
      }

      // Get all AHL matches to determine season and results
      const matchIds = [...new Set(allPlayerStats.map((stat) => stat.match_id))]
      const { data: allMatches, error: matchesError } = await supabase
        .from("matches_ahl")
        .select(
          "id, season_name, season_id, home_team_id, away_team_id, home_score, away_score, overtime, has_overtime, status",
        )
        .in("id", matchIds)

      if (matchesError) {
        console.error("[v0] Error fetching AHL matches for career stats:", matchesError)
        return
      }

      const matchMap = new Map()
      allMatches?.forEach((match) => {
        matchMap.set(match.id, match)
      })

      const seasonStatsMap = new Map()
      const positionStatsMap = new Map()

      allPlayerStats.forEach((stat) => {
        const match = matchMap.get(stat.match_id)
        if (!match) return

        const seasonKey = match.season_name || "Season 1"
        const seasonName = seasonKey

        let seasonNumber = 1
        if (match.season_name) {
          const seasonMatch = /Season\s+(\d+)/i.exec(match.season_name)
          if (seasonMatch) {
            seasonNumber = Number(seasonMatch[1])
          }
        }

        if (!seasonStatsMap.has(seasonKey)) {
          seasonStatsMap.set(seasonKey, {
            season_number: seasonNumber,
            season_name: seasonName,
            season_key: seasonKey,
            games_played: new Set(),
            positions_played: new Set(),
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffs_won: 0,
            faceoffs_taken: 0,
            pass_attempted: 0,
            pass_completed: 0,
            interceptions: 0,
            saves: 0,
            goals_against: 0,
            total_shots_faced: 0,
            wins: 0,
            losses: 0,
            otl: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
          })
        }

        const seasonStats = seasonStatsMap.get(seasonKey)

        seasonStats.games_played.add(stat.match_id)
        if (stat.position) {
          seasonStats.positions_played.add(stat.position)
        }

        seasonStats.goals += stat.goals || 0
        seasonStats.assists += stat.assists || 0
        seasonStats.plus_minus += stat.plus_minus || 0
        seasonStats.pim += stat.pim || 0
        seasonStats.shots += stat.shots || 0
        seasonStats.hits += stat.hits || 0
        seasonStats.blocks += stat.blocks || 0
        seasonStats.takeaways += stat.takeaways || 0
        seasonStats.giveaways += stat.giveaways || 0
        seasonStats.faceoffs_won += stat.faceoffs_won || 0
        seasonStats.faceoffs_taken += stat.faceoffs_taken || 0
        seasonStats.pass_attempted += stat.pass_attempts || 0
        seasonStats.pass_completed += stat.pass_complete || 0
        seasonStats.interceptions += stat.interceptions || 0
        seasonStats.ppg += stat.ppg || 0
        seasonStats.shg += stat.shg || 0
        seasonStats.gwg += stat.gwg || 0

        if (stat.position === "G" || stat.position === "0") {
          seasonStats.saves += stat.saves || 0
          seasonStats.goals_against += stat.goals_against || 0
          seasonStats.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
        }

        if (match.home_score !== null && match.away_score !== null && stat.team_id) {
          const isOvertime =
            match.overtime ||
            match.has_overtime ||
            (match.status && (match.status.toLowerCase().includes("overtime") || match.status.includes("(OT)")))

          let playerResult = null
          if (stat.team_id === match.home_team_id) {
            if (match.home_score > match.away_score) {
              playerResult = "W"
            } else if (match.home_score < match.away_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          } else if (stat.team_id === match.away_team_id) {
            if (match.away_score > match.home_score) {
              playerResult = "W"
            } else if (match.away_score < match.home_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          }

          if (playerResult === "W") seasonStats.wins += 1
          else if (playerResult === "L") seasonStats.losses += 1
          else if (playerResult === "OTL") seasonStats.otl += 1
        }

        const position = stat.position || "Unknown"
        if (!positionStatsMap.has(position)) {
          positionStatsMap.set(position, {
            position,
            games_played: new Set(),
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffs_won: 0,
            faceoffs_taken: 0,
            pass_attempted: 0,
            pass_completed: 0,
            interceptions: 0,
            saves: 0,
            goals_against: 0,
            total_shots_faced: 0,
            wins: 0,
            losses: 0,
            otl: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            shutouts: 0,
          })
        }

        const posStats = positionStatsMap.get(position)
        posStats.games_played.add(stat.match_id)
        posStats.goals += stat.goals || 0
        posStats.assists += stat.assists || 0
        posStats.plus_minus += stat.plus_minus || 0
        posStats.pim += stat.pim || 0
        posStats.shots += stat.shots || 0
        posStats.hits += stat.hits || 0
        posStats.blocks += stat.blocks || 0
        posStats.takeaways += stat.takeaways || 0
        posStats.giveaways += stat.giveaways || 0
        posStats.faceoffs_won += stat.faceoffs_won || 0
        posStats.faceoffs_taken += stat.faceoffs_taken || 0
        posStats.pass_attempted += stat.pass_attempts || 0
        posStats.pass_completed += stat.pass_complete || 0
        posStats.interceptions += stat.interceptions || 0
        posStats.ppg += stat.ppg || 0
        posStats.shg += stat.shg || 0
        posStats.gwg += stat.gwg || 0

        if (position === "G" || position === "0") {
          posStats.saves += stat.saves || 0
          posStats.goals_against += stat.goals_against || 0
          posStats.total_shots_faced += (stat.saves || 0) + (stat.goals_against || 0)
          if ((stat.goals_against || 0) === 0) {
            posStats.shutouts += 1
          }
        }

        if (match.home_score !== null && match.away_score !== null && stat.team_id) {
          const isOvertime =
            match.overtime ||
            match.has_overtime ||
            (match.status && (match.status.toLowerCase().includes("overtime") || match.status.includes("(OT)")))

          let playerResult = null
          if (stat.team_id === match.home_team_id) {
            if (match.home_score > match.away_score) {
              playerResult = "W"
            } else if (match.home_score < match.away_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          } else if (stat.team_id === match.away_team_id) {
            if (match.away_score > match.home_score) {
              playerResult = "W"
            } else if (match.away_score < match.home_score) {
              playerResult = isOvertime ? "OTL" : "L"
            } else {
              playerResult = "OTL"
            }
          }

          if (playerResult === "W") posStats.wins += 1
          else if (playerResult === "L") posStats.losses += 1
          else if (playerResult === "OTL") posStats.otl += 1
        }
      })

      const seasonStatsArray = Array.from(seasonStatsMap.values())
        .filter((stats) => stats.games_played.size > 0)
        .map((stats) => ({
          ...stats,
          games_played: stats.games_played.size,
          points: stats.goals + stats.assists,
          shooting_pct: stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0,
          pass_pct: stats.pass_attempted > 0 ? (stats.pass_completed / stats.pass_attempted) * 100 : 0,
          faceoff_pct: stats.faceoffs_taken > 0 ? (stats.faceoffs_won / stats.faceoffs_taken) * 100 : 0,
          save_pct: stats.total_shots_faced > 0 ? (stats.saves / stats.total_shots_faced) * 100 : 0,
          gaa: stats.games_played > 0 ? stats.goals_against / stats.games_played : 0,
          positions_played: Array.from(stats.positions_played),
        }))
        .sort((a, b) => {
          if (a.season_number !== b.season_number) {
            return a.season_number - b.season_number
          }
          if (a.season_name.includes("(Playoffs)") && !b.season_name.includes("(Playoffs)")) {
            return 1
          }
          if (!a.season_name.includes("(Playoffs)") && b.season_name.includes("(Playoffs)")) {
            return -1
          }
          return a.season_name.localeCompare(b.season_name)
        })

      const positionStatsArray = Array.from(positionStatsMap.values())
        .filter((stats) => stats.games_played.size > 0)
        .map((stats) => ({
          ...stats,
          games_played: stats.games_played.size,
          points: stats.goals + stats.assists,
          shooting_pct: stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0,
          pass_pct: stats.pass_attempted > 0 ? (stats.pass_completed / stats.pass_attempted) * 100 : 0,
          faceoff_pct: stats.faceoffs_taken > 0 ? (stats.faceoffs_won / stats.faceoffs_taken) * 100 : 0,
          save_pct: stats.total_shots_faced > 0 ? (stats.saves / stats.total_shots_faced) * 100 : 0,
          gaa: stats.games_played > 0 ? stats.goals_against / stats.games_played : 0,
        }))

      setSeasonStatsAHL(seasonStatsArray)
      setCareerStatsAHL(positionStatsArray)

      console.log("[v0] AHL career stats processed:", { seasonStatsArray, positionStatsArray })
    } catch (error) {
      console.error("[v0] Error fetching AHL career stats:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
            Back to Statistics
          </Link>
        </div>
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (error || !player || !player.users) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
            Back to Statistics
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Player Not Found</h1>
            <p className="text-muted-foreground">
              {error || "The player you are looking for does not exist or has incomplete profile information."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get current team if player has one
  const currentTeam = player.teams
  const playerRole = player.role || "Free Agent"

  // Use aggregated stats if available, otherwise fall back to empty stats
  const stats = aggregatedStats || {
    games_played: 0,
    goals: 0,
    assists: 0,
    points: 0,
    plus_minus: 0,
    pim: 0,
    shots: 0,
    shooting_pct: 0,
    ppg: 0,
    shg: 0,
    gwg: 0,
    hits: 0,
    takeaways: 0,
    giveaways: 0,
    faceoff_pct: 0,
    pass_pct: 0,
    blocks: 0,
    wins: 0,
    losses: 0,
    otl: 0,
    faceoffs_won: 0,
    faceoffs_taken: 0,
    pass_attempted: 0,
    pass_completed: 0,
    interceptions: 0,
    save_pct: 0,
    saves: 0,
    goals_against: 0,
    total_shots_faced: 0,
  }

  // Calculate points per game
  const gamesPlayed = stats.games_played || 1 // Avoid division by zero
  const pointsPerGame = ((stats.goals || 0) + (stats.assists || 0)) / gamesPlayed

  // Sort matches by date (newest first)
  const sortedMatches = [...matches].sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
  const sortedMatchesAHL = [...matchesAHL].sort(
    (a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime(),
  )

  // Calculate last 5 games trend
  const last5Games = sortedMatches.slice(0, 5)
  const pointsLast5 = last5Games.reduce((sum, match) => sum + match.player_stats.points, 0)
  const pointsPerGameLast5 = last5Games.length > 0 ? (pointsLast5 / last5Games.length).toFixed(2) : "0.00"

  // Format positions played
  const positionsPlayed = aggregatedStats?.positions_played || []
  const positionDisplay =
    positionsPlayed.length > 0
      ? positionsPlayed
          .map((pos) => {
            if (pos === "0") return "G"
            if (pos === "1") return "RD"
            if (pos === "2") return "LD"
            if (pos === "3") return "RW"
            if (pos === "4") return "LW"
            if (pos === "5") return "C"
            return pos
          })
          .join(" / ")
      : seasonRegistration?.primary_position
        ? `${seasonRegistration.primary_position}${seasonRegistration.secondary_position ? ` / ${seasonRegistration.secondary_position}` : ""}`
        : "Unknown"

  // Helper function to format position names
  const formatPositionName = (position: string) => {
    const positionMap: Record<string, string> = {
      "0": "Goalie",
      "1": "Right Defense",
      "2": "Left Defense",
      "3": "Right Wing",
      "4": "Left Wing",
      "5": "Center",
      G: "Goalie",
      RD: "Right Defense",
      LD: "Left Defense",
      RW: "Right Wing",
      LW: "Left Wing",
      C: "Center",
    }
    return positionMap[position] || position
  }

  const playerId = player?.id

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
            Back to Statistics
          </Link>
        </div>

        {/* Player Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative h-32 w-32 bg-muted rounded-full flex items-center justify-center text-4xl font-bold overflow-hidden">
                {player.users?.avatar_url ? (
                  <Image
                    src={player.users.avatar_url || "/placeholder.svg"}
                    alt={player.users?.gamer_tag_id || "Player"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  player.users?.gamer_tag_id?.substring(0, 2).toUpperCase() || "FA"
                )}
              </div>

              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{player.users?.gamer_tag_id || "Unknown Player"}</h1>
                  {player.role === "Captain" && (
                    <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                      Captain <Trophy className="h-3 w-3 ml-1" />
                    </span>
                  )}
                </div>

                <div className="text-lg text-muted-foreground mb-4">
                  {positionDisplay}
                  {currentTeam && ` | ${currentTeam.name}`}
                  {player.users?.console && ` | ${player.users?.console}`}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.games_played || 0}</div>
                    <div className="text-sm text-muted-foreground">Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.goals || 0}</div>
                    <div className="text-sm text-muted-foreground">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.assists || 0}</div>
                    <div className="text-sm text-muted-foreground">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(stats.goals || 0) + (stats.assists || 0)}</div>
                    <div className="text-sm text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stats.plus_minus > 0 ? `+${stats.plus_minus}` : stats.plus_minus || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">+/-</div>
                  </div>
                </div>
              </div>

              {currentTeam && (
                <div className="md:ml-auto text-center md:text-right">
                  <div className="text-sm text-muted-foreground mb-1">Current Team</div>
                  <Link
                    href={`/teams/${currentTeam.id}`}
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    {currentTeam.name}
                  </Link>
                  {player.salary > 0 && (
                    <>
                      <div className="text-sm text-muted-foreground mt-4 mb-1">Salary</div>
                      <div className="text-lg font-medium">${(player.salary / 1000000).toFixed(2)}M</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="career">Career Stats</TabsTrigger>
            <TabsTrigger value="games">Game Log</TabsTrigger>
            <TabsTrigger value="awards">Awards</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <Tabs
              value={statsLeague}
              onValueChange={(value) => setStatsLeague(value as "nhl" | "ahl")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="nhl">NHL Statistics</TabsTrigger>
                <TabsTrigger value="ahl">AHL Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="nhl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {aggregatedStats && aggregatedStats.games_played > 0 ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>NHL Season Statistics</CardTitle>
                          <CardDescription>
                            Overall performance metrics for {currentSeason?.name || "Current Season"}
                            {positionsPlayed.length > 1 && (
                              <span className="block text-xs mt-1 text-blue-600">
                                Combined stats from positions: {positionDisplay}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.games_played || 0}</div>
                                <div className="text-sm text-muted-foreground">Games Played</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{(stats.goals || 0) + (stats.assists || 0)}</div>
                                <div className="text-sm text-muted-foreground">Total Points</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.goals || 0}</div>
                                <div className="text-sm text-muted-foreground">Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.assists || 0}</div>
                                <div className="text-sm text-muted-foreground">Assists</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{pointsPerGame.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">Points Per Game</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {stats.plus_minus > 0 ? `+${stats.plus_minus}` : stats.plus_minus || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">Plus/Minus</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.shots || 0}</div>
                                <div className="text-sm text-muted-foreground">Shots</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{(stats.shooting_pct || 0).toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground">Shooting %</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.ppg || 0}</div>
                                <div className="text-sm text-muted-foreground">Power Play Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.shg || 0}</div>
                                <div className="text-sm text-muted-foreground">Shorthanded Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.gwg || 0}</div>
                                <div className="text-sm text-muted-foreground">Game-Winning Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.pim || 0}</div>
                                <div className="text-sm text-muted-foreground">Penalty Minutes</div>
                              </div>
                            </div>

                            {/* Record */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.wins || 0}</div>
                                <div className="text-sm text-muted-foreground">Wins</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.losses || 0}</div>
                                <div className="text-sm text-muted-foreground">Losses</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.otl || 0}</div>
                                <div className="text-sm text-muted-foreground">OT Losses</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>NHL Advanced Statistics</CardTitle>
                          <CardDescription>Detailed performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.hits || 0}</div>
                                <div className="text-sm text-muted-foreground">Hits</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.takeaways || 0}</div>
                                <div className="text-sm text-muted-foreground">Takeaways</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.giveaways || 0}</div>
                                <div className="text-sm text-muted-foreground">Giveaways</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{(stats.faceoff_pct || 0).toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground">Faceoff Win %</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{(stats.pass_pct || 0).toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground">Pass Completion %</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {(stats.takeaways || 0) - (stats.giveaways || 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Takeaway Diff</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.blocks || 0}</div>
                                <div className="text-sm text-muted-foreground">Blocks</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.interceptions || 0}</div>
                                <div className="text-sm text-muted-foreground">Interceptions</div>
                              </div>
                            </div>

                            {/* Faceoff Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.faceoffs_won || 0}</div>
                                <div className="text-sm text-muted-foreground">Faceoffs Won</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.faceoffs_taken || 0}</div>
                                <div className="text-sm text-muted-foreground">Faceoffs Taken</div>
                              </div>
                            </div>

                            {/* Pass Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.pass_completed || 0}</div>
                                <div className="text-sm text-muted-foreground">Passes Completed</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.pass_attempted || 0}</div>
                                <div className="text-sm text-muted-foreground">Passes Attempted</div>
                              </div>
                            </div>

                            {/* Goalie Stats (if applicable) */}
                            {stats.saves > 0 && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{stats.saves || 0}</div>
                                  <div className="text-sm text-muted-foreground">Saves</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{(stats.save_pct || 0).toFixed(1)}%</div>
                                  <div className="text-sm text-muted-foreground">Save %</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{stats.goals_against || 0}</div>
                                  <div className="text-sm text-muted-foreground">Goals Against</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">
                                    {stats.games_played > 0
                                      ? (stats.goals_against / stats.games_played).toFixed(2)
                                      : "0.00"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">GAA</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{stats.total_shots_faced || 0}</div>
                                  <div className="text-sm text-muted-foreground">Shots Faced</div>
                                </div>
                              </div>
                            )}

                            {last5Games.length > 0 && (
                              <Card>
                                <CardHeader className="py-3">
                                  <CardTitle className="text-base">Recent Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm text-muted-foreground">
                                        Last {last5Games.length} Games
                                      </div>
                                      <div className="text-xl font-bold">{pointsLast5} Points</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-muted-foreground">Points Per Game</div>
                                      <div className="flex items-center">
                                        <span className="text-xl font-bold">{pointsPerGameLast5}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      No NHL statistics available for the current season.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ahl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {aggregatedStatsAHL && aggregatedStatsAHL.games_played > 0 ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>AHL Season Statistics</CardTitle>
                          <CardDescription>
                            AHL performance metrics for {currentSeasonAHL?.name || "Current Season"}
                            {aggregatedStatsAHL.positions_played && aggregatedStatsAHL.positions_played.length > 1 && (
                              <span className="block text-xs mt-1 text-blue-600">
                                Combined stats from positions:{" "}
                                {aggregatedStatsAHL.positions_played
                                  .map((p: string) => formatPositionName(p))
                                  .join(", ")}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.games_played || 0}</div>
                                <div className="text-sm text-muted-foreground">Games Played</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {(aggregatedStatsAHL.goals || 0) + (aggregatedStatsAHL.assists || 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Points</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.goals || 0}</div>
                                <div className="text-sm text-muted-foreground">Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.assists || 0}</div>
                                <div className="text-sm text-muted-foreground">Assists</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {aggregatedStatsAHL.games_played > 0
                                    ? (
                                        ((aggregatedStatsAHL.goals || 0) + (aggregatedStatsAHL.assists || 0)) /
                                        aggregatedStatsAHL.games_played
                                      ).toFixed(2)
                                    : "0.00"}
                                </div>
                                <div className="text-sm text-muted-foreground">Points Per Game</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {aggregatedStatsAHL.plus_minus > 0
                                    ? `+${aggregatedStatsAHL.plus_minus}`
                                    : aggregatedStatsAHL.plus_minus || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">Plus/Minus</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.shots || 0}</div>
                                <div className="text-sm text-muted-foreground">Shots</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {(aggregatedStatsAHL.shooting_pct || 0).toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Shooting %</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.ppg || 0}</div>
                                <div className="text-sm text-muted-foreground">Power Play Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.shg || 0}</div>
                                <div className="text-sm text-muted-foreground">Shorthanded Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.gwg || 0}</div>
                                <div className="text-sm text-muted-foreground">Game-Winning Goals</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.pim || 0}</div>
                                <div className="text-sm text-muted-foreground">Penalty Minutes</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">{aggregatedStatsAHL.wins || 0}</div>
                                <div className="text-sm text-muted-foreground">Wins</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-600">{aggregatedStatsAHL.losses || 0}</div>
                                <div className="text-sm text-muted-foreground">Losses</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-yellow-600">{aggregatedStatsAHL.otl || 0}</div>
                                <div className="text-sm text-muted-foreground">OT Losses</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>AHL Advanced Statistics</CardTitle>
                          <CardDescription>Detailed AHL performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.hits || 0}</div>
                                <div className="text-sm text-muted-foreground">Hits</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.takeaways || 0}</div>
                                <div className="text-sm text-muted-foreground">Takeaways</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.giveaways || 0}</div>
                                <div className="text-sm text-muted-foreground">Giveaways</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {(aggregatedStatsAHL.faceoff_pct || 0).toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Faceoff Win %</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {(aggregatedStatsAHL.pass_pct || 0).toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Pass Completion %</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {((aggregatedStatsAHL.takeaways || 0) - (aggregatedStatsAHL.giveaways || 0)).toFixed(
                                    0,
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">Takeaway Diff</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.blocks || 0}</div>
                                <div className="text-sm text-muted-foreground">Blocks</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.interceptions || 0}</div>
                                <div className="text-sm text-muted-foreground">Interceptions</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.faceoffs_won || 0}</div>
                                <div className="text-sm text-muted-foreground">Faceoffs Won</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.faceoffs_taken || 0}</div>
                                <div className="text-sm text-muted-foreground">Faceoffs Taken</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.pass_completed || 0}</div>
                                <div className="text-sm text-muted-foreground">Passes Completed</div>
                              </div>
                              <div className="bg-muted/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{aggregatedStatsAHL.pass_attempted || 0}</div>
                                <div className="text-sm text-muted-foreground">Passes Attempted</div>
                              </div>
                            </div>

                            {aggregatedStatsAHL.saves > 0 && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{aggregatedStatsAHL.saves || 0}</div>
                                  <div className="text-sm text-muted-foreground">Saves</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">
                                    {(aggregatedStatsAHL.save_pct || 0).toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">Save %</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{aggregatedStatsAHL.goals_against || 0}</div>
                                  <div className="text-sm text-muted-foreground">Goals Against</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">
                                    {aggregatedStatsAHL.games_played > 0
                                      ? (aggregatedStatsAHL.goals_against / aggregatedStatsAHL.games_played).toFixed(2)
                                      : "0.00"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">GAA</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{aggregatedStatsAHL.total_shots_faced || 0}</div>
                                  <div className="text-sm text-muted-foreground">Shots Faced</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      No AHL statistics available for the current season.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="career">
            <div className="space-y-8">
              {seasonStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>NHL Season by Season Statistics</CardTitle>
                    <CardDescription>NHL performance breakdown by season</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Season</TableHead>
                            <TableHead className="text-center">GP</TableHead>
                            <TableHead className="text-center">W-L-OTL</TableHead>
                            <TableHead className="text-center">G</TableHead>
                            <TableHead className="text-center">A</TableHead>
                            <TableHead className="text-center">PTS</TableHead>
                            <TableHead className="text-center">+/-</TableHead>
                            <TableHead className="text-center">PIM</TableHead>
                            <TableHead className="text-center">S</TableHead>
                            <TableHead className="text-center">S%</TableHead>
                            <TableHead className="text-center">HIT</TableHead>
                            <TableHead className="text-center">BLK</TableHead>
                            <TableHead className="text-center">TKA</TableHead>
                            <TableHead className="text-center">GVA</TableHead>
                            <TableHead className="text-center">FO%</TableHead>
                            <TableHead className="text-center">PPG</TableHead>
                            <TableHead className="text-center">SHG</TableHead>
                            <TableHead className="text-center">SV</TableHead>
                            <TableHead className="text-center">GA</TableHead>
                            <TableHead className="text-center">SV%</TableHead>
                            <TableHead className="text-center">GAA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {seasonStats.map((season) => (
                            <TableRow key={season.season_key || season.season_name}>
                              <TableCell className="font-medium">{season.season_name}</TableCell>
                              <TableCell className="text-center">{season.games_played}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-green-600">{season.wins}</span>-
                                <span className="text-red-600">{season.losses}</span>-
                                <span className="text-yellow-600">{season.otl}</span>
                              </TableCell>
                              <TableCell className="text-center">{season.goals}</TableCell>
                              <TableCell className="text-center">{season.assists}</TableCell>
                              <TableCell className="text-center font-bold">{season.points}</TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={
                                    season.plus_minus > 0
                                      ? "text-green-500"
                                      : season.plus_minus < 0
                                        ? "text-red-500"
                                        : ""
                                  }
                                >
                                  {season.plus_minus > 0 ? `+${season.plus_minus}` : season.plus_minus}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">{season.pim}</TableCell>
                              <TableCell className="text-center">{season.shots}</TableCell>
                              <TableCell className="text-center">{season.shooting_pct.toFixed(1)}%</TableCell>
                              <TableCell className="text-center">{season.hits}</TableCell>
                              <TableCell className="text-center">{season.blocks}</TableCell>
                              <TableCell className="text-center">{season.takeaways}</TableCell>
                              <TableCell className="text-center">{season.giveaways}</TableCell>
                              <TableCell className="text-center">{season.faceoff_pct.toFixed(1)}%</TableCell>
                              <TableCell className="text-center">{season.ppg}</TableCell>
                              <TableCell className="text-center">{season.shg}</TableCell>
                              <TableCell className="text-center">{season.saves || "-"}</TableCell>
                              <TableCell className="text-center">{season.goals_against || "-"}</TableCell>
                              <TableCell className="text-center">
                                {season.saves > 0 ? `${season.save_pct.toFixed(1)}%` : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {season.saves > 0 ? season.gaa.toFixed(2) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {careerStats && careerStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>NHL All-Time Statistics by Position</CardTitle>
                    <CardDescription>NHL career totals grouped by position played</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {careerStats
                        .filter((pos) => pos.games_played > 0)
                        .sort((a, b) => {
                          // Sort goalies last, then by games played
                          if (a.position === "G" || a.position === "0") return 1
                          if (b.position === "G" || b.position === "0") return -1
                          return b.games_played - a.games_played
                        })
                        .map((positionStats) => {
                          const isGoalie = positionStats.position === "G" || positionStats.position === "0"

                          return (
                            <div key={positionStats.position} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{formatPositionName(positionStats.position)}</h3>
                                <div className="text-sm text-muted-foreground">
                                  <span className="text-green-600">{positionStats.wins}</span>-
                                  <span className="text-red-600">{positionStats.losses}</span>-
                                  <span className="text-yellow-600">{positionStats.otl}</span>
                                </div>
                              </div>

                              {isGoalie ? (
                                <div className="text-sm">
                                  <span className="font-medium">{positionStats.games_played} GP</span> •
                                  <span className="ml-2">{positionStats.total_shots_faced} Shots</span> •
                                  <span className="ml-2">{positionStats.saves} Saves</span> •
                                  <span className="ml-2">{positionStats.goals_against} Goals Against</span> •
                                  <span className="ml-2">{positionStats.gaa.toFixed(2)} GAA</span> •
                                  <span className="ml-2">{positionStats.save_pct.toFixed(1)}% SV%</span>
                                  {positionStats.shutouts > 0 && (
                                    <span className="ml-2">{positionStats.shutouts} Shutouts</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <span className="font-medium">{positionStats.games_played} GP</span> •
                                  <span className="ml-2">{positionStats.goals}G</span> •
                                  <span className="ml-2">{positionStats.assists}A</span> •
                                  <span className="ml-2 font-medium">{positionStats.points}PT</span> •
                                  <span
                                    className={`ml-2 ${positionStats.plus_minus > 0 ? "text-green-500" : positionStats.plus_minus < 0 ? "text-red-500" : ""}`}
                                  >
                                    {positionStats.plus_minus > 0
                                      ? `+${positionStats.plus_minus}`
                                      : positionStats.plus_minus}
                                  </span>{" "}
                                  •<span className="ml-2">{positionStats.hits} Hits</span> •
                                  <span className="ml-2">{positionStats.giveaways} GVA</span> •
                                  <span className="ml-2">{positionStats.takeaways} TKA</span> •
                                  <span className="ml-2">{positionStats.interceptions} INT</span> •
                                  <span className="ml-2">{positionStats.pass_completed} Pass Completed</span> •
                                  <span className="ml-2">{positionStats.pass_attempted} Pass Attempted</span> •
                                  <span className="ml-2">{positionStats.pass_pct.toFixed(1)}% Pass%</span>
                                  {positionStats.ppg > 0 && <span className="ml-2">{positionStats.ppg} PPG</span>}
                                  {positionStats.faceoffs_taken > 0 && (
                                    <span className="ml-2">{positionStats.faceoff_pct.toFixed(1)}% FO%</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {seasonStatsAHL.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>AHL Season by Season Statistics</CardTitle>
                    <CardDescription>AHL performance breakdown by season</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Season</TableHead>
                            <TableHead className="text-center">GP</TableHead>
                            <TableHead className="text-center">W-L-OTL</TableHead>
                            <TableHead className="text-center">G</TableHead>
                            <TableHead className="text-center">A</TableHead>
                            <TableHead className="text-center">PTS</TableHead>
                            <TableHead className="text-center">+/-</TableHead>
                            <TableHead className="text-center">PIM</TableHead>
                            <TableHead className="text-center">S</TableHead>
                            <TableHead className="text-center">S%</TableHead>
                            <TableHead className="text-center">HIT</TableHead>
                            <TableHead className="text-center">BLK</TableHead>
                            <TableHead className="text-center">TKA</TableHead>
                            <TableHead className="text-center">GVA</TableHead>
                            <TableHead className="text-center">FO%</TableHead>
                            <TableHead className="text-center">PPG</TableHead>
                            <TableHead className="text-center">SHG</TableHead>
                            <TableHead className="text-center">SV</TableHead>
                            <TableHead className="text-center">GA</TableHead>
                            <TableHead className="text-center">SV%</TableHead>
                            <TableHead className="text-center">GAA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {seasonStatsAHL.map((season) => (
                            <TableRow key={season.season_key || season.season_name}>
                              <TableCell className="font-medium">{season.season_name}</TableCell>
                              <TableCell className="text-center">{season.games_played}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-green-600">{season.wins}</span>-
                                <span className="text-red-600">{season.losses}</span>-
                                <span className="text-yellow-600">{season.otl}</span>
                              </TableCell>
                              <TableCell className="text-center">{season.goals}</TableCell>
                              <TableCell className="text-center">{season.assists}</TableCell>
                              <TableCell className="text-center font-bold">{season.points}</TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={
                                    season.plus_minus > 0
                                      ? "text-green-500"
                                      : season.plus_minus < 0
                                        ? "text-red-500"
                                        : ""
                                  }
                                >
                                  {season.plus_minus > 0 ? `+${season.plus_minus}` : season.plus_minus}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">{season.pim}</TableCell>
                              <TableCell className="text-center">{season.shots}</TableCell>
                              <TableCell className="text-center">{season.shooting_pct.toFixed(1)}%</TableCell>
                              <TableCell className="text-center">{season.hits}</TableCell>
                              <TableCell className="text-center">{season.blocks}</TableCell>
                              <TableCell className="text-center">{season.takeaways}</TableCell>
                              <TableCell className="text-center">{season.giveaways}</TableCell>
                              <TableCell className="text-center">{season.faceoff_pct.toFixed(1)}%</TableCell>
                              <TableCell className="text-center">{season.ppg}</TableCell>
                              <TableCell className="text-center">{season.shg}</TableCell>
                              <TableCell className="text-center">{season.saves || "-"}</TableCell>
                              <TableCell className="text-center">{season.goals_against || "-"}</TableCell>
                              <TableCell className="text-center">
                                {season.saves > 0 ? `${season.save_pct.toFixed(1)}%` : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {season.saves > 0 ? season.gaa.toFixed(2) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {careerStatsAHL && careerStatsAHL.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>AHL All-Time Statistics by Position</CardTitle>
                    <CardDescription>AHL career totals grouped by position played</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {careerStatsAHL
                        .filter((pos) => pos.games_played > 0)
                        .sort((a, b) => {
                          if (a.position === "G" || a.position === "0") return 1
                          if (b.position === "G" || b.position === "0") return -1
                          return b.games_played - a.games_played
                        })
                        .map((positionStats) => {
                          const isGoalie = positionStats.position === "G" || positionStats.position === "0"

                          return (
                            <div key={positionStats.position} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{formatPositionName(positionStats.position)}</h3>
                                <div className="text-sm text-muted-foreground">
                                  <span className="text-green-600">{positionStats.wins}</span>-
                                  <span className="text-red-600">{positionStats.losses}</span>-
                                  <span className="text-yellow-600">{positionStats.otl}</span>
                                </div>
                              </div>

                              {isGoalie ? (
                                <div className="text-sm">
                                  <span className="font-medium">{positionStats.games_played} GP</span> •
                                  <span className="ml-2">{positionStats.total_shots_faced} Shots</span> •
                                  <span className="ml-2">{positionStats.saves} Saves</span> •
                                  <span className="ml-2">{positionStats.goals_against} Goals Against</span> •
                                  <span className="ml-2">{positionStats.gaa.toFixed(2)} GAA</span> •
                                  <span className="ml-2">{positionStats.save_pct.toFixed(1)}% SV%</span>
                                  {positionStats.shutouts > 0 && (
                                    <span className="ml-2">{positionStats.shutouts} Shutouts</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <span className="font-medium">{positionStats.games_played} GP</span> •
                                  <span className="ml-2">{positionStats.goals}G</span> •
                                  <span className="ml-2">{positionStats.assists}A</span> •
                                  <span className="ml-2 font-medium">{positionStats.points}PT</span> •
                                  <span
                                    className={`ml-2 ${positionStats.plus_minus > 0 ? "text-green-500" : positionStats.plus_minus < 0 ? "text-red-500" : ""}`}
                                  >
                                    {positionStats.plus_minus > 0
                                      ? `+${positionStats.plus_minus}`
                                      : positionStats.plus_minus}
                                  </span>{" "}
                                  •<span className="ml-2">{positionStats.hits} Hits</span> •
                                  <span className="ml-2">{positionStats.giveaways} GVA</span> •
                                  <span className="ml-2">{positionStats.takeaways} TKA</span> •
                                  <span className="ml-2">{positionStats.interceptions} INT</span> •
                                  <span className="ml-2">{positionStats.pass_completed} Pass Completed</span> •
                                  <span className="ml-2">{positionStats.pass_attempted} Pass Attempted</span> •
                                  <span className="ml-2">{positionStats.pass_pct.toFixed(1)}% Pass%</span>
                                  {positionStats.ppg > 0 && <span className="ml-2">{positionStats.ppg} PPG</span>}
                                  {positionStats.faceoffs_taken > 0 && (
                                    <span className="ml-2">{positionStats.faceoff_pct.toFixed(1)}% FO%</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="games">
            <Tabs
              value={gameLogLeague}
              onValueChange={(value) => setGameLogLeague(value as "nhl" | "ahl")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="nhl">NHL Game Log</TabsTrigger>
                <TabsTrigger value="ahl">AHL Game Log</TabsTrigger>
              </TabsList>

              <TabsContent value="nhl">
                <Card>
                  <CardHeader>
                    <CardTitle>NHL Game Log</CardTitle>
                    <CardDescription>Performance in recent NHL games</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sortedMatches.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Matchup</TableHead>
                              <TableHead className="text-center">Result</TableHead>
                              <TableHead className="text-center">Pos</TableHead>
                              <TableHead className="text-center">G</TableHead>
                              <TableHead className="text-center">A</TableHead>
                              <TableHead className="text-center">PTS</TableHead>
                              <TableHead className="text-center">+/-</TableHead>
                              <TableHead className="text-center">SOG</TableHead>
                              <TableHead className="text-center">HIT</TableHead>
                              <TableHead className="text-center">PIM</TableHead>
                              <TableHead className="text-center">SV</TableHead>
                              <TableHead className="text-center">GA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedMatches.map((match) => {
                              const matchDate = new Date(match.match_date)
                              const formattedDate = matchDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })

                              // Determine if player won this game
                              let isWin = false
                              let playerTeamId = null

                              // Check if player was on home or away team based on stats
                              if (match.player_stats.position) {
                                // We have stats, so player participated
                                // Try to determine team from the match and player's current team
                                if (player.team_id === match.home_team_id) {
                                  playerTeamId = match.home_team_id
                                  isWin = match.home_score > match.away_score
                                } else if (player.team_id === match.away_team_id) {
                                  playerTeamId = match.away_team_id
                                  isWin = match.away_score > match.home_score
                                } else {
                                  // Player might have been on a different team at the time
                                  // Default to showing the result without win/loss indication
                                  isWin = false
                                }
                              }

                              // Format position
                              const position = match.player_stats.position
                              let positionDisplay = position
                              if (position === "0") positionDisplay = "G"
                              else if (position === "1") positionDisplay = "RD"
                              else if (position === "2") positionDisplay = "LD"
                              else if (position === "3") positionDisplay = "RW"
                              else if (position === "4") positionDisplay = "LW"
                              else if (position === "5") positionDisplay = "C"

                              const isGoalie = position === "0" || position === "G"

                              return (
                                <TableRow key={match.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell>{formattedDate}</TableCell>
                                  <TableCell>
                                    <Link
                                      href={`/matches/${match.id}`}
                                      className="hover:text-primary transition-colors"
                                    >
                                      {match.home_team.name} vs {match.away_team.name}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm font-medium">
                                      {match.home_score}-{match.away_score}
                                      {(match.overtime || match.has_overtime) && " (OT)"}
                                    </span>
                                    {playerTeamId && (
                                      <div className={`text-xs ${isWin ? "text-green-600" : "text-red-600"}`}>
                                        {isWin ? "W" : "L"}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center text-sm">{positionDisplay || "-"}</TableCell>
                                  <TableCell className="text-center font-medium">
                                    {match.player_stats.goals || 0}
                                  </TableCell>
                                  <TableCell className="text-center font-medium">
                                    {match.player_stats.assists || 0}
                                  </TableCell>
                                  <TableCell className="text-center font-bold">
                                    {match.player_stats.points || 0}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span
                                      className={
                                        match.player_stats.plus_minus > 0
                                          ? "text-green-500"
                                          : match.player_stats.plus_minus < 0
                                            ? "text-red-500"
                                            : ""
                                      }
                                    >
                                      {match.player_stats.plus_minus > 0
                                        ? `+${match.player_stats.plus_minus}`
                                        : match.player_stats.plus_minus || 0}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">{match.player_stats.shots || 0}</TableCell>
                                  <TableCell className="text-center">{match.player_stats.hits || 0}</TableCell>
                                  <TableCell className="text-center">{match.player_stats.pim || 0}</TableCell>
                                  <TableCell className="text-center">
                                    {isGoalie ? match.player_stats.saves || 0 : "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {isGoalie ? match.player_stats.goals_against || 0 : "-"}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No NHL game history available for this player.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ahl">
                <Card>
                  <CardHeader>
                    <CardTitle>AHL Game Log</CardTitle>
                    <CardDescription>Performance in recent AHL games</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sortedMatchesAHL.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Matchup</TableHead>
                              <TableHead className="text-center">Result</TableHead>
                              <TableHead className="text-center">Pos</TableHead>
                              <TableHead className="text-center">G</TableHead>
                              <TableHead className="text-center">A</TableHead>
                              <TableHead className="text-center">PTS</TableHead>
                              <TableHead className="text-center">+/-</TableHead>
                              <TableHead className="text-center">SOG</TableHead>
                              <TableHead className="text-center">HIT</TableHead>
                              <TableHead className="text-center">PIM</TableHead>
                              <TableHead className="text-center">SV</TableHead>
                              <TableHead className="text-center">GA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedMatchesAHL.map((match) => {
                              const matchDate = new Date(match.match_date)
                              const formattedDate = matchDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })

                              let isWin = false
                              let playerTeamId = null

                              if (match.player_stats.position) {
                                if (player.team_id === match.home_team_id) {
                                  playerTeamId = match.home_team_id
                                  isWin = match.home_score > match.away_score
                                } else if (player.team_id === match.away_team_id) {
                                  playerTeamId = match.away_team_id
                                  isWin = match.away_score > match.home_score
                                } else {
                                  isWin = false
                                }
                              }

                              const position = match.player_stats.position
                              let positionDisplay = position
                              if (position === "0") positionDisplay = "G"
                              else if (position === "1") positionDisplay = "RD"
                              else if (position === "2") positionDisplay = "LD"
                              else if (position === "3") positionDisplay = "RW"
                              else if (position === "4") positionDisplay = "LW"
                              else if (position === "5") positionDisplay = "C"

                              const isGoalie = position === "0" || position === "G"

                              return (
                                <TableRow key={match.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell>{formattedDate}</TableCell>
                                  <TableCell>
                                    <Link
                                      href={`/ahl/matches/${match.id}`}
                                      className="hover:text-primary transition-colors"
                                    >
                                      {match.home_team.name} vs {match.away_team.name}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm font-medium">
                                      {match.home_score}-{match.away_score}
                                      {(match.overtime || match.has_overtime) && " (OT)"}
                                    </span>
                                    {playerTeamId && (
                                      <div className={`text-xs ${isWin ? "text-green-600" : "text-red-600"}`}>
                                        {isWin ? "W" : "L"}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center text-sm">{positionDisplay || "-"}</TableCell>
                                  <TableCell className="text-center font-medium">
                                    {match.player_stats.goals || 0}
                                  </TableCell>
                                  <TableCell className="text-center font-medium">
                                    {match.player_stats.assists || 0}
                                  </TableCell>
                                  <TableCell className="text-center font-bold">
                                    {match.player_stats.points || 0}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span
                                      className={
                                        match.player_stats.plus_minus > 0
                                          ? "text-green-500"
                                          : match.player_stats.plus_minus < 0
                                            ? "text-red-500"
                                            : ""
                                      }
                                    >
                                      {match.player_stats.plus_minus > 0
                                        ? `+${match.player_stats.plus_minus}`
                                        : match.player_stats.plus_minus || 0}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">{match.player_stats.shots || 0}</TableCell>
                                  <TableCell className="text-center">{match.player_stats.hits || 0}</TableCell>
                                  <TableCell className="text-center">{match.player_stats.pim || 0}</TableCell>
                                  <TableCell className="text-center">
                                    {isGoalie ? match.player_stats.saves || 0 : "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {isGoalie ? match.player_stats.goals_against || 0 : "-"}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No AHL game history available for this player.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="awards">
            <PlayerAwards playerId={playerId} />

            {isAdmin && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Admin Debug Information</h3>
                <PlayerAwardsDebug playerId={playerId} />
                <div className="mt-4 flex gap-4">
                  <Link href="/admin/debug/awards-sql" className="text-primary hover:underline">
                    SQL Debug
                  </Link>
                  <Link href="/admin/debug/awards-page" className="text-primary hover:underline">
                    Awards Page Debug
                  </Link>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Player Profile</CardTitle>
                <CardDescription>Personal information and contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Player Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Gamer Tag</div>
                          <div className="font-medium">{player.users?.gamer_tag_id}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Primary Position</div>
                          <div className="font-medium">{seasonRegistration?.primary_position || "Not Set"}</div>
                        </div>
                        {seasonRegistration?.secondary_position && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Secondary Position</div>
                            <div className="font-medium">{seasonRegistration.secondary_position}</div>
                          </div>
                        )}
                        {positionsPlayed.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Positions Played This Season</div>
                            <div className="font-medium">{positionDisplay}</div>
                          </div>
                        )}
                        {currentTeam && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Team</div>
                            <Link
                              href={`/teams/${currentTeam.id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {currentTeam.name}
                            </Link>
                          </div>
                        )}
                        {playerRole && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Role</div>
                            <div className="font-medium">{playerRole}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {player.salary > 0 && (
                      <>
                        <h3 className="text-lg font-semibold mt-8 mb-4">Contract Information</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Salary</div>
                              <div className="font-medium">${(player.salary / 1000000).toFixed(2)}M</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Status</div>
                              <div className="font-medium">Active</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Gaming Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Console</div>
                          <div className="font-medium">{player.users?.console}</div>
                        </div>
                        {player.users?.discord_name && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Discord</div>
                            <div className="font-medium">{player.users?.discord_name}</div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Member Since</div>
                          <div className="font-medium">
                            {player.users?.created_at
                              ? new Date(player.users.created_at).toLocaleDateString()
                              : "Unknown"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Season</div>
                          <div className="font-medium">{currentSeasonAHL?.name || "Current Season"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
