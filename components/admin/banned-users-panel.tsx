"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, UserX, Clock, AlertCircle, UserCheck, Shield, Database, Calendar } from "lucide-react"
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
import { motion } from "framer-motion"

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserX className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <UserX className="h-6 w-6" />
                  Banned Users
                </CardTitle>
                <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">Manage banned users and their ban status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-ice-blue-600 dark:text-ice-blue-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserX className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <UserX className="h-6 w-6" />
                Banned Users ({bannedUsers.length})
              </CardTitle>
              <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">Manage banned users and their ban status</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {bannedUsers.length === 0 ? (
            <div className="text-center py-8 text-hockey-silver-500 dark:text-hockey-silver-500">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No banned users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-hidden shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 hover:from-ice-blue-100 dark:hover:from-ice-blue-800/30 hover:to-rink-blue-100 dark:hover:to-rink-blue-800/30 transition-all duration-300">
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">User</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Ban Reason</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Expiration</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bannedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-100/50 dark:border-rink-blue-800/50">
                        <TableCell>
                          <div className="space-y-2">
                            <p className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{user.email}</p>
                            {user.gamer_tag && <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{user.gamer_tag}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{user.ban_reason}</p>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
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
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
                              <AlertDialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
                                <AlertDialogTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                                  <UserCheck className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                                  Unban User
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base text-hockey-silver-600 dark:text-hockey-silver-400">
                                  Are you sure you want to unban {user.email}? This will immediately restore their access to
                                  the platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                                <AlertDialogCancel className="hockey-button bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 dark:hover:to-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 transition-all duration-300 hover:scale-105">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleUnban(user.id)}
                                  className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-assist-green-300 dark:border-assist-green-600"
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Unban User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
