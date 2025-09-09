"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, UserX, Clock, AlertCircle, Ban, Users, RefreshCw, Shield, Gavel, UserCheck, UserMinus } from "lucide-react"
// import { motion } from "framer-motion" - disabled due to Next.js 15.2.4 compatibility
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
        {/* Enhanced Hockey-Themed Header */}
        <div className="relative mb-8 animate-fade-in-up">
          <div className="hockey-enhanced-card p-8 text-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-ice-blue-500/20 to-rink-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-goal-red-500/20 to-assist-green-500/20 rounded-full blur-lg"></div>
            
            <div className="relative z-10">
              <div 
                className="flex items-center justify-center gap-4 mb-4"
              >
                <div className="p-3 bg-gradient-to-br from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
      </div>
                <div className="p-3 bg-gradient-to-br from-goal-red-500 to-assist-green-500 rounded-full shadow-lg">
                  <Gavel className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h1 
                className="hockey-title-enhanced mb-4"
              >
                Banned Users Management
              </h1>
              
              <p 
                className="hockey-subtitle-enhanced text-hockey-silver-600 dark:text-hockey-silver-300 max-w-2xl mx-auto"
              >
                Manage user access and maintain community standards with our comprehensive ban management system
              </p>
            </div>
          </div>
        </div>

      <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-2 p-2 bg-hockey-silver-100 dark:bg-hockey-silver-800 rounded-xl">
            <TabsTrigger 
              value="list" 
              className="flex items-center gap-3 px-6 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
            >
              <UserX className="h-5 w-5" />
              <span className="font-medium">Banned Users List</span>
              <span className="bg-goal-red-500 text-white text-xs px-2 py-1 rounded-full ml-1">
                {filteredBannedUsers.length}
              </span>
          </TabsTrigger>
            <TabsTrigger 
              value="ban" 
              className="flex items-center gap-3 px-6 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
            >
              <Ban className="h-5 w-5" />
              <span className="font-medium">Ban User</span>
              <span className="bg-assist-green-500 text-white text-xs px-2 py-1 rounded-full ml-1">
                {filteredUsers.length}
              </span>
          </TabsTrigger>
        </TabsList>

          <TabsContent value="list" className="mt-8">
            <div
              className="animate-fade-in-up"
            >
              <div className="hockey-enhanced-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-goal-red-500 to-assist-green-500 rounded-full shadow-lg">
                      <UserX className="h-6 w-6 text-white" />
                    </div>
                <div>
                      <h2 className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-2">
                        Banned Users
                        <span className="bg-goal-red-500 text-white text-sm px-3 py-1 rounded-full">
                          {filteredBannedUsers.length}
                          {bannedUsers.length !== filteredBannedUsers.length ? ` of ${bannedUsers.length}` : ""}
                        </span>
                      </h2>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400">View and manage banned users</p>
                </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchBannedUsers} 
                    disabled={loadingBannedUsers}
                    className="hockey-button-enhanced"
                  >
                  {loadingBannedUsers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
                <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Input
                    placeholder="Search by gamer tag ID, discord name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="hockey-search pr-8"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-goal-red-500 hover:text-white transition-colors"
                      onClick={() => setSearchTerm("")}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
              {loadingBannedUsers ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-ice-blue-500 mx-auto mb-4" />
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Loading banned users...</p>
                    </div>
                </div>
              ) : filteredBannedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-6 bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700 rounded-xl">
                      <UserX className="h-16 w-16 mx-auto mb-4 text-ice-blue-500 opacity-60" />
                  {searchTerm ? (
                    <div>
                          <h3 className="text-lg font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 mb-2">
                            No banned users found
                          </h3>
                          <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                            No banned users match "{searchTerm}"
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hockey-button-enhanced" 
                            onClick={() => setSearchTerm("")}
                          >
                        Clear search
                      </Button>
                    </div>
                  ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 mb-2">
                            No banned users
                          </h3>
                          <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                            All users are currently active
                          </p>
                        </div>
                      )}
                    </div>
                </div>
              ) : (
                  <div className="overflow-hidden rounded-xl border border-hockey-silver-200 dark:border-hockey-silver-700">
                <Table>
                      <TableHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700">
                        <TableRow className="border-hockey-silver-200 dark:border-hockey-silver-600">
                          <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">User Details</TableHead>
                          <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Ban Reason</TableHead>
                          <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Expiration</TableHead>
                          <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Status</TableHead>
                          <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        {filteredBannedUsers.map((user, index) => (
                          <tr 
                            key={user.id}
                            className="border-hockey-silver-200 dark:border-hockey-silver-600 hover:bg-hockey-silver-50 dark:hover:bg-hockey-silver-800/50 transition-colors animate-fade-in-up"
                          >
                            <TableCell className="py-4">
                              <div className="space-y-2">
                                {user.email && (
                                  <p className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">{user.email}</p>
                                )}
                                {user.gamer_tag && (
                                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-2">
                                    <span className="bg-ice-blue-100 dark:bg-ice-blue-900 text-ice-blue-700 dark:text-ice-blue-300 px-2 py-1 rounded text-xs font-medium">GT</span>
                                    {user.gamer_tag}
                                  </p>
                                )}
                            {user.gamer_tag_id && (
                                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-2">
                                    <span className="bg-rink-blue-100 dark:bg-rink-blue-900 text-rink-blue-700 dark:text-rink-blue-300 px-2 py-1 rounded text-xs font-medium">ID</span>
                                    {user.gamer_tag_id}
                                  </p>
                            )}
                            {user.discord_name && (
                                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-2">
                                    <span className="bg-assist-green-100 dark:bg-assist-green-900 text-assist-green-700 dark:text-assist-green-300 px-2 py-1 rounded text-xs font-medium">Discord</span>
                                    {user.discord_name}
                                  </p>
                            )}
                            {!user.email && !user.gamer_tag && !user.gamer_tag_id && !user.discord_name && (
                                  <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500 italic">No display name</p>
                            )}
                          </div>
                        </TableCell>
                            <TableCell className="py-4">
                              <p className="text-sm max-w-xs break-words text-hockey-silver-700 dark:text-hockey-silver-300 bg-hockey-silver-100 dark:bg-hockey-silver-800 p-2 rounded">
                                {user.ban_reason}
                              </p>
                        </TableCell>
                            <TableCell className="py-4">
                          {user.ban_expiration ? (
                            <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-ice-blue-500" />
                                  <span className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{formatDate(user.ban_expiration)}</span>
                            </div>
                          ) : (
                                <Badge className="bg-goal-red-500 text-white">Permanent</Badge>
                          )}
                        </TableCell>
                            <TableCell className="py-4">
                          {user.ban_expiration && isExpired(user.ban_expiration) ? (
                                <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                                <Badge className="bg-goal-red-500 text-white">Active</Badge>
                          )}
                        </TableCell>
                            <TableCell className="py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUnbanDialog(user)}
                            disabled={unbanning === user.id}
                                className="hockey-button-enhanced hover:bg-assist-green-500 hover:text-white hover:border-assist-green-500"
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
                          </tr>
                    ))}
                  </TableBody>
                </Table>
                  </div>
              )}
              </div>
            </div>
        </TabsContent>

          <TabsContent value="ban" className="mt-8">
            <div
              className="animate-fade-in-up"
            >
              <div className="hockey-enhanced-card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
                    <Ban className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
                User Management
                    </h2>
                    <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Ban or unban users from the platform</p>
                  </div>
                </div>
                <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">
                        All Users
                  </h4>
                      <span className="bg-assist-green-500 text-white text-sm px-3 py-1 rounded-full">
                        {filteredUsers.length}
                        {users.length !== filteredUsers.length ? ` of ${users.length}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchUsers(currentPage)} 
                        disabled={loadingUsers}
                        className="hockey-button-enhanced"
                      >
                      {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Refresh
                    </Button>
                    {!userSearchTerm.trim() && (
                        <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 bg-hockey-silver-100 dark:bg-hockey-silver-800 px-3 py-1 rounded">
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
                        className="hockey-search pr-8"
                    />
                    {userSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-goal-red-500 hover:text-white transition-colors"
                        onClick={() => setUserSearchTerm("")}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>

                {users.length === 0 && !loadingUsers && (
                    <div className="text-center py-8">
                      <div className="p-6 bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700 rounded-xl">
                        <Users className="h-12 w-12 mx-auto mb-4 text-ice-blue-500 opacity-60" />
                        <h3 className="text-lg font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 mb-2">
                          No Users Loaded
                        </h3>
                        <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                          Click the button below to load users from the database
                        </p>
                        <Button onClick={() => fetchUsers(1)} className="hockey-button-enhanced">
                      Load Users
                    </Button>
                      </div>
                  </div>
                )}

                {loadingUsers ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-ice-blue-500 mx-auto mb-4" />
                        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Loading users...</p>
                      </div>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <>
                      <div className="overflow-hidden rounded-xl border border-hockey-silver-200 dark:border-hockey-silver-700">
                    <Table>
                          <TableHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700">
                            <TableRow className="border-hockey-silver-200 dark:border-hockey-silver-600">
                              <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Gamer Tag ID</TableHead>
                              <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Discord Name</TableHead>
                              <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Status</TableHead>
                              <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                            {filteredUsers.map((user, index) => (
                              <tr 
                                key={user.id}
                                className="border-hockey-silver-200 dark:border-hockey-silver-600 hover:bg-hockey-silver-50 dark:hover:bg-hockey-silver-800/50 transition-colors animate-fade-in-up"
                              >
                                <TableCell className="py-4">
                                  <p className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">
                                    {user.gamer_tag_id || (
                                      <span className="text-hockey-silver-500 dark:text-hockey-silver-500 italic">Not set</span>
                                    )}
                                  </p>
                            </TableCell>
                                <TableCell className="py-4">
                                  <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                                    {user.discord_name || (
                                      <span className="text-hockey-silver-500 dark:text-hockey-silver-500 italic">Not set</span>
                                    )}
                                  </p>
                            </TableCell>
                                <TableCell className="py-4">
                              {user.is_banned ? (
                                    <Badge className="bg-goal-red-500 text-white">Banned</Badge>
                              ) : (
                                    <Badge className="bg-assist-green-500 text-white">Active</Badge>
                              )}
                            </TableCell>
                                <TableCell className="py-4">
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
                                      className="hockey-button-enhanced hover:bg-assist-green-500 hover:text-white hover:border-assist-green-500"
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
                                      className="hockey-button-enhanced hover:bg-goal-red-600"
                                    >
                                      <UserMinus className="mr-2 h-4 w-4" />
                                  Ban
                                </Button>
                              )}
                            </TableCell>
                              </tr>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination - only show when not searching */}
                    {!userSearchTerm.trim() && (
                          <div className="flex items-center justify-between mt-6 p-4 bg-hockey-silver-50 dark:bg-hockey-silver-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loadingUsers}
                                className="hockey-button-enhanced"
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loadingUsers}
                                className="hockey-button-enhanced"
                          >
                            Next
                          </Button>
                        </div>
                            <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                          Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
                          {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
                        </div>
                      </div>
                    )}
                      </div>
                  </>
                ) : users.length > 0 ? (
                    <div className="text-center py-12">
                      <div className="p-6 bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700 rounded-xl">
                        <Users className="h-16 w-16 mx-auto mb-4 text-ice-blue-500 opacity-60" />
                        <h3 className="text-lg font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 mb-2">
                          No users found
                        </h3>
                        <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                          No users match "{userSearchTerm}"
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hockey-button-enhanced" 
                          onClick={() => setUserSearchTerm("")}
                        >
                        Clear search
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
              </div>
            </div>
        </TabsContent>
      </Tabs>

        {/* Enhanced Unban Confirmation Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-assist-green-500 to-ice-blue-500 rounded-full shadow-lg">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
                Unban User
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
              Are you sure you want to unban this user? This will immediately restore their access to the platform.
            </DialogDescription>
          </DialogHeader>
          {selectedUserForUnban && (
              <div className="space-y-4 p-4 bg-hockey-silver-50 dark:bg-hockey-silver-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 min-w-[80px]">User:</span>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">
                {selectedUserForUnban.gamer_tag_id ||
                  selectedUserForUnban.discord_name ||
                  selectedUserForUnban.email ||
                  "Unknown"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 min-w-[80px]">Reason:</span>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300 bg-hockey-silver-100 dark:bg-hockey-silver-700 p-2 rounded text-sm">
                    {selectedUserForUnban.ban_reason}
                  </span>
                </div>
              {selectedUserForUnban.ban_expiration && (
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 min-w-[80px]">Expires:</span>
                    <span className="text-hockey-silver-700 dark:text-hockey-silver-300">
                      {formatDate(selectedUserForUnban.ban_expiration)}
                    </span>
                  </div>
              )}
            </div>
          )}
            <DialogFooter className="gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUnbanDialogOpen(false)}
                className="hockey-button-enhanced"
              >
              Cancel
            </Button>
              <Button 
                type="button" 
                onClick={confirmUnban} 
                disabled={unbanning !== null}
                className="hockey-button-enhanced bg-assist-green-500 hover:bg-assist-green-600 text-white"
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

        {/* Enhanced Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-goal-red-500 to-assist-green-500 rounded-full shadow-lg">
                  <UserMinus className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
                Ban User
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
              {selectedUserForBan && (
                  <>Ban user: <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">{selectedUserForBan.gamer_tag_id || selectedUserForBan.discord_name || "Unknown"}</span></>
              )}
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="banReason" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-goal-red-500" />
                  Ban Reason
                </Label>
              <Textarea
                id="banReason"
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
                  className="hockey-search min-h-[100px]"
              />
            </div>

              <div className="space-y-3">
                <Label htmlFor="banDuration" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ice-blue-500" />
                  Ban Duration
                </Label>
              <Select value={banDuration} onValueChange={setBanDuration} required>
                  <SelectTrigger className="hockey-search">
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
                <div className="space-y-3">
                  <Label htmlFor="customDuration" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rink-blue-500" />
                    Custom Duration
                  </Label>
                <Input
                  id="customDuration"
                  placeholder="e.g., 45 days, 2 months, 1.5 years"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  required
                    className="hockey-search"
                />
                  <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 bg-hockey-silver-100 dark:bg-hockey-silver-800 p-2 rounded">
                    Examples: "45 days", "2 months", "1.5 years"
                  </p>
              </div>
            )}
          </div>

            <DialogFooter className="gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setBanDialogOpen(false)}
                className="hockey-button-enhanced"
              >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBanUser}
              disabled={banning || !banReason.trim() || !banDuration}
                className="hockey-button-enhanced bg-goal-red-500 hover:bg-goal-red-600 text-white"
            >
              {banning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                  <>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Ban User
                  </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
