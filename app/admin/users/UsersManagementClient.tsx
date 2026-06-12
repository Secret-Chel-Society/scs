"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
import { logActivity } from "@/lib/activity-log"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { fetchPlayersByUserIds } from "@/lib/db/fetch-players-by-user-ids"
import * as z from "zod"
import {
  PlusCircle,
  AlertTriangle,
  Users,
  Stethoscope,
  DollarSign,
  Search,
  X,
  Download,
} from "lucide-react"

// Valid player roles for players table
const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner", "ECL Owner", "ECL GM", "ECL AGM"]

// Selectable roles (user_roles) - Site Owner is not shown to users
const roles = [
  { label: "Player", value: "Player" },
  { label: "GM", value: "GM" },
  { label: "AGM", value: "AGM" },
  { label: "Owner", value: "Owner" },
  { label: "AHL Owner", value: "AHL Owner" },
  { label: "AHL GM", value: "AHL GM" },
  { label: "AHL AGM", value: "AHL AGM" },
  { label: "ECL Owner", value: "ECL Owner" },
  { label: "ECL GM", value: "ECL GM" },
  { label: "ECL AGM", value: "ECL AGM" },
  { label: "League Bog", value: "League Bog" },
  { label: "Admin", value: "Admin" },
  { label: "UPHL Admin", value: "UPHL Admin" },
]

// Helper function to get role badge styling
const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case "Site Owner":
      return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
    case "Admin":
      return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700"
    case "League Bog":
      return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
    case "Owner":
    case "ECL Owner":
      return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
    case "GM":
    case "ECL GM":
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
    case "AGM":
    case "ECL AGM":
      return "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700"
    case "ECL Admin":
      return "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700"
    default:
      return ""
  }
}

const consoles = [
  { label: "Xbox", value: "Xbox" },
  { label: "PS5", value: "PS5" },
]

const userRoleSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(z.string()).min(1, "Select at least one role"),
})

// primary/secondary positions removed from schema
const newUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  gamer_tag_id: z.string().min(3, "Gamer tag must be at least 3 characters"),
  console: z.string().min(1, "Please select a console"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
})

const teamAssignmentSchema = z.object({
  playerId: z.string().uuid(),
  // Main roster (one active team per league)
  teamId: z.string().uuid().nullable(),
  teamIdAhl: z.string().uuid().nullable(),
  teamIdEcl: z.string().uuid().nullable(),
  // Training camp (a player can be a TC on a team in each league)
  tcTeamId: z.string().uuid().nullable(),
  tcTeamIdAhl: z.string().uuid().nullable(),
  tcTeamIdEcl: z.string().uuid().nullable(),
})

const salarySchema = z.object({
  playerId: z.string().uuid(),
  salary: z.coerce.number().min(0, "Salary cannot be negative").max(15000000, "Salary cannot exceed $15,000,000"),
})

