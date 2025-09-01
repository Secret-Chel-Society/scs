"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ClipboardList, 
  ArrowLeft 
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"

interface Registration {
  id: string
  user_id: string
  season_number: number
  primary_position: string
  secondary_position: string | null
  gamer_tag: string
  console: string
  status: string
  created_at: string
  updated_at: string
  user?: {
    email: string
    gamer_tag_id: string
  }
}

export default function AdminRegistrationsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState("")
  const [editingConsole, setEditingConsole] = useState("")
  const [updating, setUpdating] = useState(false)

  // Check if user is admin and load registrations
  useEffect(() => {
    async function checkAuthAndLoadData() {
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

        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)

        // Load registrations with user data
        const { data: registrationsData, error: registrationsError } = await supabase
          .from("season_registrations")
          .select(`
            *,
            user:user_id (
              email,
              gamer_tag_id
            )
          `)
          .order("created_at", { ascending: false })

        if (registrationsError) throw registrationsError

        setRegistrations(registrationsData || [])
        setFilteredRegistrations(registrationsData || [])
      } catch (error: any) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [supabase, session, toast, router])

  // Filter registrations based on search and status
  useEffect(() => {
    let filtered = registrations

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((reg) =>
        reg.gamer_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.user?.gamer_tag_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => reg.status === statusFilter)
    }

    setFilteredRegistrations(filtered)
  }, [registrations, searchQuery, statusFilter])

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedRegistration) return

    try {
      setUpdating(true)

      const { error } = await supabase
        .from("season_registrations")
        .update({
          status: editingStatus,
          console: editingConsole,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRegistration.id)

      if (error) throw error

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === selectedRegistration.id
            ? { ...reg, status: editingStatus, console: editingConsole }
            : reg
        )
      )

      toast({
        title: "Registration updated",
        description: `Registration for ${selectedRegistration.gamer_tag} has been updated.`,
      })

      setIsEditDialogOpen(false)
      setSelectedRegistration(null)
    } catch (error: any) {
      console.error("Error updating registration:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update registration",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Get statistics
  const getStats = () => {
    const total = registrations.length
    const approved = registrations.filter((r) => r.status === "Approved").length
    const pending = registrations.filter((r) => r.status === "Pending").length
    const rejected = registrations.filter((r) => r.status === "Rejected").length

    return { total, approved, pending, rejected }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading registrations...</p>
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
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <ClipboardList className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Season Registrations
              </h1>
              <p className="text-white/70 mt-1">Manage player season registrations and approvals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {/* Statistics */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-white/70 text-sm">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
                <div className="text-white/70 text-sm">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
                <div className="text-white/70 text-sm">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                <div className="text-white/70 text-sm">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-white">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="search"
                    placeholder="Search by gamer tag, email, or user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="status-filter" className="text-white">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">All Statuses</SelectItem>
                    <SelectItem value="Pending" className="text-white hover:bg-slate-700">Pending</SelectItem>
                    <SelectItem value="Approved" className="text-white hover:bg-slate-700">Approved</SelectItem>
                    <SelectItem value="Rejected" className="text-white hover:bg-slate-700">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Registrations</CardTitle>
            <CardDescription className="text-white/70">
              {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/20 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">Gamer Tag</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Position</TableHead>
                    <TableHead className="text-white">Console</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{registration.gamer_tag}</TableCell>
                      <TableCell className="text-white">{registration.user?.email || "N/A"}</TableCell>
                      <TableCell className="text-white">
                        {registration.primary_position}
                        {registration.secondary_position && ` / ${registration.secondary_position}`}
                      </TableCell>
                      <TableCell className="text-white">{registration.console}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(registration.status)}>
                          {registration.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRegistration(registration)
                              setIsViewDialogOpen(true)
                            }}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRegistration(registration)
                              setEditingStatus(registration.status)
                              setEditingConsole(registration.console)
                              setIsEditDialogOpen(true)
                            }}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRegistrations.length === 0 && (
                    <TableRow className="border-white/20">
                      <TableCell colSpan={7} className="text-center py-8 text-white/50">
                        No registrations found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Registration Details</DialogTitle>
              <DialogDescription className="text-white/70">
                View detailed information about this registration
              </DialogDescription>
            </DialogHeader>
            {selectedRegistration && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Gamer Tag</Label>
                    <p className="text-white/70">{selectedRegistration.gamer_tag}</p>
                  </div>
                  <div>
                    <Label className="text-white">Email</Label>
                    <p className="text-white/70">{selectedRegistration.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-white">Primary Position</Label>
                    <p className="text-white/70">{selectedRegistration.primary_position}</p>
                  </div>
                  <div>
                    <Label className="text-white">Secondary Position</Label>
                    <p className="text-white/70">{selectedRegistration.secondary_position || "None"}</p>
                  </div>
                  <div>
                    <Label className="text-white">Console</Label>
                    <p className="text-white/70">{selectedRegistration.console}</p>
                  </div>
                  <div>
                    <Label className="text-white">Status</Label>
                    <Badge className={getStatusBadgeVariant(selectedRegistration.status)}>
                      {selectedRegistration.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Registration Date</Label>
                  <p className="text-white/70">
                    {new Date(selectedRegistration.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Registration</DialogTitle>
              <DialogDescription className="text-white/70">
                Update the status and console for this registration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Status</Label>
                <RadioGroup value={editingStatus} onValueChange={setEditingStatus} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Pending" id="pending" className="text-blue-500" />
                    <Label htmlFor="pending" className="text-white">Pending</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Approved" id="approved" className="text-green-500" />
                    <Label htmlFor="approved" className="text-white">Approved</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Rejected" id="rejected" className="text-red-500" />
                    <Label htmlFor="rejected" className="text-white">Rejected</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-white">Console</Label>
                <Select value={editingConsole} onValueChange={setEditingConsole}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select console" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="Xbox" className="text-white hover:bg-slate-700">Xbox</SelectItem>
                    <SelectItem value="PS5" className="text-white hover:bg-slate-700">PS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {updating ? "Updating..." : "Update Registration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
