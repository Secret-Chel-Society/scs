"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { AlertCircle, FileUp, Plus, Edit, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { SyncStatsButton } from "@/components/admin/sync-stats-button"
import { SyncEaStatsButton } from "@/components/admin/sync-ea-stats-button"

interface Season {
  id: number
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface PlayerStat {
  id: string
  player_id: string
  player_name: string
  team_id: string | null
  team_name: string | null
  position: string
  games_played: number
  goals: number
  assists: number
  points: number
  plus_minus: number
  pim: number
  shots: number
  shooting_pct: number
  ppg: number
  shg: number
  gwg: number
  hits: number
  giveaways: number
  takeaways: number
  interceptions: number
  pass_attempted: number
  pass_completed: number
  pk_clearzone: number
  pk_drawn: number
  faceoff_wins: number
  faceoff_losses: number
  time_with_puck: number
}

interface GoalieStat {
  id: string
  player_id: string
  player_name: string
  team_id: string | null
  team_name: string | null
  games_played: number
  wins: number
  losses: number
  otl: number
  save_pct: number
  gaa: number
  shutouts: number
  saves: number
  shots_against: number
  goals_against: number
}

interface Player {
  id: string
  user_id: string
  gamer_tag: string
  team_id: string | null
  team_name: string | null
}

// Schema for player stat editing
const playerStatSchema = z.object({
  games_played: z.coerce.number().min(0, "Cannot be negative"),
  goals: z.coerce.number().min(0, "Cannot be negative"),
  assists: z.coerce.number().min(0, "Cannot be negative"),
  plus_minus: z.coerce.number(),
  pim: z.coerce.number().min(0, "Cannot be negative"),
  shots: z.coerce.number().min(0, "Cannot be negative"),
  ppg: z.coerce.number().min(0, "Cannot be negative"),
  shg: z.coerce.number().min(0, "Cannot be negative"),
  gwg: z.coerce.number().min(0, "Cannot be negative"),
  hits: z.coerce.number().min(0, "Cannot be negative"),
  giveaways: z.coerce.number().min(0, "Cannot be negative"),
  takeaways: z.coerce.number().min(0, "Cannot be negative"),
  interceptions: z.coerce.number().min(0, "Cannot be negative"),
  pass_attempted: z.coerce.number().min(0, "Cannot be negative"),
  pass_completed: z.coerce.number().min(0, "Cannot be negative"),
  pk_clearzone: z.coerce.number().min(0, "Cannot be negative"),
  pk_drawn: z.coerce.number().min(0, "Cannot be negative"),
  faceoff_wins: z.coerce.number().min(0, "Cannot be negative"),
  faceoff_losses: z.coerce.number().min(0, "Cannot be negative"),
  time_with_puck: z.coerce.number().min(0, "Cannot be negative"),
})

// Schema for goalie stat editing
const goalieStatSchema = z.object({
  games_played: z.coerce.number().min(0, "Cannot be negative"),
  wins: z.coerce.number().min(0, "Cannot be negative"),
  losses: z.coerce.number().min(0, "Cannot be negative"),
  otl: z.coerce.number().min(0, "Cannot be negative"),
  saves: z.coerce.number().min(0, "Cannot be negative"),
  shots_against: z.coerce.number().min(0, "Cannot be negative"),
  goals_against: z.coerce.number().min(0, "Cannot be negative"),
  shutouts: z.coerce.number().min(0, "Cannot be negative"),
})

export default function AdminStatisticsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [goalieStats, setGoalieStats] = useState<GoalieStat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statFilter, setStatFilter] = useState("points")
  const [positionFilter, setPositionFilter] = useState("all")
  const [seasons, setSeasons] = useState<Season[]>([])
  const [currentSeason, setCurrentSeason] = useState<number>(1)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [editingPlayer, setEditingPlayer] = useState<PlayerStat | null>(null)
  const [editingGoalie, setEditingGoalie] = useState<GoalieStat | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isGoalieEditDialogOpen, setIsGoalieEditDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<"player" | "goalie">("player")
  const [isImporting, setIsImporting] = useState(false)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [isAddStatDialogOpen, setIsAddStatDialogOpen] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string>("C")

  // Form for editing player stats
  const playerForm = useForm<z.infer<typeof playerStatSchema>>({
    resolver: zodResolver(playerStatSchema),
    defaultValues: {
      games_played: 0,
      goals: 0,
      assists: 0,
      plus_minus: 0,
      pim: 0,
      shots: 0,
      ppg: 0,
      shg: 0,
      gwg: 0,
      hits: 0,
      giveaways: 0,
      takeaways: 0,
      interceptions: 0,
      pass_attempted: 0,
      pass_completed: 0,
      pk_clearzone: 0,
      pk_drawn: 0,
      faceoff_wins: 0,
      faceoff_losses: 0,
      time_with_puck: 0,
    },
  })

  // Form for editing goalie stats
  const goalieForm = useForm<z.infer<typeof goalieStatSchema>>({
    resolver: zodResolver(goalieStatSchema),
    defaultValues: {
      games_played: 0,
      wins: 0,
      losses: 0,
      otl: 0,
      saves: 0,
      shots_against: 0,
      goals_against: 0,
      shutouts: 0,
    },
  })

  // Form for adding new player stats
  const addStatForm = useForm<z.infer<typeof playerStatSchema>>({
    resolver: zodResolver(playerStatSchema),
    defaultValues: {
      games_played: 0,
      goals: 0,
      assists: 0,
      plus_minus: 0,
      pim: 0,
      shots: 0,
      ppg: 0,
      shg: 0,
      gwg: 0,
      hits: 0,
      giveaways: 0,
      takeaways: 0,
      interceptions: 0,
      pass_attempted: 0,
      pass_completed: 0,
      pk_clearzone: 0,
      pk_drawn: 0,
      faceoff_wins: 0,
      faceoff_losses: 0,
      time_with_puck: 0,
    },
  })

  // Check if user is admin
  useEffect(() => {
    async function checkAuthorization() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin dashboard.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  // Fetch seasons data
  useEffect(() => {
    async function fetchSeasons() {
      try {
        setLoadingSeasons(true)

        // Get seasons from system_settings
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "seasons")
          .single()

        if (seasonsError) throw seasonsError

        // Get current season from system_settings
        const { data: currentSeasonData, error: currentSeasonError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (currentSeasonError) throw currentSeasonError

        const seasonsArray = seasonsData?.value || []
        const currentSeasonId = currentSeasonData?.value || 1

        setSeasons(seasonsArray)
        setCurrentSeason(currentSeasonId)
        setSelectedSeason(currentSeasonId)
      } catch (error: any) {
        console.error("Error fetching seasons:", error)
        toast({
          title: "Error loading seasons",
          description: error.message || "Failed to load seasons data.",
          variant: "destructive",
        })
        // Set default values if there's an error
        setSeasons([{ id: 1, name: "Season 1", start_date: "", end_date: "", is_active: true }])
        setCurrentSeason(1)
        setSelectedSeason(1)
      } finally {
        setLoadingSeasons(false)
      }
    }

    if (isAdmin) {
      fetchSeasons()
    }
  }, [supabase, toast, isAdmin])

  // Fetch available players for adding stats
  useEffect(() => {
    async function fetchAvailablePlayers() {
      if (!selectedSeason) return

      try {
        // Get all registered players for the selected season
        const { data: registeredPlayers, error: registrationError } = await supabase
          .from("season_registrations")
          .select(`
            id,
            user_id,
            gamer_tag
          `)
          .eq("season_number", selectedSeason)
          .eq("status", "approved")

        if (registrationError) throw registrationError

        // Get all players to get team information
        const { data: allPlayers, error: playersError } = await supabase.from("players").select(`
            id,
            user_id,
            team_id,
            teams (
              id,
              name
            )
          `)

        if (playersError) throw playersError

        // Create a comprehensive list of all registered players with their info
        const playersList: Player[] = []

        if (registeredPlayers && registeredPlayers.length > 0) {
          registeredPlayers.forEach((registration) => {
            const userId = registration.user_id
            const playerInfo = allPlayers?.find((p) => p.user_id === userId)

            playersList.push({
              id: playerInfo?.id || userId,
              user_id: userId,
              gamer_tag: registration.gamer_tag,
              team_id: playerInfo?.team_id || null,
              team_name: playerInfo?.teams?.name || null,
            })
          })
        }

        setAvailablePlayers(playersList)
      } catch (error: any) {
        console.error("Error fetching available players:", error)
        toast({
          title: "Error",
          description: "Failed to load available players.",
          variant: "destructive",
        })
      }
    }

    if (isAdmin && selectedSeason) {
      fetchAvailablePlayers()
    }
  }, [supabase, toast, isAdmin, selectedSeason])

  // Fetch player statistics from the database
  // Replace the fetchStats function with this implementation that uses direct queries instead of stored procedures
  async function fetchStats() {
    if (!selectedSeason) return

    try {
      setLoading(true)

      // Fetch player stats for the selected season using direct queries instead of stored procedures
      const { data: playerStatsData, error: playerStatsError } = await supabase
        .from("player_season_stats")
        .select(`
        id,
        player_id,
        season_id,
        position,
        games_played,
        goals,
        assists,
        points,
        plus_minus,
        pim,
        shots,
        shooting_pct,
        ppg,
        shg,
        gwg,
        hits,
        giveaways,
        takeaways,
        interceptions,
        pass_attempted,
        pass_completed,
        pk_clearzone,
        pk_drawn,
        faceoff_wins,
        faceoff_losses,
        time_with_puck,
        players (
          id,
          user_id,
          team_id,
          users (
            id,
            gamer_tag
          ),
          teams (
            id,
            name
          )
        )
      `)
        .eq("season_id", selectedSeason)

      if (playerStatsError) throw playerStatsError

      // Fetch goalie stats for the selected season using direct queries
      const { data: goalieStatsData, error: goalieStatsError } = await supabase
        .from("goalie_season_stats")
        .select(`
        id,
        player_id,
        season_id,
        games_played,
        wins,
        losses,
        otl,
        saves,
        shots_against,
        goals_against,
        save_pct,
        gaa,
        shutouts,
        players (
          id,
          user_id,
          team_id,
          users (
            id,
            gamer_tag
          ),
          teams (
            id,
            name
          )
        )
      `)
        .eq("season_id", selectedSeason)

      if (goalieStatsError) throw goalieStatsError

      // Transform the data to match the expected format
      const formattedPlayerStats =
        playerStatsData?.map((stat) => ({
          id: stat.id,
          player_id: stat.player_id,
          player_name: stat.players?.users?.gamer_tag || "Unknown Player",
          team_id: stat.players?.team_id || null,
          team_name: stat.players?.teams?.name || null,
          position: stat.position,
          games_played: stat.games_played,
          goals: stat.goals,
          assists: stat.assists,
          points: stat.points,
          plus_minus: stat.plus_minus,
          pim: stat.pim,
          shots: stat.shots,
          shooting_pct: stat.shooting_pct,
          ppg: stat.ppg,
          shg: stat.shg,
          gwg: stat.gwg,
          hits: stat.hits,
          giveaways: stat.giveaways,
          takeaways: stat.takeaways,
          interceptions: stat.interceptions,
          pass_attempted: stat.pass_attempted,
          pass_completed: stat.pass_completed,
          pk_clearzone: stat.pk_clearzone,
          pk_drawn: stat.pk_drawn,
          faceoff_wins: stat.faceoff_wins,
          faceoff_losses: stat.faceoff_losses,
          time_with_puck: stat.time_with_puck,
        })) || []

      const formattedGoalieStats =
        goalieStatsData?.map((stat) => ({
          id: stat.id,
          player_id: stat.player_id,
          player_name: stat.players?.users?.gamer_tag || "Unknown Goalie",
          team_id: stat.players?.team_id || null,
          team_name: stat.players?.teams?.name || null,
          games_played: stat.games_played,
          wins: stat.wins,
          losses: stat.losses,
          otl: stat.otl,
          save_pct: stat.save_pct,
          gaa: stat.gaa,
          shutouts: stat.shutouts,
          saves: stat.saves,
          shots_against: stat.shots_against,
          goals_against: stat.goals_against,
        })) || []

      setPlayerStats(formattedPlayerStats)
      setGoalieStats(formattedGoalieStats)
    } catch (error: any) {
      console.error("Error fetching statistics:", error)
      toast({
        title: "Error loading statistics",
        description: error.message || "Failed to load statistics data.",
        variant: "destructive",
      })
      setPlayerStats([])
      setGoalieStats([])
    } finally {
      setLoading(false)
    }
  }

  // Replace the useEffect that calls fetchStats to use the updated function
  useEffect(() => {
    if (isAdmin && selectedSeason) {
      fetchStats()
    }
  }, [supabase, toast, selectedSeason, isAdmin])

  // Handle editing a player's stats
  const handleEditPlayer = (player: PlayerStat) => {
    setEditingPlayer(player)
    playerForm.reset({
      games_played: player.games_played,
      goals: player.goals,
      assists: player.assists,
      plus_minus: player.plus_minus,
      pim: player.pim,
      shots: player.shots,
      ppg: player.ppg,
      shg: player.shg,
      gwg: player.gwg,
      hits: player.hits,
      giveaways: player.giveaways,
      takeaways: player.takeaways,
      interceptions: player.interceptions,
      pass_attempted: player.pass_attempted,
      pass_completed: player.pass_completed,
      pk_clearzone: player.pk_clearzone,
      pk_drawn: player.pk_drawn,
      faceoff_wins: player.faceoff_wins,
      faceoff_losses: player.faceoff_losses,
      time_with_puck: player.time_with_puck,
    })
    setIsEditDialogOpen(true)
  }

  // Handle editing a goalie's stats
  const handleEditGoalie = (goalie: GoalieStat) => {
    setEditingGoalie(goalie)
    goalieForm.reset({
      games_played: goalie.games_played,
      wins: goalie.wins,
      losses: goalie.losses,
      otl: goalie.otl,
      saves: goalie.saves,
      shots_against: goalie.shots_against,
      goals_against: goalie.goals_against,
      shutouts: goalie.shutouts,
    })
    setIsGoalieEditDialogOpen(true)
  }

  // Save player stat changes
  const onSubmitPlayerStats = async (values: z.infer<typeof playerStatSchema>) => {
    if (!editingPlayer) return

    try {
      // Calculate points and shooting percentage
      const points = values.goals + values.assists
      const shooting_pct = values.shots > 0 ? (values.goals / values.shots) * 100 : 0

      // Update the player stats in the database
      const { error } = await supabase
        .from("player_season_stats")
        .update({
          games_played: values.games_played,
          goals: values.goals,
          assists: values.assists,
          points: points,
          plus_minus: values.plus_minus,
          pim: values.pim,
          shots: values.shots,
          shooting_pct: shooting_pct,
          ppg: values.ppg,
          shg: values.shg,
          gwg: values.gwg,
          hits: values.hits,
          giveaways: values.giveaways,
          takeaways: values.takeaways,
          interceptions: values.interceptions,
          pass_attempted: values.pass_attempted,
          pass_completed: values.pass_completed,
          pk_clearzone: values.pk_clearzone,
          pk_drawn: values.pk_drawn,
          faceoff_wins: values.faceoff_wins,
          faceoff_losses: values.faceoff_losses,
          time_with_puck: values.time_with_puck,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPlayer.id)

      if (error) throw error

      toast({
        title: "Stats updated",
        description: `Stats for ${editingPlayer.player_name} have been updated.`,
      })

      // Update the local state
      setPlayerStats((prev) =>
        prev.map((player) => {
          if (player.id === editingPlayer.id) {
            return {
              ...player,
              ...values,
              points: points,
              shooting_pct: shooting_pct,
            }
          }
          return player
        }),
      )

      setIsEditDialogOpen(false)
    } catch (error: any) {
      console.error("Error updating player stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update player stats.",
        variant: "destructive",
      })
    }
  }

  // Save goalie stat changes
  const onSubmitGoalieStats = async (values: z.infer<typeof goalieStatSchema>) => {
    if (!editingGoalie) return

    try {
      // Calculate save percentage and GAA
      const save_pct = values.shots_against > 0 ? values.saves / values.shots_against : 0
      const gaa = values.games_played > 0 ? values.goals_against / values.games_played : 0

      // Update the goalie stats in the database
      const { error } = await supabase
        .from("goalie_season_stats")
        .update({
          games_played: values.games_played,
          wins: values.wins,
          losses: values.losses,
          otl: values.otl,
          saves: values.saves,
          shots_against: values.shots_against,
          goals_against: values.goals_against,
          save_pct: save_pct,
          gaa: gaa,
          shutouts: values.shutouts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingGoalie.id)

      if (error) throw error

      toast({
        title: "Stats updated",
        description: `Stats for ${editingGoalie.player_name} have been updated.`,
      })

      // Update the local state
      setGoalieStats((prev) =>
        prev.map((goalie) => {
          if (goalie.id === editingGoalie.id) {
            return {
              ...goalie,
              ...values,
              save_pct: save_pct,
              gaa: gaa,
            }
          }
          return goalie
        }),
      )

      setIsGoalieEditDialogOpen(false)
    } catch (error: any) {
      console.error("Error updating goalie stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update goalie stats.",
        variant: "destructive",
      })
    }
  }

  // Handle file import
  const handleImport = async () => {
    if (!importFile || !selectedSeason) return

    setIsImporting(true)

    try {
      const fileReader = new FileReader()

      fileReader.onload = async (e) => {
        try {
          const csvData = e.target?.result as string
          const rows = csvData.split("\n")
          const headers = rows[0].split(",").map((header) => header.trim())

          // Process each row
          for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue

            const values = rows[i].split(",").map((value) => value.trim())
            const rowData: Record<string, any> = {}

            // Map CSV columns to database fields
            headers.forEach((header, index) => {
              rowData[header] = values[index]
            })

            if (importType === "player") {
              // Handle player stats import
              if (!rowData.player_id || !rowData.position) continue

              // Check if player stats already exist
              const { data: existingStats } = await supabase
                .from("player_season_stats")
                .select("id")
                .eq("player_id", rowData.player_id)
                .eq("season_id", selectedSeason)
                .eq("position", rowData.position)
                .single()

              // Calculate derived stats
              const goals = Number.parseInt(rowData.goals) || 0
              const assists = Number.parseInt(rowData.assists) || 0
              const points = goals + assists
              const shots = Number.parseInt(rowData.shots) || 0
              const shooting_pct = shots > 0 ? (goals / shots) * 100 : 0

              if (existingStats) {
                // Update existing stats
                await supabase
                  .from("player_season_stats")
                  .update({
                    games_played: Number.parseInt(rowData.games_played) || 0,
                    goals: goals,
                    assists: assists,
                    points: points,
                    plus_minus: Number.parseInt(rowData.plus_minus) || 0,
                    pim: Number.parseInt(rowData.pim) || 0,
                    shots: shots,
                    shooting_pct: shooting_pct,
                    ppg: Number.parseInt(rowData.ppg) || 0,
                    shg: Number.parseInt(rowData.shg) || 0,
                    gwg: Number.parseInt(rowData.gwg) || 0,
                    hits: Number.parseInt(rowData.hits) || 0,
                    giveaways: Number.parseInt(rowData.giveaways) || 0,
                    takeaways: Number.parseInt(rowData.takeaways) || 0,
                    interceptions: Number.parseInt(rowData.interceptions) || 0,
                    pass_attempted: Number.parseInt(rowData.pass_attempted) || 0,
                    pass_completed: Number.parseInt(rowData.pass_completed) || 0,
                    pk_clearzone: Number.parseInt(rowData.pk_clearzone) || 0,
                    pk_drawn: Number.parseInt(rowData.pk_drawn) || 0,
                    faceoff_wins: Number.parseInt(rowData.faceoff_wins) || 0,
                    faceoff_losses: Number.parseInt(rowData.faceoff_losses) || 0,
                    time_with_puck: Number.parseInt(rowData.time_with_puck) || 0,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existingStats.id)
              } else {
                // Insert new stats
                await supabase.from("player_season_stats").insert({
                  player_id: rowData.player_id,
                  season_id: selectedSeason,
                  position: rowData.position,
                  games_played: Number.parseInt(rowData.games_played) || 0,
                  goals: goals,
                  assists: assists,
                  points: points,
                  plus_minus: Number.parseInt(rowData.plus_minus) || 0,
                  pim: Number.parseInt(rowData.pim) || 0,
                  shots: shots,
                  shooting_pct: shooting_pct,
                  ppg: Number.parseInt(rowData.ppg) || 0,
                  shg: Number.parseInt(rowData.shg) || 0,
                  gwg: Number.parseInt(rowData.gwg) || 0,
                  hits: Number.parseInt(rowData.hits) || 0,
                  giveaways: Number.parseInt(rowData.giveaways) || 0,
                  takeaways: Number.parseInt(rowData.takeaways) || 0,
                  interceptions: Number.parseInt(rowData.interceptions) || 0,
                  pass_attempted: Number.parseInt(rowData.pass_attempted) || 0,
                  pass_completed: Number.parseInt(rowData.pass_completed) || 0,
                  pk_clearzone: Number.parseInt(rowData.pk_clearzone) || 0,
                  pk_drawn: Number.parseInt(rowData.pk_drawn) || 0,
                  faceoff_wins: Number.parseInt(rowData.faceoff_wins) || 0,
                  faceoff_losses: Number.parseInt(rowData.faceoff_losses) || 0,
                  time_with_puck: Number.parseInt(rowData.time_with_puck) || 0,
                })
              }
            } else {
              // Handle goalie stats import
              if (!rowData.player_id) continue

              // Check if goalie stats already exist
              const { data: existingStats } = await supabase
                .from("goalie_season_stats")
                .select("id")
                .eq("player_id", rowData.player_id)
                .eq("season_id", selectedSeason)
                .single()

              // Calculate derived stats
              const saves = Number.parseInt(rowData.saves) || 0
              const shots_against = Number.parseInt(rowData.shots_against) || 0
              const goals_against = Number.parseInt(rowData.goals_against) || 0
              const games_played = Number.parseInt(rowData.games_played) || 0
              const save_pct = shots_against > 0 ? saves / shots_against : 0
              const gaa = games_played > 0 ? goals_against / games_played : 0

              if (existingStats) {
                // Update existing stats
                await supabase
                  .from("goalie_season_stats")
                  .update({
                    games_played: games_played,
                    wins: Number.parseInt(rowData.wins) || 0,
                    losses: Number.parseInt(rowData.losses) || 0,
                    otl: Number.parseInt(rowData.otl) || 0,
                    saves: saves,
                    shots_against: shots_against,
                    goals_against: goals_against,
                    save_pct: save_pct,
                    gaa: gaa,
                    shutouts: Number.parseInt(rowData.shutouts) || 0,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existingStats.id)
              } else {
                // Insert new stats
                await supabase.from("goalie_season_stats").insert({
                  player_id: rowData.player_id,
                  season_id: selectedSeason,
                  games_played: games_played,
                  wins: Number.parseInt(rowData.wins) || 0,
                  losses: Number.parseInt(rowData.losses) || 0,
                  otl: Number.parseInt(rowData.otl) || 0,
                  saves: saves,
                  shots_against: shots_against,
                  goals_against: goals_against,
                  save_pct: save_pct,
                  gaa: gaa,
                  shutouts: Number.parseInt(rowData.shutouts) || 0,
                })
              }
            }
          }

          toast({
            title: "Import successful",
            description: `Successfully imported ${importType} statistics.`,
          })

          // Refresh the stats
          fetchStats()
          setIsImportDialogOpen(false)
          setImportFile(null)
        } catch (error: any) {
          console.error("Error processing CSV:", error)
          toast({
            title: "Import failed",
            description: error.message || "Failed to process the CSV file.",
            variant: "destructive",
          })
        }
      }

      fileReader.readAsText(importFile)
    } catch (error: any) {
      console.error("Error importing stats:", error)
      toast({
        title: "Import failed",
        description: error.message || "Failed to import statistics.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Add new player stats
  const onSubmitAddStats = async (values: z.infer<typeof playerStatSchema>) => {
    if (!selectedPlayerId || !selectedSeason) return

    try {
      // Calculate points and shooting percentage
      const points = values.goals + values.assists
      const shooting_pct = values.shots > 0 ? (values.goals / values.shots) * 100 : 0

      // Get player info
      const player = availablePlayers.find((p) => p.id === selectedPlayerId)
      if (!player) throw new Error("Player not found")

      // Check if stats already exist for this player and position
      const { data: existingStats } = await supabase
        .from("player_season_stats")
        .select("id")
        .eq("player_id", selectedPlayerId)
        .eq("season_id", selectedSeason)
        .eq("position", selectedPosition)
        .single()

      if (existingStats) {
        // Update existing stats
        const { error } = await supabase
          .from("player_season_stats")
          .update({
            games_played: values.games_played,
            goals: values.goals,
            assists: values.assists,
            points: points,
            plus_minus: values.plus_minus,
            pim: values.pim,
            shots: values.shots,
            shooting_pct: shooting_pct,
            ppg: values.ppg,
            shg: values.shg,
            gwg: values.gwg,
            hits: values.hits,
            giveaways: values.giveaways,
            takeaways: values.takeaways,
            interceptions: values.interceptions,
            pass_attempted: values.pass_attempted,
            pass_completed: values.pass_completed,
            pk_clearzone: values.pk_clearzone,
            pk_drawn: values.pk_drawn,
            faceoff_wins: values.faceoff_wins,
            faceoff_losses: values.faceoff_losses,
            time_with_puck: values.time_with_puck,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStats.id)

        if (error) throw error
      } else {
        // Insert new stats
        const { error } = await supabase.from("player_season_stats").insert({
          player_id: selectedPlayerId,
          season_id: selectedSeason,
          position: selectedPosition,
          games_played: values.games_played,
          goals: values.goals,
          assists: values.assists,
          points: points,
          plus_minus: values.plus_minus,
          pim: values.pim,
          shots: values.shots,
          shooting_pct: shooting_pct,
          ppg: values.ppg,
          shg: values.shg,
          gwg: values.gwg,
          hits: values.hits,
          giveaways: values.giveaways,
          takeaways: values.takeaways,
          interceptions: values.interceptions,
          pass_attempted: values.pass_attempted,
          pass_completed: values.pass_completed,
          pk_clearzone: values.pk_clearzone,
          pk_drawn: values.pk_drawn,
          faceoff_wins: values.faceoff_wins,
          faceoff_losses: values.faceoff_losses,
          time_with_puck: values.time_with_puck,
        })

        if (error) throw error
      }

      toast({
        title: "Stats added",
        description: `Stats for ${player.gamer_tag} have been added.`,
      })

      // Refresh the stats
      fetchStats()
      setIsAddStatDialogOpen(false)
    } catch (error: any) {
      console.error("Error adding player stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add player stats.",
        variant: "destructive",
      })
    }
  }

  // Function to refresh stats
  // Process player stats data
  const filteredPlayerStats = playerStats
    .filter(
      (player) =>
        player.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.team_name && player.team_name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .filter((player) => {
      if (positionFilter === "all") return true
      if (positionFilter === "offense") return ["C", "LW", "RW"].includes(player.position)
      if (positionFilter === "defense") return ["LD", "RD"].includes(player.position)
      return player.position === positionFilter
    })
    .sort((a, b) => {
      if (statFilter === "points") return b.points - a.points
      if (statFilter === "goals") return b.goals - a.goals
      if (statFilter === "assists") return b.assists - a.assists
      if (statFilter === "plusminus") return b.plus_minus - a.plus_minus
      return 0
    })

  // Filter goalie stats based on search query
  const filteredGoalieStats = goalieStats
    .filter(
      (goalie) =>
        goalie.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (goalie.team_name && goalie.team_name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => b.save_pct - a.save_pct)

  // Get the active season name
  const getSeasonName = (seasonId: number | null) => {
    if (!seasonId) return "Current Season"
    const season = seasons.find((s) => s.id === seasonId)
    return season ? season.name : "Current Season"
  }

  if (loading && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Statistics Management</h1>
          <p className="text-muted-foreground">Manage player and goalie statistics for the league</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={selectedSeason?.toString() || ""}
            onValueChange={(value) => setSelectedSeason(Number.parseInt(value))}
            disabled={loadingSeasons}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={loadingSeasons ? "Loading..." : "Select Season"} />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id.toString()}>
                  {season.name} {season.is_active ? "(Active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SyncStatsButton seasonId={selectedSeason || 0} onSuccess={fetchStats} />
          <SyncEaStatsButton />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search players or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />

          <Select defaultValue={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              <SelectItem value="offense">Offense (C, LW, RW)</SelectItem>
              <SelectItem value="defense">Defense (LD, RD)</SelectItem>
              <SelectItem value="goalie">Goalie (G)</SelectItem>
              <SelectItem value="C">Center (C)</SelectItem>
              <SelectItem value="LW">Left Wing (LW)</SelectItem>
              <SelectItem value="RW">Right Wing (RW)</SelectItem>
              <SelectItem value="LD">Left Defense (LD)</SelectItem>
              <SelectItem value="RD">Right Defense (RD)</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue={statFilter} onValueChange={setStatFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by stat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points">Points</SelectItem>
              <SelectItem value="goals">Goals</SelectItem>
              <SelectItem value="assists">Assists</SelectItem>
              <SelectItem value="plusminus">Plus/Minus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsAddStatDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Stats
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" /> Import Stats
          </Button>
          <Button variant="outline" onClick={() => fetchStats()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="players">Player Stats</TabsTrigger>
          <TabsTrigger value="goalies">Goalie Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>
                {getSeasonName(selectedSeason)} - Sorted by {statFilter === "points" ? "total points" : statFilter}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[500px]" />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">Pos</TableHead>
                        <TableHead className="text-center">GP</TableHead>
                        <TableHead className="text-center">G</TableHead>
                        <TableHead className="text-center">A</TableHead>
                        <TableHead className="text-center">PTS</TableHead>
                        <TableHead className="text-center">+/-</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayerStats.map((player, index) => (
                        <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{player.player_name}</TableCell>
                          <TableCell>{player.team_name || "Free Agent"}</TableCell>
                          <TableCell className="text-center">{player.position}</TableCell>
                          <TableCell className="text-center">{player.games_played}</TableCell>
                          <TableCell className="text-center font-medium">{player.goals}</TableCell>
                          <TableCell className="text-center font-medium">{player.assists}</TableCell>
                          <TableCell className="text-center font-bold">{player.points}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                player.plus_minus > 0 ? "text-green-500" : player.plus_minus < 0 ? "text-red-500" : ""
                              }
                            >
                              {player.plus_minus > 0 ? `+${player.plus_minus}` : player.plus_minus}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPlayer(player)}
                                title="Edit stats"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredPlayerStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-4">
                            No player stats found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goalies">
          <Card>
            <CardHeader>
              <CardTitle>Goalie Statistics</CardTitle>
              <CardDescription>{getSeasonName(selectedSeason)} - Sorted by save percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[500px]" />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Goalie</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">GP</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">OTL</TableHead>
                        <TableHead className="text-center">SV%</TableHead>
                        <TableHead className="text-center">GAA</TableHead>
                        <TableHead className="text-center">SO</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGoalieStats.map((goalie, index) => (
                        <TableRow key={goalie.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{goalie.player_name}</TableCell>
                          <TableCell>{goalie.team_name || "Free Agent"}</TableCell>
                          <TableCell className="text-center">{goalie.games_played}</TableCell>
                          <TableCell className="text-center font-medium">{goalie.wins}</TableCell>
                          <TableCell className="text-center">{goalie.losses}</TableCell>
                          <TableCell className="text-center">{goalie.otl}</TableCell>
                          <TableCell className="text-center font-bold">{goalie.save_pct.toFixed(3)}</TableCell>
                          <TableCell className="text-center">{goalie.gaa.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{goalie.shutouts}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditGoalie(goalie)}
                                title="Edit stats"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredGoalieStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-4">
                            No goalie stats found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Player Stats Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Player Statistics</DialogTitle>
            <DialogDescription>
              {editingPlayer?.player_name} - {editingPlayer?.position} - {getSeasonName(selectedSeason)}
            </DialogDescription>
          </DialogHeader>
          <Form {...playerForm}>
            <form onSubmit={playerForm.handleSubmit(onSubmitPlayerStats)} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FormField
                  control={playerForm.control}
                  name="games_played"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Games Played</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="assists"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assists</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="plus_minus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plus/Minus</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="pim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIM</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="shots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shots</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="ppg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PPG</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="shg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SHG</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="gwg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GWG</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="hits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hits</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="giveaways"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giveaways</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={playerForm.control}
                  name="takeaways"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Takeaways</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Goalie Stats Dialog */}
      <Dialog open={isGoalieEditDialogOpen} onOpenChange={setIsGoalieEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Goalie Statistics</DialogTitle>
            <DialogDescription>
              {editingGoalie?.player_name} - {getSeasonName(selectedSeason)}
            </DialogDescription>
          </DialogHeader>
          <Form {...goalieForm}>
            <form onSubmit={goalieForm.handleSubmit(onSubmitGoalieStats)} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FormField
                  control={goalieForm.control}
                  name="games_played"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Games Played</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={goalieForm.control}
                  name="wins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wins</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={goalieForm.control}
                  name="losses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Losses</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={goalieForm.control}
                  name="otl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OT Losses</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={goalieForm.control}
                  name="saves"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saves</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={goalieForm.control}
                  name="shots_against"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shots Against</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={goalieForm.control}
                  name="goals_against"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals Against</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={goalieForm.control}
                  name="shutouts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shutouts</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Stats Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Statistics</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import player or goalie statistics for {getSeasonName(selectedSeason)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Import Type</div>
                <Select value={importType} onValueChange={(value: "player" | "goalie") => setImportType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Player Stats</SelectItem>
                    <SelectItem value="goalie">Goalie Stats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="font-medium">CSV File</div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                {importType === "player" ? (
                  <p>
                    CSV must include: player_id, position, games_played, goals, assists, plus_minus, etc. Headers must
                    match database field names.
                  </p>
                ) : (
                  <p>
                    CSV must include: player_id, games_played, wins, losses, otl, saves, shots_against, goals_against,
                    shutouts. Headers must match database field names.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Player Stats Dialog */}
      <Dialog open={isAddStatDialogOpen} onOpenChange={setIsAddStatDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Player Statistics</DialogTitle>
            <DialogDescription>Add statistics for a player in {getSeasonName(selectedSeason)}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="font-medium">Player</div>
              <Select value={selectedPlayerId || ""} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.gamer_tag} {player.team_name ? `(${player.team_name})` : "(Free Agent)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Position</div>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">Center (C)</SelectItem>
                  <SelectItem value="LW">Left Wing (LW)</SelectItem>
                  <SelectItem value="RW">Right Wing (RW)</SelectItem>
                  <SelectItem value="LD">Left Defense (LD)</SelectItem>
                  <SelectItem value="RD">Right Defense (RD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Form {...addStatForm}>
            <form onSubmit={addStatForm.handleSubmit(onSubmitAddStats)} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FormField
                  control={addStatForm.control}
                  name="games_played"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Games Played</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStatForm.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStatForm.control}
                  name="assists"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assists</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStatForm.control}
                  name="plus_minus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plus/Minus</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStatForm.control}
                  name="pim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIM</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStatForm.control}
                  name="shots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shots</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!selectedPlayerId}>
                  Save Stats
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="bg-muted/30 p-4 rounded-lg mt-8">
        <h3 className="font-semibold mb-2">Statistics Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
          <div>
            <span className="font-medium">GP:</span> Games Played
          </div>
          <div>
            <span className="font-medium">G:</span> Goals
          </div>
          <div>
            <span className="font-medium">A:</span> Assists
          </div>
          <div>
            <span className="font-medium">PTS:</span> Points
          </div>
          <div>
            <span className="font-medium">+/-:</span> Plus/Minus
          </div>
          <div>
            <span className="font-medium">PIM:</span> Penalties in Minutes
          </div>
          <div>
            <span className="font-medium">S:</span> Shots
          </div>
          <div>
            <span className="font-medium">HIT:</span> Hits
          </div>
          <div>
            <span className="font-medium">GVA:</span> Giveaways
          </div>
          <div>
            <span className="font-medium">TKA:</span> Takeaways
          </div>
          <div>
            <span className="font-medium">INT:</span> Interceptions
          </div>
          <div>
            <span className="font-medium">PA:</span> Pass Attempted
          </div>
          <div>
            <span className="font-medium">PC:</span> Pass Completed
          </div>
          <div>
            <span className="font-medium">PPG:</span> Power Play Goals
          </div>
          <div>
            <span className="font-medium">SHG:</span> Short-handed Goals
          </div>
          <div>
            <span className="font-medium">GWG:</span> Game-winning Goals
          </div>
          <div>
            <span className="font-medium">PKC:</span> PK Clearzone
          </div>
          <div>
            <span className="font-medium">PKD:</span> PK Drawn
          </div>
          <div>
            <span className="font-medium">FOW:</span> Faceoff Wins
          </div>
          <div>
            <span className="font-medium">FOL:</span> Faceoff Losses
          </div>
          <div>
            <span className="font-medium">TWP:</span> Time With Puck
          </div>
          <div>
            <span className="font-medium">SV%:</span> Save Percentage
          </div>
          <div>
            <span className="font-medium">GAA:</span> Goals Against Average
          </div>
          <div>
            <span className="font-medium">SO:</span> Shutouts
          </div>
        </div>
      </div>
    </div>
  )
}
