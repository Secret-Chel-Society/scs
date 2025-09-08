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
import { getCurrentSeasonId, updateSalaryCap } from "@/lib/team-utils"
import { useSalaryCap } from "@/hooks/useSalaryCap"
import { TeamConferenceSelect } from "@/components/admin/team-conference-select"

// Conference interface to match database schema
interface Conference {
  id: string
  name: string
  description?: string
  color: string
}

interface Season {
  id: number
  name: string
  is_active: boolean
}

import type { Conference } from "@/lib/types/conferences";

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  wins: number;
  losses: number;
  otl: number;
  goals_for: number;
  goals_against: number;
  points?: number;
  games_played?: number;
  season_id: number;
  ea_club_id?: string | null;
  is_active: boolean;
  manual_override?: boolean;
  powerplay_goals?: number;
  powerplay_opportunities?: number;
  penalty_kill_goals_against?: number;
  penalty_kill_opportunities?: number;
  conference_id?: string | null;
  conference?: Conference | null;
  created_at?: string;
  updated_at?: string;
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
  // State management
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [hasActiveColumn, setHasActiveColumn] = useState(false)
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
  const [conferences, setConferences] = useState<Conference[]>([])
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
  const [hasManualOverrideColumn, setHasManualOverrideColumn] = useState(false)
  const [hasGamesPlayedColumn, setHasGamesPlayedColumn] = useState(false)
  const [hasPointsColumn, setHasPointsColumn] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [isAddingColumns, setIsAddingColumns] = useState(false)
  const { salaryCap, isLoading: isLoadingSalaryCap } = useSalaryCap()
  const [isUpdatingSalaryCap, setIsUpdatingSalaryCap] = useState(false)

  useEffect(() => {
    async function checkAuthorizationAndLoadData() {
      console.log("🔍 Starting authorization check...")
      console.log("Session:", session)
      console.log("Supabase client:", supabase)
      
      if (!session?.user) {
        console.log("❌ No session user found")
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      console.log("✅ Session user found:", session.user.id)

      try {
        setLoading(true)
        setLoadError(null)

        console.log("🔍 Checking admin role for user:", session.user.id)
        
        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        console.log("Admin role check result:", { adminRoleData, adminRoleError })

        if (adminRoleError) {
          console.error("❌ Error checking admin role:", adminRoleError)
          console.error("Admin role error details:", {
            message: adminRoleError.message,
            details: adminRoleError.details,
            hint: adminRoleError.hint,
            code: adminRoleError.code
          })
          setLoadError(`Error checking admin role: ${adminRoleError.message}`)
          toast({
            title: "Authentication error",
            description: "Failed to verify admin permissions",
            variant: "destructive",
          })
          return
        }

        if (!adminRoleData || adminRoleData.length === 0) {
          console.log("❌ No admin role found for user")
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        console.log("✅ Admin role confirmed")
        setIsAdmin(true)

        console.log("🔍 Checking database columns...")
        // Check if columns exist
        await checkEaColumnExists()
        await checkActiveColumnExists()
        await checkManualOverrideColumnExists()
        await checkGamesPlayedColumn()
        await checkPointsColumn()

        // Load conferences
        await loadConferences()
        
        // Load salary cap
        // Removed loadSalaryCap() call

        // Load seasons
        console.log("🔍 Loading seasons...")
        try {
          const { data: seasonsData, error: seasonsError } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "seasons")
            .single()

          console.log("Seasons query result:", { seasonsData, seasonsError })

          if (seasonsError) {
            console.error("❌ Error loading seasons:", seasonsError)
            console.error("Seasons error details:", {
              message: seasonsError.message,
              details: seasonsError.details,
              hint: seasonsError.hint,
              code: seasonsError.code
            })
            // Use default season if can't load from database
            setSeasons([{ id: 1, name: "Season 1", is_active: true }])
            setSelectedSeason(1)
          } else if (seasonsData) {
            console.log("✅ Seasons loaded successfully")
            const seasonsArray = seasonsData.value || []
            setSeasons(seasonsArray)

            // Get current season
            console.log("🔍 Getting current season...")
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
        console.error("❌ CRITICAL SETUP ERROR:", error)
        console.error("Error stack:", error.stack)
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          cause: error.cause,
          code: error.code
        })
        setLoadError(`Setup error: ${error.message}`)
        toast({
          title: "Critical Error",
          description: error.message || "An error occurred during setup",
          variant: "destructive",
        })
      } finally {
        console.log("🏁 Setup process finished")
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
  const updateTeamConference = async (teamId: string, conferenceId: string) => {
    if (!supabase) {
      console.error("Supabase client not available")
      return
    }

    try {
      setIsUpdatingConference(true)
      
      // Handle "none" value by setting to null
      const actualConferenceId = conferenceId === "none" ? null : conferenceId
      
      // Update the team's conference in the database
      const { error } = await supabase
        .from("teams")
        .update({ 
          conference_id: actualConferenceId,
          updated_at: new Date().toISOString()
        })
        .eq("id", teamId)
  
      if (error) throw error

      // Find the conference data from the conferences state
      const conference = actualConferenceId 
        ? conferences.find(c => c.id === actualConferenceId) 
        : null

      // Update the local state to reflect the change
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId 
            ? { 
                ...team, 
                conference_id: actualConferenceId, // Use actualConferenceId instead of conferenceId
                conference 
              } 
            : team
        )
      )
      
      // Also update filteredTeams to ensure UI consistency
      setFilteredTeams(prevFilteredTeams =>
        prevFilteredTeams.map(team =>
          team.id === teamId
            ? {
                ...team,
                conference_id: actualConferenceId,
                conference
              }
            : team
        )
      )
  
      toast({
        title: "Conference Updated",
        description: `Team conference updated to ${conference?.name || "None"}`,
      })
      
      // Refresh the teams list to ensure data consistency
      loadTeams(selectedSeason)
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
    const easternTeams = teams.filter(team => team.conference?.name === "Eastern Conference")
    const westernTeams = teams.filter(team => team.conference?.name === "Western Conference")
    const unassignedTeams = teams.filter(team => !team.conference_id || !team.conference)

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

  // Load conferences and ensure they're properly associated with teams
  const loadConferences = async () => {
    console.log("🔍 Loading conferences...")
    if (!supabase) {
      console.log("❌ No supabase client available")
      return
    }

    try {
      console.log("🔍 Querying conferences table...")
      const { data: conferencesData, error: conferencesError } = await supabase
        .from("conferences")
        .select("*")
        .order("name")

      console.log("Conferences query result:", { data: conferencesData, error: conferencesError })

      if (conferencesError) {
        console.error("❌ Error loading conferences:", conferencesError)
        console.error("Conference error details:", {
          message: conferencesError.message,
          details: conferencesError.details,
          hint: conferencesError.hint,
          code: conferencesError.code
        })
        // If conferences table doesn't exist, set empty array
        setConferences([])
        return
      }

      console.log("✅ Conferences loaded successfully:", conferencesData?.length || 0, "conferences")
      
      // Update conferences state
      const conferencesList = conferencesData || []
      setConferences(conferencesList)
      
      // If we have teams loaded, ensure they have the latest conference data
      if (teams.length > 0) {
        setTeams(prevTeams => 
          prevTeams.map(team => ({
            ...team,
            conference: conferencesList.find(c => c.id === team.conference_id) || null
          }))
        )
      }
      
      return conferencesList
    } catch (error) {
      console.error("❌ Exception loading conferences:", error)
      console.error("Conference exception details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      setConferences([])
      return []
    }
  }

  // Load salary cap from system settings
  // Removed loadSalaryCap() call

  // Update salary cap
  const handleUpdateSalaryCap = async (newCap: number) => {
    try {
      setIsUpdatingSalaryCap(true)
      const success = await updateSalaryCap(newCap)
      
      if (success) {
        // The useSalaryCap hook will automatically update the salary cap via the subscription
        toast({
          title: "Salary Cap Updated",
          description: `Salary cap updated to $${newCap.toLocaleString()}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update salary cap",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating salary cap:", error)
      toast({
        title: "Error",
        description: "Failed to update salary cap",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingSalaryCap(false)
    }
  }

  // Handle conference update from child component
  const handleConferenceUpdate = async (teamId: string, conferenceId: string | null) => {
    if (!supabase) {
      console.error('Supabase client not available');
      toast({
        title: 'Error',
        description: 'Database connection error',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update the team's conference in the database
      const { error } = await supabase
        .from('teams')
        .update({ 
          conference_id: conferenceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;

      // Refresh the teams list to reflect the changes
      await loadTeams(selectedSeason);
      
      toast({
        title: 'Success',
        description: 'Team conference updated successfully',
      });
    } catch (error) {
      console.error('Error updating team conference:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team conference',
        variant: 'destructive',
      });
    }
  };

  const loadTeams = async (seasonId?: number) => {
    if (!supabase) {
      console.error("Supabase client not available")
      setLoadError("Database client not available")
      return;
    }

    setLoadingTeams(true);
    setLoadError(null);
    
    try {
      // First, ensure we have the latest conferences
      await loadConferences();
      
      const season = seasonId || selectedSeason || 1;
      
      // Ensure season is a number
      const numericSeason = typeof season === 'string' ? parseInt(season, 10) : season;
      if (isNaN(numericSeason)) {
        console.error("Invalid season ID:", season, "defaulting to 1");
        const fallbackSeason = 1;
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("teams")
          .select("*")
          .eq("season_id", fallbackSeason)
          .order("name");
        
        if (fallbackError) throw fallbackError;
        
        setTeams(fallbackData || []);
        applyFilters(fallbackData || [], searchQuery, showInactive);
        return;
      }

      // Try to load teams with conference data using a join
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          conference:conference_id (id, name, description, color)
        `)
        .eq('season_id', numericSeason)
        .order('name');

      if (error) {
        console.warn("Error loading teams with conferences, trying without join:", error.message);
        // Fallback to loading teams without conference data if join fails
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .eq("season_id", numericSeason)
          .order("name");
          
        if (teamsError) throw teamsError;
        
        console.log('Loaded teams without conference data:', teamsData);
        setTeams(teamsData || []);
        applyFilters(teamsData || [], searchQuery, showInactive);
        return;
      }

      console.log('Loaded teams with conferences:', data);
      setTeams(data || []);
      applyFilters(data || [], searchQuery, showInactive);
    } catch (error: any) {
      console.error("Error loading teams:", error);
      setLoadError(`Error: ${error.message}`);
      toast({
        title: "Error loading teams",
        description: error.message || "An unexpected error occurred while loading teams.",
        variant: "destructive",
      });
    } finally {
      setLoadingTeams(false);
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
        conference_id: teamForm.conference_id || null,
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-blue-500 mx-auto mb-4"></div>
              <p className="text-ice-blue-600 dark:text-ice-blue-400">Loading team management...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-hockey-silver-200/20 to-ice-blue-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-ice-blue-600 via-rink-blue-600 to-hockey-silver-600 dark:from-ice-blue-400 dark:via-rink-blue-400 dark:to-hockey-silver-400 bg-clip-text text-transparent leading-tight">
              Team Management
            </h1>
              <p className="text-xl text-ice-blue-700 dark:text-ice-blue-300 mt-3">Manage teams, statistics, and league configuration</p>
              </div>
              </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 pb-20">

      {loadError && (
          <Card className="mb-8 hockey-card border-2 border-goal-red-200/50 dark:border-goal-red-700/50 shadow-2xl shadow-goal-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-goal-red-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-goal-red-600 dark:text-goal-red-400 mb-2">Error loading data</h3>
                  <p className="text-goal-red-600 dark:text-goal-red-400 mb-3">{loadError}</p>
              <Button variant="outline" size="sm" onClick={handleRetry} className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
              </div>
            </CardContent>
          </Card>
      )}

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

        {/* Salary Cap Management Section */}
        <Card className="mb-8 hockey-card hockey-card-hover border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 shadow-2xl shadow-hockey-silver-500/20">
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-hockey-silver-100 to-hockey-silver-100 dark:from-hockey-silver-900/30 dark:to-hockey-silver-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
            <CardTitle className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-xl flex items-center justify-center shadow-lg shadow-hockey-silver-500/25">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">Salary Cap Management</div>
                <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">Configure the league salary cap</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-hockey-silver-500/10 to-hockey-silver-500/10 rounded-xl border border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <div>
                <div className="text-3xl font-bold text-hockey-silver-600 dark:text-hockey-silver-400">
                  {isLoadingSalaryCap ? (
                    <div className="h-8 w-32 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded animate-pulse"></div>
                  ) : (
                    `$${(salaryCap || 0).toLocaleString()}`
                  )}
                </div>
                <div className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400 font-semibold">Current Salary Cap</div>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="Enter new cap"
                  className="w-48 bg-slate-800/50 border-white/20 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      const newCap = parseInt(input.value)
                      if (!isNaN(newCap) && newCap > 0) {
                        handleUpdateSalaryCap(newCap)
                        input.value = ''
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter new cap"]') as HTMLInputElement
                    const newCap = parseInt(input.value)
                    if (!isNaN(newCap) && newCap > 0) {
                      handleUpdateSalaryCap(newCap)
                      input.value = ''
                    }
                  }}
                  disabled={isUpdatingSalaryCap || isLoadingSalaryCap}
                  className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  {isUpdatingSalaryCap || isLoadingSalaryCap ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Update Cap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Conference Management Section */}
        <Card className="mb-8 hockey-card hockey-card-hover border-2 border-assist-green-200/50 dark:border-assist-green-700/50 shadow-2xl shadow-assist-green-500/20">
        <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/30 dark:to-assist-green-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
            <CardTitle className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-assist-green-500/25">
                <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
                <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">Conference Management</div>
                <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">Manage team conferences for the Eastern Elites and Western Warriors divisions</div>
              </div>
              </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="hockey-card bg-gradient-to-r from-ice-blue-500/20 to-ice-blue-500/20 backdrop-blur-sm border-2 border-ice-blue-200/50 dark:border-ice-blue-700/50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold text-ice-blue-600 dark:text-ice-blue-400">{getConferenceStats().eastern}</div>
                <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400 font-semibold">Eastern Elites</div>
            </div>
              <div className="hockey-card bg-gradient-to-r from-rink-blue-500/20 to-rink-blue-500/20 backdrop-blur-sm border-2 border-rink-blue-200/50 dark:border-rink-blue-700/50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold text-rink-blue-600 dark:text-rink-blue-400">{getConferenceStats().western}</div>
                <div className="text-lg text-rink-blue-600 dark:text-rink-blue-400 font-semibold">Western Warriors</div>
          </div>
              <div className="hockey-card bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 backdrop-blur-sm border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold text-hockey-silver-600 dark:text-hockey-silver-400">{getConferenceStats().unassigned}</div>
                <div className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400 font-semibold">Unassigned</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-ice-blue-800 dark:text-ice-blue-200 mb-2">Conference Assignment</h4>
                  <p className="text-ice-blue-600 dark:text-ice-blue-400 text-sm">
                    Assign teams to conferences. Top 4 teams from each conference qualify for playoffs.
                  </p>
                  {conferences.length === 0 && (
                    <div className="mt-2 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        <strong>Note:</strong> No conferences found. You may need to create conferences first or run the database setup.
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setShowConferenceManagement(!showConferenceManagement)}
                  className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {showConferenceManagement ? "Hide" : "Show"} Conference Management
                </Button>
              </div>

              {showConferenceManagement && (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 flex-shrink-0">
                          {team.logo_url ? (
                            <img 
                              src={team.logo_url} 
                              alt={`${team.name} logo`}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-logo.png';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-700 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {team.name.split(' ').map(word => word[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{team.name}</span>
                          {team.conference && (
                            <Badge 
                              variant="outline" 
                              className="mt-1 w-fit text-xs border-white/20 text-white/80 bg-white/5"
                            >
                              {team.conference.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TeamConferenceSelect
                          teamId={team.id}
                          currentConferenceId={team.conference_id}
                          conferences={conferences}
                          onSave={handleConferenceUpdate}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls Section */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Select value={selectedSeason?.toString() || "1"} onValueChange={(value) => setSelectedSeason(Number(value))}>
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

        {/* Enhanced Teams Table */}
      <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-assist-green-100 to-goal-red-100 dark:from-assist-green-900/30 dark:to-goal-red-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
            <CardTitle className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
                <div className="text-2xl font-bold text-ice-blue-800 dark:text-ice-blue-200">Teams</div>
                <div className="text-lg text-ice-blue-600 dark:text-ice-blue-400">Manage teams in the league</div>
            </div>
            </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-x-auto shadow-lg">
            <Table>
              <TableHeader>
                  <TableRow className="border-ice-blue-200/50 dark:border-rink-blue-700/50 hover:bg-ice-blue-50/50 dark:hover:bg-rink-blue-900/20">
                    <TableHead className="text-ice-blue-700 dark:text-ice-blue-300 font-semibold">Team Name</TableHead>
                    <TableHead className="text-center text-ice-blue-700 dark:text-ice-blue-300 font-semibold">Record</TableHead>
                    <TableHead className="text-center text-ice-blue-700 dark:text-ice-blue-300 font-semibold">Points</TableHead>
                    <TableHead className="text-center text-ice-blue-700 dark:text-ice-blue-300 font-semibold">Goal Diff</TableHead>
                    <TableHead className="text-center text-ice-blue-700 dark:text-ice-blue-300 font-semibold">Season</TableHead>
                    {hasEaColumn && <TableHead className="text-center text-ice-blue-700 dark:text-ice-blue-300 font-semibold">EA Club ID</TableHead>}
                    {hasActiveColumn && <TableHead className="text-center text-ice-blue-700 dark:text-ice-blue-300 font-semibold">Status</TableHead>}
                    <TableHead className="text-right text-ice-blue-700 dark:text-ice-blue-300 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                    <TableRow className="border-ice-blue-200/50 dark:border-rink-blue-700/50 hover:bg-ice-blue-50/50 dark:hover:bg-rink-blue-900/20">
                    <TableCell
                      colSpan={hasEaColumn && hasActiveColumn ? 8 : hasEaColumn || hasActiveColumn ? 7 : 6}
                        className="text-center py-6 text-ice-blue-600 dark:text-ice-blue-400"
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
                        <TableRow key={team.id} className={`border-ice-blue-200/50 dark:border-rink-blue-700/50 hover:bg-ice-blue-50/50 dark:hover:bg-rink-blue-900/20 transition-all duration-300 hover:scale-[1.01] ${!team.is_active ? "opacity-60" : ""}`}>
                          <TableCell className="font-medium text-ice-blue-800 dark:text-ice-blue-200">
                          <div className="flex items-center gap-2">
                              {team.name}
                            {team.manual_override && (
                                <Badge variant="outline" className="text-xs border-ice-blue-500/30 text-ice-blue-600 dark:text-ice-blue-400">
                                Manual
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                          <TableCell className="text-center text-ice-blue-800 dark:text-ice-blue-200">{wins}-{losses}-{otl}</TableCell>
                          <TableCell className="text-center text-ice-blue-800 dark:text-ice-blue-200">{points}</TableCell>
                          <TableCell className="text-center text-ice-blue-800 dark:text-ice-blue-200">{goalDiff}</TableCell>
                          <TableCell className="text-center text-ice-blue-800 dark:text-ice-blue-200">{seasonName}</TableCell>
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
                                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                              >
                              <Pencil className="h-4 w-4" />
                            </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTeam(team.id)}
                                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
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

        {/* Enhanced Team Dialog */}
      <Dialog
        open={isAddingTeam || editingTeam !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingTeam(false)
            setEditingTeam(null)
          }
        }}
      >
          <DialogContent className="hockey-card bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-ice-blue-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                  {isAddingTeam ? <Plus className="h-4 w-4 text-white" /> : <Pencil className="h-4 w-4 text-white" />}
              </div>
              {isAddingTeam ? "Add New Team" : "Edit Team"}
            </DialogTitle>
              <DialogDescription className="text-ice-blue-300">
                {isAddingTeam ? "Create a new team for the league." : "Update the details for this team."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="team-name" className="text-ice-blue-200 font-semibold">Team Name</Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g. Toronto Maple Leafs"
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="logo-url" className="text-ice-blue-200 font-semibold">Logo URL (optional)</Label>
              <Input
                id="logo-url"
                value={teamForm.logo_url}
                onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="season" className="text-ice-blue-200 font-semibold">Season</Label>
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
                    <Label htmlFor="ea-club-id" className="text-ice-blue-200 font-semibold">EA Club ID</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={openEASearch}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
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
                  <p className="text-sm text-ice-blue-300">
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
                  <Label htmlFor="team-active" className="text-ice-blue-200 font-semibold">Team is active</Label>
                  <p className="text-sm text-ice-blue-300 ml-2">
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
                className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
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
    </div>
  )
}