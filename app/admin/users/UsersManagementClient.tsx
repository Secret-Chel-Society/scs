"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion } from "framer-motion"
import {
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  RefreshCcw,
  Key,
  UserCog,
  Stethoscope,
  DollarSign,
  Search,
  X,
  Download,
  Shield,
  Target,
  TrendingUp,
  Settings,
} from "lucide-react"

// Define valid player roles - these must match the database constraint
const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner"]

// Update the roles array to match the database constraint
// Replace the existing roles array with this one
const roles = [
  { label: "Player", value: "Player" },
  { label: "GM", value: "GM" },
  { label: "AGM", value: "AGM" },
  { label: "Owner", value: "Owner" },
  { label: "Admin", value: "Admin" },
]

const positions = [
  { label: "Center", value: "Center" },
  { label: "Left Wing", value: "Left Wing" },
  { label: "Right Wing", value: "Right Wing" },
  { label: "Left Defense", value: "Left Defense" },
  { label: "Right Defense", value: "Right Defense" },
  { label: "Goalie", value: "Goalie" },
]

const positionAbbreviations = {
  "Left Wing": "LW",
  Center: "C",
  "Right Wing": "RW",
  "Left Defense": "LD",
  "Right Defense": "RD",
  Goalie: "G",
}

const positionColors = {
  LW: "text-green-600 font-medium",
  C: "text-red-600 font-medium",
  RW: "text-blue-600 font-medium",
  LD: "text-cyan-600 font-medium",
  RD: "text-yellow-600 font-medium",
  G: "text-purple-600 font-medium",
}

const consoles = [
  { label: "Xbox", value: "Xbox" },
  { label: "PS5", value: "PS5" },
]

const userRoleSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(z.string()).min(1, "Select at least one role"),
})

const newUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  gamer_tag_id: z.string().min(3, "Gamer tag must be at least 3 characters"),
  primary_position: z.string().min(1, "Please select a primary position"),
  secondary_position: z.string().optional(),
  console: z.string().min(1, "Please select a console"),
})

type NewUserFormData = z.infer<typeof newUserSchema>

interface User {
  id: string
  email: string
  gamer_tag_id: string
  primary_position: string
  secondary_position: string | null
  console: string
  created_at: string
  updated_at: string
  is_banned: boolean
  ban_reason: string | null
  ban_expires_at: string | null
  roles: string[]
  team_id: string | null
  team_name: string | null
}

interface UserRole {
  id: string
  user_id: string
  role: string
  created_at: string
}

interface Team {
  id: string
  name: string
  logo_url: string | null
}

