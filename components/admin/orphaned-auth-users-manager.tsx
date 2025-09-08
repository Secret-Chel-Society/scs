"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Trash2, Plus, AlertTriangle, CheckCircle, Shield, Users, Database, Key, AlertCircle, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface OrphanedUser {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  user_metadata: any
  app_metadata: any
}

export function OrphanedAuthUsersManager() {
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([])
  const [stats, setStats] = useState({
    total_auth_users: 0,
    total_public_users: 0,
    orphaned_count: 0,
  })
  const [fixing, setFixing] = useState<string | null>(null)
  const { toast } = useToast()

  const findOrphanedUsers = async () => {
    if (!adminKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter admin key",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("Making request to find orphaned users...")

      const response = await fetch("/api/admin/find-orphaned-auth-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      })

      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to find orphaned users")
      }

      setOrphanedUsers(data.orphaned_users || [])
      setStats({
        total_auth_users: data.total_auth_users || 0,
        total_public_users: data.total_public_users || 0,
        orphaned_count: data.orphaned_users?.length || 0,
      })

      toast({
        title: "Search Complete",
        description: `Found ${data.orphaned_users?.length || 0} orphaned auth users`,
      })
    } catch (error: any) {
      console.error("Error in findOrphanedUsers:", error)
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      console.log("Testing API connection...")
      const response = await fetch("/api/admin/find-orphaned-auth-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: "test" }),
      })

      console.log("Test response status:", response.status)
      const data = await response.json()
      console.log("Test response data:", data)

      toast({
        title: "API Test",
        description: `API responded with status ${response.status}`,
      })
    } catch (error: any) {
      console.error("Test error:", error)
      toast({
        title: "API Test Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fixOrphanedUser = async (userId: string, action: string, actionName: string) => {
    if (!adminKey.trim()) return

    setFixing(userId)
    try {
      const response = await fetch("/api/admin/fix-orphaned-auth-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          adminKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${actionName}`)
      }

      toast({
        title: "Success",
        description: data.message,
      })

      // Refresh the list
      await findOrphanedUsers()
    } catch (error: any) {
      toast({
        title: `${actionName} Failed`,
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setFixing(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="hockey-enhanced-card">
            <CardHeader>
              <CardTitle className="text-3xl text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                Orphaned Auth Users Manager
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Find and fix users that exist in Supabase Auth but not in the public.users table. These are typically from
                the old auth system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="admin-key" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4 text-ice-blue-500" />
                  Admin Key
                </Label>
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="hockey-search"
                />
              </div>
              <Button onClick={findOrphanedUsers} disabled={loading} className="w-full hockey-button-enhanced bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white">
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Searching..." : "Find Orphaned Users"}
              </Button>
              <Button onClick={testConnection} variant="outline" className="w-full hockey-button-enhanced">
                <RefreshCw className="mr-2 h-4 w-4" />
                Test API Connection
              </Button>
            </CardContent>
          </Card>
        </motion.div>

      {stats.orphaned_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Alert className="hockey-enhanced-card border-goal-red-200 dark:border-goal-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">
              <strong className="text-hockey-silver-900 dark:text-hockey-silver-100">Found {stats.orphaned_count} orphaned users</strong> out of {stats.total_auth_users} total auth
              users. These users exist in Supabase Auth but not in the public.users table, which can cause "already
              registered" errors.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {orphanedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="hockey-enhanced-card">
            <CardHeader>
              <CardTitle className="text-2xl text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Orphaned Users ({orphanedUsers.length})
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Users that exist in Supabase Auth but not in the public.users table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="overflow-hidden rounded-xl border border-hockey-silver-200 dark:border-hockey-silver-700">
                <TableHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700">
                  <TableRow className="border-hockey-silver-200 dark:border-hockey-silver-600">
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Email</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Created</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Email Confirmed</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Last Sign In</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Metadata</TableHead>
                    <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {orphanedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-hockey-silver-200 dark:border-hockey-silver-600 hover:bg-hockey-silver-50 dark:hover:bg-hockey-silver-800/50 transition-colors"
                  >
                    <TableCell>
                      <div>
                        <div className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">{user.email}</div>
                        <div className="text-xs text-hockey-silver-500 dark:text-hockey-silver-400 font-mono">{user.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(user.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-hockey-silver-500 dark:text-hockey-silver-400">
                        {new Date(user.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.email_confirmed_at ? (
                        <Badge className="bg-assist-green-500 text-white">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Confirmed
                        </Badge>
                      ) : (
                        <Badge className="bg-goal-red-500 text-white">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Not Confirmed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at ? (
                        <div className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(user.last_sign_in_at).toLocaleDateString()}</div>
                      ) : (
                        <span className="text-hockey-silver-500 dark:text-hockey-silver-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.user_metadata?.gamer_tag_id && (
                          <Badge className="bg-ice-blue-100 dark:bg-ice-blue-900/30 text-ice-blue-700 dark:text-ice-blue-300 text-xs">
                            {user.user_metadata.gamer_tag_id}
                          </Badge>
                        )}
                        {user.user_metadata?.console && (
                          <Badge className="bg-rink-blue-100 dark:bg-rink-blue-900/30 text-rink-blue-700 dark:text-rink-blue-300 text-xs">
                            {user.user_metadata.console}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => fixOrphanedUser(user.id, "create_public_user", "Create Public User")}
                          disabled={fixing === user.id}
                          className="hockey-button-enhanced bg-assist-green-500 hover:bg-assist-green-600 text-white"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Fix
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => fixOrphanedUser(user.id, "delete_auth_user", "Delete Auth User")}
                          disabled={fixing === user.id}
                          className="hockey-button-enhanced bg-goal-red-500 hover:bg-goal-red-600 text-white"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {orphanedUsers.length === 0 && stats.total_auth_users > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="hockey-enhanced-card">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-assist-green-500" />
              <h3 className="text-lg font-semibold mb-2 text-hockey-silver-900 dark:text-hockey-silver-100">No Orphaned Users Found</h3>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                All {stats.total_auth_users} auth users have corresponding records in the public.users table.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </div>
    </div>
  )
}
