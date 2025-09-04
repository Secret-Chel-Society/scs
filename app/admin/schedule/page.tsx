"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { format, parse } from "date-fns"
import { Calendar, Clock, Edit, Plus, Trash2, AlertCircle, Download, Upload, FileUp, Trophy, Award, Medal, Star, Shield, Database, Settings, Zap, Target, Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

// Define match status type based on database constraints
type MatchStatus = "Scheduled" | "In Progress" | "Completed" | "Postponed" | "Cancelled"

// Define match form type
interface MatchFormData {
  homeTeamId: string
  awayTeamId: string
  date: string
  time: string
  seasonName: string
  homeScore: string
  awayScore: string
  status: MatchStatus
  overtime: boolean // Add this line
}

// Define season type
interface Season {
  id: string
  name: string
  is_active?: boolean
}

// Define CSV match type
interface CSVMatch {
  date: string
  time: string
  homeTeam: string
  awayTeam: string
  homeScore?: string
  awayScore?: string
  status?: string
  season?: string
}

export default function AdminSchedulePage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSeasonDialogOpen, setIsSeasonDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [currentMatch, setCurrentMatch] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [dateColumnName, setDateColumnName] = useState<string>("match_date")
  const [defaultSeasonName, setDefaultSeasonName] = useState<string>("")
  const [newSeasonName, setNewSeasonName] = useState<string>("")
  const [seasonError, setSeasonError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [hasSeasonNameColumn, setHasSeasonNameColumn] = useState<boolean>(false)
  const [migrationRunning, setMigrationRunning] = useState<boolean>(false)
  const [seasonIdType, setSeasonIdType] = useState<"integer" | "uuid" | "unknown">("unknown")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadResults, setUploadResults] = useState<{
    total: number
    success: number
    errors: string[]
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState<MatchFormData>({
    homeTeamId: "",
    awayTeamId: "",
    date: "",
    time: "",
    seasonName: "",
    homeScore: "",
    awayScore: "",
    status: "Scheduled",
    overtime: false,
  })

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Check if user is admin
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

      // Determine the date column name
      await checkMatchesTableStructure()
      await checkSeasonIdType()
      await checkSeasonNameColumn()

      // Fetch data in sequence to better handle errors
      await fetchTeams()
      await fetchSeasons()
      await fetchMatches()
    } catch (error: any) {
      console.error("Error checking authorization:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Check matches table structure to determine date column name
  const checkMatchesTableStructure = async () => {
    try {
      // Try to get a single match to check the structure
      const { data, error } = await supabase.from("matches").select("*").limit(1)

      if (error) {
        console.error("Error checking matches table:", error)
        return
      }

      // Check if the table has a date or match_date column
      if (data && data.length > 0) {
        const match = data[0]
        if ("date" in match) {
          setDateColumnName("date")
        } else if ("match_date" in match) {
          setDateColumnName("match_date")
        }
      }
    } catch (error) {
      console.error("Error checking matches table structure:", error)
    }
  }

  // Check if season_id is integer or UUID
  const checkSeasonIdType = async () => {
    try {
      // First check the seasons table
      const { data: seasonData, error: seasonError } = await supabase.from("seasons").select("id").limit(1)

      if (!seasonError && seasonData && seasonData.length > 0) {
        const seasonId = seasonData[0].id
        if (typeof seasonId === "string" && seasonId.includes("-")) {
          console.log("Season ID appears to be UUID:", seasonId)
          setSeasonIdType("uuid")
        } else {
          console.log("Season ID appears to be integer:", seasonId)
          setSeasonIdType("integer")
        }
      }

      // Then check the matches table
      const { data: matchData, error: matchError } = await supabase.from("matches").select("season_id").limit(1)

      if (!matchError && matchData && matchData.length > 0 && matchData[0].season_id !== null) {
        const matchSeasonId = matchData[0].season_id
        if (typeof matchSeasonId === "string" && matchSeasonId.includes("-")) {
          console.log("Match season_id appears to be UUID:", matchSeasonId)
          // If seasons are UUID but matches have integer season_id, we have a mismatch
          if (seasonIdType === "uuid") {
            console.log("Type match: both UUID")
          } else {
            console.log("Type mismatch: seasons are integer but matches have UUID")
          }
        } else {
          console.log("Match season_id appears to be integer:", matchSeasonId)
          // If seasons are UUID but matches have integer season_id, we have a mismatch
          if (seasonIdType === "uuid") {
            console.log("Type mismatch: seasons are UUID but matches have integer")
          } else {
            console.log("Type match: both integer")
          }
        }
      }
    } catch (error) {
      console.error("Error checking season ID type:", error)
    }
  }

  // Check if season_name column exists
  const checkSeasonNameColumn = async () => {
    try {
      // Try to get a single match to check if season_name exists
      const { data, error } = await supabase.from("matches").select("season_name").limit(1)

      // If there's no error, the column exists
      if (!error) {
        console.log("season_name column exists")
        setHasSeasonNameColumn(true)
        return
      }

      // If there's an error and it's about the column not existing
      if (error && error.message.includes("column") && error.message.includes("does not exist")) {
        console.log("season_name column doesn't exist")
        setHasSeasonNameColumn(false)
      }
    } catch (error) {
      console.error("Error checking season_name column:", error)
      setHasSeasonNameColumn(false)
    }
  }

  const runSeasonNameMigration = async () => {
    try {
      setMigrationRunning(true)

      // Create a direct SQL query to add the column
      const sql = `
      -- Add season_name column to matches table if it doesn't exist
      ALTER TABLE matches 
      ADD COLUMN IF NOT EXISTS season_name TEXT;
      `

      // Execute the SQL directly using the Supabase REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          query: sql,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to add season_name column: ${JSON.stringify(errorData)}`)
      }

      toast({
        title: "Success",
        description: "Season name column added successfully. Refreshing page...",
      })

      // Set the flag to true
      setHasSeasonNameColumn(true)

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Error",
        description: "Failed to add column automatically. Please run the SQL manually from the migrations folder.",
        variant: "destructive",
      })
    } finally {
      setMigrationRunning(false)
    }
  }

  useEffect(() => {
    checkAuthorization()
  }, [supabase, session, toast, router])

  // Fetch matches
  const fetchMatches = async () => {
    setFetchError(null)
    try {
      // Base query without seasons join
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!home_team_id(id, name, logo_url),
          away_team:teams!away_team_id(id, name, logo_url)
        `)
        .order(dateColumnName, { ascending: true })

      if (error) {
        console.error("Error fetching matches:", error)
        setFetchError(`Failed to load matches: ${error.message}`)
        toast({
          title: "Error",
          description: "Failed to load matches: " + error.message,
          variant: "destructive",
        })
        return
      }

      setMatches(data || [])
    } catch (error: any) {
      console.error("Error fetching matches:", error)
      setFetchError(`Failed to load matches: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to load matches: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Fetch teams
  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.from("teams").select("id, name").order("name")

      if (error) throw error
      setTeams(data || [])
    } catch (error: any) {
      console.error("Error fetching teams:", error)
    }
  }

  // Fetch seasons directly from system_settings
  const fetchSeasonsFromSystemSettings = async () => {
    try {
      // Try to get seasons from system_settings
      const { data, error } = await supabase.from("system_settings").select("value").eq("key", "seasons").single()

      if (error) {
        console.error("Error fetching seasons from system_settings:", error)
        return null
      }

      if (data && data.value && Array.isArray(data.value)) {
        console.log("Found seasons in system_settings:", data.value)
        return data.value
      }

      return null
    } catch (error) {
      console.error("Error in fetchSeasonsFromSystemSettings:", error)
      return null
    }
  }

  // Fetch current season from system_settings
  const fetchCurrentSeasonFromSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "current_season")
        .single()

      if (error) {
        console.error("Error fetching current_season from system_settings:", error)
        return null
      }

      if (data && data.value) {
        console.log("Found current_season in system_settings:", data.value)
        return data.value
      }

      return null
    } catch (error) {
      console.error("Error in fetchCurrentSeasonFromSystemSettings:", error)
      return null
    }
  }

  // Fetch seasons and set default season
  const fetchSeasons = async () => {
    setSeasonError(null)

    try {
      // First try to get seasons from the seasons table
      const { data: seasonsData, error: seasonsError } = await supabase
        .from("seasons")
        .select("*")
        .order("created_at", { ascending: false })

      // If there's an error with the seasons table, try system_settings
      if (seasonsError) {
        console.log("Error fetching from seasons table:", seasonsError)

        // Try to get seasons from system_settings
        const systemSettingsSeasons = await fetchSeasonsFromSystemSettings()
        const currentSeasonId = await fetchCurrentSeasonFromSystemSettings()

        if (systemSettingsSeasons && Array.isArray(systemSettingsSeasons)) {
          console.log("Using seasons from system_settings:", systemSettingsSeasons)

          // Convert system_settings seasons to the format we need
          const formattedSeasons = systemSettingsSeasons.map((season) => ({
            id: season.id.toString(),
            name: season.name,
            is_active: currentSeasonId ? season.id === currentSeasonId : false,
          }))

          setSeasons(formattedSeasons)

          // Find the active season
          const activeSeason = formattedSeasons.find((s) => s.is_active)
          if (activeSeason) {
            setDefaultSeasonName(activeSeason.name)
            setFormData((prev) => ({ ...prev, seasonName: activeSeason.name }))
          } else if (formattedSeasons.length > 0) {
            setDefaultSeasonName(formattedSeasons[0].name)
            setFormData((prev) => ({ ...prev, seasonName: formattedSeasons[0].name }))
          }

          return
        }

        // If we couldn't get seasons from either source, show an error
        setSeasonError("Could not load seasons. Please check the database setup.")
        setSeasons([])
        return
      }

      // If we successfully got seasons from the seasons table
      if (seasonsData && seasonsData.length > 0) {
        console.log("Fetched seasons from seasons table:", seasonsData)

        // Format the seasons data
        const formattedSeasons = seasonsData.map((season) => ({
          id: season.id,
          name: season.name,
          is_active: season.is_active,
        }))

        setSeasons(formattedSeasons)
        setDebugInfo({ seasonsData })

        // Find the active season
        const activeSeason = formattedSeasons.find((s) => s.is_active === true)

        if (activeSeason) {
          console.log("Found active season:", activeSeason)
          setDefaultSeasonName(activeSeason.name)
          setFormData((prev) => ({ ...prev, seasonName: activeSeason.name }))
        } else if (formattedSeasons.length > 0) {
          console.log("No active season found, using first season:", formattedSeasons[0])
          setDefaultSeasonName(formattedSeasons[0].name)
          setFormData((prev) => ({ ...prev, seasonName: formattedSeasons[0].name }))
        }
      } else {
        console.log("No seasons found in the database")
        setSeasons([])
        setSeasonError("No seasons found. Please create a season first.")
      }
    } catch (error: any) {
      console.error("Error in fetchSeasons:", error)
      setSeasonError(`Error loading seasons: ${error.message}`)
      setSeasons([])
    }
  }

  // Create a new season
  const createSeason = async () => {
    if (!newSeasonName.trim()) {
      toast({
        title: "Error",
        description: "Season name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      // Try to create in seasons table first
      const { data, error } = await supabase
        .from("seasons")
        .insert({
          name: newSeasonName.trim(),
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          is_active: false,
        })
        .select()

      if (error) {
        // If seasons table doesn't exist, try to update system_settings
        if (error.message.includes("does not exist")) {
          // Get current seasons from system_settings
          const systemSettingsSeasons = (await fetchSeasonsFromSystemSettings()) || []

          // Create a new season object
          const newSeason = {
            id: systemSettingsSeasons.length + 1,
            name: newSeasonName.trim(),
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            is_active: false,
          }

          // Add the new season to the array
          const updatedSeasons = [...systemSettingsSeasons, newSeason]

          // Update system_settings
          const { error: updateError } = await supabase
            .from("system_settings")
            .update({ value: updatedSeasons })
            .eq("key", "seasons")

          if (updateError) {
            throw new Error(`Failed to create season in system_settings: ${updateError.message}`)
          }

          toast({
            title: "Success",
            description: `Season "${newSeasonName}" created successfully in system settings`,
          })
        } else {
          throw new Error(`Failed to create season: ${error.message}`)
        }
      } else {
        toast({
          title: "Success",
          description: `Season "${newSeasonName}" created successfully`,
        })
      }

      setNewSeasonName("")
      setIsSeasonDialogOpen(false)

      // Refresh seasons
      await fetchSeasons()
    } catch (error: any) {
      console.error("Error creating season:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create season",
        variant: "destructive",
      })
    }
  }

  // Handle form input changes
  const handleInputChange = (field: keyof MatchFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Open dialog to create/edit match
  const openMatchDialog = (match?: any) => {
    if (match) {
      // Edit existing match
      setCurrentMatch(match)

      try {
        // Parse date and time from match date
        const matchDate = new Date(match[dateColumnName])
        const formattedDate = format(matchDate, "yyyy-MM-dd")
        const formattedTime = format(matchDate, "HH:mm")

        // Format status with proper capitalization
        const formattedStatus = formatStatusForDisplay(match.status)

        // Get season name - either from season_name column or from the seasons array
        let seasonName = match.season_name || ""
        if (!seasonName && match.season_id) {
          const season = seasons.find((s) => {
            // Handle both string and number comparisons
            if (typeof s.id === "string" && typeof match.season_id === "string") {
              return s.id === match.season_id
            } else if (typeof s.id === "string" && typeof match.season_id === "number") {
              // Try to extract numbers from UUID and compare
              const numericId = s.id.replace(/\D/g, "")
              return numericId === match.season_id.toString()
            } else {
              return s.id === match.season_id
            }
          })

          if (season) {
            seasonName = season.name
          }
        }

        // Set form data with match data
        setFormData({
          homeTeamId: match.home_team_id,
          awayTeamId: match.away_team_id,
          date: formattedDate,
          time: formattedTime,
          seasonName: seasonName || defaultSeasonName,
          homeScore: match.home_score !== null ? String(match.home_score) : "",
          awayScore: match.away_score !== null ? String(match.away_score) : "",
          status: formattedStatus as MatchStatus,
          overtime: match.overtime === true, // Add this line
        })
      } catch (error) {
        console.error("Error formatting date:", error)
        toast({
          title: "Error",
          description: "There was a problem loading the match data.",
          variant: "destructive",
        })
      }
    } else {
      // Create new match
      setCurrentMatch(null)

      // Use today's date and time as default
      const now = new Date()
      const formattedDate = format(now, "yyyy-MM-dd")
      const formattedTime = format(now, "HH:mm")

      // Use the default season name if available, otherwise use empty string
      const initialSeasonName = defaultSeasonName || (seasons.length > 0 ? seasons[0].name : "")

      console.log("Creating new match with season name:", initialSeasonName) // Debug: log the selected season name

      setFormData({
        homeTeamId: "",
        awayTeamId: "",
        date: formattedDate,
        time: formattedTime,
        seasonName: initialSeasonName,
        homeScore: "",
        awayScore: "",
        status: "Scheduled",
        overtime: false, // Add this line
      })
    }
    setFormErrors({})
    setIsDialogOpen(true)
  }

  // Format status for display (capitalize first letter of each word)
  const formatStatusForDisplay = (status: string): string => {
    if (!status) return "Scheduled"

    // If status is already in the correct format, return it
    if (
      status === "Scheduled" ||
      status === "In Progress" ||
      status === "Completed" ||
      status === "Postponed" ||
      status === "Cancelled"
    ) {
      return status
    }

    // Otherwise, format it
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  // Format status for database (match the expected format in the database)
  const formatStatusForDatabase = (status: string): string => {
    return status // Return as is since we're now using the correct format
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (match: any) => {
    setCurrentMatch(match)
    setIsDeleteDialogOpen(true)
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.homeTeamId) errors.homeTeamId = "Home team is required"
    if (!formData.awayTeamId) errors.awayTeamId = "Away team is required"
    if (!formData.date) errors.date = "Date is required"
    if (!formData.time) errors.time = "Time is required"

    // Only validate seasonName if seasons exist
    if (seasons.length > 0 && !formData.seasonName) {
      errors.seasonName = "Season is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Find season ID by name
  const findSeasonIdByName = (name: string): string | number | null => {
    const season = seasons.find((s) => s.name === name)
    if (!season) return null

    // If we have a type mismatch (UUID in seasons but integer in matches)
    if (seasonIdType === "integer" && typeof season.id === "string" && season.id.includes("-")) {
      try {
        // Generate a stable integer from the UUID
        // Use a simple hash function to convert the UUID to a positive integer
        let hash = 0
        for (let i = 0; i < season.id.length; i++) {
          const char = season.id.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash // Convert to 32bit integer
        }
        // Make sure it's positive and within safe integer range
        return Math.abs(hash) % 2147483647 // Max PostgreSQL integer
      } catch (error) {
        console.error("Error converting UUID to integer:", error)
        // Fallback to a simple number
        return Math.floor(Math.random() * 1000000) + 1
      }
    }

    return season.id
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`)

      // Prepare match data
      const matchData: any = {
        home_team_id: formData.homeTeamId,
        away_team_id: formData.awayTeamId,
        home_score: formData.homeScore ? Number.parseInt(formData.homeScore) : null,
        away_score: formData.awayScore ? Number.parseInt(formData.awayScore) : null,
        status: formatStatusForDatabase(formData.status),
        overtime: formData.overtime, // Add this line
      }

      // Set the date using the correct column name
      matchData[dateColumnName] = dateTime.toISOString()

      // Only add season_name if the column exists
      if (hasSeasonNameColumn) {
        matchData.season_name = formData.seasonName
      }

      // Always set season_id for backward compatibility
      if (formData.seasonName && seasons.length > 0) {
        const seasonId = findSeasonIdByName(formData.seasonName)
        if (seasonId !== null) {
          // If we're updating an existing match, check the type of the current season_id
          if (currentMatch && currentMatch.season_id !== null) {
            const currentType = typeof currentMatch.season_id
            if (currentType === "number" && typeof seasonId === "string") {
              // Need to convert string to number
              try {
                matchData.season_id = Number.parseInt(seasonId, 10)
              } catch (e) {
                // If conversion fails, use a hash
                matchData.season_id = findSeasonIdByName(formData.seasonName)
              }
            } else {
              matchData.season_id = seasonId
            }
          } else {
            matchData.season_id = seasonId
          }
        }
      }

      // For debugging
      console.log("Saving match data:", matchData)

      if (currentMatch) {
        // Update existing match
        const { error } = await supabase.from("matches").update(matchData).eq("id", currentMatch.id)

        if (error) {
          console.error("Error updating match:", error)

          // If the error is about season_id type mismatch, try to fix it
          if (error.message.includes("invalid input syntax for type integer")) {
            // Try to convert the season_id to an integer
            if (typeof matchData.season_id === "string") {
              try {
                // Generate a simple numeric hash from the string
                let hash = 0
                for (let i = 0; i < matchData.season_id.length; i++) {
                  const char = matchData.season_id.charCodeAt(i)
                  hash = (hash << 5) - hash + char
                  hash = hash & hash // Convert to 32bit integer
                }
                // Make sure it's positive and within safe integer range
                matchData.season_id = Math.abs(hash) % 2147483647 // Max PostgreSQL integer

                // Try again with the numeric ID
                const { error: retryError } = await supabase.from("matches").update(matchData).eq("id", currentMatch.id)
                if (retryError) throw retryError
              } catch (e) {
                // If that fails, try without the season_id
                delete matchData.season_id
                const { error: finalError } = await supabase.from("matches").update(matchData).eq("id", currentMatch.id)
                if (finalError) throw finalError
              }
            } else {
              // If it's not a string, try without the season_id
              delete matchData.season_id
              const { error: finalError } = await supabase.from("matches").update(matchData).eq("id", currentMatch.id)
              if (finalError) throw finalError
            }
          }
          // If the error is about season_name not existing, try again without it
          else if (error.message.includes("season_name") && error.message.includes("does not exist")) {
            delete matchData.season_name
            const { error: retryError } = await supabase.from("matches").update(matchData).eq("id", currentMatch.id)
            if (retryError) throw retryError
          } else {
            throw error
          }
        }

        toast({
          title: "Match updated",
          description: "The match has been updated successfully.",
        })
      } else {
        // Create new match
        const { error } = await supabase.from("matches").insert(matchData)

        if (error) {
          console.error("Error creating match:", error)

          // If the error is about season_id type mismatch, try to fix it
          if (error.message.includes("invalid input syntax for type integer")) {
            // Try to convert the season_id to an integer
            if (typeof matchData.season_id === "string") {
              try {
                // Generate a simple numeric hash from the string
                let hash = 0
                for (let i = 0; i < matchData.season_id.length; i++) {
                  const char = matchData.season_id.charCodeAt(i)
                  hash = (hash << 5) - hash + char
                  hash = hash & hash // Convert to 32bit integer
                }
                // Make sure it's positive and within safe integer range
                matchData.season_id = Math.abs(hash) % 2147483647 // Max PostgreSQL integer

                // Try again with the numeric ID
                const { error: retryError } = await supabase.from("matches").insert(matchData)
                if (retryError) throw retryError
              } catch (e) {
                // If that fails, try without the season_id
                delete matchData.season_id
                const { error: finalError } = await supabase.from("matches").insert(matchData)
                if (finalError) throw finalError
              }
            } else {
              // If it's not a string, try without the season_id
              delete matchData.season_id
              const { error: finalError } = await supabase.from("matches").insert(matchData)
              if (finalError) throw finalError
            }
          }
          // If the error is about season_name not existing, try again without it
          else if (error.message.includes("season_name") && error.message.includes("does not exist")) {
            delete matchData.season_name
            const { error: retryError } = await supabase.from("matches").insert(matchData)
            if (retryError) throw retryError
          } else {
            throw error
          }
        }

        toast({
          title: "Match created",
          description: "The match has been created successfully.",
        })
      }

      // Close dialog and refresh matches
      setIsDialogOpen(false)
      fetchMatches()
    } catch (error: any) {
      console.error("Error saving match:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save match",
        variant: "destructive",
      })
    }
  }

  // Handle match deletion
  const deleteMatch = async () => {
    if (!currentMatch) return

    try {
      const { error } = await supabase.from("matches").delete().eq("id", currentMatch.id)

      if (error) throw error

      toast({
        title: "Match deleted",
        description: "The match has been deleted successfully.",
      })

      // Close dialog and refresh matches
      setIsDeleteDialogOpen(false)
      fetchMatches()
    } catch (error: any) {
      console.error("Error deleting match:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete match",
        variant: "destructive",
      })
    }
  }

  // Filter matches based on active tab
  const filteredMatches = matches.filter((match) => {
    const today = new Date()
    const matchDate = new Date(match[dateColumnName])

    switch (activeTab) {
      case "upcoming":
        return matchDate >= today && match.status !== "Completed"
      case "completed":
        return match.status === "Completed"
      case "all":
        return true
      default:
        return true
    }
  })

  // Download matches as CSV
  const downloadMatchesAsCSV = () => {
    try {
      // Create CSV header
      let csv = "Date,Time,Home Team,Away Team,Home Score,Away Score,Status,Season\n"

      // Add match data
      filteredMatches.forEach((match) => {
        const matchDate = new Date(match[dateColumnName])
        const date = format(matchDate, "yyyy-MM-dd")
        const time = format(matchDate, "HH:mm")
        const homeTeam = match.home_team?.name || "Unknown"
        const awayTeam = match.away_team?.name || "Unknown"
        const homeScore = match.home_score !== null ? match.home_score : ""
        const awayScore = match.away_score !== null ? match.away_score : ""
        const status = formatStatusForDisplay(match.status)
        const season = match.season_name || ""

        // Escape fields that might contain commas
        const escapeCsvField = (field: string) => {
          if (field.includes(",") || field.includes('"') || field.includes("\n")) {
            return `"${field.replace(/"/g, '""')}"`
          }
          return field
        }

        csv += `${date},${time},${escapeCsvField(homeTeam)},${escapeCsvField(awayTeam)},${homeScore},${awayScore},${status},${escapeCsvField(season)}\n`
      })

      // Create a blob and download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `matches_${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `${filteredMatches.length} matches exported to CSV`,
      })
    } catch (error: any) {
      console.error("Error downloading CSV:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download matches as CSV",
        variant: "destructive",
      })
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0])
    }
  }

  // Open file input dialog
  const openFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Parse CSV file
  const parseCSV = (text: string): CSVMatch[] => {
    // Split by lines and remove empty lines
    const lines = text.split("\n").filter((line) => line.trim() !== "")
    if (lines.length < 2) {
      throw new Error("CSV file must contain a header row and at least one data row")
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const requiredColumns = ["date", "time", "home team", "away team"]
    const missingColumns = requiredColumns.filter((col) => !header.includes(col))
    if (missingColumns.length > 0) {
      throw new Error(`CSV is missing required columns: ${missingColumns.join(", ")}`)
    }

    // Parse data rows
    const matches: CSVMatch[] = []
    for (let i = 1; i < lines.length; i++) {
      // Handle quoted fields with commas
      const line = lines[i]
      const fields: string[] = []
      let inQuotes = false
      let currentField = ""

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          fields.push(currentField)
          currentField = ""
        } else {
          currentField += char
        }
      }
      fields.push(currentField) // Add the last field

      // Clean up quoted fields
      const cleanFields = fields.map((field) => {
        field = field.trim()
        if (field.startsWith('"') && field.endsWith('"')) {
          field = field.substring(1, field.length - 1).replace(/""/g, '"')
        }
        return field
      })

      // Map fields to match object
      const match: CSVMatch = {
        date: cleanFields[header.indexOf("date")],
        time: cleanFields[header.indexOf("time")],
        homeTeam: cleanFields[header.indexOf("home team")],
        awayTeam: cleanFields[header.indexOf("away team")],
      }

      // Add optional fields if they exist
      if (header.includes("home score")) {
        match.homeScore = cleanFields[header.indexOf("home score")]
      }
      if (header.includes("away score")) {
        match.awayScore = cleanFields[header.indexOf("away score")]
      }
      if (header.includes("status")) {
        match.status = cleanFields[header.indexOf("status")]
      }
      if (header.includes("season")) {
        match.season = cleanFields[header.indexOf("season")]
      }

      matches.push(match)
    }

    return matches
  }

  // Upload matches from CSV
  const uploadMatchesFromCSV = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file first",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResults(null)

    try {
      // Read file
      const text = await csvFile.text()
      const matches = parseCSV(text)

      // Validate matches
      if (matches.length === 0) {
        throw new Error("No valid matches found in the CSV file")
      }

      // Create a map of team names to IDs
      const teamMap = new Map<string, string>()
      teams.forEach((team) => {
        teamMap.set(team.name.toLowerCase(), team.id)
      })

      // Process matches
      const results = {
        total: matches.length,
        success: 0,
        errors: [] as string[],
      }

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        setUploadProgress(Math.round(((i + 1) / matches.length) * 100))

        try {
          // Validate required fields
          if (!match.date || !match.time || !match.homeTeam || !match.awayTeam) {
            throw new Error("Missing required fields")
          }

          // Find team IDs
          const homeTeamId = teamMap.get(match.homeTeam.toLowerCase())
          const awayTeamId = teamMap.get(match.awayTeam.toLowerCase())

          if (!homeTeamId) {
            throw new Error(`Home team "${match.homeTeam}" not found`)
          }
          if (!awayTeamId) {
            throw new Error(`Away team "${match.awayTeam}" not found`)
          }

          // Parse date and time
          let dateTime: Date
          try {
            // Clean up the time value - remove any extra spaces and ensure it's in HH:MM format
            let cleanTime = match.time.trim()

            // If time doesn't have seconds, add them (e.g., "20:30" becomes "20:30:00")
            if (cleanTime.match(/^\d{1,2}:\d{2}$/)) {
              cleanTime = cleanTime + ":00"
            }

            // Try different date and time format combinations
            const dateFormats = [
              "yyyy-MM-dd HH:mm:ss",
              "yyyy-MM-dd HH:mm",
              "MM/dd/yyyy HH:mm:ss",
              "MM/dd/yyyy HH:mm",
              "M/d/yyyy HH:mm:ss",
              "M/d/yyyy HH:mm",
            ]

            let parsed = false
            for (const dateFormat of dateFormats) {
              try {
                dateTime = parse(`${match.date} ${cleanTime}`, dateFormat, new Date())
                if (!isNaN(dateTime.getTime())) {
                  parsed = true
                  break
                }
              } catch (e) {
                // Continue to next format
              }
            }

            if (!parsed) {
              throw new Error(`Could not parse date/time: ${match.date} ${match.time}`)
            }
          } catch (e) {
            throw new Error(
              `Invalid date/time format: ${match.date} ${match.time}. Expected formats: YYYY-MM-DD HH:MM or MM/DD/YYYY HH:MM`,
            )
          }

          // Prepare match data
          const matchData: any = {
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            [dateColumnName]: dateTime.toISOString(),
            status: match.status ? formatStatusForDatabase(match.status) : "Scheduled",
          }

          // Add scores if provided
          if (match.homeScore && match.homeScore.trim() !== "") {
            matchData.home_score = Number.parseInt(match.homeScore, 10)
          }
          if (match.awayScore && match.awayScore.trim() !== "") {
            matchData.away_score = Number.parseInt(match.awayScore, 10)
          }

          // Add season if provided
          if (match.season && match.season.trim() !== "") {
            if (hasSeasonNameColumn) {
              matchData.season_name = match.season
            }

            // Find season ID
            const season = seasons.find((s) => s.name.toLowerCase() === match.season?.toLowerCase())
            if (season) {
              const seasonId = findSeasonIdByName(season.name)
              if (seasonId !== null) {
                matchData.season_id = seasonId
              }
            }
          } else if (defaultSeasonName) {
            // Use default season if available
            if (hasSeasonNameColumn) {
              matchData.season_name = defaultSeasonName
            }

            const seasonId = findSeasonIdByName(defaultSeasonName)
            if (seasonId !== null) {
              matchData.season_id = seasonId
            }
          }

          // Insert match
          const { error } = await supabase.from("matches").insert(matchData)

          if (error) {
            // Handle season_id type mismatch
            if (error.message.includes("invalid input syntax for type")) {
              delete matchData.season_id
              const { error: retryError } = await supabase.from("matches").insert(matchData)
              if (retryError) throw retryError
            }
            // Handle season_name not existing
            else if (error.message.includes("season_name") && error.message.includes("does not exist")) {
              delete matchData.season_name
              const { error: retryError } = await supabase.from("matches").insert(matchData)
              if (retryError) throw retryError
            } else {
              throw error
            }
          }

          results.success++
        } catch (error: any) {
          console.error(`Error processing match ${i + 1}:`, error)
          results.errors.push(`Row ${i + 1}: ${error.message || "Unknown error"}`)
        }
      }

      setUploadResults(results)
      toast({
        title: "Upload complete",
        description: `Successfully imported ${results.success} of ${results.total} matches`,
      })

      // Refresh matches
      fetchMatches()
      setIsUploadDialogOpen(false)
      setCsvFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Error uploading CSV:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload matches from CSV",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Loading Schedule Management...</p>
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
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <div className="w-20 h-20 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-ice-blue-500/25">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h1 className="hockey-title mb-6">
              Schedule Management
            </h1>
            <p className="hockey-subtitle mx-auto mb-8 max-w-3xl">
              Comprehensive game schedule management and match tracking. Create, edit, and monitor all league matches with advanced scheduling tools.
            </p>
            
            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/30 dark:border-assist-green-700/30">
                <Calendar className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Match Scheduling</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <Trophy className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Season Management</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-4 py-2 rounded-full border border-goal-red-200/30 dark:border-goal-red-700/30">
                <Database className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">CSV Import/Export</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <Settings className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Advanced Controls</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Enhanced Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Match Management</h2>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Create and manage league matches</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsSeasonDialogOpen(true)} 
              className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Season
            </Button>
            <Button 
              onClick={downloadMatchesAsCSV} 
              className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
            <Button 
              onClick={() => setIsUploadDialogOpen(true)} 
              className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Upload className="mr-2 h-4 w-4" /> Upload CSV
            </Button>
            <Button 
              onClick={() => openMatchDialog()}
              className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Match
            </Button>
          </div>
        </div>

        {seasonError && (
          <Alert className="mb-6 border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
            <AlertCircle className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
            <AlertTitle className="text-goal-red-800 dark:text-goal-red-200 font-bold">Season Error</AlertTitle>
            <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">{seasonError}</AlertDescription>
          </Alert>
        )}

        {fetchError && (
          <Alert className="mb-6 border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20">
            <AlertCircle className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
            <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Warning</AlertTitle>
            <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">{fetchError}</AlertDescription>
          </Alert>
        )}

        {!hasSeasonNameColumn && (
          <Alert className="mb-6 border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20">
            <AlertCircle className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
            <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Database Update Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 text-hockey-silver-700 dark:text-hockey-silver-300">
              <p>The season_name column needs to be added to the matches table.</p>
              <Button 
                onClick={runSeasonNameMigration} 
                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit"
                disabled={migrationRunning}
              >
                {migrationRunning ? "Adding Column..." : "Add Column Now"}
              </Button>
              <p className="text-xs">
                Note: If this doesn't work, you can run the SQL manually from the migrations folder. The system will still
                work without the column.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {seasonIdType === "uuid" && (
          <Alert className="mb-6 border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20">
            <AlertCircle className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
            <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Type Mismatch Warning</AlertTitle>
            <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">
              <p>
                There appears to be a type mismatch between season IDs in the seasons table (UUID) and the matches table
                (integer).
              </p>
              <p className="text-xs mt-2">
                The system will try to handle this automatically by converting between types, but you may see some
                unexpected behavior. Using season names instead of IDs will help avoid these issues.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {seasons.length > 0 && (
          <Card className="hockey-card hockey-card-hover mb-6 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                    Available Seasons: <span className="text-assist-green-600 dark:text-assist-green-400">{seasons.map((s) => s.name).join(", ")}</span>
                  </p>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Active Season: <span className="font-semibold text-ice-blue-600 dark:text-ice-blue-400">{seasons.find((s) => s.is_active)?.name || "None"}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <TabsTrigger 
                value="upcoming" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Calendar className="h-4 w-4" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4" />
                Completed
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-silver-500 data-[state=active]:to-hockey-silver-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Database className="h-4 w-4" />
                All Matches
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {filteredMatches.length === 0 ? (
          <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-hockey-silver-500/25">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">No Matches Found</h3>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6 max-w-md mx-auto">
                No matches found for the selected filter. Create a new match or adjust your search criteria.
              </p>
              <Button 
                onClick={() => openMatchDialog()}
                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Match
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
            <CardHeader className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-t-lg"></div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Match Schedule</CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    {filteredMatches.length} matches found • {activeTab === "upcoming" ? "Upcoming games" : activeTab === "completed" ? "Completed games" : "All matches"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-xl border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Date & Time</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Home Team</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Away Team</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Score</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Status</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Season</TableHead>
                      <TableHead className="text-right text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match) => {
                      // Get season name - either from season_name column or from the seasons array
                      let seasonName = match.season_name || ""
                      if (!seasonName && match.season_id) {
                        const season = seasons.find((s) => {
                          // Handle both string and number comparisons
                          if (typeof s.id === "string" && typeof match.season_id === "string") {
                            return s.id === match.season_id
                          } else if (typeof s.id === "string" && typeof match.season_id === "number") {
                            // Try to extract numbers from UUID and compare
                            const numericId = s.id.replace(/\D/g, "")
                            return numericId === match.season_id.toString()
                          } else {
                            return s.id === match.season_id
                          }
                        })

                        if (season) {
                          seasonName = season.name
                        }
                      }

                      return (
                        <TableRow 
                          key={match.id}
                          className="hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30"
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">{format(new Date(match[dateColumnName]), "MMM d, yyyy")}</span>
                              <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(match[dateColumnName]), "h:mm a")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                              {match.home_team?.name || "Unknown Team"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                              {match.away_team?.name || "Unknown Team"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {match.home_score !== null && match.away_score !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                                    {match.home_score} - {match.away_score}
                                  </span>
                                  {match.overtime && (
                                    <span className="text-xs bg-gradient-to-r from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/30 text-goal-red-700 dark:text-goal-red-300 px-2 py-1 rounded-full border border-goal-red-300 dark:border-goal-red-600">
                                      OT
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">TBD</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="capitalize font-medium">
                              {match.status === "Completed" ? (
                                <span className="text-assist-green-600 dark:text-assist-green-400">Completed</span>
                              ) : match.status === "In Progress" ? (
                                <span className="text-ice-blue-600 dark:text-ice-blue-400">In Progress</span>
                              ) : match.status === "Postponed" ? (
                                <span className="text-hockey-silver-600 dark:text-hockey-silver-400">Postponed</span>
                              ) : match.status === "Cancelled" ? (
                                <span className="text-goal-red-600 dark:text-goal-red-400">Cancelled</span>
                              ) : (
                                <span className="text-hockey-silver-600 dark:text-hockey-silver-400">Scheduled</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                              {seasonName || "No Season"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openMatchDialog(match)}
                                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openDeleteDialog(match)}
                                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Match Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                {currentMatch ? "Edit Match" : "Create Match"}
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
                {currentMatch ? "Update the details for this match." : "Enter the details for the new match."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="seasonName" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Trophy className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Season
                  </Label>
                  {seasons.length > 0 ? (
                    <Select value={formData.seasonName} onValueChange={(value) => handleInputChange("seasonName", value)}>
                      <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season.id} value={season.name}>
                            {season.name} {season.is_active ? "(Active)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input disabled value="No seasons available" className="hockey-search" />
                      <Button 
                        type="button" 
                        onClick={() => setIsSeasonDialogOpen(true)}
                        className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                      >
                        Create
                      </Button>
                    </div>
                  )}
                  {formErrors.seasonName && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.seasonName}</p>}
                  {!hasSeasonNameColumn && (
                    <p className="text-xs p-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-200/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20 rounded-lg border border-hockey-silver-200/30 dark:border-hockey-silver-700/30 text-hockey-silver-600 dark:text-hockey-silver-400">
                      Note: The season_name column doesn't exist yet. The season will be stored by ID.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="status" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Settings className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value as MatchStatus)}
                  >
                    <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Postponed">Postponed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.status && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.status}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="date" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Calendar className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Date
                  </Label>
                  <div className="flex items-center">
                    <Calendar className="mr-3 h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                    />
                  </div>
                  {formErrors.date && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.date}</p>}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="time" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Clock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Time
                  </Label>
                  <div className="flex items-center">
                    <Clock className="mr-3 h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                    />
                  </div>
                  {formErrors.time && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.time}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="homeTeamId" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Users className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Home Team
                  </Label>
                  <Select value={formData.homeTeamId} onValueChange={(value) => handleInputChange("homeTeamId", value)}>
                    <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                      <SelectValue placeholder="Select home team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.homeTeamId && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.homeTeamId}</p>}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="awayTeamId" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Users className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Away Team
                  </Label>
                  <Select value={formData.awayTeamId} onValueChange={(value) => handleInputChange("awayTeamId", value)}>
                    <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                      <SelectValue placeholder="Select away team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.awayTeamId && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.awayTeamId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="homeScore" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Target className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Home Score
                  </Label>
                  <Input
                    id="homeScore"
                    type="number"
                    placeholder="Home Score"
                    value={formData.homeScore}
                    onChange={(e) => handleInputChange("homeScore", e.target.value)}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                  {formErrors.homeScore && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.homeScore}</p>}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="awayScore" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Target className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Away Score
                  </Label>
                  <Input
                    id="awayScore"
                    type="number"
                    placeholder="Away Score"
                    value={formData.awayScore}
                    onChange={(e) => handleInputChange("awayScore", e.target.value)}
                    className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                  {formErrors.awayScore && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">{formErrors.awayScore}</p>}
                </div>
              </div>

              <div className="space-y-4 p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="overtime"
                    checked={formData.overtime}
                    onCheckedChange={(checked) => handleInputChange("overtime", checked === true)}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-ice-blue-500 data-[state=checked]:to-rink-blue-600 data-[state=checked]:border-ice-blue-500"
                  />
                  <Label htmlFor="overtime" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    Game went to overtime (affects standings calculations)
                  </Label>
                </div>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Check this box if the game was decided in overtime or shootout. This ensures teams get the correct
                  points in standings.
                </p>
              </div>

              <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                <Button 
                  type="button" 
                  onClick={() => setIsDialogOpen(false)}
                  className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  {currentMatch ? "Update Match" : "Create Match"}
                </Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-white" />
                </div>
                Delete Match
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
                Are you sure you want to delete this match? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Button 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={deleteMatch}
                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Season Dialog */}
        <Dialog open={isSeasonDialogOpen} onOpenChange={setIsSeasonDialogOpen}>
          <DialogContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                Create Season
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
                Enter a name for the new season.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-3">
                <Label htmlFor="seasonName" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <Trophy className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                  Season Name
                </Label>
                <Input
                  id="seasonName"
                  placeholder="e.g., Season 1"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Button 
                onClick={() => setIsSeasonDialogOpen(false)}
                className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={createSeason}
                className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Create Season
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload CSV Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                  <Upload className="h-4 w-4 text-white" />
                </div>
                Upload Matches from CSV
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
                Upload a CSV file with match data. The file must include columns for Date, Time, Home Team, and Away Team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-3">
                <Label htmlFor="csvFile" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <Database className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                  CSV File
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    onClick={openFileInput} 
                    className="w-full hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {csvFile ? csvFile.name : "Select CSV File"}
                  </Button>
                </div>
                {csvFile && <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">{csvFile.name}</p>}
              </div>

              {isUploading && (
                <div className="space-y-3 p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <Label className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Zap className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Upload Progress
                  </Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">{uploadProgress}%</p>
                </div>
              )}

              {uploadResults && (
                <div className="space-y-4 p-4 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-800/10 rounded-lg border-2 border-assist-green-200/30 dark:border-assist-green-700/30">
                  <h3 className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                    Upload Results
                  </h3>
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Successfully imported {uploadResults.success} of {uploadResults.total} matches.
                  </p>
                  {uploadResults.errors.length > 0 && (
                    <div>
                      <p className="font-bold text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Errors:
                      </p>
                      <ul className="text-sm text-goal-red-600 dark:text-goal-red-400 list-disc pl-5 space-y-1 max-h-40 overflow-y-auto mt-2">
                        {uploadResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 p-4 bg-gradient-to-r from-hockey-silver-50/30 to-hockey-silver-100/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-800/10 rounded-lg border-2 border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <h3 className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                  CSV Format
                </h3>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Your CSV file should have the following columns:</p>
                <ul className="text-sm list-disc pl-5 space-y-2 text-hockey-silver-600 dark:text-hockey-silver-400">
                  <li>
                    <span className="font-bold text-assist-green-600 dark:text-assist-green-400">Required:</span> Date (YYYY-MM-DD), Time (HH:MM), Home Team, Away Team
                  </li>
                  <li>
                    <span className="font-bold text-ice-blue-600 dark:text-ice-blue-400">Optional:</span> Home Score, Away Score, Status, Season
                  </li>
                </ul>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                  Team names must match exactly with the teams in the database.
                </p>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Button 
                onClick={() => setIsUploadDialogOpen(false)} 
                disabled={isUploading}
                className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={uploadMatchesFromCSV} 
                disabled={!csvFile || isUploading}
                className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hidden file input for CSV upload */}
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  )
}
