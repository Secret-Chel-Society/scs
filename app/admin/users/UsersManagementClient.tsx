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
} from "lucide-react"

// Define valid player roles - these must match the database constraint
const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner"]

// Update the roles array to match the database constraint
// Replace the existing roles array with this one
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
  LW: "text-green-600 font-medium",
  C: "text-red-600 font-medium",
  RW: "text-blue-600 font-medium",
  LD: "text-cyan-600 font-medium",
  RD: "text-yellow-600 font-medium",
  G: "text-purple-600 font-medium",
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

// New schema for salary setting
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
  // Use simple state instead of React Hook Form
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState<string | null>(null)

  // Update state when user changes
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Positions</DialogTitle>
          <DialogDescription>{user && `Update positions for ${user.gamer_tag_id || user.email}`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="primary-position" className="text-sm font-medium">
                Primary Position
              </label>
              <Select value={primaryPosition} onValueChange={setPrimaryPosition} disabled={submitting}>
                <SelectTrigger id="primary-position">
                  <SelectValue placeholder="Select primary position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">The player's main position</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="secondary-position" className="text-sm font-medium">
                Secondary Position (Optional)
              </label>
              <Select
                value={secondaryPosition || "none"}
                onValueChange={(value) => setSecondaryPosition(value === "none" ? null : value)}
                disabled={submitting}
              >
                <SelectTrigger id="secondary-position">
                  <SelectValue placeholder="Select secondary position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">The player's alternate position (optional)</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting || !primaryPosition}>
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
  const [positionDialogOpen, setPositionDialogOpen] = useState(false) // New state for position dialog
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false) // New state for salary dialog
  const [submitting, setSubmitting] = useState(false)
  const [isActiveColumnExists, setIsActiveColumnExists] = useState(false)
  const [showMigrationAlert, setShowMigrationAlert] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState(30)

  // Discord integration state
  const [discordTablesExist, setDiscordTablesExist] = useState(false)
  const [showDiscordAlert, setShowDiscordAlert] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])

  // Moved the validRoles state inside the component
  const [validRoles, setValidRoles] = useState(roles)

  // New state for managing selected roles
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [newUserSelectedRoles, setNewUserSelectedRoles] = useState<string[]>(["Player"])

  const [refreshing, setRefreshing] = useState(false)
  const [refreshResults, setRefreshResults] = useState<any>(null)

  // Admin key dialog state
  const [adminKeyDialogOpen, setAdminKeyDialogOpen] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [saveAdminKey, setSaveAdminKey] = useState(true)
  const [adminKeyError, setAdminKeyError] = useState("")

  // Use a ref to store the callback function
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

  // New form for salary setting
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
    const savedKey = localStorage.getItem("mghl-admin-key")
    if (savedKey) {
      setAdminKey(savedKey)
    }
  }, [])

  // Update the useEffect that calls checkAuthorization to also fetch valid roles
  // In the useEffect that calls checkAuthorization, add:
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
        // Only check for Admin role in user_roles table
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        // If there's an error or no admin role found, deny access
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

        // Fetch valid roles (with built-in fallback)
        await fetchValidRoles()

        // Finally fetch users
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
    // Reset to first page when search changes
    setCurrentPage(1)
  }, [searchQuery, users])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Auto-refresh timer
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null
    let countdownInterval: NodeJS.Timeout | null = null

    if (autoRefresh && !refreshing) {
      // Make sure we have an admin key before proceeding
      const savedKey = localStorage.getItem("mghl-admin-key") || adminKey
      if (!savedKey) {
        // If no admin key is available, disable auto-refresh
        setAutoRefresh(false)
        toast({
          title: "Auto-refresh disabled",
          description: "Admin key is required for auto-refresh",
          variant: "destructive",
        })
        return
      }

      // Set up the main refresh interval (30 seconds)
      refreshInterval = setInterval(() => {
        if (!refreshing) {
          // Use the auto-refresh version that doesn't require admin key verification
          autoRefreshUsers()
          setLastRefreshTime(new Date())
          setNextRefreshCountdown(30)
        }
      }, 30000)

      // Set up countdown timer (updates every second)
      countdownInterval = setInterval(() => {
        setNextRefreshCountdown((prev) => Math.max(0, prev - 1))
      }, 1000)

      // Initial refresh when auto-refresh is turned on
      if (!lastRefreshTime) {
        autoRefreshUsers()
        setLastRefreshTime(new Date())
        setNextRefreshCountdown(30)
      }
    }

    // Cleanup function
    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [autoRefresh, refreshing])

  // Add function to check if Discord tables exist
  async function checkDiscordTables() {
    try {
      console.log("Checking if Discord tables exist...")

      // Try to query the discord_users table to see if it exists
      const { data, error } = await supabase.from("discord_users").select("id").limit(1)

      if (error) {
        // If we get a "relation does not exist" error, the table doesn't exist
        if (error.message && error.message.includes("does not exist")) {
          console.log("Discord tables do not exist")
          setDiscordTablesExist(false)
          setShowDiscordAlert(true)
          return false
        } else {
          // Some other error, but table might exist
          console.warn("Error checking Discord tables:", error)
          setDiscordTablesExist(false)
          return false
        }
      } else {
        // No error means the table exists
        console.log("Discord tables exist")
        setDiscordTablesExist(true)
        setShowDiscordAlert(false)
        return true
      }
    } catch (error) {
      console.error("Error checking Discord tables:", error)
      setDiscordTablesExist(false)
      setShowDiscordAlert(true)
      return false
    }
  }

  async function fetchTeams() {
    try {
      const { data, error } = await supabase.from("teams").select("id, name").order("name")

      if (error) {
        throw error
      }

      setTeams(data || [])
    } catch (error: any) {
      console.error("Error fetching teams:", error)
      toast({
        title: "Error loading teams",
        description: error.message || "Failed to load teams",
        variant: "destructive",
      })
    }
  }

  // Add a function to fetch valid roles from the database
  // Add this function after the fetchTeams function
  // Update the fetchValidRoles function to handle errors better and add retry logic for fetchUsers

  // Replace the fetchValidRoles function with this implementation
  async function fetchValidRoles() {
    try {
      // Use default roles instead of fetching from API to avoid rate limits
      setValidRoles([
        { label: "Player", value: "Player" },
        { label: "GM", value: "GM" },
        { label: "AGM", value: "AGM" },
        { label: "Owner", value: "Owner" },
        { label: "Admin", value: "Admin" },
      ])

      // Optionally try to fetch from API, but don't rely on it
      try {
        const response = await fetch("/api/admin/get-valid-roles")
        if (response.ok) {
          const data = await response.json()
          if (data.validRoles && data.validRoles.length > 0) {
            const validRolesArray = data.validRoles.map((role: string) => ({
              label: role,
              value: role,
            }))
            setValidRoles(validRolesArray)
          }
        }
      } catch (apiError) {
        console.log("Using default roles due to API error:", apiError)
        // Continue with default roles
      }
    } catch (error) {
      console.error("Error in fetchValidRoles:", error)
      // Continue with default roles
    }
  }

  // Replace the fetchUsers function with this implementation that includes retry logic
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

      // Process users to ensure secondary_position is properly handled
      const processedUsers =
        usersData?.map((user) => {
          return {
            ...user,
            is_active: user.is_active === undefined ? true : user.is_active,
            // Ensure secondary_position is properly handled - convert empty strings to null
            // but preserve actual values
            secondary_position: user.secondary_position === "" ? null : user.secondary_position,
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

  async function checkIsActiveColumn() {
    try {
      // Try to fetch a user with the is_active column
      const { data, error } = await supabase.from("users").select("is_active").limit(1)

      // If there's no error, the column exists
      if (!error) {
        setIsActiveColumnExists(true)
        setShowMigrationAlert(false)
        return true
      } else {
        console.error("is_active column check error:", error)
        setIsActiveColumnExists(false)
        setShowMigrationAlert(true)
        return false
      }
    } catch (error) {
      console.error("Error checking is_active column:", error)
      setIsActiveColumnExists(false)
      setShowMigrationAlert(true)
      return false
    }
  }

  async function checkColumnAfterMigration() {
    setSubmitting(true)
    try {
      await checkIsActiveColumn()

      if (isActiveColumnExists) {
        toast({
          title: "Column detected",
          description: "The is_active column has been successfully added to the database.",
        })
        fetchUsers()
      } else {
        toast({
          title: "Column not found",
          description: "The is_active column was not found. Please make sure you've run the SQL migration.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking column:", error)
      toast({
        title: "Error checking column",
        description: "Failed to verify if the column exists.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Function to check if we have an admin key and prompt for one if needed
  function withAdminKey(action: () => Promise<void>) {
    const savedKey = localStorage.getItem("mghl-admin-key")
    if (savedKey) {
      setAdminKey(savedKey)
      return action()
    } else {
      pendingActionRef.current = action
      setAdminKeyDialogOpen(true)
      return Promise.resolve()
    }
  }

  // Handle admin key submission
  const handleAdminKeySubmit = async () => {
    try {
      setAdminKeyError("")

      if (!adminKey.trim()) {
        setAdminKeyError("Admin key is required")
        return
      }

      // Save key if requested
      if (saveAdminKey && adminKey) {
        localStorage.setItem("mghl-admin-key", adminKey)
      }

      // Close dialog
      setAdminKeyDialogOpen(false)

      // Execute the action that required the admin key
      if (pendingActionRef.current) {
        await pendingActionRef.current()
        pendingActionRef.current = null
      }
    } catch (error: any) {
      console.error("Error in admin key submission:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    }
  }

  async function refreshUsers() {
    return withAdminKey(async () => {
      try {
        setRefreshing(true)
        setRefreshResults(null)

        // Get admin key from state or localStorage
        const keyToUse = adminKey || localStorage.getItem("mghl-admin-key") || ""

        if (!keyToUse) {
          throw new Error("Admin key is required to refresh users")
        }

        console.log("Sending refresh users request")
        const response = await fetch("/api/admin/refresh-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminKey: keyToUse,
            allowedRoles: roles.map((r) => r.value), // Send the allowed roles to the server
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error("Refresh users error:", data)

          // If unauthorized, clear the stored key as it might be invalid
          if (response.status === 401) {
            localStorage.removeItem("mghl-admin-key")
            setAdminKey("")

            // Prompt for a new key
            pendingActionRef.current = refreshUsers
            setAdminKeyDialogOpen(true)
            throw new Error("Invalid admin key. Please enter a valid key.")
          }

          throw new Error(data.error || "Failed to refresh users")
        }

        setRefreshResults(data.results)

        toast({
          title: "Users refreshed",
          description: `Updated ${data.results.updated} users, created ${data.results.playersCreated} players, updated ${data.results.rolesUpdated} roles`,
        })

        // Refresh the user list to show updated data
        fetchUsers()
      } catch (error: any) {
        console.error("Error refreshing users:", error)
        toast({
          title: "Error refreshing users",
          description: error.message || "Failed to refresh users",
          variant: "destructive",
        })
      } finally {
        setRefreshing(false)
      }
    })
  }

  // Add this new function after the refreshUsers function:
  async function autoRefreshUsers() {
    try {
      setRefreshing(true)

      // Get admin key from localStorage or component state
      const keyToUse = localStorage.getItem("mghl-admin-key") || adminKey

      if (!keyToUse) {
        // If no key is available, disable auto-refresh
        setAutoRefresh(false)
        throw new Error("Admin key is required for auto-refresh")
      }

      console.log("Auto-refreshing users")
      const response = await fetch("/api/admin/refresh-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey: keyToUse,
          allowedRoles: roles.map((r) => r.value),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Auto-refresh users error:", data)

        // If unauthorized, disable auto-refresh
        if (response.status === 401) {
          localStorage.removeItem("mghl-admin-key")
          setAdminKey("")
          setAutoRefresh(false)
          throw new Error("Invalid admin key. Auto-refresh disabled.")
        }

        throw new Error(data.error || "Failed to refresh users")
      }

      // Update refresh results silently (no toast)
      setRefreshResults(data.results)

      // Refresh the user list to show updated data
      fetchUsers()
    } catch (error: any) {
      console.error("Error in auto-refresh:", error)
      // Disable auto-refresh on error
      setAutoRefresh(false)
      toast({
        title: "Auto-refresh disabled",
        description: error.message || "Failed to auto-refresh users",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Add this function to the component
  async function fixSecondaryPositions() {
    return withAdminKey(async () => {
      try {
        setSubmitting(true)

        // Get admin key from state or localStorage
        const keyToUse = adminKey || localStorage.getItem("mghl-admin-key") || ""

        if (!keyToUse) {
          throw new Error("Admin key is required to fix secondary positions")
        }

        const response = await fetch("/api/admin/fix-secondary-positions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminKey: keyToUse }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fix secondary positions")
        }

        // Refresh the user list
        await fetchUsers()

        toast({
          title: "Secondary Positions Fixed",
          description: `Fixed ${data.fixed} out of ${data.total} users with empty secondary positions.${
            data.errors ? ` ${data.errors.length} errors occurred.` : ""
          }`,
        })
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
    })
  }

  // Add this function to the component
  async function fixRoleConstraint() {
    return withAdminKey(async () => {
      try {
        setSubmitting(true)

        // Get admin key from state or localStorage
        const keyToUse = adminKey || localStorage.getItem("mghl-admin-key") || ""

        if (!keyToUse) {
          throw new Error("Admin key is required to fix role constraint")
        }

        const response = await fetch("/api/admin/run-migration/fix-user-roles-constraint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminKey: keyToUse }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fix role constraint")
        }

        toast({
          title: "Role Constraint Fixed",
          description: "The role constraint has been updated successfully. You can now assign all roles.",
        })

        // Refresh valid roles after fixing the constraint
        await fetchValidRoles()
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
    })
  }

  // Add this function after the fixRoleConstraint function
  async function exportUsersToCSV() {
    try {
      setSubmitting(true)

      // Prepare user data for CSV export
      const csvData = filteredUsers.map((user) => {
        const playerRole = user.players && user.players.length > 0 ? user.players[0].role : ""
        const teamName =
          user.players && user.players.length > 0 && user.players[0].teams ? user.players[0].teams.name : "Free Agent"
        const salary = user.players && user.players.length > 0 ? user.players[0].salary || 0 : 0

        //
        // Get all roles (player role + user_roles)
        const allRoles = []
        if (playerRole) allRoles.push(playerRole)
        if (user.user_roles) {
          user.user_roles.forEach((roleObj: any) => {
            if (!allRoles.includes(roleObj.role)) {
              allRoles.push(roleObj.role)
            }
          })
        }

        return {
          email: user.email,
          gamer_tag: user.gamer_tag_id || "",
          primary_position: user.primary_position || "",
          secondary_position: user.secondary_position || "",
          console: user.console || "",
          roles: allRoles.join(", "),
          team: teamName,
          salary: salary,
          status: isActiveColumnExists ? (user.is_active ? "Active" : "Inactive") : "Unknown",
          created_at: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
          updated_at: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "",
        }
      })

      // Generate CSV content
      let csvContent =
        "Email,Gamer Tag,Primary Position,Secondary Position,Console,Roles,Team,Salary,Status,Created Date,Updated Date\n"

      csvData.forEach((row) => {
        const escapeCsvField = (field: string | number) => {
          const fieldStr = String(field)
          if (fieldStr.includes(",") || fieldStr.includes('"') || fieldStr.includes("\n")) {
            return `"${fieldStr.replace(/"/g, '""')}"`
          }
          return fieldStr
        }

        csvContent += `${escapeCsvField(row.email)},${escapeCsvField(row.gamer_tag)},${escapeCsvField(row.primary_position)},${escapeCsvField(row.secondary_position)},${escapeCsvField(row.console)},${escapeCsvField(row.roles)},${escapeCsvField(row.team)},${escapeCsvField(row.salary)},${escapeCsvField(row.status)},${escapeCsvField(row.created_at)},${escapeCsvField(row.updated_at)}\n`
      })

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `mghl-users-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `Exported ${csvData.length} users to CSV file`,
      })
    } catch (error: any) {
      console.error("Error exporting users:", error)
      toast({
        title: "Export failed",
        description: error.message || "Failed to export users to CSV",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openRoleDialog = (user: any) => {
    setSelectedUser(user)

    // Get current roles from player role and user_roles
    const currentRoles = []

    // Add player role if exists
    if (user.players && user.players.length > 0) {
      currentRoles.push(user.players[0].role)
    }

    // Add user_roles
    if (user.user_roles) {
      user.user_roles.forEach((roleObj: any) => {
        if (!currentRoles.includes(roleObj.role)) {
          currentRoles.push(roleObj.role)
        }
      })
    }

    // Set the selected roles in our separate state
    setSelectedRoles(currentRoles)

    form.reset({
      userId: user.id,
      roles: currentRoles,
    })

    setDialogOpen(true)
  }

  // New function to open position dialog
  const openPositionDialog = (user: any) => {
    setSelectedUser(user)
    setPositionDialogOpen(true)
  }

  // New function to open salary dialog
  const openSalaryDialog = async (user: any) => {
    try {
      if (!user || !user.id) {
        console.error("Invalid user object:", user)
        toast({
          title: "Error",
          description: "Invalid user data. Please refresh the page and try again.",
        })
        return
      }

      setSubmitting(true)
      setSelectedUser(user)

      // Fetch the player record directly from the database to ensure we have the latest data
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, salary")
        .eq("user_id", user.id)
        .single()

      if (playerError) {
        // If no player record exists, create one
        if (playerError.code === "PGRST116") {
          const { data: newPlayer, error: createError } = await supabase
            .from("players")
            .insert({ user_id: user.id, role: "Player", salary: 0 })
            .select("id")
            .single()

          if (createError) {
            throw createError
          }

          if (!newPlayer) {
            throw new Error("Failed to create player record")
          }

          // Initialize the form values directly
          salaryForm.setValue("playerId", newPlayer.id)
          salaryForm.setValue("salary", 0)
        } else {
          throw playerError
        }
      } else if (playerData) {
        // Initialize the form values directly
        salaryForm.setValue("playerId", playerData.id)
        salaryForm.setValue("salary", playerData.salary || 0)
      } else {
        throw new Error("No player data returned")
      }

      setSalaryDialogOpen(true)
    } catch (error: any) {
      console.error("Error preparing salary dialog:", error)
      toast({
        title: "Error",
        description: "Failed to prepare salary dialog. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openTeamAssignDialog = async (user: any) => {
    try {
      if (!user || !user.id) {
        console.error("Invalid user object:", user)
        toast({
          title: "Error",
          description: "Invalid user data. Please refresh the page and try again.",
          variant: "destructive",
        })
        return
      }

      setSubmitting(true)
      setSelectedUser(user)

      // Fetch the player record directly from the database to ensure we have the latest data
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, team_id")
        .eq("user_id", user.id)
        .single()

      if (playerError) {
        // If no player record exists, create one
        if (playerError.code === "PGRST116") {
          const { data: newPlayer, error: createError } = await supabase
            .from("players")
            .insert({ user_id: user.id, role: "Player" })
            .select("id")
            .single()

          if (createError) {
            throw createError
          }

          if (!newPlayer) {
            throw new Error("Failed to create player record")
          }

          // Use the newly created player
          teamAssignmentForm.reset({
            playerId: newPlayer.id,
            teamId: null,
          })
        } else {
          throw playerError
        }
      } else if (playerData) {
        // Use the fetched player data
        teamAssignmentForm.reset({
          playerId: playerData.id,
          teamId: playerData.team_id,
        })
      } else {
        throw new Error("No player data returned")
      }

      setTeamAssignDialogOpen(true)
    } catch (error: any) {
      console.error("Error preparing team assignment:", error)
      toast({
        title: "Error",
        description: "Failed to prepare team assignment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Update the onSubmit function to handle role constraint errors
  // Update the onSubmit function to handle Admin role specially
  const onSubmit = async (values: z.infer<typeof userRoleSchema>) => {
    try {
      setSubmitting(true)
      // Get roles from our managed state
      const rolesList = selectedRoles
      const userId = values.userId

      console.log("Updating roles for user:", userId)
      console.log("New roles:", rolesList)

      if (rolesList.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one role",
          variant: "destructive",
        })
        return
      }

      // Validate that all roles are in the allowed list
      const invalidRoles = rolesList.filter((role) => !validRoles.some((r) => r.value === role))
      if (invalidRoles.length > 0) {
        toast({
          title: "Invalid roles",
          description: `The following roles are not valid: ${invalidRoles.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      // First, update the player role (use the first role in the array)
      let playerRole = rolesList[0]

      // Special handling: If the first role is Admin (which isn't valid for players table),
      // use "Player" for the players table but keep Admin in user_roles
      if (playerRole === "Admin" && !VALID_PLAYER_ROLES.includes(playerRole)) {
        playerRole = "Player"
        console.log("Using 'Player' role for players table since 'Admin' is not valid for players table")
      }

      // Check if player record exists
      const { data: playerData, error: playerCheckError } = await supabase
        .from("players")
        .select("id, role")
        .eq("user_id", userId)

      if (playerCheckError) {
        console.error("Error checking player record:", playerCheckError)
        throw playerCheckError
      }

      // Make sure we're using a valid role for the players table
      if (!VALID_PLAYER_ROLES.includes(playerRole)) {
        toast({
          title: "Invalid player role",
          description: `The role "${playerRole}" is not valid for the players table. Valid roles are: ${VALID_PLAYER_ROLES.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      if (playerData && playerData.length > 0) {
        // Update existing player record
        const { error: updateError } = await supabase.from("players").update({ role: playerRole }).eq("user_id", userId)

        if (updateError) {
          console.error("Error updating player role:", updateError)
          throw updateError
        }

        console.log("Updated player role to:", playerRole)
      } else {
        // Create new player record
        const { error: insertError } = await supabase.from("players").insert({ user_id: userId, role: playerRole })

        if (insertError) {
          console.error("Error creating player record:", insertError)
          throw insertError
        }

        console.log("Created new player with role:", playerRole)
      }

      // Delete all existing user_roles for this user
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId)

      if (deleteError) {
        console.error("Error deleting existing user roles:", deleteError)
        throw deleteError
      }

      console.log("Deleted existing user roles")

      // Insert all roles into user_roles table
      const userRolesToInsert = rolesList.map((role) => ({
        user_id: userId,
        role,
      }))

      const { error: insertRolesError } = await supabase.from("user_roles").insert(userRolesToInsert)

      if (insertRolesError) {
        console.error("Error inserting new user roles:", insertRolesError)
        throw insertRolesError
      }

      console.log("Inserted new user roles:", userRolesToInsert)

      toast({
        title: "Roles updated",
        description: "User roles have been updated successfully",
      })

      setDialogOpen(false)
      await fetchUsers() // Refresh the user list to show updated roles
    } catch (error: any) {
      console.error("Error updating roles:", error)

      // Check if this is a constraint violation error
      if (error.message && error.message.includes("violates check constraint")) {
        toast({
          title: "Invalid role",
          description:
            "One or more selected roles are not allowed in the database. Please try again with valid roles only.",
          variant: "destructive",
        })

        // Refresh valid roles
        fetchValidRoles()
      } else {
        toast({
          title: "Error updating roles",
          description: error.message || "Failed to update user roles",
          variant: "destructive",
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // New function to handle position updates
  const onUpdatePositions = async (values: {
    userId: string
    primary_position: string
    secondary_position: string | null
  }) => {
    try {
      setSubmitting(true)
      const { userId, primary_position, secondary_position } = values

      console.log("Updating positions for user:", userId)
      console.log("New positions:", { primary_position, secondary_position })

      // Prepare update object
      const updateData: any = {
        primary_position,
        // Handle secondary position - convert empty string or "none" to null
        secondary_position: secondary_position === "none" || !secondary_position ? null : secondary_position,
        updated_at: new Date().toISOString(),
      }

      // Update the user's positions
      const { error } = await supabase.from("users").update(updateData).eq("id", userId)

      if (error) {
        console.error("Error updating positions:", error)
        throw error
      }

      toast({
        title: "Positions updated",
        description: "User positions have been updated successfully",
      })

      setPositionDialogOpen(false)
      await fetchUsers() // Refresh the user list to show updated positions
    } catch (error: any) {
      console.error("Error updating positions:", error)
      toast({
        title: "Error updating positions",
        description: error.message || "Failed to update user positions",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // New function to handle salary updates
  const onUpdateSalary = async (values: { playerId: string; salary: number }) => {
    try {
      setSubmitting(true)
      const { playerId, salary } = values

      console.log("Updating salary for player:", playerId)
      console.log("New salary:", salary)

      // Update the player's salary
      const { error } = await supabase.from("players").update({ salary }).eq("id", playerId)

      if (error) {
        console.error("Error updating salary:", error)
        throw error
      }

      toast({
        title: "Salary updated",
        description: `Player salary has been updated to $${salary.toLocaleString()}`,
      })

      setSalaryDialogOpen(false)
      await fetchUsers() // Refresh the user list to show updated salary
    } catch (error: any) {
      console.error("Error updating salary:", error)
      toast({
        title: "Error updating salary",
        description: error.message || "Failed to update player salary",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Updated team assignment function with proper manual removal handling
  const onAssignTeam = async (values: z.infer<typeof teamAssignmentSchema>) => {
    try {
      setSubmitting(true)
      const { playerId, teamId } = values

      console.log("Assigning player to team:", playerId, teamId)

      // If setting to free agent (null), use the special removal API
      if (teamId === null) {
        console.log("Setting player as free agent - using manual removal API")

        const response = await fetch("/api/admin/remove-player-from-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: playerId,
            reason: "Admin set as free agent via user management",
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to set player as free agent")
        }

        toast({
          title: "Player set as free agent",
          description:
            data.message || "Player has been removed from their team and marked to prevent automatic re-assignment.",
        })
      } else {
        // Regular team assignment - update player and reset manual removal flags
        const { error } = await supabase
          .from("players")
          .update({
            team_id: teamId,
            manually_removed: false, // Reset manual removal flag
            manually_removed_at: null,
          })
          .eq("id", playerId)

        if (error) {
          console.error("Error assigning team:", error)
          throw error
        }

        // Also mark any related bids as processed to prevent conflicts
        const { error: bidUpdateError } = await supabase
          .from("player_bidding")
          .update({
            status: "manually_assigned",
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("player_id", playerId)
          .in("status", ["active", "pending"])

        if (bidUpdateError) {
          console.error("Error updating bids for assigned player:", bidUpdateError)
          // Don't fail the request as team assignment is more important
        }

        // Get team name for the toast message
        const team = teams.find((t) => t.id === teamId)
        const teamName = team ? team.name : "Unknown Team"

        toast({
          title: "Team assigned",
          description: `Player has been assigned to ${teamName}.`,
        })
      }

      setTeamAssignDialogOpen(false)
      await fetchUsers() // Refresh the user list to show updated team
    } catch (error: any) {
      console.error("Error assigning team:", error)
      toast({
        title: "Error assigning team",
        description: error.message || "Failed to assign team",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Also update the onCreateUser function to handle Admin role specially
  const onCreateUser = async (values: z.infer<typeof newUserSchema>) => {
    try {
      setSubmitting(true)
      const { email, gamer_tag_id, primary_position, secondary_position, console } = values
      // Get roles from our managed state
      const roles = newUserSelectedRoles

      if (roles.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one role",
          variant: "destructive",
        })
        return
      }

      // Validate that all roles are in the allowed list
      const invalidRoles = roles.filter((role) => !validRoles.some((r) => r.value === role))
      if (invalidRoles.length > 0) {
        toast({
          title: "Invalid roles",
          description: `The following roles are not valid: ${invalidRoles.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      // Create user object
      const userObject: any = {
        email,
        gamer_tag_id,
        primary_position,
        secondary_position: secondary_position === "none" || !secondary_position ? null : secondary_position,
        console,
      }

      // Only add is_active if the column exists
      if (isActiveColumnExists) {
        userObject.is_active = true
      }

      // First, create the user record
      const { data: userData, error: userError } = await supabase.from("users").insert(userObject).select()

      if (userError) throw userError

      if (!userData || userData.length === 0) {
        throw new Error("Failed to create user")
      }

      const userId = userData[0].id

      // Create player record with the first role or "Player" if first role is Admin
      let playerRole = roles[0]
      if (playerRole === "Admin" && !VALID_PLAYER_ROLES.includes(playerRole)) {
        playerRole = "Player"
        console.log("Using 'Player' role for players table since 'Admin' is not valid for players table")
      }

      // Make sure we're using a valid role for the players table
      if (!VALID_PLAYER_ROLES.includes(playerRole)) {
        playerRole = "Player" // Default to Player if the role is not valid
      }

      await supabase.from("players").insert({
        user_id: userId,
        role: playerRole,
      })

      // Insert all roles to user_roles
      const userRolesToInsert = roles.map((role) => ({
        user_id: userId,
        role,
      }))

      await supabase.from("user_roles").insert(userRolesToInsert)

      toast({
        title: "User created",
        description: "New user has been created successfully",
      })

      setNewUserDialogOpen(false)
      setNewUserSelectedRoles(["Player"])
      newUserForm.reset({
        email: "",
        gamer_tag_id: "",
        primary_position: "",
        secondary_position: "",
        console: "",
        roles: ["Player"],
      })

      fetchUsers()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserActivation = async (userId: string, isActive: boolean) => {
    try {
      // Check if the is_active column exists before attempting to update
      if (!isActiveColumnExists) {
        toast({
          title: "Database update required",
          description: "Please run the migration first to add the required column.",
          variant: "destructive",
        })
        setShowMigrationAlert(true)
        return
      }

      setSubmitting(true)

      // If deactivating a user, remove them from their team
      if (!isActive) {
        // First, get the player record
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("id, team_id")
          .eq("user_id", userId)
          .single()

        if (!playerError && playerData && playerData.team_id) {
          // Remove player from team
          const { error: updatePlayerError } = await supabase
            .from("players")
            .update({ team_id: null })
            .eq("id", playerData.id)

          if (updatePlayerError) {
            console.error("Error removing player from team:", updatePlayerError)
          } else {
            console.log(`Player ${playerData.id} removed from team ${playerData.team_id} due to deactivation`)
          }
        }
      }

      // Try to update with the is_active column
      const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId)

      if (error) {
        // If we get an error about the column not existing, show the migration alert
        if (error.message && error.message.includes("column") && error.message.includes("does not exist")) {
          setIsActiveColumnExists(false)
          setShowMigrationAlert(true)
          throw new Error("The is_active column doesn't exist yet. Please run the migration first.")
        }
        throw error
      }

      toast({
        title: isActive ? "User Activated" : "User Deactivated",
        description: isActive
          ? "The user account has been activated successfully."
          : "The user account has been deactivated successfully." +
            (!isActive ? " Player has been removed from their team." : ""),
      })

      // Update the local state to reflect the change
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            // Update the user's active status
            const updatedUser = { ...user, is_active: isActive }

            // If deactivating, also update the team_id in the local state
            if (!isActive && updatedUser.players && updatedUser.players.length > 0) {
              updatedUser.players[0].team_id = null
              updatedUser.players[0].teams = null
            }

            return updatedUser
          }
          return user
        }),
      )
    } catch (error: any) {
      console.error("Error toggling user activation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Update the handleRoleToggle function to use validRoles instead of roles
  // Replace the existing handleRoleToggle function with:
  const handleRoleToggle = (role: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedRoles((prev) => [...prev, role])
    } else {
      setSelectedRoles((prev) => prev.filter((r) => r !== role))
    }
  }

  // Helper function to handle new user role checkbox changes
  const handleNewUserRoleToggle = (role: string, isChecked: boolean) => {
    if (isChecked) {
      setNewUserSelectedRoles((prev) => [...prev, role])
    } else {
      setNewUserSelectedRoles((prev) => prev.filter((r) => r !== role))
    }
  }

  // Handle new user dialog close with proper form reset
  const handleNewUserDialogClose = (open: boolean) => {
    if (!open) {
      // Reset the form when closing the dialog
      if (newUserForm) {
        newUserForm.reset({
          email: "",
          gamer_tag_id: "",
          primary_position: "",
          secondary_position: "",
          console: "",
          roles: ["Player"],
        })
      }
      setNewUserSelectedRoles(["Player"])
    }
    setNewUserDialogOpen(open)
  }

  // Handle team assignment dialog close with proper form reset
  const handleTeamAssignDialogClose = (open: boolean) => {
    if (!open) {
      if (teamAssignmentForm) {
        teamAssignmentForm.reset({
          playerId: "",
          teamId: null,
        })
      }
    }
    setTeamAssignDialogOpen(open)
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Skeleton className="h-[600px] w-full rounded-md" />
      </div>
    )
  }

  const renderButtonsSection = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setNewUserDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
        <Button variant="outline" onClick={refreshUsers} disabled={refreshing}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Users"}
        </Button>
        <Button
          variant={autoRefresh ? "default" : "outline"}
          onClick={() => {
            // Check if we have an admin key before enabling auto-refresh
            const savedKey = localStorage.getItem("mghl-admin-key") || adminKey
            if (!savedKey && !autoRefresh) {
              // If trying to enable auto-refresh but no key exists, show admin key dialog
              pendingActionRef.current = () => {
                setAutoRefresh(true)
                setLastRefreshTime(new Date())
                setNextRefreshCountdown(30)
                return Promise.resolve()
              }
              setAdminKeyDialogOpen(true)
            } else {
              // Toggle auto-refresh state
              setAutoRefresh(!autoRefresh)
              if (!autoRefresh) {
                // If enabling, set initial refresh time
                setLastRefreshTime(new Date())
                setNextRefreshCountdown(30)
              }
            }
          }}
          className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {autoRefresh ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Auto-Refresh On ({nextRefreshCountdown}s)
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Auto-Refresh Off
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={fixSecondaryPositions}
          disabled={submitting}
          className="border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-600 bg-transparent"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${submitting ? "animate-spin" : ""}`} />
          {submitting ? "Fixing..." : "Fix Secondary Positions"}
        </Button>
        <Button
          variant="outline"
          onClick={fixRoleConstraint}
          disabled={submitting}
          className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600 bg-transparent"
        >
          <Key className={`mr-2 h-4 w-4 ${submitting ? "animate-spin" : ""}`} />
          {submitting ? "Fixing..." : "Fix Role Constraint"}
        </Button>
        <Button
          variant="outline"
          asChild
          className="border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 bg-transparent"
        >
          <Link href="/admin/user-diagnostics">
            <Stethoscope className="mr-2 h-4 w-4" />
            User Diagnostics
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={exportUsersToCSV}
          disabled={submitting || filteredUsers.length === 0}
          className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 bg-transparent"
        >
          <Download className="mr-2 h-4 w-4" />
          {submitting ? "Exporting..." : `Export CSV (${filteredUsers.length})`}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {renderButtonsSection()}

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by gamer tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-muted-foreground">
            Found {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} matching "{searchQuery}"
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
        )}
      </div>

      {autoRefresh && lastRefreshTime && (
        <div className="mb-4 text-sm text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          Auto-refresh active. Last refresh: {lastRefreshTime.toLocaleTimeString()}. Next refresh in{" "}
          {nextRefreshCountdown} seconds.
        </div>
      )}

      {showMigrationAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-amber-800">Database Update Required</h3>
              <p className="text-amber-700 mt-1 text-sm">
                The user activation feature requires a database update. Please run the SQL below in the Supabase SQL
                Editor.
              </p>
              <div className="mt-3 space-y-2">
                <div className="text-sm text-amber-700 mt-2">
                  <p className="font-medium">SQL Migration:</p>
                  <pre className="bg-amber-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
                    <br />
                    UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
                  </pre>
                </div>
                <div className="flex items-center mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800"
                    onClick={checkColumnAfterMigration}
                    disabled={submitting}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${submitting ? "animate-spin" : ""}`} />
                    {submitting ? "Checking..." : "I've run the migration, check again"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiscordAlert && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-blue-800">Discord Integration Not Set Up</h3>
              <p className="text-blue-700 mt-1 text-sm">
                Discord role synchronization is not available because the Discord integration tables don't exist.
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800"
                  asChild
                >
                  <Link href="/admin/mghl-bot">Set Up Discord Integration</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user accounts and assign roles</CardDescription>
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
                  <p className="text-sm text-muted-foreground">
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
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Gamer Tag</TableHead>
                      <TableHead className="text-center">Position</TableHead>
                      <TableHead className="text-center">Console</TableHead>
                      <TableHead className="text-center">Roles</TableHead>
                      <TableHead className="text-center">Team</TableHead>
                      <TableHead className="text-center">Salary</TableHead>
                      {isActiveColumnExists && <TableHead className="text-center">Status</TableHead>}
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isActiveColumnExists ? 9 : 8}
                          className="text-center py-4 text-muted-foreground"
                        >
                          {searchQuery ? "No users found matching your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => {
                        const playerRole = user.players && user.players.length > 0 ? user.players[0].role : null
                        const teamName =
                          user.players && user.players.length > 0 && user.players[0].teams
                            ? user.players[0].teams.name
                            : null
                        const salary = user.players && user.players.length > 0 ? user.players[0].salary || 0 : 0

                        //
                        // Get all roles (player role + user_roles)
                        const allRoles = []
                        if (playerRole) allRoles.push(playerRole)
                        if (user.user_roles) {
                          user.user_roles.forEach((roleObj: any) => {
                            if (!allRoles.includes(roleObj.role)) {
                              allRoles.push(roleObj.role)
                            }
                          })
                        }

                        return (
                          <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.gamer_tag_id}</TableCell>
                            <TableCell className="text-center">
                              {user.primary_position && (
                                <span className={positionColors[positionAbbreviations[user.primary_position] || ""]}>
                                  {positionAbbreviations[user.primary_position] || user.primary_position}
                                </span>
                              )}
                              {user.secondary_position && (
                                <>
                                  {" / "}
                                  <span
                                    className={positionColors[positionAbbreviations[user.secondary_position] || ""]}
                                  >
                                    {positionAbbreviations[user.secondary_position] || user.secondary_position}
                                  </span>
                                </>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{user.console}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {allRoles.map((role: string) => (
                                  <Badge key={role} variant="outline" className="w-fit">
                                    {role}
                                  </Badge>
                                ))}
                                {allRoles.length === 0 && <span className="text-muted-foreground">-</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {user.players &&
                              user.players.length > 0 &&
                              user.players[0].team_id &&
                              user.players[0].teams ? (
                                <span>{user.players[0].teams.name}</span>
                              ) : (
                                <span className="text-muted-foreground">Free Agent</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">${salary.toLocaleString()}</TableCell>
                            {isActiveColumnExists && (
                              <TableCell className="text-center">
                                {user.is_active ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-center">
                              <div className="flex flex-wrap justify-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openRoleDialog(user)}>
                                  Manage Roles
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 bg-transparent"
                                  onClick={() => openPositionDialog(user)}
                                >
                                  <UserCog className="mr-1 h-3 w-3" />
                                  Update Positions
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 bg-transparent"
                                  onClick={() => openTeamAssignDialog(user)}
                                  disabled={submitting}
                                >
                                  <Users className="mr-1 h-3 w-3" />
                                  {submitting ? "Loading..." : "Assign Team"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50 text-yellow-600 bg-transparent"
                                  onClick={() => openSalaryDialog(user)}
                                >
                                  <DollarSign className="mr-1 h-3 w-3" />
                                  Set Salary
                                </Button>
                                {isActiveColumnExists &&
                                  (user.is_active ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 bg-transparent"
                                      onClick={() => toggleUserActivation(user.id, false)}
                                    >
                                      Deactivate
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 bg-transparent"
                                      onClick={() => toggleUserActivation(user.id, true)}
                                    >
                                      Activate
                                    </Button>
                                  ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Bottom Pagination Controls */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Roles Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              {selectedUser && `Assign roles to ${selectedUser.gamer_tag_id || selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <div className="text-sm font-medium mb-2">Roles</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Select one or more roles for this user. The first role will be the primary player role.
                </div>
                <div className="space-y-2">
                  {validRoles.map((role) => (
                    <div key={role.value} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        id={`role-${role.value}`}
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={(checked) => handleRoleToggle(role.value, checked === true)}
                      />
                      <label
                        htmlFor={`role-${role.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedRoles.length === 0 && (
                  <p className="text-sm font-medium text-destructive mt-2">Select at least one role</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting || selectedRoles.length === 0}>
                  {submitting ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PositionUpdateDialog
        open={positionDialogOpen}
        onOpenChange={setPositionDialogOpen}
        user={selectedUser}
        onSubmit={onUpdatePositions}
        submitting={submitting}
      />

      {/* Set Salary Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Player Salary</DialogTitle>
            <DialogDescription>
              {selectedUser && `Set salary for ${selectedUser.gamer_tag_id || selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...salaryForm}>
            <form onSubmit={salaryForm.handleSubmit(onUpdateSalary)} className="space-y-6">
              <FormField
                control={salaryForm.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="salary-amount">Salary Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        id="salary-amount"
                        type="number"
                        min="0"
                        max="15000000"
                        step="100000"
                        placeholder="Enter salary amount"
                        disabled={submitting}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Enter the player's salary amount (max $15,000,000)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Update Salary"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Team Assignment Dialog */}
      <Dialog open={teamAssignDialogOpen} onOpenChange={handleTeamAssignDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Team</DialogTitle>
            <DialogDescription>
              {selectedUser && `Assign ${selectedUser.gamer_tag_id || selectedUser.email} to a team`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="team-select" className="text-sm font-medium">
                Team
              </label>
              <Select
                value={teamAssignmentForm.getValues().teamId?.toString() || "none"}
                onValueChange={(value) => {
                  const newValue = value === "none" ? null : value
                  teamAssignmentForm.setValue("teamId", newValue)
                }}
                disabled={submitting}
              >
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Free Agent (No Team)</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select a team for this player or choose "Free Agent" to remove them from any team and prevent automatic
                re-assignment.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => teamAssignmentForm.handleSubmit(onAssignTeam)()} disabled={submitting}>
                {submitting ? "Saving..." : "Assign Team"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New User Dialog */}
      <Dialog open={newUserDialogOpen} onOpenChange={handleNewUserDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account and assign roles</DialogDescription>
          </DialogHeader>
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit(onCreateUser)} className="space-y-4">
              <FormField
                control={newUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
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
                    <FormLabel>Gamer Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="GamerTag123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={newUserForm.control}
                  name="primary_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Position</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={(value) => {
                          newUserForm.setValue("primary_position", value)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positions.map((position) => (
                            <SelectItem key={position.value} value={position.value}>
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
                  control={newUserForm.control}
                  name="secondary_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Position (Optional)</FormLabel>
                      <Select
                        defaultValue={field.value || "none"}
                        onValueChange={(value) => {
                          newUserForm.setValue("secondary_position", value === "none" ? undefined : value)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {positions.map((position) => (
                            <SelectItem key={position.value} value={position.value}>
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
                name="console"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Console</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(value) => {
                        newUserForm.setValue("console", value)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select console" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {consoles.map((console) => (
                          <SelectItem key={console.value} value={console.value}>
                            {console.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="text-sm font-medium mb-2">Roles</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Select one or more roles for this user. The first role will be the primary player role.
                </div>
                <div className="space-y-2">
                  {validRoles.map((role) => (
                    <div key={role.value} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        id={`new-role-${role.value}`}
                        checked={newUserSelectedRoles.includes(role.value)}
                        onCheckedChange={(checked) => handleNewUserRoleToggle(role.value, checked === true)}
                      />
                      <label
                        htmlFor={`new-role-${role.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
                {newUserSelectedRoles.length === 0 && (
                  <p className="text-sm font-medium text-destructive mt-2">Select at least one role</p>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting || newUserSelectedRoles.length === 0}>
                  {submitting ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Admin Key Dialog */}
      <Dialog open={adminKeyDialogOpen} onOpenChange={setAdminKeyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Verification Required</DialogTitle>
            <DialogDescription>
              Please enter your admin verification key to continue with this operation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="admin-key" className="text-sm font-medium">
                Admin Key
              </label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
              {adminKeyError && <p className="text-sm text-destructive">{adminKeyError}</p>}
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Save key for future operations
                </label>
                <p className="text-sm text-muted-foreground">
                  This will store the key in your browser for this session.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdminKeySubmit} disabled={!adminKey}>
              <Key className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
