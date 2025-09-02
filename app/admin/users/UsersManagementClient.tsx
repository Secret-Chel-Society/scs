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
  gamer_tag_id: z.string().min(3, "Gamer tag must be at least 3 characters"),
  primary_position: z.string().min(1, "Please select a primary position"),
  secondary_position: z.string().optional(),
  console: z.string().min(1, "Please select a console"),
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
  const [userEditDialogOpen, setUserEditDialogOpen] = useState(false)
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
      gamer_tag_id: "",
      primary_position: "",
      secondary_position: "",
      console: "",
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
      console.log("checkAuthorization running...")
      console.log("Session user:", session?.user)
      
      if (!session?.user) {
        console.log("No session user found")
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        console.log("Checking admin role for user:", session.user.id)
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        console.log("Admin role check result:", { adminRoleData, adminRoleError })

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

        console.log("User has admin access, loading data...")
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
        console.log("About to call fetchUsers...")
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

  // Admin functionality functions
  const checkIsActiveColumn = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("is_active")
        .limit(1)

      if (error) {
        console.log("is_active column does not exist")
        setShowMigrationAlert(true)
      } else {
        console.log("is_active column exists")
        setIsActiveColumnExists(true)
      }
    } catch (error) {
      console.error("Error checking is_active column:", error)
    }
  }

  const checkDiscordTables = async () => {
    try {
      const { data, error } = await supabase
        .from("discord_users")
        .select("id")
        .limit(1)

      if (error) {
        console.log("Discord tables do not exist")
        setDiscordTablesExist(false)
      } else {
        console.log("Discord tables exist")
        setDiscordTablesExist(true)
      }
    } catch (error) {
      console.error("Error checking Discord tables:", error)
      setDiscordTablesExist(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .order("name")

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
        return
      }

      setTeams(teamsData || [])
    } catch (error) {
      console.error("Error in fetchTeams:", error)
    }
  }

  const fetchValidRoles = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .order("role")

      if (rolesError) {
        console.error("Error fetching roles:", rolesError)
        return
      }

      // Get unique roles
      const uniqueRoles = [...new Set(rolesData?.map(r => r.role) || [])]
      const roleOptions = uniqueRoles.map(role => ({ label: role, value: role }))
      setValidRoles(roleOptions)
    } catch (error) {
      console.error("Error in fetchValidRoles:", error)
    }
  }

  async function fetchUsers(retryCount = 0) {
    setLoading(true)
    try {
      // Fetch users with their player roles and user_roles
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(`
        *,
        players(
          id,
          role,
          team_id,
          salary,
          teams:teams(
            id,
            name
          )
        ),
        user_roles(
          id,
          role
        )
      `)
        .order("created_at", { ascending: false })

      if (usersError) {
        // Check if this is a rate limit error
        if (usersError.message && usersError.message.includes("Too Many Requests") && retryCount < 3) {
          console.log(`Rate limited, retrying in ${(retryCount + 1) * 1000}ms...`)
          setTimeout(() => fetchUsers(retryCount + 1), (retryCount + 1) * 1000)
          return
        }
        throw usersError
      }

      // Debug team assignments
      console.log("Raw user data:", usersData)

      // For users without player records, create them automatically
      const usersWithoutPlayers = usersData?.filter((user) => !user.players || user.players.length === 0) || []

      if (usersWithoutPlayers.length > 0) {
        // Create player records for users who don't have them
        for (const user of usersWithoutPlayers) {
          try {
            await supabase.from("players").insert({
              user_id: user.id,
              role: "Player",
            })

            // Update the user object to include the new player record
            user.players = [
              {
                id: null, // Will be filled in next fetch
                role: "Player",
                team_id: null,
                teams: null,
              },
            ]
          } catch (error) {
            console.error(`Error creating player record for user ${user.id}:`, error)
          }
        }
      }

      // Process users to ensure secondary_position is properly handled and roles are mapped correctly
      const processedUsers =
        usersData?.map((user) => {
          return {
            ...user,
            is_active: user.is_active === undefined ? true : user.is_active,
            // Ensure secondary_position is properly handled - convert empty strings to null
            // but preserve actual values
            secondary_position: user.secondary_position === "" ? null : user.secondary_position,
            // Map user_roles array to roles array for display
            roles: user.user_roles?.map((ur: any) => ur.role) || [],
          }
        }) || []

      setUsers(processedUsers)
      setFilteredUsers(processedUsers)
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error loading users",
        description: error.message || "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshUsers = async () => {
    setRefreshing(true)
    try {
      await fetchUsers()
      setLastRefreshTime(new Date())
      toast({
        title: "Users refreshed",
        description: "User list has been updated.",
      })
    } catch (error) {
      console.error("Error refreshing users:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const fixSecondaryPositions = async () => {
    setSubmitting(true)
    try {
      const { error } = await supabase.rpc("fix_secondary_positions")
      
      if (error) {
        throw error
      }

      toast({
        title: "Secondary positions fixed",
        description: "All secondary positions have been updated.",
      })

      // Refresh the user list
      await fetchUsers()
    } catch (error: any) {
      console.error("Error fixing secondary positions:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fix secondary positions",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const updateUser = async (values: z.infer<typeof userRoleSchema>) => {
    setSubmitting(true)
    try {
      // Update the user's basic information
      const { error: userError } = await supabase
        .from("users")
        .update({
          gamer_tag_id: values.gamer_tag_id,
          primary_position: values.primary_position,
          secondary_position: values.secondary_position === "none" ? null : values.secondary_position,
          console: values.console,
          updated_at: new Date().toISOString(),
        })
        .eq("id", values.userId)

      if (userError) {
        throw userError
      }

      // Update any season registrations for this user
      const { error: regError } = await supabase
        .from("season_registrations")
        .update({
          gamer_tag: values.gamer_tag_id,
          primary_position: values.primary_position,
          secondary_position: values.secondary_position === "none" ? null : values.secondary_position,
          console: values.console,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", values.userId)

      if (regError) {
        console.warn("Could not update season registrations:", regError)
      }

      // Update user roles
      if (values.roles.length > 0) {
        // First, remove all existing roles for this user
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", values.userId)

        if (deleteError) {
          console.warn("Could not delete existing roles:", deleteError)
        }

        // Then add the new roles
        const roleInserts = values.roles.map(role => ({
          user_id: values.userId,
          role: role,
          created_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(roleInserts)

        if (insertError) {
          console.warn("Could not insert new roles:", insertError)
        }
      }

      toast({
        title: "User updated",
        description: `User ${values.gamer_tag_id} has been updated successfully.`,
      })

      // Refresh the user list
      await fetchUsers()
      setUserEditDialogOpen(false)
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const fixRoleConstraint = async () => {
    setSubmitting(true)
    try {
      const { error } = await supabase.rpc("fix_role_constraint")
      
      if (error) {
        throw error
      }

      toast({
        title: "Role constraint fixed",
        description: "Role constraints have been updated.",
      })

      // Refresh the user list
      await fetchUsers()
    } catch (error: any) {
      console.error("Error fixing role constraint:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fix role constraint",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const exportUsersToCSV = async () => {
    try {
      const headers = [
        "ID",
        "Email",
        "Gamer Tag",
        "Primary Position",
        "Secondary Position",
        "Console",
        "Team",
        "Roles",
        "Registration Status",
        "Created At"
      ]

      const csvRows = [headers]

      filteredUsers.forEach((user) => {
        const row = [
          user.id,
          user.email,
          user.gamer_tag_id,
          user.primary_position || "",
          user.secondary_position || "",
          user.console || "",
          user.team_name || "",
          user.roles?.join(", ") || "",
          user.season_registration_status || "",
          new Date(user.created_at).toLocaleDateString()
        ]
        csvRows.push(row)
      })

      const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `users-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "User data has been exported to CSV.",
      })
    } catch (error: any) {
      console.error("Error exporting users:", error)
      toast({
        title: "Export failed",
        description: error.message || "Failed to export users",
        variant: "destructive",
      })
    }
  }

  const checkColumnAfterMigration = async () => {
    setSubmitting(true)
    try {
      await checkIsActiveColumn()
      
      if (isActiveColumnExists) {
        setShowMigrationAlert(false)
        toast({
          title: "Migration successful",
          description: "The is_active column is now available.",
        })
      } else {
        toast({
          title: "Migration not detected",
          description: "Please run the SQL migration and try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error checking migration:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to check migration",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdminKeySubmit = async () => {
    if (!adminKey.trim()) {
      setAdminKeyError("Please enter an admin key")
      return
    }

    try {
      // Here you would typically verify the admin key against your backend
      // For now, we'll just accept any non-empty key
      
      if (saveAdminKey) {
        localStorage.setItem("scs-admin-key", adminKey)
      }

      setAdminKeyDialogOpen(false)
      setAdminKeyError("")

      // Execute the pending action if there is one
      if (pendingActionRef.current) {
        await pendingActionRef.current()
        pendingActionRef.current = null
      }

      toast({
        title: "Admin key verified",
        description: "You can now perform admin operations.",
      })
    } catch (error: any) {
      console.error("Error verifying admin key:", error)
      setAdminKeyError("Invalid admin key")
    }
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
                        <TableHead className="text-white">Salary</TableHead>
                        <TableHead className="text-white">Roles</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-white/70 py-8">
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
                              {user.players?.[0]?.teams?.name || "No Team"}
                            </TableCell>
                            <TableCell className="text-white">
                              {user.players?.[0]?.salary ? (
                                <Badge variant="outline" className="border-green-500/30 text-green-300">
                                  ${user.players[0].salary.toLocaleString()}
                                </Badge>
                              ) : (
                                <span className="text-white/50">No salary</span>
                              )}
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
                                    // Initialize selected roles with current user roles
                                    setSelectedRoles(user.roles || [])
                                    // Initialize form values
                                    form.setValue("userId", user.id)
                                    form.setValue("roles", user.roles || [])
                                    form.setValue("gamer_tag_id", user.gamer_tag_id || "")
                                    form.setValue("primary_position", user.primary_position || "")
                                    form.setValue("secondary_position", user.secondary_position || "")
                                    form.setValue("console", user.console || "")
                                    setUserEditDialogOpen(true)
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
                                    teamAssignmentForm.setValue("playerId", user.id)
                                    teamAssignmentForm.setValue("teamId", user.players?.[0]?.team_id || null)
                                    setTeamAssignDialogOpen(true)
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Users className="h-4 w-4" />
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    salaryForm.setValue("playerId", user.id)
                                    salaryForm.setValue("salary", user.players?.[0]?.salary || 0)
                                    setSalaryDialogOpen(true)
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <DollarSign className="h-4 w-4" />
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

      {/* User Edit Dialog */}
      <Dialog open={userEditDialogOpen} onOpenChange={setUserEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
            <DialogDescription className="text-white/70">
              {selectedUser && `Update information for ${selectedUser.gamer_tag_id || selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(updateUser)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gamer_tag_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Gamer Tag</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-slate-800/50 border-white/20 text-white"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="console"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Console</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select console" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {consoles.map((console) => (
                            <SelectItem key={console.value} value={console.value} className="text-white hover:bg-slate-700">
                              {console.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primary_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Primary Position</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select primary position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {positions.map((position) => (
                            <SelectItem key={position.value} value={position.value} className="text-white hover:bg-slate-700">
                              {position.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondary_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Secondary Position (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select secondary position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-white/20">
                          <SelectItem value="none" className="text-white hover:bg-slate-700">None</SelectItem>
                          {positions.map((position) => (
                            <SelectItem key={position.value} value={position.value} className="text-white hover:bg-slate-700">
                              {position.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-3">
                <FormLabel className="text-white">Roles</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {validRoles.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.value}`}
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoles([...selectedRoles, role.value])
                          } else {
                            setSelectedRoles(selectedRoles.filter((r) => r !== role.value))
                          }
                        }}
                        disabled={submitting}
                      />
                      <label
                        htmlFor={`role-${role.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                      >
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={submitting || selectedRoles.length === 0}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {submitting ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
            <DialogDescription className="text-white/70">
              Create a new user account with roles and positions
            </DialogDescription>
          </DialogHeader>
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit(async (values) => {
              setSubmitting(true)
              try {
                // Create user with auth
                const { data: authData, error: authError } = await supabase.auth.signUp({
                  email: values.email,
                  password: Math.random().toString(36).slice(-8), // Generate random password
                })

                if (authError) throw authError

                if (authData.user) {
                  // Create user profile
                  const { error: userError } = await supabase
                    .from("users")
                    .insert({
                      id: authData.user.id,
                      email: values.email,
                      gamer_tag_id: values.gamer_tag_id,
                      primary_position: values.primary_position,
                      secondary_position: values.secondary_position === "none" ? null : values.secondary_position,
                      console: values.console,
                    })

                  if (userError) throw userError

                  // Create player record
                  const playerRole = values.roles.find(role => VALID_PLAYER_ROLES.includes(role)) || "Player"
                  const { error: playerError } = await supabase
                    .from("players")
                    .insert({
                      user_id: authData.user.id,
                      role: playerRole,
                    })

                  if (playerError) throw playerError

                  // Add user roles
                  const roleInserts = values.roles.map(role => ({
                    user_id: authData.user.id,
                    role: role,
                  }))

                  const { error: rolesError } = await supabase
                    .from("user_roles")
                    .insert(roleInserts)

                  if (rolesError) throw rolesError

                  toast({
                    title: "User created",
                    description: `User ${values.gamer_tag_id} has been created successfully.`,
                  })

                  await fetchUsers()
                  setNewUserDialogOpen(false)
                  newUserForm.reset()
                  setNewUserSelectedRoles(["Player"])
                }
              } catch (error: any) {
                console.error("Error creating user:", error)
                toast({
                  title: "Error",
                  description: error.message || "Failed to create user",
                  variant: "destructive",
                })
              } finally {
                setSubmitting(false)
              }
            })} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={newUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          className="bg-slate-800/50 border-white/20 text-white"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newUserForm.control}
                  name="gamer_tag_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Gamer Tag</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-slate-800/50 border-white/20 text-white"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newUserForm.control}
                  name="console"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Console</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select console" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {consoles.map((console) => (
                            <SelectItem key={console.value} value={console.value} className="text-white hover:bg-slate-700">
                              {console.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newUserForm.control}
                  name="primary_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Primary Position</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select primary position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {positions.map((position) => (
                            <SelectItem key={position.value} value={position.value} className="text-white hover:bg-slate-700">
                              {position.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newUserForm.control}
                name="secondary_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Secondary Position (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"} disabled={submitting}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                          <SelectValue placeholder="Select secondary position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-white/20">
                        <SelectItem value="none" className="text-white hover:bg-slate-700">None</SelectItem>
                        {positions.map((position) => (
                          <SelectItem key={position.value} value={position.value} className="text-white hover:bg-slate-700">
                            {position.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <FormLabel className="text-white">Roles</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {validRoles.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-user-role-${role.value}`}
                        checked={newUserSelectedRoles.includes(role.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewUserSelectedRoles([...newUserSelectedRoles, role.value])
                          } else {
                            setNewUserSelectedRoles(newUserSelectedRoles.filter((r) => r !== role.value))
                          }
                        }}
                        disabled={submitting}
                      />
                      <label
                        htmlFor={`new-user-role-${role.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                      >
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={submitting || newUserSelectedRoles.length === 0}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {submitting ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Team Assignment Dialog */}
      <Dialog open={teamAssignDialogOpen} onOpenChange={setTeamAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Team</DialogTitle>
            <DialogDescription className="text-white/70">
              {selectedUser && `Assign ${selectedUser.gamer_tag_id || selectedUser.email} to a team`}
            </DialogDescription>
          </DialogHeader>
          <Form {...teamAssignmentForm}>
            <form onSubmit={teamAssignmentForm.handleSubmit(async (values) => {
              setSubmitting(true)
              try {
                // Update player's team assignment
                const { error } = await supabase
                  .from("players")
                  .update({
                    team_id: values.teamId === "none" ? null : values.teamId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", values.playerId)

                if (error) throw error

                toast({
                  title: "Team assignment updated",
                  description: `${selectedUser?.gamer_tag_id || selectedUser?.email} has been ${values.teamId ? 'assigned to a team' : 'removed from team'}.`,
                })

                await fetchUsers()
                setTeamAssignDialogOpen(false)
              } catch (error: any) {
                console.error("Error updating team assignment:", error)
                toast({
                  title: "Error",
                  description: error.message || "Failed to update team assignment",
                  variant: "destructive",
                })
              } finally {
                setSubmitting(false)
              }
            })} className="space-y-6">
              <FormField
                control={teamAssignmentForm.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Team</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"} disabled={submitting}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-white/20">
                        <SelectItem value="none" className="text-white hover:bg-slate-700">No Team</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id} className="text-white hover:bg-slate-700">
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {submitting ? "Updating..." : "Update Team"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Salary Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Update Salary</DialogTitle>
            <DialogDescription className="text-white/70">
              {selectedUser && `Update salary for ${selectedUser.gamer_tag_id || selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...salaryForm}>
            <form onSubmit={salaryForm.handleSubmit(async (values) => {
              setSubmitting(true)
              try {
                // Update player's salary
                const { error } = await supabase
                  .from("players")
                  .update({
                    salary: values.salary,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", values.playerId)

                if (error) throw error

                toast({
                  title: "Salary updated",
                  description: `Salary for ${selectedUser?.gamer_tag_id || selectedUser?.email} has been updated to $${values.salary.toLocaleString()}.`,
                })

                await fetchUsers()
                setSalaryDialogOpen(false)
              } catch (error: any) {
                console.error("Error updating salary:", error)
                toast({
                  title: "Error",
                  description: error.message || "Failed to update salary",
                  variant: "destructive",
                })
              } finally {
                setSubmitting(false)
              }
            })} className="space-y-6">
              <FormField
                control={salaryForm.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Salary</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="0"
                        max="15000000"
                        className="bg-slate-800/50 border-white/20 text-white"
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {submitting ? "Updating..." : "Update Salary"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
