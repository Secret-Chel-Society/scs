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
import { Loader2, Plus, Pencil, Trash2, Search, RefreshCw, AlertTriangle, Eye, EyeOff, Trophy, Users, Target, TrendingUp, Award, Medal, Star, Shield, Database, Settings, Zap } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DirectColumnMigration } from "@/components/admin/direct-column-migration"
import { TeamsActiveMigration } from "@/components/admin/teams-active-migration"
import { Switch } from "@/components/ui/switch"
import { EditTeamStatsModal } from "@/components/admin/edit-team-stats-modal"
import { Badge } from "@/components/ui/badge"
import { ConferenceManagement } from "@/components/admin/conference-management"
import { getCurrentSeasonId } from "@/lib/team-utils"

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
  conference_id?: string
  conference?: {
    id: string
    name: string
    color: string
  }
}

interface Conference {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
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
  const [conferences, setConferences] = useState<Conference[]>([])
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
    conference_id: "",
  })
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
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
  const [showConferenceManagement, setShowConferenceManagement] = useState(false)

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

        // Load conferences
        await loadConferences()

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

  // Load conferences
  const loadConferences = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase.from("conferences").select("*").order("name")

      if (error) {
        console.error("Error loading conferences:", error)
        setConferences([])
        return
      }

      setConferences(data || [])
    } catch (error: any) {
      console.error("Error loading conferences:", error)
      setConferences([])
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

      // Load teams with conference data (fallback to basic query if conference join fails)
      let { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          conference:conferences(id, name, color)
        `)
        .eq("season_id", season)
        .order("name")

      // If conference join fails, try without conference data
      if (error && error.message.includes("conferences")) {
        console.log("Conference table not found, loading teams without conference data")
        const fallbackResult = await supabase
          .from("teams")
          .select("*")
          .eq("season_id", season)
          .order("name")
        
        data = fallbackResult.data
        error = fallbackResult.error
      }

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
      conference_id: "",
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
      conference_id: team.conference_id || "",
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

      // Include conference_id if provided
      if (teamForm.conference_id) {
        teamData.conference_id = teamForm.conference_id
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

  const handleConferencesUpdated = async () => {
    // Reload conferences and teams
    await loadConferences()
    setLastRefresh(Date.now())
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 text-center relative z-10">
          <div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl shadow-assist-green-500/25">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-hockey-silver-800 dark:text-hockey-silver-200">
              Team Management
            </h1>
            <p className="text-sm sm:text-base lg:text-lg mx-auto mb-6 sm:mb-8 max-w-3xl text-hockey-silver-600 dark:text-hockey-silver-400 px-2">
              Comprehensive team administration and roster management. Create, edit, and monitor team statistics, EA integration, and league standings.
            </p>
            
            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-6 mb-6 sm:mb-8 px-2">
              <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-assist-green-200/30 dark:border-assist-green-700/30">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-assist-green-600 dark:text-assist-green-400" />
                <span className="text-xs sm:text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Team Roster</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                <span className="text-xs sm:text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">EA Integration</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-goal-red-200/30 dark:border-goal-red-700/30">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-goal-red-600 dark:text-goal-red-400" />
                <span className="text-xs sm:text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Statistics</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                <span className="text-xs sm:text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 pb-12 sm:pb-20">

      {loadError && (
        <Alert className="mb-6 border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
          <AlertTriangle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
          <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">Error loading data</AlertTitle>
          <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
            {loadError}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleRetry} className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasEaColumn && (
        <Alert className="mb-6 border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">EA Club ID column needs to be added</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            To use EA integration features, you need to add the EA Club ID column to the teams table.
            <div className="mt-2">
              <DirectColumnMigration onComplete={handleMigrationComplete} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasActiveColumn && (
        <Alert className="mb-6 border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">Team Active Status column needs to be added</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            To manage team visibility, you need to add the is_active column to the teams table.
            <div className="mt-2">
              <TeamsActiveMigration onComplete={handleMigrationComplete} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasManualOverrideColumn && (
        <Alert className="mb-6 border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">Manual Override column needs to be added</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
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
                className="hockey-button bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Run Migration
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {(!hasGamesPlayedColumn || !hasPointsColumn) && (
        <Alert className="mb-6 border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">Team Stats Columns Need to be Added</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            To properly track team statistics, you need to add the points and games_played columns to the teams table.
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={addMissingColumns} disabled={isAddingColumns} className="hockey-button bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
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


      {/* Enhanced Controls Section */}
      <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20 mb-8">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
          <div className="flex items-center gap-2 sm:gap-4 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                Team Controls
              </CardTitle>
              <CardDescription className="text-sm sm:text-base lg:text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                Manage seasons, search teams, and perform administrative actions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="season-select" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <Trophy className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                  Season
                </Label>
                <Select value={selectedSeason?.toString() || ""} onValueChange={(value) => setSelectedSeason(Number(value))}>
                  <SelectTrigger id="season-select" className="w-[200px] hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                    {seasons.map((season: Season) => (
                      <SelectItem key={season.id} value={season.id.toString()}>
                        {season.name} {season.is_active ? "(Active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-search" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <Search className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  Search Teams
                </Label>
                <Input
                  id="team-search"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[200px] lg:w-[250px] hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
              </div>

              {hasActiveColumn && (
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                  <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-assist-green-500 data-[state=checked]:to-assist-green-600" />
                  <Label htmlFor="show-inactive" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Show inactive teams</Label>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button onClick={handleAddTeam} className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                Add Team
              </Button>
              <Button variant="outline" onClick={() => setLastRefresh(Date.now())} disabled={isLoadingStats} className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base">
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
                )}
                Refresh Stats
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conference Management Section */}
      <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20 mb-8">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-hockey-silver-100 to-ice-blue-100 dark:from-hockey-silver-900/30 dark:to-ice-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-hockey-silver-500 to-ice-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-hockey-silver-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Conference Management
                </CardTitle>
                <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                  Manage conference names and team assignments for standings display
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowConferenceManagement(!showConferenceManagement)}
              className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-ice-blue-600 hover:from-hockey-silver-600 hover:to-ice-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {showConferenceManagement ? "Hide" : "Manage"} Conferences
            </Button>
          </div>
        </CardHeader>
        {showConferenceManagement && (
          <CardContent className="relative z-10">
            <ConferenceManagement 
              conferences={conferences} 
              onConferencesUpdated={handleConferencesUpdated} 
            />
          </CardContent>
        )}
      </Card>

      {/* Enhanced Teams Table Card */}
      <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-assist-green-100 to-goal-red-100 dark:from-assist-green-900/30 dark:to-goal-red-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-assist-green-500/25">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                Teams
              </CardTitle>
              <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                Manage teams in the league with comprehensive statistics and controls
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-x-auto shadow-lg shadow-ice-blue-500/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                  <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Team Name</TableHead>
                  <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Record</TableHead>
                  <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Points</TableHead>
                  <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Goal Diff</TableHead>
                  <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Season</TableHead>
                  <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Conference</TableHead>
                  {hasEaColumn && <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">EA Club ID</TableHead>}
                  {hasActiveColumn && <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Status</TableHead>}
                  <TableHead className="text-right text-hockey-silver-800 dark:text-hockey-silver-200 font-bold text-base">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={hasEaColumn && hasActiveColumn ? 9 : hasEaColumn || hasActiveColumn ? 8 : 7}
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
                    const seasonName =
                      seasons.find((s: Season) => s.id === team.season_id)?.name || `Season ${team.season_id}`

                    // Use database values directly for more accurate display
                    const wins = team.wins || 0
                    const losses = team.losses || 0
                    const otl = team.otl || 0
                    const points = team.points || wins * 2 + otl
                    const goalDiff = (team.goals_for || 0) - (team.goals_against || 0)

                    return (
                      <TableRow key={team.id} className={`hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30 ${!team.is_active ? "opacity-60" : ""}`}>
                        <TableCell className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{team.name}</span>
                            {team.manual_override && (
                              <Badge className="text-xs bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white shadow-md">
                                Manual
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          <span className="text-lg font-bold">{wins}-{losses}-{otl}</span>
                        </TableCell>
                        <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          <span className="text-lg font-bold text-assist-green-600 dark:text-assist-green-400">{points}</span>
                        </TableCell>
                        <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          <span className={`text-lg font-bold ${goalDiff >= 0 ? 'text-assist-green-600 dark:text-assist-green-400' : 'text-goal-red-600 dark:text-goal-red-400'}`}>
                            {goalDiff >= 0 ? '+' : ''}{goalDiff}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          <span className="text-base font-medium">{seasonName}</span>
                        </TableCell>
                        <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">
                          {team.conference ? (
                            <Badge 
                              className="text-sm px-3 py-1 rounded-full shadow-md"
                              style={{ 
                                backgroundColor: team.conference.color,
                                color: 'white'
                              }}
                            >
                              {team.conference.name}
                            </Badge>
                          ) : (
                            <span className="text-hockey-silver-500 dark:text-hockey-silver-500 font-medium">Not assigned</span>
                          )}
                        </TableCell>
                        {hasEaColumn && (
                          <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300">
                            {team.ea_club_id ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-semibold text-ice-blue-600 dark:text-ice-blue-400">{team.ea_club_id}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewEATeamStats(team.ea_club_id!)}
                                  title="View EA Stats"
                                  className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-hockey-silver-500 dark:text-hockey-silver-500 font-medium">Not set</span>
                            )}
                          </TableCell>
                        )}
                        {hasActiveColumn && (
                          <TableCell className="text-center">
                            <Button
                              variant={team.is_active ? "outline" : "secondary"}
                              size="sm"
                              onClick={() => toggleTeamActive(team)}
                              className={`flex items-center gap-1 hockey-button transition-all duration-300 ${
                                team.is_active 
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-md hover:shadow-lg hover:scale-105" 
                                  : "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white shadow-md hover:shadow-lg hover:scale-105"
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
                            <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)} className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)} className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
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

      <Dialog
        open={isAddingTeam || editingTeam !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingTeam(false)
            setEditingTeam(null)
          }
        }}
      >
        <DialogContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              {isAddingTeam ? "Add New Team" : "Edit Team"}
            </DialogTitle>
            <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
              {isAddingTeam ? "Create a new team for the league with comprehensive settings and EA integration." : "Update the details and settings for this team."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Users className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                Team Name
              </Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g. Toronto Maple Leafs"
                className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Target className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                Logo URL (optional)
              </Label>
              <Input
                id="logo-url"
                value={teamForm.logo_url}
                onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Trophy className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                Season
              </Label>
              <Select
                value={teamForm.season_id.toString()}
                onValueChange={(value) => setTeamForm({ ...teamForm, season_id: Number(value) })}
              >
                <SelectTrigger id="season" className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                  {seasons.map((season: Season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      {season.name} {season.is_active ? "(Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conference" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Users className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                Conference {conferences && conferences.length > 0 && `(${conferences.length} available)`}
              </Label>
              <Select
                value={teamForm.conference_id}
                onValueChange={(value) => setTeamForm({ ...teamForm, conference_id: value })}
              >
                <SelectTrigger id="conference" className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                  <SelectValue placeholder={conferences && conferences.length > 0 ? "Select Conference" : "No conferences available"} />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                  <SelectItem value="">No Conference</SelectItem>
                  {conferences && conferences.length > 0 ? (
                    conferences.map((conference: Conference) => (
                      <SelectItem key={conference.id} value={conference.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: conference.color }}
                          />
                          {conference.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No conferences available. Create conferences first.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {hasEaColumn && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <div className="flex justify-between items-center">
                  <Label htmlFor="ea-club-id" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Database className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    EA Club ID
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={openEASearch} className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <Search className="h-4 w-4 mr-2" />
                    Search EA Teams
                  </Button>
                </div>
                <Input
                  id="ea-club-id"
                  value={teamForm.ea_club_id}
                  onChange={(e) => setTeamForm({ ...teamForm, ea_club_id: e.target.value })}
                  placeholder="e.g. 204949"
                  className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  EA Club ID is used to fetch stats and match data from EA Sports NHL.
                </p>
              </div>
            )}

            {hasActiveColumn && (
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                <Switch
                  id="team-active"
                  checked={teamForm.is_active}
                  onCheckedChange={(checked) => setTeamForm({ ...teamForm, is_active: checked })}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-assist-green-500 data-[state=checked]:to-assist-green-600"
                />
                <Label htmlFor="team-active" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Team is active</Label>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 ml-2">
                  Inactive teams won't appear on the public teams and standings pages.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingTeam(false)
                setEditingTeam(null)
              }}
              className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTeam} disabled={isSaving} className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAddingTeam ? "Add Team" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEaSearchDialog} onOpenChange={setShowEaSearchDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                <Search className="h-4 w-4 text-white" />
              </div>
              Search EA Teams
            </DialogTitle>
            <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
              Search for teams in EA Sports NHL to link with your SCS team and enable automatic statistics synchronization.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-3 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="ea-search" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Database className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                EA Team Name
              </Label>
              <Input
                id="ea-search"
                placeholder="Enter EA team name..."
                value={eaSearchQuery}
                onChange={(e) => setEaSearchQuery(e.target.value)}
                className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
            </div>
            <Button type="button" onClick={searchEATeams} disabled={isSearchingEA} className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              {isSearchingEA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 rounded-lg shadow-lg shadow-ice-blue-500/10">
            {eaSearchResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                    <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Team Name</TableHead>
                    <TableHead className="text-center text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Club ID</TableHead>
                    <TableHead className="text-right text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eaSearchResults.map((team) => (
                    <TableRow key={team.clubId} className="hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{team.name}</TableCell>
                      <TableCell className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold text-ice-blue-600 dark:text-ice-blue-400">{team.clubId}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => selectEATeam(team)} className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                {isSearchingEA ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching EA teams...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>No results. Search for a team name.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-start pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button type="button" variant="secondary" onClick={() => setShowEaSearchDialog(false)} className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}