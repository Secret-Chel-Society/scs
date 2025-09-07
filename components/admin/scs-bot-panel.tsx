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
  Shield,
  Zap,
  Target,
  Database,
  Activity,
  TrendingUp,
  Globe,
  Wifi,
  WifiOff,
} from "lucide-react"

export default function SCSBotPanel() {
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
            bot_token: "MTM2NTg4ODY2MDE3MTY1MzE1MA.G9DxJ3.QzAkopXtoHjPTjMo7gf1-MYaOmmVbk5K2Ca3Wc",
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
            bot_token: "MTM2NTg4ODY2MDE3MTY1MzE1MA.G9DxJ3.QzAkopXtoHjPTjMo7gf1-MYaOmmVbk5K2Ca3Wc",
            registered_role_id: "1376351990354804848",
          })
        }
      } catch (configError) {
        console.warn("Could not load bot config:", configError)
        setBotConfig({
          guild_id: "1345946042281234442",
          bot_token: "MTM2NTg4ODY2MDE3MTY1MzE1MA.G9DxJ3.QzAkopXtoHjPTjMo7gf1-MYaOmmVbk5K2Ca3Wc",
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="p-4 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
            <RefreshCw className="h-8 w-8 text-white animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Loading SCS Bot Management</h3>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Connecting to Discord and gathering data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-2xl shadow-ice-blue-500/30">
              <Bot className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h1 className="hockey-title mb-4">
            SCS Bot Management
          </h1>
          <p className="hockey-subtitle mb-8">
            Manage Discord bot integration, user connections, and role synchronization
          </p>
          
          {/* Bot Status Indicators */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {botStatus && botStatus.connected && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/50 dark:border-assist-green-700/50">
                <Wifi className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Bot Online</span>
              </div>
            )}
            {botStatus && botStatus.config?.configCount > 1 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-4 py-2 rounded-full border border-goal-red-200/50 dark:border-goal-red-700/50">
                <AlertTriangle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{botStatus.config.configCount} Configs</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Users className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{connectionStats.connected_users} Connected</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <Activity className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Real-time Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12">

        {/* Enhanced Connection Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-xl">
                  <Users className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{connectionStats.total_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-assist-green-500/20 to-assist-green-500/20 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-assist-green-600 dark:text-assist-green-400" />
                </div>
                <div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Discord Connected</p>
                  <p className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{connectionStats.connected_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hockey-card hockey-card-hover border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-goal-red-500/20 to-goal-red-500/20 rounded-xl">
                  <UserX className="h-6 w-6 text-goal-red-600 dark:text-goal-red-400" />
                </div>
                <div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Not Connected</p>
                  <p className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{connectionStats.unconnected_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hockey-card hockey-card-hover border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500/20 to-rink-blue-500/20 rounded-xl">
                  <UserPlus className="h-6 w-6 text-rink-blue-600 dark:text-rink-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Recent (7 days)</p>
                  <p className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{connectionStats.recent_connections}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hockey-card hockey-card-hover border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-hockey-silver-600 dark:text-hockey-silver-400" />
                </div>
                <div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Connection Rate</p>
                  <p className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
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

        {/* Enhanced Sync Results */}
        {syncResults && (
          <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
            <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-white" />
                </div>
                Last Sync Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-xl border border-assist-green-200/30 dark:border-assist-green-700/30">
                  <p className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300">{syncResults.successful}</p>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Successful</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-goal-red-100/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 rounded-xl border border-goal-red-200/30 dark:border-goal-red-700/30">
                  <p className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300">{syncResults.failed}</p>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Failed</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <p className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300">{syncResults.processed}</p>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Total Processed</p>
                </div>
              </div>

              {syncResults.successfulUsers && syncResults.successfulUsers.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-assist-green-700 dark:text-assist-green-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Successfully Synced Users:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {syncResults.successfulUsers.map((user: string) => (
                      <Badge key={user} variant="outline" className="bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">
                        {user}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {syncResults.errors && syncResults.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-goal-red-700 dark:text-goal-red-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Errors:
                  </h4>
                  <div className="space-y-3">
                    {syncResults.errors.slice(0, 5).map((error: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-goal-red-100/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 border border-goal-red-200/30 dark:border-goal-red-700/30 rounded-lg p-3">
                        <p className="font-medium text-goal-red-800 dark:text-goal-red-200">{error.user}</p>
                        <p className="text-sm text-goal-red-600 dark:text-goal-red-400">{error.error}</p>
                      </div>
                    ))}
                    {syncResults.errors.length > 5 && (
                      <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">... and {syncResults.errors.length - 5} more errors</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="discord" className="w-full">
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg rounded-xl p-2">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-10 bg-hockey-silver-800 dark:bg-hockey-silver-900 rounded-lg p-1">
              <TabsTrigger 
                value="discord" 
                className="text-sm font-medium px-3 py-1 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Discord Users</span>
                <span className="sm:hidden">Discord</span>
              </TabsTrigger>
              <TabsTrigger 
                value="unconnected" 
                className="text-sm font-medium px-3 py-1 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />
                <span className="hidden sm:inline">Unconnected Users</span>
                <span className="sm:hidden">Unconnected</span>
              </TabsTrigger>
              <TabsTrigger 
                value="config" 
                className="text-sm font-medium px-3 py-1 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Bot Config</span>
                <span className="sm:hidden">Config</span>
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="text-sm font-medium px-3 py-1 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden lg:inline">Role Mapping</span>
                <span className="lg:hidden">Roles</span>
              </TabsTrigger>
              <TabsTrigger 
                value="twitch" 
                className="text-sm font-medium px-3 py-1 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white flex items-center gap-2"
              >
                <Twitch className="h-4 w-4" />
                <span className="hidden lg:inline">Twitch Integration</span>
                <span className="lg:hidden">Twitch</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="discord" className="space-y-6">
            <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                      <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      Discord Connections ({discordConnections.length})
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Users who have connected their Discord accounts to SCS Bot</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadData}
                      className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={syncAllRoles} 
                      disabled={syncing}
                      className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                      {syncing ? "Syncing..." : "Sync All Roles (15s delays)"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 rounded-xl overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">SCS User</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Discord User</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Position</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Console</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Team</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Connected Via</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Connected</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discordConnections.map((connection) => {
                        const sourceInfo = getConnectionSource(connection)
                        const team = connection.users?.current_team?.name || "Free Agent"
                        return (
                          <TableRow 
                            key={connection.id}
                            className="hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30"
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{connection.users?.gamer_tag_id || "Unknown"}</div>
                                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{connection.users?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                                  {connection.discord_username}#{connection.discord_discriminator}
                                </div>
                                <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">{connection.discord_id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {connection.users?.primary_position && (
                                  <Badge variant="outline" className="text-xs border-ice-blue-300 dark:border-rink-blue-600 text-ice-blue-700 dark:text-rink-blue-300">
                                    {connection.users.primary_position}
                                  </Badge>
                                )}
                                {connection.users?.secondary_position && (
                                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-100 dark:from-hockey-silver-800 dark:to-hockey-silver-800 text-hockey-silver-700 dark:text-hockey-silver-300">
                                    {connection.users.secondary_position}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {connection.users?.console && (
                                <Badge variant="outline" className="border-rink-blue-300 dark:border-rink-blue-600 text-rink-blue-700 dark:text-rink-blue-300">
                                  {connection.users.console}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={team === "Free Agent" ? "text-hockey-silver-600 dark:text-hockey-silver-400 border-hockey-silver-300 dark:border-hockey-silver-600" : "border-assist-green-300 dark:border-assist-green-600 text-assist-green-700 dark:text-assist-green-300"}
                              >
                                {team}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={sourceInfo.source === "Registration" ? "bg-gradient-to-r from-ice-blue-100 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-900/20 text-ice-blue-700 dark:text-ice-blue-300 border-ice-blue-200 dark:border-ice-blue-700" : "bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700"}
                              >
                                {sourceInfo.source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-hockey-silver-800 dark:text-hockey-silver-200">{new Date(connection.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">
                                {new Date(connection.created_at).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">
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
                                  className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
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
                </div>
                {discordConnections.length === 0 && (
                  <div className="text-center py-12 text-hockey-silver-600 dark:text-hockey-silver-400">
                    <div className="p-4 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-ice-blue-600 dark:text-ice-blue-400" />
                    </div>
                    <p className="text-lg font-medium text-hockey-silver-800 dark:text-hockey-silver-200">No Discord connections found</p>
                    <p className="text-sm">Users can connect their Discord accounts during registration or in settings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unconnected" className="space-y-6">
            <Card className="hockey-card hockey-card-hover border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                      <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                        <UserX className="h-6 w-6 text-white" />
                      </div>
                      Unconnected Users ({unconnectedUsers.length})
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Active users who have not connected their Discord accounts</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadData}
                      className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 rounded-xl overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-goal-red-50/50 to-goal-red-50/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50">
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">SCS User</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Email</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Position</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Console</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Team</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Registered</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unconnectedUsers.map((user) => {
                        const team = user.current_team?.name || "Free Agent"
                        return (
                          <TableRow 
                            key={user.id}
                            className="hover:bg-gradient-to-r hover:from-goal-red-50/30 hover:to-goal-red-50/30 dark:hover:from-goal-red-900/10 dark:hover:to-goal-red-900/10 transition-all duration-300 border-b border-goal-red-200/30 dark:border-goal-red-700/30"
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{user.gamer_tag_id || "Unknown"}</div>
                                <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">ID: {user.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-hockey-silver-800 dark:text-hockey-silver-200">{user.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {user.primary_position && (
                                  <Badge variant="outline" className="text-xs border-ice-blue-300 dark:border-rink-blue-600 text-ice-blue-700 dark:text-rink-blue-300">
                                    {user.primary_position}
                                  </Badge>
                                )}
                                {user.secondary_position && (
                                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-100 dark:from-hockey-silver-800 dark:to-hockey-silver-800 text-hockey-silver-700 dark:text-hockey-silver-300">
                                    {user.secondary_position}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.console && (
                                <Badge variant="outline" className="border-rink-blue-300 dark:border-rink-blue-600 text-rink-blue-700 dark:text-rink-blue-300">
                                  {user.console}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={team === "Free Agent" ? "text-hockey-silver-600 dark:text-hockey-silver-400 border-hockey-silver-300 dark:border-hockey-silver-600" : "border-assist-green-300 dark:border-assist-green-600 text-assist-green-700 dark:text-assist-green-300"}
                              >
                                {team}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-hockey-silver-800 dark:text-hockey-silver-200">{new Date(user.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">
                                {new Date(user.created_at).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gradient-to-r from-goal-red-100 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-900/20 text-goal-red-700 dark:text-goal-red-300 border-goal-red-200 dark:border-goal-red-700">
                                <UserX className="mr-1 h-3 w-3" />
                                Not Connected
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {unconnectedUsers.length === 0 && (
                  <div className="text-center py-12 text-hockey-silver-600 dark:text-hockey-silver-400">
                    <div className="p-4 bg-gradient-to-r from-assist-green-500/20 to-assist-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-assist-green-600 dark:text-assist-green-400" />
                    </div>
                    <p className="text-lg font-medium text-hockey-silver-800 dark:text-hockey-silver-200">All active users have Discord connections!</p>
                    <p className="text-sm">Great job on Discord adoption</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card className="hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  Bot Configuration
                </CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Configure the Discord bot settings and authentication.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="guild_id" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                      Discord Server ID
                    </Label>
                    <Input
                      id="guild_id"
                      value={botConfig.guild_id}
                      onChange={(e) => setBotConfig({ ...botConfig, guild_id: e.target.value })}
                      placeholder="Enter Discord server ID"
                      className="hockey-search border-2 border-assist-green-200/50 dark:border-assist-green-700/50 focus:border-assist-green-500 dark:focus:border-assist-green-500 focus:ring-4 focus:ring-assist-green-500/20 dark:focus:ring-assist-green-500/20 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="registered_role_id" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                      Registered Role ID
                    </Label>
                    <Input
                      id="registered_role_id"
                      value={botConfig.registered_role_id}
                      onChange={(e) => setBotConfig({ ...botConfig, registered_role_id: e.target.value })}
                      placeholder="Enter registered role ID"
                      className="hockey-search border-2 border-assist-green-200/50 dark:border-assist-green-700/50 focus:border-assist-green-500 dark:focus:border-assist-green-500 focus:ring-4 focus:ring-assist-green-500/20 dark:focus:ring-assist-green-500/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="bot_token" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Bot Token
                  </Label>
                  <Input
                    id="bot_token"
                    type="password"
                    value={botConfig.bot_token}
                    onChange={(e) => setBotConfig({ ...botConfig, bot_token: e.target.value })}
                    placeholder="Enter bot token"
                    className="hockey-search border-2 border-assist-green-200/50 dark:border-assist-green-700/50 focus:border-assist-green-500 dark:focus:border-assist-green-500 focus:ring-4 focus:ring-assist-green-500/20 dark:focus:ring-assist-green-500/20 transition-all duration-300"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={saveBotConfig} 
                    disabled={saving}
                    className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Configuration
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={testConnection} 
                    disabled={testing}
                    className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={syncAllRoles} 
                    disabled={syncing}
                    className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync All Roles"}
                  </Button>
                </div>
              </CardContent>
          </Card>

            <Card className="hockey-card hockey-card-hover border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-rink-blue-200/50 dark:border-rink-blue-700/50 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  OAuth Configuration
                </CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Discord OAuth settings for user authentication.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                      Client ID
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        value="1365888660171653150" 
                        disabled 
                        className="hockey-search border-2 border-rink-blue-200/50 dark:border-rink-blue-700/50"
                      />
                      <Badge variant="secondary" className="bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">Configured</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                      Client Secret
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        value="mu3IdoBiG7zo4NDHYmGArCfMHoP4atbX" 
                        type="password" 
                        disabled 
                        className="hockey-search border-2 border-rink-blue-200/50 dark:border-rink-blue-700/50"
                      />
                      <Badge variant="secondary" className="bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">Configured</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {botStatus && (
              <Card className="hockey-card hockey-card-hover border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    Bot Status
                  </CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Current status of the SCS Discord bot.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2 mb-3">
                        <Globe className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                        Server Name
                      </Label>
                      <Input 
                        value={botStatus.guild?.name || "Unknown"} 
                        disabled 
                        className="hockey-search border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                        Member Count
                      </Label>
                      <Input 
                        value={botStatus.guild?.memberCount || "Unknown"} 
                        disabled 
                        className="hockey-search border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2 mb-3">
                        <Wifi className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                        Bot Status
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">
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
            <Card className="hockey-card hockey-card-hover border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-rink-blue-200/50 dark:border-rink-blue-700/50 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  Team Role Mapping
                </CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Map Discord roles to SCS teams.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 rounded-xl overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-rink-blue-50/50 to-rink-blue-50/50 dark:from-rink-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-rink-blue-200/50 dark:border-rink-blue-700/50">
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Team</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Discord Role</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Role ID</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamRoles.map((role) => (
                        <TableRow 
                          key={role.id}
                          className="hover:bg-gradient-to-r hover:from-rink-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-rink-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-rink-blue-200/30 dark:border-rink-blue-700/30"
                        >
                          <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">{role.teams?.name}</TableCell>
                          <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">{role.role_name}</TableCell>
                          <TableCell className="font-mono text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{role.discord_role_id}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removeTeamRole(role.id)}
                              className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="hockey-card hockey-card-hover border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Management Role Mapping
                </CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Map Discord roles to management positions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20 rounded-xl overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-50/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Position</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Discord Role</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Role ID</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {managementRoles.map((role) => (
                        <TableRow 
                          key={role.id}
                          className="hover:bg-gradient-to-r hover:from-hockey-silver-50/30 hover:to-hockey-silver-50/30 dark:hover:from-hockey-silver-900/10 dark:hover:to-hockey-silver-900/10 transition-all duration-300 border-b border-hockey-silver-200/30 dark:border-hockey-silver-700/30"
                        >
                          <TableCell>
                            <Badge variant="outline" className="border-ice-blue-300 dark:border-rink-blue-600 text-ice-blue-700 dark:text-rink-blue-300">{role.role_type}</Badge>
                          </TableCell>
                          <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">{role.role_name}</TableCell>
                          <TableCell className="font-mono text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{role.discord_role_id}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="twitch" className="space-y-6">
            <Card className="hockey-card hockey-card-hover border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                    <Twitch className="h-6 w-6 text-white" />
                  </div>
                  Twitch Connections ({twitchConnections.length})
                </CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Users who have connected their Twitch accounts for streaming.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20 rounded-xl overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-50/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">SCS User</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Twitch Username</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Last Checked</TableHead>
                        <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {twitchConnections.map((connection) => (
                        <TableRow 
                          key={connection.id}
                          className="hover:bg-gradient-to-r hover:from-hockey-silver-50/30 hover:to-hockey-silver-50/30 dark:hover:from-hockey-silver-900/10 dark:hover:to-hockey-silver-900/10 transition-all duration-300 border-b border-hockey-silver-200/30 dark:border-hockey-silver-700/30"
                        >
                          <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">{connection.discord_users?.users?.gamer_tag_id}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            <span className="text-hockey-silver-800 dark:text-hockey-silver-200">{connection.twitch_username}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild
                              className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
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
                              <Badge variant="destructive" className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0">
                                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                                Live
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-100 dark:from-hockey-silver-800 dark:to-hockey-silver-800 text-hockey-silver-700 dark:text-hockey-silver-300">Offline</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">{new Date(connection.last_checked).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
