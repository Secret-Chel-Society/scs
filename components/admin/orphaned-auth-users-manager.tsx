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
import { Search, Trash2, Plus, AlertTriangle, CheckCircle } from "lucide-react"

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Orphaned Auth Users Manager
          </CardTitle>
          <CardDescription>
            Find and fix users that exist in Supabase Auth but not in the public.users table. These are typically from
            the old auth system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-key">Admin Key</Label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
          </div>
          <Button onClick={findOrphanedUsers} disabled={loading} className="w-full">
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Searching..." : "Find Orphaned Users"}
          </Button>
          <Button onClick={testConnection} variant="outline" className="w-full">
            Test API Connection
          </Button>
        </CardContent>
      </Card>

      {stats.orphaned_count > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Found {stats.orphaned_count} orphaned users</strong> out of {stats.total_auth_users} total auth
            users. These users exist in Supabase Auth but not in the public.users table, which can cause "already
            registered" errors.
          </AlertDescription>
        </Alert>
      )}

      {orphanedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orphaned Users ({orphanedUsers.length})</CardTitle>
            <CardDescription>Users that exist in Supabase Auth but not in the public.users table</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Email Confirmed</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orphanedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-muted-foreground font-mono">{user.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(user.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.email_confirmed_at ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Confirmed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Not Confirmed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at ? (
                        <div className="text-sm">{new Date(user.last_sign_in_at).toLocaleDateString()}</div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.user_metadata?.gamer_tag_id && (
                          <Badge variant="secondary" className="text-xs">
                            {user.user_metadata.gamer_tag_id}
                          </Badge>
                        )}
                        {user.user_metadata?.console && (
                          <Badge variant="outline" className="text-xs">
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
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Fix
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => fixOrphanedUser(user.id, "delete_auth_user", "Delete Auth User")}
                          disabled={fixing === user.id}
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
          </CardContent>
        </Card>
      )}

      {orphanedUsers.length === 0 && stats.total_auth_users > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">No Orphaned Users Found</h3>
            <p className="text-muted-foreground">
              All {stats.total_auth_users} auth users have corresponding records in the public.users table.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
