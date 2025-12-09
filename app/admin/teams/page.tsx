"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus, Pencil, Trash2, Search, RefreshCw, AlertTriangle, Eye, EyeOff, Copy } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DirectColumnMigration } from "@/components/admin/direct-column-migration"
import { TeamsActiveMigration } from "@/components/admin/teams-active-migration"
import { Switch } from "@/components/ui/switch"
import { EditTeamStatsModal } from "@/components/admin/edit-team-stats-modal"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Season {
  id: string
  name: string
  is_active: boolean
  is_current: boolean
  number?: number // Season display number
}

// UPDATED: Team now reflects data coming from team_seasons + teams
interface Team {
  id: string // teams.id
  name: string
  logo_url: string | null

  // season-specific
  team_seasons.id: string // team_seasons.id
  season_id: string // UUID from team_seasons.season_id
  is_active: boolean

  wins: number
  losses: number
  otl: number
  goals_for: number
  goals_against: number
  points?: number
  games_played?: number

  ea_club_id?: string
  manual_override?: boolean
  powerplay_goals?: number
  powerplay_opportunities?: number
  penalty_kill_goals_against?: number
  penalty_kill_opportunities?: number
}

interface EATeam {
  clubId: string
  name: string
  regionId: number
  teamId: number
}

export default function AdminTeamsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false)
  const [selectedTeamsForBulk, setSelectedTeamsForBulk] = useState<number[]>([])
  const [bulkAssignSeason, setBulkAssignSeason] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(0)
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAddingTeam, setIsAddingTeam] = useState(false)

  // UPDATED: season_id is now a UUID (string), not a number
  const [teamForm, setTeamForm] = useState({
    name: "",
    logo_url: "",
    season_id: "", // season UUID
    ea_club_id: "",
    is_active: true,
  })

  const [isSearchingEA, setIsSearchingEA] = useState(false)
  const [eaSearchQuery, setEaSearchQuery] = useState("")
  const [eaSearchResults, setEaSearchResults] = useState<EATeam[]>([])
  const [showEaSearchDialog, setShowEaSearchDialog] = useState(false)
  const [hasEaColumn, setHasEaColumn] = useState(false)
  const [hasActiveColumn, setHasActiveColumn] = useState(false)
  const [hasManualOverrideColumn, setHasManualOverrideColumn] = useState(false)
  const [hasGamesPlayedColumn, setHasGamesPlayedColumn] = useState(false)
  const [hasPointsColumn, setHasPointsColumn] = useState(false)
  const [showShowInactive, setShowShowInactive] = useState(false) // Renamed from showInactive to avoid conflict
  const [isAddingColumns, setIsAddingColumns] = useState(false)

  useEffect(() => {
    async function checkAuthorizationAndLoadData() {
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
        setLoading(true)
        setLoadError(null)

        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError) {
          console.error("Error checking admin role:", adminRoleError)
          setLoadError(`Error checking admin role: ${adminRoleError.message}`)
          toast({
            title: "Authentication error",
            description: "Failed to verify admin permissions",
            variant: "destructive",
          })
          return
        }

        if (!adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)

        // Check if columns exist
        await checkEaColumnExists()
        await checkActiveColumnExists()
        await checkManualOverrideColumnExists()
        await checkGamesPlayedColumn()
        await checkPointsColumn()

        // Load seasons
        try {
          const { data: seasonsData, error: seasonsError } = await supabase
            .from("seasons")
            .select("*")
            .order("created_at", { ascending: true })

          if (seasonsError) {
            console.error("Error loading seasons:", seasonsError)
            setSeasons([{ id: "default-season-1", name: "Season 1", is_active: true, is_current: false, number: 1 }])
            setSelectedSeason("default-season-1")
          } else if (seasonsData) {
            // Get current season ID from system_settings
            const { data: currentSeasonData } = await supabase
              .from("system_settings")
              .select("value")
              .eq("key", "current_season")
              .single()

            const currentSeasonId = currentSeasonData?.value || null

            // Mark current season and set seasons
            const seasonsWithCurrent = seasonsData.map((season) => ({
              ...season,
              is_current: season.id === currentSeasonId,
            }))

            setSeasons(seasonsWithCurrent)

            // Set selected season to current season or first available
            if (currentSeasonId) {
              setSelectedSeason(currentSeasonId)
            } else {
              setSelectedSeason(seasonsData.length > 0 ? seasonsData[0].id : "default-season-1")
            }
          }
        } catch (error) {
          console.error("Error loading seasons:", error)
          setSeasons([{ id: "default-season-1", name: "Season 1", is_active: true, is_current: false, number: 1 }])
          setSelectedSeason("default-season-1")
        }

        // Load teams - will be done by effect that watches selectedSeason
      } catch (error: any) {
        console.error("Setup error:", error)
        setLoadError(`Setup error: ${error.message}`)
        toast({
          title: "Error",
          description: error.message || "An error occurred during setup",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthorizationAndLoadData()
  }, [supabase, session, toast, router])

  // Check if ea_club_id column exists
  const checkEaColumnExists = async () => {
    try {
      const { error } = await supabase.from("teams").select("ea_club_id").limit(1).maybeSingle()

      if (error) {
        if (error.message.includes("column") && error.message.includes("ea_club_id")) {
          setHasEaColumn(false)
        } else {
          console.error("Error checking ea_club_id column:", error)
        }
      } else {
        setHasEaColumn(true)
      }
    } catch (error) {
      console.error("Error checking ea_club_id column:", error)
      setHasEaColumn(false)
    }
  }

  // Check if is_active column exists
  const checkActiveColumnExists = async () => {
    try {
      const { error } = await supabase.from("teams").select("is_active").limit(1).maybeSingle()

      if (error) {
        if (error.message.includes("column") && error.message.includes("is_active")) {
          setHasActiveColumn(false)
        } else {
          console.error("Error checking is_active column:", error)
        }
      } else {
        setHasActiveColumn(true)
      }
    } catch (error) {
      console.error("Error checking is_active column:", error)
      setHasActiveColumn(false)
    }
  }

  // Check if manual_override column exists
  const checkManualOverrideColumnExists = async () => {
    try {
      const { error } = await supabase.from("teams").select("manual_override").limit(1).maybeSingle()

      if (error) {
        if (error.message.includes("column") && error.message.includes("manual_override")) {
          setHasManualOverrideColumn(false)
        } else {
          console.error("Error checking manual_override column:", error)
        }
      } else {
        setHasManualOverrideColumn(true)
      }
    } catch (error) {
      console.error("Error checking manual_override column:", error)
      setHasManualOverrideColumn(false)
    }
  }

  // Check if games_played column exists
  const checkGamesPlayedColumn = async () => {
    try {
      const { error } = await supabase.from("teams").select("games_played").limit(1).maybeSingle()

      if (error) {
        if (error.message.includes("column") && error.message.includes("games_played")) {
          setHasGamesPlayedColumn(false)
        } else {
          console.error("Error checking games_played column:", error)
        }
      } else {
        setHasGamesPlayedColumn(true)
      }
    } catch (error) {
      console.error("Error checking games_played column:", error)
      setHasGamesPlayedColumn(false)
    }
  }

  // Check if points column exists
  const checkPointsColumn = async () => {
    try {
      const { error } = await supabase.from("teams").select("points").limit(1).maybeSingle()

      if (error) {
        if (error.message.includes("column") && error.message.includes("points")) {
          setHasPointsColumn(false)
        } else {
          console.error("Error checking points column:", error)
        }
      } else {
        setHasPointsColumn(true)
      }
    } catch (error) {
      console.error("Error checking points column:", error)
      setHasPointsColumn(false)
    }
  }

  // Handle migration completion
  const handleMigrationComplete = async () => {
    await checkEaColumnExists()
    await checkActiveColumnExists()
    await checkManualOverrideColumnExists()
    await checkGamesPlayedColumn()
    await checkPointsColumn()
    setLastRefresh(Date.now())
  }

  // Add missing columns directly using exec_sql
  const addMissingColumns = async () => {
    try {
      setIsAddingColumns(true)

      const { error: execError } = await supabase.rpc("exec_sql", {
        sql: `
          ALTER TABLE teams ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;
          ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
        `,
      })

      if (execError) {
        console.error("Error adding columns with exec_sql:", execError)

        try {
          const { error: runError } = await supabase.rpc("run_sql", {
            sql: `
              ALTER TABLE teams ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;
              ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
            `,
          })

          if (runError) {
            throw runError
          }
        } catch (runError: any) {
          console.error("Error adding columns with run_sql:", runError)

          try {
            const response = await fetch("/api/admin/execute-sql", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sql: `
                  ALTER TABLE teams ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;
                  ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
                `,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || "Failed to add columns")
            }
          } catch (directError: any) {
            console.error("Error adding columns with direct SQL:", directError)
            throw directError
          }
        }
      }

      toast({
        title: "Columns added",
        description: "The required columns have been added to the teams table.",
      })

      await checkGamesPlayedColumn()
      await checkPointsColumn()
      setLastRefresh(Date.now())
    } catch (error: any) {
      console.error("Error adding columns:", error)
      toast({
        title: "Error adding columns",
        description: error.message || "Failed to add the required columns.",
        variant: "destructive",
      })
    } finally {
      setIsAddingColumns(false)
    }
  }

  // NOTE: left here in case you still use it elsewhere, but it's no longer used in loadTeams
  const getSeasonIdForTeams = async (seasonUuid: string): Promise<number | null> => {
    if (!supabase) return null

    const { data: seasonData, error } = await supabase
      .from("seasons")
      .select("name, number")
      .eq("id", seasonUuid)
      .single()

    if (error || !seasonData) {
      console.error("Error getting season name:", error)
      return null
    }

    return seasonData.number || null
  }

  // UPDATED: load teams from team_seasons + teams instead of teams.season_id
  const loadTeams = async (seasonId?: string) => {
    if (!supabase) {
      console.error("Supabase client not available")
      setLoadError("Database client not available")
      return
    }

    try {
      setIsLoadingStats(true)
      setLoadError(null)

      const season = seasonId || selectedSeason

      if (!season || season === "default-season-1") {
        setTeams([])
        setFilteredTeams([])
        setLoadError("No valid season selected")
        return
      }

      const { data, error } = await supabase
        .from("team_seasons")
        .select(
          `
          id,
          team_id,
          season_id,
          is_active,
          wins,
          losses,
          otl,
          goals_for,
          goals_against,
          points,
          games_played,
          powerplay_goals,
          powerplay_opportunities,
          penalty_kill_goals_against,
          penalty_kill_opportunities,
          manual_override,
          teams:team_id (
            id,
            name,
            logo_url,
            ea_club_id
          )
        `
        )
        .eq("season_id", season)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading team_seasons:", error)
        setLoadError(`Database error: ${error.message}`)
        toast({
          title: "Error loading teams",
          description: error.message || "Failed to load teams data.",
          variant: "destructive",
        })
        return
      }

      const teamsData: Team[] =
        (data || []).map((row: any) => {
          const wins = row.wins ?? 0
          const losses = row.losses ?? 0
          const otl = row.otl ?? 0
          const points = row.points ?? wins * 2 + otl

          return {
            id: row.teams.id,
            name: row.teams.name,
            logo_url: row.teams.logo_url,

            team_seasons.id: row.id,
            season_id: row.season_id,
            is_active: row.is_active ?? true,

            wins,
            losses,
            otl,
            goals_for: row.goals_for ?? 0,
            goals_against: row.goals_against ?? 0,
            points,
            games_played: row.games_played ?? wins + losses + otl,

            ea_club_id: row.teams.ea_club_id || undefined,
            manual_override: row.manual_override ?? false,
            powerplay_goals: row.powerplay_goals ?? 0,
            powerplay_opportunities: row.powerplay_opportunities ?? 0,
            penalty_kill_goals_against: row.penalty_kill_goals_against ?? 0,
            penalty_kill_opportunities: row.penalty_kill_opportunities ?? 0,
          }
        }) ?? []

      console.log("[admin/teams] Loaded team_seasons:", teamsData.length, "rows")
      setTeams(teamsData)
      applyFilters(teamsData, searchQuery, showShowInactive)
    } catch (error: any) {
      console.error("Error loading teams:", error)
      setLoadError(`Error: ${error.message}`)
      toast({
        title: "Error loading teams",
        description: error.message || "An unexpected error occurred while loading teams.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Apply filters to teams
  const applyFilters = (teamsData: Team[], query: string, includeInactive: boolean) => {
    let filtered = teamsData

    if (query.trim() !== "") {
      filtered = filtered.filter((team) => team.name.toLowerCase().includes(query.toLowerCase()))
    }

    if (hasActiveColumn && !includeInactive) {
      filtered = filtered.filter((team) => team.is_active !== false)
    }

    setFilteredTeams(filtered)
  }

  // Filter teams when search query or showInactive changes
  useEffect(() => {
    applyFilters(teams, searchQuery, showShowInactive)
  }, [searchQuery, showShowInactive, teams, hasActiveColumn])

  // Update filtered teams when selected season changes
  useEffect(() => {
    if (selectedSeason && !loading) {
      loadTeams(selectedSeason)
    }
  }, [selectedSeason, loading])

  // Reload teams when lastRefresh changes
  useEffect(() => {
    if (!loading && selectedSeason) {
      loadTeams(selectedSeason)
    }
  }, [lastRefresh])

  // UPDATED: use current season UUID for form
  const handleAddTeam = () => {
    setIsAddingTeam(true)
    setEditingTeam(null)
    setTeamForm({
      name: "",
      logo_url: "",
      season_id: selectedSeason || seasons.find((s) => s.is_current)?.id || seasons[0]?.id || "",
      ea_club_id: "",
      is_active: true,
    })
  }

  // UPDATED: editing uses team.season_id (UUID from team_seasons)
  const handleEditTeam = (team: Team) => {
    setIsAddingTeam(false)
    setEditingTeam(team)
    setTeamForm({
      name: team.name,
      logo_url: team.logo_url || "",
      season_id: team.season_id,
      ea_club_id: team.ea_club_id || "",
      is_active: team.is_active !== false,
    })
  }

  // UPDATED: save both teams and team_seasons, seasons via UUID
  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Team name is required",
        variant: "destructive",
      })
      return
    }

    const effectiveSeasonId = teamForm.season_id || selectedSeason

    if (!effectiveSeasonId || effectiveSeasonId === "default-season-1") {
      toast({
        title: "Validation Error",
        description: "Please select a valid season",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      // determine season number if we still need to keep teams.season_id in sync
      const seasonObj = seasons.find((s) => s.id === effectiveSeasonId)
      const seasonNumber = seasonObj?.number

      if (isAddingTeam) {
        // 1) insert into teams
        const teamInsert: any = {
          name: teamForm.name,
          logo_url: teamForm.logo_url || null,
        }

        if (typeof seasonNumber === "number") {
          teamInsert.season_id = seasonNumber
        }

        if (hasEaColumn) {
          teamInsert.ea_club_id = teamForm.ea_club_id || null
        }

        if (hasActiveColumn) {
          teamInsert.is_active = teamForm.is_active
        }

        const { data: newTeam, error: teamError } = await supabase.from("teams").insert(teamInsert).select().single()
        if (teamError) throw teamError

        // 2) insert into team_seasons for that team + season
        const { error: seasonError } = await supabase.from("team_seasons").insert({
          team_id: newTeam.id,
          season_id: effectiveSeasonId,
          is_active: teamForm.is_active,
          wins: 0,
          losses: 0,
          otl: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0,
          games_played: 0,
          powerplay_goals: 0,
          powerplay_opportunities: 0,
          penalty_kill_goals_against: 0,
          penalty_kill_opportunities: 0,
          total_retained_salary: 0,
          manual_override: false,
        })

        if (seasonError) throw seasonError

        toast({
          title: "Team added",
          description: "The team has been added successfully.",
        })
      } else if (editingTeam) {
        // Update teams base data
        const teamUpdate: any = {
          name: teamForm.name,
          logo_url: teamForm.logo_url || null,
        }

        if (typeof seasonNumber === "number") {
          teamUpdate.season_id = seasonNumber
        }

        if (hasEaColumn) {
          teamUpdate.ea_club_id = teamForm.ea_club_id || null
        }

        if (hasActiveColumn) {
          teamUpdate.is_active = teamForm.is_active
        }

        const { error: teamError } = await supabase.from("teams").update(teamUpdate).eq("id", editingTeam.id)
        if (teamError) throw teamError

        // Update team_seasons link (season + active)
        const { error: tsError } = await supabase
          .from("team_seasons")
          .update({
            is_active: teamForm.is_active,
            season_id: effectiveSeasonId,
          })
          .eq("id", editingTeam.team_seasons.id)

        if (tsError) throw tsError

        toast({
          title: "Team updated",
          description: "The team has been updated successfully.",
        })
      }

      setLastRefresh(Date.now())
      setIsAddingTeam(false)
      setEditingTeam(null)
    } catch (error: any) {
      console.error("Error saving team:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save team",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return
    }

    try {
      setIsSaving(true)

      const { error } = await supabase.from("teams").delete().eq("id", teamId)
      if (error) throw error

      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      })

      setLastRefresh(Date.now())
    } catch (error: any) {
      console.error("Error deleting team:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTeamActive = async (team: Team) => {
    try {
      const newActiveState = !team.is_active

      const { error } = await supabase
        .from("team_seasons")
        .update({ is_active: newActiveState })
        .eq("team_id", team.id)
        .eq("season_id", selectedSeason)

      if (error) throw error

      toast({
        title: `Team ${newActiveState ? "activated" : "deactivated"}`,
        description: `${team.name} is now ${newActiveState ? "active" : "inactive"} for this season.`,
      })

      setLastRefresh(Date.now())
    } catch (error: any) {
      console.error("Error toggling team active status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update team status",
        variant: "destructive",
      })
    }
  }

  const searchEATeams = async () => {
    if (!eaSearchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a team name to search",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSearchingEA(true)
      setEaSearchResults([])

      const formattedQuery = eaSearchQuery.replace(/\s+/g, "_")

      const response = await fetch(`/api/ea/search-teams?clubName=${formattedQuery}`)

      if (!response.ok) {
        throw new Error(`EA API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data && Array.isArray(data)) {
        setEaSearchResults(data)
      } else {
        setEaSearchResults([])
        toast({
          title: "No teams found",
          description: "No EA teams found with that name",
        })
      }
    } catch (error: any) {
      console.error("Error searching EA teams:", error)
      toast({
        title: "Search Error",
        description: error.message || "Failed to search EA teams",
        variant: "destructive",
      })
    } finally {
      setIsSearchingEA(false)
    }
  }

  const selectEATeam = (team: EATeam) => {
    setTeamForm({
      ...teamForm,
      ea_club_id: team.clubId,
    })
    setShowEaSearchDialog(false)
    toast({
      title: "EA Team Selected",
      description: `Selected ${team.name} (ID: ${team.clubId})`,
    })
  }

  const openEASearch = () => {
    if (!hasEaColumn) {
      toast({
        title: "Column Missing",
        description: "Please run the EA Club ID migration first",
        variant: "destructive",
      })
      return
    }

    setEaSearchQuery(teamForm.name.replace(/\s+/g, " "))
    setEaSearchResults([])
    setShowEaSearchDialog(true)
  }

  const viewEATeamStats = async (clubId: string) => {
    try {
      router.push(`/admin/ea-stats/${clubId}`)
    } catch (error: any) {
      console.error("Error viewing EA team stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to view EA team stats",
        variant: "destructive",
      })
    }
  }

  const handleRetry = () => {
    setLastRefresh(Date.now())
  }

  const handleStatsUpdated = async () => {
    setLastRefresh(Date.now())
  }

  // NOTE: Bulk assign is left as-is; it currently works on teams table.
  const handleBulkAssignSeason = async () => {
    if (!bulkAssignSeason || selectedTeamsForBulk.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select teams and a season",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const teamsToAssign = teams.filter((team) => selectedTeamsForBulk.includes(team.id as unknown as number))
      const newTeamData = teamsToAssign.map((team) => ({
        name: team.name,
        logo_url: team.logo_url,
        season_id: Number.parseInt(bulkAssignSeason),
        ea_club_id: team.ea_club_id,
        is_active: true,
        wins: 0,
        losses: 0,
        otl: 0,
        goals_for: 0,
        goals_against: 0,
      }))

      const { error } = await supabase.from("teams").insert(newTeamData)
      if (error) throw error

      toast({
        title: "Teams assigned",
        description: `${selectedTeamsForBulk.length} teams assigned to the selected season.`,
      })

      setSelectedTeamsForBulk([])
      setShowBulkAssignDialog(false)
      setLastRefresh(Date.now())
    } catch (error: any) {
      console.error("Error bulk assigning teams:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign teams to season",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyFromSeason = async (fromSeasonId: string, toSeasonId: string) => {
    try {
      setIsSaving(true)

      const { data: sourceTeamSeasons, error: fetchError } = await supabase
        .from("team_seasons")
        .select(`
          team_id,
          teams (
            id,
            name,
            logo_url,
            ea_club_id
          )
        `)
        .eq("season_id", fromSeasonId)

      if (fetchError) throw fetchError

      if (!sourceTeamSeasons || sourceTeamSeasons.length === 0) {
        toast({
          title: "No teams found",
          description: "No teams found in the selected season to copy.",
          variant: "destructive",
        })
        return
      }

      const { data: existingAssignments } = await supabase
        .from("team_seasons")
        .select("team_id")
        .eq("season_id", toSeasonId)

      const existingTeamIds = new Set(existingAssignments?.map((a) => a.team_id) || [])

      const newAssignments = sourceTeamSeasons
        .filter((ts) => !existingTeamIds.has(ts.team_id))
        .map((teamSeason) => ({
          team_id: teamSeason.team_id,
          season_id: toSeasonId,
          is_active: true,
        }))

      if (newAssignments.length === 0) {
        toast({
          title: "No new teams to copy",
          description: "All teams from the source season are already assigned to the target season.",
          variant: "default",
        })
        return
      }

      const { error } = await supabase.from("team_seasons").insert(newAssignments)
      if (error) throw error

      toast({
        title: "Teams copied",
        description: `${newAssignments.length} teams copied to the selected season.`,
      })

      setLastRefresh(Date.now())
    } catch (error: any) {
      console.error("Error copying teams:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to copy teams",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage teams for each season</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedSeason?.toString() || ""} onValueChange={(value) => setSelectedSeason(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season: Season) => (
                <SelectItem key={season.id} value={season.id}>
                  <div className="flex items-center gap-2">
                    {season.name}
                    {season.is_current && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />

          {hasActiveColumn && (
            <div className="flex items-center space-x-2">
              <Switch id="show-inactive" checked={showShowInactive} onCheckedChange={setShowShowInactive} />
              <Label htmlFor="show-inactive">Show inactive teams</Label>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAddTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Teams
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Copy from season:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {seasons
                .filter((s) => s.id !== selectedSeason)
                .map((season: Season) => (
                  <DropdownMenuItem
                    key={season.id}
                    onClick={() => selectedSeason && handleCopyFromSeason(season.id, selectedSeason)}
                  >
                    {season.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => setLastRefresh(Date.now())} disabled={isLoadingStats}>
            {isLoadingStats ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Stats
          </Button>
        </div>
      </div>

      {selectedSeason && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Managing: {seasons.find((s) => s.id === selectedSeason)?.name || `Season ${selectedSeason}`}
            </Badge>
            {seasons.find((s) => s.id === selectedSeason)?.is_current && (
              <Badge variant="default" className="text-sm">
                Current Season
              </Badge>
            )}
          </div>
        </div>
      )}

      {loadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription>
            {loadError}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasEaColumn && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>EA Club ID column needs to be added</AlertTitle>
          <AlertDescription>
            To use EA integration features, you need to add the EA Club ID column to the teams table.
            <div className="mt-2">
              <DirectColumnMigration onComplete={handleMigrationComplete} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasActiveColumn && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Team Active Status column needs to be added</AlertTitle>
          <AlertDescription>
            To manage team visibility, you need to add the is_active column to the teams table.
            <div className="mt-2">
              <TeamsActiveMigration onComplete={handleMigrationComplete} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasManualOverrideColumn && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Manual Override column needs to be added</AlertTitle>
          <AlertDescription>
            To manually edit team statistics, you need to add the manual_override column to the teams table.
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/admin/run-migration/manual-override", {
                      method: "POST",
                    })
                    if (!response.ok) {
                      throw new Error("Failed to run migration")
                    }
                    toast({
                      title: "Migration successful",
                      description: "The manual_override column has been added to the teams table.",
                    })
                    await checkManualOverrideColumnExists()
                    setLastRefresh(Date.now())
                  } catch (error) {
                    console.error("Error running migration:", error)
                    toast({
                      title: "Migration failed",
                      description: "Failed to add the manual_override column to the teams table.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Run Migration
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {(!hasGamesPlayedColumn || !hasPointsColumn) && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Team Stats Columns Need to be Added</AlertTitle>
          <AlertDescription>
            To properly track team statistics, you need to add the points and games_played columns to the teams table.
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={addMissingColumns} disabled={isAddingColumns}>
                {isAddingColumns ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Columns...
                  </>
                ) : (
                  "Add Required Columns"
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Manage teams in the league</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead className="text-center">Record</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Goal Diff</TableHead>
                  <TableHead className="text-center">Season</TableHead>
                  {hasEaColumn && <TableHead className="text-center">EA Club ID</TableHead>}
                  {hasActiveColumn && <TableHead className="text-center">Status</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={hasEaColumn && hasActiveColumn ? 8 : hasEaColumn || hasActiveColumn ? 7 : 6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      {loadError
                        ? "Failed to load teams. Please try again."
                        : searchQuery
                          ? "No teams found matching your search."
                          : "No teams have been created yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team) => {
                    // UPDATED: season name by UUID
                    const seasonName =
                      seasons.find((s: Season) => s.id === team.season_id)?.name || "Unknown season"

                    const wins = team.wins || 0
                    const losses = team.losses || 0
                    const otl = team.otl || 0
                    const points = team.points || wins * 2 + otl
                    const goalDiff = (team.goals_for || 0) - (team.goals_against || 0)

                    return (
                      <TableRow key={team.team_season_id} className={!team.is_active ? "opacity-60" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {team.name}
                            {team.manual_override && (
                              <Badge variant="outline" className="text-xs">
                                Manual
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {wins}-{losses}-{otl}
                        </TableCell>
                        <TableCell className="text-center">{points}</TableCell>
                        <TableCell className="text-center">{goalDiff}</TableCell>
                        <TableCell className="text-center">{seasonName}</TableCell>
                        {hasEaColumn && (
                          <TableCell className="text-center">
                            {team.ea_club_id ? (
                              <div className="flex items-center justify-center gap-2">
                                <span>{team.ea_club_id}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewEATeamStats(team.ea_club_id!)}
                                  title="View EA Stats"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not set</span>
                            )}
                          </TableCell>
                        )}
                        {hasActiveColumn && (
                          <TableCell className="text-center">
                            <Button
                              variant={team.is_active ? "outline" : "secondary"}
                              size="sm"
                              onClick={() => toggleTeamActive(team)}
                              className="flex items-center gap-1"
                            >
                              {team.is_active ? (
                                <>
                                  <Eye className="h-3 w-3" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  <span>Inactive</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasManualOverrideColumn && (
                              <EditTeamStatsModal
                                team={{
                                  id: team.id,
                                  name: team.name,
                                  logo_url: team.logo_url,
                                  wins: wins,
                                  losses: losses,
                                  otl: otl,
                                  games_played: team.games_played || wins + losses + otl,
                                  points: points,
                                  goals_for: team.goals_for || 0,
                                  goals_against: team.goals_against || 0,
                                  goal_differential: goalDiff,
                                  powerplay_goals: team.powerplay_goals,
                                  powerplay_opportunities: team.powerplay_opportunities,
                                  powerplay_percentage: team.powerplay_opportunities
                                    ? (team.powerplay_goals! / team.powerplay_opportunities!) * 100
                                    : 0,
                                  penalty_kill_goals_against: team.penalty_kill_goals_against,
                                  penalty_kill_opportunities: team.penalty_kill_opportunities,
                                  penalty_kill_percentage: team.penalty_kill_opportunities
                                    ? ((team.penalty_kill_opportunities! - team.penalty_kill_goals_against!) /
                                        team.penalty_kill_opportunities!) *
                                      100
                                    : 0,
                                  manual_override: team.manual_override,
                                }}
                                onStatsUpdated={handleStatsUpdated}
                              />
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isAddingTeam || editingTeam !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingTeam(false)
            setEditingTeam(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddingTeam ? "Add New Team" : "Edit Team"}</DialogTitle>
            <DialogDescription>
              {isAddingTeam ? "Create a new team for the league." : "Update the details for this team."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g. Toronto Maple Leafs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL (optional)</Label>
              <Input
                id="logo-url"
                value={teamForm.logo_url}
                onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* UPDATED: Season select uses season UUIDs */}
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select
                value={teamForm.season_id}
                onValueChange={(value) => setTeamForm({ ...teamForm, season_id: value })}
              >
                <SelectTrigger id="season">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasEaColumn && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="ea-club-id">EA Club ID</Label>
                  <Button type="button" variant="outline" size="sm" onClick={openEASearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search EA Teams
                  </Button>
                </div>
                <Input
                  id="ea-club-id"
                  value={teamForm.ea_club_id}
                  onChange={(e) => setTeamForm({ ...teamForm, ea_club_id: e.target.value })}
                  placeholder="e.g. 204949"
                />
                <p className="text-sm text-muted-foreground">
                  EA Club ID is used to fetch stats and match data from EA Sports NHL.
                </p>
              </div>
            )}

            {hasActiveColumn && (
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="team-active"
                  checked={teamForm.is_active}
                  onCheckedChange={(checked) => setTeamForm({ ...teamForm, is_active: checked })}
                />
                <Label htmlFor="team-active">Team is active</Label>
                <p className="text-sm text-muted-foreground ml-2">
                  Inactive teams won't appear on the public teams and standings pages.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingTeam(false)
                setEditingTeam(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTeam} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAddingTeam ? "Add Team" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEaSearchDialog} onOpenChange={setShowEaSearchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search EA Teams</DialogTitle>
            <DialogDescription>Search for teams in EA Sports NHL to link with your MGHL team.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="ea-search" className="sr-only">
                EA Team Name
              </Label>
              <Input
                id="ea-search"
                placeholder="Enter EA team name..."
                value={eaSearchQuery}
                onChange={(e) => setEaSearchQuery(e.target.value)}
              />
            </div>
            <Button type="button" onClick={searchEATeams} disabled={isSearchingEA}>
              {isSearchingEA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {eaSearchResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead className="text-center">Club ID</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eaSearchResults.map((team) => (
                    <TableRow key={team.clubId}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell className="text-center">{team.clubId}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => selectEATeam(team)}>
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {isSearchingEA ? "Searching..." : "No results. Search for a team name."}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setShowEaSearchDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