export default function UsersManagementClient() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false)
  const [teamAssignDialogOpen, setTeamAssignDialogOpen] = useState(false)
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [isActiveColumnExists, setIsActiveColumnExists] = useState(false)
  const [showMigrationAlert, setShowMigrationAlert] = useState(false)

  // Discord integration info (kept)
  const [discordTablesExist, setDiscordTablesExist] = useState(false)
  const [showDiscordAlert, setShowDiscordAlert] = useState(false)

  // Pagination / search
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])

  // roles
  const [validRoles, setValidRoles] = useState(roles)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [newUserSelectedRoles, setNewUserSelectedRoles] = useState<string[]>(["Player"])

  // Forms
  const form = useForm<z.infer<typeof userRoleSchema>>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: { userId: "", roles: [] },
    mode: "onSubmit",
  })

  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      email: "",
      gamer_tag_id: "",
      console: "",
      roles: ["Player"],
    },
  })

  const teamAssignmentForm = useForm<z.infer<typeof teamAssignmentSchema>>({
    resolver: zodResolver(teamAssignmentSchema),
    defaultValues: {
      playerId: "",
      teamId: null,
      teamIdAhl: null,
      teamIdEcl: null,
      tcTeamId: null,
      tcTeamIdAhl: null,
      tcTeamIdEcl: null,
    },
  })

  const salaryForm = useForm<z.infer<typeof salarySchema>>({
    resolver: zodResolver(salarySchema),
    defaultValues: { playerId: "", salary: 0 },
  })

  // Teams lookup
  const teamsById = useMemo(() => {
    const m: Record<string, { id: string; name: string; logo_url?: string; league: "NHL" | "AHL" | "ECL" }> = {}
    for (const t of teams) m[t.id] = t
    return m
  }, [teams])

  // keep forms in sync with local role state
  useEffect(() => {
    form.setValue("roles", selectedRoles)
  }, [selectedRoles, form])
  useEffect(() => {
    newUserForm.setValue("roles", newUserSelectedRoles)
  }, [newUserSelectedRoles, newUserForm])

  // Gate by Admin role
  useEffect(() => {
    async function checkAuthorization() {
      if (!session?.user) {
        toast({ title: "Unauthorized", description: "You must be logged in to access this page.", variant: "destructive" })
        router.push("/login")
        return
      }
      try {
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData?.length) {
          toast({ title: "Access denied", description: "You don't have permission to access the user management panel.", variant: "destructive" })
          router.push("/")
          return
        }

        setIsAdmin(true)

        await checkIsActiveColumn().catch(() => {})
        await checkDiscordTables().catch(() => {})
        await fetchTeams().catch(() => {})
        await fetchValidRoles()
        fetchUsers()
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "An error occurred", variant: "destructive" })
      }
    }
    checkAuthorization()
  }, [supabase, session, toast, router])

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) setFilteredUsers(users)
    else {
      const q = searchQuery.toLowerCase().trim()
      setFilteredUsers(users.filter((u) => u.gamer_tag_id && u.gamer_tag_id.toLowerCase().includes(q)))
    }
    setCurrentPage(1)
  }, [searchQuery, users])

  // Pagination pieces
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // ---------- helpers for merging players ----------
  function indexPlayersByUserId(players: any[]) {
    const map: Record<string, any> = {}
    for (const p of players || []) {
      if (p?.user_id) map[p.user_id] = p
    }
    return map
  }
  function normalizeTeamJoins(p: any) {
    const nhl = Array.isArray(p?.teams) ? p.teams[0] : p?.teams
    const ahl = Array.isArray(p?.teams_ahl) ? p.teams_ahl[0] : p?.teams_ahl
    return { nhl, ahl }
  }

  async function checkDiscordTables() {
    try {
      const { error } = await supabase.from("discord_users").select("id").limit(1)
      if (error) {
        if (error.message?.includes("does not exist")) {
          setDiscordTablesExist(false); setShowDiscordAlert(true); return false
        }
        setDiscordTablesExist(false); return false
      }
      setDiscordTablesExist(true); setShowDiscordAlert(false); return true
    } catch {
      setDiscordTablesExist(false); setShowDiscordAlert(true); return false
    }
  }

  // Fetch only the teams that are active in the current active season of a given league.
  async function fetchActiveSeasonTeams(
    seasonsTable: string,
    teamSeasonsTable: string,
    teamsTable: string,
  ): Promise<any[]> {
    // 1) Find the current active season for this league
    const { data: activeSeasons, error: seasonErr } = await supabase
      .from(seasonsTable)
      .select("id")
      .eq("is_active", true)
      .limit(1)
    if (seasonErr) throw seasonErr
    const activeSeasonId = activeSeasons?.[0]?.id
    if (!activeSeasonId) return []

    // 2) Find team_ids active in that season
    const { data: teamSeasonRows, error: tsErr } = await supabase
      .from(teamSeasonsTable)
      .select("team_id")
      .eq("season_id", activeSeasonId)
      .eq("is_active", true)
    if (tsErr) throw tsErr
    const teamIds = (teamSeasonRows || []).map((r: any) => r.team_id).filter(Boolean)
    if (!teamIds.length) return []

    // 3) Fetch those teams
    const { data: teamRows, error: teamErr } = await supabase
      .from(teamsTable)
      .select("id, name, logo_url")
      .in("id", teamIds)
      .order("name")
    if (teamErr) throw teamErr
    return teamRows || []
  }

  async function fetchTeams() {
    setTeamsLoading(true)
    try {
      const [nhlTeams, ahlTeams, eclTeams] = await Promise.all([
        fetchActiveSeasonTeams("seasons", "team_seasons", "teams"),
        fetchActiveSeasonTeams("seasons_ahl", "team_seasons_ahl", "teams_ahl"),
        fetchActiveSeasonTeams("seasons_ecl", "team_seasons_ecl", "teams_ecl"),
      ])

      const combined = [
        ...nhlTeams.map((t) => ({ ...t, league: "NHL" as const })),
        ...ahlTeams.map((t) => ({ ...t, league: "AHL" as const })),
        ...eclTeams.map((t) => ({ ...t, league: "ECL" as const })),
      ]
      setTeams(combined)
    } catch (e: any) {
      toast({ title: "Error loading teams", description: e?.message || "Failed to load teams", variant: "destructive" })
    } finally {
      setTeamsLoading(false)
    }
  }

  async function fetchValidRoles() {
    try {
      setValidRoles(roles)
      try {
        const r = await fetch("/api/admin/get-valid-roles")
        if (r.ok) {
          const data = await r.json()
          if (Array.isArray(data.validRoles) && data.validRoles.length) {
            setValidRoles(data.validRoles.map((role: string) => ({ label: role, value: role })))
          }
        }
      } catch {
        // ignore; keep defaults
      }
    } catch {
      setValidRoles(roles)
    }
  }

  // ---------- FIXED: fetch users + players separately, then merge ----------
  // Fetch all users in batches to overcome Supabase's 1000 row limit
  async function fetchAllUsersBatched() {
    const PAGE_SIZE = 1000
    let allUsers: any[] = []
    let from = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          email,
          gamer_tag_id,
          console,
          is_active,
          created_at,
          updated_at,
          user_roles ( id, role )
        `)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw error

      if (data && data.length > 0) {
        allUsers = [...allUsers, ...data]
        from += PAGE_SIZE
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    return allUsers
  }

  async function fetchUsers(retryCount = 0) {
    setLoading(true)
    try {
      // 1) users + roles (no nested players) - fetch ALL users in batches
      const usersData = await fetchAllUsersBatched()

      const userIds = (usersData ?? []).map(u => u.id)
      if (!userIds.length) {
        setUsers([]); setFilteredUsers([]); setLoading(false); return
      }

      // 2) players via RPC to avoid huge URL & speed things up
      const playersData = await fetchPlayersByUserIds(supabase, userIds)
      // returns: [{ id, user_id, role, salary, team_id, team_id_ahl, team_name, ahl_team_name }]

      // 3) merge
      const byUserId = indexPlayersByUserId(playersData ?? [])
      const processed = (usersData ?? []).map((u: any) => {
        const p = byUserId[u.id] ?? null

        const playersArr = p
          ? [
              {
                id: p.id,
                role: p.role,
                salary: typeof p.salary === "number" ? p.salary : 0,
                is_tc: p.is_tc ?? false,
                // Main roster assignments (one active per league)
                team_id: p.team_id ?? null,
                team_id_ahl: p.team_id_ahl ?? null,
                team_id_ecl: p.team_id_ecl ?? null,
                // Training camp assignments (one per league)
                tc_team_id: p.tc_team_id ?? null,
                tc_team_id_ahl: p.tc_team_id_ahl ?? null,
                tc_team_id_ecl: p.tc_team_id_ecl ?? null,
                // Joined team names from RPC
                team_name: p.team_name ?? null,
                ahl_team_name: p.ahl_team_name ?? null,
                ecl_team_name: p.ecl_team_name ?? null,
                tc_team_name: p.tc_team_name ?? null,
                tc_ahl_team_name: p.tc_ahl_team_name ?? null,
                tc_ecl_team_name: p.tc_ecl_team_name ?? null,
              },
            ]
          : []

        return {
          ...u,
          is_active: u.is_active === undefined ? true : u.is_active,
          players: playersArr,
        }
      })

      setUsers(processed)
      setFilteredUsers(processed)
    } catch (e: any) {
      if (e?.message?.includes("Too Many Requests") && retryCount < 3) {
        setTimeout(() => fetchUsers(retryCount + 1), (retryCount + 1) * 1000)
        return
      }
      toast({ title: "Error loading users", description: e?.message || "Failed to load users", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function checkIsActiveColumn() {
    try {
      const { error } = await supabase.from("users").select("is_active").limit(1)
      if (!error) { setIsActiveColumnExists(true); setShowMigrationAlert(false); return true }
      setIsActiveColumnExists(false); setShowMigrationAlert(true); return false
    } catch {
      setIsActiveColumnExists(false); setShowMigrationAlert(true); return false
    }
  }

  async function checkColumnAfterMigration() {
    setSubmitting(true)
    try {
      await checkIsActiveColumn()
      if (isActiveColumnExists) { toast({ title: "Column detected", description: "The is_active column has been added." }); fetchUsers() }
      else { toast({ title: "Column not found", description: "Please run the SQL first.", variant: "destructive" }) }
    } finally {
      setSubmitting(false)
    }
  }

  const openRoleDialog = (user: any) => {
    setSelectedUser(user)
    const currentRoles: string[] = []
    if (user.players?.length) currentRoles.push(user.players[0].role)
    if (user.user_roles) user.user_roles.forEach((r: any) => { if (!currentRoles.includes(r.role)) currentRoles.push(r.role) })
    setSelectedRoles(currentRoles)
    form.reset({ userId: user.id, roles: currentRoles })
    setDialogOpen(true)
  }

  const openSalaryDialog = async (user: any) => {
    try {
      if (!user?.id) {
        toast({ title: "Error", description: "Invalid user data. Please refresh and try again." })
        return
      }
      setSubmitting(true)
      setSelectedUser(user)

      const { data: player, error } = await supabase
        .from("players")
        .select("id, salary")
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newPlayer, error: createErr } = await supabase
            .from("players")
            .insert({ user_id: user.id, role: "Player", salary: 0 })
            .select("id")
            .single()
          if (createErr || !newPlayer) throw createErr || new Error("Failed to create player record")
          salaryForm.setValue("playerId", newPlayer.id)
          salaryForm.setValue("salary", 0)
        } else {
          throw error
        }
      } else if (player) {
        salaryForm.setValue("playerId", player.id)
        salaryForm.setValue("salary", player.salary || 0)
      } else {
        throw new Error("No player data returned")
      }

      setSalaryDialogOpen(true)
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to prepare salary dialog. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  const openTeamAssignDialog = async (user: any) => {
    try {
      if (!user?.id) {
        toast({ title: "Error", description: "Invalid user data. Please refresh the page and try again.", variant: "destructive" })
        return
      }
      setSubmitting(true)
      setSelectedUser(user)

      const { data: player, error } = await supabase
        .from("players")
        .select("id, team_id, team_id_ahl, team_id_ecl, tc_team_id, tc_team_id_ahl, tc_team_id_ecl")
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newPlayer, error: createError } = await supabase
            .from("players")
            .insert({ user_id: user.id, role: "Player" })
            .select("id")
            .single()
          if (createError || !newPlayer) throw createError || new Error("Failed to create player record")
          teamAssignmentForm.reset({
            playerId: newPlayer.id,
            teamId: null,
            teamIdAhl: null,
            teamIdEcl: null,
            tcTeamId: null,
            tcTeamIdAhl: null,
            tcTeamIdEcl: null,
          })
        } else {
          throw error
        }
      } else if (player) {
        teamAssignmentForm.reset({
          playerId: player.id,
          teamId: player.team_id ?? null,
          teamIdAhl: player.team_id_ahl ?? null,
          teamIdEcl: player.team_id_ecl ?? null,
          tcTeamId: player.tc_team_id ?? null,
          tcTeamIdAhl: player.tc_team_id_ahl ?? null,
          tcTeamIdEcl: player.tc_team_id_ecl ?? null,
        })
      } else {
        throw new Error("No player data returned")
      }

      setTeamAssignDialogOpen(true)
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to prepare team assignment. Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Save roles
  const onSubmit = async (values: z.infer<typeof userRoleSchema>) => {
    try {
      setSubmitting(true)
      const rolesList = selectedRoles
      const userId = values.userId
      if (!rolesList.length) {
        toast({ title: "Error", description: "Please select at least one role", variant: "destructive" })
        return
      }
      const invalid = rolesList.filter((r) => !validRoles.some((vr) => vr.value === r))
      if (invalid.length) {
        toast({ title: "Invalid roles", description: `Not valid: ${invalid.join(", ")}`, variant: "destructive" })
        return
      }

      // Find the first valid player role from the selected roles
      // These are the roles that go in the players.role field
      // Priority order: ECL Owner > Owner > AHL Owner > ECL GM > GM > AHL GM > ECL AGM > AGM > AHL AGM > Player
      const playerRolePriority = ["ECL Owner", "Owner", "AHL Owner", "ECL GM", "GM", "AHL GM", "ECL AGM", "AGM", "AHL AGM", "Player"]
      let playerRole: string | null = null
      for (const pr of playerRolePriority) {
        if (rolesList.includes(pr)) {
          playerRole = pr
          break
        }
      }
      // Default to "Player" if no valid player role found in selection
      if (!playerRole) {
        playerRole = "Player"
      }

      // Update or insert the player record with the role
      const { data: playerRow, error: playerCheckError } = await supabase
        .from("players")
        .select("id, role")
        .eq("user_id", userId)

      if (playerCheckError) throw playerCheckError

      const oldRole: string | null = playerRow?.length ? playerRow[0].role : null

      if (playerRow?.length) {
        const { error } = await supabase.from("players").update({ role: playerRole }).eq("user_id", userId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("players").insert({ user_id: userId, role: playerRole })
        if (error) throw error
      }

      // Update user_roles table - delete all existing and insert new ones
      const { error: deleteErr } = await supabase.from("user_roles").delete().eq("user_id", userId)
      if (deleteErr) throw deleteErr

      const toInsert = rolesList.map((r) => ({ user_id: userId, role: r }))
      const { error: insertErr } = await supabase.from("user_roles").insert(toInsert)
      if (insertErr) throw insertErr

      // Log activity for role changes
      try {
        const { data: adminUser } = await supabase
          .from("users")
          .select("gamer_tag_id")
          .eq("id", session?.user?.id)
          .single()
        
        const targetUser = selectedUser
        const targetName = targetUser?.gamer_tag_id || targetUser?.users?.gamer_tag_id || "Unknown User"
        
        await logActivity(supabase, {
          actorId: session?.user?.id || "",
          actorName: adminUser?.gamer_tag_id || "Admin",
          actorType: "Admin",
          actionType: "role_updated",
          actionDescription: `Updated roles for ${targetName}: ${rolesList.join(", ")}${oldRole ? ` (was: ${oldRole})` : ""}`,
          targetId: userId,
          targetName: targetName,
          category: "Role",
          league: "NHL",
        })
      } catch (logError) {
        console.error("Error logging role update activity:", logError)
      }

      toast({ title: "Roles updated", description: "User roles have been updated successfully" })
      setDialogOpen(false)
      await fetchUsers()
    } catch (e: any) {
      if (e?.message?.includes("violates check constraint")) {
        toast({ title: "Invalid role", description: "One or more selected roles are not allowed.", variant: "destructive" })
      } else {
        toast({ title: "Error updating roles", description: e?.message || "Unexpected error", variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Salary update
  const onUpdateSalary = async (values: { playerId: string; salary: number }) => {
    try {
      setSubmitting(true)
      const { playerId, salary } = values
      const { error } = await supabase.from("players").update({ salary }).eq("id", playerId)
      if (error) throw error
      toast({ title: "Salary updated", description: `Player salary has been updated to $${salary.toLocaleString()}` })
      setSalaryDialogOpen(false)
      await fetchUsers()
    } catch (e: any) {
      toast({ title: "Error updating salary", description: e?.message || "Failed to update player salary" })
    } finally {
      setSubmitting(false)
    }
  }

  // Team assignment (main roster per league + training-camp per league)
const onAssignTeam = async (values: z.infer<typeof teamAssignmentSchema>) => {
  try {
    setSubmitting(true)
    const { playerId, teamId, teamIdAhl, teamIdEcl, tcTeamId, tcTeamIdAhl, tcTeamIdEcl } = values

    const hasAnyMainTeam = Boolean(teamId || teamIdAhl || teamIdEcl)
    const hasAnyTcTeam = Boolean(tcTeamId || tcTeamIdAhl || tcTeamIdEcl)

    const updateData: any = {
      team_id: teamId,
      team_id_ahl: teamIdAhl,
      team_id_ecl: teamIdEcl,
      tc_team_id: tcTeamId,
      tc_team_id_ahl: tcTeamIdAhl,
      tc_team_id_ecl: tcTeamIdEcl,
      is_tc: hasAnyTcTeam,
    }

    if (!hasAnyMainTeam && !hasAnyTcTeam) {
      // Full free agent: clear everything and lock from auto re-assignment
      updateData.manually_removed = true
      updateData.manually_removed_at = new Date().toISOString()
    } else {
      updateData.manually_removed = false
      updateData.manually_removed_at = null
    }

    const { error: updateErr } = await supabase.from("players").update(updateData).eq("id", playerId)
    if (updateErr) throw updateErr

    // Resolve active/pending bidding rows so they don't auto-reassign
    if (!hasAnyMainTeam && !hasAnyTcTeam) {
      await supabase
        .from("player_bidding")
        .update({ status: "manually_removed", processed: true, processed_at: new Date().toISOString() })
        .eq("player_id", playerId)
        .in("status", ["active", "pending"])
    } else if (hasAnyMainTeam) {
      await supabase
        .from("player_bidding")
        .update({ status: "manually_assigned", processed: true, processed_at: new Date().toISOString() })
        .eq("player_id", playerId)
        .in("status", ["active", "pending"])
    }

    // Build a human-readable summary of the assignment for the activity log
    const nameFor = (id: string | null) => (id && teamsById[id] ? teamsById[id].name : null)
    const parts: string[] = []
    if (teamId) parts.push(`${nameFor(teamId) || "team"} (NHL)`)
    if (teamIdAhl) parts.push(`${nameFor(teamIdAhl) || "team"} (AHL)`)
    if (teamIdEcl) parts.push(`${nameFor(teamIdEcl) || "team"} (ECL)`)
    if (tcTeamId) parts.push(`${nameFor(tcTeamId) || "team"} (NHL TC)`)
    if (tcTeamIdAhl) parts.push(`${nameFor(tcTeamIdAhl) || "team"} (AHL TC)`)
    if (tcTeamIdEcl) parts.push(`${nameFor(tcTeamIdEcl) || "team"} (ECL TC)`)

    try {
      const { data: adminUser } = await supabase
        .from("users")
        .select("gamer_tag_id")
        .eq("id", session?.user?.id)
        .single()

      const targetUser = selectedUser
      const targetName = targetUser?.gamer_tag_id || targetUser?.users?.gamer_tag_id || "Unknown User"

      await logActivity(supabase, {
        actorId: session?.user?.id || "",
        actorName: adminUser?.gamer_tag_id || "Admin",
        actorType: "Admin",
        actionType: parts.length ? "team_assigned" : "player_removed_from_team",
        actionDescription: parts.length
          ? `Assigned ${targetName} to ${parts.join(", ")}`
          : `Set ${targetName} as free agent (removed from all teams)`,
        targetId: selectedUser?.id || playerId,
        targetName: targetName,
        category: "Role",
        league: "NHL",
      })
    } catch (logError) {
      console.error("Error logging team assignment activity:", logError)
    }

    toast({
      title: parts.length ? "Teams updated" : "Player set as free agent",
      description: parts.length ? `Assigned to ${parts.join(", ")}.` : "Removed from all teams.",
    })

    setTeamAssignDialogOpen(false)
    await fetchUsers()
  } catch (e: any) {
    toast({ title: "Error assigning team", description: e?.message || "Failed to assign team", variant: "destructive" })
  } finally {
    setSubmitting(false)
  }
}

  // Create user (no primary/secondary positions)
  const onCreateUser = async (values: z.infer<typeof newUserSchema>) => {
    try {
      setSubmitting(true)
      const { email, gamer_tag_id, console } = values
      const rolesSel = newUserSelectedRoles
      if (!rolesSel.length) {
        toast({ title: "Error", description: "Please select at least one role", variant: "destructive" })
        return
      }
      const invalid = rolesSel.filter((r) => !validRoles.some((vr) => vr.value === r))
      if (invalid.length) {
        toast({ title: "Invalid roles", description: `Not valid: ${invalid.join(", ")}`, variant: "destructive" })
        return
      }

      const userObj: any = { email, gamer_tag_id, console }
      if (isActiveColumnExists) userObj.is_active = true

      const { data: userData, error: userErr } = await supabase.from("users").insert(userObj).select()
      if (userErr || !userData?.length) throw userErr || new Error("Failed to create user")
      const userId = userData[0].id

      let playerRole = rolesSel[0]
      if (playerRole === "Admin") playerRole = "Player"
      if (!VALID_PLAYER_ROLES.includes(playerRole)) playerRole = "Player"

      await supabase.from("players").insert({ user_id: userId, role: playerRole })
      await supabase.from("user_roles").insert(rolesSel.map((r) => ({ user_id: userId, role: r })))

      // Log user creation activity
      try {
        const { data: adminUser } = await supabase
          .from("users")
          .select("gamer_tag_id")
          .eq("id", session?.user?.id)
          .single()
        
        await logActivity(supabase, {
          actorId: session?.user?.id || "",
          actorName: adminUser?.gamer_tag_id || "Admin",
          actorType: "Admin",
          actionType: "user_created",
          actionDescription: `Created new user ${gamer_tag_id} with roles: ${rolesSel.join(", ")}`,
          targetId: userId,
          targetName: gamer_tag_id,
          category: "Account",
          league: "NHL",
        })
      } catch (logError) {
        console.error("Error logging user creation activity:", logError)
      }

      toast({ title: "User created", description: "New user has been created successfully" })
      setNewUserDialogOpen(false)
      setNewUserSelectedRoles(["Player"])
      newUserForm.reset({ email: "", gamer_tag_id: "", console: "", roles: ["Player"] })
      fetchUsers()
    } catch (e: any) {
      toast({ title: "Error creating user", description: e?.message || "Failed to create user" })
    } finally {
      setSubmitting(false)
    }
  }

  // Activate / Deactivate
  const toggleUserActivation = async (userId: string, isActive: boolean) => {
    try {
      if (!isActiveColumnExists) {
        toast({ title: "Database update required", description: "Please run the migration first to add the required column.", variant: "destructive" })
        setShowMigrationAlert(true); return
      }
      setSubmitting(true)

      if (!isActive) {
        const { data: player, error } = await supabase
          .from("players")
          .select("id, team_id, team_id_ahl")
          .eq("user_id", userId)
          .single()
        if (!error && player && (player.team_id || player.team_id_ahl)) {
          await supabase.from("players").update({ team_id: null, team_id_ahl: null }).eq("id", player.id)
        }
      }

      const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId)
      if (error) {
        if (error.message?.includes("does not exist")) {
          setIsActiveColumnExists(false); setShowMigrationAlert(true)
          throw new Error("The is_active column doesn't exist yet. Please run the migration first.")
        }
        throw error
      }

      // Log user activation/deactivation activity
      try {
        const { data: adminUser } = await supabase
          .from("users")
          .select("gamer_tag_id")
          .eq("id", session?.user?.id)
          .single()
        
        const targetUser = users.find((u) => u.id === userId)
        const targetName = targetUser?.gamer_tag_id || "Unknown User"
        
        await logActivity(supabase, {
          actorId: session?.user?.id || "",
          actorName: adminUser?.gamer_tag_id || "Admin",
          actorType: "Admin",
          actionType: isActive ? "user_activated" : "user_deactivated",
          actionDescription: `${isActive ? "Activated" : "Deactivated"} user ${targetName}`,
          targetId: userId,
          targetName: targetName,
          category: "Account",
          league: "NHL",
        })
      } catch (logError) {
        console.error("Error logging user activation activity:", logError)
      }

      toast({
        title: isActive ? "User Activated" : "User Deactivated",
        description: isActive ? "The user account has been activated successfully."
          : "The user account has been deactivated successfully. Player has been removed from their team.",
      })

      setUsers(users.map((u) => {
        if (u.id !== userId) return u
        const updated = { ...u, is_active: isActive }
        if (!isActive && updated.players?.length) {
          updated.players[0].team_id = null
          updated.players[0].team_id_ahl = null
          updated.players[0].teams = null
          updated.players[0].teams_ahl = null
        }
        return updated
      }))
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to update user status" })
    } finally {
      setSubmitting(false)
    }
  }

  // role checkbox helpers
  const handleRoleToggle = (role: string, isChecked: boolean) => {
    setSelectedRoles((prev) => (isChecked ? [...prev, role] : prev.filter((r) => r !== role)))
  }
  const handleNewUserRoleToggle = (role: string, isChecked: boolean) => {
    setNewUserSelectedRoles((prev) => (isChecked ? [...prev, role] : prev.filter((r) => r !== role)))
  }

  const handleNewUserDialogClose = (open: boolean) => {
    if (!open) {
      newUserForm.reset({ email: "", gamer_tag_id: "", console: "", roles: ["Player"] })
      setNewUserSelectedRoles(["Player"])
    }
    setNewUserDialogOpen(open)
  }

  const handleTeamAssignDialogClose = (open: boolean) => {
    if (!open) teamAssignmentForm.reset({ playerId: "", teamId: null })
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
        <Button variant="outline" asChild className="border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 bg-transparent">
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

  async function exportUsersToCSV() {
    try {
      setSubmitting(true)
      const csvRows = filteredUsers.map((user) => {
        const playerRole = user.players?.length ? user.players[0].role : ""
        const teamName = user.players?.length
          ? user.players[0].teams?.name || user.players[0].teams_ahl?.name || "Free Agent"
          : "Free Agent"
        const salary = user.players?.length ? user.players[0].salary || 0 : 0

        const allRoles: string[] = []
        if (playerRole) allRoles.push(playerRole)
        if (user.user_roles) user.user_roles.forEach((r: any) => { if (!allRoles.includes(r.role)) allRoles.push(r.role) })

        return {
          email: user.email,
          gamer_tag: user.gamer_tag_id || "",
          console: user.console || "",
          roles: allRoles.join(", "),
          team: teamName,
          salary,
          status: isActiveColumnExists ? (user.is_active ? "Active" : "Inactive") : "Unknown",
          created_at: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
          updated_at: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "",
        }
      })

      let csv = "Email,Gamer Tag,Console,Roles,Team,Salary,Status,Created Date,Updated Date\n"
      const esc = (v: string | number) => {
        const s = String(v)
        return s.match(/[,"\n]/) ? `"${s.replace(/"/g, '""')}"` : s
      }

      csvRows.forEach((r) => {
        csv += [
          esc(r.email),
          esc(r.gamer_tag),
          esc(r.console),
          esc(r.roles),
          esc(r.team),
          esc(r.salary),
          esc(r.status),
          esc(r.created_at),
          esc(r.updated_at),
        ].join(",") + "\n"
      })

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `mghl-users-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({ title: "Export successful", description: `Exported ${csvRows.length} users to CSV file` })
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || "Failed to export users to CSV", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {renderButtonsSection()}

      {/* Search */}
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

      {showMigrationAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-amber-800">Database Update Required</h3>
              <p className="text-amber-700 mt-1 text-sm">
                The user activation feature requires a database update. Please run the SQL below in the Supabase SQL Editor.
              </p>
              <div className="mt-3 space-y-2">
                <div className="text-sm text-amber-700 mt-2">
                  <p className="font-medium">SQL Migration:</p>
                  <pre className="bg-amber-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
                    {"\n"}UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
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
                  <Link href="/admin/lmshl-bot">Set Up Discord Integration</Link>
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
              {/* Top pagination info */}
              {!!filteredUsers.length && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        Previous
                      </Button>
                      <span className="text-sm">Page {currentPage} of {totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
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
                        <TableCell colSpan={isActiveColumnExists ? 8 : 7} className="text-center py-4 text-muted-foreground">
                          {searchQuery ? "No users found matching your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => {
                        const player = user.players?.[0] ?? null

                        // Build list of team chips: main roster per league + training camp per league
                        const teamChips: { label: string; tc: boolean }[] = []
                        const resolveName = (id: string | null, fallback: string | null) =>
                          (id && teamsById[id]?.name) || fallback || null
                        if (player) {
                          const nhl = resolveName(player.team_id, player.team_name)
                          const ahl = resolveName(player.team_id_ahl, player.ahl_team_name)
                          const ecl = resolveName(player.team_id_ecl, player.ecl_team_name)
                          const tcNhl = resolveName(player.tc_team_id, player.tc_team_name)
                          const tcAhl = resolveName(player.tc_team_id_ahl, player.tc_ahl_team_name)
                          const tcEcl = resolveName(player.tc_team_id_ecl, player.tc_ecl_team_name)
                          if (nhl) teamChips.push({ label: `${nhl} (NHL)`, tc: false })
                          if (ahl) teamChips.push({ label: `${ahl} (AHL)`, tc: false })
                          if (ecl) teamChips.push({ label: `${ecl} (ECL)`, tc: false })
                          if (tcNhl) teamChips.push({ label: `${tcNhl} (NHL TC)`, tc: true })
                          if (tcAhl) teamChips.push({ label: `${tcAhl} (AHL TC)`, tc: true })
                          if (tcEcl) teamChips.push({ label: `${tcEcl} (ECL TC)`, tc: true })
                        }

                        const salary = typeof player?.salary === "number" ? player.salary : 0
                        const playerRole = player?.role ?? null
                        const allRoles: string[] = []
                        if (playerRole) allRoles.push(playerRole)
                        if (user.user_roles) user.user_roles.forEach((r: any) => { if (!allRoles.includes(r.role)) allRoles.push(r.role) })

                        return (
                          <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.gamer_tag_id}</TableCell>
                            <TableCell className="text-center">{user.console}</TableCell>
                            <TableCell className="text-center">
<div className="flex flex-wrap justify-center gap-1">
                  {allRoles.map((role: string) => (
                    <Badge key={role} variant="outline" className={`w-fit ${getRoleBadgeClass(role)}`}>
                      {role}
                    </Badge>
                  ))}
                                {!allRoles.length && <span className="text-muted-foreground">-</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {teamChips.length ? (
                                <div className="flex flex-wrap justify-center gap-1">
                                  {teamChips.map((chip) => (
                                    <Badge
                                      key={chip.label}
                                      variant="outline"
                                      className={
                                        chip.tc
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      }
                                    >
                                      {chip.label}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Free Agent</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">${salary.toLocaleString()}</TableCell>
                            {isActiveColumnExists && (
                              <TableCell className="text-center">
                                {user.is_active ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactive</Badge>
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
                                {isActiveColumnExists && (user.is_active ? (
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

              {/* Bottom pagination */}
              {totalPages > 1 && (
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

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) pageNum = i + 1
                        else if (currentPage <= 3) pageNum = i + 1
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                        else pageNum = currentPage - 2 + i
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
            <form onSubmit={(e) => {
              e.preventDefault()
              if (selectedRoles.length === 0) {
                toast({ title: "Validation Error", description: "Please select at least one role.", variant: "destructive" })
                return
              }
              const userId = form.getValues("userId")
              if (!userId) {
                toast({ title: "Validation Error", description: "User ID is missing. Please try again.", variant: "destructive" })
                return
              }
              onSubmit({ userId, roles: selectedRoles })
            }} className="space-y-6">
              {/* Hidden userId field */}
              <input type="hidden" {...form.register("userId")} />
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
                      <label htmlFor={`role-${role.value}`} className="text-sm font-medium leading-none">
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
                <Button 
                  type="submit" 
                  disabled={submitting || selectedRoles.length === 0}
                >
                  {submitting ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
                        step="50000"
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
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Teams</DialogTitle>
            <DialogDescription>
              {selectedUser && `Manage team assignments for ${selectedUser.gamer_tag_id || selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Main Roster</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  A player can hold one active roster spot per league.
                </p>
                <div className="space-y-3">
                  <TeamSlotSelect
                    label="NHL Team"
                    league="NHL"
                    teams={teams}
                    value={teamAssignmentForm.watch("teamId")}
                    onChange={(v) => teamAssignmentForm.setValue("teamId", v)}
                    disabled={submitting}
                  />
                  <TeamSlotSelect
                    label="AHL Team"
                    league="AHL"
                    teams={teams}
                    value={teamAssignmentForm.watch("teamIdAhl")}
                    onChange={(v) => teamAssignmentForm.setValue("teamIdAhl", v)}
                    disabled={submitting}
                  />
                  <TeamSlotSelect
                    label="ECL Team"
                    league="ECL"
                    teams={teams}
                    value={teamAssignmentForm.watch("teamIdEcl")}
                    onChange={(v) => teamAssignmentForm.setValue("teamIdEcl", v)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-1">Training Camp (TC)</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  A player can be a training-camp invite on one team per league, independent of their main roster.
                </p>
                <div className="space-y-3">
                  <TeamSlotSelect
                    label="NHL TC Team"
                    league="NHL"
                    teams={teams}
                    value={teamAssignmentForm.watch("tcTeamId")}
                    onChange={(v) => teamAssignmentForm.setValue("tcTeamId", v)}
                    disabled={submitting}
                  />
                  <TeamSlotSelect
                    label="AHL TC Team"
                    league="AHL"
                    teams={teams}
                    value={teamAssignmentForm.watch("tcTeamIdAhl")}
                    onChange={(v) => teamAssignmentForm.setValue("tcTeamIdAhl", v)}
                    disabled={submitting}
                  />
                  <TeamSlotSelect
                    label="ECL TC Team"
                    league="ECL"
                    teams={teams}
                    value={teamAssignmentForm.watch("tcTeamIdEcl")}
                    onChange={(v) => teamAssignmentForm.setValue("tcTeamIdEcl", v)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground border-t pt-3">
                Leaving every selection on &quot;No Team&quot; sets the player as a full free agent and locks them from
                automatic re-assignment.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => teamAssignmentForm.handleSubmit(onAssignTeam)()} disabled={submitting}>
                {submitting ? "Saving..." : "Save Assignments"}
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
              <FormField
                control={newUserForm.control}
                name="console"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Console</FormLabel>
                    <Select defaultValue={field.value} onValueChange={(v) => newUserForm.setValue("console", v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select console" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {consoles.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
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
                      <label htmlFor={`new-role-${role.value}`} className="text-sm font-medium leading-none">
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
    </div>
  )
}

function TeamSlotSelect({
  label,
  league,
  teams,
  value,
  onChange,
  disabled,
}: {
  label: string
  league: "NHL" | "AHL" | "ECL"
  teams: any[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  disabled?: boolean
}) {
  const leagueTeams = teams.filter((t) => t.league === league)
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Select
        value={value ?? "none"}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Team</SelectItem>
          {leagueTeams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {leagueTeams.length === 0 && (
        <p className="text-xs text-muted-foreground">No active {league} teams for the current season.</p>
      )}
    </div>
  )
}
