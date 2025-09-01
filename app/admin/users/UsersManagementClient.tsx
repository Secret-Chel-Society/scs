"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  RefreshCcw,
  Key,
  UserCog,
  Stethoscope,
  DollarSign,
  Search,
  X,
  Download,
  Crown,
  Shield,
  Gamepad2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Star,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Settings,
  Database,
  Bot,
} from "lucide-react"

// Define valid player roles - these must match the database constraint
const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner"]

// Update the roles array to match the database constraint
const roles = [
  { label: "Player", value: "Player" },
  { label: "GM", value: "GM" },
  { label: "AGM", value: "AGM" },
  { label: "Owner", value: "Owner" },
  { label: "Admin", value: "Admin" },
]

const positions = [
  { label: "Center", value: "Center" },
  { label: "Left Wing", value: "Left Wing" },
  { label: "Right Wing", value: "Right Wing" },
  { label: "Left Defense", value: "Left Defense" },
  { label: "Right Defense", value: "Right Defense" },
  { label: "Goalie", value: "Goalie" },
]

const positionAbbreviations = {
  "Left Wing": "LW",
  Center: "C",
  "Right Wing": "RW",
  "Left Defense": "LD",
  "Right Defense": "RD",
  Goalie: "G",
}

const positionColors = {
  LW: "bg-green-500/20 text-green-300 border-green-500/30",
  C: "bg-red-500/20 text-red-300 border-red-500/30",
  RW: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  LD: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  RD: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  G: "bg-purple-500/20 text-purple-300 border-purple-500/30",
}

const consoles = [
  { label: "Xbox", value: "Xbox" },
  { label: "PS5", value: "PS5" },
]

const userRoleSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(z.string()).min(1, "Select at least one role"),
})

const newUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  gamer_tag_id: z.string().min(3, "Gamer tag must be at least 3 characters"),
  primary_position: z.string().min(1, "Please select a primary position"),
  secondary_position: z.string().optional(),
  console: z.string().min(1, "Please select a console"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
})

const teamAssignmentSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid().nullable(),
})

const salarySchema = z.object({
  playerId: z.string().uuid(),
  salary: z.coerce.number().min(0, "Salary cannot be negative").max(15000000, "Salary cannot exceed $15,000,000"),
})

