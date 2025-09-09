"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, RefreshCw, AlertTriangle, UserCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { IpMigrationRunner } from "./ip-migration-runner"

type IpLogEntry = {
  id: string
  user_id: string
  ip_address: string
  action: string
  created_at: string
  user_agent: string | null
  user_email?: string
  user_gamer_tag?: string
}

type UserWithIp = {
  id: string
  email: string
  gamer_tag_id: string
  registration_ip: string | null
  last_login_ip: string | null
  last_login_at: string | null
}

type IpWithUsers = {
  ip_address: string
  users: {
    id: string
    email: string
    gamer_tag_id: string
    last_login_at: string | null
  }[]
  count: number
}

export function IpTracking() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [ipLogs, setIpLogs] = useState<IpLogEntry[]>([])
  const [usersWithIp, setUsersWithIp] = useState<UserWithIp[]>([])
  const [ipAddresses, setIpAddresses] = useState<IpWithUsers[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("users")
  const [migrationStatus, setMigrationStatus] = useState<"checking" | "needed" | "complete">("checking")
  const [updatingIpData, setUpdatingIpData] = useState(false)

  useEffect(() => {
    checkMigration()
  }, [])

  useEffect(() => {
    if (migrationStatus === "complete") {
      fetchData()
    }
  }, [migrationStatus, activeTab])

  async function checkMigration() {
    try {
      setMigrationStatus("checking")

      // Direct database check instead of using exec_sql
      // Check if the ip_logs table exists
      const { data: ipLogsCheck, error: ipLogsError } = await supabase
        .from("ip_logs")
        .select("id")
        .limit(1)
        .maybeSingle()

      if (ipLogsError && !ipLogsError.message.includes('relation "ip_logs" does not exist')) {
        console.error("Error checking ip_logs table:", ipLogsError)
      }

      // Check if the registration_ip column exists in users table
      const { data: usersCheck, error: usersError } = await supabase
        .from("users")
        .select("registration_ip")
        .limit(1)
        .maybeSingle()

      if (usersError && !usersError.message.includes('column "registration_ip" does not exist')) {
        console.error("Error checking users table:", usersError)
      }

      // If either check failed with a "does not exist" error, migration is needed
      const ipLogsExists = !ipLogsError || !ipLogsError.message.includes('relation "ip_logs" does not exist')
      const registrationIpExists =
        !usersError || !usersError.message.includes('column "registration_ip" does not exist')

      if (ipLogsExists && registrationIpExists) {
        console.log("Migration complete - tables and columns exist")
        setMigrationStatus("complete")
      } else {
        console.log("Migration needed - tables or columns missing", {
          ipLogsExists,
          registrationIpExists,
          ipLogsError,
          usersError,
        })
        setMigrationStatus("needed")
      }
    } catch (error) {
      console.error("Error checking migration status:", error)
      setMigrationStatus("needed")
    } finally {
      setLoading(false)
    }
  }

  async function fetchData() {
    setLoading(true)
    try {
      if (activeTab === "users") {
        await fetchUsersWithIp()
      } else if (activeTab === "ips") {
        await fetchIpAddresses()
      } else if (activeTab === "logs") {
        await fetchIpLogs()
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
      console.log("Fetching users with IP data...")
      const { data, error } = await supabase
        .from("users")
        .select("id, email, gamer_tag_id, registration_ip, last_login_ip, last_login_at")
        .order("last_login_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching users with IP:", error)
        throw error
      }

      console.log(`Fetched ${data?.length || 0} users with IP data`)
      console.log("Sample user data:", data?.slice(0, 3))
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

  async function fetchIpLogs() {
    try {
      console.log("Fetching IP logs...")
      // First check if the ip_logs table exists
      const { data: checkData, error: checkError } = await supabase.from("ip_logs").select("id").limit(1)

      if (checkError) {
        if (checkError.message.includes('relation "ip_logs" does not exist')) {
          console.log("ip_logs table doesn't exist yet")
          setIpLogs([])
          return
        }
        throw checkError
      }

      // If we get here, the table exists, so fetch the data
      const { data, error } = await supabase
        .from("ip_logs")
        .select(`
        *,
        users (
          email,
          gamer_tag_id
        )
      `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching IP logs:", error)
        throw error
      }

      // Transform the data to flatten the structure
      const transformedData =
        data?.map((log) => ({
          ...log,
          user_email: log.users?.email,
          user_gamer_tag: log.users?.gamer_tag_id,
        })) || []

      console.log(`Fetched ${transformedData.length} IP logs`)
      setIpLogs(transformedData)
    } catch (error) {
      console.error("Error in fetchIpLogs:", error)
      toast({
        title: "Error",
        description: "Failed to load IP logs",
        variant: "destructive",
      })
    }
  }

  async function fetchIpAddresses() {
    try {
      console.log("Fetching IP addresses...")
      // First check if the ip_logs table exists
      const { data: checkData, error: checkError } = await supabase.from("ip_logs").select("id").limit(1)

      if (checkError) {
        if (checkError.message.includes('relation "ip_logs" does not exist')) {
          console.log("ip_logs table doesn't exist yet")
          setIpAddresses([])
          return
        }
        throw checkError
      }

      // If we get here, the table exists, so fetch the data
      const { data: ipData, error: ipError } = await supabase
        .from("ip_logs")
        .select(`
        ip_address,
        user_id
      `)
        .order("created_at", { ascending: false })

      if (ipError) {
        console.error("Error fetching IP addresses:", ipError)
        throw ipError
      }

      // Get user details for all user IDs
      const userIds = [...new Set(ipData?.map((entry) => entry.user_id) || [])]

      if (userIds.length === 0) {
        console.log("No IP logs found")
        setIpAddresses([])
        return
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, gamer_tag_id, last_login_at")
        .in("id", userIds)

      if (userError) {
        console.error("Error fetching user details:", userError)
        throw userError
      }

      // Process the data to group by IP address
      const ipMap = new Map<string, Set<string>>()

      ipData?.forEach((entry) => {
        const ip = entry.ip_address
        const userId = entry.user_id

        // Group users by IP
        if (!ipMap.has(ip)) {
          ipMap.set(ip, new Set())
        }
        ipMap.get(ip)?.add(userId)
      })

      // Create a map of user details for quick lookup
      const userMap = new Map()
      userData?.forEach((user) => {
        userMap.set(user.id, user)
      })

      // Convert to the final format
      const result: IpWithUsers[] = []

      ipMap.forEach((userIds, ip) => {
        const users = Array.from(userIds).map((id) => {
          const user = userMap.get(id)
          return {
            id,
            email: user?.email || "Unknown",
            gamer_tag_id: user?.gamer_tag_id || "Unknown",
            last_login_at: user?.last_login_at || null,
          }
        })

        result.push({
          ip_address: ip,
          users,
          count: users.length,
        })
      })

      // Sort by number of users (shared IPs first)
      result.sort((a, b) => b.count - a.count)

      console.log(`Processed ${result.length} unique IP addresses`)
      setIpAddresses(result)
    } catch (error) {
      console.error("Error in fetchIpAddresses:", error)
      toast({
        title: "Error",
        description: "Failed to load IP address data",
        variant: "destructive",
      })
    }
  }

  async function populateTestData() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/populate-test-ip-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to populate test data")
      }

      toast({
        title: "Test Data Created",
        description: data.message,
      })

      // Refresh the data
      fetchData()
    } catch (error: any) {
      console.error("Error populating test data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to populate test data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateExistingUsersIpData() {
    try {
      setUpdatingIpData(true)
      const response = await fetch("/api/admin/update-ip-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update IP data")
      }

      toast({
        title: "IP Data Updated",
        description: data.message,
      })

      // Refresh the data
      fetchData()
    } catch (error: any) {
      console.error("Error updating IP data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update IP data",
        variant: "destructive",
      })
    } finally {
      setUpdatingIpData(false)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  function filterData(data: any[], term: string) {
    if (!term) return data

    const lowerTerm = term.toLowerCase()

    if (activeTab === "users") {
      return data.filter(
        (user) =>
          user.email.toLowerCase().includes(lowerTerm) ||
          user.gamer_tag_id.toLowerCase().includes(lowerTerm) ||
          (user.registration_ip && user.registration_ip.includes(term)) ||
          (user.last_login_ip && user.last_login_ip.includes(term)),
      )
    } else if (activeTab === "ips") {
      return data.filter(
        (ip) =>
          ip.ip_address.includes(term) ||
          ip.users.some(
            (user) =>
              user.email.toLowerCase().includes(lowerTerm) || user.gamer_tag_id.toLowerCase().includes(lowerTerm),
          ),
      )
    } else if (activeTab === "logs") {
      return data.filter(
        (log) =>
          log.ip_address.includes(term) ||
          log.action.toLowerCase().includes(lowerTerm) ||
          (log.user_email && log.user_email.toLowerCase().includes(lowerTerm)) ||
          (log.user_gamer_tag && log.user_gamer_tag.toLowerCase().includes(lowerTerm)) ||
          (log.user_agent && log.user_agent.toLowerCase().includes(lowerTerm)),
      )
    }

    return data
  }

  if (migrationStatus === "needed") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Database Migration Required
            </CardTitle>
            <CardDescription>The IP tracking feature requires database changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The IP tracking feature requires database changes. Please run the migration below.
              </p>
              <div className="flex gap-2">
                <Button onClick={checkMigration} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>
                <Button onClick={() => setMigrationStatus("complete")} variant="secondary" className="gap-2">
                  Force Show IP Tracking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <IpMigrationRunner onSuccess={checkMigration} />
      </div>
    )
  }

  if (migrationStatus === "checking") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>IP Tracking</CardTitle>
          <CardDescription>Checking database setup...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
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
            <Button variant="secondary" onClick={populateTestData} disabled={loading}>
              Populate Test Data
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch("/api/auth/track-login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                  })
                  if (response.ok) {
                    toast({ title: "Success", description: "IP logged for current user" })
                    fetchData()
                  } else {
                    toast({ title: "Error", description: "Failed to log IP", variant: "destructive" })
                  }
                } catch (error) {
                  toast({ title: "Error", description: "Failed to log IP", variant: "destructive" })
                }
              }}
              disabled={loading}
            >
              Log My IP Now
            </Button>
            <Button 
              variant="secondary" 
              onClick={async () => {
                try {
                  const response = await fetch("/api/admin/diagnose-issues")
                  const data = await response.json()
                  console.log("🔍 Diagnostic Results:", data)
                  
                  if (data.success) {
                    const failedTests = Object.entries(data.results.tests)
                      .filter(([_, test]: [string, any]) => !test.success)
                      .map(([name, test]: [string, any]) => `${name}: ${test.error}`)
                    
                    if (failedTests.length === 0) {
                      toast({ title: "All Systems OK", description: "All diagnostic tests passed!" })
                    } else {
                      toast({ 
                        title: "Issues Found", 
                        description: `Failed tests: ${failedTests.join(", ")}`,
                        variant: "destructive"
                      })
                    }
                  } else {
                    toast({ title: "Diagnostic Failed", description: data.error, variant: "destructive" })
                  }
                } catch (error) {
                  toast({ title: "Diagnostic Error", description: "Failed to run diagnostics", variant: "destructive" })
                }
              }}
              disabled={loading}
            >
              Run Diagnostics
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch("/api/waivers", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" }
                  })
                  const data = await response.json()
                  console.log("🔍 Waivers Test:", data)
                  
                  if (response.ok) {
                    toast({ title: "Waivers API OK", description: `Found ${data.waivers?.length || 0} waivers` })
                  } else {
                    toast({ title: "Waivers API Error", description: data.error || "Failed to fetch waivers", variant: "destructive" })
                  }
                } catch (error) {
                  toast({ title: "Waivers Test Error", description: "Failed to test waivers API", variant: "destructive" })
                }
              }}
              disabled={loading}
            >
              Test Waivers
            </Button>
          </div>

          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="ips">IP Addresses</TabsTrigger>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            </TabsList>

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
                        <TableHead>Last Login Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(usersWithIp, searchTerm).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(usersWithIp, searchTerm).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="font-medium">{user.email}</div>
                              <div className="text-sm text-muted-foreground">{user.gamer_tag_id}</div>
                            </TableCell>
                            <TableCell>{user.registration_ip || "Unknown"}</TableCell>
                            <TableCell>{user.last_login_ip || "Unknown"}</TableCell>
                            <TableCell>{formatDate(user.last_login_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ips" className="mt-4">
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
                        <TableHead>IP Address</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(ipAddresses, searchTerm).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            No IP addresses found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(ipAddresses, searchTerm).map((ip) => (
                          <TableRow key={ip.ip_address}>
                            <TableCell>
                              <div className="font-medium">{ip.ip_address}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {ip.users.map((user) => (
                                  <Badge key={user.id} variant="outline" className="max-w-[200px] truncate">
                                    {user.gamer_tag_id || user.email}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={ip.count > 1 ? "destructive" : "secondary"}>
                                {ip.count} {ip.count === 1 ? "user" : "users"}
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

            <TabsContent value="logs" className="mt-4">
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
                      {filterData(ipLogs, searchTerm).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(ipLogs, searchTerm).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{formatDate(log.created_at)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{log.user_email}</div>
                              <div className="text-sm text-muted-foreground">{log.user_gamer_tag}</div>
                            </TableCell>
                            <TableCell>{log.ip_address}</TableCell>
                            <TableCell>
                              <Badge variant={log.action === "register" ? "outline" : "secondary"}>{log.action}</Badge>
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
      <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between items-center">
          <div className="text-sm text-muted-foreground">
            IP tracking helps identify potential account sharing and suspicious activity.
          </div>
          <Button variant="outline" className="gap-2" onClick={updateExistingUsersIpData} disabled={updatingIpData}>
            <UserCheck className="h-4 w-4" />
            {updatingIpData ? "Updating..." : "Update Existing Users"}
          </Button>
        </div>

        <div className="w-full">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">IP Detection Troubleshooting</summary>
            <div className="mt-2 p-4 border rounded-md">
              <p className="mb-2">If IP addresses are not showing correctly, use this tool to debug:</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    console.log("Starting IP debug...")

                    const response = await fetch("/api/debug-ip")
                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                    }

                    const data = await response.json()
                    console.log("IP Debug Data:", data)

                    // Also get client IP
                    const clientResponse = await fetch("/api/get-client-ip")
                    if (!clientResponse.ok) {
                      throw new Error(`Client IP HTTP ${clientResponse.status}: ${clientResponse.statusText}`)
                    }

                    const clientData = await clientResponse.json()
                    console.log("Client IP Data:", clientData)

                    // Show alert instead of toast for debugging
                    alert(`IP Debug Results:
    
Detected IP: ${data.detectedIp || clientData.ip || "Unknown"}
Detection Method: ${clientData.detectionMethod || "Unknown"}
Timestamp: ${data.timestamp || "Unknown"}

Check browser console for full details.`)

                    toast({
                      title: "IP Debug Complete",
                      description: `Detected IP: ${data.detectedIp || clientData.ip || "Unknown"}. Check console for details.`,
                    })
                  } catch (error) {
                    console.error("Error debugging IP:", error)
                    alert(`Error debugging IP: ${error.message}`)
                    toast({
                      title: "Error",
                      description: "Failed to debug IP detection. Check console for details.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Debug IP Detection
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    console.log("Getting current IP...")

                    const response = await fetch("/api/get-client-ip")
                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                    }

                    const data = await response.json()
                    console.log("Current Client IP:", data)

                    // Show alert for immediate feedback
                    alert(`Your Current IP Information:
    
IP Address: ${data.ip || "Unknown"}
Detection Method: ${data.detectionMethod || "Unknown"}
User Agent: ${data.userAgent ? data.userAgent.substring(0, 50) + "..." : "Unknown"}
Timestamp: ${data.timestamp || "Unknown"}`)

                    toast({
                      title: "Current IP Retrieved",
                      description: `Your IP: ${data.ip || "Unknown"}`,
                    })
                  } catch (error) {
                    console.error("Error getting client IP:", error)
                    alert(`Error getting IP: ${error.message}`)
                    toast({
                      title: "Error",
                      description: "Failed to get client IP. Check console for details.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Get My Current IP
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    console.log("Testing API endpoints...")

                    const response = await fetch("/api/test-ip-debug")
                    const data = await response.json()

                    console.log("Test API Response:", data)

                    if (data.success) {
                      alert(`API Test Successful!
        
Message: ${data.message}
Server Time: ${data.serverTime}
Timestamp: ${data.timestamp}`)
                    } else {
                      alert(`API Test Failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error("API test error:", error)
                    alert(`API Test Error: ${error.message}`)
                  }
                }}
              >
                Test API Connection
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                This will log detailed IP information to the browser console.
              </p>
            </div>
          </details>
        </div>
      </CardFooter>
    </Card>
  )
}
