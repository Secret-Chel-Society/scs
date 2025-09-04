"use client"

import React, { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Download, Search, AlertCircle, RefreshCw, User, MapPin, Gamepad2, Edit, Trophy, Calendar, Users, Star, Shield, Target, Zap, CheckCircle2 } from "lucide-react"
// import { motion } from "framer-motion" - replaced with CSS animations
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
        return <Badge className="bg-assist-green-500 text-white hover:bg-assist-green-600">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-goal-red-500 text-white hover:bg-goal-red-600">Rejected</Badge>
      case "Pending":
        return <Badge className="bg-ice-blue-500 text-white hover:bg-ice-blue-600">Pending</Badge>
      default:
        return <Badge className="bg-hockey-silver-500 text-white">{status}</Badge>
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
        <div className="animate-fade-in-up">
          <Card className="hockey-enhanced-card">
            <CardHeader>
              <CardTitle className="text-3xl text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                Season Registrations
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                {activeSeason ? `Managing registrations for ${activeSeason.name}` : "Loading active season..."}
              </CardDescription>
            </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 hockey-enhanced-card border-goal-red-200 dark:border-goal-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-hockey-silver-900 dark:text-hockey-silver-100">Error</AlertTitle>
              <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
            <div className="w-full md:w-1/3">
              <Label htmlFor="active-season" className="mb-2 block text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ice-blue-500" />
                Active Season
              </Label>
              <div id="active-season" className="p-3 border border-ice-blue-200 dark:border-rink-blue-700 rounded-lg bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700 text-hockey-silver-900 dark:text-hockey-silver-100">
                {activeSeason ? activeSeason.name : "Loading..."}
              </div>
            </div>

            <div className="w-full md:w-1/3">
              <Label htmlFor="search" className="mb-2 block text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-assist-green-500" />
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-hockey-silver-500" />
                <Input
                  id="search"
                  placeholder="Search by name or email"
                  className="pl-10 hockey-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-1/3">
              <Label htmlFor="status-filter" className="mb-2 block text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-rink-blue-500" />
                Filter by Status
              </Label>
              <select
                id="status-filter"
                className="w-full p-3 border border-ice-blue-200 dark:border-rink-blue-700 rounded-lg bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700 text-hockey-silver-900 dark:text-hockey-silver-100 focus:ring-2 focus:ring-ice-blue-500 focus:border-ice-blue-500"
                value={statusFilter || "all"}
                onChange={(e) => setStatusFilter(e.target.value === "all" ? null : e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <Button
              variant="outline"
              className="ml-auto mr-2 hockey-button-enhanced"
              onClick={() => {
                fetchRegistrations()
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button variant="outline" onClick={exportToCSV} disabled={filteredRegistrations.length === 0} className="hockey-button-enhanced">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
              Showing {filteredRegistrations.length} of {registrations.length} registrations
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ice-blue-500" />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-12 text-hockey-silver-600 dark:text-hockey-silver-400">
              {registrations.length === 0
                ? "No registrations found for this season."
                : "No registrations match your search criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="overflow-hidden rounded-xl border border-hockey-silver-200 dark:border-hockey-silver-700">
                <TableHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700">
                  <TableRow className="border-hockey-silver-200 dark:border-hockey-silver-600">
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Player</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Email</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Primary Position</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Secondary Position</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Console</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Status</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration, index) => (
                    <tr
                      key={registration.id}
                      className="border-hockey-silver-200 dark:border-hockey-silver-600 hover:bg-hockey-silver-50 dark:hover:bg-hockey-silver-800/50 transition-colors"
                    >
                      <TableCell className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left text-ice-blue-600 hover:text-ice-blue-700"
                            onClick={() => viewRegistrationDetails(registration)}
                          >
                            {registration.gamer_tag}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30"
                            onClick={() => openEditName(registration)}
                            title="Edit Player Name"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">{registration.users?.email}</TableCell>
                      <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">
                        <div className="flex items-center gap-2">
                          <span className="bg-ice-blue-100 dark:bg-ice-blue-900/30 px-2 py-1 rounded text-sm">{registration.primary_position}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-rink-blue-100 dark:hover:bg-rink-blue-900/30"
                            onClick={() => openEditPositions(registration)}
                            title="Edit Positions"
                          >
                            <MapPin className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">
                        {registration.secondary_position ? (
                          <span className="bg-rink-blue-100 dark:bg-rink-blue-900/30 px-2 py-1 rounded text-sm">{registration.secondary_position}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">
                        <div className="flex items-center gap-2">
                          <span className="bg-assist-green-100 dark:bg-assist-green-900/30 px-2 py-1 rounded text-sm">{registration.console}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-assist-green-100 dark:hover:bg-assist-green-900/30"
                            onClick={() => openEditConsole(registration)}
                            title="Edit Console"
                          >
                            <Gamepad2 className="h-3 w-3" />
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
                              className="hockey-button-enhanced bg-assist-green-500 hover:bg-assist-green-600 text-white hover:border-assist-green-600"
                              onClick={() => updateStatus(registration.id, "Approved")}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                          )}
                          {registration.status !== "Rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="hockey-button-enhanced bg-goal-red-500 hover:bg-goal-red-600 text-white hover:border-goal-red-600"
                              onClick={() => updateStatus(registration.id, "Rejected")}
                            >
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          )}
                          {registration.status !== "Pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="hockey-button-enhanced"
                              onClick={() => updateStatus(registration.id, "Pending")}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Reset
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-hockey-silver-100 dark:bg-hockey-silver-800 rounded text-xs font-mono overflow-auto max-h-60">
              <p className="font-bold mb-2 text-hockey-silver-900 dark:text-hockey-silver-100">Debug Information:</p>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300">Active Season: {JSON.stringify(activeSeason)}</p>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300">Total Registrations: {registrations.length}</p>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300">Filtered Registrations: {filteredRegistrations.length}</p>
              <details>
                <summary className="text-hockey-silver-900 dark:text-hockey-silver-100">All Registrations Data</summary>
                <pre className="text-hockey-silver-700 dark:text-hockey-silver-300">{JSON.stringify(registrations, null, 2)}</pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Registration Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>Complete information about this registration</DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Gamer Tag</h4>
                      <p className="text-base">{selectedRegistration.gamer_tag}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                      <p className="text-base">{selectedRegistration.users?.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Primary Position</h4>
                      <p className="text-base">{selectedRegistration.primary_position}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Secondary Position</h4>
                      <p className="text-base">{selectedRegistration.secondary_position || "—"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Console</h4>
                      <p className="text-base">{selectedRegistration.console}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                      <p className="text-base">{getStatusBadge(selectedRegistration.status)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Registered On</h4>
                      <p className="text-base">{new Date(selectedRegistration.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
                      <p className="text-base">{new Date(selectedRegistration.updated_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Season ID</h4>
                      <p className="text-base">
                        {selectedRegistration.season_id ||
                          "None (Season Number: " + selectedRegistration.season_number + ")"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
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
                      className="w-full justify-start"
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
                      className="w-full justify-start"
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
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => {
                            updateStatus(selectedRegistration.id, "Approved")
                            setIsDialogOpen(false)
                          }}
                        >
                          Approve
                        </Button>
                      )}
                      {selectedRegistration.status !== "Rejected" && (
                        <Button
                          variant="outline"
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => {
                            updateStatus(selectedRegistration.id, "Rejected")
                            setIsDialogOpen(false)
                          }}
                        >
                          Reject
                        </Button>
                      )}
                      {selectedRegistration.status !== "Pending" && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            updateStatus(selectedRegistration.id, "Pending")
                            setIsDialogOpen(false)
                          }}
                        >
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Player Name</DialogTitle>
            <DialogDescription>Change the player's gamer tag</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gamer-tag">Gamer Tag</Label>
              <Input
                id="gamer-tag"
                placeholder="Enter player name"
                value={newGamerTag}
                onChange={(e) => setNewGamerTag(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updatePlayerName} disabled={isUpdating || !newGamerTag.trim()}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Positions Dialog */}
      <Dialog open={isEditPositionsOpen} onOpenChange={setIsEditPositionsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Positions</DialogTitle>
            <DialogDescription>Change the player's primary and secondary positions</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="primary-position">Primary Position</Label>
              <select
                id="primary-position"
                className="w-full p-2 border rounded-md"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-position">Secondary Position (Optional)</Label>
              <select
                id="secondary-position"
                className="w-full p-2 border rounded-md"
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
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPositionsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updatePositions} disabled={isUpdating || !newPrimaryPosition}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Console Dialog */}
      <Dialog open={isEditConsoleOpen} onOpenChange={setIsEditConsoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Console</DialogTitle>
            <DialogDescription>Change the player's gaming console</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Console</Label>
              <RadioGroup value={newConsole} onValueChange={setNewConsole} className="flex flex-col space-y-3 mt-2">
                {consoleOptions.map((console) => (
                  <div key={console} className="flex items-center space-x-2">
                    <RadioGroupItem value={console} id={console.replace(/\s+/g, "-").toLowerCase()} />
                    <Label htmlFor={console.replace(/\s+/g, "-").toLowerCase()} className="cursor-pointer">
                      {console}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditConsoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateConsole} disabled={isUpdating || !newConsole}>
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