export default function UsersManagementClient() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showNewUserDialog, setShowNewUserDialog] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [newUserForm, setNewUserForm] = useState<NewUserFormData>({
    email: "",
    gamer_tag_id: "",
    primary_position: "",
    secondary_position: "",
    console: "",
  })

  const form = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: newUserForm,
  })

  // ... existing code ...

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-xl">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                User Management
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Manage user accounts, assign roles, and control access in the Secret Chel Society
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mt-6" />
          </div>

          {renderButtonsSection()}

          {/* Enhanced Search Bar */}
          <div className="relative mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search by gamer tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm rounded-xl"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70 hover:text-white"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center text-sm text-white/70"
              >
                Found {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} matching "{searchQuery}"
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </motion.p>
            )}
          </div>

          {/* Enhanced Status Alerts */}
          {autoRefresh && lastRefreshTime && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-500/30">
                <span className="inline-block w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-green-300 font-medium">
                  Auto-refresh active. Last refresh: {lastRefreshTime.toLocaleTimeString()}. Next refresh in{" "}
                  {nextRefreshCountdown} seconds.
                </span>
              </div>
            </motion.div>
          )}

          {showMigrationAlert && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="bg-amber-500/10 backdrop-blur-sm border-amber-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-300 text-lg mb-2">Database Update Required</h3>
                      <p className="text-amber-200 mb-4">
                        The user activation feature requires a database update. Please run the SQL below in the Supabase SQL
                        Editor.
                      </p>
                      <div className="space-y-3">
                        <div className="text-amber-200">
                          <p className="font-medium mb-2">SQL Migration:</p>
                          <pre className="bg-amber-500/20 p-3 rounded-lg overflow-x-auto text-sm border border-amber-500/30">
                            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
                            <br />
                            UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
                          </pre>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-400/50 text-amber-300 hover:bg-amber-500/20"
                            onClick={checkColumnAfterMigration}
                            disabled={submitting}
                          >
                            <RefreshCw className={`mr-2 h-4 w-4 ${submitting ? "animate-spin" : ""}`} />
                            {submitting ? "Checking..." : "I've run the migration, check again"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {showDiscordAlert && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="bg-blue-500/10 backdrop-blur-sm border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-300 text-lg mb-2">Discord Integration Not Set Up</h3>
                      <p className="text-blue-200 mb-4">
                        Discord role synchronization is not available because the Discord integration tables don't exist.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                        asChild
                      >
                        <Link href="/admin/scs-bot">Set Up Discord Integration</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Main Card */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/20 pb-6">
              <div>
                <CardTitle className="text-2xl text-white">Users</CardTitle>
                <CardDescription className="text-white/70">Manage user accounts and assign roles</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
                      {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-16 bg-white/10" />
                <Skeleton className="w-full h-16 bg-white/10" />
                <Skeleton className="w-full h-16 bg-white/10" />
                <Skeleton className="w-full h-16 bg-white/10" />
                <Skeleton className="w-full h-16 bg-white/10" />
              </div>
            ) : (
              <>
                {/* Enhanced Pagination Info */}
                {!loading && filteredUsers.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-white/20">
                    <p className="text-sm text-white/70">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}{" "}
                      users
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="border-white/30 text-white hover:bg-white/10"
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Gamer Tag</TableHead>
                      <TableHead className="text-center">Position</TableHead>
                      <TableHead className="text-center">Console</TableHead>
                      <TableHead className="text-center">Roles</TableHead>
                      <TableHead className="text-center">Team</TableHead>
                      <TableHead className="text-center">Salary</TableHead>
                      {isActiveColumnExists && <TableHead className="text-center">Status</TableHead>}
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isActiveColumnExists ? 9 : 8}
                          className="text-center py-4 text-muted-foreground"
                        >
                          {searchQuery ? "No users found matching your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => {
                        const playerRole = user.players && user.players.length > 0 ? user.players[0].role : null
                        const teamName =
                          user.players && user.players.length > 0 && user.players[0].teams
                            ? user.players[0].teams.name
                            : null
                        const salary = user.players && user.players.length > 0 ? user.players[0].salary || 0 : 0

                        //
                        // Get all roles (player role + user_roles)
                        const allRoles = []
                        if (playerRole) allRoles.push(playerRole)
                        if (user.user_roles) {
                          user.user_roles.forEach((roleObj: any) => {
                            if (!allRoles.includes(roleObj.role)) {
                              allRoles.push(roleObj.role)
                            }
                          })
                        }

                        return (
                          <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.gamer_tag_id}</TableCell>
                            <TableCell className="text-center">
                              {user.primary_position && (
                                <span className={positionColors[positionAbbreviations[user.primary_position] || ""]}>
                                  {positionAbbreviations[user.primary_position] || user.primary_position}
                                </span>
                              )}
                              {user.secondary_position && (
                                <>
                                  {" / "}
                                  <span
                                    className={positionColors[positionAbbreviations[user.secondary_position] || ""]}
                                  >
                                    {positionAbbreviations[user.secondary_position] || user.secondary_position}
                                  </span>
                                </>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{user.console}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {allRoles.map((role: string) => (
                                  <Badge key={role} variant="outline" className="w-fit">
                                    {role}
                                  </Badge>
                                ))}
                                {allRoles.length === 0 && <span className="text-muted-foreground">-</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {user.players &&
                              user.players.length > 0 &&
                              user.players[0].team_id &&
                              user.players[0].teams ? (
                                <span>{user.players[0].teams.name}</span>
                              ) : (
                                <span className="text-muted-foreground">Free Agent</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">${salary.toLocaleString()}</TableCell>
                            {isActiveColumnExists && (
                              <TableCell className="text-center">
                                {user.is_active ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-center">
                              <div className="flex flex-wrap justify-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openRoleDialog(user)}>
                                  Manage Roles
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 bg-transparent"
                                  onClick={() => openPositionDialog(user)}
                                >
                                  <UserCog className="mr-1 h-3 w-3" />
                                  Update Positions
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 bg-transparent"
                                  onClick={() => openTeamAssignDialog(user)}
                                  disabled={submitting}
                                >
                                  <Users className="mr-1 h-3 w-3" />
                                  {submitting ? "Loading..." : "Assign Team"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50 text-yellow-600 bg-transparent"
                                  onClick={() => openSalaryDialog(user)}
                                >
                                  <DollarSign className="mr-1 h-3 w-3" />
                                  Set Salary
                                </Button>
                                {isActiveColumnExists &&
                                  (user.is_active ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 bg-transparent"
                                      onClick={() => toggleUserActivation(user.id, false)}
                                    >
                                      Deactivate
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 bg-transparent"
                                      onClick={() => toggleUserActivation(user.id, true)}
                                    >
                                      Activate
                                    </Button>
                                  ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Bottom Pagination Controls */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Roles Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              {selectedUserForRole && `Assign roles to ${selectedUserForRole.gamer_tag_id || selectedUserForRole.email}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <div className="text-sm font-medium mb-2">Roles</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Select one or more roles for this user. The first role will be the primary player role.
                </div>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.value} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        id={`role-${role.value}`}
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={(checked) => handleRoleToggle(role.value, checked === true)}
                      />
                      <label
                        htmlFor={`role-${role.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedRoles.length === 0 && (
                  <p className="text-sm font-medium text-destructive mt-2">Select at least one role</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting || selectedRoles.length === 0}>
                  {submitting ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PositionUpdateDialog
        open={positionDialogOpen}
        onOpenChange={setPositionDialogOpen}
        user={selectedUser}
        onSubmit={onUpdatePositions}
        submitting={submitting}
      />

      {/* Set Salary Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Player Salary</DialogTitle>
            <DialogDescription>
              {selectedUser && `Set salary for ${selectedUser.gamer_tag_id || selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...salaryForm}>
            <form onSubmit={salaryForm.handleSubmit(onUpdateSalary)} className="space-y-6">
              <FormField
                control={salaryForm.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="salary-amount">Salary Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        id="salary-amount"
                        type="number"
                        min="0"
                        max="15000000"
                        step="100000"
                        placeholder="Enter salary amount"
                        disabled={submitting}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Enter the player's salary amount (max $15,000,000)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Update Salary"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Team Assignment Dialog */}
      <Dialog open={teamAssignDialogOpen} onOpenChange={handleTeamAssignDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Team</DialogTitle>
            <DialogDescription>
              {selectedUser && `Assign ${selectedUser.gamer_tag_id || selectedUser.email} to a team`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="team-select" className="text-sm font-medium">
                Team
              </label>
              <Select
                value={teamAssignmentForm.getValues().teamId?.toString() || "none"}
                onValueChange={(value) => {
                  const newValue = value === "none" ? null : value
                  teamAssignmentForm.setValue("teamId", newValue)
                }}
                disabled={submitting}
              >
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Free Agent (No Team)</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select a team for this player or choose "Free Agent" to remove them from any team and prevent automatic
                re-assignment.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => teamAssignmentForm.handleSubmit(onAssignTeam)()} disabled={submitting}>
                {submitting ? "Saving..." : "Assign Team"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New User Dialog */}
      <Dialog open={showNewUserDialog} onOpenChange={handleNewUserDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account and assign roles</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gamer_tag_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gamer Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="GamerTag123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primary_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Position</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={(value) => {
                          form.setValue("primary_position", value)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positions.map((position) => (
                            <SelectItem key={position.value} value={position.value}>
                              {position.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Position (Optional)</FormLabel>
                      <Select
                        defaultValue={field.value || "none"}
                        onValueChange={(value) => {
                          form.setValue("secondary_position", value === "none" ? undefined : value)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {positions.map((position) => (
                            <SelectItem key={position.value} value={position.value}>
                              {position.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="console"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Console</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(value) => {
                        form.setValue("console", value)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select console" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {consoles.map((console) => (
                          <SelectItem key={console.value} value={console.value}>
                            {console.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="text-sm font-medium mb-2">Roles</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Select one or more roles for this user. The first role will be the primary player role.
                </div>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.value} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        id={`new-role-${role.value}`}
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={(checked) => handleNewUserRoleToggle(role.value, checked === true)}
                      />
                      <label
                        htmlFor={`new-role-${role.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedRoles.length === 0 && (
                  <p className="text-sm font-medium text-destructive mt-2">Select at least one role</p>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting || selectedRoles.length === 0}>
                  {submitting ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Admin Key Dialog */}
      <Dialog open={adminKeyDialogOpen} onOpenChange={setAdminKeyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Verification Required</DialogTitle>
            <DialogDescription>
              Please enter your admin verification key to continue with this operation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="admin-key" className="text-sm font-medium">
                Admin Key
              </label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
              {adminKeyError && <p className="text-sm text-destructive">{adminKeyError}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-key"
                checked={saveAdminKey}
                onCheckedChange={(checked) => setSaveAdminKey(checked === true)}
              />
              <div className="grid gap-1.5">
                <label
                  htmlFor="save-key"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Save key for future operations
                </label>
                <p className="text-sm text-muted-foreground">
                  This will store the key in your browser for this session.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdminKeySubmit} disabled={!adminKey}>
              <Key className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </motion.div>
      </div>
    </div>
  )
}
