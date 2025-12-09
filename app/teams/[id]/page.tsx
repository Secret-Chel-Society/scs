"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Trophy, Award, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import { Button } from "@/components/ui/button"
import { getTeamStats, getCurrentSeasonId } from "@/lib/team-utils"
import { GameAvailabilityButton } from "@/components/team-schedule/game-availability-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InjuryReserveButton } from "@/components/team-schedule/injury-reserve-button"

interface PlayerStats {
  id: string
  player_id: string
  goals: number
  assists: number
  points: number
  saves?: number
  goals_against?: number
  shots_against?: number
  save_percentage?: number
  games_played?: number
}

interface Player {
  id: string
  user_id: string
  team_id: string
  role: string
  salary: number
  user: {
    id: string
    email: string
    gamer_tag_id: string
    console: string
    primary_position?: string
    secondary_position?: string | null
  }
  stats?: PlayerStats
}

interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  match_date: string
  status: string
  home_team: {
    id: string
    name: string
    logo_url: string | null
  }
  away_team: {
    id: string
    name: string
    logo_url: string | null
  }
}

interface TeamAward {
  id: string
  team_id: string
  award_type: string
  season_number: number
  year: number
  description: string | null
}

interface Team {
  id: string
  name: string
  logo_url: string | null
  wins: number
  losses: number
  otl: number
  goals_for: number
  goals_against: number
  points: number
  games_played: number
  goal_differential: number
  awards?: TeamAward[]
}

// Position abbreviation mapping
function getPositionAbbreviation(position: string): string {
  const positionMap: Record<string, string> = {
    Goalie: "G",
    "Right Wing": "RW",
    "Left Wing": "LW",
    "Left Defense": "LD",
    "Right Defense": "RD",
    Center: "C",
    Forward: "F",
    Defense: "D",
    Defenseman: "D",
    G: "G",
    RW: "RW",
    LW: "LW",
    LD: "LD",
    RD: "RD",
    C: "C",
    F: "F",
    D: "D",
    "Right Defenseman": "RD",
    "Left Defenseman": "LD",
    "Right Defense": "RD",
    "Left Defense": "LD",
  }
  return positionMap[position] || position
}

