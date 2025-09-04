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
import { Loader2, UserX, Clock, AlertCircle, Ban, Users, RefreshCw, Shield, Gavel, AlertTriangle, CheckCircle, XCircle, Search, Database, Calendar, UserCheck } from "lucide-react"
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
import { motion } from "framer-motion"

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
        >
          {/* Hero Header Section */}
          <div className="relative overflow-hidden py-16 px-4 mb-8 text-center">
            <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-goal-red-200/30 to-goal-red-300/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10">
              <div className="flex flex-col items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-goal-red-500/25">
                  <Gavel className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="hockey-title text-4xl md:text-5xl mb-4">Banned Users Management</h1>
                  <p className="hockey-subtitle text-xl md:text-2xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-2xl">
                    Manage user bans, suspensions, and platform access control
                  </p>
                </div>
              </div>
            </div>
          </div>

      <Tabs defaultValue="list" className="w-full">
        <Card className="hockey-card hockey-card-hover mb-8 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
          <CardContent className="p-2">
            <TabsList className="grid w-full grid-cols-2 h-auto bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20">
              <TabsTrigger value="list" className="text-sm px-4 py-3 hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105">
                <Users className="h-4 w-4 mr-2" />
                Banned Users List ({filteredBannedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="ban" className="text-sm px-4 py-3 hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105">
                <Ban className="h-4 w-4 mr-2" />
                Ban User ({filteredUsers.length})
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="list">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
              <CardHeader className="relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <UserX className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                        <UserX className="h-6 w-6" />
                        Banned Users ({filteredBannedUsers.length}
                        {bannedUsers.length !== filteredBannedUsers.length ? ` of ${bannedUsers.length}` : ""})
                      </CardTitle>
                      <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">View and manage banned users</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchBannedUsers} 
                    disabled={loadingBannedUsers}
                    className="hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105"
                  >
                    {loadingBannedUsers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-6 relative z-10">
                  <div className="relative flex-1 max-w-sm">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <Search className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <Input
                      placeholder="Search by gamer tag ID, discord name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="hockey-search h-12 text-base pl-12 pr-12 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-ice-blue-100 dark:hover:bg-rink-blue-900/30 rounded-lg transition-all duration-200"
                        onClick={() => setSearchTerm("")}
                      >
                        <XCircle className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            <CardContent>
              {loadingBannedUsers ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredBannedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {searchTerm ? (
                    <div>
                      <p>No banned users found matching "{searchTerm}"</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setSearchTerm("")}>
                        Clear search
                      </Button>
                    </div>
                  ) : (
                    <p>No banned users found</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 hover:from-ice-blue-100 dark:hover:from-ice-blue-800/30 hover:to-rink-blue-100 dark:hover:to-rink-blue-800/30 transition-all duration-300">
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">User Details</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Ban Reason</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Expiration</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredBannedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-100/50 dark:border-rink-blue-800/50">
                        <TableCell>
                          <div className="space-y-2">
                            {user.email && <p className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{user.email}</p>}
                            {user.gamer_tag && <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">GT: {user.gamer_tag}</p>}
                            {user.gamer_tag_id && (
                              <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">GT ID: {user.gamer_tag_id}</p>
                            )}
                            {user.discord_name && (
                              <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Discord: {user.discord_name}</p>
                            )}
                            {!user.email && !user.gamer_tag && !user.gamer_tag_id && !user.discord_name && (
                              <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500">No display name</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-xs break-words text-hockey-silver-700 dark:text-hockey-silver-300">{user.ban_reason}</p>
                        </TableCell>
                        <TableCell>
                          {user.ban_expiration ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 rounded-lg flex items-center justify-center">
                                <Clock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                              </div>
                              <span className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{formatDate(user.ban_expiration)}</span>
                            </div>
                          ) : (
                            <Badge variant="destructive" className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md">Permanent</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.ban_expiration && isExpired(user.ban_expiration) ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUnbanDialog(user)}
                            disabled={unbanning === user.id}
                            className="hockey-button bg-gradient-to-r from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border-assist-green-300 dark:border-assist-green-600 hover:from-assist-green-200 dark:hover:to-assist-green-200 text-assist-green-700 dark:text-assist-green-300 transition-all duration-300 hover:scale-105"
                          >
                            {unbanning === user.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Unbanning...
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Unban
                              </>
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

        <TabsContent value="ban">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="hockey-card hockey-card-hover border-2 border-goal-red-200/50 dark:border-goal-red-700/50 shadow-2xl shadow-goal-red-500/20">
              <CardHeader className="relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Ban className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                      <Ban className="h-6 w-6" />
                      User Management
                    </CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">Ban or unban users from the platform</CardDescription>
                  </div>
                </div>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                      All Users ({filteredUsers.length}
                      {users.length !== filteredUsers.length ? ` of ${users.length}` : ""})
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchUsers(currentPage)} 
                      disabled={loadingUsers}
                      className="hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105"
                    >
                      {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Refresh
                    </Button>
                    {!userSearchTerm.trim() && (
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 bg-white dark:bg-hockey-silver-800 px-3 py-1 rounded-lg border border-ice-blue-200/50 dark:border-rink-blue-700/50">
                        Page {currentPage} of {totalPages}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <Search className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <Input
                      placeholder="Search by gamer tag ID or discord name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="hockey-search h-12 text-base pl-12 pr-12 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                    />
                    {userSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-ice-blue-100 dark:hover:bg-rink-blue-900/30 rounded-lg transition-all duration-200"
                        onClick={() => setUserSearchTerm("")}
                      >
                        <XCircle className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
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
                    <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-hidden shadow-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 hover:from-ice-blue-100 dark:hover:from-ice-blue-800/30 hover:to-rink-blue-100 dark:hover:to-rink-blue-800/30 transition-all duration-300">
                            <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Gamer Tag ID</TableHead>
                            <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Discord Name</TableHead>
                            <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                            <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-100/50 dark:border-rink-blue-800/50">
                              <TableCell>
                                <p className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{user.gamer_tag_id || "Not set"}</p>
                              </TableCell>
                              <TableCell>
                                <p className="text-hockey-silver-700 dark:text-hockey-silver-300">{user.discord_name || "Not set"}</p>
                              </TableCell>
                              <TableCell>
                                {user.is_banned ? (
                                  <Badge variant="destructive" className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md">Banned</Badge>
                                ) : (
                                  <Badge variant="default" className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-md">Active</Badge>
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
                                    className="hockey-button bg-gradient-to-r from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border-assist-green-300 dark:border-assist-green-600 hover:from-assist-green-200 dark:hover:to-assist-green-200 text-assist-green-700 dark:text-assist-green-300 transition-all duration-300 hover:scale-105"
                                  >
                                    {unbanning === user.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Unbanning...
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Unban
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => openBanDialog(user)}
                                    className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
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
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loadingUsers}
                            className="hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105"
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loadingUsers}
                            className="hockey-button bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-200 dark:hover:to-rink-blue-200 text-ice-blue-700 dark:text-ice-blue-300 transition-all duration-300 hover:scale-105"
                          >
                            Next
                          </Button>
                        </div>
                        <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 bg-white dark:bg-hockey-silver-800 px-3 py-2 rounded-lg border border-ice-blue-200/50 dark:border-rink-blue-700/50">
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
        </TabsContent>
      </Tabs>
        </motion.div>
      </div>
    </div>

      {/* Unban Confirmation Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-assist-green-600 dark:text-assist-green-400" />
              Unban User
            </DialogTitle>
            <DialogDescription className="text-base text-hockey-silver-600 dark:text-hockey-silver-400">
              Are you sure you want to unban this user? This will immediately restore their access to the platform.
            </DialogDescription>
          </DialogHeader>
          {selectedUserForUnban && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-assist-green-100/30 to-assist-green-200/30 dark:from-assist-green-900/10 dark:to-assist-green-800/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">
                    <strong>User:</strong>{" "}
                    {selectedUserForUnban.gamer_tag_id ||
                      selectedUserForUnban.discord_name ||
                      selectedUserForUnban.email ||
                      "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Ban className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">
                    <strong>Ban Reason:</strong> {selectedUserForUnban.ban_reason}
                  </p>
                </div>
              </div>
              {selectedUserForUnban.ban_expiration && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">
                      <strong>Ban Expiration:</strong> {formatDate(selectedUserForUnban.ban_expiration)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setUnbanDialogOpen(false)}
              className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmUnban} 
              disabled={unbanning !== null}
              className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-assist-green-300 dark:border-assist-green-600"
            >
              {unbanning !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unbanning...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unban User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-goal-red-50 to-goal-red-100 dark:from-hockey-silver-900 dark:to-goal-red-900 border-2 border-goal-red-200/50 dark:border-goal-red-700/50 shadow-2xl shadow-goal-red-500/20">
          <DialogHeader className="border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <Ban className="h-6 w-6 text-goal-red-600 dark:text-goal-red-400" />
              Ban User
            </DialogTitle>
            <DialogDescription className="text-base text-hockey-silver-600 dark:text-hockey-silver-400">
              {selectedUserForBan && (
                <>Ban user: {selectedUserForBan.gamer_tag_id || selectedUserForBan.discord_name || "Unknown"}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="banReason" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                Ban Reason
              </Label>
              <Textarea
                id="banReason"
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
                className="hockey-search border-2 border-goal-red-200/50 dark:border-goal-red-700/50 focus:border-goal-red-500 dark:focus:border-goal-red-500 focus:ring-4 focus:ring-goal-red-500/20 dark:focus:ring-goal-red-500/20 transition-all duration-300 min-h-[100px]"
              />
              <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-goal-red-100/30 to-goal-red-200/30 dark:from-goal-red-900/10 dark:to-goal-red-800/10 rounded-lg border border-goal-red-200/30 dark:border-goal-red-700/30">
                Provide a clear and specific reason for the ban. This will be recorded and visible to administrators.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="banDuration" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <Clock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                Ban Duration
              </Label>
              <Select value={banDuration} onValueChange={setBanDuration} required>
                <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                  <SelectValue placeholder="Select ban duration" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
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
              <div className="space-y-3">
                <Label htmlFor="customDuration" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                  Custom Duration
                </Label>
                <Input
                  id="customDuration"
                  placeholder="e.g., 45 days, 2 months, 1.5 years"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  required
                  className="hockey-search border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300"
                />
                <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-hockey-silver-100/30 to-hockey-silver-200/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-800/10 rounded-lg border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                  Examples: "45 days", "2 months", "1.5 years"
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t-2 border-goal-red-200/50 dark:border-goal-red-700/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setBanDialogOpen(false)}
              className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBanUser}
              disabled={banning || !banReason.trim() || !banDuration}
              variant="destructive"
              className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-goal-red-300 dark:border-goal-red-600"
            >
              {banning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Ban User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
