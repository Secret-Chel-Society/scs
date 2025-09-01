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
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Users,
  Trophy,
  Settings,
  Database,
  Shield,
  Activity,
  MapPin,
  Target
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DirectColumnMigration } from "@/components/admin/direct-column-migration"
import { TeamsActiveMigration } from "@/components/admin/teams-active-migration"
import { Switch } from "@/components/ui/switch"
import { EditTeamStatsModal } from "@/components/admin/edit-team-stats-modal"
import { Badge } from "@/components/ui/badge"
import { getCurrentSeasonId } from "@/lib/team-utils"
import { CONFERENCES, type ConferenceType } from "@/lib/standings-calculator"

interface Season {
  id: number
  name: string
  is_active: boolean
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
  points?: number
  games_played?: number
  season_id: number
  ea_club_id?: string
  is_active: boolean
  manual_override?: boolean
  powerplay_goals?: number
  powerplay_opportunities?: number
  penalty_kill_goals_against?: number
  penalty_kill_opportunities?: number
  conference?: string
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
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamForm, setTeamForm] = useState({
    name: "",
    logo_url: "",
    season_id: 1,
    ea_club_id: "",
    is_active: true,
    conference: "" as ConferenceType | "",
  })
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [conferenceFilter, setConferenceFilter] = useState<string>("all")
  const [showConferenceManagement, setShowConferenceManagement] = useState(false)
  const [isUpdatingConference, setIsUpdatingConference] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSearchingEA, setIsSearchingEA] = useState(false)
  const [eaSearchQuery, setEaSearchQuery] = useState("")
  const [eaSearchResults, setEaSearchResults] = useState<EATeam[]>([])
  const [showEaSearchDialog, setShowEaSearchDialog] = useState(false)
  const [hasEaColumn, setHasEaColumn] = useState(false)
  const [hasActiveColumn, setHasActiveColumn] = useState(false)
  const [hasManualOverrideColumn, setHasManualOverrideColumn] = useState(false)
  const [hasGamesPlayedColumn, setHasGamesPlayedColumn] = useState(false)
  const [hasPointsColumn, setHasPointsColumn] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [loadError, setLoadError] = useState<string | null>(null)
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
            .from("system_settings")
            .select("value")
            .eq("key", "seasons")
            .single()

          if (seasonsError) {
            console.error("Error loading seasons:", seasonsError)
            // Use default season if can't load from database
            setSeasons([{ id: 1, name: "Season 1", is_active: true }])
            setSelectedSeason(1)
          } else if (seasonsData) {
            const seasonsArray = seasonsData.value || []
            setSeasons(seasonsArray)

            // Get current season
            try {
              const currentSeason = await getCurrentSeasonId()
              setSelectedSeason(currentSeason)
            } catch (error) {
              console.error("Error getting current season:", error)
              // Use first season from the list or default to 1
              setSelectedSeason(seasonsArray.length > 0 ? seasonsArray[0].id : 1)
            }
          }
        } catch (error) {
          console.error("Error loading seasons:", error)
          // Fallback to default season
          setSeasons([{ id: 1, name: "Season 1", is_active: true }])
          setSelectedSeason(1)
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
      // Try to query a team with ea_club_id to see if the column exists
      const { data, error } = await supabase.from("teams").select("ea_club_id").limit(1).maybeSingle()

      if (error) {
        // If there's an error about the column not existing, set hasEaColumn to false
        if (error.message.includes("column") && error.message.includes("ea_club_id")) {
          setHasEaColumn(false)
        } else {
          // For other errors, log but don't assume the column doesn't exist
          console.error("Error checking ea_club_id column:", error)
        }
      } else {
        // If no error, the column exists
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
      // Try to query a team with is_active to see if the column exists
      const { data, error } = await supabase.from("teams").select("is_active").limit(1).maybeSingle()

      if (error) {
        // If there's an error about the column not existing, set hasActiveColumn to false
        if (error.message.includes("column") && error.message.includes("is_active")) {
          setHasActiveColumn(false)
        } else {
          // For other errors, log but don't assume the column doesn't exist
          console.error("Error checking is_active column:", error)
        }
      } else {
        // If no error, the column exists
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
      // Try to query a team with manual_override to see if the column exists
      const { data, error } = await supabase.from("teams").select("manual_override").limit(1).maybeSingle()

      if (error) {
        // If there's an error about the column not existing, set hasManualOverrideColumn to false
        if (error.message.includes("column") && error.message.includes("manual_override")) {
          setHasManualOverrideColumn(false)
        } else {
          // For other errors, log but don't assume the column doesn't exist
          console.error("Error checking manual_override column:", error)
        }
      } else {
        // If no error, the column exists
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
      // Try to query a team with games_played to see if the column exists
      const { data, error } = await supabase.from("teams").select("games_played").limit(1).maybeSingle()

      if (error) {
        // If there's an error about the column not existing, set hasGamesPlayedColumn to false
        if (error.message.includes("column") && error.message.includes("games_played")) {
          setHasGamesPlayedColumn(false)
        } else {
          // For other errors, log but don't assume the column doesn't exist
          console.error("Error checking games_played column:", error)
        }
      } else {
        // If no error, the column exists
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
      // Try to query a team with points to see if the column exists
      const { data, error } = await supabase.from("teams").select("points").limit(1).maybeSingle()

      if (error) {
        // If there's an error about the column not existing, set hasPointsColumn to false
        if (error.message.includes("column") && error.message.includes("points")) {
          setHasPointsColumn(false)
        } else {
          // For other errors, log but don't assume the column doesn't exist
          console.error("Error checking points column:", error)
        }
      } else {
        // If no error, the column exists
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
    setLastRefresh(Date.now()) // This will trigger a reload of teams data
  }

  // Update team conference
  const updateTeamConference = async (teamId: string, conference: ConferenceType) => {
    try {
      setIsUpdatingConference(true)
      
      const { error } = await supabase
        .from("teams")
        .update({ conference })
        .eq("id", teamId)

      if (error) throw error

      // Update local state
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId ? { ...team, conference } : team
        )
      )

      toast({
        title: "Conference Updated",
        description: `Team conference updated to ${conference}`,
      })
    } catch (error: any) {
      console.error("Error updating conference:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update conference",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingConference(false)
    }
  }

  // Get conference statistics
  const getConferenceStats = () => {
    const easternTeams = teams.filter(team => team.conference === CONFERENCES.EASTERN_ELITES)
    const westernTeams = teams.filter(team => team.conference === CONFERENCES.WESTERN_WARRIORS)
    const unassignedTeams = teams.filter(team => !team.conference || team.conference === "")

    return {
      eastern: easternTeams.length,
      western: westernTeams.length,
      unassigned: unassignedTeams.length,
      total: teams.length
    }
  }

  // Add missing columns directly using exec_sql
  const addMissingColumns = async () => {
    try {
      setIsAddingColumns(true)

      // Use the exec_sql function to add the columns
      const { error: execError } = await supabase.rpc("exec_sql", {
        sql: `
          ALTER TABLE teams ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;
          ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
        `,
      })

      if (execError) {
        console.error("Error adding columns with exec_sql:", execError)

        // Try with run_sql as a fallback
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

          // Final fallback: try direct SQL execution
          try {
            // Try to execute the SQL directly through a custom endpoint
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

      // Refresh column status
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

  // Load teams based on selected season
  const loadTeams = async (seasonId?: number) => {
    if (!supabase) {
      console.error("Supabase client not available")
      setLoadError("Database client not available")
      return
    }

    try {
      setIsLoadingStats(true)
      setLoadError(null)
      const season = seasonId || selectedSeason || 1

      // Use standard Supabase query instead of exec_sql
      const { data, error } = await supabase.from("teams").select("*").eq("season_id", season).order("name")

      if (error) {
        console.error("Error loading teams:", error)
        setLoadError(`Database error: ${error.message}`)
        toast({
          title: "Error loading teams",
          description: error.message || "Failed to load teams data.",
          variant: "destructive",
        })
        return
      }

      console.log("Loaded teams from database:", data?.length || 0, "teams")

      // Set teams and apply filters
      setTeams(data || [])
      applyFilters(data || [], searchQuery, showInactive)
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

    // Filter by search query
    if (query.trim() !== "") {
      filtered = filtered.filter((team) => team.name.toLowerCase().includes(query.toLowerCase()))
    }

    // Filter by active status if the column exists
    if (hasActiveColumn && !includeInactive) {
      filtered = filtered.filter((team) => team.is_active !== false)
    }

    setFilteredTeams(filtered)
  }

  // Filter teams when search query or showInactive changes
  useEffect(() => {
    applyFilters(teams, searchQuery, showInactive)
  }, [searchQuery, showInactive, teams, hasActiveColumn])

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

  const handleAddTeam = () => {
    setIsAddingTeam(true)
    setEditingTeam(null)
    setTeamForm({
      name: "",
      logo_url: "",
      season_id: selectedSeason || 1,
      ea_club_id: "",
      is_active: true,
      conference: "",
    })
  }

  const handleEditTeam = (team: Team) => {
    setIsAddingTeam(false)
    setEditingTeam(team)
    setTeamForm({
      name: team.name,
      logo_url: team.logo_url || "",
      season_id: team.season_id,
      ea_club_id: team.ea_club_id || "",
      is_active: team.is_active !== false, // Default to true if undefined
      conference: team.conference || "",
    })
  }

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Team name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const teamData: any = {
        name: teamForm.name,
        logo_url: teamForm.logo_url || null,
        season_id: teamForm.season_id,
      }

      // Only include ea_club_id if the column exists
      if (hasEaColumn) {
        teamData.ea_club_id = teamForm.ea_club_id || null
      }

      // Only include is_active if the column exists
      if (hasActiveColumn) {
        teamData.is_active = teamForm.is_active
      }

      if (isAddingTeam) {
        // Add default values for new teams
        teamData.wins = 0
        teamData.losses = 0
        teamData.otl = 0
        teamData.goals_for = 0
        teamData.goals_against = 0

        // Add new team using standard Supabase insert
        const { error } = await supabase.from("teams").insert(teamData)

        if (error) throw error

        toast({
          title: "Team added",
          description: "The team has been added successfully.",
        })
      } else if (editingTeam) {
        // Update existing team using standard Supabase update
        const { error } = await supabase.from("teams").update(teamData).eq("id", editingTeam.id)

        if (error) throw error

        toast({
          title: "Team updated",
          description: "The team has been updated successfully.",
        })
      }

      // Reload teams
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

      // Delete team
      const { error } = await supabase.from("teams").delete().eq("id", teamId)

      if (error) throw error

      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      })

      // Reload teams
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

      const { error } = await supabase.from("teams").update({ is_active: newActiveState }).eq("id", team.id)

      if (error) throw error

      toast({
        title: `Team ${newActiveState ? "activated" : "deactivated"}`,
        description: `${team.name} is now ${newActiveState ? "active" : "inactive"}.`,
      })

      // Reload teams
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

      // Format the search query for EA API (replace spaces with underscores)
      const formattedQuery = eaSearchQuery.replace(/\s+/g, "_")

      // Call EA API to search for teams
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
      // Navigate to a page that will display EA team stats
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
    // Force a refresh of the data
    setLastRefresh(Date.now())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading team management...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Team Management
              </h1>
              <p className="text-white/70 mt-2">Manage teams, statistics, and league configuration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {loadError && (
          <Card className="mb-6 bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-400 mb-2">Error loading data</h3>
                  <p className="text-red-300/80 mb-3">{loadError}</p>
                  <Button variant="outline" size="sm" onClick={handleRetry} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conference Management Section */}
        <Card className="mb-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-200 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Conference Management
            </CardTitle>
            <CardDescription className="text-green-300/80">
              Manage team conferences for the Eastern Elites and Western Warriors divisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-200">{getConferenceStats().eastern}</div>
                <div className="text-sm text-blue-300">Eastern Elites</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-200">{getConferenceStats().western}</div>
                <div className="text-sm text-purple-300">Western Warriors</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-400/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-200">{getConferenceStats().unassigned}</div>
                <div className="text-sm text-amber-300">Unassigned</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Conference Assignment</h4>
                  <p className="text-white/70 text-sm">
                    Assign teams to conferences. Top 4 teams from each conference qualify for playoffs.
                  </p>
                </div>
                <Button
                  onClick={() => setShowConferenceManagement(!showConferenceManagement)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {showConferenceManagement ? "Hide" : "Show"} Conference Management
                </Button>
              </div>

              {showConferenceManagement && (
                <div className="space-y-4">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{team.name}</span>
                        {team.conference && (
                          <Badge 
                            variant="outline" 
                            className={team.conference === CONFERENCES.EASTERN_ELITES 
                              ? "border-blue-500/30 text-blue-400" 
                              : "border-purple-500/30 text-purple-400"
                            }
                          >
                            {team.conference}
                          </Badge>
                        )}
                      </div>
                      <Select
                        value={team.conference || ""}
                        onValueChange={(value) => updateTeamConference(team.id, value as ConferenceType)}
                        disabled={isUpdatingConference}
                      >
                        <SelectTrigger className="w-48 bg-slate-800/50 border-white/20 text-white">
                          <SelectValue placeholder="Select conference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CONFERENCES.EASTERN_ELITES}>Eastern Elites</SelectItem>
                          <SelectItem value={CONFERENCES.WESTERN_WARRIORS}>Western Warriors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Migration Alerts */}
        {!hasEaColumn && (
          <Card className="mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-400 mb-2">EA Club ID Column Required</h3>
                  <p className="text-amber-300/80 mb-3">To use EA integration features, you need to add the EA Club ID column to the teams table.</p>
                  <DirectColumnMigration onComplete={handleMigrationComplete} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasActiveColumn && (
          <Card className="mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-400 mb-2">Team Active Status Column Required</h3>
                  <p className="text-amber-300/80 mb-3">To manage team visibility, you need to add the is_active column to the teams table.</p>
                  <TeamsActiveMigration onComplete={handleMigrationComplete} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasManualOverrideColumn && (
          <Card className="mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-400 mb-2">Manual Override Column Required</h3>
                  <p className="text-amber-300/80 mb-3">To manually edit team statistics, you need to add the manual_override column to the teams table.</p>
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
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    Run Migration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(!hasGamesPlayedColumn || !hasPointsColumn) && (
          <Card className="mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Trophy className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-400 mb-2">Team Stats Columns Required</h3>
                  <p className="text-amber-300/80 mb-3">To properly track team statistics, you need to add the points and games_played columns to the teams table.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addMissingColumns} 
                    disabled={isAddingColumns}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls Section */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Select value={selectedSeason?.toString() || ""} onValueChange={(value) => setSelectedSeason(Number(value))}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {seasons.map((season: Season) => (
                      <SelectItem key={season.id} value={season.id.toString()} className="text-white hover:bg-slate-700">
                        {season.name} {season.is_active ? "(Active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />

                {hasActiveColumn && (
                  <div className="flex items-center space-x-2">
                    <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                    <Label htmlFor="show-inactive" className="text-white/70">Show inactive teams</Label>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleAddTeam}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLastRefresh(Date.now())} 
                  disabled={isLoadingStats}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Stats
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Teams
            </CardTitle>
            <CardDescription className="text-white/70">Manage teams in the league</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/20 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-white/70">Team Name</TableHead>
                    <TableHead className="text-center text-white/70">Record</TableHead>
                    <TableHead className="text-center text-white/70">Points</TableHead>
                    <TableHead className="text-center text-white/70">Goal Diff</TableHead>
                    <TableHead className="text-center text-white/70">Season</TableHead>
                    {hasEaColumn && <TableHead className="text-center text-white/70">EA Club ID</TableHead>}
                    {hasActiveColumn && <TableHead className="text-center text-white/70">Status</TableHead>}
                    <TableHead className="text-right text-white/70">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.length === 0 ? (
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableCell
                        colSpan={hasEaColumn && hasActiveColumn ? 8 : hasEaColumn || hasActiveColumn ? 7 : 6}
                        className="text-center py-6 text-white/50"
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
                      const seasonName =
                        seasons.find((s: Season) => s.id === team.season_id)?.name || `Season ${team.season_id}`

                      const wins = team.wins || 0
                      const losses = team.losses || 0
                      const otl = team.otl || 0
                      const points = team.points || wins * 2 + otl
                      const goalDiff = (team.goals_for || 0) - (team.goals_against || 0)

                      return (
                        <TableRow key={team.id} className={`border-white/20 hover:bg-white/5 transition-all duration-200 ${!team.is_active ? "opacity-60" : ""}`}>
                          <TableCell className="font-medium text-white">
                            <div className="flex items-center gap-2">
                              {team.name}
                              {team.manual_override && (
                                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                                  Manual
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-white">{wins}-{losses}-{otl}</TableCell>
                          <TableCell className="text-center text-white">{points}</TableCell>
                          <TableCell className="text-center text-white">{goalDiff}</TableCell>
                          <TableCell className="text-center text-white">{seasonName}</TableCell>
                          {hasEaColumn && (
                            <TableCell className="text-center">
                              {team.ea_club_id ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-white">{team.ea_club_id}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => viewEATeamStats(team.ea_club_id!)}
                                    title="View EA Stats"
                                    className="text-white/70 hover:text-white hover:bg-white/10"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-white/50">Not set</span>
                              )}
                            </TableCell>
                          )}
                          {hasActiveColumn && (
                            <TableCell className="text-center">
                              <Button
                                variant={team.is_active ? "outline" : "secondary"}
                                size="sm"
                                onClick={() => toggleTeamActive(team)}
                                className={`flex items-center gap-1 ${
                                  team.is_active 
                                    ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                }`}
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
                                      ? (team.powerplay_goals / team.powerplay_opportunities) * 100
                                      : 0,
                                    penalty_kill_goals_against: team.penalty_kill_goals_against,
                                    penalty_kill_opportunities: team.penalty_kill_opportunities,
                                    penalty_kill_percentage: team.penalty_kill_opportunities
                                      ? ((team.penalty_kill_opportunities - team.penalty_kill_goals_against) /
                                          team.penalty_kill_opportunities) *
                                        100
                                      : 0,
                                    manual_override: team.manual_override,
                                  }}
                                  onStatsUpdated={handleStatsUpdated}
                                />
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditTeam(team)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteTeam(team.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
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

        {/* Add/Edit Team Dialog */}
        <Dialog
          open={isAddingTeam || editingTeam !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddingTeam(false)
              setEditingTeam(null)
            }
          }}
        >
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">{isAddingTeam ? "Add New Team" : "Edit Team"}</DialogTitle>
              <DialogDescription className="text-white/70">
                {isAddingTeam ? "Create a new team for the league." : "Update the details for this team."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team-name" className="text-white">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="e.g. Toronto Maple Leafs"
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url" className="text-white">Logo URL (optional)</Label>
                <Input
                  id="logo-url"
                  value={teamForm.logo_url}
                  onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season" className="text-white">Season</Label>
                <Select
                  value={teamForm.season_id.toString()}
                  onValueChange={(value) => setTeamForm({ ...teamForm, season_id: Number(value) })}
                >
                  <SelectTrigger id="season" className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {seasons.map((season: Season) => (
                      <SelectItem key={season.id} value={season.id.toString()} className="text-white hover:bg-slate-700">
                        {season.name} {season.is_active ? "(Active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasEaColumn && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="ea-club-id" className="text-white">EA Club ID</Label>
                    <Button type="button" variant="outline" size="sm" onClick={openEASearch} className="border-white/20 text-white hover:bg-white/10">
                      <Search className="h-4 w-4 mr-2" />
                      Search EA Teams
                    </Button>
                  </div>
                  <Input
                    id="ea-club-id"
                    value={teamForm.ea_club_id}
                    onChange={(e) => setTeamForm({ ...teamForm, ea_club_id: e.target.value })}
                    placeholder="e.g. 204949"
                    className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  />
                  <p className="text-sm text-white/50">
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
                  <Label htmlFor="team-active" className="text-white">Team is active</Label>
                  <p className="text-sm text-white/50 ml-2">
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
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTeam} 
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isAddingTeam ? "Add Team" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EA Search Dialog */}
        <Dialog open={showEaSearchDialog} onOpenChange={setShowEaSearchDialog}>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Search EA Teams</DialogTitle>
              <DialogDescription className="text-white/70">Search for teams in EA Sports NHL to link with your SCS team.</DialogDescription>
            </DialogHeader>

            <div className="flex items-center space-x-2 py-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="ea-search" className="sr-only text-white">
                  EA Team Name
                </Label>
                <Input
                  id="ea-search"
                  placeholder="Enter EA team name..."
                  value={eaSearchQuery}
                  onChange={(e) => setEaSearchQuery(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <Button 
                type="button" 
                onClick={searchEATeams} 
                disabled={isSearchingEA}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {isSearchingEA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-white/20 rounded-md">
              {eaSearchResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-white/70">Team Name</TableHead>
                      <TableHead className="text-center text-white/70">Club ID</TableHead>
                      <TableHead className="text-right text-white/70">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eaSearchResults.map((team) => (
                      <TableRow key={team.clubId} className="border-white/20 hover:bg-white/5">
                        <TableCell className="text-white">{team.name}</TableCell>
                        <TableCell className="text-center text-white">{team.clubId}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => selectEATeam(team)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-4 text-center text-white/50">
                  {isSearchingEA ? "Searching..." : "No results. Search for a team name."}
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-start">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowEaSearchDialog(false)}
                className="bg-slate-700 text-white hover:bg-slate-600"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
