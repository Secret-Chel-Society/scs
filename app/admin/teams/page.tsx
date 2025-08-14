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
import { Loader2, Plus, Pencil, Trash2, Search, RefreshCw, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DirectColumnMigration } from "@/components/admin/direct-column-migration"
import { TeamsActiveMigration } from "@/components/admin/teams-active-migration"
import { Switch } from "@/components/ui/switch"
import { EditTeamStatsModal } from "@/components/admin/edit-team-stats-modal"
import { Badge } from "@/components/ui/badge"
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
      <h1 className="text-3xl font-bold mb-6">Team Management</h1>

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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedSeason?.toString() || ""} onValueChange={(value) => setSelectedSeason(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season: Season) => (
                <SelectItem key={season.id} value={season.id.toString()}>
                  {season.name} {season.is_active ? "(Active)" : ""}
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
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
              <Label htmlFor="show-inactive">Show inactive teams</Label>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAddTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
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
                    const seasonName =
                      seasons.find((s: Season) => s.id === team.season_id)?.name || `Season ${team.season_id}`

                    // Use database values directly for more accurate display
                    const wins = team.wins || 0
                    const losses = team.losses || 0
                    const otl = team.otl || 0
                    const points = team.points || wins * 2 + otl
                    const goalDiff = (team.goals_for || 0) - (team.goals_against || 0)

                    return (
                      <TableRow key={team.id} className={!team.is_active ? "opacity-60" : ""}>
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

            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select
                value={teamForm.season_id.toString()}
                onValueChange={(value) => setTeamForm({ ...teamForm, season_id: Number(value) })}
              >
                <SelectTrigger id="season">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season: Season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      {season.name} {season.is_active ? "(Active)" : ""}
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