export default function TeamDetailPage() {
  const params = useParams()
  const teamId = params.id as string
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [roster, setRoster] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [canManageTeam, setCanManageTeam] = useState(false)
  const [awards, setAwards] = useState<TeamAward[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [seasonUUID, setSeasonUUID] = useState<string | null>(null)
  const [currentUserPlayer, setCurrentUserPlayer] = useState<Player | null>(null)

  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(1)
  const [weekMatches, setWeekMatches] = useState<Match[]>([])

  // Check if user is on team
  const isUserOnTeam = roster.some((player) => player.user_id === session?.user?.id)

  async function refreshTeamStats() {
    if (refreshing) return
    try {
      setRefreshing(true)
      const response = await fetch(`/api/teams/${teamId}/refresh-stats`, { method: "POST" })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to refresh team stats")
      }
      toast({
        title: "Team stats refreshed",
        description: "Team statistics have been recalculated based on match results.",
      })
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error refreshing team stats",
        description: error.message || "Failed to refresh team stats.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate weeks from matches
  const calculateWeeks = (matchesData: Match[]) => {
    if (!matchesData.length) return 1
    const sortedMatches = [...matchesData].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const lastMatchDate = new Date(sortedMatches[sortedMatches.length - 1].match_date)
    const timeDiff = lastMatchDate.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, weeksDiff + 1)
  }

  const getCurrentWeek = (matchesData: Match[]) => {
    if (!matchesData.length) return 1
    const today = new Date()
    const sortedMatches = [...matchesData].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const timeDiff = today.getTime() - firstMatchDate.getTime()
    const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000))
    const totalWeeks = calculateWeeks(matchesData)
    return Math.max(1, Math.min(weeksDiff + 1, totalWeeks))
  }

  const getWeekDateRange = (week: number) => {
    if (matches.length === 0) return ""
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const weekStartDate = new Date(firstMatchDate)
    weekStartDate.setDate(firstMatchDate.getDate() + (week - 1) * 7)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    return `${weekStartDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekEndDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`
  }

  useEffect(() => {
    if (matches.length > 0) {
      const weeks = calculateWeeks(matches)
      setTotalWeeks(weeks)
      const currentWeekNum = getCurrentWeek(matches)
      setCurrentWeek(currentWeekNum)
    }
  }, [matches])

  useEffect(() => {
    if (matches.length === 0) {
      setWeekMatches([])
      return
    }
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    const firstMatchDate = new Date(sortedMatches[0].match_date)
    const weekStartDate = new Date(firstMatchDate)
    weekStartDate.setDate(firstMatchDate.getDate() + (currentWeek - 1) * 7)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)
    const filteredMatches = matches.filter((match) => {
      const matchDate = new Date(match.match_date)
      return matchDate >= weekStartDate && matchDate <= weekEndDate
    })
    setWeekMatches(filteredMatches)
  }, [matches, currentWeek])

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true)

        const seasonIdFromFunction = await getCurrentSeasonId()
        let seasonUUIDLocal: string | null = null
        let currentSeason: any = null

        if (seasonIdFromFunction) {
          if (typeof seasonIdFromFunction === "string" && seasonIdFromFunction.includes("-")) {
            const { data: seasonData } = await supabase
              .from("seasons")
              .select("id, season_number, name, parent_season_id")
              .eq("id", seasonIdFromFunction)
              .single()
            if (seasonData) {
              currentSeason = seasonData
              seasonUUIDLocal = seasonData.id
              setSeasonUUID(seasonData.id)
            }
          } else {
            const { data: seasonData } = await supabase
              .from("seasons")
              .select("id, season_number, name, parent_season_id")
              .eq("season_number", seasonIdFromFunction)
              .single()
            if (seasonData) {
              currentSeason = seasonData
              seasonUUIDLocal = seasonData.id
              setSeasonUUID(seasonData.id)
            }
          }
        }

        // Get team stats (standings-based)
        const teamStats = await getTeamStats(teamId, seasonUUIDLocal as any)
        if (!teamStats) {
          toast({
            title: "Team not found",
            description: "The team you are looking for does not exist or has been removed.",
            variant: "destructive",
          })
          return
        }

        // Fetch team details
        const { data: teamData, error: teamError } = await supabase.from("teams").select("*").eq("id", teamId).single()
        if (teamError) throw teamError

        setTeam({
          ...teamData,
          wins: teamStats.wins,
          losses: teamStats.losses,
          otl: teamStats.otl,
          goals_for: teamStats.goals_for,
          goals_against: teamStats.goals_against,
          points: teamStats.points,
          games_played: teamStats.games_played,
          goal_differential: teamStats.goal_differential,
        })

        // Team awards
        const { data: awardsData } = await supabase
          .from("team_awards")
          .select("*")
          .eq("team_id", teamId)
          .order("year", { ascending: false })
        setAwards(awardsData || [])

        // Basic roster
        const { data: rosterData, error: rosterError } = await supabase
          .from("players")
          .select(`
            id, 
            user_id, 
            team_id, 
            role, 
            salary,
            user:users(
              id, 
              email,
              gamer_tag_id,
              console
            )
          `)
          .eq("team_id", teamId)
          .order("role", { ascending: true })

        if (rosterError) throw rosterError

        // Decorate with season registration (positions)
        let rosterWithSeasonData = [...(rosterData as Player[])]
        let seasonForPositions = currentSeason
        let seasonIdForPositions = seasonUUIDLocal
        if (currentSeason?.name?.includes("(Playoffs)") && currentSeason?.parent_season_id) {
          const { data: parentSeasonData } = await supabase
            .from("seasons")
            .select("id, season_number, name")
            .eq("id", currentSeason.parent_season_id)
            .single()
          if (parentSeasonData) {
            seasonForPositions = parentSeasonData
            seasonIdForPositions = parentSeasonData.id
          }
        }

        if (seasonForPositions) {
          const { data: allSeasonRegs } = await supabase
            .from("season_registrations")
            .select("user_id, gamer_tag, primary_position, secondary_position, console")
            .eq("season_number", seasonForPositions.season_number)

          if (allSeasonRegs && allSeasonRegs.length > 0) {
            const seasonRegMap = new Map(allSeasonRegs.map((reg: any) => [reg.user_id, reg]))
            rosterWithSeasonData = (rosterData as Player[]).map((player) => {
              const seasonReg = seasonRegMap.get(player.user_id)
              if (seasonReg) {
                return {
                  ...player,
                  user: {
                    ...player.user,
                    gamer_tag_id: seasonReg.gamer_tag || player.user.gamer_tag_id,
                    primary_position: seasonReg.primary_position,
                    secondary_position: seasonReg.secondary_position,
                    console: seasonReg.console || player.user.console,
                  },
                }
              }
              return {
                ...player,
                user: {
                  ...player.user,
                  primary_position: "Forward",
                  secondary_position: null,
                },
              }
            })
          } else {
            rosterWithSeasonData = (rosterData as Player[]).map((player) => ({
              ...player,
              user: {
                ...player.user,
                primary_position: "Forward",
                secondary_position: null,
              },
            }))
          }
        } else {
          rosterWithSeasonData = (rosterData as Player[]).map((player) => ({
            ...player,
            user: {
              ...player.user,
              primary_position: "Forward",
              secondary_position: null,
            },
          }))
        }

        // ========= NEW: Season-wide EA aggregation by player across ALL teams =========
        // We use the *season number* (integer) for ea_player_stats.season_id.
        const seasonNumber: number | undefined = seasonForPositions?.season_number
        let seasonEaStats: any[] = []

        if (seasonNumber !== undefined) {
          const names = Array.from(
            new Set(
              rosterWithSeasonData
                .map((p) => p.user?.gamer_tag_id)
                .filter((n): n is string => Boolean(n)),
            ),
          )

          // Prefer filtering by names + season_id to reduce payload.
          let eaQuery = supabase
            .from("ea_player_stats")
            .select(
              "player_name, match_id, goals, assists, position, saves, goals_against, glsaves, glga, glshots, save_pct, glsavepct",
            )
            .eq("season_id", seasonNumber)

          if (names.length > 0) {
            eaQuery = eaQuery.in("player_name", names)
          }

          const { data, error } = await eaQuery
          if (error) {
            console.error("EA NHL stats season-wide error:", error)
            seasonEaStats = []
          } else {
            seasonEaStats = data || []
          }
        }

        // Build a case-insensitive aggregation keyed by gamer tag
        type Agg = {
          games: Set<string> // distinct match_id
          g: number
          a: number
          sv: number
          ga: number
          sh: number
        }
        const seasonAggByName = new Map<string, Agg>()

        for (const row of seasonEaStats) {
          const name = (row.player_name || "").toLowerCase()
          if (!name) continue
          const rec: Agg =
            seasonAggByName.get(name) ||
            ({ games: new Set<string>(), g: 0, a: 0, sv: 0, ga: 0, sh: 0 } as Agg)
          if (row.match_id) rec.games.add(row.match_id)

          // skater tallies
          rec.g += row.goals ?? 0
          rec.a += row.assists ?? 0

          // goalie tallies
          const saves = row.saves ?? row.glsaves ?? 0
          const ga = row.goals_against ?? row.glga ?? 0
          const shots = row.glshots ?? (saves + ga) // fallback when glshots missing
          rec.sv += saves
          rec.ga += ga
          rec.sh += shots

          seasonAggByName.set(name, rec)
        }

        // Merge season totals into roster
        const rosterWithStats: Player[] = rosterWithSeasonData.map((player) => {
          const key = (player.user.gamer_tag_id || "").toLowerCase()
          const agg = seasonAggByName.get(key)

          const isGoalie =
            player.user.primary_position === "G" || player.user.primary_position === "Goalie"

          if (!agg) {
            // No stats found this season; keep zeros
            return {
              ...player,
              stats: {
                id: player.id,
                player_id: player.id,
                goals: 0,
                assists: 0,
                points: 0,
                games_played: 0,
                ...(isGoalie
                  ? { saves: 0, goals_against: 0, shots_against: 0, save_percentage: 0 }
                  : {}),
              },
            }
          }

          const gp = agg.games.size
          if (isGoalie) {
            const shotsAgainst = agg.sh
            const savePct = shotsAgainst > 0 ? ((shotsAgainst - agg.ga) / shotsAgainst) * 100 : 0
            return {
              ...player,
              stats: {
                id: player.id,
                player_id: player.id,
                saves: agg.sv,
                goals_against: agg.ga,
                shots_against: shotsAgainst,
                save_percentage: savePct,
                games_played: gp,
                goals: 0,
                assists: 0,
                points: 0,
              },
            }
          } else {
            const goals = agg.g
            const assists = agg.a
            return {
              ...player,
              stats: {
                id: player.id,
                player_id: player.id,
                goals,
                assists,
                points: goals + assists,
                games_played: gp,
              },
            }
          }
        })

        setRoster(rosterWithStats)

        // Current user's player record
        if (session?.user) {
          const userPlayer = rosterWithStats.find((player) => player.user_id === session.user.id)
          setCurrentUserPlayer(userPlayer || null)
        }

        // Team matches
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select(`
            id, 
            home_team_id, 
            away_team_id, 
            home_score, 
            away_score, 
            match_date, 
            status,
            home_team:teams!home_team_id(id, name, logo_url),
            away_team:teams!away_team_id(id, name, logo_url)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order("match_date", { ascending: true })

        if (matchesError) throw matchesError
        setMatches(matchesData || [])

        // Manage permissions (avoid 406)
        if (session?.user) {
          const { data: playerData } = await supabase
            .from("players")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("team_id", teamId)
            .maybeSingle()

          if (playerData) {
            const managerRoles = ["Owner", "GM", "AGM"]
            setCanManageTeam(managerRoles.includes(playerData.role))
          }
        }
      } catch (error: any) {
        console.error("Error in fetchTeamData:", error)
        toast({
          title: "Error loading team data",
          description: error.message || "Failed to load team data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchTeamData()
    }
  }, [supabase, toast, teamId, session])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/teams" className="text-muted-foreground hover:text-foreground">
            Back to Teams
          </Link>
        </div>
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/teams" className="text-muted-foreground hover:text-foreground">
            Back to Teams
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
            <p className="text-muted-foreground">The team you are looking for does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort roster by points
  const sortedRoster = [...roster].sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))

  // Split matches (kept for old view)
  const upcomingMatches = matches
    .filter((match) => match.status === "Scheduled")
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

  const completedMatches = matches
    .filter((match) => match.status === "Completed" || match.status === "completed")
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <Link href="/teams" className="text-muted-foreground hover:text-foreground">
              Back to Teams
            </Link>
          </div>

          {session?.user && (
            <Button variant="outline" size="sm" onClick={refreshTeamStats} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Stats
            </Button>
          )}
        </div>

        {/* Team Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative h-32 w-32">
                {team.logo_url ? (
                  <Image src={team.logo_url || "/placeholder.svg"} alt={team.name} fill className="object-contain" />
                ) : (
                  <TeamLogo teamName={team.name} size="xl" />
                )}
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
                <div className="text-lg text-muted-foreground mb-4">
                  Record: {team.wins}-{team.losses}-{team.otl}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.points}</div>
                    <div className="text-sm text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.games_played}</div>
                    <div className="text-sm text-muted-foreground">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.goals_for}</div>
                    <div className="text-sm text-muted-foreground">Goals For</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{team.goals_against}</div>
                    <div className="text-sm text-muted-foreground">Goals Against</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {team.goal_differential > 0 ? `+${team.goal_differential}` : team.goal_differential}
                    </div>
                    <div className="text-sm text-muted-foreground">Goal Differential</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Team Awards */}
        {awards && awards.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Team Awards
              </CardTitle>
              <CardDescription>Achievements and honors earned by {team.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {awards.map((award) => {
                  const isPresident = award.award_type === "President Trophy"
                  const isCup = award.award_type === "MGHL Cup"
                  return (
                    <div
                      key={award.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isPresident
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : isCup
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                          : "bg-muted/50"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          isPresident
                            ? "bg-blue-100 dark:bg-blue-800"
                            : isCup
                            ? "bg-yellow-100 dark:bg-yellow-800"
                            : "bg-muted"
                        }`}
                      >
                        {isPresident ? (
                          <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        ) : isCup ? (
                          <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                          <Award className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{award.award_type}</div>
                        <div className="text-sm text-muted-foreground">
                          Season {award.season_number} ({award.year})
                        </div>
                        {award.description && <div className="text-sm mt-1">{award.description}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="stats">Team Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <Card>
              <CardHeader>
                <CardTitle>Team Roster</CardTitle>
                <CardDescription>Players currently on {team.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {roster.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-center">Position</TableHead>
                          <TableHead className="text-center">Role</TableHead>
                          <TableHead className="text-center">Gamer Tag</TableHead>
                          <TableHead className="text-center">Console</TableHead>
                          <TableHead className="text-center">Salary</TableHead>
                          <TableHead className="text-center">GP</TableHead>
                          <TableHead className="text-center">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRoster.map((player) => (
                          <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <Link href={`/players/${player.id}`} className="hover:text-primary transition-colors">
                                {player.user.gamer_tag_id}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">
                              {getPositionAbbreviation(player.user.primary_position || "Unknown")}
                              {player.user.secondary_position &&
                                `/${getPositionAbbreviation(player.user.secondary_position)}`}
                            </TableCell>
                            <TableCell className="text-center">
                              {player.role === "Owner" ? (
                                <span className="inline-flex items-center">
                                  {player.role} <Trophy className="h-4 w-4 ml-1 text-yellow-500" />
                                </span>
                              ) : (
                                player.role
                              )}
                            </TableCell>
                            <TableCell className="text-center">{player.user.gamer_tag_id}</TableCell>
                            <TableCell className="text-center">{player.user.console || "Unknown"}</TableCell>
                            <TableCell className="text-center">${(player.salary / 1000000).toFixed(2)}M</TableCell>
                            <TableCell className="text-center font-semibold">
                              {player.stats?.games_played ?? 0}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {player.user.primary_position === "G" || player.user.primary_position === "Goalie"
                                ? "N/A"
                                : player.stats?.points || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No players currently on this team.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Team Schedule</CardTitle>
                <CardDescription>Games for {team.name} organized by week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {totalWeeks > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(currentWeek - 1)}
                        disabled={currentWeek === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous Week
                      </Button>

                      <div className="text-center">
                        <div className="font-semibold">
                          Week {currentWeek} of {totalWeeks}
                        </div>
                        <div className="text-sm text-muted-foreground">{getWeekDateRange(currentWeek)}</div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(currentWeek + 1)}
                        disabled={currentWeek === totalWeeks}
                      >
                        Next Week
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <Select value={currentWeek.toString()} onValueChange={(v) => setCurrentWeek(Number(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                          <SelectItem key={week} value={week.toString()}>
                            Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isUserOnTeam && weekMatches.length > 0 && (
                  <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Week {currentWeek} Injury Reserve</h3>
                      <p className="text-sm text-muted-foreground">
                        Request IR for the entire week ({getWeekDateRange(currentWeek)})
                      </p>
                    </div>
                    <InjuryReserveButton
                      teamId={team.id}
                      isUserOnTeam={isUserOnTeam}
                      matches={weekMatches}
                      currentSeasonId={seasonUUID}
                    />
                  </div>
                )}

                {weekMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No games scheduled for Week {currentWeek}</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Matchup</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          {isUserOnTeam && <TableHead className="text-center">Availability</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weekMatches.map((match) => {
                          const matchDate = new Date(match.match_date)
                          const formattedDate = matchDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                          const formattedTime = matchDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })

                          return (
                            <TableRow key={match.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div>{formattedDate}</div>
                                    <div className="text-sm text-muted-foreground">{formattedTime}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Link href={`/matches/${match.id}`} className="hover:text-primary transition-colors">
                                  {match.home_team.name} vs {match.away_team.name}
                                  {(match.status === "Completed" || match.status === "completed") && (
                                    <div className="text-sm text-muted-foreground">
                                      {match.home_score} - {match.away_score}
                                    </div>
                                  )}
                                </Link>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    match.status === "Completed" || match.status === "completed"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                      : match.status === "In Progress"
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                  }`}
                                >
                                  {match.status}
                                </span>
                              </TableCell>
                              {isUserOnTeam && currentUserPlayer && (
                                <TableCell className="text-center">
                                  <GameAvailabilityButton
                                    matchId={match.id}
                                    playerId={currentUserPlayer.id}
                                    userId={session?.user?.id || ""}
                                    teamId={team.id}
                                  />
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Team Statistics</CardTitle>
                  <CardDescription>Overall performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">{team.games_played}</div>
                        <div className="text-sm text-muted-foreground">Games Played</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">{team.points}</div>
                        <div className="text-sm text-muted-foreground">Total Points</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.games_played > 0 ? ((team.wins / team.games_played) * 100).toFixed(1) : "0.0"}%
                        </div>
                        <div className="text-sm text-muted-foreground">Win Percentage</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.games_played > 0 ? (team.goals_for / team.games_played).toFixed(2) : "0.00"}
                        </div>
                        <div className="text-sm text-muted-foreground">Goals Per Game</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.games_played > 0 ? (team.goals_against / team.games_played).toFixed(2) : "0.00"}
                        </div>
                        <div className="text-sm text-muted-foreground">Goals Against Per Game</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {team.goal_differential > 0 ? `+${team.goal_differential}` : team.goal_differential}
                        </div>
                        <div className="text-sm text-muted-foreground">Goal Differential</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Leading players on the team</CardDescription>
                </CardHeader>
                <CardContent>
                  {roster.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Points Leaders</h3>
                        <div className="space-y-2">
                          {sortedRoster
                            .filter(
                              (player) =>
                                player.user.primary_position !== "G" && player.user.primary_position !== "Goalie",
                            )
                            .slice(0, 3)
                            .map((player, index) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <Link
                                    href={`/players/${player.id}`}
                                    className="font-medium hover:text-primary transition-colors"
                                  >
                                    {player.user.gamer_tag_id} (
                                    {getPositionAbbreviation(player.user.primary_position || "Unknown")}
                                    {player.user.secondary_position &&
                                      `/${getPositionAbbreviation(player.user.secondary_position)}`}
                                    )
                                  </Link>
                                </div>
                                <div className="font-bold">{player.stats?.points || 0} PTS</div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Goal Scorers</h3>
                        <div className="space-y-2">
                          {[...sortedRoster]
                            .filter(
                              (player) =>
                                player.user.primary_position !== "G" && player.user.primary_position !== "Goalie",
                            )
                            .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
                            .slice(0, 3)
                            .map((player, index) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <Link
                                    href={`/players/${player.id}`}
                                    className="font-medium hover:text-primary transition-colors"
                                  >
                                    {player.user.gamer_tag_id}
                                  </Link>
                                </div>
                                <div className="font-bold">{player.stats?.goals || 0} G</div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Goaltending</h3>
                        <div className="space-y-2">
                          {sortedRoster
                            .filter(
                              (player) =>
                                player.user.primary_position === "G" || player.user.primary_position === "Goalie",
                            )
                            .map((player) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                                <Link
                                  href={`/players/${player.id}`}
                                  className="font-medium hover:text-primary transition-colors"
                                >
                                  {player.user.gamer_tag_id}
                                </Link>
                                <div className="font-bold">
                                  {player.stats?.save_percentage !== undefined && player.stats.save_percentage > 0 ? (
                                    <div className="text-right">
                                      <div>{player.stats.save_percentage.toFixed(1)}% SV%</div>
                                      <div className="text-xs text-muted-foreground">
                                        {player.stats.saves}/
                                        {player.stats.shots_against ||
                                          (player.stats.saves || 0) + (player.stats.goals_against || 0)}{" "}
                                        ({player.stats.goals_against} GA)
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground">No stats</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          {sortedRoster.filter(
                            (player) => player.user.primary_position === "G" || player.user.primary_position === "Goalie",
                          ).length === 0 && (
                            <div className="text-center py-2 text-muted-foreground">No goalies on roster</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No player statistics available.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
