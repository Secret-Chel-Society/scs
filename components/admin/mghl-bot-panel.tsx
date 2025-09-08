"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSupabase } from "@/lib/supabase/client"
import {
  Bot,
  Settings,
  Users,
  Twitch,
  Trash2,
  Save,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  UserX,
} from "lucide-react"

export default function MGHLBotPanel() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Bot Configuration
  const [botConfig, setBotConfig] = useState({
    guild_id: "",
    bot_token: "",
    registered_role_id: "",
  })

  // Teams and roles
  const [teams, setTeams] = useState<any[]>([])
  const [teamRoles, setTeamRoles] = useState<any[]>([])
  const [managementRoles, setManagementRoles] = useState<any[]>([])

  // Discord connections
  const [discordConnections, setDiscordConnections] = useState<any[]>([])
  const [unconnectedUsers, setUnconnectedUsers] = useState<any[]>([])
  const [twitchConnections, setTwitchConnections] = useState<any[]>([])

  // Live streams
  const [liveStreams, setLiveStreams] = useState<any[]>([])

  // Bot status
  const [botStatus, setBotStatus] = useState<any>(null)
  const [connectionStats, setConnectionStats] = useState({
    total_users: 0,
    connected_users: 0,
    unconnected_users: 0,
    recent_connections: 0,
  })

  // Sync results
  const [syncResults, setSyncResults] = useState<any>(null)

  useEffect(() => {
    loadData()
    checkBotStatus()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load bot configuration (handle multiple rows)
      try {
        const { data: configs, error: configError } = await supabase
          .from("discord_bot_config")
          .select("*")
          .order("created_at", { ascending: false })

        if (configError) {
          console.warn("Could not load bot config:", configError)
          // Set default configuration if none exists
          setBotConfig({
            guild_id: "1345946042281234442",
            bot_token: "MTQwNzk0NzQxNjA5NDkwMDI0NQ.GOikOI.tD5VoGJoLAj8Zcj9qNLc7SfYLM_tE752vJDMDc",
            registered_role_id: "1376351990354804848",
          })
        } else if (configs && configs.length > 0) {
          // Use the most recent config
          setBotConfig(configs[0])
          if (configs.length > 1) {
            console.warn(`Found ${configs.length} bot configs, using the most recent one`)
            toast({
              title: "Multiple bot configurations found",
              description: `Using the most recent configuration. Found ${configs.length} configs total.`,
              variant: "default",
            })
          }
        } else {
          // Set default configuration if none exists
          setBotConfig({
            guild_id: "1345946042281234442",
            bot_token: "MTQwNzk0NzQxNjA5NDkwMDI0NQ.GOikOI.tD5VoGJoLAj8Zcj9qNLc7SfYLM_tE752vJDMDc",
            registered_role_id: "1376351990354804848",
          })
        }
      } catch (configError) {
        console.warn("Could not load bot config:", configError)
        setBotConfig({
          guild_id: "1345946042281234442",
          bot_token: "MTQwNzk0NzQxNjA5NDkwMDI0NQ.GOikOI.tD5VoGJoLAj8Zcj9qNLc7SfYLM_tE752vJDMDc",
          registered_role_id: "1376351990354804848",
        })
      }

      // Load teams
      const { data: teamsData } = await supabase.from("teams").select("*").order("name")
      setTeams(teamsData || [])

      // Load team roles
      try {
        const { data: teamRolesData } = await supabase
          .from("discord_team_roles")
          .select("*, teams(name)")
          .order("created_at")
        setTeamRoles(teamRolesData || [])
      } catch (teamRolesError) {
        console.warn("Could not load team roles:", teamRolesError)
        setTeamRoles([])
      }

      // Load management roles
      try {
        const { data: managementRolesData } = await supabase
          .from("discord_management_roles")
          .select("*")
          .order("role_type")
        setManagementRoles(managementRolesData || [])
      } catch (managementRolesError) {
        console.warn("Could not load management roles:", managementRolesError)
        setManagementRoles([])
      }

      // Load Discord connections - Fix the query to properly get team assignments
      console.log("Loading Discord connections...")

      // First, get all users with Discord connections
      const { data: usersWithDiscord, error: usersError } = await supabase
        .from("users")
        .select(`
          id,
          gamer_tag_id, 
          email, 
          primary_position, 
          secondary_position, 
          console,
          created_at,
          is_active,
          discord_id
        `)
        .not("discord_id", "is", null)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("Error fetching users with Discord:", usersError)
        throw usersError
      }

      console.log(`Found ${usersWithDiscord?.length || 0} users with Discord connections`)

      // Also get users from discord_users table
      const { data: discordUsersData, error: discordUsersError } = await supabase
        .from("discord_users")
        .select(`
          *,
          users(
            id,
            gamer_tag_id, 
            email, 
            primary_position, 
            secondary_position, 
            console,
            created_at,
            is_active
          )
        `)
        .order("created_at", { ascending: false })

      if (discordUsersError) {
        console.warn("Could not load discord_users table:", discordUsersError)
      }

      // Combine all users with Discord connections
      const allDiscordUsers = new Map()

      // Add users with direct discord_id
      if (usersWithDiscord) {
        for (const user of usersWithDiscord) {
          allDiscordUsers.set(user.id, {
            id: user.id,
            user_id: user.id,
            discord_id: user.discord_id,
            discord_username: "Unknown", // Will be updated if found in discord_users
            discord_discriminator: "0000",
            created_at: user.created_at,
            users: user,
          })
        }
      }

      // Update with discord_users data
      if (discordUsersData) {
        for (const discordUser of discordUsersData) {
          if (discordUser.users) {
            const existingUser = allDiscordUsers.get(discordUser.users.id)
            if (existingUser) {
              // Update existing user with Discord info
              existingUser.discord_username = discordUser.discord_username || "Unknown"
              existingUser.discord_discriminator = discordUser.discord_discriminator || "0000"
              existingUser.created_at = discordUser.created_at
            } else {
              // Add new user from discord_users table
              allDiscordUsers.set(discordUser.users.id, {
                id: discordUser.id,
                user_id: discordUser.user_id,
                discord_id: discordUser.discord_id,
                discord_username: discordUser.discord_username || "Unknown",
                discord_discriminator: discordUser.discord_discriminator || "0000",
                created_at: discordUser.created_at,
                users: discordUser.users,
              })
            }
          }
        }
      }

      // Now get team assignments for all these users
      const userIds = Array.from(allDiscordUsers.keys())
      console.log(`Getting team assignments for ${userIds.length} users`)

      if (userIds.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select(`
            id,
            user_id,
            team_id,
            status,
            teams(
              id,
              name,
              discord_role_id
            )
          `)
          .in("user_id", userIds)
          .not("team_id", "is", null)

        if (playersError) {
          console.error("Error fetching player data:", playersError)
        } else {
          console.log(`Found ${playersData?.length || 0} player records with team assignments`)

          // Add team information to users
          if (playersData) {
            for (const player of playersData) {
              const user = allDiscordUsers.get(player.user_id)
              if (user && player.teams) {
                user.users.current_team = player.teams
                console.log(`User ${user.users.gamer_tag_id} assigned to team ${player.teams.name}`)
              }
            }
          }
        }
      }

      const finalDiscordConnections = Array.from(allDiscordUsers.values())
      console.log(`Final Discord connections: ${finalDiscordConnections.length}`)

      setDiscordConnections(finalDiscordConnections)

      // Load users WITHOUT Discord connections
      console.log("Loading users without Discord connections...")

      const { data: allActiveUsers, error: allUsersError } = await supabase
        .from("users")
        .select(`
          id,
          gamer_tag_id, 
          email, 
          primary_position, 
          secondary_position, 
          console,
          created_at,
          is_active,
          discord_id
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (allUsersError) {
        console.error("Error fetching all users:", allUsersError)
      } else {
        // Filter out users who have Discord connections
        const connectedUserIds = new Set(finalDiscordConnections.map((conn) => conn.user_id))
        const usersWithoutDiscord = (allActiveUsers || []).filter(
          (user) => !user.discord_id && !connectedUserIds.has(user.id),
        )

        console.log(`Found ${usersWithoutDiscord.length} users without Discord connections`)

        // Get team assignments for unconnected users
        const unconnectedUserIds = usersWithoutDiscord.map((user) => user.id)

        if (unconnectedUserIds.length > 0) {
          const { data: unconnectedPlayersData, error: unconnectedPlayersError } = await supabase
            .from("players")
            .select(`
              id,
              user_id,
              team_id,
              status,
              teams(
                id,
                name,
                discord_role_id
              )
            `)
            .in("user_id", unconnectedUserIds)
            .not("team_id", "is", null)

          if (!unconnectedPlayersError && unconnectedPlayersData) {
            // Add team information to unconnected users
            for (const player of unconnectedPlayersData) {
              const user = usersWithoutDiscord.find((u) => u.id === player.user_id)
              if (user && player.teams) {
                user.current_team = player.teams
              }
            }
          }
        }

        setUnconnectedUsers(usersWithoutDiscord)
      }

      // Calculate connection stats
      const { data: allUsers } = await supabase.from("users").select("id, created_at").eq("is_active", true)
      const totalUsers = allUsers?.length || 0
      const connectedUsers = finalDiscordConnections.length
      const unconnectedUsersCount = totalUsers - connectedUsers

      // Recent connections (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentConnections =
        finalDiscordConnections.filter((conn) => new Date(conn.created_at) > sevenDaysAgo).length || 0

      setConnectionStats({
        total_users: totalUsers,
        connected_users: connectedUsers,
        unconnected_users: unconnectedUsersCount,
        recent_connections: recentConnections,
      })

      // Load Twitch connections
      try {
        const { data: twitchData } = await supabase
          .from("twitch_users")
          .select("*, discord_users(discord_username, users(gamer_tag_id))")
          .order("created_at", { ascending: false })
        setTwitchConnections(twitchData || [])
      } catch (twitchError) {
        console.warn("Could not load Twitch connections:", twitchError)
        setTwitchConnections([])
      }

      // Skip live streams to avoid 400 error - table likely doesn't exist
      setLiveStreams([])
    } catch (error: any) {
      console.error("Error loading data:", error)
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkBotStatus = async () => {
    try {
      // Use our backend API instead of direct Discord API call
      const response = await fetch("/api/discord/check-bot-status")
      if (response.ok) {
        const status = await response.json()
        setBotStatus(status)
      }
    } catch (error) {
      console.error("Error checking bot status:", error)
    }
  }

  const saveBotConfig = async () => {
    try {
      setSaving(true)

      // First, check if we have multiple configs and clean them up
      const { data: existingConfigs } = await supabase
        .from("discord_bot_config")
        .select("id")
        .order("created_at", { ascending: false })

      if (existingConfigs && existingConfigs.length > 1) {
        // Delete all but the first (most recent) config
        const configsToDelete = existingConfigs.slice(1)
        for (const config of configsToDelete) {
          await supabase.from("discord_bot_config").delete().eq("id", config.id)
        }
        console.log(`Cleaned up ${configsToDelete.length} duplicate bot configs`)
      }

      // Now upsert the configuration
      const { error } = await supabase.from("discord_bot_config").upsert(botConfig)

      if (error) throw error

      toast({
        title: "Configuration saved",
        description: "Bot configuration has been updated successfully.",
      })
    } catch (error: any) {
      console.error("Error saving config:", error)
      toast({
        title: "Error saving configuration",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addTeamRole = async (teamId: string, roleId: string, roleName: string) => {
    try {
      const { error } = await supabase.from("discord_team_roles").insert({
        team_id: teamId,
        discord_role_id: roleId,
        role_name: roleName,
      })

      if (error) throw error

      toast({
        title: "Team role added",
        description: "Discord role has been mapped to the team.",
      })

      loadData()
    } catch (error: any) {
      console.error("Error adding team role:", error)
      toast({
        title: "Error adding team role",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const removeTeamRole = async (id: string) => {
    try {
      const { error } = await supabase.from("discord_team_roles").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Team role removed",
        description: "Discord role mapping has been removed.",
      })

      loadData()
    } catch (error: any) {
      console.error("Error removing team role:", error)
      toast({
        title: "Error removing team role",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const syncAllRoles = async () => {
    try {
      setSyncing(true)
      setSyncResults(null)

      console.log("Starting Discord role sync...")

      const response = await fetch("/api/discord/sync-all-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync roles")
      }

      setSyncResults(data.results)

      toast({
        title: "Roles synced",
        description: `Successfully synced ${data.results.successful} users, ${data.results.failed} failed.`,
      })

      // Reload data to show updated information
      await loadData()
    } catch (error: any) {
      console.error("Error syncing roles:", error)
      toast({
        title: "Error syncing roles",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const testConnection = async () => {
    try {
      setTesting(true)

      // Use our backend API instead of direct Discord API call
      const response = await fetch("/api/discord/test-bot-connection", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Connection test failed")
      }

      toast({
        title: "Connection successful",
        description: `Connected to Discord server: ${data.results.guild.name}`,
      })

      setBotStatus(data.results)
    } catch (error: any) {
      console.error("Error testing connection:", error)
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const removeDiscordConnection = async (userId: string, discordUsername: string) => {
    try {
      const { error } = await supabase.from("discord_users").delete().eq("user_id", userId)

      if (error) throw error

      // Also clear discord_id from users table
      await supabase.from("users").update({ discord_id: null }).eq("id", userId)

      toast({
        title: "Discord connection removed",
        description: `Removed Discord connection for ${discordUsername}`,
      })

      loadData()
    } catch (error: any) {
      console.error("Error removing Discord connection:", error)
      toast({
        title: "Error removing connection",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getConnectionSource = (connection: any) => {
    // Check if this was connected during registration (within 5 minutes of user creation)
    if (connection.users?.created_at) {
      const userCreated = new Date(connection.users.created_at)
      const discordConnected = new Date(connection.created_at)
      const timeDiff = Math.abs(discordConnected.getTime() - userCreated.getTime())
      const minutesDiff = Math.ceil(timeDiff / (1000 * 60))

      if (minutesDiff <= 5) {
        return { source: "Registration", color: "bg-blue-100 text-blue-800 border-blue-200" }
      }
    }
    return { source: "Settings", color: "bg-green-100 text-green-800 border-green-200" }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8" />
        <h1 className="text-3xl font-bold">MGHL Bot Management</h1>
        {botStatus && botStatus.connected && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Bot Online
          </Badge>
        )}
        {botStatus && botStatus.config?.configCount > 1 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {botStatus.config.configCount} Configs
          </Badge>
        )}
      </div>

      {/* Connection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{connectionStats.total_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Discord Connected</p>
                <p className="text-2xl font-bold">{connectionStats.connected_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Not Connected</p>
                <p className="text-2xl font-bold">{connectionStats.unconnected_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Recent (7 days)</p>
                <p className="text-2xl font-bold">{connectionStats.recent_connections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Connection Rate</p>
                <p className="text-2xl font-bold">
                  {connectionStats.total_users > 0
                    ? Math.round((connectionStats.connected_users / connectionStats.total_users) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Results */}
      {syncResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Last Sync Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{syncResults.successful}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{syncResults.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{syncResults.processed}</p>
                <p className="text-sm text-muted-foreground">Total Processed</p>
              </div>
            </div>

            {syncResults.successfulUsers && syncResults.successfulUsers.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-green-700 mb-2">Successfully Synced Users:</h4>
                <div className="flex flex-wrap gap-1">
                  {syncResults.successfulUsers.map((user: string) => (
                    <Badge key={user} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {user}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {syncResults.errors && syncResults.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                <div className="space-y-2">
                  {syncResults.errors.slice(0, 5).map((error: any, index: number) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="font-medium text-red-800">{error.user}</p>
                      <p className="text-sm text-red-600">{error.error}</p>
                    </div>
                  ))}
                  {syncResults.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground">... and {syncResults.errors.length - 5} more errors</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="discord" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="discord">Discord Users</TabsTrigger>
          <TabsTrigger value="unconnected">Unconnected Users</TabsTrigger>
          <TabsTrigger value="config">Bot Config</TabsTrigger>
          <TabsTrigger value="roles">Role Mapping</TabsTrigger>
          <TabsTrigger value="twitch">Twitch Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="discord" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Discord Connections ({discordConnections.length})
                  </CardTitle>
                  <CardDescription>Users who have connected their Discord accounts to MGHL Bot</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={syncAllRoles} disabled={syncing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync All Roles (15s delays)"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MGHL User</TableHead>
                    <TableHead>Discord User</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Console</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Connected Via</TableHead>
                    <TableHead>Connected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discordConnections.map((connection) => {
                    const sourceInfo = getConnectionSource(connection)
                    const team = connection.users?.current_team?.name || "Free Agent"
                    return (
                      <TableRow key={connection.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{connection.users?.gamer_tag_id || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{connection.users?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {connection.discord_username}#{connection.discord_discriminator}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{connection.discord_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {connection.users?.primary_position && (
                              <Badge variant="outline" className="text-xs">
                                {connection.users.primary_position}
                              </Badge>
                            )}
                            {connection.users?.secondary_position && (
                              <Badge variant="secondary" className="text-xs">
                                {connection.users.secondary_position}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {connection.users?.console && <Badge variant="outline">{connection.users.console}</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={team === "Free Agent" ? "text-muted-foreground" : ""}>
                            {team}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sourceInfo.color}>
                            {sourceInfo.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(connection.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(connection.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeDiscordConnection(connection.user_id, connection.discord_username)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {discordConnections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No Discord connections found</p>
                  <p className="text-sm">Users can connect their Discord accounts during registration or in settings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unconnected" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Unconnected Users ({unconnectedUsers.length})
                  </CardTitle>
                  <CardDescription>Active users who have not connected their Discord accounts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MGHL User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Console</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unconnectedUsers.map((user) => {
                    const team = user.current_team?.name || "Free Agent"
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.gamer_tag_id || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.primary_position && (
                              <Badge variant="outline" className="text-xs">
                                {user.primary_position}
                              </Badge>
                            )}
                            {user.secondary_position && (
                              <Badge variant="secondary" className="text-xs">
                                {user.secondary_position}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.console && <Badge variant="outline">{user.console}</Badge>}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={team === "Free Agent" ? "text-muted-foreground" : ""}>
                            {team}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(user.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <UserX className="mr-1 h-3 w-3" />
                            Not Connected
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {unconnectedUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All active users have Discord connections!</p>
                  <p className="text-sm">Great job on Discord adoption</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Bot Configuration
              </CardTitle>
              <CardDescription>Configure the Discord bot settings and authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guild_id">Discord Server ID</Label>
                  <Input
                    id="guild_id"
                    value={botConfig.guild_id}
                    onChange={(e) => setBotConfig({ ...botConfig, guild_id: e.target.value })}
                    placeholder="Enter Discord server ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registered_role_id">Registered Role ID</Label>
                  <Input
                    id="registered_role_id"
                    value={botConfig.registered_role_id}
                    onChange={(e) => setBotConfig({ ...botConfig, registered_role_id: e.target.value })}
                    placeholder="Enter registered role ID"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot_token">Bot Token</Label>
                <Input
                  id="bot_token"
                  type="password"
                  value={botConfig.bot_token}
                  onChange={(e) => setBotConfig({ ...botConfig, bot_token: e.target.value })}
                  placeholder="Enter bot token"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveBotConfig} disabled={saving}>
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={testConnection} disabled={testing}>
                  {testing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
                <Button variant="outline" onClick={syncAllRoles} disabled={syncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync All Roles"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OAuth Configuration</CardTitle>
              <CardDescription>Discord OAuth settings for user authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client ID</Label>
                  <div className="flex items-center gap-2">
                    <Input value="1086490070984429638" disabled />
                    <Badge variant="secondary">Configured</Badge>
                  </div>
                </div>
                <div>
                  <Label>Client Secret</Label>
                  <div className="flex items-center gap-2">
                    <Input value="QmI3KS7RYyvzy6dZLKmFVwgLhmuGJVs_" type="password" disabled />
                    <Badge variant="secondary">Configured</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {botStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Bot Status</CardTitle>
                <CardDescription>Current status of the MGHL Discord bot.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Server Name</Label>
                    <Input value={botStatus.guild?.name || "Unknown"} disabled />
                  </div>
                  <div>
                    <Label>Member Count</Label>
                    <Input value={botStatus.guild?.memberCount || "Unknown"} disabled />
                  </div>
                  <div>
                    <Label>Bot Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Online
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Role Mapping</CardTitle>
              <CardDescription>Map Discord roles to MGHL teams.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Discord Role</TableHead>
                    <TableHead>Role ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{role.teams?.name}</TableCell>
                      <TableCell>{role.role_name}</TableCell>
                      <TableCell className="font-mono text-sm">{role.discord_role_id}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => removeTeamRole(role.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Management Role Mapping</CardTitle>
              <CardDescription>Map Discord roles to management positions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Discord Role</TableHead>
                    <TableHead>Role ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managementRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Badge variant="outline">{role.role_type}</Badge>
                      </TableCell>
                      <TableCell>{role.role_name}</TableCell>
                      <TableCell className="font-mono text-sm">{role.discord_role_id}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twitch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitch className="h-5 w-5" />
                Twitch Connections ({twitchConnections.length})
              </CardTitle>
              <CardDescription>Users who have connected their Twitch accounts for streaming.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MGHL User</TableHead>
                    <TableHead>Twitch Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {twitchConnections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell>{connection.discord_users?.users?.gamer_tag_id}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        {connection.twitch_username}
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://twitch.tv/${connection.twitch_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {connection.is_live ? (
                          <Badge variant="destructive">
                            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(connection.last_checked).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
