"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Download, Search, AlertCircle, RefreshCw, User, MapPin, Gamepad2, Edit } from "lucide-react"
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
        return <Badge className="bg-green-500">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      case "Pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
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
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Season Registrations</CardTitle>
          <CardDescription>
            {activeSeason ? `Managing registrations for ${activeSeason.name}` : "Loading active season..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
            <div className="w-full md:w-1/3">
              <Label htmlFor="active-season" className="mb-2 block">
                Active Season
              </Label>
              <div id="active-season" className="p-2 border rounded-md bg-muted">
                {activeSeason ? activeSeason.name : "Loading..."}
              </div>
            </div>

            <div className="w-full md:w-1/3">
              <Label htmlFor="search" className="mb-2 block">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-1/3">
              <Label htmlFor="status-filter" className="mb-2 block">
                Filter by Status
              </Label>
              <select
                id="status-filter"
                className="w-full p-2 border rounded-md"
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
              className="ml-auto mr-2"
              onClick={() => {
                fetchRegistrations()
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button variant="outline" onClick={exportToCSV} disabled={filteredRegistrations.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRegistrations.length} of {registrations.length} registrations
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {registrations.length === 0
                ? "No registrations found for this season."
                : "No registrations match your search criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Primary Position</TableHead>
                    <TableHead>Secondary Position</TableHead>
                    <TableHead>Console</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left"
                            onClick={() => viewRegistrationDetails(registration)}
                          >
                            {registration.gamer_tag}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEditName(registration)}
                            title="Edit Player Name"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{registration.users?.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {registration.primary_position}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEditPositions(registration)}
                            title="Edit Positions"
                          >
                            <MapPin className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{registration.secondary_position || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {registration.console}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
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
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => updateStatus(registration.id, "Approved")}
                            >
                              Approve
                            </Button>
                          )}
                          {registration.status !== "Rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => updateStatus(registration.id, "Rejected")}
                            >
                              Reject
                            </Button>
                          )}
                          {registration.status !== "Pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(registration.id, "Pending")}
                            >
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
          )}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-60">
              <p className="font-bold mb-2">Debug Information:</p>
              <p>Active Season: {JSON.stringify(activeSeason)}</p>
              <p>Total Registrations: {registrations.length}</p>
              <p>Filtered Registrations: {filteredRegistrations.length}</p>
              <details>
                <summary>All Registrations Data</summary>
                <pre>{JSON.stringify(registrations, null, 2)}</pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

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
  )
}
