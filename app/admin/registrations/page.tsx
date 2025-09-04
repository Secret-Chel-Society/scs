"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Download, Search, AlertCircle, RefreshCw, User, MapPin, Gamepad2, Edit, Users, Calendar, Trophy, Shield, CheckCircle, XCircle, Clock, FileText, Settings, UserPlus, Database, Filter, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion } from "framer-motion"

export default function RegistrationsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSeason, setActiveSeason] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEditPositionsOpen, setIsEditPositionsOpen] = useState(false)
  const [isEditConsoleOpen, setIsEditConsoleOpen] = useState(false)
  const [editingRegistration, setEditingRegistration] = useState<any | null>(null)
  const [newGamerTag, setNewGamerTag] = useState("")
  const [newPrimaryPosition, setNewPrimaryPosition] = useState("")
  const [newSecondaryPosition, setNewSecondaryPosition] = useState("")
  const [newConsole, setNewConsole] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAllRegistrations, setShowAllRegistrations] = useState(false)

  const positionOptions = [
    "Center",
    "Left Wing",
    "Right Wing",
    "Left Defense",
    "Right Defense",
    "Goalie",
    "Forward",
    "Defense",
    "Any",
  ]

  const consoleOptions = ["PlayStation 5", "Xbox Series X/S"]

  useEffect(() => {
    async function fetchActiveSeason() {
      try {
        // First get the current active season ID from system_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (settingsError) {
          console.error("Error fetching current season setting:", settingsError)
          setError(`Error fetching current season: ${settingsError.message}`)
          setLoading(false)
          return
        }

        const currentSeasonId = settingsData?.value

        if (!currentSeasonId) {
          setError("No active season found. Please set an active season in the admin settings.")
          setLoading(false)
          return
        }

        // Try to get all seasons to find the one we need
        const { data: allSeasons, error: allSeasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false })

        if (allSeasonsError) {
          console.error("Error fetching all seasons:", allSeasonsError)
          setError(`Error fetching all seasons: ${allSeasonsError.message}`)
          setLoading(false)
          return
        }

        // Find the active season in the list
        let activeSeason = null

        // First try exact match
        activeSeason = allSeasons?.find((season) => season.id === currentSeasonId)

        // If that fails, try string comparison (in case of integer vs string)
        if (!activeSeason) {
          activeSeason = allSeasons?.find((season) => String(season.id) === String(currentSeasonId))
          if (activeSeason) {
          }
        }

        // If that fails, try to find by name containing the ID (some systems store "Season 1" instead of just "1")
        if (!activeSeason) {
          activeSeason = allSeasons?.find(
            (season) =>
              season.name.includes(currentSeasonId) || season.name.toLowerCase().includes(`season ${currentSeasonId}`),
          )
          if (activeSeason) {
          }
        }

        // If all else fails, just use the most recent season
        if (!activeSeason && allSeasons && allSeasons.length > 0) {
          activeSeason = allSeasons[0]
        }

        if (!activeSeason) {
          setError(`No season found matching ID: ${currentSeasonId}`)
          setLoading(false)
          return
        }

        setActiveSeason(activeSeason)

        // Now fetch registrations for this season
        fetchRegistrations()
      } catch (error: any) {
        console.error("Error in fetchActiveSeason:", error)
        setError(`Error fetching active season: ${error.message}`)
        setLoading(false)
      }
    }

    fetchActiveSeason()
  }, [supabase])

  useEffect(() => {
    filterRegistrations()
  }, [registrations, searchTerm, statusFilter])

  async function fetchRegistrations() {
    setLoading(true)
    setError(null)

    try {
      // Get all registrations
      const { data: allRegistrations, error: allRegError } = await supabase
        .from("season_registrations")
        .select(`
          *,
          users:user_id (
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (allRegError) {
        throw allRegError
      }

      // Log all registrations for debugging
      console.log("All registrations:", allRegistrations)

      // Set registrations to all registrations
      setRegistrations(allRegistrations || [])
      setFilteredRegistrations(allRegistrations || [])

      if (!allRegistrations || allRegistrations.length === 0) {
        setError("No registrations found in the system.")
      }
    } catch (error: any) {
      console.error("Error fetching registrations:", error)
      setError(error.message)
      toast({
        title: "Error fetching registrations",
        description: error.message,
        variant: "destructive",
      })
      setRegistrations([])
      setFilteredRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  function filterRegistrations() {
    let filtered = [...registrations]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (reg) => reg.gamer_tag?.toLowerCase().includes(term) || reg.users?.email?.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((reg) => reg.status === statusFilter)
    }

    setFilteredRegistrations(filtered)
  }

  async function updateStatus(id: string, status: string) {
    try {
      const { error } = await supabase.from("season_registrations").update({ status }).eq("id", id)

      if (error) throw error

      // Update local state
      setRegistrations(registrations.map((reg) => (reg.id === id ? { ...reg, status } : reg)))

      toast({
        title: "Status updated",
        description: `Registration status updated to ${status}`,
      })
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "Approved":
        return <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-md flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>
      case "Rejected":
        return <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
      case "Pending":
        return <Badge className="bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white shadow-md flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>
      default:
        return <Badge className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white shadow-md">{status}</Badge>
    }
  }

  function exportToCSV() {
    // Create CSV content
    const headers = [
      "Player Name",
      "Email",
      "Primary Position",
      "Secondary Position",
      "Console",
      "Status",
      "Registration Date",
    ]
    const csvRows = [headers]

    filteredRegistrations.forEach((reg) => {
      const row = [
        reg.gamer_tag || "",
        reg.users?.email || "",
        reg.primary_position || "",
        reg.secondary_position || "",
        reg.console || "",
        reg.status || "",
        new Date(reg.created_at).toLocaleString() || "",
      ]
      csvRows.push(row)
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `registrations-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function viewRegistrationDetails(registration: any) {
    setSelectedRegistration(registration)
    setIsDialogOpen(true)
  }

  function openEditName(registration: any) {
    setEditingRegistration(registration)
    setNewGamerTag(registration.gamer_tag || "")
    setIsEditNameOpen(true)
  }

  function openEditPositions(registration: any) {
    setEditingRegistration(registration)
    setNewPrimaryPosition(registration.primary_position || "")
    setNewSecondaryPosition(registration.secondary_position || "")
    setIsEditPositionsOpen(true)
  }

  function openEditConsole(registration: any) {
    setEditingRegistration(registration)
    setNewConsole(registration.console || "")
    setIsEditConsoleOpen(true)
  }

  async function updatePlayerName() {
    if (!editingRegistration || !newGamerTag.trim()) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("season_registrations")
        .update({ gamer_tag: newGamerTag.trim() })
        .eq("id", editingRegistration.id)

      if (error) throw error

      // Update local state
      const updatedRegistrations = registrations.map((reg) =>
        reg.id === editingRegistration.id ? { ...reg, gamer_tag: newGamerTag.trim() } : reg,
      )
      setRegistrations(updatedRegistrations)

      toast({
        title: "Player name updated",
        description: `Player name updated to ${newGamerTag.trim()}`,
      })

      setIsEditNameOpen(false)
    } catch (error: any) {
      console.error("Error updating player name:", error)
      toast({
        title: "Error updating player name",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function updatePositions() {
    if (!editingRegistration || !newPrimaryPosition) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("season_registrations")
        .update({
          primary_position: newPrimaryPosition,
          secondary_position: newSecondaryPosition || null,
        })
        .eq("id", editingRegistration.id)

      if (error) throw error

      // Update local state
      const updatedRegistrations = registrations.map((reg) =>
        reg.id === editingRegistration.id
          ? {
              ...reg,
              primary_position: newPrimaryPosition,
              secondary_position: newSecondaryPosition || null,
            }
          : reg,
      )
      setRegistrations(updatedRegistrations)

      toast({
        title: "Positions updated",
        description: `Player positions have been updated`,
      })

      setIsEditPositionsOpen(false)
    } catch (error: any) {
      console.error("Error updating positions:", error)
      toast({
        title: "Error updating positions",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function updateConsole() {
    if (!editingRegistration || !newConsole) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("season_registrations")
        .update({ console: newConsole })
        .eq("id", editingRegistration.id)

      if (error) throw error

      // Update local state
      const updatedRegistrations = registrations.map((reg) =>
        reg.id === editingRegistration.id ? { ...reg, console: newConsole } : reg,
      )
      setRegistrations(updatedRegistrations)

      toast({
        title: "Console updated",
        description: `Player console updated to ${newConsole}`,
      })

      setIsEditConsoleOpen(false)
    } catch (error: any) {
      console.error("Error updating console:", error)
      toast({
        title: "Error updating console",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
        >
          {/* Hero Header Section */}
          <div className="relative overflow-hidden py-16 px-4 mb-8 text-center">
            <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-assist-green-200/30 to-assist-green-300/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10">
              <div className="flex flex-col items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-assist-green-500/25">
                  <UserPlus className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="hockey-title text-4xl md:text-5xl mb-4">Season Registrations</h1>
                  <p className="hockey-subtitle text-xl md:text-2xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-2xl">
                    {activeSeason ? `Managing registrations for ${activeSeason.name}` : "Loading active season..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Season Registrations
                  </CardTitle>
                  <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                    {activeSeason ? `Managing registrations for ${activeSeason.name}` : "Loading active season..."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive" className="mb-6 border-2 border-goal-red-300 dark:border-goal-red-600 bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-goal-red-800 dark:text-goal-red-200 font-bold">Error</AlertTitle>
                    <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-6 mb-8"
              >
                {/* Active Season Display */}
                <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="active-season" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                        Active Season
                      </Label>
                      <div id="active-season" className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">
                        {activeSeason ? activeSeason.name : "Loading..."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="space-y-3">
                    <Label htmlFor="search" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                      <Search className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                      Search
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <Input
                        id="search"
                        placeholder="Search by name or email"
                        className="hockey-search h-12 text-base pl-12 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <Label htmlFor="status-filter" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                      <Filter className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                      Filter by Status
                    </Label>
                    <select
                      id="status-filter"
                      className="hockey-search h-12 text-base w-full p-3 border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300 rounded-lg bg-white dark:bg-hockey-silver-800"
                      value={statusFilter || "all"}
                      onChange={(e) => setStatusFilter(e.target.value === "all" ? null : e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                      Actions
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          fetchRegistrations()
                        }}
                        className="hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105 flex-1"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>

                      <Button 
                        variant="outline" 
                        onClick={exportToCSV} 
                        disabled={filteredRegistrations.length === 0}
                        className="hockey-button bg-gradient-to-r from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border-assist-green-300 dark:border-assist-green-600 hover:from-assist-green-200 dark:hover:to-assist-green-200 text-assist-green-700 dark:text-assist-green-300 transition-all duration-300 hover:scale-105 flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6"
              >
                <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                        Showing {filteredRegistrations.length} of {registrations.length} registrations
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {loading ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex justify-center items-center py-12"
                >
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-ice-blue-600 dark:text-ice-blue-400" />
                    <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Loading registrations...</p>
                  </div>
                </motion.div>
              ) : filteredRegistrations.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-center py-12 text-hockey-silver-500 dark:text-hockey-silver-500"
                >
                  <div className="flex flex-col items-center gap-4">
                    <Users className="h-12 w-12 opacity-50" />
                    <p className="text-lg">
                      {registrations.length === 0
                        ? "No registrations found for this season."
                        : "No registrations match your search criteria."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="overflow-x-auto"
                >
                  <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 hover:from-ice-blue-100 dark:hover:from-ice-blue-800/30 hover:to-rink-blue-100 dark:hover:to-rink-blue-800/30 transition-all duration-300">
                          <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Player</TableHead>
                          <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Email</TableHead>
                          <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Primary Position</TableHead>
                          <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Secondary Position</TableHead>
                          <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Console</TableHead>
                          <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                          <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegistrations.map((registration) => (
                          <TableRow key={registration.id} className="hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-100/50 dark:border-rink-blue-800/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-medium text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-300"
                                  onClick={() => viewRegistrationDetails(registration)}
                                >
                                  {registration.gamer_tag}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-ice-blue-100 dark:hover:bg-rink-blue-900/30 rounded-lg transition-all duration-200"
                                  onClick={() => openEditName(registration)}
                                  title="Edit Player Name"
                                >
                                  <Edit className="h-3 w-3 text-ice-blue-600 dark:text-ice-blue-400" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">{registration.users?.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{registration.primary_position}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-ice-blue-100 dark:hover:bg-rink-blue-900/30 rounded-lg transition-all duration-200"
                                  onClick={() => openEditPositions(registration)}
                                  title="Edit Positions"
                                >
                                  <MapPin className="h-3 w-3 text-ice-blue-600 dark:text-ice-blue-400" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">{registration.secondary_position || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{registration.console}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-ice-blue-100 dark:hover:bg-rink-blue-900/30 rounded-lg transition-all duration-200"
                                  onClick={() => openEditConsole(registration)}
                                  title="Edit Console"
                                >
                                  <Gamepad2 className="h-3 w-3 text-ice-blue-600 dark:text-ice-blue-400" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(registration.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {registration.status !== "Approved" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 border-assist-green-300 dark:border-assist-green-600"
                                    onClick={() => updateStatus(registration.id, "Approved")}
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Approve
                                  </Button>
                                )}
                                {registration.status !== "Rejected" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 border-goal-red-300 dark:border-goal-red-600"
                                    onClick={() => updateStatus(registration.id, "Rejected")}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Reject
                                  </Button>
                                )}
                                {registration.status !== "Pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105"
                                    onClick={() => updateStatus(registration.id, "Pending")}
                                  >
                                    <Clock className="mr-1 h-3 w-3" />
                                    Reset
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              )}
              {process.env.NODE_ENV === "development" && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-4 p-4 bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 rounded-xl border border-hockey-silver-200/50 dark:border-hockey-silver-700/50 text-xs font-mono overflow-auto max-h-60"
                >
                  <p className="font-bold mb-2 text-hockey-silver-800 dark:text-hockey-silver-200">Debug Information:</p>
                  <p className="text-hockey-silver-700 dark:text-hockey-silver-300">Active Season: {JSON.stringify(activeSeason)}</p>
                  <p className="text-hockey-silver-700 dark:text-hockey-silver-300">Total Registrations: {registrations.length}</p>
                  <p className="text-hockey-silver-700 dark:text-hockey-silver-300">Filtered Registrations: {filteredRegistrations.length}</p>
                  <details>
                    <summary className="text-hockey-silver-800 dark:text-hockey-silver-200">All Registrations Data</summary>
                    <pre className="text-hockey-silver-700 dark:text-hockey-silver-300">{JSON.stringify(registrations, null, 2)}</pre>
                  </details>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      {/* Registration Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <Eye className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
              Registration Details
            </DialogTitle>
            <DialogDescription className="text-base text-hockey-silver-600 dark:text-hockey-silver-400">
              Complete information about this registration
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6">
              <Tabs defaultValue="details">
                <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                  <CardContent className="p-2">
                    <TabsList className="grid w-full grid-cols-2 h-auto bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20">
                      <TabsTrigger value="details" className="text-sm px-4 py-3 hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105">
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </TabsTrigger>
                      <TabsTrigger value="actions" className="text-sm px-4 py-3 hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105">
                        <Settings className="h-4 w-4 mr-2" />
                        Actions
                      </TabsTrigger>
                    </TabsList>
                  </CardContent>
                </Card>

                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Gamer Tag</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{selectedRegistration.gamer_tag}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Email</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{selectedRegistration.users?.email}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Primary Position</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{selectedRegistration.primary_position}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Secondary Position</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{selectedRegistration.secondary_position || "—"}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Gamepad2 className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Console</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{selectedRegistration.console}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Status</h4>
                      </div>
                      <div className="text-lg">{getStatusBadge(selectedRegistration.status)}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Registered On</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{new Date(selectedRegistration.created_at).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Last Updated</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">{new Date(selectedRegistration.updated_at).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Trophy className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Season ID</h4>
                      </div>
                      <p className="text-lg text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">
                        {selectedRegistration.season_id ||
                          "None (Season Number: " + selectedRegistration.season_number + ")"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        openEditName(selectedRegistration)
                        setIsDialogOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Update Player Name
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        openEditPositions(selectedRegistration)
                        setIsDialogOpen(false)
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Update Positions
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        openEditConsole(selectedRegistration)
                        setIsDialogOpen(false)
                      }}
                    >
                      <Gamepad2 className="mr-2 h-4 w-4" />
                      Update Console
                    </Button>

                    <div className="flex justify-end space-x-2 pt-4">
                      {selectedRegistration.status !== "Approved" && (
                        <Button
                          variant="outline"
                          className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 border-assist-green-300 dark:border-assist-green-600"
                          onClick={() => {
                            updateStatus(selectedRegistration.id, "Approved")
                            setIsDialogOpen(false)
                          }}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      {selectedRegistration.status !== "Rejected" && (
                        <Button
                          variant="outline"
                          className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 border-goal-red-300 dark:border-goal-red-600"
                          onClick={() => {
                            updateStatus(selectedRegistration.id, "Rejected")
                            setIsDialogOpen(false)
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      )}
                      {selectedRegistration.status !== "Pending" && (
                        <Button
                          variant="outline"
                          className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105"
                          onClick={() => {
                            updateStatus(selectedRegistration.id, "Pending")
                            setIsDialogOpen(false)
                          }}
                        >
                          <Clock className="mr-1 h-4 w-4" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Player Name Dialog */}
      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <User className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
              Update Player Name
            </DialogTitle>
            <DialogDescription className="text-base text-hockey-silver-600 dark:text-hockey-silver-400">
              Change the player's gamer tag
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="gamer-tag" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <User className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                Gamer Tag
              </Label>
              <Input
                id="gamer-tag"
                placeholder="Enter player name"
                value={newGamerTag}
                onChange={(e) => setNewGamerTag(e.target.value)}
                className="hockey-search h-12 text-base border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
              <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                Enter the new gamer tag for this player.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button 
              variant="outline" 
              onClick={() => setIsEditNameOpen(false)}
              className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105"
            >
              Cancel
            </Button>
            <Button 
              onClick={updatePlayerName} 
              disabled={isUpdating || !newGamerTag.trim()}
              className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-assist-green-300 dark:border-assist-green-600"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Positions Dialog */}
      <Dialog open={isEditPositionsOpen} onOpenChange={setIsEditPositionsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
              Update Positions
            </DialogTitle>
            <DialogDescription className="text-base text-hockey-silver-600 dark:text-hockey-silver-400">
              Change the player's primary and secondary positions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="primary-position" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                Primary Position
              </Label>
              <select
                id="primary-position"
                className="hockey-search h-12 text-base w-full p-3 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300 rounded-lg bg-white dark:bg-hockey-silver-800"
                value={newPrimaryPosition}
                onChange={(e) => setNewPrimaryPosition(e.target.value)}
              >
                <option value="">Select a position</option>
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                Select the player's primary position on the ice.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="secondary-position" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                Secondary Position (Optional)
              </Label>
              <select
                id="secondary-position"
                className="hockey-search h-12 text-base w-full p-3 border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300 rounded-lg bg-white dark:bg-hockey-silver-800"
                value={newSecondaryPosition || ""}
                onChange={(e) => setNewSecondaryPosition(e.target.value)}
              >
                <option value="">None</option>
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-hockey-silver-100/30 to-hockey-silver-200/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-800/10 rounded-lg border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                Select an optional secondary position the player can play.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button 
              variant="outline" 
              onClick={() => setIsEditPositionsOpen(false)}
              className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105"
            >
              Cancel
            </Button>
            <Button 
              onClick={updatePositions} 
              disabled={isUpdating || !newPrimaryPosition}
              className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-assist-green-300 dark:border-assist-green-600"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Console Dialog */}
      <Dialog open={isEditConsoleOpen} onOpenChange={setIsEditConsoleOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
              Update Console
            </DialogTitle>
            <DialogDescription className="text-base text-hockey-silver-600 dark:text-hockey-silver-400">
              Change the player's gaming console
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                Select Console
              </Label>
              <div className="p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <RadioGroup value={newConsole} onValueChange={setNewConsole} className="flex flex-col space-y-4">
                  {consoleOptions.map((console) => (
                    <div key={console} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-ice-blue-100/50 hover:to-rink-blue-100/50 dark:hover:from-ice-blue-800/20 dark:hover:to-rink-blue-800/20 transition-all duration-300">
                      <RadioGroupItem 
                        value={console} 
                        id={console.replace(/\s+/g, "-").toLowerCase()}
                        className="border-2 border-ice-blue-300 dark:border-rink-blue-600 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-ice-blue-500 data-[state=checked]:to-rink-blue-600 data-[state=checked]:border-ice-blue-500"
                      />
                      <Label 
                        htmlFor={console.replace(/\s+/g, "-").toLowerCase()} 
                        className="cursor-pointer text-hockey-silver-700 dark:text-hockey-silver-300 font-medium"
                      >
                        {console}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                Select the gaming console this player uses.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button 
              variant="outline" 
              onClick={() => setIsEditConsoleOpen(false)}
              className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105"
            >
              Cancel
            </Button>
            <Button 
              onClick={updateConsole} 
              disabled={isUpdating || !newConsole}
              className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-assist-green-300 dark:border-assist-green-600"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
