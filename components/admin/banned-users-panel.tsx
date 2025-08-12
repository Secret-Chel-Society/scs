"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, UserX, Clock, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BannedUser {
  id: string
  email: string
  gamer_tag?: string
  ban_reason: string
  ban_expiration: string | null
  created_at: string
}

export function BannedUsersPanel() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unbanning, setUnbanning] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBannedUsers = async () => {
    try {
      const response = await fetch("/api/admin/banned-users")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch banned users")
      }

      setBannedUsers(data.users || [])
    } catch (error: any) {
      console.error("Error fetching banned users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch banned users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnban = async (userId: string) => {
    setUnbanning(userId)

    try {
      const response = await fetch("/api/admin/unban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to unban user")
      }

      toast({
        title: "Success",
        description: "User has been unbanned successfully",
      })

      // Refresh the list
      fetchBannedUsers()
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }

  useEffect(() => {
    fetchBannedUsers()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Banned Users
          </CardTitle>
          <CardDescription>Manage banned users and their ban status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Banned Users ({bannedUsers.length})
        </CardTitle>
        <CardDescription>Manage banned users and their ban status</CardDescription>
      </CardHeader>
      <CardContent>
        {bannedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No banned users found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Ban Reason</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        {user.gamer_tag && <p className="text-sm text-muted-foreground">{user.gamer_tag}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{user.ban_reason}</p>
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={unbanning === user.id}>
                            {unbanning === user.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Unbanning...
                              </>
                            ) : (
                              "Unban"
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unban User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to unban {user.email}? This will immediately restore their access to
                              the platform.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnban(user.id)}>Unban User</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
