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
import { Loader2, UserX, Clock, AlertCircle, Ban, Users, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl">
                <UserX className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Banned Users Management
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Manage user bans, view banned users, and control access to the Secret Chel Society
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-red-500 to-transparent rounded-full mx-auto mt-6" />
          </div>

          {/* Enhanced Tabs */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mb-8">
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2 py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg text-white/70 hover:text-white"
              >
                <Users className="h-5 w-5" />
                Banned Users List ({filteredBannedUsers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="ban" 
                className="flex items-center gap-2 py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg text-white/70 hover:text-white"
              >
                <Ban className="h-5 w-5" />
                Ban User ({filteredUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/20">
                  <CardHeader className="border-b border-white/20 pb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-2xl text-white">
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <UserX className="h-6 w-6 text-red-400" />
                          </div>
                          Banned Users ({filteredBannedUsers.length}
                          {bannedUsers.length !== filteredBannedUsers.length ? ` of ${bannedUsers.length}` : ""})
                        </CardTitle>
                        <CardDescription className="text-white/70 mt-2">View and manage banned users</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchBannedUsers} 
                        disabled={loadingBannedUsers}
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        {loadingBannedUsers ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <div className="relative flex-1 max-w-md">
                        <Input
                          placeholder="Search by gamer tag ID, discord name, email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-white/70 hover:text-white"
                            onClick={() => setSearchTerm("")}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                              <CardContent className="pt-6">
                    {loadingBannedUsers ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredBannedUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <UserX className="h-16 w-16 mx-auto mb-4 text-white/50" />
                        {searchTerm ? (
                          <div>
                            <p className="text-white/70 mb-4">No banned users found matching "{searchTerm}"</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 border-white/30 text-white hover:bg-white/10" 
                              onClick={() => setSearchTerm("")}
                            >
                              Clear search
                            </Button>
                          </div>
                        ) : (
                          <p className="text-white/70">No banned users found</p>
                        )}
                      </div>
                    ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Ban Reason</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBannedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            {user.email && <p className="font-medium">{user.email}</p>}
                            {user.gamer_tag && <p className="text-sm text-muted-foreground">GT: {user.gamer_tag}</p>}
                            {user.gamer_tag_id && (
                              <p className="text-sm text-muted-foreground">GT ID: {user.gamer_tag_id}</p>
                            )}
                            {user.discord_name && (
                              <p className="text-sm text-muted-foreground">Discord: {user.discord_name}</p>
                            )}
                            {!user.email && !user.gamer_tag && !user.gamer_tag_id && !user.discord_name && (
                              <p className="text-sm text-muted-foreground">No display name</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-xs break-words">{user.ban_reason}</p>
                        </TableCell>
                        <TableCell>
                          {user.ban_expiration ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">{formatDate(user.ban_expiration)}</span>
                            </div>
                          ) : (
                            <Badge variant="destructive">Permanent</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.ban_expiration && isExpired(user.ban_expiration) ? (
                            <Badge variant="outline" className="text-orange-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUnbanDialog(user)}
                            disabled={unbanning === user.id}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ban">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Ban or unban users from the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    All Users ({filteredUsers.length}
                    {users.length !== filteredUsers.length ? ` of ${users.length}` : ""})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchUsers(currentPage)} disabled={loadingUsers}>
                      {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Refresh
                    </Button>
                    {!userSearchTerm.trim() && (
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Input
                      placeholder="Search by gamer tag ID or discord name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pr-8"
                    />
                    {userSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setUserSearchTerm("")}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>

                {users.length === 0 && !loadingUsers && (
                  <div className="text-center py-4">
                    <Button onClick={() => fetchUsers(1)} variant="outline">
                      Load Users
                    </Button>
                  </div>
                )}

                {loadingUsers ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Gamer Tag ID</TableHead>
                          <TableHead>Discord Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <p className="font-medium">{user.gamer_tag_id || "Not set"}</p>
                            </TableCell>
                            <TableCell>
                              <p>{user.discord_name || "Not set"}</p>
                            </TableCell>
                            <TableCell>
                              {user.is_banned ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : (
                                <Badge variant="default">Active</Badge>
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
                                <Button variant="destructive" size="sm" onClick={() => openBanDialog(user)}>
                                  Ban
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination - only show when not searching */}
                    {!userSearchTerm.trim() && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loadingUsers}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loadingUsers}
                          >
                            Next
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
                          {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
                        </div>
                      </div>
                    )}
                  </>
                ) : users.length > 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div>
                      <p>No users found matching "{userSearchTerm}"</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setUserSearchTerm("")}>
                        Clear search
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
                </motion.div>
              </TabsContent>
      </Tabs>

      {/* Unban Confirmation Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unban this user? This will immediately restore their access to the platform.
            </DialogDescription>
          </DialogHeader>
          {selectedUserForUnban && (
            <div className="space-y-2">
              <p>
                <strong>User:</strong>{" "}
                {selectedUserForUnban.gamer_tag_id ||
                  selectedUserForUnban.discord_name ||
                  selectedUserForUnban.email ||
                  "Unknown"}
              </p>
              <p>
                <strong>Ban Reason:</strong> {selectedUserForUnban.ban_reason}
              </p>
              {selectedUserForUnban.ban_expiration && (
                <p>
                  <strong>Ban Expiration:</strong> {formatDate(selectedUserForUnban.ban_expiration)}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUnbanDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmUnban} disabled={unbanning !== null}>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              {selectedUserForBan && (
                <>Ban user: {selectedUserForBan.gamer_tag_id || selectedUserForBan.discord_name || "Unknown"}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banReason">Ban Reason</Label>
              <Textarea
                id="banReason"
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banDuration">Ban Duration</Label>
              <Select value={banDuration} onValueChange={setBanDuration} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select ban duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 day">1 Day</SelectItem>
                  <SelectItem value="3 days">3 Days</SelectItem>
                  <SelectItem value="1 week">1 Week</SelectItem>
                  <SelectItem value="2 weeks">2 Weeks</SelectItem>
                  <SelectItem value="1 month">1 Month</SelectItem>
                  <SelectItem value="3 months">3 Months</SelectItem>
                  <SelectItem value="6 months">6 Months</SelectItem>
                  <SelectItem value="1 year">1 Year</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="custom">Custom Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {banDuration === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customDuration">Custom Duration</Label>
                <Input
                  id="customDuration"
                  placeholder="e.g., 45 days, 2 months, 1.5 years"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Examples: "45 days", "2 months", "1.5 years"</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBanUser}
              disabled={banning || !banReason.trim() || !banDuration}
              variant="destructive"
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
        </motion.div>
      </div>
    </div>
    </>
  )
}
