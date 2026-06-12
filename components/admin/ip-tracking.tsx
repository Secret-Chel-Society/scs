"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, RefreshCw, AlertTriangle, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type UserWithIp = {
  id: string
  email: string
  gamer_tag_id: string
  registration_ip: string | null
  last_login_ip: string | null
  last_login_at: string | null
  created_at: string | null
}

type SharedIpGroup = {
  ip_address: string
  users: {
    id: string
    email: string
    gamer_tag_id: string
    ip_type: "registration" | "login" | "both"
    last_login_at: string | null
  }[]
  count: number
}

type ActivityLog = {
  id: string
  user_id: string
  gamer_tag_id: string
  email: string
  ip_address: string
  action: string
  timestamp: string
}

export function IpTracking() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [usersWithIp, setUsersWithIp] = useState<UserWithIp[]>([])
  const [sharedIps, setSharedIps] = useState<SharedIpGroup[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("users")

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      if (activeTab === "users") {
        await fetchUsersWithIp()
      } else if (activeTab === "shared") {
        await fetchSharedIps()
      } else if (activeTab === "activity") {
        await fetchActivityLogs()
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load IP tracking data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsersWithIp() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, gamer_tag_id, registration_ip, last_login_ip, last_login_at, created_at")
        .or("registration_ip.not.is.null,last_login_ip.not.is.null")
        .order("last_login_at", { ascending: false, nullsFirst: false })
        .limit(200)

      if (error) {
        console.error("Error fetching users with IP:", error)
        throw error
      }

      setUsersWithIp(data || [])
    } catch (error) {
      console.error("Error in fetchUsersWithIp:", error)
      toast({
        title: "Error",
        description: "Failed to load user IP data",
        variant: "destructive",
      })
    }
  }

  async function fetchSharedIps() {
    try {
      // Fetch all users with IP addresses
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, gamer_tag_id, registration_ip, last_login_ip, last_login_at")
        .or("registration_ip.not.is.null,last_login_ip.not.is.null")

      if (error) {
        console.error("Error fetching users for shared IPs:", error)
        throw error
      }

      // Build a map of IP -> users
      const ipMap = new Map<string, Map<string, { user: typeof users[0], types: Set<string> }>>()

      users?.forEach((user) => {
        // Check registration IP
        if (user.registration_ip) {
          if (!ipMap.has(user.registration_ip)) {
            ipMap.set(user.registration_ip, new Map())
          }
          const userMap = ipMap.get(user.registration_ip)!
          if (!userMap.has(user.id)) {
            userMap.set(user.id, { user, types: new Set() })
          }
          userMap.get(user.id)!.types.add("registration")
        }

        // Check last login IP
        if (user.last_login_ip) {
          if (!ipMap.has(user.last_login_ip)) {
            ipMap.set(user.last_login_ip, new Map())
          }
          const userMap = ipMap.get(user.last_login_ip)!
          if (!userMap.has(user.id)) {
            userMap.set(user.id, { user, types: new Set() })
          }
          userMap.get(user.id)!.types.add("login")
        }
      })

      // Filter to only IPs with multiple users
      const sharedIpGroups: SharedIpGroup[] = []

      ipMap.forEach((userMap, ip) => {
        if (userMap.size > 1) {
          const usersArray = Array.from(userMap.values()).map(({ user, types }) => {
            let ip_type: "registration" | "login" | "both" = "login"
            if (types.has("registration") && types.has("login")) {
              ip_type = "both"
            } else if (types.has("registration")) {
              ip_type = "registration"
            }

            return {
              id: user.id,
              email: user.email || "",
              gamer_tag_id: user.gamer_tag_id || "",
              ip_type,
              last_login_at: user.last_login_at,
            }
          })

          sharedIpGroups.push({
            ip_address: ip,
            users: usersArray,
            count: usersArray.length,
          })
        }
      })

      // Sort by count (most shared first)
      sharedIpGroups.sort((a, b) => b.count - a.count)

      setSharedIps(sharedIpGroups)
    } catch (error) {
      console.error("Error in fetchSharedIps:", error)
      toast({
        title: "Error",
        description: "Failed to load shared IP data",
        variant: "destructive",
      })
    }
  }

  async function fetchActivityLogs() {
    try {
      // Get recent login activity from users table
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, gamer_tag_id, registration_ip, last_login_ip, last_login_at, created_at")
        .or("registration_ip.not.is.null,last_login_ip.not.is.null")
        .order("last_login_at", { ascending: false, nullsFirst: false })
        .limit(100)

      if (error) {
        console.error("Error fetching activity logs:", error)
        throw error
      }

      // Create activity log entries from user data
      const logs: ActivityLog[] = []

      users?.forEach((user) => {
        // Add login activity
        if (user.last_login_ip && user.last_login_at) {
          logs.push({
            id: `${user.id}-login`,
            user_id: user.id,
            gamer_tag_id: user.gamer_tag_id || "Unknown",
            email: user.email || "Unknown",
            ip_address: user.last_login_ip,
            action: "Login",
            timestamp: user.last_login_at,
          })
        }

        // Add registration activity
        if (user.registration_ip && user.created_at) {
          logs.push({
            id: `${user.id}-registration`,
            user_id: user.id,
            gamer_tag_id: user.gamer_tag_id || "Unknown",
            email: user.email || "Unknown",
            ip_address: user.registration_ip,
            action: "Registration",
            timestamp: user.created_at,
          })
        }
      })

      // Sort by timestamp (most recent first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivityLogs(logs.slice(0, 200))
    } catch (error) {
      console.error("Error in fetchActivityLogs:", error)
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      })
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  function filterUsers(data: UserWithIp[], term: string) {
    if (!term) return data
    const lowerTerm = term.toLowerCase()
    return data.filter(
      (user) =>
        (user.email && user.email.toLowerCase().includes(lowerTerm)) ||
        (user.gamer_tag_id && user.gamer_tag_id.toLowerCase().includes(lowerTerm)) ||
        (user.registration_ip && user.registration_ip.includes(term)) ||
        (user.last_login_ip && user.last_login_ip.includes(term))
    )
  }

  function filterSharedIps(data: SharedIpGroup[], term: string) {
    if (!term) return data
    const lowerTerm = term.toLowerCase()
    return data.filter(
      (group) =>
        group.ip_address.includes(term) ||
        group.users.some(
          (user) =>
            user.email.toLowerCase().includes(lowerTerm) ||
            user.gamer_tag_id.toLowerCase().includes(lowerTerm)
        )
    )
  }

  function filterActivityLogs(data: ActivityLog[], term: string) {
    if (!term) return data
    const lowerTerm = term.toLowerCase()
    return data.filter(
      (log) =>
        log.ip_address.includes(term) ||
        log.gamer_tag_id.toLowerCase().includes(lowerTerm) ||
        log.email.toLowerCase().includes(lowerTerm) ||
        log.action.toLowerCase().includes(lowerTerm)
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>IP Tracking</CardTitle>
        <CardDescription>Track and monitor IP addresses used by players</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by IP, email, or gamer tag..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="shared" className="relative">
                Shared IPs
                {sharedIps.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                    {sharedIps.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Registration IP</TableHead>
                        <TableHead>Last Login IP</TableHead>
                        <TableHead>Last Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterUsers(usersWithIp, searchTerm).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No users with IP data found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterUsers(usersWithIp, searchTerm).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="font-medium">{user.gamer_tag_id || "No Gamertag"}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                                {user.registration_ip || "Unknown"}
                              </code>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                                {user.last_login_ip || "Unknown"}
                              </code>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(user.last_login_at)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Shared IPs Tab */}
            <TabsContent value="shared" className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filterSharedIps(sharedIps, searchTerm).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No shared IP addresses detected</p>
                  <p className="text-sm mt-1">Users with the same IP address will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filterSharedIps(sharedIps, searchTerm).map((group) => (
                    <Card key={group.ip_address} className="border-destructive/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <code className="text-sm font-medium bg-muted px-2 py-1 rounded">
                              {group.ip_address}
                            </code>
                          </div>
                          <Badge variant="destructive">
                            {group.count} users share this IP
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>IP Type</TableHead>
                                <TableHead>Last Login</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.users.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell>
                                    <div className="font-medium">{user.gamer_tag_id || "No Gamertag"}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        user.ip_type === "both"
                                          ? "destructive"
                                          : user.ip_type === "registration"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {user.ip_type === "both"
                                        ? "Registration & Login"
                                        : user.ip_type === "registration"
                                        ? "Registration"
                                        : "Login"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(user.last_login_at)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Logs Tab */}
            <TabsContent value="activity" className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterActivityLogs(activityLogs, searchTerm).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterActivityLogs(activityLogs, searchTerm).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{log.gamer_tag_id}</div>
                              <div className="text-sm text-muted-foreground">{log.email}</div>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                                {log.ip_address}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={log.action === "Registration" ? "default" : "secondary"}
                              >
                                {log.action}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
