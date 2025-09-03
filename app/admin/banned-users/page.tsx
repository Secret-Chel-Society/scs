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
  is_banned: boolean
  ban_reason?: string
  ban_expiration?: string | null
}

interface User {
  id: string
  email: string
  gamer_tag?: string
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
  
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [banReason, setBanReason] = useState<string>("")
  const [banDuration, setBanDuration] = useState<string>("permanent")
  const [customDuration, setCustomDuration] = useState<string>("")
  const [banning, setBanning] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unbanningUserId, setUnbanningUserId] = useState<string | null>(null)
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [userToUnban, setUserToUnban] = useState<BannedUser | null>(null)

  useEffect(() => {
    checkAdminStatus()
  }, [session])

  const checkAdminStatus = async () => {
    if (!session?.user?.id || !supabase) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)

      const isAdminUser = roles?.some(r => r.role === "Admin") || false
      setIsAdmin(isAdminUser)

      if (isAdminUser) {
        fetchBannedUsers()
        fetchUsers(currentPage)
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_banned", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBannedUsers(data || [])
    } catch (error: any) {
      console.error("Error fetching banned users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch banned users",
        variant: "destructive",
      })
    }
  }

  const fetchUsers = async (page: number = 1) => {
    try {
      const limit = 20
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("is_banned", false)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
      setTotalPages(Math.ceil((count || 0) / limit))
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason || banning) return

    try {
      setBanning(true)

      let banExpirationDate = null
      if (banDuration !== "permanent") {
        const now = new Date()
        if (banDuration === "custom" && customDuration) {
          const daysToAdd = parseInt(customDuration)
          if (!isNaN(daysToAdd) && daysToAdd > 0) {
            banExpirationDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString()
          }
        } else {
          const days = parseInt(banDuration)
          if (!isNaN(days)) {
            banExpirationDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }

      const { error } = await supabase
        .from("users")
        .update({
          is_banned: true,
          ban_reason: banReason,
          ban_expiration: banExpirationDate,
        })
        .eq("id", selectedUser)

      if (error) throw error

      toast({
        title: "User banned",
        description: "User has been banned successfully",
      })

      setSelectedUser("")
      setBanReason("")
      setBanDuration("")
      setCustomDuration("")

      fetchBannedUsers()
      fetchUsers(currentPage)
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

  const filteredBannedUsers = bannedUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.gamer_tag_id && user.gamer_tag_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.discord_name && user.discord_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.gamer_tag_id && user.gamer_tag_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.discord_name && user.discord_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background pt-4">
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
    <div className="min-h-screen relative overflow-hidden bg-background pt-4">
      {/* Professional Hockey Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/8" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl">
                <UserX className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Banned Users Management
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Manage user bans, view banned users, and control access to the Secret Chel Society
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-red-500 to-transparent rounded-full mx-auto mt-6" />
          </div>

          {/* Enhanced Tabs */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-2 bg-background/80 backdrop-blur-sm rounded-xl border border-primary/20 mb-8">
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2 py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Users className="h-5 w-5" />
                Banned Users List ({filteredBannedUsers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="ban" 
                className="flex items-center gap-2 py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Ban className="h-5 w-5" />
                Ban User ({filteredUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-8">
              <div>
                <Card className="bg-background/90 backdrop-blur-sm border-primary/20">
                  <CardHeader className="border-b border-primary/20 pb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <UserX className="h-6 w-6 text-red-500" />
                          </div>
                          Banned Users ({filteredBannedUsers.length})
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Manage and review banned user accounts
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={fetchBannedUsers}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>

                    <div className="mt-6">
                      <Label htmlFor="search">Search Users</Label>
                      <Input
                        id="search"
                        placeholder="Search by email, gamer tag, or discord name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {filteredBannedUsers.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User Info</TableHead>
                              <TableHead>Ban Details</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBannedUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{user.email}</div>
                                    {user.gamer_tag_id && (
                                      <div className="text-sm text-muted-foreground">
                                        Gamer Tag: {user.gamer_tag_id}
                                      </div>
                                    )}
                                    {user.discord_name && (
                                      <div className="text-sm text-muted-foreground">
                                        Discord: {user.discord_name}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {user.ban_reason && (
                                      <div className="text-sm mb-1">
                                        <span className="font-medium">Reason:</span> {user.ban_reason}
                                      </div>
                                    )}
                                    {user.ban_expiration && (
                                      <div className="text-sm text-muted-foreground">
                                        <span className="font-medium">Expires:</span> {formatDate(user.ban_expiration)}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      user.ban_expiration && isExpired(user.ban_expiration) 
                                        ? "secondary" 
                                        : "destructive"
                                    }
                                  >
                                    {user.ban_expiration && isExpired(user.ban_expiration) 
                                      ? "Expired" 
                                      : user.ban_expiration 
                                        ? "Temporary" 
                                        : "Permanent"
                                    }
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setUserToUnban(user)
                                      setUnbanDialogOpen(true)
                                    }}
                                    disabled={unbanningUserId === user.id}
                                  >
                                    {unbanningUserId === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
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
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No banned users found matching your search criteria.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ban">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    Ban User
                  </CardTitle>
                  <CardDescription>
                    Select a user and provide ban details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-select">Select User</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user to ban..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col">
                              <span>{user.email}</span>
                              {user.gamer_tag_id && (
                                <span className="text-sm text-muted-foreground">
                                  {user.gamer_tag_id}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ban-reason">Ban Reason</Label>
                    <Textarea
                      id="ban-reason"
                      placeholder="Enter the reason for banning this user..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ban-duration">Ban Duration</Label>
                    <Select value={banDuration} onValueChange={setBanDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ban duration..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {banDuration === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-duration">Custom Duration (days)</Label>
                      <Input
                        id="custom-duration"
                        type="number"
                        placeholder="Enter number of days..."
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        min="1"
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleBanUser}
                    disabled={!selectedUser || !banReason || banning}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    {banning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Banning User...
                      </>
                    ) : (
                      "Ban User"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Unban Confirmation Dialog */}
          <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Unban</DialogTitle>
                <DialogDescription>
                  Are you sure you want to unban {userToUnban?.email}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUnbanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Add unban logic here
                    setUnbanDialogOpen(false)
                    setUserToUnban(null)
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  Unban User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}