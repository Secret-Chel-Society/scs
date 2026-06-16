"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Search, UserCog, Crown, Shield, Users, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import debounce from "lodash/debounce"

interface Team {
  id: string
  name: string
  logo_url?: string
}

interface Player {
  id: string
  role: string | null
  salary: number
  team_id: string | null
  team_id_ahl: string | null
  teams: Team | null
  teams_ahl: Team | null
}

interface User {
  id: string
  gamer_tag_id: string
  email: string
  avatar_url: string | null
  console: string | null
  players: Player[]
}

const ROLE_SALARIES: Record<string, number> = {
  "Owner": 0,
  "GM": 0,
  "AGM": 2500000,
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Owner": <Crown className="h-4 w-4" />,
  "GM": <Shield className="h-4 w-4" />,
  "AGM": <Users className="h-4 w-4" />,
}

export default function RoleOffersPage() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedLeague, setSelectedLeague] = useState<string>("NHL")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [teams, setTeams] = useState<Team[]>([])
  const [ahlTeams, setAhlTeams] = useState<Team[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [customSalary, setCustomSalary] = useState<string>("")
  const [useCustomSalary, setUseCustomSalary] = useState(false)

  useEffect(() => {
    checkAdminAndLoad()
    loadTeams()
  }, [session])

  useEffect(() => {
    if (isAdmin) {
      searchUsers()
    }
  }, [page, isAdmin])

  const checkAdminAndLoad = async () => {
    if (!session?.user) {
      router.push("/login")
      return
    }

    const { data: adminRoleData, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .in("role", ["Admin", "Site Owner"])

    if (roleError || !adminRoleData || adminRoleData.length === 0) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  const loadTeams = async () => {
    // Get the current NHL season
    const { data: currentSeason } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single()

    if (currentSeason) {
      // Load NHL teams from team_seasons for the current season
      const { data: teamSeasons } = await supabase
        .from("team_seasons")
        .select("team_id, teams:team_id(id, name, logo_url)")
        .eq("season_id", currentSeason.id)

      if (teamSeasons) {
        const nhlTeams = teamSeasons
          .map((ts: any) => ts.teams)
          .filter((t: any) => t !== null)
          .sort((a: Team, b: Team) => a.name.localeCompare(b.name))
        setTeams(nhlTeams)
      }
    } else {
      // Fallback to all teams if no active season
      const { data: nhlTeams } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .order("name")

      if (nhlTeams) {
        setTeams(nhlTeams)
      }
    }

    // Get the current AHL season
    const { data: currentAhlSeason } = await supabase
      .from("seasons_ahl")
      .select("id")
      .eq("is_active", true)
      .single()

    if (currentAhlSeason) {
      // Load AHL teams from team_seasons_ahl for the current season
      const { data: ahlTeamSeasons } = await supabase
        .from("team_seasons_ahl")
        .select("team_id, teams_ahl:team_id(id, name, logo_url)")
        .eq("season_id", currentAhlSeason.id)

      if (ahlTeamSeasons) {
        const ahlTeamsFiltered = ahlTeamSeasons
          .map((ts: any) => ts.teams_ahl)
          .filter((t: any) => t !== null)
          .sort((a: Team, b: Team) => a.name.localeCompare(b.name))
        setAhlTeams(ahlTeamsFiltered)
      }
    } else {
      // Fallback to all AHL teams if no active season
      const { data: ahlTeamsData } = await supabase
        .from("teams_ahl")
        .select("id, name, logo_url")
        .order("name")

      if (ahlTeamsData) {
        setAhlTeams(ahlTeamsData)
      }
    }
  }

  const searchUsers = async (query?: string) => {
    if (!session?.access_token) return

    setSearching(true)
    try {
      const searchTerm = query !== undefined ? query : searchQuery
      const response = await fetch(
        `/api/admin/role-offers?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to search users")
      }

      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search users",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(1)
      searchUsers(query)
    }, 300),
    [session?.access_token]
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setSelectedRole("")
    setSelectedLeague("NHL")
    setSelectedTeamId("none")
    setCustomSalary("")
    setUseCustomSalary(false)
    setDialogOpen(true)
  }

  const assignRole = async () => {
    if (!selectedUser || !selectedRole || !session?.access_token) return

    setSubmitting(true)
    try {
      const player = selectedUser.players?.[0]
      const finalSalary = useCustomSalary && customSalary 
        ? parseInt(customSalary.replace(/,/g, "")) 
        : ROLE_SALARIES[selectedRole]
      
      const response = await fetch("/api/admin/role-offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          player_id: player?.id || null,
          role: selectedRole,
          team_id: selectedLeague === "NHL" && selectedTeamId && selectedTeamId !== "none" ? selectedTeamId : null,
          team_id_ahl: selectedLeague === "AHL" && selectedTeamId && selectedTeamId !== "none" ? selectedTeamId : null,
          league: selectedLeague,
          custom_salary: useCustomSalary ? finalSalary : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign role")
      }

      toast({
        title: "Role Assigned",
        description: data.message,
      })

      setDialogOpen(false)
      searchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "GM":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "AGM":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const currentTeams = selectedLeague === "AHL" ? ahlTeams : teams

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Link>
        <h1 className="text-3xl font-bold">Role Offers</h1>
        <p className="text-muted-foreground mt-1">
          Assign Owner, GM, or AGM roles to players with automatic salary assignment
        </p>
      </div>

      {/* Role Salary Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Crown className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-400">Owner</p>
                <p className="text-sm text-muted-foreground">$0 Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-blue-400">GM</p>
                <p className="text-sm text-muted-foreground">$0 Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-purple-400">AGM</p>
                <p className="text-sm text-muted-foreground">$2,500,000 Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <CardDescription>
            Search by gamer tag or email to find users and assign roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by gamer tag or email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {total} user{total !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No users found matching your search" : "Search for users to assign roles"}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Console</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Current Team</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const player = user.players?.[0]
                      const team = player?.teams || player?.teams_ahl

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar_url || ""} />
                                <AvatarFallback>
                                  {user.gamer_tag_id?.charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.gamer_tag_id}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.console && (
                              <Badge variant="outline">{user.console}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {player?.role ? (
                              <Badge className={getRoleBadgeColor(player.role)}>
                                {ROLE_ICONS[player.role]}
                                <span className="ml-1">{player.role}</span>
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {team ? (
                              <div className="flex items-center gap-2">
                                {team.logo_url && (
                                  <Image
                                    src={team.logo_url}
                                    alt={team.name}
                                    width={24}
                                    height={24}
                                    className="rounded"
                                  />
                                )}
                                <span className="text-sm">{team.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {player?.teams ? "NHL" : "AHL"}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Free Agent</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {player?.salary !== undefined ? (
                              <span className="font-mono">{formatSalary(player.salary)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Assign Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {users.map((user) => {
                  const player = user.players?.[0]
                  const team = player?.teams || player?.teams_ahl

                  return (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback>
                              {user.gamer_tag_id?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.gamer_tag_id}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.console && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {user.console}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Role</p>
                          {player?.role ? (
                            <Badge className={`${getRoleBadgeColor(player.role)} mt-1`}>
                              {ROLE_ICONS[player.role]}
                              <span className="ml-1">{player.role}</span>
                            </Badge>
                          ) : (
                            <p className="text-muted-foreground">-</p>
                          )}
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Salary</p>
                          <p className="font-mono">
                            {player?.salary !== undefined ? formatSalary(player.salary) : "-"}
                          </p>
                        </div>
                      </div>

                      {team && (
                        <div className="mt-3 flex items-center gap-2">
                          {team.logo_url && (
                            <Image
                              src={team.logo_url}
                              alt={team.name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                          )}
                          <span className="text-sm">{team.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {player?.teams ? "NHL" : "AHL"}
                          </Badge>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => openRoleDialog(user)}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Assign Role
                      </Button>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Assign Role
            </DialogTitle>
            <DialogDescription>
              Assign a management role to{" "}
              <span className="font-semibold text-foreground">
                {selectedUser?.gamer_tag_id}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      <span>Owner</span>
                      <span className="text-muted-foreground ml-2">($0)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="GM">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span>GM</span>
                      <span className="text-muted-foreground ml-2">($0)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="AGM">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>AGM</span>
                      <span className="text-muted-foreground ml-2">($2,500,000)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>League</Label>
              <Select value={selectedLeague} onValueChange={(v) => {
                setSelectedLeague(v)
                setSelectedTeamId("none")
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NHL">NHL</SelectItem>
                  <SelectItem value="AHL">AHL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team (Optional)</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team (Free Agent)</SelectItem>
                  {currentTeams.filter(team => team.id).map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        {team.logo_url && (
                          <Image
                            src={team.logo_url}
                            alt={team.name}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                        )}
                        <span>{team.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use-custom-salary"
                    checked={useCustomSalary}
                    onChange={(e) => setUseCustomSalary(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="use-custom-salary" className="text-sm cursor-pointer">
                    Use custom salary
                  </Label>
                </div>

                {useCustomSalary && (
                  <div className="space-y-2">
                    <Label>Custom Salary</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="text"
                        placeholder="2,500,000"
                        value={customSalary}
                        onChange={(e) => {
                          // Allow only numbers and commas
                          const value = e.target.value.replace(/[^\d,]/g, "")
                          setCustomSalary(value)
                        }}
                        className="pl-7 font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Salary will be set to:</span>{" "}
                    <span className="font-semibold font-mono">
                      {useCustomSalary && customSalary 
                        ? formatSalary(parseInt(customSalary.replace(/,/g, "")) || 0)
                        : formatSalary(ROLE_SALARIES[selectedRole] || 0)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={assignRole}
              disabled={submitting || !selectedRole}
              className="w-full sm:w-auto"
            >
              {submitting ? "Assigning..." : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
