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
import { 
  Search, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Key,
  Database,
  Shield,
  Users,
  Wrench,
  Clock,
  Mail,
  Settings,
  RefreshCw,
  Eye,
  XCircle
} from "lucide-react"

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
    <div className="space-y-6">
      <Card className="hockey-card hockey-card-hover border-2 border-orange-200/50 dark:border-orange-700/50 shadow-lg shadow-orange-500/10">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-goal-red-100 dark:from-orange-900/30 dark:to-goal-red-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-goal-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                Orphaned Auth Users Manager
              </CardTitle>
              <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                Find and fix users that exist in Supabase Auth but not in the public.users table. These are typically from the old auth system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Key className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                Admin Key
              </Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="hockey-search h-12 text-base border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={findOrphanedUsers} 
                disabled={loading} 
                className="h-12 text-lg hockey-button bg-gradient-to-r from-orange-500 to-goal-red-600 hover:from-orange-600 hover:to-goal-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Searching..." : "Find Orphaned Users"}
              </Button>
              <Button 
                onClick={testConnection} 
                variant="outline" 
                className="h-12 text-lg hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Test API Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.orphaned_count > 0 && (
        <Alert className="border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Found {stats.orphaned_count} orphaned users</strong> out of {stats.total_auth_users} total auth
            users. These users exist in Supabase Auth but not in the public.users table, which can cause "already
            registered" errors.
          </AlertDescription>
        </Alert>
      )}

      {orphanedUsers.length > 0 && (
        <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Orphaned Users ({orphanedUsers.length})
                </CardTitle>
                <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                  Users that exist in Supabase Auth but not in the public.users table
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                    <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200 py-4">Email</TableHead>
                    <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200 py-4">Created</TableHead>
                    <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200 py-4">Email Confirmed</TableHead>
                    <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200 py-4">Last Sign In</TableHead>
                    <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200 py-4">Metadata</TableHead>
                    <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200 py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orphanedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-200 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30">
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Settings className="h-3 w-3 text-hockey-silver-600 dark:text-hockey-silver-400" />
                            <span className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">{user.id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            <span className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 ml-6">
                            {new Date(user.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {user.email_confirmed_at ? (
                          <Badge className="px-3 py-1 text-sm font-medium bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-md">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge className="px-3 py-1 text-sm font-medium bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md">
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Confirmed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {user.last_sign_in_at ? (
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            <span className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                            <span className="text-hockey-silver-600 dark:text-hockey-silver-400">Never</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          {user.user_metadata?.gamer_tag_id && (
                            <Badge className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white shadow-md">
                              {user.user_metadata.gamer_tag_id}
                            </Badge>
                          )}
                          {user.user_metadata?.console && (
                            <Badge className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white shadow-md">
                              {user.user_metadata.console}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => fixOrphanedUser(user.id, "create_public_user", "Create Public User")}
                            disabled={fixing === user.id}
                            className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Fix
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => fixOrphanedUser(user.id, "delete_auth_user", "Delete Auth User")}
                            disabled={fixing === user.id}
                            className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {orphanedUsers.length === 0 && stats.total_auth_users > 0 && (
        <Card className="hockey-card hockey-card-hover border-2 border-assist-green-200/50 dark:border-assist-green-700/50 shadow-lg shadow-assist-green-500/10">
          <CardContent className="text-center py-12 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-assist-green-500/25">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">No Orphaned Users Found</h3>
              <p className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400 max-w-md mx-auto">
                All {stats.total_auth_users} auth users have corresponding records in the public.users table. Your system is healthy!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
