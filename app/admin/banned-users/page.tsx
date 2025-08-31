"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, UserX, Clock, AlertCircle, Ban, Users, RefreshCw, Shield, Search, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/lib/supabase/client"

interface BannedUser {
  id: string
  email: string
  gamer_tag?: string
  gamer_tag_id?: string
  discord_name?: string
  ban_reason: string
  ban_expiration: string | null
  created_at: string
}

interface User {
  id: string
  gamer_tag_id?: string
  discord_name?: string
  is_banned: boolean
  ban_reason?: string
  ban_expiration?: string | null
}

export default function BannedUsersPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loadingBannedUsers, setLoadingBannedUsers] = useState(false)
  const [unbanning, setUnbanning] = useState<string | null>(null)
  const [banning, setBanning] = useState(false)

  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const usersPerPage = 25

  // Ban dialog state
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedUserForBan, setSelectedUserForBan] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("")
  const [customDuration, setCustomDuration] = useState("")

  // Unban confirmation dialog state
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [selectedUserForUnban, setSelectedUserForUnban] = useState<BannedUser | null>(null)

  // Search states
  const [searchTerm, setSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")

  const filteredBannedUsers = bannedUsers.filter((user) => {
    if (!searchTerm.trim()) return true

    const search = searchTerm.toLowerCase()
    const gamerTagId = user.gamer_tag_id?.toLowerCase() || ""
    const discordName = user.discord_name?.toLowerCase() || ""
    const email = user.email?.toLowerCase() || ""
    const gamerTag = user.gamer_tag?.toLowerCase() || ""

    return (
      gamerTagId.includes(search) || discordName.includes(search) || email.includes(search) || gamerTag.includes(search)
    )
  })

  const filteredUsers = users.filter((user) => {
    if (!userSearchTerm.trim()) return true

    const search = userSearchTerm.toLowerCase()
    const gamerTagId = user.gamer_tag_id?.toLowerCase() || ""
    const discordName = user.discord_name?.toLowerCase() || ""

    return gamerTagId.includes(search) || discordName.includes(search)
  })

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
          toast({
            title: "Access denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
        fetchBannedUsers()
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  const fetchBannedUsers = async () => {
    setLoadingBannedUsers(true)
    try {
      const response = await fetch("/api/admin/banned-users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch banned users")
      }

      console.log("Fetched banned users:", data) // Debug log
      setBannedUsers(data.users || [])
    } catch (error: any) {
      console.error("Error fetching banned users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch banned users",
        variant: "destructive",
      })
    } finally {
      setLoadingBannedUsers(false)
    }
  }

  const handleUnban = async (userId: string) => {
    setUnbanning(userId)

    try {
      console.log("Attempting to unban user:", userId) // Debug log

      const response = await fetch("/api/admin/unban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({ userId }),
      })

      console.log("Unban response status:", response.status) // Debug log

      const data = await response.json()
      console.log("Unban response data:", data) // Debug log

      if (!response.ok) {
        throw new Error(data.error || "Failed to unban user")
      }

      toast({
        title: "Success",
        description: "User has been unbanned successfully",
      })

      fetchBannedUsers()
      if (users.length > 0) {
        fetchUsers(currentPage) // Refresh users list if it's loaded
      }
    } catch (error: any) {
      console.error("Unban user error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      })
    } finally {
      setUnbanning(null)
    }
  }

  const openUnbanDialog = (user: BannedUser) => {
    setSelectedUserForUnban(user)
    setUnbanDialogOpen(true)
  }

  const confirmUnban = () => {
    if (selectedUserForUnban) {
      handleUnban(selectedUserForUnban.id)
      setUnbanDialogOpen(false)
      setSelectedUserForUnban(null)
    }
  }

  const fetchUsers = async (page = 1) => {
    setLoadingUsers(true)
    try {
      // When searching, fetch more users to have a better pool to filter from
      const limit = userSearchTerm.trim() ? 100 : usersPerPage
      const offset = userSearchTerm.trim() ? 0 : (page - 1) * usersPerPage

      const response = await fetch(`/api/admin/users-list?page=${userSearchTerm.trim() ? 1 : page}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users")
      }

      setUsers(data.users || [])
      setTotalUsers(data.total || 0)
      if (!userSearchTerm.trim()) {
        setCurrentPage(page)
      }
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  // Refetch users when search term changes
  useEffect(() => {
    if (users.length > 0) {
      fetchUsers(1)
    }
  }, [userSearchTerm])

  const totalPages = Math.ceil(totalUsers / usersPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !userSearchTerm.trim()) {
      fetchUsers(page)
    }
  }

  const openBanDialog = (user: User) => {
    setSelectedUserForBan(user)
    setBanDialogOpen(true)
    setBanReason("")
    setBanDuration("")
    setCustomDuration("")
  }

  const handleBanUser = async () => {
    if (!selectedUserForBan || !banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a ban reason",
        variant: "destructive",
      })
      return
    }

    const duration = banDuration === "custom" ? customDuration : banDuration

    if (!duration) {
      toast({
        title: "Error",
        description: "Please select or enter a ban duration",
        variant: "destructive",
      })
      return
    }

    setBanning(true)

    try {
      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserForBan.id,
          banReason: banReason.trim(),
          banDuration: duration,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to ban user")
      }

      toast({
        title: "Success",
        description: "User has been banned successfully",
      })

      // Reset form and close dialog
      setBanDialogOpen(false)
      setSelectedUserForBan(null)
      setBanReason("")
      setBanDuration("")
      setCustomDuration("")

      fetchBannedUsers()
      fetchUsers(currentPage) // Refresh users list
    } catch (error: any) {
      console.error("Ban user error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      })
    } finally {
      setBanning(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-400" />
            Banned Users Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage user bans and restrictions across the platform
          </p>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-white/20">
            <TabsTrigger value="list" className="text-white data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Banned Users ({filteredBannedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="ban" className="text-white data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Ban User ({filteredUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserX className="h-5 w-5 text-red-400" />
                      Banned Users ({filteredBannedUsers.length}
                      {bannedUsers.length !== filteredBannedUsers.length ? ` of ${bannedUsers.length}` : ""})
                    </CardTitle>
                    <CardDescription className="text-white/70">View and manage banned users</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchBannedUsers} 
                    disabled={loadingBannedUsers}
                    className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                  >
                    {loadingBannedUsers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      placeholder="Search by gamer tag ID, discord name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-white hover:bg-slate-700/50"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBannedUsers ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                ) : filteredBannedUsers.length === 0 ? (
                  <div className="text-center py-8 text-white/70">
                    <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    {searchTerm ? (
                      <div>
                        <p>No banned users found matching "{searchTerm}"</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50" 
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <p>No banned users found</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="text-white">User Details</TableHead>
                          <TableHead className="text-white">Ban Reason</TableHead>
                          <TableHead className="text-white">Expiration</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBannedUsers.map((user) => (
                          <TableRow key={user.id} className="border-white/20 hover:bg-slate-800/30">
                            <TableCell>
                              <div className="space-y-1">
                                {user.email && <p className="font-medium text-white">{user.email}</p>}
                                {user.gamer_tag && <p className="text-sm text-white/70">GT: {user.gamer_tag}</p>}
                                {user.gamer_tag_id && (
                                  <p className="text-sm text-white/70">GT ID: {user.gamer_tag_id}</p>
                                )}
                                {user.discord_name && (
                                  <p className="text-sm text-white/70">Discord: {user.discord_name}</p>
                                )}
                                {!user.email && !user.gamer_tag && !user.gamer_tag_id && !user.discord_name && (
                                  <p className="text-sm text-white/70">No display name</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm max-w-xs break-words text-white/80">{user.ban_reason}</p>
                            </TableCell>
                            <TableCell>
                              {user.ban_expiration ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-white/70" />
                                  <span className="text-sm text-white/80">{formatDate(user.ban_expiration)}</span>
                                </div>
                              ) : (
                                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Permanent</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.ban_expiration && isExpired(user.ban_expiration) ? (
                                <Badge variant="outline" className="text-orange-400 border-orange-500/30 bg-orange-500/10">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Expired
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUnbanDialog(user)}
                                disabled={unbanning === user.id}
                                className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                              >
                                {unbanning === user.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Unbanning...
                                  </>
                                ) : (
                                  "Unban"
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ban" className="mt-6">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Ban className="h-5 w-5 text-amber-400" />
                  User Management
                </CardTitle>
                <CardDescription className="text-white/70">Ban or unban users from the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">
                      All Users ({filteredUsers.length}
                      {users.length !== filteredUsers.length ? ` of ${users.length}` : ""})
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchUsers(currentPage)} 
                        disabled={loadingUsers}
                        className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                      >
                        {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                      </Button>
                      {!userSearchTerm.trim() && (
                        <div className="text-sm text-white/70">
                          Page {currentPage} of {totalPages}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                      <Input
                        placeholder="Search by gamer tag ID or discord name..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                      />
                      {userSearchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-white hover:bg-slate-700/50"
                          onClick={() => setUserSearchTerm("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {users.length === 0 && !loadingUsers && (
                    <div className="text-center py-4">
                      <Button 
                        onClick={() => fetchUsers(1)} 
                        variant="outline"
                        className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                      >
                        Load Users
                      </Button>
                    </div>
                  )}

                  {loadingUsers ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20">
                              <TableHead className="text-white">Gamer Tag ID</TableHead>
                              <TableHead className="text-white">Discord Name</TableHead>
                              <TableHead className="text-white">Status</TableHead>
                              <TableHead className="text-white">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow key={user.id} className="border-white/20 hover:bg-slate-800/30">
                                <TableCell>
                                  <p className="font-medium text-white">{user.gamer_tag_id || "Not set"}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-white/80">{user.discord_name || "Not set"}</p>
                                </TableCell>
                                <TableCell>
                                  {user.is_banned ? (
                                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Banned</Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.is_banned ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Are you sure you want to unban ${user.gamer_tag_id || user.discord_name || "this user"}?`,
                                          )
                                        ) {
                                          handleUnban(user.id)
                                        }
                                      }}
                                      disabled={unbanning === user.id}
                                      className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                                    >
                                      {unbanning === user.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Unbanning...
                                        </>
                                      ) : (
                                        "Unban"
                                      )}
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      onClick={() => openBanDialog(user)}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      Ban
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination - only show when not searching */}
                      {!userSearchTerm.trim() && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1 || loadingUsers}
                              className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages || loadingUsers}
                              className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                            >
                              Next
                            </Button>
                          </div>
                          <div className="text-sm text-white/70">
                            Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
                            {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
                          </div>
                        </div>
                      )}
                    </>
                  ) : users.length > 0 ? (
                    <div className="text-center py-8 text-white/70">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <div>
                        <p>No users found matching "{userSearchTerm}"</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50" 
                          onClick={() => setUserSearchTerm("")}
                        >
                          Clear search
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Unban Confirmation Dialog */}
        <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Unban User</DialogTitle>
              <DialogDescription className="text-white/70">
                Are you sure you want to unban this user? This will immediately restore their access to the platform.
              </DialogDescription>
            </DialogHeader>
            {selectedUserForUnban && (
              <div className="space-y-2 text-white/80">
                <p>
                  <strong className="text-white">User:</strong>{" "}
                  {selectedUserForUnban.gamer_tag_id ||
                    selectedUserForUnban.discord_name ||
                    selectedUserForUnban.email ||
                    "Unknown"}
                </p>
                <p>
                  <strong className="text-white">Ban Reason:</strong> {selectedUserForUnban.ban_reason}
                </p>
                {selectedUserForUnban.ban_expiration && (
                  <p>
                    <strong className="text-white">Ban Expiration:</strong> {formatDate(selectedUserForUnban.ban_expiration)}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUnbanDialogOpen(false)}
                className="bg-slate-700/50 border-white/20 text-white hover:bg-slate-600/50"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={confirmUnban} 
                disabled={unbanning !== null}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {unbanning !== null ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unbanning...
                  </>
                ) : (
                  "Unban User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Ban User</DialogTitle>
              <DialogDescription className="text-white/70">
                {selectedUserForBan && (
                  <>Ban user: {selectedUserForBan.gamer_tag_id || selectedUserForBan.discord_name || "Unknown"}</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banReason" className="text-white">Ban Reason</Label>
                <Textarea
                  id="banReason"
                  placeholder="Enter the reason for banning this user..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  required
                  className="bg-slate-700/50 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banDuration" className="text-white">Ban Duration</Label>
                <Select value={banDuration} onValueChange={setBanDuration} required>
                  <SelectTrigger className="bg-slate-700/50 border-white/20 text-white">
                    <SelectValue placeholder="Select ban duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-white/20">
                    <SelectItem value="1 day" className="text-white hover:bg-slate-600">1 Day</SelectItem>
                    <SelectItem value="3 days" className="text-white hover:bg-slate-600">3 Days</SelectItem>
                    <SelectItem value="1 week" className="text-white hover:bg-slate-600">1 Week</SelectItem>
                    <SelectItem value="2 weeks" className="text-white hover:bg-slate-600">2 Weeks</SelectItem>
                    <SelectItem value="1 month" className="text-white hover:bg-slate-600">1 Month</SelectItem>
                    <SelectItem value="3 months" className="text-white hover:bg-slate-600">3 Months</SelectItem>
                    <SelectItem value="6 months" className="text-white hover:bg-slate-600">6 Months</SelectItem>
                    <SelectItem value="1 year" className="text-white hover:bg-slate-600">1 Year</SelectItem>
                    <SelectItem value="permanent" className="text-white hover:bg-slate-600">Permanent</SelectItem>
                    <SelectItem value="custom" className="text-white hover:bg-slate-600">Custom Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {banDuration === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customDuration" className="text-white">Custom Duration</Label>
                  <Input
                    id="customDuration"
                    placeholder="e.g., 45 days, 2 months, 1.5 years"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    required
                    className="bg-slate-700/50 border-white/20 text-white placeholder:text-white/50"
                  />
                  <p className="text-xs text-white/50">Examples: "45 days", "2 months", "1.5 years"</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setBanDialogOpen(false)}
                className="bg-slate-700/50 border-white/20 text-white hover:bg-slate-600/50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBanUser}
                disabled={banning || !banReason.trim() || !banDuration}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {banning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Banning...
                  </>
                ) : (
                  "Ban User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
