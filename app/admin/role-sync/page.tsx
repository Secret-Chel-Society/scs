"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Search, User, Shield } from "lucide-react"
import { motion } from "framer-motion"

interface RoleSyncStatus {
  userId: string
  userRoles: string[]
  playerRole: string | null
  expectedPlayerRole: string
  isInSync: boolean
  needsPlayerRecord: boolean
  playerId: string | null
  teamId: string | null
}

interface BulkSyncResult {
  processed: number
  fixed: number
  errors: number
  details: Array<{
    userId: string
    gamerTag: string
    email: string
    userRoles: string[]
    action: string
    reason?: string
    error?: string
    currentPlayerRole?: string
    expectedPlayerRole?: string
    oldPlayerRole?: string
    newPlayerRole?: string
  }>
}

export default function RoleSyncPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState("")
  const [roleSyncStatus, setRoleSyncStatus] = useState<RoleSyncStatus | null>(null)
  const [bulkResults, setBulkResults] = useState<BulkSyncResult | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredResults, setFilteredResults] = useState<any[]>([])

  // Check admin authorization
  useEffect(() => {
    const checkAuth = async () => {
      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "Admin")
        .single()

      if (!adminRole) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setIsAdmin(true)
    }

    checkAuth()
  }, [session, supabase, router, toast])

  // Filter results based on search query
  useEffect(() => {
    if (bulkResults?.details) {
      const filtered = bulkResults.details.filter(detail =>
        detail.gamerTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        detail.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        detail.userId.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredResults(filtered)
    }
  }, [bulkResults, searchQuery])

  const checkRoleSync = async () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/fix-role-sync?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check role sync")
      }

      setRoleSyncStatus(data)
    } catch (error) {
      console.error("Error checking role sync:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check role sync",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fixRoleSync = async () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/fix-role-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, forceSync: true }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix role sync")
      }

      toast({
        title: "Success",
        description: "Role synchronization fixed successfully",
      })

      // Refresh the status
      await checkRoleSync()
    } catch (error) {
      console.error("Error fixing role sync:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix role sync",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const runBulkSync = async (dryRun = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/bulk-fix-role-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, limit: 100 }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run bulk sync")
      }

      setBulkResults(data.results)
      toast({
        title: dryRun ? "Dry Run Completed" : "Bulk Sync Completed",
        description: `Processed ${data.results.processed} users, fixed ${data.results.fixed}, errors: ${data.results.errors}`,
      })
    } catch (error) {
      console.error("Error running bulk sync:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run bulk sync",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "updated":
      case "created":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "skipped":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "would_fix":
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "updated":
      case "created":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "skipped":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "would_fix":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Role Synchronization</h1>
          <p className="text-muted-foreground">
            Fix role synchronization issues between user_roles and players tables
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Single User Fix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Single User Fix
              </CardTitle>
              <CardDescription>
                Check and fix role synchronization for a specific user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={checkRoleSync}
                  disabled={loading || !userId.trim()}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
                <Button
                  onClick={fixRoleSync}
                  disabled={loading || !userId.trim()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fix Sync
                </Button>
              </div>

              {roleSyncStatus && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Sync Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>User Roles:</span>
                      <span>{roleSyncStatus.userRoles.join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Player Role:</span>
                      <span>{roleSyncStatus.playerRole || "None"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Player Role:</span>
                      <span>{roleSyncStatus.expectedPlayerRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Sync:</span>
                      <Badge variant={roleSyncStatus.isInSync ? "default" : "destructive"}>
                        {roleSyncStatus.isInSync ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {roleSyncStatus.needsPlayerRecord && (
                      <div className="flex justify-between">
                        <span>Needs Player Record:</span>
                        <Badge variant="destructive">Yes</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Fix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bulk Fix
              </CardTitle>
              <CardDescription>
                Fix role synchronization for all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => runBulkSync(true)}
                  disabled={loading}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Dry Run
                </Button>
                <Button
                  onClick={() => runBulkSync(false)}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Fix
                </Button>
              </div>

              {bulkResults && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Bulk Sync Results</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{bulkResults.processed}</div>
                      <div className="text-muted-foreground">Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{bulkResults.fixed}</div>
                      <div className="text-muted-foreground">Fixed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{bulkResults.errors}</div>
                      <div className="text-muted-foreground">Errors</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        {bulkResults && bulkResults.details.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sync Results</CardTitle>
              <CardDescription>
                Detailed results from the bulk sync operation
              </CardDescription>
              <div className="mt-4">
                <Input
                  placeholder="Search by gamer tag, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredResults.map((detail, index) => (
                  <div
                    key={`${detail.userId}-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getActionIcon(detail.action)}
                      <div>
                        <div className="font-medium">{detail.gamerTag}</div>
                        <div className="text-sm text-muted-foreground">{detail.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Roles: {detail.userRoles.join(", ")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getActionColor(detail.action)}>
                        {detail.action.replace("_", " ").toUpperCase()}
                      </Badge>
                      {detail.reason && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {detail.reason}
                        </div>
                      )}
                      {detail.error && (
                        <div className="text-xs text-red-500 mt-1">
                          {detail.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
