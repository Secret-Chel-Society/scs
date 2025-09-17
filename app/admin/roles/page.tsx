// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { ROLES, ROLE_LEVELS, hasAdminRole, UserRole } from "@/lib/role-utils"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Shield, 
  UserPlus, 
  UserMinus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react"

interface User {
  id: string
  email: string
  gamer_tag_id: string
  user_roles: UserRole[]
}

const RolesPage = () => {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  
  // State
  const [users, setUsers] = useState<User[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data: player } = await supabase
        .from('players')
        .select(`
          user_roles (
            id,
            role_id,
            roles (
              id,
              name,
              display_name,
              level,
              is_system_role
            )
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (player?.user_roles) {
        const adminCheck = hasAdminRole(player.user_roles)
        setIsAdmin(adminCheck)
        
        if (!adminCheck) {
          setError('You do not have permission to manage roles. Admin access required.')
          return
        }
      }

      await Promise.all([
        loadUsers(),
        loadUserRoles()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          gamer_tag_id,
          user_roles (
            id,
            role_id,
            roles (
              id,
              name,
              display_name,
              level,
              is_system_role
            )
          )
        `)
        .order('gamer_tag_id')

      if (error) throw error
      setUsers(users || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      })
    }
  }

  const loadUserRoles = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role_id,
          roles (
            id,
            name,
            display_name,
            level,
            is_system_role
          )
        `)

      if (error) throw error
      setUserRoles(roles || [])
    } catch (error) {
      console.error('Error loading user roles:', error)
    }
  }

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) return

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role_id: selectedRole
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Role assigned successfully",
      })

      setSelectedUser(null)
      setSelectedRole('')
      await loadUsers()
    } catch (error) {
      console.error('Error assigning role:', error)
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive"
      })
    }
  }

  const removeRole = async (userRoleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Role removed successfully",
      })

      await loadUsers()
    } catch (error) {
      console.error('Error removing role:', error)
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive"
      })
    }
  }

  const getRoleDisplayName = (userRoles: UserRole[]) => {
    if (!userRoles || userRoles.length === 0) return 'User'
    
    const highestRole = userRoles.reduce((highest, current) => {
      if (!current.roles) return highest
      if (!highest || current.roles.level > highest.level) {
        return current.roles
      }
      return highest
    }, null as any)
    
    return highestRole?.display_name || 'User'
  }

  const getRoleColor = (level: number) => {
    if (level >= 90) return 'bg-red-100 text-red-800'
    if (level >= 70) return 'bg-purple-100 text-purple-800'
    if (level >= 50) return 'bg-blue-100 text-blue-800'
    if (level >= 30) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || "You do not have permission to access this page"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={loadInitialData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Assign Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Role
          </CardTitle>
          <CardDescription>
            Assign a role to a user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="user-select">User</Label>
              <Select value={selectedUser?.id || ''} onValueChange={(value) => {
                const user = users.find(u => u.id === value)
                setSelectedUser(user || null)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.gamer_tag_id} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="role-select">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ROLES).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} (Level {role.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={assignRole} 
                disabled={!selectedUser || !selectedRole}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users and Roles
          </CardTitle>
          <CardDescription>
            Current user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold">{user.gamer_tag_id}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(
                            user.user_roles?.reduce((max, role) => 
                              Math.max(max, role.roles?.level || 0), 0
                            ) || 0
                          )}>
                            {getRoleDisplayName(user.user_roles || [])}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {user.user_roles?.map((userRole) => (
                          <div key={userRole.id} className="flex items-center gap-2">
                            <Badge variant="outline">
                              {userRole.roles?.display_name}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeRole(userRole.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Reference
          </CardTitle>
          <CardDescription>
            Available roles and their permission levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(ROLES).map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{role.name}</h4>
                  <p className="text-sm text-muted-foreground">Level {role.level}</p>
                </div>
                <Badge className={getRoleColor(role.level)}>
                  {role.level >= 90 ? 'Admin' : 
                   role.level >= 70 ? 'Management' : 
                   role.level >= 50 ? 'Staff' : 
                   role.level >= 30 ? 'Team' : 'User'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RolesPage
