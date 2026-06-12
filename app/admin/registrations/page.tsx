"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity-log"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Download,
  Search,
  AlertCircle,
  RefreshCw,
  User,
  MapPin,
  Gamepad2,
  Edit,
  Calendar,
  Clock,
} from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { FreeAgentsTCTab } from "@/components/admin/free-agents-tc-tab"
import { fetchPlayersByUserIds } from "@/lib/db/fetch-players-by-user-ids"

const AVAILABILITY_SLOTS = {
  tuesday: ["8:30 PM EST", "9:10 PM EST", "9:50 PM EST"],
  wednesday: ["8:30 PM EST", "9:10 PM EST", "9:50 PM EST"],
  thursday: ["8:30 PM EST", "9:10 PM EST", "9:50 PM EST"],
}

export default function RegistrationsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSeason, setActiveSeason] = useState<any>(null)
  const [adminName, setAdminName] = useState<string>("Admin")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEditPositionsOpen, setIsEditPositionsOpen] = useState(false)
  const [isEditConsoleOpen, setIsEditConsoleOpen] = useState(false)
  const [isEditAvailabilityOpen, setIsEditAvailabilityOpen] = useState(false)
  const [editingRegistration, setEditingRegistration] = useState<any | null>(null)
  const [newGamerTag, setNewGamerTag] = useState("")
  const [newPrimaryPosition, setNewPrimaryPosition] = useState("")
  const [newSecondaryPosition, setNewSecondaryPosition] = useState("")
  const [newConsole, setNewConsole] = useState("")
  const [newAvailability, setNewAvailability] = useState<Record<string, string[]>>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAllRegistrations, setShowAllRegistrations] = useState(false)
  // Maps user_id -> array of roster team names (league rosters only, excludes training camp)
  const [playerTeams, setPlayerTeams] = useState<Record<string, string[]>>({})

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

  // Fetch admin name for activity logging
  useEffect(() => {
    async function fetchAdminName() {
      if (!session?.user?.id) return
      const { data } = await supabase
        .from("users")
        .select("gamer_tag_id")
        .eq("id", session.user.id)
        .single()
      if (data?.gamer_tag_id) setAdminName(data.gamer_tag_id)
    }
    fetchAdminName()
  }, [session?.user?.id, supabase])

  useEffect(() => {
    async function fetchActiveSeason() {
      try {
        let { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("*")
          .eq("is_active", true)
          .maybeSingle()

        // If no active season found, get the latest season by season_number
        if (!seasonData && !seasonError) {
          const { data: latestSeason, error: latestError } = await supabase
            .from("seasons")
            .select("*")
            .order("season_number", { ascending: false })
            .limit(1)
            .maybeSingle()

          seasonData = latestSeason
          seasonError = latestError
        }

        if (seasonError) {
          console.error("Error fetching current season:", seasonError)
          setError(`Error fetching current season: ${seasonError.message}`)
          setLoading(false)
          return
        }

        if (!seasonData) {
          setError("No active season found. Please ensure there is an active season in the database.")
          setLoading(false)
          return
        }

        setActiveSeason(seasonData)

        // Now fetch registrations for this season
        fetchRegistrations(seasonData.season_number)
      } catch (error: any) {
        console.error("Error in fetchActiveSeason:", error)
        setError(`Error fetching current season: ${error.message}`)
        setLoading(false)
      }
    }

    fetchActiveSeason()
  }, [supabase])

  useEffect(() => {
    filterRegistrations()
  }, [registrations, searchTerm, statusFilter])

  async function fetchRegistrations(seasonNumber?: number) {
    setLoading(true)
    setError(null)

    try {
      const currentSeasonNumber = seasonNumber || activeSeason?.season_number

      if (!currentSeasonNumber) {
        throw new Error("No season number available")
      }

      const { data: seasonRegistrations, error: seasonRegError } = await supabase
        .from("season_registrations")
        .select(`
          *,
          users:user_id (
            email
          )
        `)
        .eq("season_number", currentSeasonNumber)
        .order("created_at", { ascending: false })

      if (seasonRegError) {
        throw seasonRegError
      }

      // Log current season registrations for debugging
      console.log(`Season ${currentSeasonNumber} registrations:`, seasonRegistrations)

      // Set registrations to current season registrations only
      setRegistrations(seasonRegistrations || [])
      setFilteredRegistrations(seasonRegistrations || [])

      // Look up roster team assignments (NHL/AHL/ECL) for these users.
      // Training-camp-only assignments are intentionally ignored so TC players
      // do not show a team here.
      const userIds = Array.from(
        new Set((seasonRegistrations || []).map((r: any) => r.user_id).filter(Boolean)),
      ) as string[]

      if (userIds.length > 0) {
        try {
          const playerRows = await fetchPlayersByUserIds(supabase, userIds)
          const teamMap: Record<string, string[]> = {}
          for (const row of playerRows) {
            const teams = [row.team_name, row.ahl_team_name, row.ecl_team_name].filter(
              (name): name is string => Boolean(name),
            )
            if (teams.length > 0) {
              teamMap[row.user_id] = teams
            }
          }
          setPlayerTeams(teamMap)
        } catch (teamErr) {
          console.error("[v0] Error fetching player team assignments:", teamErr)
          setPlayerTeams({})
        }
      } else {
        setPlayerTeams({})
      }

      if (!seasonRegistrations || seasonRegistrations.length === 0) {
        setError(`No registrations found for Season ${currentSeasonNumber}.`)
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

  function openEditAvailability(registration: any) {
    setEditingRegistration(registration)
    setNewAvailability(registration.availability || {
      tuesday: [],
      wednesday: [],
      thursday: [],
    })
    setIsEditAvailabilityOpen(true)
  }

  function formatAvailability(availability: any) {
    if (!availability) return null

    const days = ["tuesday", "wednesday", "thursday"]
    const dayLabels: Record<string, string> = {
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
    }

    return (
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const slots = availability[day] || []
          if (slots.length === 0) return null
          return (
            <div key={day} className="text-xs">
              <span className="font-medium">{dayLabels[day]}:</span>{" "}
              <span className="text-muted-foreground">{slots.length}</span>
            </div>
          )
        })}
      </div>
    )
  }

  async function updateLeagueApproval(
    id: string,
    field: "approved_nhl" | "approved_ahl" | "approved_ecl" | "bidding_eligible" | "is_late_signup",
    value: boolean,
  ) {
    try {
      const { error } = await supabase
        .from("season_registrations")
        .update({ [field]: value })
        .eq("id", id)

      if (error) throw error

      // Find the registration to get player name
      const registration = registrations.find((r) => r.id === id)
      const playerName = registration?.gamer_tag || "Unknown Player"

      // Update local state
      setRegistrations(registrations.map((reg) => (reg.id === id ? { ...reg, [field]: value } : reg)))

      const fieldLabels: Record<string, string> = {
        approved_nhl: "NHL",
        approved_ahl: "AHL",
        bidding_eligible: "Bidding",
        is_late_signup: "Late Signup",
      }

      // Log activity
      const actionType = value ? "approve" : "deny"
      const actionDescription = field === "is_late_signup"
        ? `${value ? "Marked" : "Unmarked"} ${playerName} ${value ? "as" : "from"} Late Signup`
        : `${value ? "Approved" : "Removed"} ${playerName} ${value ? "for" : "from"} ${fieldLabels[field]} eligibility`
      
      try {
        console.log("Logging activity:", { actorId: session?.user?.id, actionType: `registration_${actionType}_${field}` })
        await logActivity(supabase, {
          actorId: session?.user?.id || "",
          actorName: adminName,
          actorType: "Admin",
          actionType: `registration_${actionType}_${field}`,
          actionDescription,
          targetId: registration?.user_id || id,
          targetName: playerName,
          category: "Registration",
          league: field === "approved_ahl" ? "AHL" : field === "approved_ecl" ? "ECL" : "NHL",
        })
        console.log("Activity logged successfully")
      } catch (logError) {
        console.error("Error logging activity:", logError)
      }

      toast({
        title: "Status updated",
        description: field === "is_late_signup" 
          ? `Player ${value ? "marked as" : "unmarked from"} Late Signup`
          : `Player ${value ? "approved for" : "removed from"} ${fieldLabels[field]} eligibility`,
      })
    } catch (error: any) {
      console.error("Error updating league approval:", error)
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      })
    }
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

  async function updateAvailability() {
    if (!editingRegistration) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("season_registrations")
        .update({ availability: newAvailability })
        .eq("id", editingRegistration.id)

      if (error) throw error

      // Update local state
      const updatedRegistrations = registrations.map((reg) =>
        reg.id === editingRegistration.id ? { ...reg, availability: newAvailability } : reg,
      )
      setRegistrations(updatedRegistrations)

      toast({
        title: "Availability updated",
        description: "Player availability has been updated",
      })

      setIsEditAvailabilityOpen(false)
    } catch (error: any) {
      console.error("Error updating availability:", error)
      toast({
        title: "Error updating availability",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  function toggleAvailabilitySlot(day: string, time: string) {
    setNewAvailability((prev) => {
      const currentSlots = prev[day] || []
      if (currentSlots.includes(time)) {
        return {
          ...prev,
          [day]: currentSlots.filter((t) => t !== time),
        }
      } else {
        return {
          ...prev,
          [day]: [...currentSlots, time],
        }
      }
    })
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="registrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="registrations">Season Registrations</TabsTrigger>
          <TabsTrigger value="free-agents-tc">Free Agents / TC</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations">
      <Card>
        <CardHeader>
          <CardTitle>Season Registrations</CardTitle>
          <CardDescription>
            {activeSeason
              ? `Managing registrations for ${activeSeason.name} (Season ${activeSeason.season_number})`
              : "Loading current season..."}
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
              className="ml-auto mr-2 bg-transparent"
              onClick={() => {
                fetchRegistrations(activeSeason?.season_number)
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
                ? /* Dynamic error message based on current season */
                  `No registrations found for Season ${activeSeason?.season_number || "current"}.`
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
                    <TableHead>Availability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>League Approval</TableHead>
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
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{registration.users?.email}</span>
                          {playerTeams[registration.user_id]?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {playerTeams[registration.user_id].map((teamName) => (
                                <Badge key={teamName} variant="secondary" className="text-xs">
                                  {teamName}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {registration.availability ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1"
                              onClick={() => viewRegistrationDetails(registration)}
                              title="View availability details"
                            >
                              {formatAvailability(registration.availability) || (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEditAvailability(registration)}
                            title="Edit Availability"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(registration.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`bidding-${registration.id}`}
                              checked={registration.bidding_eligible || false}
                              onCheckedChange={(checked) =>
                                updateLeagueApproval(registration.id, "bidding_eligible", checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`bidding-${registration.id}`}
                              className="text-xs font-medium cursor-pointer text-green-600"
                            >
                              Bidding
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`nhl-${registration.id}`}
                              checked={registration.approved_nhl || false}
                              onCheckedChange={(checked) =>
                                updateLeagueApproval(registration.id, "approved_nhl", checked as boolean)
                              }
                            />
                            <Label htmlFor={`nhl-${registration.id}`} className="text-xs font-medium cursor-pointer">
                              NHL
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`ahl-${registration.id}`}
                              checked={registration.approved_ahl || false}
                              onCheckedChange={(checked) =>
                                updateLeagueApproval(registration.id, "approved_ahl", checked as boolean)
                              }
                            />
                            <Label htmlFor={`ahl-${registration.id}`} className="text-xs font-medium cursor-pointer">
                              AHL
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`ecl-${registration.id}`}
                              checked={registration.approved_ecl || false}
                              onCheckedChange={(checked) =>
                                updateLeagueApproval(registration.id, "approved_ecl", checked as boolean)
                              }
                            />
                            <Label htmlFor={`ecl-${registration.id}`} className="text-xs font-medium cursor-pointer">
                              ECL
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`late-signup-${registration.id}`}
                              checked={registration.is_late_signup || false}
                              onCheckedChange={(checked) =>
                                updateLeagueApproval(registration.id, "is_late_signup", checked as boolean)
                              }
                            />
                            <Label 
                              htmlFor={`late-signup-${registration.id}`} 
                              className="text-xs font-medium cursor-pointer text-red-500"
                            >
                              Late Signup
                            </Label>
                          </div>
                        </div>
                      </TableCell>
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
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
                      <h4 className="text-sm font-medium text-muted-foreground">Eligibility Status</h4>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {selectedRegistration.bidding_eligible && (
                          <Badge className="bg-green-500">Bidding Eligible</Badge>
                        )}
                        {selectedRegistration.approved_nhl && <Badge className="bg-blue-500">NHL</Badge>}
                        {selectedRegistration.approved_ahl && <Badge className="bg-orange-500">AHL</Badge>}
                        {selectedRegistration.approved_ecl && <Badge className="bg-purple-500">ECL</Badge>}
                        {!selectedRegistration.bidding_eligible &&
                          !selectedRegistration.approved_nhl &&
                          !selectedRegistration.approved_ahl &&
                          !selectedRegistration.approved_ecl && (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                      </div>
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

                <TabsContent value="availability" className="space-y-4">
                  {selectedRegistration.availability ? (
                    <div className="space-y-4">
                      {Object.entries(AVAILABILITY_SLOTS).map(([day, slots]) => {
                        const selectedSlots = selectedRegistration.availability?.[day] || []
                        const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)

                        return (
                          <div key={day} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">{dayLabel}</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {slots.map((time) => {
                                const isSelected = selectedSlots.includes(time)
                                return (
                                  <div
                                    key={`${day}-${time}`}
                                    className={`flex items-center gap-2 p-2 rounded-md border text-sm ${
                                      isSelected
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-muted/30 border-muted text-muted-foreground"
                                    }`}
                                  >
                                    <Clock className="h-3 w-3" />
                                    <span>{time}</span>
                                    {isSelected && <span className="ml-auto text-xs">✓</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          Total slots selected:{" "}
                          <span className="font-medium text-foreground">
                            {Object.values(selectedRegistration.availability || {}).flat().length}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No availability information provided</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
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
                      className="w-full justify-start bg-transparent"
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
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        openEditConsole(selectedRegistration)
                        setIsDialogOpen(false)
                      }}
                    >
                      <Gamepad2 className="mr-2 h-4 w-4" />
                      Update Console
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        openEditAvailability(selectedRegistration)
                        setIsDialogOpen(false)
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Update Availability
                    </Button>

                    <div className="border rounded-md p-4 space-y-3">
                      <h4 className="text-sm font-medium">League Approval</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="dialog-bidding"
                            checked={selectedRegistration.bidding_eligible || false}
                            onCheckedChange={(checked) => {
                              updateLeagueApproval(selectedRegistration.id, "bidding_eligible", checked as boolean)
                              setSelectedRegistration({
                                ...selectedRegistration,
                                bidding_eligible: checked,
                              })
                            }}
                          />
                          <Label htmlFor="dialog-bidding" className="cursor-pointer text-green-600">
                            Approve for Bidding
                          </Label>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                          Bidding
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="dialog-nhl"
                            checked={selectedRegistration.approved_nhl || false}
                            onCheckedChange={(checked) => {
                              updateLeagueApproval(selectedRegistration.id, "approved_nhl", checked as boolean)
                              setSelectedRegistration({
                                ...selectedRegistration,
                                approved_nhl: checked,
                              })
                            }}
                          />
                          <Label htmlFor="dialog-nhl" className="cursor-pointer">
                            Approve for NHL Free Agency
                          </Label>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                          NHL
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="dialog-ahl"
                            checked={selectedRegistration.approved_ahl || false}
                            onCheckedChange={(checked) => {
                              updateLeagueApproval(selectedRegistration.id, "approved_ahl", checked as boolean)
                              setSelectedRegistration({
                                ...selectedRegistration,
                                approved_ahl: checked,
                              })
                            }}
                          />
                          <Label htmlFor="dialog-ahl" className="cursor-pointer">
                            Approve for AHL Free Agency
                          </Label>
                        </div>
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                          AHL
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="dialog-ecl"
                            checked={selectedRegistration.approved_ecl || false}
                            onCheckedChange={(checked) => {
                              updateLeagueApproval(selectedRegistration.id, "approved_ecl", checked as boolean)
                              setSelectedRegistration({
                                ...selectedRegistration,
                                approved_ecl: checked,
                              })
                            }}
                          />
                          <Label htmlFor="dialog-ecl" className="cursor-pointer">
                            Approve for ECL Free Agency
                          </Label>
                        </div>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                          ECL
                        </Badge>
                      </div>
                    </div>

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
            <DialogDescription>Change the player&apos;s gaming console</DialogDescription>
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

      {/* Edit Availability Dialog */}
      <Dialog open={isEditAvailabilityOpen} onOpenChange={setIsEditAvailabilityOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Availability</DialogTitle>
            <DialogDescription>
              Change the player&apos;s availability for {editingRegistration?.gamer_tag}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {Object.entries(AVAILABILITY_SLOTS).map(([day, slots]) => {
              const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)
              const selectedSlots = newAvailability[day] || []

              return (
                <div key={day} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{dayLabel}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((time) => {
                      const isSelected = selectedSlots.includes(time)
                      return (
                        <button
                          key={`${day}-${time}`}
                          type="button"
                          onClick={() => toggleAvailabilitySlot(day, time)}
                          className={`flex items-center gap-2 p-2 rounded-md border text-sm transition-colors ${
                            isSelected
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-muted/30 border-muted text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{time.replace(" EST", "")}</span>
                          {isSelected && <span className="ml-auto text-xs">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Total slots selected:{" "}
                <span className="font-medium text-foreground">
                  {Object.values(newAvailability).flat().length}
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAvailabilityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateAvailability} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        </TabsContent>

        <TabsContent value="free-agents-tc">
          <FreeAgentsTCTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