// Simple component for position dialog using controlled components instead of React Hook Form
function PositionUpdateDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  onSubmit: (values: { userId: string; primary_position: string; secondary_position: string | null }) => Promise<void>
  submitting: boolean
}) {
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setPrimaryPosition(user.primary_position || "")
      setSecondaryPosition(user.secondary_position || null)
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    onSubmit({
      userId: user.id,
      primary_position: primaryPosition,
      secondary_position: secondaryPosition === "none" ? null : secondaryPosition,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Update Positions</DialogTitle>
          <DialogDescription className="text-white/70">
            {user && `Update positions for ${user.gamer_tag_id || user.email}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="primary-position" className="text-sm font-medium text-white">
                Primary Position
              </label>
              <Select value={primaryPosition} onValueChange={setPrimaryPosition} disabled={submitting}>
                <SelectTrigger id="primary-position" className="bg-slate-800/50 border-white/20 text-white">
                  <SelectValue placeholder="Select primary position" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value} className="text-white hover:bg-slate-700">
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-white/60">The player's main position</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="secondary-position" className="text-sm font-medium text-white">
                Secondary Position (Optional)
              </label>
              <Select
                value={secondaryPosition || "none"}
                onValueChange={(value) => setSecondaryPosition(value === "none" ? null : value)}
                disabled={submitting}
              >
                <SelectTrigger id="secondary-position" className="bg-slate-800/50 border-white/20 text-white">
                  <SelectValue placeholder="Select secondary position" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="none" className="text-white hover:bg-slate-700">None</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value} className="text-white hover:bg-slate-700">
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-white/60">The player's alternate position (optional)</p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={submitting || !primaryPosition}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {submitting ? "Updating..." : "Update Positions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersManagementClient() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false)
  const [teamAssignDialogOpen, setTeamAssignDialogOpen] = useState(false)
  const [positionDialogOpen, setPositionDialogOpen] = useState(false)
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isActiveColumnExists, setIsActiveColumnExists] = useState(false)
  const [showMigrationAlert, setShowMigrationAlert] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState(30)
  const [discordTablesExist, setDiscordTablesExist] = useState(false)
  const [showDiscordAlert, setShowDiscordAlert] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [validRoles, setValidRoles] = useState(roles)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [newUserSelectedRoles, setNewUserSelectedRoles] = useState<string[]>(["Player"])
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResults, setRefreshResults] = useState<any>(null)
  const [adminKeyDialogOpen, setAdminKeyDialogOpen] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [saveAdminKey, setSaveAdminKey] = useState(true)
  const [adminKeyError, setAdminKeyError] = useState("")
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null)

  const form = useForm<z.infer<typeof userRoleSchema>>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      userId: "",
      roles: [],
    },
  })

  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      email: "",
      gamer_tag_id: "",
      primary_position: "",
      secondary_position: "",
      console: "",
      roles: ["Player"],
    },
  })

  const teamAssignmentForm = useForm<z.infer<typeof teamAssignmentSchema>>({
    resolver: zodResolver(teamAssignmentSchema),
    defaultValues: {
      playerId: "",
      teamId: null,
    },
  })

  const salaryForm = useForm<z.infer<typeof salarySchema>>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      playerId: "",
      salary: 0,
    },
  })

  // Update form values when selected roles change
  useEffect(() => {
    if (form) {
      form.setValue("roles", selectedRoles)
    }
  }, [selectedRoles, form])

  // Update new user form values when new user roles change
  useEffect(() => {
    if (newUserForm) {
      newUserForm.setValue("roles", newUserSelectedRoles)
    }
  }, [newUserSelectedRoles, newUserForm])

  // Load saved admin key if available
  useEffect(() => {
    const savedKey = localStorage.getItem("scs-admin-key")
    if (savedKey) {
      setAdminKey(savedKey)
    }
  }, [])

  // Check authorization and load data
  useEffect(() => {
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
          console.log("No admin role found in user_roles")
          toast({
            title: "Access denied",
            description: "You don't have permission to access the user management panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        console.log("User has admin access")
        setIsAdmin(true)

        // Load data in sequence to avoid rate limits
        try {
          await checkIsActiveColumn()
        } catch (error) {
          console.error("Error checking active column:", error)
        }

        try {
          await checkDiscordTables()
        } catch (error) {
          console.error("Error checking Discord tables:", error)
        }

        try {
          await fetchTeams()
        } catch (error) {
          console.error("Error fetching teams:", error)
        }

        await fetchValidRoles()
        fetchUsers()
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase().trim()
      const filtered = users.filter((user) => user.gamer_tag_id && user.gamer_tag_id.toLowerCase().includes(query))
      setFilteredUsers(filtered)
    }
    setCurrentPage(1)
  }, [searchQuery, users])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Placeholder functions for the functionality
  const checkIsActiveColumn = async () => {
    // Implementation would go here
    console.log("Checking active column...")
  }

  const checkDiscordTables = async () => {
    // Implementation would go here
    console.log("Checking Discord tables...")
  }

  const fetchTeams = async () => {
    // Implementation would go here
    console.log("Fetching teams...")
  }

  const fetchValidRoles = async () => {
    // Implementation would go here
    console.log("Fetching valid roles...")
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch users with their roles, team info, and season registrations
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(`
          *,
          user_roles!inner(role),
          team_memberships(
            team:teams(
              id,
              name
            )
          ),
          season_registrations(
            id,
            season_number,
            status,
            primary_position,
            secondary_position,
            console
          )
        `)
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("Error fetching users:", usersError)
        toast({
          title: "Error fetching users",
          description: usersError.message,
          variant: "destructive",
        })
        return
      }

      // Transform the data to match the expected format
      const transformedUsers = usersData?.map((user: any) => {
        // Extract roles from the user_roles array
        const roles = user.user_roles?.map((ur: any) => ur.role) || []
        
        // Get team info from team_memberships
        const teamMembership = user.team_memberships?.[0]
        const teamName = teamMembership?.team?.name || null
        
        // Get latest season registration
        const latestRegistration = user.season_registrations?.[0] || {}
        
        return {
          id: user.id,
          email: user.email,
          gamer_tag_id: user.gamer_tag_id,
          primary_position: latestRegistration.primary_position || user.primary_position,
          secondary_position: latestRegistration.secondary_position || user.secondary_position,
          console: latestRegistration.console || user.console,
          team_name: teamName,
          roles: roles,
          created_at: user.created_at,
          updated_at: user.updated_at,
          is_active: user.is_active !== false, // Default to true if not set
          season_registration_status: latestRegistration.status || null,
          season_number: latestRegistration.season_number || null
        }
      }) || []

      console.log("Fetched users:", transformedUsers)
      setUsers(transformedUsers)
      setFilteredUsers(transformedUsers)
    } catch (error: any) {
      console.error("Error in fetchUsers:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshUsers = async () => {
    // Implementation would go here
    console.log("Refreshing users...")
  }

  const fixSecondaryPositions = async () => {
    // Implementation would go here
    console.log("Fixing secondary positions...")
  }

  const fixRoleConstraint = async () => {
    // Implementation would go here
    console.log("Fixing role constraint...")
  }

  const exportUsersToCSV = async () => {
    // Implementation would go here
    console.log("Exporting users to CSV...")
  }

  const checkColumnAfterMigration = async () => {
    // Implementation would go here
    console.log("Checking column after migration...")
  }

  const handleAdminKeySubmit = async () => {
    // Implementation would go here
    console.log("Submitting admin key...")
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <Skeleton className="h-[600px] w-full rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-white/70 mt-1">Manage user accounts, roles, and permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {/* Action Buttons */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setNewUserDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
                <Button 
                  variant="outline" 
                  onClick={refreshUsers} 
                  disabled={refreshing}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  onClick={() => {
                    const savedKey = localStorage.getItem("scs-admin-key") || adminKey
                    if (!savedKey && !autoRefresh) {
                      pendingActionRef.current = () => {
                        setAutoRefresh(true)
                        setLastRefreshTime(new Date())
                        setNextRefreshCountdown(30)
                        return Promise.resolve()
                      }
                      setAdminKeyDialogOpen(true)
                    } else {
                      setAutoRefresh(!autoRefresh)
                      if (!autoRefresh) {
                        setLastRefreshTime(new Date())
                        setNextRefreshCountdown(30)
                      }
                    }
                  }}
                  className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-white/20 text-white hover:bg-white/10"}
                >
                  {autoRefresh ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Auto-Refresh ({nextRefreshCountdown}s)
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Auto-Refresh
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={fixSecondaryPositions}
                  disabled={submitting}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${submitting ? "animate-spin" : ""}`} />
                  Fix Positions
                </Button>
                <Button
                  variant="outline"
                  onClick={fixRoleConstraint}
                  disabled={submitting}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <Key className={`mr-2 h-4 w-4 ${submitting ? "animate-spin" : ""}`} />
                  Fix Roles
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                >
                  <Link href="/admin/user-diagnostics">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Diagnostics
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={exportUsersToCSV}
                  disabled={submitting || filteredUsers.length === 0}
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search by gamer tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/50 hover:text-white"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-3 text-sm text-white/70">
                Found {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} matching "{searchQuery}"
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Auto-refresh Status */}
        {autoRefresh && lastRefreshTime && (
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-300">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm">
                  Auto-refresh active. Last refresh: {lastRefreshTime.toLocaleTimeString()}. Next refresh in{" "}
                  {nextRefreshCountdown} seconds.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Migration Alert */}
        {showMigrationAlert && (
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-300 mb-2">Database Update Required</h3>
                  <p className="text-amber-200/80 text-sm mb-4">
                    The user activation feature requires a database update. Please run the SQL below in the Supabase SQL Editor.
                  </p>
                  <div className="bg-amber-500/20 p-3 rounded-lg border border-amber-500/30">
                    <p className="font-medium text-amber-300 text-sm mb-2">SQL Migration:</p>
                    <pre className="text-amber-200 text-xs overflow-x-auto">
                      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
                      <br />
                      UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
                    </pre>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                      onClick={checkColumnAfterMigration}
                      disabled={submitting}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${submitting ? "animate-spin" : ""}`} />
                      {submitting ? "Checking..." : "I've run the migration, check again"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discord Alert */}
        {showDiscordAlert && (
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-300 mb-2">Discord Integration Not Set Up</h3>
                  <p className="text-blue-200/80 text-sm mb-4">
                    Discord role synchronization is not available because the Discord integration tables don't exist.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                    asChild
                  >
                    <Link href="/admin/scs-bot">Set Up Discord Integration</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Users</CardTitle>
              <CardDescription className="text-white/70">Manage user accounts and assign roles</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[500px]" />
            ) : (
              <>
                {/* Pagination Info */}
                {!loading && filteredUsers.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-white/70">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}{" "}
                      users
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-white/70">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-md border border-white/20 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Position</TableHead>
                        <TableHead className="text-white">Console</TableHead>
                        <TableHead className="text-white">Team</TableHead>
                        <TableHead className="text-white">Roles</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-white/70 py-8">
                            {searchQuery ? "No users found matching your search." : "No users found."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((user) => (
                          <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium">{user.gamer_tag_id || user.email}</div>
                                  <div className="text-sm text-white/60">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">
                              {user.primary_position && (
                                <Badge className={positionColors[positionAbbreviations[user.primary_position as keyof typeof positionAbbreviations] as keyof typeof positionColors]}>
                                  {positionAbbreviations[user.primary_position as keyof typeof positionAbbreviations]}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-white">
                              <Badge variant="outline" className="border-white/20 text-white">
                                {user.console}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white">
                              {user.team_name || "No Team"}
                            </TableCell>
                            <TableCell className="text-white">
                              <div className="flex gap-1">
                                {user.roles?.map((role: string) => (
                                  <Badge key={role} variant="outline" className="border-white/20 text-white text-xs">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-white">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setDialogOpen(true)
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setPositionDialogOpen(true)
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Target className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Position Update Dialog */}
      <PositionUpdateDialog
        open={positionDialogOpen}
        onOpenChange={setPositionDialogOpen}
        user={selectedUser}
        onSubmit={async (values) => {
          setSubmitting(true)
          try {
            // Update the user's positions in the database
            const { error } = await supabase
              .from("users")
              .update({
                primary_position: values.primary_position,
                secondary_position: values.secondary_position,
                updated_at: new Date().toISOString(),
              })
              .eq("id", values.userId)

            if (error) {
              throw error
            }

            // Also update any season registrations for this user
            const { error: regError } = await supabase
              .from("season_registrations")
              .update({
                primary_position: values.primary_position,
                secondary_position: values.secondary_position,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", values.userId)

            if (regError) {
              console.warn("Could not update season registrations:", regError)
            }

            toast({
              title: "Positions updated",
              description: `Positions for ${selectedUser?.gamer_tag_id || selectedUser?.email} have been updated.`,
            })

            // Refresh the user list
            await fetchUsers()
            setPositionDialogOpen(false)
          } catch (error: any) {
            console.error("Error updating positions:", error)
            toast({
              title: "Error",
              description: error.message || "Failed to update positions",
              variant: "destructive",
            })
          } finally {
            setSubmitting(false)
          }
        }}
        submitting={submitting}
      />

      {/* Admin Key Dialog */}
      <Dialog open={adminKeyDialogOpen} onOpenChange={setAdminKeyDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Admin Verification Required</DialogTitle>
            <DialogDescription className="text-white/70">
              Please enter your admin verification key to continue with this operation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="admin-key" className="text-sm font-medium text-white">
                Admin Key
              </label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="bg-slate-800/50 border-white/20 text-white"
              />
              {adminKeyError && <p className="text-sm text-red-400">{adminKeyError}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-key"
                checked={saveAdminKey}
                onCheckedChange={(checked) => setSaveAdminKey(checked === true)}
              />
              <div className="grid gap-1.5">
                <label
                  htmlFor="save-key"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                >
                  Save key for future operations
                </label>
                <p className="text-sm text-white/60">
                  This will store the key in your browser for this session.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAdminKeySubmit} 
              disabled={!adminKey}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Key className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
